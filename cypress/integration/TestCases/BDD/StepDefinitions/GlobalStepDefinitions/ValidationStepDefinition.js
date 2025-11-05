// cypress/integration/Testcases/BDD/StepDefinitions/Validationstepdefinition.js
import { parseVariableValue } from "../../../../../utils/utility";

const {
  Given,
  When,
  Then,
} = require("@badeball/cypress-cucumber-preprocessor");

//Importing and renaming the variables from hook.js
const { testDataMap, pageDataMap } = require("./hooks");

// Verify that URL contains "Test String"
Then(/^Verify that URL contains "([^"]*)"$/, function (value) {
  value = parseVariableValue(value, testDataMap);
  cy.url({ timeout: 20000 }).should("include", value);
});

// Run AI prompt tests from test data
Then("Run all AI prompt tests from test data", () => {
  const benchmark = Cypress.env("benchmarkScore");

  cy.fixture("TestData/ChatbotPrompts.json").as("chatData");

  cy.get("@chatData").then((data) => {
    const testPrompts = data.aiChatbotTests;

    cy.wrap(testPrompts).each((testCase) => {
      cy.log(`Prompt: "${testCase.prompt}"`);

      // Start fresh chat
      cy.get("#sidebar-new-chat-button div.text-body-primary").click({ force: true });

      cy.get("#chat-input")
        .should("be.visible")
        .clear()
        .type(`${testCase.prompt}{enter}`);

      cy.get('.overflow-x-auto.buttons').should('be.visible');
      
      cy.get("#response-content-container", { timeout: 500000 })
        .should("exist")
        .scrollIntoView()
        .invoke("text")
        .then((actualResponse) => {

          cy.get("#chat-input").should("have.value", "");

          cy.checkAIResponse(testCase.expectedMeaning, actualResponse, testCase.keywords)
            .then(score => {

              const numericScore = Number((score.final_score * 100).toFixed(2));
              const passed = numericScore >= benchmark * 100;

              // ✅ Push results to report collector
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

              // ✅ Log result instead of failing the test flow
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

