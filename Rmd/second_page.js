document.addEventListener("DOMContentLoaded", () => {
  const teams = [
    "Berliner SC II", "TSV Rudow Berlin", "BFC Preussen II", "BFC Meteor 06",
    "BSV Eintracht Mahlsdorf II", "SC Borsigwalde 1910", "Berliner SV 1892",
    "FC Viktoria 1889 Berlin II", "FC Internationale Berlin 1980", "Türkiyemspor Berlin",
    "Köpenicker FC", "BSV Al-Dersimspor", "FSV Berolina Stralau 1901",
    "SV Empor Berlin II", "SV Stern Britz 1889", "VfB Concordia Britz 1916"
  ];

  const categoryConfig = {
    tore: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/goals.csv",
      render: loadAndDisplayGoalsChart,
    },
    formation: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/formation_data.csv",
      render: loadAndDisplayFormationCharts,
    },
    beste_spieler: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/best_score.csv",
      render: loadAndDisplayTable,
    },
    torschuetzen: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/goalscorer.csv",
      render: loadAndDisplayTable,
    },
    assists: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/assists.csv",
      render: loadAndDisplayTable,
    },
    scorer: {
      filePath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/scorerpoints.csv",
      render: loadAndDisplayTable,
    },
  };

  const teamSelect = document.getElementById("teamSelect");
  const categorySelect = document.getElementById("categorySelect");
  const chartCanvas = document.getElementById("chart");
  const statsTable = document.getElementById("statsTable");
  const goalSummaryTable = document.getElementById("goalSummaryTable");

  populateDropdown(teamSelect, teams);
  populateDropdown(categorySelect, Object.keys(categoryConfig));

  teamSelect.addEventListener("change", handleSelection);
  categorySelect.addEventListener("change", handleSelection);

  function populateDropdown(selectElement, items) {
    items.forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, " ");
      selectElement.appendChild(option);
    });
  }

  function handleSelection() {
    const selectedTeam = teamSelect.value;
    const selectedCategory = categorySelect.value;

    if (!selectedTeam || !selectedCategory) {
      alert("Bitte wähle ein Team und eine Kategorie.");
      return;
    }

    const { filePath, render } = categoryConfig[selectedCategory];
    clearDisplay();
    render(filePath, selectedTeam);
  }

  function clearDisplay() {
    chartCanvas.style.display = "none";
    statsTable.style.display = "none";
    goalSummaryTable.style.display = "none";
    document.querySelectorAll("#formation-charts canvas, #formation-summary-table").forEach(el => {
      el.style.display = "none";
    });
  }

  function loadAndDisplayGoalsChart(filePath, team) {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.filter(row => row.team === team || row.opponent === team);
        const chartData = processGoalData(data, team);
        chartCanvas.style.display = "block";
        renderBarChart(chartCanvas, "Tore und Gegentore", chartData.labels, chartData.bins, chartData.binsOpponent);
      },
      error: () => alert("Fehler beim Laden der Daten.")
    });
  }

  function loadAndDisplayFormationCharts(filePath, team) {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Team === team);
        renderFormationAnalysis(data);
      },
      error: () => alert("Fehler beim Laden der Daten.")
    });
  }

  function loadAndDisplayTable(filePath, team) {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Team == team);
        statsTable.style.display = "table";
        createTable(statsTable, data);
      },
      error: () => alert("Fehler beim Laden der Daten.")
    });
  }

  function processGoalData(data, team) {
    const bins = Array(18).fill(0);
    const binsOpponent = Array(18).fill(0);

    data.forEach(row => {
      const minute = parseInt(row.minute, 10);
      if (!isNaN(minute)) {
        const binIndex = Math.floor(minute / 5);
        if (row.team === team) {
          bins[binIndex] += 1;
        } else if (row.opponent === team) {
          binsOpponent[binIndex] += 1;
        }
      }
    });

    return {
      bins,
      binsOpponent,
      labels: Array.from({ length: 18 }, (_, i) => `${i * 5}-${i * 5 + 5}min`),
    };
  }

  function renderFormationAnalysis(data) {
    const overallFormationCounts = countBy(data, "Formation");
    const formationCharts = {
      "formation-overall-chart": overallFormationCounts,
      "formation-win-chart": countBy(data.filter(row => parseInt(row.Tore) > parseInt(row.Gegentore)), "Formation"),
      "formation-home-away-chart": { home: countBy(data.filter(row => row.Wo === "home"), "Formation"), away: countBy(data.filter(row => row.Wo === "away"), "Formation") },
      "formation-platz-chart": sumBy(data, "Formation", "Platz"),
    };

    Object.keys(formationCharts).forEach(id => {
      const canvas = document.getElementById(id);
      canvas.style.display = "block";
      const chartData = formationCharts[id];
      if (id === "formation-home-away-chart") {
        renderBarChart(canvas, "Heim- und Auswärtsformationen", Object.keys(chartData.home), Object.values(chartData.home), Object.values(chartData.away));
      } else {
        renderBarChart(canvas, id.replace(/-/g, " "), Object.keys(chartData), Object.values(chartData));
      }
    });

    const teamData = summarizeTeamData(data);
    const summaryTable = document.getElementById("formation-summary-table");
    summaryTable.style.display = "table";
    createTable(summaryTable, teamData);
  }

  function countBy(data, key) {
    return data.reduce((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + 1;
      return acc;
    }, {});
  }

  function sumBy(data, groupBy, sumKey) {
    return data.reduce((acc, item) => {
      acc[item[groupBy]] = (acc[item[groupBy]] || 0) + parseInt(item[sumKey]);
      return acc;
    }, {});
  }

  function summarizeTeamData(data) {
    const teams = data.reduce((acc, row) => {
      if (!acc[row.Team]) acc[row.Team] = { Wechsel: 0, Formations: [] };
      acc[row.Team].Wechsel += parseInt(row.Wechsel);
      acc[row.Team].Formations.push(row.Formation);
      return acc;
    }, {});

    return Object.keys(teams).map(team => ({
      Team: team,
      "Durchschnittliche Wechsel": (teams[team].Wechsel / teams[team].Formations.length).toFixed(2),
      "Letzte 5 Formationen": teams[team].Formations.slice(-5).join(", "),
    }));
  }

  function renderBarChart(canvas, title, labels, data1, data2 = null) {
    const ctx = canvas.getContext("2d");
    if (window.myChart) window.myChart.destroy();

    const datasets = [{ label: "Anzahl", data: data1, backgroundColor: "rgba(54, 162, 235, 0.6)" }];
    if (data2) datasets.push({ label: "Gegner", data: data2, backgroundColor: "rgba(255, 99, 132, 0.6)" });

    window.myChart = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  function createTable(table, data) {
    table.innerHTML = "";
    if (data.length === 0) {
      table.innerHTML = "<tr><td>Keine Daten verfügbar</td></tr>";
      return;
    }

    const headers = Object.keys(data[0]);
    const headerRow = `<tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>`;
    const rows = data.map(row => `<tr>${headers.map(key => `<td>${row[key]}</td>`).join("")}</tr>`).join("");

    table.innerHTML = `<thead>${headerRow}</thead><tbody>${rows}</tbody>`;
  }
});
