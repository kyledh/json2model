import * as vscode from 'vscode';
import { Environment } from 'nunjucks';

export enum ConvertTypeEnum {
    TypeScript = 'TypeScript'
}

export interface RenderInterface {
    njk: Environment;
    render(name: string, json: any): ConvertResult;
}

export interface ConvertResult {
    data?: string;
    error?: any;
}