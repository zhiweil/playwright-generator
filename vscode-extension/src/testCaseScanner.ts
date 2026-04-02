import * as fs from "fs";
import * as path from "path";

export interface HelperInfo {
  name: string;
  actions: string[];
  generated: boolean;
}

export async function scanHelpers(workspaceRoot: string): Promise<HelperInfo[]> {
  const helpersDir = path.join(workspaceRoot, "helpers");
  const generatedDir = path.join(workspaceRoot, "generated", "helpers");

  const methodRegex = /static\s+async\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/g;

  const map = new Map<string, HelperInfo>();

  // Scan natural language definitions in helpers/
  if (fs.existsSync(helpersDir)) {
    for (const file of await walk(helpersDir, ".md")) {
      const content = await fs.promises.readFile(file, "utf-8");
      const { helperName } = parseHelperMd(content);
      if (!helperName) { continue; }
      if (!map.has(helperName)) {
        map.set(helperName, { name: helperName, actions: [], generated: false });
      }
    }
  }

  // Scan generated TypeScript helpers in generated/helpers/
  if (fs.existsSync(generatedDir)) {
    for (const file of await walk(generatedDir, ".ts")) {
      const content = await fs.promises.readFile(file, "utf-8");
      const name = path.basename(file, ".ts");
      // Only count non-commented methods
      const actions = extractActiveMethods(content, methodRegex);
      if (map.has(name)) {
        map.get(name)!.actions = actions;
        map.get(name)!.generated = true;
      } else {
        map.set(name, { name, actions, generated: true });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Strip HTML comments and return active lines only
function activeLines(content: string): string[] {
  // Remove <!-- ... --> blocks (including multiline)
  const stripped = content.replace(/<!--[\s\S]*?-->/g, "");
  return stripped.split("\n");
}

function parseHelperMd(content: string): { helperName: string | null } {
  const helperTagRegex = /^\[HELPER:\s*([A-Za-z][A-Za-z0-9_]*)\]/;
  for (const line of activeLines(content)) {
    const m = line.trim().match(helperTagRegex);
    if (m) { return { helperName: m[1] }; }
  }
  return { helperName: null };
}

// Extract static async method names from TS, skipping commented-out lines
function extractActiveMethods(content: string, regex: RegExp): string[] {
  const results: string[] = [];
  // Remove block comments /* ... */
  const noBlock = content.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const line of noBlock.split("\n")) {
    const trimmed = line.trim();
    // Skip single-line comments
    if (trimmed.startsWith("//")) { continue; }
    regex.lastIndex = 0;
    const m = regex.exec(trimmed);
    if (m) { results.push(m[1]); }
  }
  return results;
}

export interface TestCaseEntry {
  id: string;
  duplicate: boolean;
}

export async function scanTestCaseIds(workspaceRoot: string): Promise<TestCaseEntry[]> {
  const testsDir = path.join(workspaceRoot, "tests");
  if (!fs.existsSync(testsDir)) { return []; }

  const idCounts = new Map<string, number>();
  const idRegex = /\[TC-[A-Z0-9_-]+\]/gi;

  for (const file of await walkMd(testsDir)) {
    const content = await fs.promises.readFile(file, "utf-8");
    for (const line of activeLines(content)) {
      const matches = line.match(idRegex) || [];
      for (const m of matches) {
        const id = m.slice(1, -1).toUpperCase();
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      }
    }
  }

  return Array.from(idCounts.entries())
    .map(([id, count]) => ({ id, duplicate: count > 1 }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function scanTags(workspaceRoot: string): Promise<string[]> {
  const generatedDir = path.join(workspaceRoot, "generated");
  if (!fs.existsSync(generatedDir)) { return []; }

  const tags = new Set<string>();
  const tagRegex = /\[([A-Z0-9][A-Z0-9\-]*[A-Z0-9])\]/g;

  for (const file of await walkTs(generatedDir)) {
    const content = await fs.promises.readFile(file, "utf-8");
    // Remove block comments then skip single-line commented lines
    const noBlock = content.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const line of noBlock.split("\n")) {
      if (line.trim().startsWith("//")) { continue; }
      for (const match of line.matchAll(tagRegex)) {
        tags.add(match[1]);
      }
    }
  }

  return Array.from(tags).sort();
}

async function walkMd(dir: string): Promise<string[]> {
  return walk(dir, ".test.md");
}

async function walkTs(dir: string): Promise<string[]> {
  return walk(dir, ".test.ts");
}

async function walk(dir: string, ext: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}
