import * as fs from "fs";
import * as path from "path";

export interface EnvConfig {
  AI_MODEL: string;
  CLAUDE_API_KEY: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  CHATGPT_API_KEY: string;
  CHATGPT_MODEL: string;
  LOCAL_LLM_URL: string;
  LOCAL_LLM_MODEL: string;
  BROWSER: string;
  HEADLESS: string;
  TIMEOUT: string;
  RETRIES: string;
  VIDEO: string;
}

export const ENV_DEFAULTS: EnvConfig = {
  AI_MODEL: "claude",
  CLAUDE_API_KEY: "",
  AZURE_OPENAI_API_KEY: "",
  AZURE_OPENAI_ENDPOINT: "",
  CHATGPT_API_KEY: "",
  CHATGPT_MODEL: "gpt-4o",
  LOCAL_LLM_URL: "http://localhost:11434",
  LOCAL_LLM_MODEL: "llama3",
  BROWSER: "chromium",
  HEADLESS: "true",
  TIMEOUT: "30000",
  RETRIES: "1",
  VIDEO: "retain-on-failure",
};

export const SYSTEM_KEYS = new Set(Object.keys(ENV_DEFAULTS));

export function readEnv(workspaceRoot: string): EnvConfig {
  const envPath = path.join(workspaceRoot, ".env");
  const config: EnvConfig = { ...ENV_DEFAULTS };

  if (!fs.existsSync(envPath)) {
    return config;
  }

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) { continue; }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) { continue; }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).split("#")[0].trim();
    if (key in config) {
      (config as unknown as Record<string, string>)[key] = value;
    }
  }

  return config;
}

export function writeEnv(workspaceRoot: string, config: EnvConfig): void {
  const envPath = path.join(workspaceRoot, ".env");
  let lines: string[] = [];

  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, "utf-8").split("\n");
  }

  const updated = new Set<string>();

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) { return line; }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) { return line; }
    const key = trimmed.slice(0, eqIndex).trim();
    if (key in config) {
      updated.add(key);
      return `${key}=${(config as unknown as Record<string, string>)[key]}`;
    }
    return line;
  });

  for (const key of Object.keys(config) as (keyof EnvConfig)[]) {
    if (!updated.has(key)) {
      newLines.push(`${key}=${(config as unknown as Record<string, string>)[key]}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join("\n"), "utf-8");
}

// Returns all non-system key=value pairs from .env
export function readCustomEnv(workspaceRoot: string): Record<string, string> {
  const envPath = path.join(workspaceRoot, ".env");
  const custom: Record<string, string> = {};
  if (!fs.existsSync(envPath)) { return custom; }

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) { continue; }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) { continue; }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).split("#")[0].trim();
    if (!SYSTEM_KEYS.has(key)) {
      custom[key] = value;
    }
  }
  return custom;
}

// Writes custom (non-system) key=value pairs to .env, removing deleted ones
export function writeCustomEnv(workspaceRoot: string, custom: Record<string, string>): void {
  const envPath = path.join(workspaceRoot, ".env");
  let lines: string[] = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8").split("\n")
    : [];

  // Remove all existing non-system lines
  lines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) { return true; }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) { return true; }
    const key = trimmed.slice(0, eqIndex).trim();
    return SYSTEM_KEYS.has(key);
  });

  // Append custom vars
  for (const [key, value] of Object.entries(custom)) {
    if (key.trim()) { lines.push(`${key}=${value}`); }
  }

  fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
}
