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
      const fullFileContent = await fs.readFile(testCaseFile, "utf-8");

      // Extract only the specific test case content
      const testCaseContent = extractTestCaseContent(
        fullFileContent,
        testCaseId,
      );

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
function extractTestCaseContent(
  fileContent: string,
  testCaseId: string,
): string {
  const lines = fileContent.split("\n");
  let startIndex = -1;
  let endIndex = lines.length;

  // Find the line with the test case ID
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`[${testCaseId}]`)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error(`Test case [${testCaseId}] not found in file`);
  }

  // Find the start of this test case (previous "## Test Case:" or beginning of file)
  for (let i = startIndex - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith("## Test Case:")) {
      startIndex = i;
      break;
    }
    if (i === 0) {
      startIndex = 0;
    }
  }

  // Find the end of this test case (next "## Test Case:" or end of file)
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith("## Test Case:") && i > startIndex) {
      endIndex = i;
      break;
    }
  }

  // Extract the test case content
  const testCaseLines = lines.slice(startIndex, endIndex);
  return testCaseLines.join("\n").trim();
}
function extractTags(testCaseContent: string): string[] {
  const tagRegex = /\[([A-Z0-9\-]+)\]/g;
  const matches = testCaseContent.match(tagRegex) || [];
  return matches.map((tag) => tag.slice(1, -1)).filter((tag) => tag.length > 0);
}

export function extractTypeScriptCode(raw: string): string {
  // Try fencing blocks first, picking the longest snippet (best chance of complete function)
  const fenceRegex = /```(?:ts|typescript|javascript)?\s*\n([\s\S]*?)\n```/gi;
  const fenceMatches = [...raw.matchAll(fenceRegex)];

  if (fenceMatches.length > 0) {
    const codeBlocks = fenceMatches
      .map((m) => m[1]?.trim() || "")
      .filter(Boolean);

    if (codeBlocks.length > 0) {
      const best = codeBlocks.reduce(
        (prev, curr) => (curr.length > prev.length ? curr : prev),
        "",
      );
      return best.trim();
    }
  }

  // If no fenced blocks, extract the first complete test() function
  const testIndex = raw.indexOf("test(");
  if (testIndex !== -1) {
    const arrowIndex = raw.indexOf("=>", testIndex);
    let bodyStartIndex = raw.indexOf("{", testIndex);

    if (arrowIndex !== -1) {
      const arrowBodyIndex = raw.indexOf("{", arrowIndex);
      if (arrowBodyIndex !== -1) {
        bodyStartIndex = arrowBodyIndex;
      }
    }

    if (bodyStartIndex === -1) {
      return raw.slice(testIndex).trim();
    }

    let braceCount = 1;
    let inString = false;
    let stringChar = "";
    let escaped = false;
    let endIndex = -1;

    for (let i = bodyStartIndex + 1; i < raw.length; i++) {
      const char = raw[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        continue;
      }

      if (inString && char === stringChar) {
        inString = false;
        stringChar = "";
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      return raw.slice(testIndex, endIndex).trim();
    }

    // If brace matching fails, keep raw from test( to end as fallback
    return raw.slice(testIndex).trim();
  }

  // Last resort: return the entire input trimmed
  return raw.trim();
}

async function appendTestCodeToFile(
  filePath: string,
  generatedCode: string,
  testCaseId: string,
): Promise<void> {
  let code = extractTypeScriptCode(generatedCode);
  let currentContent = await fs.readFile(filePath, "utf-8");

  const playwrightImport = "import { test, expect } from '@playwright/test';";
  if (currentContent.includes(playwrightImport)) {
    code = code
      .split("\n")
      .filter((line) => line.trim() !== playwrightImport)
      .join("\n")
      .trim();
  }

  // Remove all existing occurrences of this test case ID to make latest output win.
  while (true) {
    const idIndex = currentContent.indexOf(testCaseId);
    if (idIndex === -1) break;

    // Find beginning of enclosing test block
    const startIndex = currentContent.lastIndexOf("test(", idIndex);
    if (startIndex === -1) {
      // If we can't find enclosing test block, remove just the literal ID and continue.
      currentContent =
        currentContent.slice(0, idIndex) +
        currentContent.slice(idIndex + testCaseId.length);
      continue;
    }

    // Determine end of enclosing test block (next `test(` or end of file)
    const nextTestIndex = currentContent.indexOf("test(", startIndex + 1);
    const endIndex =
      nextTestIndex !== -1 ? nextTestIndex : currentContent.length;

    currentContent =
      currentContent.slice(0, startIndex).trimEnd() +
      "\n\n" +
      currentContent.slice(endIndex).trimStart();
  }

  // Append latest code
  if (!currentContent.endsWith("\n\n")) {
    currentContent += "\n\n";
  }
  currentContent += code + "\n";

  await fs.writeFile(filePath, currentContent);
}
