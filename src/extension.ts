import * as vscode from 'vscode';
import * as copyPaste from "copy-paste";
import { isJSON, getConvertType } from './utils';
import { convert } from './convert/convert';
import { ConvertTypeEnum } from './convert/common';

export function activate(context: vscode.ExtensionContext) {

    const callCommand = (type: ConvertTypeEnum) => {
        copyPaste.paste((_, content) => {
            if (isJSON(content)) {
                convert(JSON.parse(content), type);
            } else {
                vscode.window.showErrorMessage("Clipboard has no valid JSON content.");
            }
        });
    }

    const toModelCommand = vscode.commands.registerCommand("j2m.toModel", () => {
        callCommand(getConvertType());
    });

    const toTypeScriptCommand = vscode.commands.registerCommand("j2m.toTypeScript", () => {
        callCommand(ConvertTypeEnum.TypeScript);
    });

    const toCSharpCommand = vscode.commands.registerCommand("j2m.toCSharp", () => {
        callCommand(ConvertTypeEnum.CSharp);
    });

    context.subscriptions.push(toModelCommand, toTypeScriptCommand, toCSharpCommand);
}

export function deactivate() {}