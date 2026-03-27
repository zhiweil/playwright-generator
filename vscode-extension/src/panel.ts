import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { readEnv, writeEnv, readCustomEnv, writeCustomEnv, EnvConfig } from "./envManager";
import { scanTestCaseIds, scanTags } from "./testCaseScanner";

export class PlaywrightGeneratorPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "playwrightGenerator.panel";

  private _view?: vscode.WebviewView;
  private _workspaceRoot: string;
  private _watchers: vscode.FileSystemWatcher[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "media")],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => this._handleMessage(msg));

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) { this._sendInitialData(); }
    });

    this._setupWatchers();
    this._sendInitialData();
  }

  private _sendInitialData(): void {
    if (!this._view) { return; }
    // Send env config immediately so the panel renders without waiting for file scans
    const env = readEnv(this._workspaceRoot);
    const customEnv = readCustomEnv(this._workspaceRoot);
    this._view.webview.postMessage({ command: "init", env, testCaseIds: [], tags: [], customEnv });
    // Scan files asynchronously and push results once ready
    Promise.all([
      scanTestCaseIds(this._workspaceRoot),
      scanTags(this._workspaceRoot),
    ]).then(([testCaseIds, tags]) => {
      this._view?.webview.postMessage({ command: "updateTestCaseIds", testCaseIds });
      this._view?.webview.postMessage({ command: "updateTags", tags });
    });
  }

  private _setupWatchers(): void {
    for (const w of this._watchers) { w.dispose(); }
    this._watchers = [];

    const testsWatcher = vscode.workspace.createFileSystemWatcher("**/tests/**/*.test.md");
    const generatedWatcher = vscode.workspace.createFileSystemWatcher("**/generated/**/*.test.ts");

    const refreshIds = () => {
      scanTestCaseIds(this._workspaceRoot).then((testCaseIds) => {
        this._view?.webview.postMessage({ command: "updateTestCaseIds", testCaseIds });
      });
    };

    const refreshTags = () => {
      scanTags(this._workspaceRoot).then((tags) => {
        this._view?.webview.postMessage({ command: "updateTags", tags });
      });
    };

    testsWatcher.onDidChange(refreshIds);
    testsWatcher.onDidCreate(refreshIds);
    testsWatcher.onDidDelete(refreshIds);
    generatedWatcher.onDidChange(refreshTags);
    generatedWatcher.onDidCreate(refreshTags);
    generatedWatcher.onDidDelete(refreshTags);

    this._watchers.push(testsWatcher, generatedWatcher);
  }

  private _handleMessage(msg: { command: string; [key: string]: unknown }): void {
    switch (msg.command) {
      case "saveEnv":
        writeEnv(this._workspaceRoot, msg.env as EnvConfig);
        vscode.window.showInformationMessage("Playwright Generator: .env saved.");
        break;

      case "saveCustomEnv":
        writeCustomEnv(this._workspaceRoot, msg.customEnv as Record<string, string>);
        vscode.window.showInformationMessage("Playwright Generator: .env saved.");
        break;

      case "generate": {
        const tcId = msg.tcId as string;
        if (!tcId) { return; }
        this._runInTerminal(`npx playwright-generator generate --tc ${tcId}`);
        break;
      }

      case "runAll":
        this._runInTerminal("npm run test");
        break;

      case "runByTag": {
        const tag = msg.tag as string;
        if (!tag) { vscode.window.showWarningMessage("Please select a tag first."); return; }
        this._runInTerminal(`npm run test:case -- ${tag}`);
        break;
      }

      case "runHeaded": {
        const tag = msg.tag as string;
        if (!tag) { vscode.window.showWarningMessage("Please select a tag first."); return; }
        this._runInTerminal(`npm run test:headed -- ${tag}`);
        break;
      }

      case "debug": {
        const tag = msg.tag as string;
        if (!tag) { vscode.window.showWarningMessage("Please select a tag first."); return; }
        this._runInTerminal(`npm run test:debug -- ${tag}`);
        break;
      }

      case "report":
        this._runInTerminal("node report.js");
        break;
    }
  }

  private _runInTerminal(cmd: string): void {
    const terminal = vscode.window.createTerminal("Playwright Generator");
    terminal.show();
    if (process.platform === "win32") {
      terminal.sendText(`cmd /c "cd /d "${this._workspaceRoot}" && ${cmd}"`);
    } else {
      terminal.sendText(`cd "${this._workspaceRoot}" && ${cmd}`);
    }
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "style.css"));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Playwright Generator</title>
</head>
<body>
  <div class="tab-bar">
    <button class="tab active" data-tab="config">Config</button>
    <button class="tab" data-tab="generate">Generate</button>
    <button class="tab" data-tab="run">Run</button>
  </div>

  <div id="tab-config" class="tab-panel">
    <label>AI Model</label>
    <select id="AI_MODEL">
      <option value="claude">Claude</option>
      <option value="azure-openai">Azure OpenAI</option>
      <option value="chatgpt">ChatGPT</option>
      <option value="local">Local LLM</option>
    </select>

    <div id="claude-fields" class="model-fields">
      <label>Claude API Key</label>
      <input type="password" id="CLAUDE_API_KEY" placeholder="sk-ant-...">
    </div>
    <div id="azure-fields" class="model-fields hidden">
      <label>Azure OpenAI API Key</label>
      <input type="password" id="AZURE_OPENAI_API_KEY" placeholder="Azure API key">
      <label>Azure OpenAI Endpoint</label>
      <input type="text" id="AZURE_OPENAI_ENDPOINT" placeholder="https://&lt;resource&gt;.openai.azure.com">
      <label>Azure OpenAI Deployment</label>
      <input type="text" id="AZURE_OPENAI_DEPLOYMENT" placeholder="gpt-4o">
      <label>Azure OpenAI API Version</label>
      <input type="text" id="AZURE_OPENAI_API_VERSION" placeholder="2024-02-01">
    </div>
    <div id="chatgpt-fields" class="model-fields hidden">
      <label>ChatGPT API Key</label>
      <input type="password" id="CHATGPT_API_KEY" placeholder="sk-...">
      <label>ChatGPT Model</label>
      <input type="text" id="CHATGPT_MODEL" placeholder="gpt-4o">
    </div>
    <div id="local-fields" class="model-fields hidden">
      <label>Local LLM URL</label>
      <input type="text" id="LOCAL_LLM_URL" placeholder="http://localhost:11434">
      <label>Local LLM Model</label>
      <input type="text" id="LOCAL_LLM_MODEL" placeholder="llama3">
    </div>

    <label>Browser</label>
    <select id="BROWSER">
      <option value="chromium">Chromium</option>
      <option value="firefox">Firefox</option>
      <option value="webkit">WebKit</option>
    </select>

    <label>Video</label>
    <select id="VIDEO">
      <option value="retain-on-failure">Retain on Failure</option>
      <option value="on">On</option>
      <option value="off">Off</option>
      <option value="on-first-retry">On First Retry</option>
    </select>

    <label class="inline"><input type="checkbox" id="HEADLESS"> Headless</label>

    <label>Timeout (ms)</label>
    <input type="number" id="TIMEOUT" placeholder="30000">

    <label>Retries</label>
    <input type="number" id="RETRIES" placeholder="1">

    <div class="section-divider"></div>
    <label class="section-label">Custom Environment Variables</label>
    <div id="custom-env-rows"></div>
    <button id="btn-add-env">+ Add Variable</button>
  </div>

  <div id="tab-generate" class="tab-panel hidden">
    <label>Test Case ID</label>
    <input type="text" id="tc-search" placeholder="Search or select TC ID...">
    <select id="tc-select" size="2"></select>
    <button id="btn-generate">Generate</button>
  </div>

  <div id="tab-run" class="tab-panel hidden">
    <label>Tag</label>
    <input type="text" id="tag-search" placeholder="Search or select tag...">
    <select id="tag-select" size="2"></select>
    <div class="button-group">
      <button id="btn-run-all">All Tests</button>
      <button id="btn-run-tag">Run by Tag</button>
      <button id="btn-run-headed">Run with UI</button>
      <button id="btn-debug">Debug</button>
      <button id="btn-report">Report</button>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
