// Global AI result storage
let aiTestResults = [];

/**
 * Store AI test result
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

Cypress.Commands.add("storeAIResult", (result) => {
  aiTestResults.push(result);

  console.table([{
    Prompt: result.prompt,
    Score: `${result.score}%`,
    Benchmark: `${Cypress.env("benchmarkScore") * 100}%`,
    Status: result.status,
    "Matched Keywords": result.matchedKeywords.join(", ") || "-"
  }]);
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

  // Calculate Pass / Fail numbers
  const totalTests = aiTestResults.length;
  const passedTests = aiTestResults.filter(r => r.score >= benchmark * 100).length;
  const failedTests = totalTests - passedTests;

  const passPercent = ((passedTests / totalTests) * 100).toFixed(2);
  const failPercent = ((failedTests / totalTests) * 100).toFixed(2);

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
        <td>${escapeHTML(r.prompt)}</td>
        <td>${escapeHTML(r.actualResponse)}</td>
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

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
      table { width: 100%; border-collapse: collapse; margin-top:20px; }
      th, td { border: 1px solid #ddd; padding: 10px; vertical-align: top; }
      th { background: #343a40; color: #fff; }
      tr:nth-child(even) { background: #f2f2f2; }
      span { padding: 2px 4px; border-radius: 4px; }
      .chart-container { width: 250px; margin-bottom: 20px; }
    </style>
  </head>

  <body>
    <h2>AI Chatbot Test Report</h2>
    <p><strong>Benchmark:</strong> ${benchmark * 100}%</p>

    <!-- Pie Chart -->
    <div class="chart-container">
      <canvas id="passFailChart"></canvas>
    </div>

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
 */
Cypress.Commands.add("checkAIResponse", (expectedMeaning, actualResponse, keywords = []) => {
  const benchmark = Cypress.env("benchmarkScore");

  return cy.request("POST", "http://localhost:8000/score", {
    expectedMeaning,
    actualResponse,
    keywords,
    benchmark
  }).then(res => {
    return res.body; // return score only
  });
});
