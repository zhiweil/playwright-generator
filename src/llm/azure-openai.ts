import axios from "axios";
import { LLMProvider, LLMPrompt, GeneratedCode } from "./provider";

export class AzureOpenAIProvider extends LLMProvider {
  private apiKey: string;
  private endpoint: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor(apiKey: string, endpoint: string, deploymentName: string, apiVersion = "2024-02-01") {
    super();
    if (!apiKey) throw new Error("Azure OpenAI API key is required");
    if (!endpoint) throw new Error("Azure OpenAI endpoint is required");
    if (!deploymentName) throw new Error("Azure OpenAI deployment name is required");
    this.apiKey = apiKey;
    this.endpoint = endpoint.replace(/\/$/, "");
    this.deploymentName = deploymentName;
    this.apiVersion = apiVersion;
  }

  private get url(): string {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.url,
        { messages: [{ role: "user", content: "test" }], max_tokens: 10 },
        { headers: { "api-key": this.apiKey, "Content-Type": "application/json" }, timeout: 30000 },
      );
      return response.status === 200;
    } catch (error: any) {
      console.error("Azure OpenAI connection validation failed:", error.response?.data || error.message);
      return false;
    }
  }

  async generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode> {
    try {
      const response = await axios.post(
        this.url,
        {
          messages: [{ role: "user", content: this.buildPrompt(prompt) }],
          max_tokens: 3500,
          temperature: 0.2,
        },
        {
          headers: { "api-key": this.apiKey, "Content-Type": "application/json" },
          timeout: 30000,
        },
      );

      const generatedCode = response.data.choices?.[0]?.message?.content || "";
      if (!generatedCode.trim()) throw new Error("Empty response from Azure OpenAI");

      return {
        code: generatedCode,
        timestamp: new Date(),
        model: "azure-openai",
        testCaseId: prompt.testCaseId,
      };
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error?.message || error.response.data}`
        : error.message;
      throw new Error(`Failed to generate code with Azure OpenAI: ${errorMessage}`);
    }
  }
}
