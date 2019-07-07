import * as vscode from 'vscode';
import { getFileName } from '../utils';
import { ConvertTypeEnum, RenderInterface, ConvertResult } from '../interface';
import { TSRender } from './typescript/render';
import { CSRender } from './csharp/render';

export function convert(json: any, type: ConvertTypeEnum) {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
        vscode.window.showErrorMessage('Please select the file for output.');
        return;
    }
    vscode.window.setStatusBarMessage(`Convert JSON to ${type} model...`, 2000);

    activeTextEditor.edit((editBuilder) => {
        const fileName = getFileName(activeTextEditor.document.fileName);

        const startLine = activeTextEditor.selection.start.line;
        const lastCharIndex = activeTextEditor.document.lineAt(startLine).text.length;
        const position = new vscode.Position(startLine, lastCharIndex);

        const result = json2model(fileName, json, type);
        if (result.data) {
            editBuilder.insert(position, result.data);
            vscode.window.setStatusBarMessage(`Here are your ${type} model... Enjoy! :)`, 3000);
        } else {
            vscode.window.showErrorMessage(`${result.error}`);
        }
    });
}

function json2model(clsName: string, json: any, type: ConvertTypeEnum): ConvertResult {
    let render: RenderInterface;
    switch (type) {
        case ConvertTypeEnum.TypeScript:
            render = new TSRender();
            break;
        case ConvertTypeEnum.CSharp:
            render = new CSRender();
            break;
        default:
            return { error: '' };
    }
    return render.render(clsName, json);
}