import * as fs from "fs";
import * as path from "path";

export function scanTestCaseIds(workspaceRoot: string): string[] {
  const testsDir = path.join(workspaceRoot, "tests");
  if (!fs.existsSync(testsDir)) { return []; }

  const ids: string[] = [];
  const idRegex = /\[TC-[A-Z0-9_-]+\]/gi;

  for (const file of walkMd(testsDir)) {
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.match(idRegex) || [];
    for (const m of matches) {
      const id = m.slice(1, -1);
      if (!ids.includes(id)) { ids.push(id); }
    }
  }

  return ids.sort();
}

export function scanTags(workspaceRoot: string): string[] {
  const generatedDir = path.join(workspaceRoot, "generated");
  if (!fs.existsSync(generatedDir)) { return []; }

  const tags = new Set<string>();
  const tagRegex = /\[([A-Z0-9][A-Z0-9\-]*[A-Z0-9])\]/g;

  for (const file of walkTs(generatedDir)) {
    const content = fs.readFileSync(file, "utf-8");
    for (const match of content.matchAll(tagRegex)) {
      tags.add(match[1]);
    }
  }

  return Array.from(tags).sort();
}

function walkMd(dir: string): string[] {
  return walk(dir, ".test.md");
}

function walkTs(dir: string): string[] {
  return walk(dir, ".test.ts");
}

function walk(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}
