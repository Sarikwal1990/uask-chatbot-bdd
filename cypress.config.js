const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const addCucumberPreprocessorPlugin = require("@badeball/cypress-cucumber-preprocessor").addCucumberPreprocessorPlugin;

const {
  preprocessor,
} = require("@badeball/cypress-cucumber-preprocessor/browserify");

async function setupNodeEvents(on, config) {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more.
  await addCucumberPreprocessorPlugin(on, config);

  on("file:preprocessor", createBundler({
    plugins: [createEsbuildPlugin.default(config)],
  }));

  return config;
}

module.exports = defineConfig({
  video: true,
  env: {
  TAGS: "not @ignore",
  ENV: "sandbox",
  benchmarkScore: 0.3   // AI response must score >= 30%
},
  pageLoadTimeout: 300000,
  numTestsKeptInMemory: 0,
  defaultCommandTimeout: 60000,
  chromeWebSecurity: false,
  chromeArgs: [
    "--disable-site-isolation-trials",
    "--disable-features=CrossSiteDocumentBlockingIfIsolating",
  ],
  e2e: {
    specPattern: "cypress/integration/Testcases/BDD/Features/*/*.feature",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents,
  },
});
