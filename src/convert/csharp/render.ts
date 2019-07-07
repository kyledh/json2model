import * as nunjucks from 'nunjucks';
import { pascalCase } from 'change-case';
import { RenderInterface, ConvertResult } from '../../interface';
import { getClass } from '../lib';

export class CSRender implements RenderInterface {

    njk: nunjucks.Environment = nunjucks.configure(__dirname, {
        autoescape: false,
        trimBlocks: true,
        lstripBlocks: true,
    });

    constructor() {
        this.njk.addFilter('pascal', (str: string) => pascalCase(str));
        this.njk.addFilter('csharp_type', (type) => {
            if (this.typeMap.has(type)) {
                return this.typeMap.get(type);
            }
            return type;
        });
        this.njk.addFilter('csharp_name', (name) => {
            if (name.startsWith('$')) {
                return name.slice(1);
            }
            if (this.keywordSet.has(name)) {
                return `@${name}`;
            }
            return name;
        });
    }

    render(name: string, json: object): ConvertResult {
        try {
            const cls = getClass(pascalCase(name), json);
            const template = require('./template.njk').default;
            let model = this.njk.renderString(template, { cls, partial: true });
            model = model.replace(/ +$/gm, ''); // trim blank lines
            model = model.trim();
            return { data: model };
        } catch(e) {
            return { error: e };
        }
    }

    keywordSet = new Set(['operator', 'default', 'in', 'enum', 'ref']);

    typeMap = new Map([
        ['integer', 'int?'],
        ['integer[]', 'int?[]'],
        ['long', 'long?'],
        ['long[]', 'long?[]'],
        ['number', 'double?'],
        ['number[]', 'double?[]'],
        ['boolean', 'bool?'],
        ['boolean[]', 'bool?[]'],
      ]);
}