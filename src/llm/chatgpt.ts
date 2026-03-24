import axios from "axios";
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class ChatGPTProvider extends LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.openai.com/v1/chat/completions";

  constructor(apiKey: string, model = "gpt-4o") {
    super();
    if (!apiKey) throw new Error("ChatGPT API key is required");
    this.apiKey = apiKey;
    this.model = model;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.baseUrl,
        { model: this.model, messages: [{ role: "user", content: "test" }], max_completion_tokens: 10 },
        { headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, timeout: 5000 },
      );
      return response.status === 200;
    } catch (error: any) {
      console.error("ChatGPT connection validation failed:", error.response?.data || error.message);
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [{ role: "user", content: this.buildPrompt(prompt) }],
          max_completion_tokens: 2000,
          temperature: 0.2,
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
          timeout: 30000,
        },
      );

      const generatedCode = response.data.choices?.[0]?.message?.content || "";
      if (!generatedCode.trim()) throw new Error("Empty response from ChatGPT");

      return {
        code: generatedCode,
        timestamp: new Date(),
        model: "chatgpt",
        testCaseId: prompt.testCaseId,
      };
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error?.message || error.response.data}`
        : error.message;
      throw new Error(`Failed to generate code with ChatGPT: ${errorMessage}`);
    }
  }
}
