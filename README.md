# Playwright LLM Test Case Generator

> ⚠️ **Version Notice**: Versions v1.0.1 to v1.0.55 are development builds and are not recommended for use. Please upgrade to **v1.0.56 or above** if you are still running these versions.

This module streamlines the generation of Playwright test cases by integrating with Large Language Models. While there are many AI-based test frameworks that allow test cases to be written in natural language, the following drawbacks are commonly found with these approaches.

## Table of Contents

- [Drawbacks of Current AI-Based Test Frameworks](#drawbacks-of-current-ai-based-test-frameworks)
- [Why Playwright + AI Test Case Generator?](#why-playwright--ai-test-case-generator)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Quick Start](#installation--quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Preset Test Framework](#preset-test-framework)
  - [Test Cases Written in Natural Language](#test-cases-written-in-natural-language)
  - [Generation](#generation)
  - [Helper Generation](#helper-generation)
  - [Test Results & Reporting](#test-results--reporting)
  - [Execution and Debugging](#execution-and-debugging)
  - [Advanced Features](#advanced-features)
  - [CI/CD Integration](#cicd-integration)
  - [Best Practices](#best-practices)
  - [Troubleshooting](#troubleshooting)
  - [GitHub Integration](#github-integration)
- [Local LLM Setup (Ollama)](#local-llm-setup-ollama)
  - [How It Works](#how-it-works)
  - [1. Install Ollama](#1-install-ollama)
  - [2. Start the Ollama Server](#2-start-the-ollama-server)
  - [3. Pull a Model](#3-pull-a-model)
  - [4. Configure .env](#4-configure-env)
  - [5. Generate a Test Case](#5-generate-a-test-case)
  - [Recommended Models](#recommended-models)
  - [Qwen Models](#qwen-models-by-alibaba)
  - [DeepSeek Models](#deepseek-models-by-deepseek-ai)
  - [Using LM Studio](#using-lm-studio-alternative)
- [VS Code Extension](#vs-code-extension)
- [Contributing](#contributing)
  - [Development Setup](#development-setup)
- [License](#license)
- [Support](#support)

## Drawbacks of Current AI-Based Test Frameworks

1. **Lack of Precision and Accuracy**: AI-generated tests may not accurately capture complex user interactions, edge cases, or application-specific logic, leading to false positives or missed bugs.

2. **Maintenance Overhead**: As applications evolve, AI-generated tests often require manual updates and refactoring, negating some of the time-saving benefits.

3. **Reliability Issues**: Large Language Models can hallucinate or generate incorrect test logic, especially for dynamic web applications with complex state management.

4. **Limited Integration**: Many AI-based frameworks lack seamless integration with existing CI/CD pipelines, version control systems, and testing infrastructure.

5. **Cost and Resource Intensity**: Frequent API calls to LLM services can become expensive, and there's a dependency on external services that may have rate limits or downtime.

6. **Security Concerns**: Sharing application details with external AI services raises potential security risks, especially for proprietary or sensitive codebases.

## Why Playwright + AI Test Case Generator?

Playwright combined with AI offers a powerful solution that addresses these drawbacks:

1. **Robust Web Testing Foundation**: Playwright provides a reliable, battle-tested framework for end-to-end web testing, handling modern web applications with features like auto-waiting, network interception, and cross-browser support.

2. **Enhanced Test Generation**: AI integration allows for natural language test case descriptions, accelerating test creation while maintaining the precision and reliability of Playwright's code generation.

3. **Maintainable Code**: Generated Playwright tests are actual code that can be easily reviewed, modified, and maintained by developers, unlike some AI frameworks that produce abstract test descriptions.

4. **Seamless Integration**: Playwright integrates well with existing development workflows, CI/CD pipelines, and can be enhanced with AI without compromising existing infrastructure.

5. **Cost-Effective**: By generating high-quality Playwright code upfront, this approach reduces the need for continuous AI API calls during test maintenance and execution.

6. **Security-First**: The AI integration can be implemented with local models or controlled API usage, minimizing security risks associated with external AI services.

## Features

This project implements an npx command in TypeScript and is released as an NPM module `@zhiweiliu/playwright-generator`. After installing the command, you can easily set up a Playwright framework with AI support by running a command.

```bash
npx playwright-generator init
```

The installed module will have rich features to facilitate your day-to-day test automation tasks.

## Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher
- **Git**: For version control integration
- **LLM API Access**: Depending on your AI model choice:
  - Claude: Anthropic API key with Claude access enabled (visit https://console.anthropic.com/)
  - Azure OpenAI: Azure subscription with an OpenAI resource and deployment
  - ChatGPT: OpenAI API key (visit https://platform.openai.com/)
  - Local LLM: Ollama installed locally (no API key required — see [Local LLM Setup](#local-llm-setup-ollama))

## Installation & Quick Start

1. **Install the generator**:

   ```bash
   npm install -g @zhiweiliu/playwright-generator
   ```

2. **Initialize a new project**:

   ```bash
   npx playwright-generator init
   ```

   Note: `init` now creates `tests/example.test.md` with comprehensive SauceDemo e-commerce test cases by default.

3. **Configure your environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your API credentials
   ```

4. **Write your first test case** in the `tests/` folder

5. **Generate Playwright code**:
   ```bash
   npx playwright-generator generate --tc TC-0001
   ```

## Project Structure

```
project-root/
├── tests/                    # Natural language test cases (includes sample test cases)
│   └── *.test.md
├── helpers/                  # Natural language helper definitions
│   └── *.md
├── generated/                # Generated Playwright test code
│   ├── generated.test.ts
│   └── helpers/              # Generated helper classes
│       └── *.ts
├── audit/                    # Screenshots and artifacts from failed tests
│   └── screenshots/
├── .env                      # Environment variables (local only, ignored by Git)
├── .env.example              # Example environment file
├── playwright.config.ts      # Playwright configuration
└── package.json

```

## Configuration

### Environment Variables (.env)

```env
# AI Model Configuration
AI_MODEL=claude                      # Options: claude, azure-openai, chatgpt, local
CLAUDE_API_KEY=sk-ant-...            # Required if using Claude (starts with sk-ant-)
AZURE_OPENAI_API_KEY=                # Required if using Azure OpenAI
AZURE_OPENAI_ENDPOINT=               # e.g. https://<resource>.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=             # e.g. gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01  # Optional, defaults to 2024-02-01
CHATGPT_API_KEY=                     # Required if using ChatGPT (starts with sk-)
CHATGPT_MODEL=gpt-4o                 # Optional, defaults to gpt-4o
LOCAL_LLM_URL=http://localhost:11434 # Required if using local LLM (Ollama default)
LOCAL_LLM_MODEL=llama3               # Required if using local LLM (e.g. llama3, codellama, qwen2.5-coder)

# Playwright Configuration
BROWSER=chromium                    # Options: chromium, firefox, webkit
HEADLESS=true                       # Run in headless mode
BASE_URL=http://localhost:3000      # Application under test URL

# Execution Configuration
TIMEOUT=30000                       # Test timeout in milliseconds
RETRIES=1                           # Number of retries on failure
```

### Preset Test Framework

- A fully working Playwright test automation framework is already set up

### Test Cases Written in Natural Language

- Test cases are stored in the `tests/` folder under the project root using `.test.md` files
- Tags with format `[TAG-NAME]` can be applied to natural language test cases to allow grouping and running related tests
- Each test case must have a unique ID tag in format `[TC-xxxx]` (e.g., `[TC-0001]`), which enables running specific test cases
- You can specify an output file in the `generated/` folder; otherwise, generated code will output to `generated.test.ts`
- Natural language descriptions should be clear and specific to improve AI-generated code quality

**Example Test Case File (tests/login.test.md)**:

```
[TC-0001] [SMOKE] [LOGIN]

# User logs in with valid credentials

- Given the user is on the login page
- When the user enters valid username and password
- And clicks the login button
- Then the user should be redirected to the dashboard
```

### Sample Test Cases

For reference and testing purposes, sample test cases are provided in the `tests/` folder:

- `tests/example.test.md`: Comprehensive test cases for the SauceDemo e-commerce website (https://saucedemo.com), including complete purchase flow and product browsing scenarios with detailed step-by-step descriptions.

You can use these samples to:

1. Test the generator with real-world e-commerce scenarios
2. Understand the level of detail needed in natural language descriptions
3. Generate Playwright code for immediate use and validation

To generate code from a sample test case:

```bash
npx playwright-generator generate --tc TC-SAMPLE-0001
```

### Generation

Playwright test automation code is generated by running a command, with generated code placed in the `generated/` folder under the project root.

- Generated Playwright code is in TypeScript
- The test case ID tag must be specified with the generation command, allowing generation of one test case at a time
- If an output file is specified, the command will either append the generated test case to the file or update it if it already exists
- If no output file is specified, the command will either append to `generated.test.ts` or update the test case if it exists
- The following AI models are supported:
  - **Claude**: Anthropic Claude 3 Haiku API (widely available)
  - **Azure OpenAI**: Azure-hosted OpenAI models (e.g. gpt-4o)
  - **ChatGPT**: OpenAI API (e.g. gpt-4o)
  - **Local LLM**: Any Ollama-compatible local model (e.g. llama3, codellama, qwen2.5-coder, deepseek-coder-v2)

The generator now strips Markdown and explanation text from model output automatically, keeping only the extracted TypeScript test function before writing to `generated/*.test.ts`.

- Credentials (LLM API keys, usernames, passwords) are retrieved from environment variables in the `.env` file for local development; the `.env` file should be ignored by Git

**Generation Commands**:

```bash
# Generate test code (default: claude)
npx playwright-generator generate --tc TC-0001

# Generate with Azure OpenAI
npx playwright-generator generate --tc TC-0001 --model azure-openai

# Generate with ChatGPT
npx playwright-generator generate --tc TC-0001 --model chatgpt

# Generate with local LLM
npx playwright-generator generate --tc TC-0001 --model local

# Generate to specific output file
npx playwright-generator generate --tc TC-0001 --output login.test.ts

# Generate multiple test cases
npx playwright-generator generate --tc TC-0001,TC-0002,TC-0003
```

### Helper Generation

Helpers are reusable TypeScript classes that encapsulate common Playwright actions (e.g. login, navigation, form filling). They are defined in natural language in the `helpers/` folder and generated into `generated/helpers/` as TypeScript classes.

**Helper Definition Format (`helpers/LoginHelper.md`)**:

```
[HELPER: LoginHelper]
# This is a helper class for login related actions

[HELPER-ACTION: login]
## This action is for logging in a user
- go to https://somewebsite.com
- URL https://somewebsite.com/login should be loaded
- input username as "user1"
- input password as "password"
- click the button with text "Log in"
- URL https://somewebsite.com/home should be loaded

[HELPER-ACTION: logout]
## This action is for logging out a user
- click the button with text "Logout"
- URL https://somewebsite.com/login should be loaded
```

**Format Rules**:

- First non-empty line: `[HELPER: HelperName]` — name must start with a letter, contain only letters, numbers, and underscores
- Second non-empty line: `# Description` — description of the helper class
- Each action starts with `[HELPER-ACTION: actionName]` — same naming rules as helper name
- Action description: `## Description` on the next non-empty line
- Action details: bullet points describing the steps
- Each action is generated as a `static async` method on the helper class

**Generation Commands**:

```bash
# Generate a helper class (default: claude)
npx playwright-generator generate-helper LoginHelper

# Generate with a specific model
npx playwright-generator generate-helper LoginHelper --model azure-openai
npx playwright-generator generate-helper LoginHelper --model chatgpt
npx playwright-generator generate-helper LoginHelper --model local
```

**Output**: The generated helper class is written to `generated/helpers/LoginHelper.ts`:

```typescript
import { Page } from "@playwright/test";

/**
 * This is a helper class for login related actions
 */
export class LoginHelper {
  static async login(page: Page): Promise<void> {
    // generated implementation
  }

  static async logout(page: Page): Promise<void> {
    // generated implementation
  }
}
```

**Using helpers in test cases**: Reference the generated helper in your natural language test case descriptions, and the LLM will use it when generating test code:

```
[TC-0001] [SMOKE] [LOGIN]

# User completes a purchase after logging in

- Use LoginHelper.login() to log in
- When the user adds an item to the cart
- Then the user completes checkout
```

### Test Results & Reporting

- Test execution produces detailed reports with pass/fail status
- HTML reports are generated in the `reports/` folder
- Screenshots for failed test cases are automatically captured and stored in the `audit/` folder
- Videos for failed test cases can be captured (disabled by default; enable with `--video` option)
- Test results can be exported in multiple formats (JSON, XML, HTML)
- Audit artifacts help with debugging and root cause analysis of test failures

### Execution and Debugging

Various npm scripts are provided to run and debug Playwright test cases.

Since this is essentially a standard Playwright project, nothing prevents you from using the Playwright CLI commands you are already familiar with. The npm scripts below are provided as convenient shortcuts for common tasks, but you can always fall back to running `npx playwright test` directly with any flags you need.

**Available Commands**:

```bash
# Run all tests
npm run test

# Run tests by tag or test case ID
npm run test:case -- SMOKE
npm run test:case -- TC-0001

# Debug mode (opens inspector)
npm run test:debug -- SMOKE

# Run tests in headed mode with a specific tag
npm run test:headed -- SMOKE

# Run tests with specific browser (set BROWSER=chromium|firefox|webkit in .env)
# and with specific tag
npm run test:browser -- SMOKE

# Run tests with video recording enabled for failed cases (set VIDEO=on-failure in .env) and a specific tag
npm run test:video -- SMOKE

# Generate HTML report
npm run report
```

### Advanced Features

**Parallel Execution**:

- Configure parallel test execution in `playwright.config.ts`
- Default: runs 4 tests in parallel
- Adjust with `fullyParallel` and `workers` settings

**Cross-Browser Testing**:

- Configure browsers in `playwright.config.ts`
- Default: Chromium
- Supported: Chromium, Firefox, WebKit

### CI/CD Integration

GitHub Actions workflow files are created to run Playwright tests automatically:

- **On merge to main**: Runs full test suite
- **Scheduled daily**: Runs at midnight UTC every day
- **On-demand**: Manual trigger available in GitHub Actions UI

Workflow file location: `.github/workflows/playwright-tests.yml`

### Best Practices

1. **Test Case Naming**: Use clear, descriptive names that explain what is being tested
2. **Tags Strategy**: Organize tests with tags (SMOKE, REGRESSION, SANITY, etc.)
3. **AI Prompting**: Write natural language descriptions with:
   - Given-When-Then format for clarity
   - Specific selectors or UI elements mentioned
   - Expected outcomes clearly stated
4. **Code Review**: Always review generated code before committing
5. **Assertions**: Be explicit about what you're asserting
7. **Helper Classes**: Use `generate-helper` to create reusable helper classes for common actions, reducing duplication across test cases

### Troubleshooting

**Common Issues**:

| Issue                               | Solution                                                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API key not found`                 | Verify `.env` file exists and `CLAUDE_API_KEY` or `AZURE_OPENAI_API_KEY` is set                                                                                                                                |
| `Claude API connection failed`      | Check `CLAUDE_API_KEY` is valid and account has Claude API access; ensure key starts with `sk-ant-`. Visit https://console.anthropic.com/ to enable Claude API. Uses Claude 3 Haiku which is widely available. |
| `Tests timing out`                  | Increase `TIMEOUT` in `.env` or use explicit waits in test cases                                                                                                                                               |
| `Generated code doesn't compile`    | Review the natural language description for clarity; regenerate with a refined prompt                                                                                                                          |
| `Tests pass locally but fail in CI` | Check `BASE_URL` environment variable and add debugging with screenshots                                                                                                                                       |
| `Selector not found`                | Ensure selectors are unique and reference current UI state                                                                                                                                                     |
| `Helper definition not found`       | Ensure the helper file exists in `helpers/` and the `[HELPER: Name]` tag matches exactly                                                                                                                       |
| `No HELPER-ACTION sections found`   | Add at least one `[HELPER-ACTION: actionName]` section to the helper definition file                                                                                                                           |
| `ECONNREFUSED` (local LLM)          | Ollama server is not running — run `ollama serve`                                                                                                                                                              |
| `model not found` (local LLM)       | Run `ollama pull <model>` first                                                                                                                                                                                |
| Slow local LLM generation           | Local models are slower than cloud APIs; expect 30–120s; try `mistral` for speed                                                                                                                               |

### GitHub Integration

- GitHub Actions workflows automatically run Playwright tests when code is merged to the main branch
- Tests also run on a scheduled basis (daily at midnight UTC)
- Workflow status badges can be added to the README to display test status

## Local LLM Setup (Ollama)

Run a local LLM with `playwright-generator` using [Ollama](https://ollama.com), which exposes an OpenAI-compatible API on your machine — no API keys or internet access required.

### How It Works

The `local` provider sends requests to `LOCAL_LLM_URL/v1/chat/completions`, the standard endpoint exposed by Ollama. Any other local server that implements the same OpenAI-compatible API (e.g. LM Studio, llama.cpp server) will also work.

### 1. Install Ollama

**macOS / Linux**:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS (Homebrew)**:

```bash
brew install ollama
```

**Windows**: Download the installer from https://ollama.com/download

### 2. Start the Ollama Server

```bash
ollama serve
```

By default, Ollama listens on `http://localhost:11434`. The OpenAI-compatible endpoint is available at `http://localhost:11434/v1/chat/completions`.

### 3. Pull a Model

```bash
# General purpose — good balance of speed and quality
ollama pull llama3

# Smaller / faster — good for low-resource machines
ollama pull mistral

# Code-focused — best results for test generation
ollama pull codellama
```

To list all models you have pulled:

```bash
ollama list
```

### 4. Configure .env

```env
AI_MODEL=local
LOCAL_LLM_URL=http://localhost:11434   # Ollama default; change if using a different port
LOCAL_LLM_MODEL=llama3                 # Must match the model name you pulled
```

### 5. Generate a Test Case

```bash
npx playwright-generator generate --tc TC-0001 --model local
```

Or set `AI_MODEL=local` in `.env` and omit the `--model` flag:

```bash
npx playwright-generator generate --tc TC-0001
```

### Recommended Models

| Model               | Size    | Best For                                  |
| ------------------- | ------- | ----------------------------------------- |
| `llama3`            | ~4.7 GB | General use, good code quality            |
| `codellama`         | ~3.8 GB | Code generation tasks                     |
| `mistral`           | ~4.1 GB | Fast, low memory usage                    |
| `llama3:8b`         | ~8 GB   | Higher quality output                     |
| `deepseek-coder`    | ~3.8 GB | Code-focused, strong TypeScript           |
| `deepseek-coder-v2` | ~8.9 GB | Stronger code quality than v1             |
| `deepseek-r1`       | ~4.7 GB | Reasoning-focused, good for complex logic |
| `qwen2.5-coder`     | ~4.7 GB | Strong TypeScript/code generation         |
| `qwen2.5`           | ~4.7 GB | General use, multilingual                 |

### Qwen Models (by Alibaba)

Qwen models perform well for code generation tasks and are fully supported by Ollama.

```bash
ollama pull qwen2.5-coder       # Recommended for code generation
ollama pull qwen2.5-coder:7b    # Larger variant for higher quality
ollama pull qwen2.5             # General purpose
```

```env
AI_MODEL=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=qwen2.5-coder
```

> Tip: `qwen2.5-coder` is specifically trained on code and tends to produce cleaner TypeScript than general-purpose models of the same size.

### DeepSeek Models (by DeepSeek AI)

DeepSeek offers both code-focused and reasoning models, both fully supported by Ollama.

```bash
ollama pull deepseek-coder-v2   # Code-focused (recommended for test generation)
ollama pull deepseek-r1         # Reasoning model — good for complex multi-step test logic
ollama pull deepseek-coder      # Smaller/faster code model
```

```env
AI_MODEL=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=deepseek-coder-v2
```

> Tip: `deepseek-r1` uses chain-of-thought reasoning internally, which can improve accuracy for complex test cases but is slower than `deepseek-coder-v2`.

### Using LM Studio (Alternative)

[LM Studio](https://lmstudio.ai) also exposes an OpenAI-compatible server:

1. Download and install LM Studio from https://lmstudio.ai
2. Download a model inside the app (e.g. `Meta-Llama-3-8B-Instruct`)
3. Start the local server from the **Local Server** tab (default port: `1234`)
4. Set in `.env`:

```env
AI_MODEL=local
LOCAL_LLM_URL=http://localhost:1234
LOCAL_LLM_MODEL=Meta-Llama-3-8B-Instruct   # Must match the model name shown in LM Studio
```

> Note: Local models are slower than cloud APIs — expect 30–120 seconds per generation depending on hardware. No data leaves your machine.

## VS Code Extension

A VS Code extension is available to provide a graphical interface for `playwright-generator` — configure your AI model, generate test cases and helper classes, and run your tests without leaving the editor.

**Install from the Marketplace**:

[Playwright Generator — VS Code Extension](https://marketplace.visualstudio.com/items?itemName=zhiweiliu.playwright-generator-vscode)

Or search for `Playwright Generator` in the VS Code Extensions panel (`Ctrl+Shift+X`).

### Features

- **Config tab** — configure AI model credentials and Playwright settings; changes are auto-saved to `.env`
- **Generate tab** — browse and search test case IDs from `tests/`; generate TypeScript test code with one click
- **Helpers tab** — browse helper definitions from `helpers/`; see which actions have been generated and generate missing ones
- **Run tab** — run all tests, run by tag, run with UI, debug, and view the last HTML report

### Requirements

- A workspace initialised with `npx playwright-generator init`
- A `.env` file in the workspace root

### Getting Started

1. Install the extension from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=zhiweiliu.playwright-generator-vscode)
2. Open your `playwright-generator` project in VS Code
3. Click the Playwright Generator icon in the Activity Bar
4. Configure your AI model in the **Config** tab
5. Select a test case and click **Generate** in the **Generate** tab
6. Run your tests from the **Run** tab

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and write tests
4. Commit with clear messages: `git commit -m "Add feature: description"`
5. Push to your fork and submit a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/playwright-generator.git
cd playwright-generator

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---
