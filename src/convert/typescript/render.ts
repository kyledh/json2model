import * as nunjucks from 'nunjucks';
import { pascalCase } from 'change-case';
import { getClass } from '../schema';
import { RenderInterface, ConvertResult } from '../common';
import { getConfiguration } from '../../utils';

export class TSRender implements RenderInterface {

    njk: nunjucks.Environment = nunjucks.configure(__dirname, {
        autoescape: false,
        trimBlocks: true,
        lstripBlocks: true,
    });

    clsArray: string[] = [];

    constructor() {
        this.njk.addFilter('pascal', (str: string) => pascalCase(str));
        this.njk.addFilter('tsharp_type', (type) => {
            if (this.typeMap.has(type)) {
                return this.typeMap.get(type);
            }
            return type;
        });
        this.njk.addFilter('tsharp_safe_type', (type, isSafe = false) => {
            if (this.typeMap.has(type)) {
                return this.typeMap.get(type);
            }
            if (isSafe) {
                return `${type}.safe_t`.replace("[].safe_t", ".safe_t[]");
            } else {
                return `${type}.t`.replace("[].t", ".t[]");
            }
        });
        this.njk.addFilter('tsharp_from', (type) => {
            if (this.typeValueMap.has(type)) {
                return this.typeValueMap.get(type);
            } else if (type.includes('[]')) {
                return 'array';
            }
            return 'object';
        });
        this.njk.addFilter('tsharp_cls', (cls: string) => {
            if (getConfiguration<boolean>('typescript.duplicateClass')) {
                return true;
            }
            if (this.clsArray.includes(cls)) {
                return false;
            }
            this.clsArray.push(cls);
            return true;
        });
    }

    render(name: string, json: object): ConvertResult {
        try {
            const cls = getClass(pascalCase(name), json);
            const template = require('./template.njk').default;
            const is_safe = getConfiguration<boolean>('typescript.generateSafeModel');
            let model = this.njk.renderString(template, { cls, is_safe });
            model = model.replace(/ +$/gm, ''); // trim blank lines
            model = model.trim();
            return { data: model };
        } catch(e) {
            return { error: e };
        }
    }

    typeMap = new Map([
        ['integer', 'number'],
        ['integer[]', 'number[]'],
        ['long', 'number'],
        ['long[]', 'number[]'],
        ['number', 'number'],
        ['number[]', 'number[]'],
        ['boolean', 'boolean'],
        ['boolean[]', 'boolean[]'],
        ['string', 'string'],
        ['string[]', 'string[]'],
    ]);

    typeValueMap = new Map([
        ['integer', '0'],
        ['integer[]', '[]'],
        ['long', '0'],
        ['long[]', '[]'],
        ['number', '0'],
        ['number[]', '[]'],
        ['boolean', 'false'],
        ['boolean[]', '[]'],
        ['string', '\'\''],
        ['string[]', '[]'],
    ]);
}