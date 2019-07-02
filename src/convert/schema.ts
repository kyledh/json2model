import * as deepmerge from 'deepmerge';
import { pascalCase } from 'change-case';
import { isInteger, isLong, singularize } from '../utils';

export function getType(key: string, value: any): string {
  const match = ({}).toString.call(value).match(/\s([a-zA-Z]+)/);
  if (match) {
    const type = match[1].toLowerCase();
    if (type === 'number' && isInteger(value)) {
      if (isLong(value)) {
        return 'long';
      }
      return 'integer';
    } else if (type === 'array') {
      return `${getType(singularize(key), value[0])}[]`;
    } else if (type === 'object') {
      return pascalCase(key);
    }
    return type;
  }
  return '';
}

export function getFields(obj: any) {
  return Object.keys(obj).map((key) => ({
    name: key,
    type: getType(key, obj[key]),
    value: obj[key],
  }));
} 

export function getClass(_name: string, _obj: any): any {
  let [name, obj] = [_name, _obj];
  if (name.endsWith('[]')) {
    name = name.slice(0, -2);
    obj = obj.reduce((prev: any, data: any) => deepmerge(prev, data), {});
  }
  const fields = getFields(obj);
  return {
    name,
    fields,
    classes: fields.filter((field) => /[A-Z]/.test(field.type[0]))
      .map((field) => getClass(field.type, field.value)),
  };
}
