# Playwright LLM Test Case Generator

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
  - [Test Results & Reporting](#test-results--reporting)
  - [Execution and Debugging](#execution-and-debugging)
  - [Advanced Features](#advanced-features)
  - [CI/CD Integration](#cicd-integration)
  - [Best Practices](#best-practices)
  - [Troubleshooting](#troubleshooting)
  - [GitHub Integration](#github-integration)
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

The installed module will have amazing features to facilitate your day-to-day test automation tasks.

## Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher
- **Git**: For version control integration
- **LLM API Access** (optional): Depending on your AI model choice
  - Copilot: GitHub Copilot API credentials
  - Claude: Anthropic API key

## Installation & Quick Start

1. **Install the generator**:

   ```bash
   npm install -g @zhiweiliu/playwright-generator
   ```

2. **Initialize a new project**:

   ```bash
   npx playwright-generator init
   ```

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
├── tests/                    # Natural language test cases
│   └── *.test.md
├── generated/                # Generated Playwright test code
│   └── generated.test.ts
├── page-objects/             # Page Object Models (optional)
│   └── *.po.ts
├── utils/                    # Helper utilities
│   └── *.ts
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
AI_MODEL=copilot                    # Options: copilot, claude
COPILOT_API_KEY=your_key_here       # Required if using Copilot
CLAUDE_API_KEY=your_key_here        # Required if using Claude

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
User logs in with valid credentials
Given the user is on the login page
When the user enters valid username and password
And clicks the login button
Then the user should be redirected to the dashboard
```

### Generation

Playwright test automation code is generated by running a command, with generated code placed in the `generated/` folder under the project root.

- Generated Playwright code is in TypeScript
- The test case ID tag must be specified with the generation command, allowing generation of one test case at a time
- If an output file is specified, the command will either append the generated test case to the file or update it if it already exists
- If no output file is specified, the command will either append to `generated.test.ts` or update the test case if it exists
- The following AI models are supported (specify with generation command; Copilot is used by default):
  - **Copilot**: GitHub Copilot API
  - **Claude**: Anthropic Claude API
- Credentials (LLM API keys, usernames, passwords) are retrieved from environment variables in the `.env` file for local development; the `.env` file should be ignored by Git

**Generation Commands**:

```bash
# Generate with default model (Copilot)
npx playwright-generator generate --tc TC-0001

# Generate with specific model
npx playwright-generator generate --tc TC-0001 --model claude

# Generate to specific output file
npx playwright-generator generate --tc TC-0001 --output login.test.ts

# Generate multiple test cases
npx playwright-generator generate --tc TC-0001,TC-0002,TC-0003
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

**Available Commands**:

```bash
# Run all tests
npm test

# Run tests by specific tag
npm run test:tag -- --tag SMOKE

# Run a specific test case
npm run test:case -- --tc TC-0001

# Debug mode (opens inspector)
npm run test:debug -- --tag SMOKE

# Run tests in headed mode (see browser UI)
npm run test:headed

# Run tests with specific browser
npm run test:browser -- --browser firefox

# Run tests with video recording enabled for failed cases
npm test -- --video on-failure

# Generate HTML report
npm run report
```

### Advanced Features

**Page Object Models (POM)**:

- Create reusable page objects in the `page-objects/` folder to improve test maintainability
- Example: `page-objects/login.po.ts` for login page interactions
- Reference page objects in your natural language test cases for better structure

**Test Utilities**:

- Helper functions available in `utils/` for common operations (wait strategies, error handling, etc.)
- Custom assertions and reporters can be added for specialized testing needs

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
5. **Page Objects**: Use POM for maintainability as your test suite grows
6. **Assertions**: Be explicit about what you're asserting
7. **Wait Strategies**: Use Playwright's built-in auto-waiting; avoid hardcoded waits

### Troubleshooting

**Common Issues**:

| Issue                               | Solution                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `API key not found`                 | Verify `.env` file exists and `COPILOT_API_KEY` or `CLAUDE_API_KEY` is set            |
| `Tests timing out`                  | Increase `TIMEOUT` in `.env` or use explicit waits in test cases                      |
| `Generated code doesn't compile`    | Review the natural language description for clarity; regenerate with a refined prompt |
| `Tests pass locally but fail in CI` | Check `BASE_URL` environment variable and add debugging with screenshots              |
| `Selector not found`                | Ensure selectors are unique and reference current UI state                            |

### GitHub Integration

- GitHub Actions workflows automatically run Playwright tests when code is merged to the main branch
- Tests also run on a scheduled basis (daily at midnight UTC)
- Workflow status badges can be added to the README to display test status

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

**Happy Testing! 🎭**
