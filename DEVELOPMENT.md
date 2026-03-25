# Development Guide

## Project Overview

This is a TypeScript/Node.js project that implements an npm CLI tool (`@zhiweiliu/playwright-generator`) for generating Playwright test cases from natural language using Large Language Models.

## Development Setup

### Prerequisites

- Node.js 16.0 or higher
- npm 7.0 or higher
- TypeScript knowledge
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/playwright-generator.git
cd playwright-generator

# Install dependencies
npm install

# Build the project
npm run build

# Test the CLI
node dist/cli.js --help
```

## Project Structure

```
playwright-generator/
├── src/
│   ├── cli.ts                 # Main CLI entry point with Commander.js
│   ├── config.ts              # Configuration management (environment variables)
│   ├── index.ts               # Library exports
│   ├── commands/
│   │   ├── init.ts            # Project initialization command
│   │   └── generate.ts        # Test code generation command
│   └── llm/
│       ├── provider.ts        # Abstract LLM provider base class
│       ├── azure-openai.ts    # Azure OpenAI integration
│       ├── claude.ts          # Anthropic Claude integration
│       └── index.ts           # LLM factory for provider instantiation
├── dist/                      # Compiled TypeScript (generated)
├── package.json               # NPM dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── LICENSE                    # MIT License
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation

```

## Architecture

### LLM Provider Pattern

The project uses a factory pattern for LLM providers:

```typescript
// Abstract base
abstract class LLMProvider
  ├── generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode>
  └── validateConnection(): Promise<boolean>

// Implementations
├── AzureOpenAIProvider (extends LLMProvider)
└── ClaudeProvider (extends LLMProvider)

// Factory
LLMFactory.createProvider(): LLMProvider
```

### Configuration Singleton

```typescript
ConfigManager.getInstance().getConfig()
  ├── aiModel: 'claude' | 'azure-openai'
  ├── apiKeys
  ├── playwrightSettings
  └── executionConfig
```

## Development Commands

```bash
# Build
npm run build

# Run dev version (requires ts-node)
npm run dev generate --tc TC-0001

# Test (Jest)
npm test

# Create distribution
npm run build && npm pack
```

## Adding a New LLM Provider

1. Create a new file in `src/llm/` (e.g., `gpt4.ts`)

```typescript
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class GPT4Provider extends LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    if (!apiKey) throw new Error("GPT4 API key required");
    this.apiKey = apiKey;
  }

  async validateConnection(): Promise<boolean> {
    // Implement validation
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    // Implement code generation
  }
}
```

2. Update `src/llm/index.ts` to support the new provider

```typescript
if (config.aiModel === "gpt4") {
  if (!config.gpt4ApiKey) {
    throw new Error("GPT4_API_KEY is required");
  }
  return new GPT4Provider(config.gpt4ApiKey);
}
```

3. Add environment variable to `.env.example`

```env
GPT4_API_KEY=your_key_here
```

## Adding a New Command

1. Create `src/commands/your-command.ts`

```typescript
export async function yourCommand(
  projectRoot: string,
  options: any,
): Promise<void> {
  // Implementation
}
```

2. Register in `src/cli.ts`

```typescript
program
  .command("your-command")
  .description("Description")
  .option("-x, --option <value>", "Option description")
  .action(async (options) => {
    try {
      await yourCommand(process.cwd(), options);
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });
```

## Code Style

### TypeScript

- Use strict mode (`"strict": true` in tsconfig.json)
- Use explicit type annotations
- Use async/await for promises
- Use const for immutability

### File Organization

```typescript
// Imports first
import { Something } from "module";

// Types/Interfaces
interface MyInterface {
  property: type;
}

// Classes/Functions
export class MyClass {
  // Implementation
}

// Exports
export { MyClass };
```

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  throw new Error(
    `Context: ${error instanceof Error ? error.message : String(error)}`,
  );
}
```

## Testing Strategy

### Current Tests

- Manual testing of CLI commands
- Verify init creates correct structure
- Verify generate handles test case files

### Recommended Test Coverage

```typescript
// Unit tests for each module
describe("ConfigManager", () => {
  it("should load config from environment", () => {
    // Test
  });
});

// Integration tests for commands
describe("init command", () => {
  it("should create project structure", () => {
    // Test
  });
});

// E2E tests
describe("Full workflow", () => {
  it("should generate valid test code", () => {
    // Test
  });
});
```

## API Rate Limiting

Keep in mind when adding features:

- Azure OpenAI API has token limits
- Claude API has token limits
- Consider caching generated code
- Implement retry logic with exponential backoff

## Configuration Management

Extension points:

- Add new environment variables in `config.ts`
- Extend `Config` interface
- Update initialization in `ConfigManager.loadConfig()`
- Update validation in `ConfigManager.validateConfig()`

## Debugging

### Enable verbose logging

```typescript
// In your code
if (process.env.DEBUG) {
  console.log("Debug info:", value);
}
```

### Run with debugging

```bash
# With Node debugger
node --inspect dist/cli.js init test-project

# Or run TypeScript directly
npm run dev init test-project
```

## Publishing to NPM

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Test thoroughly: `npm run build`
4. Create Git tag: `git tag v1.0.0`
5. Publish: `npm publish`

## Performance Considerations

- LLM API calls are the bottleneck (30+ seconds typical)
- Consider caching API responses
- Consider implementing parallel generation
- Monitor memory usage for large test files
- Consider streaming responses for large outputs

## Security

- ✅ API keys stored in `.env` (not in VCS)
- ✅ Never log API keys
- ✅ Validate all user inputs
- ✅ Sanitize generated code (review requirement)
- ✅ Use HTTPS for API calls

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Update documentation
4. Commit with clear messages: `git commit -m "Add feature: description"`
5. Push and create Pull Request

## Future Enhancements

- [ ] Support for more LLM providers (GPT-4, Llama, etc.)
- [ ] Test data management utilities
- [ ] Advanced Page Object templates
- [ ] Test report visualization dashboard
- [ ] Integration with test management tools (TestRail, etc.)
- [ ] Continuous test optimization
- [ ] AI-powered test failure analysis
- [ ] Multi-language support

## Troubleshooting Development

**Module not found errors**

```bash
npm install
npm run build
```

**TypeScript errors**

```bash
npx tsc --noEmit  # Check for errors
npm run build     # Rebuild
```

**CLI not working**

```bash
# Ensure build succeeded
npm run build

# Test directly
node dist/cli.js --version
```

**API connection issues**

```bash
# Check environment variables
echo $CLAUDE_API_KEY

# Verify in .env
cat .env
```

## Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Playwright Documentation](https://playwright.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)

## Contact & Support

For development questions:

1. Check existing issues on GitHub
2. Review documentation in README.md
3. Check IMPLEMENTATION.md for architecture details
4. Ask in GitHub Discussions

Happy coding! 🚀
