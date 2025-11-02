// Global result storage
let aiTestResults = [];

Cypress.Commands.add("storeAIResult", (result) => {
  aiTestResults.push(result);
});

Cypress.Commands.add("writeAIReport", () => {
  cy.writeFile("cypress/reports/ai-chatbot-report.json", aiTestResults);
});

// Cypress.Commands.add("generateAIHtmlReport", () => {
//   cy.readFile("cypress/reports/ai-chatbot-report.json").then(results => {

//     let rows = results.map(r => `
//       <tr class="${r.status}">
//         <td>${r.prompt}</td>
//         <td>${r.score}%</td>
//         <td>${r.status}</td>
//         <td>${(r.matchedKeywords || []).join(", ")}</td>
//         <td>${r.screenshot ? `<a href="../${r.screenshot}">View Screenshot</a>` : "-"}</td>
//       </tr>
//     `).join("");

//     const passed = results.filter(r => r.status === "PASS").length;
//     const failed = results.length - passed;
//     const total = results.length;
//     const passPercent = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
//     const failPercent = total > 0 ? ((failed / total) * 100).toFixed(1) : 0;

//     const html = `
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <title>AI Chatbot Test Report</title>
//       <style>
//         body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
//         h2 { text-align: center; }
//         table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
//         td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
//         tr.FAIL { background: #ffe5e5; }
//         tr.PASS { background: #e8ffe8; }
//         th { background: #007bff; color: white; }
//         .chart-container {
//           width: 300px;
//           height: 300px;
//           margin: 20px auto;
//           position: relative;
//         }
//         .summary {
//           text-align: center;
//           font-size: 16px;
//           margin-bottom: 10px;
//         }
//       </style>
//       <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//       <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
//     </head>
//     <body>
//       <h2>AI Chatbot Test Report</h2>

//       <div class="summary">
//         <strong>Total Tests:</strong> ${total} |
//         <span style="color:#4caf50;">PASS: ${passed} (${passPercent}%)</span> |
//         <span style="color:#f44336;">FAIL: ${failed} (${failPercent}%)</span>
//       </div>

//       <div class="chart-container">
//         <canvas id="pieChart"></canvas>
//       </div>

//       <table>
//         <tr><th>Prompt</th><th>Score</th><th>Status</th><th>Matched Keywords</th><th>Screenshot</th></tr>
//         ${rows}
//       </table>

//       <script>
//         const ctx = document.getElementById("pieChart");
//         new Chart(ctx, {
//           type: 'pie',
//           data: {
//             labels: ["PASS", "FAIL"],
//             datasets: [{
//               data: [${passed}, ${failed}],
//               backgroundColor: ['#4caf50', '#f44336']
//             }]
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//               legend: {
//                 position: 'bottom'
//               },
//               datalabels: {
//                 color: '#fff',
//                 font: {
//                   weight: 'bold',
//                   size: 14
//                 },
//                 formatter: (value, ctx) => {
//                   const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
//                   const percentage = total ? ((value / total) * 100).toFixed(1) + "%" : "0%";
//                   return percentage;
//                 }
//               }
//             }
//           },
//           plugins: [ChartDataLabels]
//         });
//       </script>
//     </body>
//     </html>
//     `;

//     cy.writeFile("cypress/reports/ai-chatbot-report.html", html);
//   });
// });

Cypress.Commands.add("generateAIHtmlReport", () => {
  cy.readFile("cypress/reports/ai-chatbot-report.json").then(results => {

    // Compute dynamic rows
    let rows = results.map(r => {
      const expected = r.expectedKeywords || [];
      const matched = r.matchedKeywords || [];
      const missed = expected.filter(k => !matched.includes(k));

      return `
        <tr class="${r.status}">
          <td>${r.prompt}</td>
          <td>${r.score}</td>
          <td>${r.status}</td>
          <td>${expected.join(", ") || "-"}</td>
          <td><span style="color:#2e7d32;">${matched.join(", ") || "-"}</span></td>
          <td><span style="color:#c62828;">${missed.join(", ") || "-"}</span></td>
          <td>${r.screenshot ? `<a href="../${r.screenshot}">View Screenshot</a>` : "-"}</td>
        </tr>
      `;
    }).join("");

    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.length - passed;
    const total = results.length;
    const passPercent = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const failPercent = total > 0 ? ((failed / total) * 100).toFixed(1) : 0;

    const html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI Chatbot Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        td, th { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
        tr.FAIL { background: #ffe5e5; }
        tr.PASS { background: #e8ffe8; }
        th { background: #007bff; color: white; }
        .chart-container {
          width: 300px;
          height: 300px;
          margin: 20px auto;
          position: relative;
        }
        .summary {
          text-align: center;
          font-size: 16px;
          margin-bottom: 10px;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
    </head>
    <body>
      <h2>AI Chatbot Test Report</h2>

      <div class="summary">
        <strong>Total Tests:</strong> ${total} |
        <span style="color:#4caf50;">PASS: ${passed} (${passPercent}%)</span> |
        <span style="color:#f44336;">FAIL: ${failed} (${failPercent}%)</span>
      </div>

      <div class="chart-container">
        <canvas id="pieChart"></canvas>
      </div>

      <table>
        <tr>
          <th>Prompt</th>
          <th>Score</th>
          <th>Status</th>
          <th>Expected Keywords</th>
          <th>Matched Keywords ✅</th>
          <th>Missed Keywords ❌</th>
          <th>Screenshot</th>
        </tr>
        ${rows}
      </table>

      <script>
        const ctx = document.getElementById("pieChart");
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ["PASS", "FAIL"],
            datasets: [{
              data: [${passed}, ${failed}],
              backgroundColor: ['#4caf50', '#f44336']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 14 },
                formatter: (value, ctx) => {
                  const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = total ? ((value / total) * 100).toFixed(1) + "%" : "0%";
                  return percentage;
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      </script>
    </body>
    </html>
    `;

    cy.writeFile("cypress/reports/ai-chatbot-report.html", html);
  });
});



