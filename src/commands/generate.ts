import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import chalk from "chalk";
import { LLMFactory } from "../llm";
import { LLMPrompt } from "../llm/provider";

export interface GenerateOptions {
  testCaseIds?: string[];
  model?: "copilot" | "claude";
  outputFile?: string;
}

export async function generateTestCode(
  projectRoot: string,
  options: GenerateOptions,
): Promise<void> {
  try {
    if (!options.testCaseIds || options.testCaseIds.length === 0) {
      throw new Error(
        "Please specify at least one test case ID with --tc flag",
      );
    }

    const llmProvider = LLMFactory.createProvider();

    // Validate LLM connection
    console.log(chalk.blue("Validating LLM connection..."));
    const isConnected = await llmProvider.validateConnection();
    if (!isConnected) {
      console.warn(
        chalk.yellow("⚠ Warning: Could not validate LLM connection"),
      );
    } else {
      console.log(chalk.green("✓ LLM connection validated"));
    }

    const testsDir = path.join(projectRoot, "tests");
    const generatedDir = path.join(projectRoot, "generated");

    // Ensure unique test case IDs across all test files
    const duplicateIds = await findDuplicateTestCaseIds(testsDir);
    if (duplicateIds.length > 0) {
      throw new Error(
        `Duplicate test case ID(s) found across test files: ${duplicateIds.join(", ")}. Please ensure each [TC-xxxx] is unique.`,
      );
    }

    // Ensure generated directory exists
    await fs.ensureDir(generatedDir);

    let outputFilePath = options.outputFile
      ? path.join(generatedDir, options.outputFile)
      : path.join(generatedDir, "generated.test.ts");

    // Ensure output file exists with imports if it's new
    if (!fs.existsSync(outputFilePath)) {
      const header = `import { test, expect } from '@playwright/test';\n\n`;
      await fs.writeFile(outputFilePath, header);
    }

    for (const testCaseId of options.testCaseIds) {
      console.log(chalk.blue(`\\nGenerating test case: ${testCaseId}...`));

      // Find the test case file
      const testCaseFile = await findTestCaseFile(testsDir, testCaseId);

      if (!testCaseFile) {
        console.error(
          chalk.red(`✗ Test case file not found for: ${testCaseId}`),
        );
        continue;
      }

      console.log(
        chalk.gray(`Found: ${path.relative(projectRoot, testCaseFile)}`),
      );

      // Read test case content
      const testCaseContent = await fs.readFile(testCaseFile, "utf-8");

      // Extract tags
      const tags = extractTags(testCaseContent);

      // Create LLM prompt
      const prompt: LLMPrompt = {
        testCase: testCaseContent,
        testCaseId: testCaseId,
        tags: tags,
      };

      // Generate code
      const generatedCode = await llmProvider.generateTestCode(prompt);

      // Append to output file
      await appendTestCodeToFile(
        outputFilePath,
        generatedCode.code,
        testCaseId,
      );

      console.log(chalk.green(`✓ Generated test case: ${testCaseId}`));
    }

    console.log(chalk.green.bold(`\\n✓ Code generation completed!`));
    console.log(
      chalk.cyan(
        `Generated file: ${path.relative(projectRoot, outputFilePath)}`,
      ),
    );
    console.log(
      chalk.cyan("Next: Review the generated code and run: npm test"),
    );
  } catch (error) {
    console.error(chalk.red("Error generating test code:"), error);
    throw error;
  }
}

async function findTestCaseFile(
  testsDir: string,
  testCaseId: string,
): Promise<string | null> {
  try {
    const files = await glob(path.join(testsDir, "**/*.test.md"));

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      if (content.includes(`[${testCaseId}]`)) {
        return file;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding test case file:", error);
    return null;
  }
}

async function findDuplicateTestCaseIds(testsDir: string): Promise<string[]> {
  const files = await glob(path.join(testsDir, "**/*.test.md"));
  const idMap: Record<string, number> = {};
  const idRegex = /\[TC-[A-Z0-9_-]+\]/gi;

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const matches = content.match(idRegex) || [];

    for (const match of matches) {
      const normalizedId = match.trim().slice(1, -1);
      idMap[normalizedId] = (idMap[normalizedId] || 0) + 1;
    }
  }

  return Object.keys(idMap).filter((id) => idMap[id] > 1);
}

function extractTags(testCaseContent: string): string[] {
  const tagRegex = /\[([A-Z0-9\-]+)\]/g;
  const matches = testCaseContent.match(tagRegex) || [];
  return matches.map((tag) => tag.slice(1, -1)).filter((tag) => tag.length > 0);
}

function extractTypeScriptCode(raw: string): string {
  const fenceRegex = /```(?:ts|typescript)?\s*\n([\s\S]*?)\n```/i;
  const fenceMatch = raw.match(fenceRegex);

  if (fenceMatch && fenceMatch[1]?.trim()) {
    return fenceMatch[1].trim();
  }

  const testIndex = raw.indexOf("test(");
  if (testIndex !== -1) {
    return raw.slice(testIndex).trim();
  }

  return raw.trim();
}

async function appendTestCodeToFile(
  filePath: string,
  generatedCode: string,
  testCaseId: string,
): Promise<void> {
  const code = extractTypeScriptCode(generatedCode);
  let currentContent = await fs.readFile(filePath, "utf-8");

  // Check if test case already exists
  const testCaseRegex = new RegExp(
    `test\\(['\`"].*?${testCaseId}.*?['\`"].*?\\)\\s*=>\\s*{[^}]*}`,
    "s",
  );

  if (testCaseRegex.test(currentContent)) {
    // Replace existing test case
    const updatedContent = currentContent.replace(testCaseRegex, code);
    await fs.writeFile(filePath, updatedContent);
  } else {
    // Append new test case
    if (!currentContent.endsWith("\n\n")) {
      currentContent += "\n\n";
    }
    currentContent += code + "\n";
    await fs.writeFile(filePath, currentContent);
  }
}
