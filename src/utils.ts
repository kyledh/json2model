import * as vscode from 'vscode';
import * as plural from 'pluralize';
import { ConvertTypeEnum } from './convert/common';

export const isInteger = (n: number) => n % 1 === 0;
export const isLong = (n: number) => isInteger(n) && n > 2147483647;

export const singularize = (word: string) => plural(word, 1);
export const pluralize = (word: string) => plural(word, 10);

export function isJSON(content: string): boolean {
    try {
        JSON.parse(content);
    } catch (e) {
        return false;
    }
    return true;
}

export function getFileName(path: string): string {
    const fileFullName = path.split("/").slice(-1).toString();
    return fileFullName.split(".")[0];
}

export function getConfiguration<T>(section: string): T | undefined {
    return vscode.workspace.getConfiguration().get<T>(section);
}

export function getConvertType(): ConvertTypeEnum {
    let selectedType = getConfiguration<string>("general.defaultConvertType") || "TypeScript";
    if (selectedType === "C#") {
        selectedType = "CSharp";
    }
    return ConvertTypeEnum[selectedType as keyof typeof ConvertTypeEnum];
}

export function isValidKey(key: string, obj: object): key is keyof typeof obj {
    return key in obj;
}