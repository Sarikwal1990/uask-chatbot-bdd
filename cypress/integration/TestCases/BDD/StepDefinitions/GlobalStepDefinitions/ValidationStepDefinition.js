import { parseVariableValue } from "../../../../../utils/utility";

const {
  Given,
  When,
  Then,
} = require("@badeball/cypress-cucumber-preprocessor");

const { validateAIResponse } = require("../../../../../utils/llm-score");

//Importing and renaming the variables from hook.js
const { testDataMap, pageDataMap } = require("./hooks");

// Verify that URL contains "Test String"
Then(/^Verify that URL contains "([^"]*)"$/, function (value) {
  value = parseVariableValue(value, testDataMap);
  cy.url({ timeout: 20000 }).should("include", value);
});

//Run all AI Prompts from test data
Then("Run all AI prompt tests from test data", () => {
  // Load fixture and alias it
  cy.fixture("TestData/ChatbotPrompts.json").as("chatData");

  // Get the fixture data
  cy.get("@chatData").then((data) => {
    const testPrompts = data.aiChatbotTests;

    // Validate fixture structure
    if (!Array.isArray(testPrompts)) {
      throw new Error(
        `aiChatbotTests is not an array. Check your fixture. Found: ${typeof testPrompts}`
      );
    }

    // Iterate over each test case
    cy.wrap(testPrompts).each((testCase) => {
      cy.log(`Running prompt: "${testCase.prompt}" (${testCase.language})`);

      // Ensure chat input is visible
      cy.get("#chat-input").should("be.visible").clear().type(`${testCase.prompt}{enter}`);
      cy.wait(50000)

      // Capture the latest response and validate
      cy.get('#response-content-container', { timeout: 90000 })
  .should('exist')
  .scrollIntoView()
  .should('be.visible')
  .invoke("text")
  .then((actualResponse) => {
  const result = validateAIResponse(actualResponse, testCase.keywords);

  const record = {
    prompt: testCase.prompt,
    expectedKeywords: testCase.keywords,
    actualResponse: actualResponse,
    matchedKeywords: result.matchedKeywords || [],
    score: (result.score * 100).toFixed(2) + "%",
    status: result.passed ? "PASS" : "FAIL",
    screenshot: result.passed ? null : `screenshots/${Cypress.spec.name}/${testCase.prompt}.png`
  };

  cy.storeAIResult(record);

  expect(result.passed, `AI response for prompt: "${testCase.prompt}"`).to.be.true;
  if (!result.passed) {
    cy.screenshot(testCase.prompt.replace(/[^a-zA-Z0-9]/g, "_"));
  }
});

      // Small wait to allow UI to process next prompt
      cy.wait(1000);
    });
  });
});
