import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import chalk from "chalk";
import { LLMFactory } from "../llm";
import { LLMPrompt } from "../llm/provider";
import configManager from "../config";

export interface GenerateOptions {
  testCaseIds?: string[];
  model?: "claude" | "azure-openai" | "chatgpt" | "local";
  outputFile?: string;
}

// Normalise Windows backslashes to forward slashes for glob
function toGlobPath(p: string): string {
  return p.split(path.sep).join("/");
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

    // Override model from CLI flag before creating the provider
    if (options.model) {
      configManager.setModel(options.model);
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

    const outputFilePath = options.outputFile
      ? path.join(generatedDir, options.outputFile)
      : path.join(generatedDir, "generated.test.ts");

    // Ensure output file exists with imports if it's new
    if (!fs.existsSync(outputFilePath)) {
      await fs.writeFile(outputFilePath, `import { test, expect } from '@playwright/test';\n\n`);
    }

    for (const testCaseId of options.testCaseIds) {
      console.log(chalk.blue(`\nGenerating test case: ${testCaseId}...`));

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

      const fullFileContent = await fs.readFile(testCaseFile, "utf-8");
      const testCaseContent = extractTestCaseContent(fullFileContent, testCaseId);
      const tags = extractTags(testCaseContent);

      const prompt: LLMPrompt = {
        testCase: testCaseContent,
        testCaseId: testCaseId,
        tags: tags,
      };

      const generatedCode = await llmProvider.generateTestCode(prompt);

      await appendTestCodeToFile(outputFilePath, generatedCode.code, testCaseId, tags);

      console.log(chalk.green(`✓ Generated test case: ${testCaseId}`));
    }

    console.log(chalk.green.bold(`\n✓ Code generation completed!`));
    console.log(chalk.cyan(`Generated file: ${path.relative(projectRoot, outputFilePath)}`));
    console.log(chalk.cyan("Next: Review the generated code and run: npm test"));
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
    const files = await glob(toGlobPath(path.join(testsDir, "**/*.test.md")), { windowsPathsNoEscape: true });

    for (const file of files) {
      const nativePath = file.split("/").join(path.sep);
      const content = await fs.readFile(nativePath, "utf-8");
      if (content.includes(`[${testCaseId}]`)) {
        return nativePath;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding test case file:", error);
    return null;
  }
}

async function findDuplicateTestCaseIds(testsDir: string): Promise<string[]> {
  const files = await glob(toGlobPath(path.join(testsDir, "**/*.test.md")), { windowsPathsNoEscape: true });
  const idMap: Record<string, number> = {};
  const idRegex = /\[TC-[A-Z0-9_-]+\]/gi;

  for (const file of files) {
    const nativePath = file.split("/").join(path.sep);
    const content = await fs.readFile(nativePath, "utf-8");
    const matches = content.match(idRegex) || [];

    for (const match of matches) {
      const normalizedId = match.trim().slice(1, -1).toUpperCase();
      idMap[normalizedId] = (idMap[normalizedId] || 0) + 1;
    }
  }

  return Object.keys(idMap).filter((id) => idMap[id] > 1);
}

function extractTestCaseContent(fileContent: string, testCaseId: string): string {
  const lines = fileContent.replace(/\r\n/g, "\n").split("\n");
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`[${testCaseId}]`)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error(`Test case [${testCaseId}] not found in file`);
  }

  for (let i = startIndex - 1; i >= 0; i--) {
    if (/^#{1,2}\s+Test Case:/i.test(lines[i].trim())) {
      startIndex = i;
      break;
    }
    if (i === 0) {
      startIndex = 0;
    }
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^#{1,2}\s+Test Case:/i.test(lines[i].trim()) && i > startIndex) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n").trim();
}

function extractTags(testCaseContent: string): string[] {
  const tagLine = testCaseContent.split("\n").find(line => /\[TC-[A-Z0-9_-]+\]/i.test(line)) || "";
  const tagRegex = /\[([A-Z0-9][A-Z0-9\-]*[A-Z0-9])\]/g;
  const matches = [...tagLine.matchAll(tagRegex)];
  return matches.map(m => m[1]).filter(t => t.length > 0);
}

export function extractTypeScriptCode(raw: string): string {
  const fenceRegex = /```(?:ts|typescript|javascript)?\s*\n([\s\S]*?)\n```/gi;
  const fenceMatches = [...raw.matchAll(fenceRegex)];

  if (fenceMatches.length > 0) {
    const codeBlocks = fenceMatches
      .map((m) => m[1]?.trim() || "")
      .filter(Boolean);

    if (codeBlocks.length > 0) {
      return codeBlocks.reduce(
        (prev, curr) => (curr.length > prev.length ? curr : prev),
        "",
      ).trim();
    }
  }

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

      if (escaped) { escaped = false; continue; }
      if (char === "\\") { escaped = true; continue; }

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

    return raw.slice(testIndex).trim();
  }

  return raw.trim();
}

async function appendTestCodeToFile(
  filePath: string,
  generatedCode: string,
  testCaseId: string,
  tags: string[],
): Promise<void> {
  let code = extractTypeScriptCode(generatedCode);

  const tagString = tags.map(t => `[${t}]`).join(" ");
  code = code.replace(
    /^(test\s*\(\s*['"`])(.+?)(['"`])/m,
    (_, open, title, close) => {
      const stripped = title.replace(/\[[A-Z0-9\-]+\]\s*/g, "").trim();
      return `${open}${tagString} ${stripped}${close}`;
    }
  );

  let currentContent = await fs.readFile(filePath, "utf-8");

  const playwrightImport = "import { test, expect } from '@playwright/test';";
  if (currentContent.includes(playwrightImport)) {
    code = code
      .split("\n")
      .filter((line) => line.trim() !== playwrightImport)
      .join("\n")
      .trim();
  }

  while (true) {
    const idIndex = currentContent.indexOf(testCaseId);
    if (idIndex === -1) break;

    const startIndex = currentContent.lastIndexOf("test(", idIndex);
    if (startIndex === -1) {
      currentContent =
        currentContent.slice(0, idIndex) +
        currentContent.slice(idIndex + testCaseId.length);
      continue;
    }

    const nextTestIndex = currentContent.indexOf("test(", startIndex + 1);
    const endIndex = nextTestIndex !== -1 ? nextTestIndex : currentContent.length;

    currentContent =
      currentContent.slice(0, startIndex).trimEnd() +
      "\n\n" +
      currentContent.slice(endIndex).trimStart();
  }

  if (!currentContent.endsWith("\n\n")) {
    currentContent += "\n\n";
  }
  currentContent += code + "\n";

  await fs.writeFile(filePath, currentContent);
}
