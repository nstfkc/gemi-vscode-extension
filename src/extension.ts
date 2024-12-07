// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { execSync } from 'child_process'
import { join } from 'path'

function getDocumentWorkspaceFolder(): string | undefined {
	const fileName = vscode.window.activeTextEditor?.document.fileName;
	if (!fileName) {
		return vscode.workspace.workspaceFolders?.[0].uri.fsPath
	}
	return vscode.workspace.workspaceFolders
		?.map((folder) => folder.uri.fsPath)
		.filter((fsPath) => fileName?.startsWith(fsPath))[0];
}

async function openFile(uri: vscode.Uri, line: number, column: number) {
	const doc = await vscode.workspace.openTextDocument(uri)
	const editor = await vscode.window.showTextDocument(doc)
	const position = new vscode.Position(line - 1, column - 1)
	const selection = new vscode.Selection(position, position)
	editor.selection = selection
	editor.revealRange(
		new vscode.Range(position, position),
		vscode.TextEditorRevealType.InCenter
	)
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gemi-vscode-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('gemi.discover-api-routes', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const root = getDocumentWorkspaceFolder()
		if (!root) return;
		const buffer = execSync('gemi ide:generate-api-manifest', { cwd: root })
		const json = JSON.parse(buffer.toString())
		const routePath = await vscode.window.showQuickPick(Object.keys(json))
		if (routePath) {
			const methods = Object.keys(json[routePath]);
			if (methods.length === 1) {
				const { file, line, column } = json[routePath][methods[0]]
				const filePath = vscode.Uri.file(join(root!, file))
				await openFile(filePath, line, column)
			} else {
				const method = await vscode.window.showQuickPick(methods)
				if (method) {
					const { file, line, column } = json[routePath][method]
					const filePath = vscode.Uri.file(join(root!, file))
					await openFile(filePath, line, column)
				}
			}

		}

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
