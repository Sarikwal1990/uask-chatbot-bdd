@CacheClear @Regression
Feature: AI Chatbot  

    This feature targets testing of Chatbot

    Background: Login in to the application and go to Chatbot
    Then Verify that URL contains "govgpt.sandbox.dge.gov.ae"

  @NBLogin
  Scenario: Validate all chatbot prompts
    Then Run all AI prompt tests from test data