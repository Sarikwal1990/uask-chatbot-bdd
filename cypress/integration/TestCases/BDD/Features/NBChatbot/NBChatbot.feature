@CacheClear @Regression
Feature: AI Chatbot  

    This feature targets testing of Chatbot

    Background: User logs into the application and navigates to Chatbot
    Given the user is logged in to the application with valid credentials
    Then Verify that URL contains "govgpt.sandbox.dge.gov.ae"

  @NBLogin
  Scenario: Validate all chatbot prompts
    When the user triggers all AI prompts
    Then all AI prompt tests should run successfully using the test data