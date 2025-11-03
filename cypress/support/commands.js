// Global AI result storage
let aiTestResults = [];

/**
 * Store AI test result
 */
Cypress.Commands.add("storeAIResult", (result) => {
  aiTestResults.push(result);
});

/**
 * Write AI JSON report
 */
Cypress.Commands.add("writeAIReport", () => {
  cy.writeFile("cypress/reports/ai-chatbot-report.json", aiTestResults);
});

/**
 * Generate AI HTML report
 */
Cypress.Commands.add("generateAIChatReport", () => {
  const benchmark = Cypress.env("benchmarkScore");
  let rows = "";

  aiTestResults.forEach(r => {
    const matchedSet = new Set(r.matchedKeywords.map(k => k.toLowerCase()));
    const allKeywords = r.expectedKeywords.map(k => k.toLowerCase());

    const highlightedKeywords = allKeywords.map(k => {
      return matchedSet.has(k)
        ? `<span style="color:green;font-weight:bold">${k}</span>`
        : `<span style="color:red;font-weight:bold">${k}</span>`;
    }).join(", ");

    rows += `
      <tr>
        <td>${r.prompt}</td>
        <td>${r.actualResponse}</td>
        <td>${highlightedKeywords || "-"}</td>
        <td>${r.matchedKeywords.join(", ") || "-"}</td>
        <td>${r.score}%</td>
        <td style="color:${r.score >= benchmark * 100 ? "green" : "red"}">
          ${r.score >= benchmark * 100 ? "PASS" : "FAIL"}
        </td>
      </tr>`;
  });

  const html = `
  <html>
  <head>
    <meta charset="UTF-8">
    <title>AI Chatbot Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #343a40; color: #fff; }
      tr:nth-child(even) { background: #f2f2f2; }
      span { padding: 2px 4px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h2>AI Chatbot Test Report</h2>
    <p><strong>Benchmark:</strong> ${benchmark * 100}%</p>
    <table>
      <tr>
        <th>Prompt</th>
        <th>Bot Response</th>
        <th>Expected Keywords (Green = Matched, Red = Not Matched)</th>
        <th>Matched Keywords</th>
        <th>Score</th>
        <th>Status</th>
      </tr>
      ${rows}
    </table>
  </body>
  </html>`;

  cy.writeFile("cypress/reports/ai-chatbot-report.html", html);
});


/**
 * Check AI response via backend scoring endpoint
 */
Cypress.Commands.add("checkAIResponse", (expectedMeaning, actualResponse, keywords = []) => {
  const benchmark = Cypress.env("benchmarkScore");

  return cy.request("POST", "http://localhost:8000/score", {
    expectedMeaning,
    actualResponse,
    keywords,
    benchmark // send explicitly to backend
  }).then(res => {
    expect(res.body.final_score, "AI response score").to.be.gte(benchmark);
    return res.body;
  });
});
