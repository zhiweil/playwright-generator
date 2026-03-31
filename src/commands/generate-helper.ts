import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { LLMFactory } from "../llm";
import { HelperPrompt } from "../llm/provider";
import configManager from "../config";

export interface GenerateHelperOptions {
  helperName: string;
  model?: "claude" | "azure-openai" | "chatgpt" | "local";
}

interface HelperAction {
  name: string;
  description: string;
  details: string;
}

interface HelperDefinition {
  name: string;
  description: string;
  actions: HelperAction[];
}

// Recursively find all files matching a suffix under a directory
function findFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) { return results; }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, suffix));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      results.push(full);
    }
  }
  return results;
}

async function findHelperFile(helpersDir: string, helperName: string): Promise<string | null> {
  const files = findFiles(helpersDir, ".md");
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    if (content.includes(`[HELPER: ${helperName}]`)) {
      return file;
    }
  }
  return null;
}

function parseHelperDefinition(content: string, helperName: string): HelperDefinition {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  // Find the HELPER tag line
  const helperTagIndex = lines.findIndex(l => l.includes(`[HELPER: ${helperName}]`));
  if (helperTagIndex === -1) {
    throw new Error(`[HELPER: ${helperName}] not found in file`);
  }

  // Description is the next non-empty line starting with #
  let description = "";
  for (let i = helperTagIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("#")) {
      description = trimmed.replace(/^#+\s*/, "").trim();
      break;
    }
  }

  // Parse actions
  const actions: HelperAction[] = [];
  const actionRegex = /^\[HELPER-ACTION:\s*([A-Za-z][A-Za-z0-9_]*)\]/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(actionRegex);
    if (!match) { continue; }

    const actionName = match[1];

    // Action description: next non-empty line starting with ##
    let actionDescription = "";
    let detailsStart = i + 1;
    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed.startsWith("##")) {
        actionDescription = trimmed.replace(/^#+\s*/, "").trim();
        detailsStart = j + 1;
        break;
      }
    }

    // Details: everything until next [HELPER-ACTION:] or end of file
    let detailsEnd = lines.length;
    for (let j = detailsStart; j < lines.length; j++) {
      if (actionRegex.test(lines[j])) {
        detailsEnd = j;
        break;
      }
    }

    const details = lines.slice(detailsStart, detailsEnd).join("\n").trim();
    actions.push({ name: actionName, description: actionDescription, details });
  }

  return { name: helperName, description, actions };
}

function extractMethodCode(raw: string, actionName: string): string {
  // Try fenced code block first
  const fenceRegex = /```(?:ts|typescript)?\s*\n([\s\S]*?)\n```/gi;
  const fenceMatches = [...raw.matchAll(fenceRegex)];
  if (fenceMatches.length > 0) {
    const best = fenceMatches
      .map(m => m[1]?.trim() || "")
      .filter(Boolean)
      .reduce((a, b) => (b.length > a.length ? b : a), "");
    if (best) { return best; }
  }

  // Fall back to extracting the static method
  const methodIndex = raw.indexOf(`static async ${actionName}`);
  if (methodIndex === -1) { return raw.trim(); }

  const bodyStart = raw.indexOf("{", methodIndex);
  if (bodyStart === -1) { return raw.slice(methodIndex).trim(); }

  let braceCount = 1;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = bodyStart + 1; i < raw.length; i++) {
    const char = raw[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (!inString && (char === '"' || char === "'" || char === "`")) { inString = true; stringChar = char; continue; }
    if (inString && char === stringChar) { inString = false; continue; }
    if (!inString) {
      if (char === "{") { braceCount++; }
      else if (char === "}") { braceCount--; if (braceCount === 0) { return raw.slice(methodIndex, i + 1).trim(); } }
    }
  }

  return raw.slice(methodIndex).trim();
}

// Extract existing method names from generated TS, skipping commented lines
function extractExistingMethods(code: string): Set<string> {
  const existing = new Set<string>();
  const noBlock = code.replace(/\/\*[\s\S]*?\*\//g, "");
  const methodRegex = /static\s+async\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/g;
  for (const line of noBlock.split("\n")) {
    if (line.trim().startsWith("//")) { continue; }
    for (const m of line.matchAll(methodRegex)) {
      existing.add(m[1]);
    }
  }
  return existing;
}

export async function generateHelper(
  projectRoot: string,
  options: GenerateHelperOptions,
): Promise<void> {
  try {
    if (options.model) {
      configManager.setModel(options.model);
    }

    const llmProvider = LLMFactory.createProvider();

    console.log(chalk.blue("Validating LLM connection..."));
    const isConnected = await llmProvider.validateConnection();
    if (!isConnected) {
      console.warn(chalk.yellow("⚠ Warning: Could not validate LLM connection"));
    } else {
      console.log(chalk.green("✓ LLM connection validated"));
    }

    const helpersDir = path.join(projectRoot, "helpers");
    const outputDir = path.join(projectRoot, "generated", "helpers");

    const helperFile = await findHelperFile(helpersDir, options.helperName);
    if (!helperFile) {
      throw new Error(`Helper definition file for "${options.helperName}" not found in helpers/ folder`);
    }

    console.log(chalk.gray(`Found: ${path.relative(projectRoot, helperFile)}`));

    const content = await fs.readFile(helperFile, "utf-8");
    const definition = parseHelperDefinition(content, options.helperName);

    if (definition.actions.length === 0) {
      throw new Error(`No [HELPER-ACTION:] sections found in helper definition`);
    }

    console.log(chalk.blue(`\nGenerating helper class: ${definition.name}`));
    console.log(chalk.gray(`Found ${definition.actions.length} action(s): ${definition.actions.map(a => a.name).join(", ")}`));

    await fs.ensureDir(outputDir);
    const outputFile = path.join(outputDir, `${definition.name}.ts`);

    // Check which actions already exist in the generated file
    const fileExists = fs.existsSync(outputFile);
    const existingMethods = fileExists
      ? extractExistingMethods(await fs.readFile(outputFile, "utf-8"))
      : new Set<string>();

    const actionsToGenerate = definition.actions.filter(a => !existingMethods.has(a.name));
    const skipped = definition.actions.filter(a => existingMethods.has(a.name));

    if (skipped.length > 0) {
      console.log(chalk.gray(`  Skipping already generated: ${skipped.map(a => a.name).join(", ")}`));
    }

    if (actionsToGenerate.length === 0) {
      console.log(chalk.green(`\n✓ All actions already generated for ${definition.name}`));
      console.log(chalk.cyan(`File: ${path.relative(projectRoot, outputFile)}`));
      return;
    }

    // Generate only missing action methods
    const newMethods: string[] = [];
    for (const action of actionsToGenerate) {
      console.log(chalk.blue(`  Generating action: ${action.name}...`));

      const prompt: HelperPrompt = {
        helperName: definition.name,
        helperDescription: definition.description,
        actionName: action.name,
        actionDescription: action.description,
        actionDetails: action.details,
      };

      const generated = await llmProvider.generateHelperAction(prompt);
      const methodCode = extractMethodCode(generated.code, action.name);
      newMethods.push(methodCode);
      console.log(chalk.green(`  ✓ Generated action: ${action.name}`));
    }

    const indentedNewMethods = newMethods.map(m =>
      m.split("\n").map(line => (line.trim() ? `  ${line}` : "")).join("\n")
    ).join("\n\n");

    if (fileExists) {
      // Append new methods into the existing class before the closing brace
      let existing = await fs.readFile(outputFile, "utf-8");
      const lastBrace = existing.lastIndexOf("}");
      existing = existing.slice(0, lastBrace).trimEnd() + "\n\n" + indentedNewMethods + "\n}\n";
      await fs.writeFile(outputFile, existing);
    } else {
      // Create the full class from scratch
      const classCode = `import { Page } from '@playwright/test';

/**
 * ${definition.description}
 */
export class ${definition.name} {
${indentedNewMethods}
}
`;
      await fs.writeFile(outputFile, classCode);
    }

    console.log(chalk.green.bold(`\n✓ Helper class generated!`));
    console.log(chalk.cyan(`Generated file: ${path.relative(projectRoot, outputFile)}`));
  } catch (error) {
    console.error(chalk.red("Error generating helper:"), error);
    throw error;
  }
}
