import axios from "axios";
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class ClaudeProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1/messages";

  constructor(apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error("Claude API key is required");
    }
    if (!apiKey.startsWith("sk-ant-")) {
      throw new Error(
        "Claude API key should start with 'sk-ant-'. Please check your Anthropic API key.",
      );
    }
    this.apiKey = apiKey;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: "test",
            },
          ],
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );
      return response.status === 200;
    } catch (error: any) {
      if (error.response) {
        if (
          error.response.status === 404 &&
          error.response.data?.error?.type === "not_found_error"
        ) {
          console.error(
            `Claude connection validation failed: Model not available. Your Anthropic account may not have access to Claude models. Please check https://console.anthropic.com/`,
          );
        } else {
          console.error(
            `Claude connection validation failed with status ${error.response.status}:`,
            error.response.data,
          );
        }
      } else {
        console.error("Claude connection validation failed:", error.message);
      }
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const systemPrompt = this.buildPrompt(prompt);

      const response = await axios.post(
        this.baseUrl,
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: systemPrompt,
            },
          ],
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const generatedCode = response.data.content?.[0]?.text || "";

      if (!generatedCode.trim()) {
        throw new Error("Empty response from Claude");
      }

      return {
        code: generatedCode,
        timestamp: new Date(),
        model: "claude",
        testCaseId: prompt.testCaseId,
      };
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error?.message || error.response.data}`
        : error.message;

      if (
        error.response?.status === 404 &&
        error.response.data?.error?.type === "not_found_error"
      ) {
        throw new Error(
          `Failed to generate code with Claude: Model not available. ` +
            `Your Anthropic account may not have access to Claude models. ` +
            `Please check your account at https://console.anthropic.com/ and ensure Claude API access is enabled. ` +
            `Alternatively, try using Copilot: set AI_MODEL=copilot in your .env file.`,
        );
      }

      throw new Error(`Failed to generate code with Claude: ${errorMessage}`);
    }
  }
}
