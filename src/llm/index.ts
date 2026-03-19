import { LLMProvider } from "./provider";
import { CopilotProvider } from "./copilot";
import { ClaudeProvider } from "./claude";
import configManager from "../config";

export class LLMFactory {
  static createProvider(): LLMProvider {
    const config = configManager.getConfig();

    if (config.aiModel === "copilot") {
      if (!config.copilotApiKey) {
        throw new Error(
          "Copilot API key not configured. Set COPILOT_API_KEY in .env",
        );
      }
      return new CopilotProvider(config.copilotApiKey);
    }

    if (config.aiModel === "claude") {
      if (!config.claudeApiKey) {
        throw new Error(
          "Claude API key not configured. Set CLAUDE_API_KEY in .env",
        );
      }
      return new ClaudeProvider(config.claudeApiKey);
    }

    throw new Error(`Unknown AI model: ${config.aiModel}`);
  }
}

export default LLMFactory;
