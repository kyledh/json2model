interface GeneratorModelParms {
    jsonData: object;
    rootClassName: string;
    duplicate: string;
}

interface ModuleInfo {
    moduleName: string;
    moduleContent: object;
}

export default class Generator {
    model: string = '';
    objectStack = [] as any[];
    moduleMap = new Set();
    duplicateClasses = [] as any;

    generateModel(params: GeneratorModelParms) {
        let { jsonData, rootClassName } = params;
        if (jsonData) {
            this.objectStack = [{ moduleName: rootClassName, moduleContent: jsonData }];
            this.recordObjectClass(rootClassName);
        }
        this.deqeue();
        if (!this.model) {
            this.model = '';
        }
        const modelInfo = {
            model: this.model || '',
            duplicateClasses: this.duplicateClasses || []
        };
        return modelInfo;
    }

    deqeue() {
        while (this.objectStack.length > 0) {
            const moduleInfo = this.objectStack.shift() as ModuleInfo;
            this.model += this.generateModule(moduleInfo);
        }
    }

    generateModule(moduleInfo: ModuleInfo): string {
        const { moduleName, moduleContent = {} as any } = moduleInfo;
        if (moduleName && moduleContent) {
            let moduleString = 'export module ' + moduleName + ' {\n';
            let prefix = '\t';
            let interface_t = prefix + 'export interface t {\n';
            let interface_safe_t = prefix + 'export interface safe_t' + ' {\n';
            let interface_safe_func = prefix + 'export function safe(m: t): safe_t {\n\t\tconst u = m == null ? {} as t : m\n\t\tconst s = {} as safe_t\n';
            prefix = '\t\t';

            for (let key in moduleContent) {
                const value = moduleContent[key];
                const metaType = this.getType(value);
                let actualType = metaType;
                const defaultValue = this.getDefaultValue(metaType);
                if (metaType == 'object') {
                    actualType = this.upcaseFirstLetter(key);
                    if (!this.moduleMap.has(actualType)) {
                        this.objectStack.push({ moduleName: actualType, moduleContent: value });
                        this.recordObjectClass(actualType);
                    } else {
                        this.recordDuplicateClass(actualType);
                    }
                } else if (metaType == 'array') {
                    if (value.length > 0) {
                        const firstElem = value[0];
                        if (firstElem != null) {
                            actualType = this.getArrayElememtType(firstElem, key) + '[]';
                        } else {
                            actualType = 'null[]';
                        }
                    } else {
                        actualType = 'null[]';
                    }
                }
                if (metaType == 'object') {
                    interface_t += prefix + key + '?: ' + actualType + '.t;\n';
                    interface_safe_t += prefix + key + ': ' + actualType + '.safe_t;\n';
                    interface_safe_func += prefix + 's.' + key + ' = u.' + key + ' == null ? ' + actualType + '.safe(<' + actualType + '.t>{}) : ' + actualType + '.safe(u.' + key + ')\n';
                } else if (metaType == 'array') {
                    const loc = actualType.indexOf('[');
                    const preStr = actualType.substring(0, loc);
                    const suffixStr = actualType.substring(loc, actualType.length);
                    if (this.isBasicType(preStr)) {
                        interface_t += prefix + key + '?: ' + actualType + ';\n';
                        interface_safe_t += prefix + key + ': ' + actualType + ';\n';
                        interface_safe_func += prefix + 's.' + key + ' = u.' + key + ' || ' + defaultValue + '\n';
                    } else {
                        interface_t += prefix + key + '?: ' + preStr + '.t' + suffixStr + ';\n';
                        interface_safe_t += prefix + key + ': ' + preStr + '.safe_t' + suffixStr + ';\n';
                        interface_safe_func += prefix + 's.' + key + ' = u.' + key + ' == null ? ' + defaultValue + ' : u.' + key + '.map((e:' + preStr + '.t) => { return ' + preStr + '.safe(e) })\n';
                    }
                } else {
                    interface_t += prefix + key + '?: ' + actualType + ';\n';
                    interface_safe_t += prefix + key + ': ' + actualType + ';\n';
                    interface_safe_func += prefix + 's.' + key + ' = u.' + key + ' || ' + defaultValue + '\n';
                }
            }
            interface_safe_func += prefix + 'return s\n';
            prefix = '\t';
            let endStr = prefix + '}\n\n';
            interface_t += endStr;
            interface_safe_t += endStr;
            interface_safe_func += endStr;
            prefix = '';
            endStr = prefix + '}\n\n';
            moduleString += interface_t + interface_safe_t + interface_safe_func + endStr;
            return moduleString;
        } else {
            return '';
        }
    }

    isBasicType(type: string): boolean {
        if (type == 'number' || type == 'string') {
            return true;
        }
        return false;
    }

    getType(value: any): string {
        switch (typeof (value)) {
            case 'object':
                if (Array.isArray(value)) {
                    return 'array';
                } else {
                    return 'object';
                }
            default:
                return typeof (value);
        }
    }

    getArrayElememtType(value: any, key: string): string {
        switch (typeof (value)) {
            case 'object':
                if (Array.isArray(value)) {
                    if (value && value.length > 0) {
                        const firstElem = value[0];
                        if (firstElem) {
                            return this.getArrayElememtType(firstElem, key) + '[]';
                        } else {
                            return 'null[]';
                        }
                    } else {
                        return 'null[]';
                    }
                } else {
                    const objectClass = this.upcaseFirstLetter(key);
                    if (!this.moduleMap.has(objectClass)) {
                        this.objectStack.push({ moduleName: objectClass, moduleContent: value });
                        this.recordObjectClass(objectClass);
                    } else {
                        this.recordDuplicateClass(objectClass);
                    }
                    return objectClass;
                }
            default:
                return typeof (value);
        }
    }

    getDefaultValue(type: string) {
        switch (type) {
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'string':
                return '""';
            case 'array':
                return '[]';
            case 'object':
                return '{}';
            default:
                return null;
        }
    }

    upcaseFirstLetter(str: string) {
        if (str && str.length > 0) {
            const firstChar = str.substring(0, 1);
            return str.replace(firstChar, firstChar.toUpperCase());
        } else {
            return '';
        }
    }

    recordObjectClass(actualType: string) {
        this.moduleMap.add(actualType);
    }

    recordDuplicateClass(actualType: string) {
        if (this.duplicateClasses.indexOf(actualType) == -1) {
            this.duplicateClasses.push(actualType);
        }
    }
}