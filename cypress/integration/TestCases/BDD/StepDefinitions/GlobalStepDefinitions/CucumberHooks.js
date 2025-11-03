import {
  setDefaultTimeout,
  After,
  Before,
  AfterAll,
  BeforeAll,
  BeforeStep,
} from "@badeball/cypress-cucumber-preprocessor";
import { getBaseUrl } from "../../../../../utils/utility.js";

const url = getBaseUrl();
import PageHelper from "../../../../../utils/PageHelper.js";
import { pageDataMap } from "./hooks.js";
let reportWritten = false;
let done = false;

const pageHelper = new PageHelper();

BeforeAll(() => {
  Cypress.on("uncaught:exception", () => false);
  Cypress.on("unhandledrejection", () => false);
});

Before({ tags: "@CacheClear", order: 0 }, () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.clearAllSessionStorage();
});

Before({ tags: "@Regression", order: 1 }, () => {
  // cy.task("deleteFolder", downloadsFolder);
  cy.visit(url);
});

Before({ tags: "@NBLogin", order: 3 }, () => {
  cy.fixture("TestData/NBLoginData.json").then((loginData) => {
    map = pageHelper.getPageMap(pageDataMap, "NB Login Page");
    pageHelper.getElement(map.get("Email Login Button")).click();
    pageHelper.getElement(map.get("Email Textbox")).type(loginData.Email);
    pageHelper.getElement(map.get("Password Textbox")).type(loginData.Password);
    pageHelper.getElement(map.get("Login Button")).click();
  });
});

After(() => {
  if (!reportWritten) {
    reportWritten = true;
    cy.writeAIReport();
  }
});

After(() => {
  if (!done) {
    done = true;
    cy.writeAIReport().then(() => {
      cy.generateAIChatReport();
    });
  }
});
