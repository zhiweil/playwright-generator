import * as vscode from "vscode";
import { PlaywrightGeneratorPanel } from "./panel";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PlaywrightGeneratorPanel(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PlaywrightGeneratorPanel.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("playwrightGenerator.open", () => {
      vscode.commands.executeCommand("workbench.view.extension.playwrightGenerator");
    })
  );
}

export function deactivate(): void {}
