UAsk Chatbot BDD Automation

This repository contains BDD-style Cypress automation for testing the AI Chatbot application. The tests include multilingual support (English and Arabic) and AI response validation using semantic scoring.

Project Structure
uask-chatbot-bdd/
│
├─ ai-engine/
│  ├─ app.py           # FastAPI backend for AI response scoring
│  └─ scorer.py        # Semantic + keyword + hallucination scoring logic
│
├─ cypress/
│  ├─ fixtures/
│  │  ├─ PageFactory/  # Page selectors
│  │  │  ├─ NBChatPage.json
│  │  │  └─ NBLoginPage.json
│  │  └─ TestData/     # Test prompt data
│  │     └─ ChatbotPrompts.json
│  ├─ integration/
│  │  └─ TestCases/BDD/
│  │     ├─ Features/NBChatbot.feature
│  │     └─ StepDefinitions/
│  │         ├─ GlobalStepDefinitions/
│  │         └─ PageStepDefinitions/
│  ├─ support/          # Cypress custom commands and AI result storage
│  ├─ utils/            # Helper classes (PageHelper.js, Utility.js)
│  ├─ reports/          # AI HTML/JSON reports (generated after test run)
│  └─ videos/           # Test run videos
│
├─ package.json
├─ cypress.config.js
├─ README.md
└─ venv/               # Python virtual environment

Prerequisites

Node.js >= 18.x

Python >= 3.9

pip / virtualenv

Google Chrome or any supported browser for Cypress

Installation

Clone the repository:

git clone <https://github.com/Sarikwal1990/uask-chatbot-bdd.git>
cd uask-chatbot-bdd


Create a Python virtual environment and install dependencies:

python -m venv venv
venv\Scripts\activate        # Windows
# OR
source venv/bin/activate     # macOS/Linux

pip install -r ai-engine/requirements.txt


Install Node.js dependencies:

npm install

Running the Tests
Start Backend Scoring Service

The FastAPI backend is required to compute AI response scores.

npm run start:backend


This runs the service at http://localhost:8000.

Run Cypress Tests

Headless Mode:

npm run cy:headless


Interactive Mode (UI):

npm run cy:ui


Mobile Viewport Simulation:

npm run cy:mobile


Run Tests in Chrome (headed):

npm run cy:run:chrome

Stop Backend
npm run stop:backend


Note: The scripts cy:run and cy:open automatically start and stop the backend during test execution.

Configuring Test Language

The test data supports both English and Arabic prompts. You can configure or extend the test language by updating cypress/fixtures/TestData/ChatbotPrompts.json:

{
  "aiChatbotTests": [
    {
      "prompt": "كيف يمكنني تجديد بطاقة الهوية الإماراتية؟",
      "expectedMeaning": "المستخدم يريد معرفة كيفية تجديد بطاقة الهوية الإماراتية",
      "keywords": ["تجديد", "بطاقة الهوية", "الإمارات"]
    }
  ]
}


prompt → The user input to the chatbot

expectedMeaning → What the chatbot is expected to understand

keywords → Keywords to match in the response

Reports and Screenshots

JSON and HTML reports are generated automatically after test execution:

cypress/reports/ai-chatbot-report.json
cypress/reports/ai-chatbot-report.html


Failed test cases are captured as screenshots:

cypress/screenshots/<spec_name>/<prompt>.png


HTML report includes:

Pie chart of pass/fail ratio

Prompt-wise score

Highlighted expected keywords (green = matched, red = missing)

Actual response

Backend Scoring Engine

ai-engine/app.py exposes a scoring API:

POST http://localhost:8000/score
Body:
{
    "expectedMeaning": "...",
    "actualResponse": "...",
    "keywords": ["..."],
    "benchmark": 0.3
}


ai-engine/scorer.py computes:

Semantic similarity (using multilingual SentenceTransformer)

Keyword matching

Hallucination detection

Broken HTML detection

Final weighted score (0–1)

Cypress uses this backend via cy.checkAIResponse() command to validate AI responses in real-time.

Notes

Default AI benchmark score: 30% (configurable in cypress.config.js under env.benchmarkScore)

Clear cookies, local storage, and session storage before regression runs.

Supports @CacheClear, @Regression, @NBLogin tags for selective execution.

This README provides a complete guide to run your chatbot automation with Cypress + BDD.