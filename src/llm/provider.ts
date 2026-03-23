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

  protected buildPrompt(prompt: LLMPrompt): string {
    const tagString = prompt.tags.map(t => `[${t}]`).join(' ');
    return `You are an expert Playwright test automation engineer. 
Generate Playwright TypeScript test code based on the following natural language test case.
The generated code should:
- Use Playwright best practices
- Include proper assertions
- Handle element waits automatically (Playwright auto-waits)
- Be readable and maintainable
- Include comments explaining complex steps
- The test title MUST begin with ALL of the following tags exactly as shown, preserving every tag: ${tagString}
- Example of correct title format: test('${tagString} Your description here', ...)
- Do NOT omit any tags. Do NOT add extra tags.

Natural language test case:
${prompt.testCase}

Generate ONLY the test function code, without explanations. Use this exact format:
test('${tagString} Test Description', async ({ page }) => {
  // Your test code here
});`;
  }
}
