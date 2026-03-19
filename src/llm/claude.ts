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
    this.apiKey = apiKey;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: "claude-3-sonnet-20240229",
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
    } catch (error) {
      console.error("Claude connection validation failed:", error);
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const systemPrompt = this.buildPrompt(prompt.testCase);

      const response = await axios.post(
        this.baseUrl,
        {
          model: "claude-3-sonnet-20240229",
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
    } catch (error) {
      throw new Error(
        `Failed to generate code with Claude: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
