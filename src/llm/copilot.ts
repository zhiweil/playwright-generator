import axios from "axios";
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class CopilotProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl = "https://api.github.com/copilot_internal/v2/completions";

  constructor(apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error("Copilot API key is required");
    }
    this.apiKey = apiKey;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.baseUrl,
        { prompt: "test" },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );
      return response.status === 200;
    } catch (error) {
      console.error("Copilot connection validation failed:", error);
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const systemPrompt = this.buildPrompt(prompt);

      const response = await axios.post(
        this.baseUrl,
        {
          prompt: systemPrompt,
          max_tokens: 2000,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const generatedCode = response.data.choices?.[0]?.text || "";

      if (!generatedCode.trim()) {
        throw new Error("Empty response from Copilot");
      }

      return {
        code: generatedCode,
        timestamp: new Date(),
        model: "copilot",
        testCaseId: prompt.testCaseId,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate code with Copilot: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
