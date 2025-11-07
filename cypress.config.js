const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const addCucumberPreprocessorPlugin =
  require("@badeball/cypress-cucumber-preprocessor").addCucumberPreprocessorPlugin;
const fs = require("fs");
const path = require("path");

async function setupNodeEvents(on, config) {
  // Ensure directories exist before tests start
  const reportsDir = path.join(__dirname, "cypress", "reports");
  const logsDir = path.join(__dirname, "logs");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Add Cucumber preprocessor for generating JSON reports
  await addCucumberPreprocessorPlugin(on, config);

  // Esbuild bundler for feature file preprocessing
  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin.default(config)],
    })
  );

  // Centralized log management — all custom logs go here
  on("task", {
    log(message) {
      const logFile = path.join(reportsDir, "execution.log");
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
      console.log(message);
      return null;
    },
  });

  return config;
}

module.exports = defineConfig({
  video: true,
  env: {
    TAGS: "not @ignore",
    ENV: "sandbox",
    benchmarkScore: 0.3, // AI response must score >= 30%
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
