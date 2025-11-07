// Global AI result storage
let aiTestResults = [];

/**
 * Escape HTML for safe rendering
 */
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Store AI test result
 */
Cypress.Commands.add("storeAIResult", (result) => {
  aiTestResults.push(result);

  const safeNumber = (value) => (typeof value === "number" ? value : 0);

  console.table([
    {
      Prompt: result.prompt,
      "Semantic Score": `${(safeNumber(result.semantic) * 100).toFixed(2)}%`,
      Benchmark: `${Cypress.env("benchmarkScore") * 100}%`,
      Hallucination: result.hallucination_flag ? "Yes" : "No",
      "Broken HTML": result.broken_html_flag ? "Yes" : "No",
      "Final Score": `${(safeNumber(result.final_score) * 100).toFixed(2)}%`,
      Status: safeNumber(result.final_score) >= Cypress.env("benchmarkScore") ? "PASS" : "FAIL",
    },
  ]);
});

/**
 * Write AI JSON report
 */
Cypress.Commands.add("writeAIReport", () => {
  cy.writeFile("cypress/reports/ai-chatbot-report.json", aiTestResults);
});

/**
 * Generate AI HTML report (Semantic-based)
 */
Cypress.Commands.add("generateAIChatReport", () => {
  const benchmark = Cypress.env("benchmarkScore");
  const safeNumber = (value) => (typeof value === "number" ? value : 0);
  let rows = "";

  const totalTests = aiTestResults.length;
  const passedTests = aiTestResults.filter((r) => r.final_score >= benchmark).length;
  const failedTests = totalTests - passedTests;

  const passPercent = ((passedTests / totalTests) * 100).toFixed(2);
  const failPercent = ((failedTests / totalTests) * 100).toFixed(2);

  aiTestResults.forEach((r) => {
    const status = r.final_score >= benchmark ? "PASS" : "FAIL";
    const color = status === "PASS" ? "green" : "red";

    rows += `
      <tr>
        <td>${escapeHTML(r.prompt || "-")}</td>
        <td>${escapeHTML(r.actualResponse || "-")}</td>
        <td>${(safeNumber(r.semantic) * 100).toFixed(2)}%</td>
        <td>${r.hallucination_flag ? "Yes" : "No"}</td>
        <td>${r.broken_html_flag ? "Yes" : "No"}</td>
        <td style="color:${color}; font-weight:bold">${(safeNumber(r.final_score) * 100).toFixed(2)}%</td>
        <td style="color:${color}; font-weight:bold">${status}</td>
      </tr>`;
  });

  const html = `
  <html>
  <head>
    <meta charset="UTF-8">
    <title>AI Chatbot Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
      table { width: 100%; border-collapse: collapse; margin-top:20px; }
      th, td { border: 1px solid #ddd; padding: 10px; vertical-align: top; }
      th { background: #343a40; color: #fff; }
      tr:nth-child(even) { background: #f2f2f2; }
      .chart-container { width: 250px; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h2>AI Chatbot Test Report (Semantic Evaluation)</h2>
    <p><strong>Benchmark:</strong> ${(benchmark * 100).toFixed(2)}%</p>

    <!-- Pie Chart -->
    <div class="chart-container">
      <canvas id="passFailChart"></canvas>
    </div>

    <table>
      <tr>
        <th>Prompt</th>
        <th>Bot Response</th>
        <th>Semantic Score</th>
        <th>Hallucination</th>
        <th>Broken HTML</th>
        <th>Final Score</th>
        <th>Status</th>
      </tr>
      ${rows}
    </table>

    <script>
      const ctx = document.getElementById('passFailChart').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Pass (${passPercent}%)', 'Fail (${failPercent}%)'],
          datasets: [{
            data: [${passedTests}, ${failedTests}],
            backgroundColor: ['#28a745', '#dc3545']
          }]
        }
      });
    </script>
  </body>
  </html>`;

  cy.writeFile("cypress/reports/ai-chatbot-report.html", html);
});

/**
 * Check AI response via backend scoring endpoint
 * (purely semantic)
 */
Cypress.Commands.add("checkAIResponse", (expectedMeaning, actualResponse) => {
  const benchmark = Cypress.env("benchmarkScore");

  return cy
    .request({
      method: "POST",
      url: "http://localhost:8000/score",
      body: { expectedMeaning, actualResponse, benchmark },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (!res.body || typeof res.body.final_score !== "number") {
        return {
          semantic: 0,
          final_score: 0,
          hallucination_flag: false,
          broken_html_flag: false,
        };
      }
      return res.body;
    });
});

// Log AI response details
Cypress.Commands.add("logAIResponse", (prompt, response, score) => {
  const logEntry = `
  --- AI Chatbot Validation ---
  Prompt: ${prompt}
  Response: ${response.substring(0, 200)}...
  Score: ${score.final_score}
  Pass: ${score.pass || (score.final_score >= Cypress.env("benchmarkScore"))}
  ------------------------------
  `;
  cy.task("log", logEntry);
});
