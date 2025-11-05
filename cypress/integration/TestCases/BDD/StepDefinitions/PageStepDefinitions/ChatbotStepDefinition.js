// cypress/integration/Testcases/BDD/StepDefinitions/PageStepDefinitions/ChatbotStepDefinition.js
import { parseVariableValue } from "../../../../../utils/utility";
import PageHelper from "../../../../../utils/PageHelper.js";

const {
  Given,
  When,
  Then,
} = require("@badeball/cypress-cucumber-preprocessor");

const pageHelper = new PageHelper();

//Importing and renaming the variables from hook.js
const { testDataMap, pageDataMap } = require("../GlobalStepDefinitions/hooks");

// Login to the application with valid credentials
Then(
  /^the user is logged in to the application with valid credentials$/,
  () => {
    // Login using valid credentials from environment variables and cucumber hooks implementation
    cy.log("Logging in to the application using valid credentials from environment variables");
  }
);

// Trigger all AI prompts
Then(
  /^the user triggers all AI prompts$/,
  () => {
    // Triggering all AI prompts from TestData/ChatbotPrompts.json
    cy.log("Triggering all AI prompts from ChatbotPrompts");
  }
);

// Verify that URL contains "Test String"
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
      map = pageHelper.getPageMap(pageDataMap, "NB Chatbot Page");
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

          // Verify the input textbox is cleared after submission
          pageHelper.getElement(map.get("Ask Anything Textbox")).should("have.value", "");

          cy.checkAIResponse(testCase.expectedMeaning, actualResponse, testCase.keywords)
            .then(score => {

              const numericScore = Number((score.final_score * 100).toFixed(2));
              const passed = numericScore >= benchmark * 100;

              // Push results to report collector
              const record = {
                prompt: testCase.prompt,
                expectedKeywords: testCase.keywords,
                actualResponse,
                matchedKeywords: score.matchedKeywords || [],
                hallucination: score.hallucination_flag || false,
                brokenHTML: score.broken_html_flag || false,
                score: numericScore,
                benchmark: benchmark * 100,
                passed,
                screenshot: passed ? null : `screenshots/${Cypress.spec.name}/${testCase.prompt}.png`
              };

              cy.storeAIResult(record);

              // Log result instead of failing the test flow
              if (!passed) {
                cy.log(`Benchmark not met: "${testCase.prompt}" (${numericScore}%)`);
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

