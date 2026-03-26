# Playwright Generator — VS Code Extension

A VS Code extension that provides a graphical interface for [playwright-generator](https://github.com/zhiweil/playwright-generator) — configure your LLM, generate Playwright test code from natural language, and run your tests, all without leaving the editor.

## Features

### Configuration
- Load and save your `.env` file directly from the panel
- Switch between AI models (Claude, Azure OpenAI, ChatGPT, Local LLM) with model-specific fields shown/hidden automatically
- Configure browser, headless mode, video recording, timeout, and retries

### Generation
- Searchable dropdown of all test case IDs scanned from your `tests/` folder
- Auto-updates when test case files change
- One-click generation via `npx playwright-generator generate --tc <ID>`

### Run
- Searchable dropdown of all tags scanned from your `generated/` folder
- Auto-updates when generated test files change
- Buttons to run all tests, run by tag, run with UI (headed), debug, and open the HTML report

## Requirements

- [playwright-generator](https://www.npmjs.com/package/@zhiweiliu/playwright-generator) installed and initialised in your workspace (`npx playwright-generator init`)
- A `.env` file in your workspace root
- Node.js 16+

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Open a workspace that has been initialised with `npx playwright-generator init`
3. Click the Playwright Generator icon in the Activity Bar
4. Configure your AI model and credentials in the **Configuration** section
5. Select a test case ID and click **Generate**
6. Run your tests from the **Run** section

## Configuration

| Field | Description |
|---|---|
| AI Model | `claude`, `azure-openai`, `chatgpt`, or `local` |
| Claude API Key | Required when using Claude (`sk-ant-...`) |
| Azure OpenAI API Key / Endpoint | Required when using Azure OpenAI |
| ChatGPT API Key / Model | Required when using ChatGPT |
| Local LLM URL / Model | Required when using a local Ollama model |
| Browser | `chromium`, `firefox`, or `webkit` |
| Headless | Run browser in headless mode |
| Video | `retain-on-failure`, `on`, `off`, `on-first-retry` |
| Timeout | Test timeout in milliseconds |
| Retries | Number of retries on failure |

All changes are saved directly to the `.env` file in your workspace root.

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

### 0.0.1
- Initial release
- Configuration, Generation, and Run sections
- Live file watchers for test case IDs and tags
- Support for Claude, Azure OpenAI, ChatGPT, and local LLM models

## License

MIT
