export interface LLMPrompt {
  testCase: string;
  testCaseId: string;
  tags: string[];
}

export interface HelperPrompt {
  helperName: string;
  helperDescription: string;
  actionName: string;
  actionDescription: string;
  actionDetails: string;
}

export interface GeneratedCode {
  code: string;
  timestamp: Date;
  model: string;
  testCaseId: string;
}

export abstract class LLMProvider {
  abstract generateTestCode(prompt: LLMPrompt): Promise<GeneratedCode>;
  abstract generateHelperAction(prompt: HelperPrompt): Promise<GeneratedCode>;
  abstract validateConnection(): Promise<boolean>;

  protected buildPrompt(prompt: LLMPrompt): string {
    const tagString = prompt.tags.map((t) => `[${t}]`).join(" ");
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
- If helper functions are needed, they are always static methods in helper classes, so do not create instances of helper classes.
- Please scan folder /generated/helpers/ for existing helper classes and methods.
- Please inject a import at the beginning of the test file for any helper classes used, e.g. import { HelperClassName } from './helpers/HelperFileName';
- Please always call the methods by prefixing with the class name, e.g. HelperClass}.MethodName()

- Check the grammar and spelling of the test case and correct any errors in the generated code.

Natural language test case:
${prompt.testCase}

Generate ONLY the test function code, without explanations. Use this exact format:
test('${tagString} Test Description', async ({ page }) => {
  // Your test code here
});`;
  }

  protected buildHelperActionPrompt(prompt: HelperPrompt): string {
    return `You are an expert Playwright test automation engineer.
Generate a single static TypeScript method for a Playwright helper class based on the following natural language definition.

Helper class: ${prompt.helperName}
Helper description: ${prompt.helperDescription}

Action name: ${prompt.actionName}
Action description: ${prompt.actionDescription}
Action details:
${prompt.actionDetails}

Requirements:
- Generate ONLY the static async method body, no class wrapper, no imports
- Method signature: static async ${prompt.actionName}(page: Page): Promise<void>
- Use Playwright best practices with auto-waiting
- Be readable and maintainable

Generate ONLY the method in this exact format:
  static async ${prompt.actionName}(page: Page): Promise<void> {
    // implementation
  }`;
  }
}
