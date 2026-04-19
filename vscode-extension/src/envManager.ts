import * as fs from "fs";
import * as path from "path";

export interface EnvConfig {
  AI_MODEL: string;
  CLAUDE_API_KEY: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AZURE_OPENAI_API_VERSION: string;
  CHATGPT_API_KEY: string;
  CHATGPT_MODEL: string;
  LOCAL_LLM_URL: string;
  LOCAL_LLM_MODEL: string;
  BROWSER: string;
  HEADLESS: string;
  TIMEOUT: string;
  RETRIES: string;
  VIDEO: string;
  RUNNING_ENVIRONMENT: string;
}

export const ENV_DEFAULTS: EnvConfig = {
  AI_MODEL: "claude",
  CLAUDE_API_KEY: "",
  AZURE_OPENAI_API_KEY: "",
  AZURE_OPENAI_ENDPOINT: "",
  AZURE_OPENAI_DEPLOYMENT: "",
  AZURE_OPENAI_API_VERSION: "2024-02-01",
  CHATGPT_API_KEY: "",
  CHATGPT_MODEL: "gpt-4o",
  LOCAL_LLM_URL: "http://localhost:11434",
  LOCAL_LLM_MODEL: "llama3",
  BROWSER: "chromium",
  HEADLESS: "true",
  TIMEOUT: "30000",
  RETRIES: "1",
  VIDEO: "retain-on-failure",
  RUNNING_ENVIRONMENT: "local",
};

export const SYSTEM_KEYS = new Set(Object.keys(ENV_DEFAULTS));

// ── .env read/write ───────────────────────────────────────────────────────────

export function readEnv(workspaceRoot: string): EnvConfig {
  const envPath = path.join(workspaceRoot, ".env");
  const config: EnvConfig = { ...ENV_DEFAULTS };
  if (!fs.existsSync(envPath)) {
    return config;
  }

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .split("#")[0]
      .trim();
    if (key in config) {
      (config as unknown as Record<string, string>)[key] = value;
    }
  }
  return config;
}

export function writeEnv(workspaceRoot: string, config: EnvConfig): void {
  const envPath = path.join(workspaceRoot, ".env");
  let lines: string[] = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8").split("\n")
    : [];

  const updated = new Set<string>();
  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return line;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      return line;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    if (key in config) {
      updated.add(key);
      return `${key}=${(config as unknown as Record<string, string>)[key]}`;
    }
    return line;
  });

  for (const key of Object.keys(config) as (keyof EnvConfig)[]) {
    if (!updated.has(key)) {
      newLines.push(
        `${key}=${(config as unknown as Record<string, string>)[key]}`,
      );
    }
  }
  fs.writeFileSync(envPath, newLines.join("\n"), "utf-8");
}

// ── Custom env (active environment vars in .env) ──────────────────────────────

export function readCustomEnv(workspaceRoot: string): Record<string, string> {
  const envPath = path.join(workspaceRoot, ".env");
  const custom: Record<string, string> = {};
  if (!fs.existsSync(envPath)) {
    return custom;
  }

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .split("#")[0]
      .trim();
    if (!SYSTEM_KEYS.has(key)) {
      custom[key] = value;
    }
  }
  return custom;
}

export function writeCustomEnv(
  workspaceRoot: string,
  custom: Record<string, string>,
): void {
  const envPath = path.join(workspaceRoot, ".env");
  let lines: string[] = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8").split("\n")
    : [];

  lines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return true;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      return true;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    return SYSTEM_KEYS.has(key);
  });

  for (const [key, value] of Object.entries(custom)) {
    if (key.trim()) {
      lines.push(`${key}=${value}`);
    }
  }
  fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
}

// ── .envs multi-environment support ──────────────────────────────────────────

export interface EnvironmentData {
  name: string;
  vars: Record<string, string>;
}

const ENVS_FILE = ".envs";
const DEFAULT_ENVIRONMENTS = ["local", "integration", "staging", "production"];

function envsFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, ENVS_FILE);
}

/** Validate and sanitize environment name to prevent path traversal (CWE-22) */
function validateEnvName(name: string): string {
  const safe = name.trim().replace(/[^A-Za-z0-9_-]/g, "");
  if (!safe) {
    throw new Error(`Invalid environment name: "${name.trim()}"`);
  }
  return safe;
}

/** Parse .envs into a list of EnvironmentData */
export function readRunningEnvs(workspaceRoot: string): EnvironmentData[] {
  const filePath = envsFilePath(workspaceRoot);
  if (!fs.existsSync(filePath)) {
    return DEFAULT_ENVIRONMENTS.map((name) => ({ name, vars: {} }));
  }

  const envs: EnvironmentData[] = [];
  let current: EnvironmentData | null = null;

  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    // Section header: "# envName" — single word after #
    const headerMatch = trimmed.match(/^#\s+([A-Za-z][A-Za-z0-9_-]*)$/);
    if (headerMatch) {
      if (current) {
        envs.push(current);
      }
      current = { name: headerMatch[1], vars: {} };
      continue;
    }
    if (!current || !trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) {
      current.vars[key] = value;
    }
  }
  if (current) {
    envs.push(current);
  }
  return envs;
}

/** Write all environments back to .envs */
export function writeRunningEnvs(
  workspaceRoot: string,
  envs: EnvironmentData[],
): void {
  const lines: string[] = [];
  for (const env of envs) {
    lines.push(`# ${env.name}`);
    for (const [key, value] of Object.entries(env.vars)) {
      if (key.trim()) {
        lines.push(`${key}=${value}`);
      }
    }
    lines.push("");
  }
  fs.writeFileSync(envsFilePath(workspaceRoot), lines.join("\n"), "utf-8");
}

/** Activate an environment: write its vars to .env, update RUNNING_ENVIRONMENT */
export function activateEnvironment(
  workspaceRoot: string,
  envName: string,
): void {
  const safeName = validateEnvName(envName);
  const envs = readRunningEnvs(workspaceRoot);
  const target = envs.find((e) => e.name === safeName);
  const config = readEnv(workspaceRoot);
  config.RUNNING_ENVIRONMENT = safeName;
  writeEnv(workspaceRoot, config);
  writeCustomEnv(workspaceRoot, target ? target.vars : {});
}

/** Save vars for a named environment back to .envs */
export function saveEnvironmentVars(
  workspaceRoot: string,
  envName: string,
  vars: Record<string, string>,
): void {
  const safeName = validateEnvName(envName);
  const envs = readRunningEnvs(workspaceRoot);
  const existing = envs.find((e) => e.name === safeName);
  if (existing) {
    existing.vars = vars;
  } else {
    envs.push({ name: safeName, vars });
  }
  writeRunningEnvs(workspaceRoot, envs);
}

/** Add a new environment, optionally copying vars from another */
export function addEnvironment(
  workspaceRoot: string,
  newName: string,
  copyFrom?: string,
): void {
  const safeName = validateEnvName(newName);
  const envs = readRunningEnvs(workspaceRoot);
  if (envs.find((e) => e.name === safeName)) {
    return;
  }
  const source = copyFrom
    ? envs.find((e) => e.name === validateEnvName(copyFrom))
    : undefined;
  envs.push({ name: safeName, vars: source ? { ...source.vars } : {} });
  writeRunningEnvs(workspaceRoot, envs);
}

/** Delete an environment from .envs */
export function deleteEnvironment(
  workspaceRoot: string,
  envName: string,
): void {
  const safeName = validateEnvName(envName);
  // Prevent deletion of "local" environment
  if (safeName === "local") {
    return;
  }

  const config = readEnv(workspaceRoot);
  const envs = readRunningEnvs(workspaceRoot).filter(
    (e) => e.name !== safeName,
  );

  // If the deleted environment was active, switch to "local"
  if (config.RUNNING_ENVIRONMENT === safeName) {
    config.RUNNING_ENVIRONMENT = "local";
    writeEnv(workspaceRoot, config);
    writeCustomEnv(workspaceRoot, {});
  }

  writeRunningEnvs(workspaceRoot, envs);
}
