#!/usr/bin/env node

import { Command } from "commander";
import { initializeProject } from "./commands/init";
import { generateTestCode } from "./commands/generate";
import { generateHelper } from "./commands/generate-helper";
import chalk from "chalk";

const program = new Command();

program
  .name("playwright-generator")
  .description("Generate Playwright test cases from natural language using LLM")
  .version("1.0.57");

// Init command
program
  .command("init [projectPath]")
  .description("Initialize a new Playwright test project")
  .action(async (projectPath) => {
    const targetPath = projectPath || process.cwd();
    try {
      await initializeProject(targetPath);
    } catch (error) {
      process.exit(1);
    }
  });

// Generate command
program
  .command("generate")
  .description("Generate Playwright test code from natural language test cases")
  .option(
    "-tc, --tc <testCaseIds>",
    "Comma-separated test case IDs (e.g., TC-0001,TC-0002)",
  )
  .option(
    "-m, --model <model>",
    "LLM model to use (claude, azure-openai, chatgpt or local)",
  )
  .option(
    "-o, --output <outputFile>",
    "Output file name (relative to generated/ folder)",
  )
  .action(async (options) => {
    try {
      if (!options.tc) {
        console.error(chalk.red("Error: Test case IDs are required"));
        console.log(
          "Usage: playwright-generator generate --tc TC-0001 [--tc TC-0002 ...]",
        );
        process.exit(1);
      }

      const testCaseIds = options.tc.split(",").map((id: string) => id.trim());
      const projectRoot = process.cwd();

      await generateTestCode(projectRoot, {
        testCaseIds,
        model: options.model,
        outputFile: options.output,
      });
    } catch (error) {
      console.error(
        chalk.red("Generation failed"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Generate-helper command
program
  .command("generate-helper <helperName>")
  .description(
    "Generate a Playwright helper class from a natural language definition in helpers/",
  )
  .option(
    "-m, --model <model>",
    "LLM model to use (claude, azure-openai, chatgpt or local)",
  )
  .action(async (helperName, options) => {
    try {
      await generateHelper(process.cwd(), {
        helperName,
        model: options.model,
      });
    } catch (error) {
      console.error(
        chalk.red("Helper generation failed"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Help for test case format
program
  .command("help:testcases")
  .description("Show help about test case format")
  .action(() => {
    console.log(
      chalk.cyan(`
Test Case Format
================

Test cases should be written in Markdown format in the tests/ directory.
File name: *.test.md

Format:
-------
[TC-XXXX] [TAG1] [TAG2]

# Test case title

- Given the initial state or precondition
- When the user performs an action
- And additional actions
- Then expected result should occur
- And another expected result

Example:
--------
[TC-0001] [SMOKE] [LOGIN]

# User logs in with valid credentials

- Given the user is on the login page
- When the user enters username and password
- And clicks the login button
- Then the user should see the dashboard
- And the welcome message should contain the user name

Tags:
-----
- [TC-XXXX] - Required: Unique test case identifier
- [TAG-NAME] - Optional: Tag for grouping tests (SMOKE, REGRESSION, etc.)

Tips for better AI-generated code:
----------------------------------
1. Use clear, specific language
2. Mention element types (button, input, link, etc.)
3. Include exact text or identifiers when possible
4. Use Given-When-Then structure with bullet points (-) for clarity
5. Keep test cases focused on one feature
6. Review generated code before committing
    `),
    );
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
