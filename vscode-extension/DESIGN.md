# VS Code Extension

This is a VS Code extension which facilitate the usage of playwright-generator utility. The extension provides a user interface for the configuration and execution of playwright-generator. The extension provides the following features.

- The extension contains one page with three sections: Configuration, Generation and Run.
- The Configuration section will be able to
  - Loads the .env file
  - A "AI Model" dropdown to set ENV AI_MODEL, options are claude, azure-openai, chatgpt, local. Default is claude.
    - If AI_MODEL is claud, a text box "Claude API Key" appears to set ENV CLAUDE_API_KEY.
    - If AI_MODEL is azure-openai, two text boxes "Azure OpenAI API Key" and "Azure OpenAI Endpoint" appear to set ENV AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.
    - If AI_MODEL is chatgpt, two text boxes "ChatGPT API Key" and "ChatGPT Model" appear to set CHATGPT_API_KEY and CHATGPT_MODEL.
    - If AI_MODEL is local, two text boxes "Local LLM URL" and "Local LLM Model" appear to set LOCAL_LLM_URL and LOCAL_LLM_MODEL.
  - A dropdown "Browser" appears to set ENV BROWSER. The options are "chromium", "firefox" and "webkit". Default is "chromium".
  - A Checkbox "HEADLESS" appears to set ENV HEADLESS. Options are true.
  - A checkbox "Timeout" appeas to set ENV TIMEOUT.
  - A text box "Retries" appears to set ENV RETRIES. Default is 5000.
  - A dropdown "Video" to choose whether and when to tak videos. Options are "on", "off", "retain-on-failure" and "on-first-retry", detault is "retain-on-failure".
  - Any changes will be saved to .env file

- The Generation section contains the following UI components.
  - A dropdown which allows tester to choose a testcase by its ID (TC-xxxx). The dropdown shows a list of testcase IDs and allow searching by typing. The drop down is updated for any changes in the /tests folder.
  - A button "Generate" to execute command "npx playwright-generator generate --tc TC-xxxx".

- The Run section contains the following UI components:
  -     - A dropdown which allows tester to choose a testcases by its tag. The dropdown shows a list of tags and allow searching by typing. The drop down is updated for any changes in the /generated folder.
  - A button "All Tests" to run command "npm run test".
  - A button "Run by Tag" to run command "npm run:case -- <TAG>.
  - A button "Run with UI" to run command "npm run test:headed -- <TAG>.
  - A button "Debug" to run command "npm run test:debug -- <TAG>.
  - A button "Report" to run command "npm run report".
