# Playwright Generator — VS Code Extension

A VS Code extension that provides a graphical interface for [playwright-generator](https://github.com/zhiweil/playwright-generator) — configure your LLM, generate Playwright test code and helper classes from natural language, and run your tests, all without leaving the editor.

## Features

### Config Tab

- Load and save your `.env` file automatically — all changes are saved as you type
- Switch between AI models (Claude, Azure OpenAI, ChatGPT, Local LLM) with model-specific fields shown/hidden automatically
- Configure browser, headless mode, video recording, timeout, and retries
- Add and remove custom environment variables in the **Custom Environment Variables** section

### Generate Tab

- Searchable listbox of all test case IDs scanned from your `tests/` folder
- Duplicate test case IDs are greyed out and marked `[Duplicate!]`
- Auto-updates when test case files change
- One-click generation via `npx playwright-generator generate --tc <ID>`

### Helpers Tab

- Lists all helper definitions from `helpers/` and generated helpers from `generated/helpers/`
- Two-column view: **Helper** name and **Actions** (methods in the generated class)
- Helpers not yet generated show `⏳ Not generated yet` in amber
- Search by helper name to filter the list
- One-click generation via `npx playwright-generator generate-helper <Name>`
- Re-running generation skips already-generated actions and only adds missing ones
- Auto-updates when helper definition or generated files change

### Run Tab

- Searchable listbox of all tags scanned from your `generated/` folder
- Auto-updates when generated test files change
- **Run All Tests** — runs the full test suite
- **Run by Tag** — runs tests matching the selected tag
- **Run with UI by Tag** — runs tests in headed (visible browser) mode
- **Debug by Tag** — opens Playwright Inspector for debugging
- **View Last Report** — opens the last HTML report in the browser

### General

- Single reusable terminal — all commands run in the same terminal window
- Controls are disabled while a command is running
- Report server (port 9324) is automatically stopped before each new command
- Live file watchers keep all lists up to date without manual refresh
- Commented-out test cases, helpers, and actions are excluded from all lists

## Requirements

- [playwright-generator](https://www.npmjs.com/package/@zhiweiliu/playwright-generator) installed and initialised in your workspace:
  ```bash
  npm install -g @zhiweiliu/playwright-generator
  npx playwright-generator init
  ```
- A `.env` file in your workspace root
- Node.js 16+

## Getting Started

1. Install the extension from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=zhiweiliu.playwright-generator-vscode)
2. Open your `playwright-generator` project in VS Code
3. Click the Playwright Generator icon in the Activity Bar
4. Configure your AI model and credentials in the **Config** tab
5. Select a test case ID and click **Generate** in the **Generate** tab
6. Generate helper classes from the **Helpers** tab
7. Run your tests from the **Run** tab

## Configuration

| Field | Description |
|---|---|
| AI Model | `claude`, `azure-openai`, `chatgpt`, or `local` |
| Claude API Key | Required when using Claude (`sk-ant-...`) |
| Azure OpenAI API Key | Required when using Azure OpenAI |
| Azure OpenAI Endpoint | e.g. `https://<resource>.openai.azure.com` |
| Azure OpenAI Deployment | e.g. `gpt-4o` |
| Azure OpenAI API Version | Defaults to `2024-02-01` |
| ChatGPT API Key | Required when using ChatGPT (`sk-...`) |
| ChatGPT Model | Defaults to `gpt-4o` |
| Local LLM URL | Ollama default: `http://localhost:11434` |
| Local LLM Model | e.g. `llama3`, `codellama`, `qwen2.5-coder` |
| Browser | `chromium`, `firefox`, or `webkit` |
| Headless | Run browser in headless mode |
| Video | `retain-on-failure`, `on`, `off`, `on-first-retry` |
| Timeout | Test timeout in milliseconds |
| Retries | Number of retries on failure |

All changes are saved automatically to the `.env` file in your workspace root.

## Supported AI Models

| Model | Requirements |
|---|---|
| Claude | Anthropic API key — https://console.anthropic.com |
| Azure OpenAI | Azure subscription with OpenAI resource |
| ChatGPT | OpenAI API key — https://platform.openai.com |
| Local LLM | [Ollama](https://ollama.com) running locally — no API key needed |

## Extension Commands

| Command | Description |
|---|---|
| `Playwright Generator: Open Panel` | Opens the Playwright Generator activity bar panel |

## Release Notes

### 0.0.22 and above

- Production-ready release
- All four tabs: Config, Generate, Helpers, Run
- Full helper class generation with incremental action support
- Duplicate TC ID detection
- Comment-aware file scanning
- Single terminal with running state management
- Automatic report server lifecycle management
- Security fixes (CWE-94, CWE-346)

### 0.0.1 — 0.0.21

> ⚠️ These versions were development/pre-release builds and are not recommended for use. Please upgrade to **v0.0.22 or above**.

## License

MIT
