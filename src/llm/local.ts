import axios from "axios";
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class LocalLLMProvider extends LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = "http://localhost:11434", model = "llama3") {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        { model: this.model, messages: [{ role: "user", content: "test" }], max_tokens: 10 },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 },
      );
      return response.status === 200;
    } catch (error: any) {
      console.error("Local LLM connection validation failed:", error.response?.data || error.message);
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages: [{ role: "user", content: this.buildPrompt(prompt) }],
          temperature: 0.2,
          stream: false,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 120000,
        },
      );

      const generatedCode = response.data.choices?.[0]?.message?.content || "";
      if (!generatedCode.trim()) throw new Error("Empty response from local LLM");

      return {
        code: generatedCode,
        timestamp: new Date(),
        model: `local/${this.model}`,
        testCaseId: prompt.testCaseId,
      };
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error.message;
      throw new Error(`Failed to generate code with local LLM: ${errorMessage}`);
    }
  }
}
