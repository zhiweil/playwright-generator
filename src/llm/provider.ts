export interface LLMPrompt {
  testCase: string;
  testCaseId: string;
  tags: string[];
}

export interface GeneratedCode {
  code: string;
  timestamp: Date;
  model: string;
  testCaseId: string;
}

export abstract class LLMProvider {
  abstract generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode>;
  abstract validateConnection(): Promise<boolean>;

  protected buildPrompt(testCaseContent: string): string {
    return `You are an expert Playwright test automation engineer. 
Generate Playwright TypeScript test code based on the following natural language test case.
The generated code should:
- Use Playwright best practices
- Include proper assertions
- Handle element waits automatically (Playwright auto-waits)
- Be readable and maintainable
- Include comments explaining complex steps

Natural language test case:
${testCaseContent}

Generate ONLY the test function code, without explanations. Use this format:
test('Test Description', async ({ page }) => {
  // Your test code here
});`;
  }
}
