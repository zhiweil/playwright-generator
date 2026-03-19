import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

export interface Config {
  aiModel: "copilot" | "claude";
  copilotApiKey?: string;
  claudeApiKey?: string;
  browser: "chromium" | "firefox" | "webkit";
  headless: boolean;
  baseUrl: string;
  timeout: number;
  retries: number;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    return {
      aiModel: (process.env.AI_MODEL as "copilot" | "claude") || "copilot",
      copilotApiKey: process.env.COPILOT_API_KEY,
      claudeApiKey: process.env.CLAUDE_API_KEY,
      browser:
        (process.env.BROWSER as "chromium" | "firefox" | "webkit") ||
        "chromium",
      headless: process.env.HEADLESS !== "false",
      baseUrl: process.env.BASE_URL || "http://localhost:3000",
      timeout: parseInt(process.env.TIMEOUT || "30000", 10),
      retries: parseInt(process.env.RETRIES || "1", 10),
    };
  }

  getConfig(): Config {
    return this.config;
  }

  validateConfig(): boolean {
    const { aiModel, copilotApiKey, claudeApiKey } = this.config;

    if (aiModel === "copilot" && !copilotApiKey) {
      throw new Error("COPILOT_API_KEY is required when using Copilot model");
    }

    if (aiModel === "claude" && !claudeApiKey) {
      throw new Error("CLAUDE_API_KEY is required when using Claude model");
    }

    return true;
  }

  getEnvFilePath(projectRoot: string): string {
    return path.join(projectRoot, ".env");
  }

  envFileExists(projectRoot: string): boolean {
    return fs.existsSync(this.getEnvFilePath(projectRoot));
  }
}

export default ConfigManager.getInstance();
