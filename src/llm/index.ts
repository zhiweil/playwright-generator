import { LLMProvider } from "./provider";
import { ClaudeProvider } from "./claude";
import { AzureOpenAIProvider } from "./azure-openai";
import { ChatGPTProvider } from "./chatgpt";
import configManager from "../config";

export class LLMFactory {
  static createProvider(): LLMProvider {
    const config = configManager.getConfig();

    if (config.aiModel === "azure-openai") {
      if (!config.azureOpenAIApiKey) throw new Error("Azure OpenAI API key not configured. Set AZURE_OPENAI_API_KEY in .env");
      if (!config.azureOpenAIEndpoint) throw new Error("Azure OpenAI endpoint not configured. Set AZURE_OPENAI_ENDPOINT in .env");
      if (!config.azureOpenAIDeployment) throw new Error("Azure OpenAI deployment not configured. Set AZURE_OPENAI_DEPLOYMENT in .env");
      return new AzureOpenAIProvider(config.azureOpenAIApiKey, config.azureOpenAIEndpoint, config.azureOpenAIDeployment, config.azureOpenAIApiVersion);
    }

    if (config.aiModel === "chatgpt") {
      if (!config.chatGPTApiKey) throw new Error("ChatGPT API key not configured. Set CHATGPT_API_KEY in .env");
      return new ChatGPTProvider(config.chatGPTApiKey, config.chatGPTModel);
    }

    if (!config.claudeApiKey) throw new Error("Claude API key not configured. Set CLAUDE_API_KEY in .env");
    return new ClaudeProvider(config.claudeApiKey);
  }
}

export default LLMFactory;
