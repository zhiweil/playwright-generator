import { extractTypeScriptCode } from "../src/commands/generate";

const cases = [
  {
    name: "Unclosed brace case (TC-0002 style)",
    input: `test("TC-0002 generates a full test", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle("Example Domain");
  // missing closing brace intentionally
`,
    expectedContains: 'await expect(page).toHaveTitle("Example Domain");',
  },
  {
    name: "Multi-test response - first test complete only",
    input: `test("first", async ({ page }) => {
  await page.goto("https://example.com/first");
  await expect(page).toHaveTitle("First");
});

test("second", async ({ page }) => {
  await page.goto("https://example.com/second");
  await expect(page).toHaveTitle("Second");
});
`,
    expectedContains: 'test("first", async ({ page }) => {',
    expectedNotContains: 'test("second", async ({ page }) => {',
  },
];

let allPassed = true;

for (const { name, input, expectedContains, expectedNotContains } of cases) {
  const extracted = extractTypeScriptCode(input);

  const contains = extracted.includes(expectedContains);
  const notContains = expectedNotContains
    ? !extracted.includes(expectedNotContains)
    : true;

  const pass = contains && notContains;

  console.log(`---- ${name} ----`);
  console.log("input:");
  console.log(input);
  console.log("extracted:");
  console.log(extracted);
  console.log(`pass: ${pass}`);
  console.log(`contains expected: ${contains}`);
  if (expectedNotContains !== undefined) {
    console.log(`not contains unwanted: ${notContains}`);
  }
  console.log("\n");

  if (!pass) {
    allPassed = false;
  }
}

if (allPassed) {
  console.log("✅ TC-0002 validation script: All tests passed!");
  process.exit(0);
} else {
  console.error("❌ TC-0002 validation script: Some tests failed");
  process.exit(1);
}
