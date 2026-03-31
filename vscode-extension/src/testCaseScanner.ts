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

  const helperTagRegex = /^\[HELPER:\s*([A-Za-z][A-Za-z0-9_]*)\]/m;
  const actionTagRegex = /^\[HELPER-ACTION:\s*([A-Za-z][A-Za-z0-9_]*)\]/gm;
  const methodRegex = /static\s+async\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/g;

  const map = new Map<string, HelperInfo>();

  // Scan natural language definitions in helpers/
  if (fs.existsSync(helpersDir)) {
    for (const file of await walk(helpersDir, ".md")) {
      const content = await fs.promises.readFile(file, "utf-8");
      const nameMatch = content.match(helperTagRegex);
      if (!nameMatch) { continue; }
      const name = nameMatch[1];
      if (!map.has(name)) {
        map.set(name, { name, actions: [], generated: false });
      }
    }
  }

  // Scan generated TypeScript helpers in generated/helpers/
  if (fs.existsSync(generatedDir)) {
    for (const file of await walk(generatedDir, ".ts")) {
      const content = await fs.promises.readFile(file, "utf-8");
      // Derive helper name from filename
      const name = path.basename(file, ".ts");
      const actions = [...content.matchAll(methodRegex)].map(m => m[1]);
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

export async function scanTestCaseIds(workspaceRoot: string): Promise<string[]> {
  const testsDir = path.join(workspaceRoot, "tests");
  if (!fs.existsSync(testsDir)) { return []; }

  const ids: string[] = [];
  const idRegex = /\[TC-[A-Z0-9_-]+\]/gi;

  for (const file of await walkMd(testsDir)) {
    const content = await fs.promises.readFile(file, "utf-8");
    const matches = content.match(idRegex) || [];
    for (const m of matches) {
      const id = m.slice(1, -1);
      if (!ids.includes(id)) { ids.push(id); }
    }
  }

  return ids.sort();
}

export async function scanTags(workspaceRoot: string): Promise<string[]> {
  const generatedDir = path.join(workspaceRoot, "generated");
  if (!fs.existsSync(generatedDir)) { return []; }

  const tags = new Set<string>();
  const tagRegex = /\[([A-Z0-9][A-Z0-9\-]*[A-Z0-9])\]/g;

  for (const file of await walkTs(generatedDir)) {
    const content = await fs.promises.readFile(file, "utf-8");
    for (const match of content.matchAll(tagRegex)) {
      tags.add(match[1]);
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
