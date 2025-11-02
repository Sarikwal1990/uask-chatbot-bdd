// Global result storage
let aiTestResults = [];

Cypress.Commands.add("storeAIResult", (result) => {
  aiTestResults.push(result);
});

Cypress.Commands.add("writeAIReport", () => {
  cy.writeFile("cypress/reports/ai-chatbot-report.json", aiTestResults);
});

Cypress.Commands.add("generateAIHtmlReport", () => {
  cy.readFile("cypress/reports/ai-chatbot-report.json").then(results => {

    let rows = results.map(r => `
      <tr class="${r.status}">
        <td>${r.prompt}</td>
        <td>${r.score}%</td>
        <td>${r.status}</td>
        <td>${(r.matchedKeywords || []).join(", ")}</td>
        <td>${r.screenshot ? `<a href="../${r.screenshot}">View Screenshot</a>` : "-"}</td>
      </tr>
    `).join("");

    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.length - passed;

    const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top:20px; }
        td, th { border:1px solid #ddd; padding:8px; text-align:left; }
        tr.FAIL { background:#ffe5e5; }
        tr.PASS { background:#e8ffe8; }
        .chart {height:400px;}
      </style>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h2>AI Chatbot Test Report</h2>
      <canvas id="pieChart" class="chart"></canvas>
      <table>
        <tr><th>Prompt</th><th>Score</th><th>Status</th><th>Matched Keywords</th><th>Screenshot</th></tr>
        ${rows}
      </table>
      <script>
        const ctx = document.getElementById("pieChart");
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ["PASS", "FAIL"],
            datasets: [{
              data: [${passed}, ${failed}]
            }]
          }
        });
      </script>
    </body>
    </html>
    `;

    cy.writeFile("cypress/reports/ai-chatbot-report.html", html);
  });
});

