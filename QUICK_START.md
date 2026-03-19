# Quick Start Guide

## 5-Minute Setup

### Step 1: Install the Generator

```bash
npm install -g @zhiweiliu/playwright-generator
```

Or use it directly with npx:

```bash
npx @zhiweiliu/playwright-generator init my-tests
cd my-tests
```

### Step 2: Initialize Your Project

```bash
playwright-generator init .
```

This creates:

- Folders for tests, generated code, page objects, and utilities
- Configuration files (`.env`, `playwright.config.ts`)
- Example test case
- GitHub Actions workflow

### Step 3: Configure Your API

```bash
# Edit .env file
nano .env

# Add your API credentials:
AI_MODEL=copilot
COPILOT_API_KEY=your_key_here
BASE_URL=http://localhost:3000
```

### Step 4: Write a Test Case

Create `tests/my-feature.test.md`:

```markdown
# [TC-0001] [SMOKE] [AUTHENTICATION]

## Test: Successful login with valid credentials

Given the user is on the login page
When the user enters a valid email
And enters a valid password
And clicks the login button
Then the user should see the dashboard
And the user profile icon should be visible
```

### Step 5: Generate Test Code

```bash
playwright-generator generate --tc TC-0001
```

This creates a Playwright test in `generated/generated.test.ts`

### Step 6: Run Your Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with browser UI visible
npm run test:headed

# Run specific test
npm run test:case -- --tc TC-0001
```

## Common Commands

```bash
# Initialize a project
playwright-generator init [path]

# Generate test code
playwright-generator generate --tc TC-0001

# Generate with specific model
playwright-generator generate --tc TC-0001 --model claude

# Generate multiple tests
playwright-generator generate --tc TC-0001,TC-0002

# Generate to specific file
playwright-generator generate --tc TC-0001 --output features.test.ts

# Show help
playwright-generator --help

# Show test case format help
playwright-generator help:testcases
```

## Important File Locations

- **Test Cases**: `tests/*.test.md` - Write natural language tests here
- **Generated Code**: `generated/*.test.ts` - Auto-generated Playwright code
- **Configuration**: `.env` - Your API keys and settings
- **Page Objects**: `page-objects/*.ts` - Reusable page interactions
- **Utilities**: `utils/*.ts` - Helper functions
- **Failed Test Artifacts**: `audit/screenshots/` - Screenshots from failures

## Test Case Format

Essential tags:

- `[TC-XXXX]` - Unique test ID (required)
- `[TAG-NAME]` - Grouping tags (optional)

Format:

```
# [TC-XXXX] [TAG1] [TAG2]

## Test: Description

Given precondition
When action
Then expected result
```

## Tips for Better Results

1. **Be specific** - Mention element types (button, input, etc.)
2. **Use clear language** - AI understands simple, direct instructions
3. **Follow Given-When-Then** - Standard BDD format works best
4. **One feature per test** - Easier to debug if something fails
5. **Review generated code** - Always check AI-generated code before running
6. **Use page objects** - For maintainability as your test suite grows

## Supported AI Models

- **Copilot** (default): `AI_MODEL=copilot`
  - Requires: `COPILOT_API_KEY`
- **Claude**: `AI_MODEL=claude`
  - Requires: `CLAUDE_API_KEY`

## Troubleshooting

**"API key not found"**

```bash
# Check your .env file
cat .env

# Ensure it has the right key
COPILOT_API_KEY=your_actual_key
```

**"Tests timing out"**

```bash
# Increase timeout in .env
TIMEOUT=60000  # 60 seconds
```

**"Element not found"**

- Check if selectors in generated code match your application
- Review the test case description for clarity
- Regenerate with more specific instructions

## Next Steps

1. ✅ Initialize project
2. ✅ Configure API credentials
3. ✅ Write test case
4. ✅ Generate code
5. ✅ Review and run
6. 📊 Integrate with CI/CD
7. 📈 Scale your test suite

## Documentation

- Full README: See [README.md](./README.md)
- Implementation details: See [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- Test format help: `playwright-generator help:testcases`

## Getting Help

```bash
# General help
playwright-generator --help

# Command-specific help
playwright-generator init --help
playwright-generator generate --help

# Test case format
playwright-generator help:testcases
```

Happy testing! 🎭
