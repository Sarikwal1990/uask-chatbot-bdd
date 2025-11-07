import { parseVariableValue } from "../../../../../utils/utility";
import PageHelper from "../../../../../utils/PageHelper.js";

const { Given, When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const pageHelper = new PageHelper();

// Importing and renaming the variables from hook.js
const { testDataMap, pageDataMap } = require("../GlobalStepDefinitions/hooks");

// Login to the application with valid credentials
Then(
  /^the user is logged in to the application with valid credentials$/,
  () => {
    cy.log("Logging in to the application using valid credentials from environment variables");
  }
);

// Trigger all AI prompts
Then(
  /^the user triggers all AI prompts$/,
  () => {
    cy.log("Triggering all AI prompts from ChatbotPrompts");
  }
);

// Verify that URL contains a given string
Then(/^Verify that URL contains "([^"]*)"$/, function (value) {
  value = parseVariableValue(value, testDataMap);
  cy.url({ timeout: 20000 }).should("include", value);
});

// Run AI prompt tests from test data
Then("all AI prompt tests should run successfully using the test data", () => {
  const benchmark = Cypress.env("benchmarkScore");

  cy.fixture("TestData/ChatbotPrompts.json").as("chatData");

  cy.get("@chatData").then((data) => {
    const testPrompts = data.aiChatbotTests;

    cy.wrap(testPrompts).each((testCase) => {
      cy.log(`Prompt: "${testCase.prompt}"`);

      // Start fresh chat
      const map = pageHelper.getPageMap(pageDataMap, "NB Chatbot Page");
      pageHelper.getElement(map.get("New Chat Button")).click({ force: true });

      pageHelper.getElement(map.get("Ask Anything Textbox"))
        .should("be.visible")
        .clear()
        .type(`${testCase.prompt}{enter}`);

      pageHelper.getElement(map.get("Like/Dislike Buttons")).should('be.visible');

      pageHelper.getElement(map.get("Response Content"))
        .should("exist")
        .scrollIntoView()
        .invoke("text")
        .then((actualResponse) => {

          actualResponse = actualResponse.trim();
          pageHelper.getElement(map.get("Ask Anything Textbox")).should("have.value", "");

          cy.checkAIResponse(testCase.expectedMeaning, actualResponse)
            .then(score => {
              const semanticScore = score.semantic ?? 0;
              const finalScore = score.final_score ?? 0;
              const passed = finalScore >= benchmark;

              // Push results to report collector
              const record = {
                prompt: testCase.prompt,
                actualResponse,
                semantic: semanticScore,
                final_score: finalScore,
                hallucination_flag: score.hallucination_flag || false,
                broken_html_flag: score.broken_html_flag || false,
                benchmark,
                passed,
                screenshot: passed ? null : `screenshots/${Cypress.spec.name}/${testCase.prompt}.png`
              };

              cy.storeAIResult(record);

              if (!passed) {
                cy.log(`Benchmark not met: "${testCase.prompt}" (${(finalScore * 100).toFixed(2)}%)`);
                cy.screenshot(testCase.prompt.replace(/[^a-zA-Z0-9]/g, "_"));
              } else {
                cy.log(`Passed benchmark: "${testCase.prompt}"`);
              }
            });
        });

      cy.wait(800);
    });
  });
});
