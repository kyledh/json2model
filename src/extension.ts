import * as vscode from 'vscode';
import * as copyPaste from "copy-paste";
import { isJSON } from './utils';
import { convert } from './convert/convert';
import { ConvertTypeEnum } from './convert/common';

export function activate(context: vscode.ExtensionContext) {

    const toModelCommand = vscode.commands.registerCommand("j2m.toModel", () => {
        copyPaste.paste((_, content) => {
            if (isJSON(content)) {
                convert(JSON.parse(content), ConvertTypeEnum.TypeScript);
            } else {
                vscode.window.showErrorMessage("Clipboard has no valid JSON content.");
            }
        });
    });

    context.subscriptions.push(toModelCommand);
}

export function deactivate() {}