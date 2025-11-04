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
  const benchmark = Cypress.env("benchmarkScore"); // single source of truth

  cy.fixture("TestData/ChatbotPrompts.json").as("chatData");

  cy.get("@chatData").then((data) => {
    const testPrompts = data.aiChatbotTests;

    cy.wrap(testPrompts).each((testCase) => {
      cy.log(`Running prompt: "${testCase.prompt}"`);

      // open new chat
      cy.get("#sidebar-new-chat-button div.text-body-primary").click({ force: true });

      // ensure input visible and send prompt
      cy.get("#chat-input").should("be.visible").clear().type(`${testCase.prompt}{enter}`);

      cy.wait(50000); // wait for processing to start
      // wait for a response element to appear — avoid fixed long waits
      cy.get("#response-content-container", { timeout: 500000 })
        .should("exist")
        .scrollIntoView()
        .should("be.visible")
        .invoke("text")
        .then((actualResponse) => {


          // Assert input cleared after send
          cy.get("#chat-input").should("have.value", "");

          // Call backend scorer (semantic + keyword)
          cy.checkAIResponse(testCase.expectedMeaning, actualResponse, testCase.keywords)
            .then(score => {
              const numericScore = Number((score.final_score * 100).toFixed(2));

              const record = {
                prompt: testCase.prompt,
                expectedKeywords: testCase.keywords,
                actualResponse,
                matchedKeywords: score.matchedKeywords || [],
                score: numericScore,                     // numeric
                status: numericScore >= benchmark * 100 ? "PASS" : "FAIL",
                screenshot: numericScore >= benchmark * 100 ? null : `screenshots/${Cypress.spec.name}/${testCase.prompt}.png`
              };

              cy.storeAIResult(record);

              // Assert main pass criteria
              expect(score.final_score >= benchmark, `AI response for prompt: "${testCase.prompt}"`).to.be.true;

              // On fail, capture screenshot for debugging
              if (numericScore < benchmark * 100) {
                cy.screenshot(testCase.prompt.replace(/[^a-zA-Z0-9]/g, "_"));
              }
            });
        });

      // short pause to let UI settle
      cy.wait(800);
    });
  });
});
