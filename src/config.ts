import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

export interface Config {
  aiModel: "claude" | "azure-openai";
  claudeApiKey?: string;
  azureOpenAIApiKey?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIDeployment?: string;
  azureOpenAIApiVersion?: string;
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
      aiModel: (process.env.AI_MODEL as "claude" | "azure-openai") || "claude",
      claudeApiKey: process.env.CLAUDE_API_KEY,
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01",
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
    const { aiModel, claudeApiKey, azureOpenAIApiKey, azureOpenAIEndpoint, azureOpenAIDeployment } = this.config;

    if (aiModel === "azure-openai") {
      if (!azureOpenAIApiKey || !azureOpenAIEndpoint || !azureOpenAIDeployment) {
        throw new Error("AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT are required when using Azure OpenAI");
      }
    } else if (!claudeApiKey) {
      throw new Error("CLAUDE_API_KEY is required when using Claude");
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
