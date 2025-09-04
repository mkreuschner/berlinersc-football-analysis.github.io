document.addEventListener("DOMContentLoaded", () => {
  const teamSelect = document.getElementById("teamSelect");
  const categorySelect = document.getElementById("categorySelect");
  const resultContainer = document.getElementById("resultContainer");
  let chartInstance = null;
  let chartInstanceForPlatz = null;

  // ----------------------------
  // Helpers: Normalisierung & Aliasse
  // ----------------------------
  const norm = (s) =>
    (s ?? "")
      .toString()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  // Mappings für unterschiedliche Schreibweisen / Kurzformen
  const teamAliases = {
    "bsc hürtürkel": "bsc hürtürkel",
    "bfc preussen ii": "bfc preussen ii",
    "sc berliner amateure": "sc berliner amateure",
    "berolina mitte": "berolina mitte",
    "sc borsigwalde": "sc borsigwalde 1910",
    "sc borsigwalde": "sc borsigwalde",
    "berliner sv 1892": "berliner sv 1892",
    "bsv 1892": "berliner sv 1892",
    "sf johannisthal": "sf johannisthal",
    "fc internationale berlin": "fc internationale berlin 1980",
    "djk neukölln": "djk neukölln",
    "berliner sc ii": "fberliner sc ii",
    "1.fc schöneberg": "1.fc schöneberg",
    "pfeffersport": "pfeffersport",
    "berlin hilalspor": "berlin hilalspor",
    "friedenauer tsc": "friedenauer tsc",
    "sf charlottenburg-wilmmersdorf": "sf charlottenburg-wilmmersdorf",
    "sv empör berlin ii": "sv empor berlin ii"
  };
  const canon = (s) => teamAliases[norm(s)] ?? norm(s);

    // Teams und Kategorien
    const teams = ["BSC Hürtürkel", "BFC Preussen II", "SC Berliner Amateure", "Berolina Mitte",
        "SC Borsigwalde 1910", "Berliner SV 1892", "SF Johannisthal",
        "FC Internationale Berlin 1980", "DJK Neukölln", "Berliner SC II",
        "1.FC Schöneberg", "Pfeffersport", "Berlin Hilalspor",
        "SV Empor Berlin II", "SF Charlottenburg-Wilmmersdorf", "Friedenauer TSC"];


    const teamAbbreviations = {
        "BSC Hürtürkel": "HUR",
        "SV Empor Berlin II": "EMP",
        "SC Borsigwalde 1910": "BOR",
        "BFC Preussen II": "PRE",
        "SC Berliner Amateure": "AMA",
        "FC Internationale Berlin 1980": "INT",
        "Berolina Mitte": "BER",
        "SF Charlottenburg-Wilmmersdorf": "SFC",
        "Berliner SC II": "BSC",
        "SF Johannisthal": "SFJ",
        "DJK Neukölln": "DJK",
        "Berliner SV 1892": "BSV",
        "Friedenauer TSC": "FRI",
        "Berlin Hilalspor": "HIL",
        "Pfeffersport": "PFE",
        "1.FC Schöneberg": "SCH"
    };


    const categories = {
        "Prediction": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/team_rank_probabilities_H2.csv",
            columns: ["team","Rank","Count","Probability"],
            displayFunction: displayRankProbabilities
        },
        "Head-2-Head": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/head2head_H2.csv",
            columns: ["team","#","Ges_Bilanz","Rank_H","H_Bilanz","Rank_A","A_Bilanz","Rank_NR","NR_Bilanz","Rank_KR","KR_Bilanz","Rank_kKR","kKR_Bilanz","E5","E4","E3","E2","E1","Tore","Formation","Wahrscheinlichkeit","dreierKette","viererKette"],
            displayFunction: displayHeadToHead
        },
        "Exp Start11": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/exp11_H2.csv",
            columns: ["Team","Formation","Anzahl","Total_Spiele","Wahrscheinlichkeit","dreier_kette","vierer_kette","Starting11_Team","Starting11_Position","Starting11_Nummer","Starting11_Name","Starting11_Weighted_Score"],
            displayFunction: displayExpectedStarting11
        },
        "Tore": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/goals_H2.csv",
            columns: ["scorer", "team", "opponent", "minute", "score"],
            displayFunction: displayGoalsAnalysis
        },
        "Formation": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/formation_data_H2.csv",
            columns: ["Spieltag", "Team", "Gegner", "Tore", "Gegentore", "Wo", "Platz", "Formation", "Wechsel"],
            displayFunction: displayFormationAnalysis
        },
        "Letzte 5 Spiele": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/last5games_H2.csv",
            columns: ["Spieltag", "Heim", "Auswärts", "H_tore", "A_tore"],
            displayFunction: displayLastFiveGames
        },
        "Nächste 5 Spiele": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/next5games_H2.csv",
            columns: ["Spieltag", "Heim", "Auswärts", "H_tore", "A_tore"],
            displayFunction: displayNextFiveGames
        },
        "Beste Spieler": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/best_score_H2.csv",
            columns: ["Rank", "Name", "Nr", "Pos", "Spielzeit", "Score"],
            displayFunction: displayTable
        },
        "Scorerpoints": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/scorerpoints_H2.csv",
            columns: ["Rank", "Name", "Pos", "Scorerpoints", "Spiele"],
            displayFunction: displayTable
        },
        "Torschützen": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/goalscorer_H2.csv",
            columns: ["Rank", "Name", "Pos", "Tore", "Spiele"],
            displayFunction: displayTable
        },
        "Assists": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/assists_H2.csv",
            columns: ["Rank", "Name", "Pos", "Assists", "Spiele"],
            displayFunction: displayTable
        }
    };

    // ----------------------------
    // UI Helpers
    // ----------------------------
    function populateDropdown(dropdown, options, placeholder) {
        dropdown.innerHTML = `<option value="">-- ${placeholder} --</option>`;
        options.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        dropdown.appendChild(opt);
        });
    }

    function resetResultContainer() {
        resultContainer.innerHTML = "";
        resultContainer.onclick = null; // evtl. alte Click-Handler lösen
        if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
        }
        if (chartInstanceForPlatz) {
        chartInstanceForPlatz.destroy();
        chartInstanceForPlatz = null;
        }
    }

    function createBox(content, styles = {}) {
        const box = document.createElement("div");
        box.style.border = "1px solid #ddd";
        box.style.borderRadius = "0.5rem";
        box.style.marginBottom = "1rem";
        box.style.padding = "1rem";
        box.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        box.style.width = "100%";
        box.style.overflowX = "auto";
        Object.assign(box.style, styles);
        box.appendChild(content);
        return box;
    }

    function displayNoDataMessage(message) {
        const noDataMessage = document.createElement("p");
        noDataMessage.textContent = message;
        noDataMessage.style.textAlign = "center";
        noDataMessage.style.marginTop = "1rem";
        resultContainer.appendChild(noDataMessage);
    }

    function createCanvasWithTitle(titleText, container) {
        const title = document.createElement("h3");
        title.textContent = titleText;
        title.style.textAlign = "center";
        title.style.marginBottom = "1rem";
        container.appendChild(title);

        const canvas = document.createElement("canvas");
        container.appendChild(createBox(canvas, { maxWidth: "100%" }));
        return canvas;
    }


    function createResponsiveBarChart(canvas, title, labels, data, barHeight = 40) {
        const chartHeight = labels.length * barHeight;
        canvas.style.height = `${chartHeight}px`;
        canvas.style.width = "100%";

        return new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [
            {
                label: title,
                data,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
            },
            plugins: {
            legend: { display: false }
            }
        }
        });
    }

    function createResponsiveGroupedBarChart(
        canvas,
        title,
        labels,
        groupedData,
        barHeight = 40
    ) {
        const chartHeight = labels.length * barHeight;
        canvas.style.height = `${chartHeight}px`;
        canvas.style.width = "100%";

        const datasets = Object.keys(groupedData).map((group, index) => ({
        label: group,
        data: groupedData[group],
        backgroundColor:
            index === 0 ? "rgba(75, 192, 192, 0.6)" : "rgba(255, 99, 132, 0.6)",
        borderColor:
            index === 0 ? "rgba(75, 192, 192, 1)" : "rgba(255, 99, 132, 1)",
        borderWidth: 1
        }));

        return new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
            },
            plugins: {
            legend: { position: "top" }
            }
        }
        });
    }    
    
    
    // ----------------------------
    // CSV Laden & Filtern
    // ----------------------------
    function loadCSVandFilter(csvPath, selectedTeam, columns, displayFunction) {
        Papa.parse(csvPath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            const rawData = results.data;
            const headers = results.meta.fields || [];

            // Prüfen, ob erwartete Spalten vorhanden sind
            if (columns && columns.length > 0) {
            const missingColumns = columns.filter((col) => !headers.includes(col));
            if (missingColumns.length > 0) {
                console.error("Fehlende Spalten:", missingColumns);
                displayNoDataMessage(
                `Die CSV-Datei enthält nicht alle benötigten Spalten: ${missingColumns.join(
                    ", "
                )}`
                );
                return;
            }
            }

            // Filtern je nach vorhandenen Spalten
            let filteredData = [];
            const sel = canon(selectedTeam);

            if (columns.includes("Team") || columns.includes("team")) {
            filteredData = rawData.filter((row) => {
                const t = row["Team"] ?? row["team"] ?? "";
                return canon(t) === sel;
            });
            } else if (columns.includes("Heim") && columns.includes("Auswärts")) {
            filteredData = rawData.filter(
                (row) => canon(row["Heim"]) === sel || canon(row["Auswärts"]) === sel
            );
            } else {
            filteredData = rawData; // falls keine teambezogene Filterung nötig
            }

            if (!filteredData.length) {
            displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
            return;
            }

            try {
            // WICHTIG: alle Display-Funktionen erwarten (data, columns, selectedTeam)
            displayFunction(filteredData, columns, selectedTeam);
            } catch (e) {
            console.error("Anzeige-Fehler:", e);
            displayNoDataMessage("Ein Fehler ist beim Verarbeiten der Daten aufgetreten.");
            }
        },
        error: function (error) {
            console.error("Fehler beim Laden der CSV:", error);
            displayNoDataMessage(
            "Die CSV-Datei konnte nicht geladen werden. Bitte Pfad prüfen."
            );
        }
        });
    }

    // ----------------------------
    // Anzeige-Funktionen
    // ----------------------------
    function displayRankProbabilities(data, _, team) {
        const filtered = data.filter((row) => canon(row.team) === canon(team));
        const ranks = Array.from({ length: 16 }, (_, i) => i + 1);
        const probBins = Array(16).fill(0);

        filtered.forEach((row) => {
        const rank = parseInt(String(row.Rank).replace("Rank_", ""), 10);
        const prob = parseFloat(row.Probability);
        if (!isNaN(rank) && rank >= 1 && rank <= 16) probBins[rank - 1] = prob;
        });

        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "500px";
        const chartBox = createBox(canvas, { maxWidth: "100%" });
        resultContainer.appendChild(chartBox);

        chartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ranks.map((r) => `Platz ${r}`),
            datasets: [
            {
                label: `Wahrscheinlichkeit für ${team}`,
                data: probBins,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
                barThickness: 10
            }
            ]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
            x: { beginAtZero: true, max: 100, title: { display: true, text: "Wahrscheinlichkeit (%)" } },
            y: { title: { display: true, text: "Platzierung" } }
            },
            plugins: { legend: { display: false } }
        }
        });
    }

    function displayHeadToHead(data, _, selectedTeam) {
        if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");
        const selectedTeamData = data.find((row) => canon(row["team"]) === canon(selectedTeam));
        if (!selectedTeamData) {
        return displayNoDataMessage(`Keine Daten für das Team "${selectedTeam}" verfügbar.`);
        }

        const dropdownContainer = document.createElement("div");
        dropdownContainer.style.marginBottom = "1rem";

        const opponentDropdown = document.createElement("select");
        opponentDropdown.style.padding = "0.5rem";
        opponentDropdown.style.borderRadius = "0.5rem";
        opponentDropdown.style.border = "1px solid #ddd";

        const opponents = data.filter((row) => canon(row["team"]) !== canon(selectedTeam));
        opponentDropdown.innerHTML = opponents
        .map((opponent) => `<option value="${opponent["team"]}">${opponent["team"]}</option>`)
        .join("");

        dropdownContainer.appendChild(opponentDropdown);
        resultContainer.innerHTML = "";
        resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" }));

        function calculateForm(teamData) {
        const formWeights = { E5: 1, E4: 2, E3: 3, E2: 4, E1: 5 };
        const formPoints = { S: 3, U: 1, N: 0 };
        let totalScore = 0;
        let totalWeight = 0;
        const formChain = [];

        Object.keys(formWeights).forEach((key) => {
            const result = teamData[key] || "N";
            const weight = formWeights[key];
            totalWeight += weight;
            totalScore += (formPoints[result] || 0) * weight;
            formChain.push(result);
        });

        const percentage = ((totalScore / (totalWeight * 3)) * 100).toFixed(1);
        return { percentage: `${percentage}%`, chain: formChain.join("-") };
        }

        const updateTable = (comparisonTeam) => {
        const comparisonTeamData = data.find((row) => canon(row["team"]) === canon(comparisonTeam));
        if (!comparisonTeamData) {
            return displayNoDataMessage(`Keine Daten für das Team "${comparisonTeam}" verfügbar.`);
        }

        const team1Form = calculateForm(selectedTeamData);
        const team2Form = calculateForm(comparisonTeamData);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "0.9rem";

        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">Kategorie</th>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">${selectedTeam}</th>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">${comparisonTeam}</th>
            </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const cats = [
            { label: "Gesamtbilanz", key: "Ges_Bilanz", rankKey: "Rank_H" },
            { label: "Heimbilanz", key: "H_Bilanz", rankKey: "Rank_A" },
            { label: "Auswärtsbilanz", key: "A_Bilanz", rankKey: "Rank_NR" },
            { label: "Kunstrasenbilanz", key: "KR_Bilanz", rankKey: "Rank_kKR" },
            { label: "Form %", type: "formPercentage" },
            { label: "Letzte 5 Spiele", type: "formChain" },
            { label: "Tore", key: "Tore" },
            { label: "Formation", key: "Formation", probKey: "Wahrscheinlichkeit" }
        ];

        cats.forEach((c) => {
            const t1Val =
            c.type === "formPercentage"
                ? team1Form.percentage
                : c.type === "formChain"
                ? team1Form.chain
                : selectedTeamData[c.key] || "-";
            const t2Val =
            c.type === "formPercentage"
                ? team2Form.percentage
                : c.type === "formChain"
                ? team2Form.chain
                : comparisonTeamData[c.key] || "-";

            let t1Extra = "",
            t2Extra = "";
            if (c.rankKey) {
            const r1 = selectedTeamData[c.rankKey];
            const r2 = comparisonTeamData[c.rankKey];
            if (r1) t1Extra += ` <span style="font-size:.8rem;color:gray;">(${r1}.)</span>`;
            if (r2) t2Extra += ` <span style="font-size:.8rem;color:gray;">(${r2}.)</span>`;
            }
            if (c.probKey) {
            const p1 = selectedTeamData[c.probKey];
            const p2 = comparisonTeamData[c.probKey];
            if (p1) t1Extra += ` <span style="font-size:.8rem;color:gray;">${p1}</span>`;
            if (p2) t2Extra += ` <span style="font-size:.8rem;color:gray;">${p2}</span>`;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td style="padding:0.5rem;text-align:left;font-weight:bold;">${c.label}</td>
            <td style="padding:0.5rem;text-align:center;">${t1Val}${t1Extra}</td>
            <td style="padding:0.5rem;text-align:center;">${t2Val}${t2Extra}</td>`;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        resultContainer.innerHTML = "";
        resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" }));
        resultContainer.appendChild(createBox(table, { maxWidth: "800px" }));
        };

        const initialOpponent = opponentDropdown.value;
        updateTable(initialOpponent);
        opponentDropdown.addEventListener("change", () => updateTable(opponentDropdown.value));
    }

    function displayExpectedStarting11(data, _, selectedTeam) {
        if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");
        const filteredData = data.filter((row) => canon(row["Team"]) === canon(selectedTeam));
        if (!filteredData.length)
        return displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);

        // Formation -> Wahrscheinlichkeit
        const formations = {};
        filteredData.forEach((row) => {
        const formation = row["Formation"]?.trim();
        const probability = row["Wahrscheinlichkeit"]?.trim();
        if (formation && probability) formations[formation] = probability;
        });

        // Positions-Layouts
        const formationCoordinates = {
        "4-4-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZM", x: "60%", y: "40%" },
            { position: "ZM", x: "40%", y: "40%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ST", x: "60%", y: "20%" },
            { position: "ST", x: "40%", y: "20%" }
        ],
        "4-2-3-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "RM", x: "80%", y: "25%" },
            { position: "ZM", x: "50%", y: "25%" },
            { position: "LM", x: "20%", y: "25%" },
            { position: "ST", x: "50%", y: "15%" }
        ],
        "4-2-2-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "RM", x: "80%", y: "30%" },
            { position: "LM", x: "20%", y: "30%" },
            { position: "ST", x: "60%", y: "20%" },
            { position: "ST", x: "40%", y: "20%" }
        ],
        "4-4-1-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZM", x: "60%", y: "40%" },
            { position: "ZM", x: "40%", y: "40%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ST", x: "50%", y: "25%" },
            { position: "ST", x: "50%", y: "15%" }
        ],
        "4-3-3": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZM", x: "70%", y: "40%" },
            { position: "ZM", x: "50%", y: "40%" },
            { position: "ZM", x: "30%", y: "40%" },
            { position: "RM", x: "70%", y: "20%" },
            { position: "ST", x: "50%", y: "20%" },
            { position: "LM", x: "30%", y: "20%" }
        ],
        "4-1-4-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZDM", x: "50%", y: "45%" },
            { position: "RM", x: "80%", y: "25%" },
            { position: "ZOM", x: "60%", y: "30%" },
            { position: "ZOM", x: "40%", y: "30%" },
            { position: "LM", x: "20%", y: "25%" },
            { position: "ST", x: "50%", y: "15%" }
        ],
        "4-1-3-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZDM", x: "50%", y: "45%" },
            { position: "RM", x: "70%", y: "25%" },
            { position: "ZOM", x: "50%", y: "25%" },
            { position: "LM", x: "30%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "4-5-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "80%", y: "60%" },
            { position: "IV", x: "60%", y: "60%" },
            { position: "IV", x: "40%", y: "60%" },
            { position: "LV", x: "20%", y: "60%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "RM", x: "80%", y: "25%" },
            { position: "ZM", x: "50%", y: "25%" },
            { position: "LM", x: "20%", y: "25%" },
            { position: "ST", x: "50%", y: "15%" }
        ],
        "3-2-3-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "RM", x: "80%", y: "25%" },
            { position: "ZOM", x: "50%", y: "25%" },
            { position: "LM", x: "20%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "3-6-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "RM", x: "80%", y: "30%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "ZOM", x: "60%", y: "25%" },
            { position: "ZOM", x: "40%", y: "25%" },
            { position: "LM", x: "20%", y: "30%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "3-5-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "RM", x: "80%", y: "25%" },
            { position: "ZOM", x: "50%", y: "25%" },
            { position: "LM", x: "20%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "3-4-3": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZM", x: "60%", y: "40%" },
            { position: "ZM", x: "40%", y: "40%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ST", x: "70%", y: "20%" },
            { position: "ST", x: "50%", y: "20%" },
            { position: "ST", x: "30%", y: "20%" }
        ],
        "3-4-1-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZDM", x: "60%", y: "45%" },
            { position: "ZDM", x: "40%", y: "45%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ZOM", x: "50%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "5-3-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "85%", y: "55%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "LV", x: "15%", y: "55%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZM", x: "50%", y: "40%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ST", x: "60%", y: "20%" },
            { position: "ST", x: "40%", y: "20%" }
        ],
        "5-4-1": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "85%", y: "55%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "LV", x: "15%", y: "55%" },
            { position: "RM", x: "80%", y: "40%" },
            { position: "ZM", x: "60%", y: "40%" },
            { position: "ZM", x: "40%", y: "40%" },
            { position: "LM", x: "20%", y: "40%" },
            { position: "ST", x: "50%", y: "20%" }
        ],
        "5-2-1-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "85%", y: "55%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "LV", x: "15%", y: "55%" },
            { position: "ZDM", x: "60%", y: "40%" },
            { position: "ZDM", x: "40%", y: "40%" },
            { position: "ZOM", x: "50%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ],
        "5-1-2-2": [
            { position: "TW", x: "50%", y: "80%" },
            { position: "RV", x: "85%", y: "55%" },
            { position: "IV", x: "70%", y: "60%" },
            { position: "IV", x: "50%", y: "60%" },
            { position: "IV", x: "30%", y: "60%" },
            { position: "LV", x: "15%", y: "55%" },
            { position: "ZDM", x: "50%", y: "40%" },
            { position: "ZOM", x: "65%", y: "25%" },
            { position: "ZOM", x: "35%", y: "25%" },
            { position: "ST", x: "60%", y: "15%" },
            { position: "ST", x: "40%", y: "15%" }
        ]
        };

        const dropdownContainer = document.createElement("div");
        dropdownContainer.style.marginBottom = "1rem";
        const tableAndFieldContainer = document.createElement("div");
        tableAndFieldContainer.style.marginTop = "1rem";

        resultContainer.innerHTML = "";
        resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" }));
        resultContainer.appendChild(tableAndFieldContainer);

        const formationDropdown = document.createElement("select");
        formationDropdown.style.padding = "0.5rem";
        formationDropdown.style.borderRadius = "0.5rem";
        formationDropdown.style.border = "1px solid #ddd";
        formationDropdown.innerHTML =
        Object.keys(formations).length === 0
            ? `<option value="">Keine Formationen verfügbar</option>`
            : Object.entries(formations)
                .map(
                ([formation, probability]) =>
                    `<option value="${formation}">${formation} (${probability})</option>`
                )
                .join("");
        dropdownContainer.appendChild(formationDropdown);

        function updateStarting11TableAndField(selectedFormation) {
        const formationData = filteredData.filter((r) => r["Formation"] === selectedFormation);
        const formationCoords = formationCoordinates[selectedFormation] || [];
        tableAndFieldContainer.innerHTML = "";

        // Reihenfolge gemäß Formation
        const positionOrder = formationCoords.map((c) => c.position);
        formationData.sort(
            (a, b) =>
            positionOrder.indexOf(a["Starting11_Position"]) -
            positionOrder.indexOf(b["Starting11_Position"])
        );

        // Tabelle
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "0.9rem";

        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">Pos</th>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">Nr.</th>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">Name</th>
            <th style="text-align:center;padding:0.5rem;background:#f4f4f4;">Score</th>
            </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        formationData.forEach((row) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td style="text-align:center;padding:0.5rem;">${row["Starting11_Position"]}</td>
            <td style="text-align:center;padding:0.5rem;">${row["Starting11_Nummer"]}</td>
            <td style="text-align:left;padding:0.5rem;">${row["Starting11_Name"]}</td>
            <td style="text-align:center;padding:0.5rem;">${parseFloat(
                row["Starting11_Weighted_Score"]
            ).toFixed(3)}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableAndFieldContainer.appendChild(createBox(table, { maxWidth: "800px" }));

        // Feld
        const fieldContainer = document.createElement("div");
        fieldContainer.style.position = "relative";
        fieldContainer.style.width = "100%";
        fieldContainer.style.height = "400px";
        fieldContainer.style.backgroundColor = "#3a5f0b";
        fieldContainer.style.borderRadius = "0.5rem";
        fieldContainer.style.marginTop = "0.5rem";

        const lines = document.createElement("div");
        lines.style.position = "absolute";
        lines.style.width = "100%";
        lines.style.height = "100%";
        lines.innerHTML = `
            <div style="position:absolute;top:15%;left:-1%;width:102%;height:80%;border:1px solid #fff;"></div>
            <div style="position:absolute;top:69%;left:20%;width:60%;height:26%;border:1px solid #fff;"></div>
            <div style="position:absolute;top:87%;left:35%;width:30%;height:8%;border:1px solid #fff;"></div>
            <div style="position:absolute;top:5%;left:40%;width:20%;height:20%;border-radius:50%;border:1px solid #fff;"></div>`;
        fieldContainer.appendChild(lines);

        formationData.forEach((player, idx) => {
            const pos = formationCoords[idx];
            if (!pos) return;
            const d = document.createElement("div");
            d.style.position = "absolute";
            d.style.width = "30px";
            d.style.height = "30px";
            d.style.borderRadius = "50%";
            d.style.backgroundColor = "white";
            d.style.display = "flex";
            d.style.alignItems = "center";
            d.style.justifyContent = "center";
            d.style.boxShadow = "0 2px 4px rgba(0,0,0,.2)";
            d.style.fontSize = "0.8rem";
            d.style.fontWeight = "bold";
            d.style.left = pos.x;
            d.style.top = pos.y;
            d.style.transform = "translate(-50%,-50%)";
            d.textContent = player["Starting11_Nummer"];
            fieldContainer.appendChild(d);
        });

        tableAndFieldContainer.appendChild(createBox(fieldContainer, { maxWidth: "100%" }));
        }

        formationDropdown.addEventListener("change", () =>
        updateStarting11TableAndField(formationDropdown.value)
        );

        if (Object.keys(formations).length > 0) {
        updateStarting11TableAndField(Object.keys(formations)[0]);
        }
    }

    function displayGoalsAnalysis(data, _, team) {
        const goalBins = Array(18).fill(0);
        const concededBins = Array(18).fill(0);

        data.forEach((row) => {
        const minute = parseInt(row["minute"], 10);
        const binIndex = Math.min(Math.floor((isNaN(minute) ? 0 : minute) / 5), 17);
        if (canon(row["team"]) === canon(team)) goalBins[binIndex]++;
        else if (canon(row["opponent"]) === canon(team)) concededBins[binIndex]++;
        });

        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "500px";
        const chartBox = createBox(canvas, { maxWidth: "100%" });
        resultContainer.appendChild(chartBox);

        chartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: Array.from({ length: 18 }, (_, i) => `${i * 5}-${i * 5 + 5} min`),
            datasets: [
            {
                label: "Tore",
                data: goalBins,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
                barThickness: 10
            },
            {
                label: "Gegentore",
                data: concededBins,
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
                barThickness: 10
            }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: { y: { beginAtZero: true }, x: { beginAtZero: true } },
            plugins: { legend: { position: "top" } }
        }
        });

        const summaryTable = document.createElement("div");
        summaryTable.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
            <thead>
            <tr>
                <th style="text-align:left;width:70%;padding:.5rem;">Kategorie</th>
                <th style="text-align:right;width:30%;padding:.5rem;">Anzahl</th>
            </tr>
            </thead>
            <tbody>
            <tr><td style="text-align:left;padding:.5rem;">Tore</td><td style="text-align:right;padding:.5rem;">${goalBins.reduce((a,b)=>a+b,0)}</td></tr>
            <tr><td style="text-align:left;padding:.5rem;">Gegentore</td><td style="text-align:right;padding:.5rem;">${concededBins.reduce((a,b)=>a+b,0)}</td></tr>
            </tbody>
        </table>`;
        const tableBox = createBox(summaryTable, { maxWidth: "800px" });
        resultContainer.appendChild(tableBox);
    }

    function displayFormationAnalysis(data, _, selectedTeam) {
        if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");
        const filteredData = selectedTeam ? data.filter((r) => canon(r["Team"]) === canon(selectedTeam)) : data;
        if (!filteredData.length)
        return displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);

        const uniqueFormations = new Set();
        let threeBackCount = 0;
        let totalSubstitutions = 0;

        const homeFormationCounts = {};
        const awayFormationCounts = {};
        const winFormationCounts = {};
        const platzFormationCounts = {};

        filteredData.forEach((row) => {
        const formation = row["Formation"];
        const location = row["Wo"];
        const platz = row["Platz"];
        const isWin = parseInt(row["Tore"], 10) > parseInt(row["Gegentore"], 10);

        if (String(formation).startsWith("3-")) threeBackCount++;
        uniqueFormations.add(formation);
        totalSubstitutions += parseInt(row["Wechsel"], 10) || 0;

        if (location === "home") homeFormationCounts[formation] = (homeFormationCounts[formation] || 0) + 1;
        else if (location === "away") awayFormationCounts[formation] = (awayFormationCounts[formation] || 0) + 1;

        if (isWin) winFormationCounts[formation] = (winFormationCounts[formation] || 0) + 1;

        platzFormationCounts[platz] = platzFormationCounts[platz] || {};
        platzFormationCounts[platz][formation] = (platzFormationCounts[platz][formation] || 0) + 1;
        });

        const avgSubstitutions = (totalSubstitutions / filteredData.length).toFixed(2);

        const infoTable = document.createElement("div");
        infoTable.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
            <thead>
            <tr>
                <th style="text-align:left;width:70%;padding:.5rem;">Kategorie</th>
                <th style="text-align:center;width:30%;padding:.5rem;">Wert</th>
            </tr>
            </thead>
            <tbody>
            <tr><td style="text-align:left;padding:.5rem;">Unterschiedliche Formationen</td><td style="text-align:center;padding:.5rem;">${uniqueFormations.size}</td></tr>
            <tr><td style="text-align:left;padding:.5rem;">Formationen mit Dreierkette</td><td style="text-align:center;padding:.5rem;">${threeBackCount}</td></tr>
            <tr><td style="text-align:left;padding:.5rem;">Durchschnittliche Wechsel</td><td style="text-align:center;padding:.5rem;">${avgSubstitutions}</td></tr>
            </tbody>
        </table>`;
        resultContainer.appendChild(createBox(infoTable, { maxWidth: "800px" }));

        const labels = Array.from(uniqueFormations);

        const formationCanvas = createCanvasWithTitle("Anzahl der gespielten Formationen", resultContainer);
        createResponsiveBarChart(
        formationCanvas,
        "Anzahl der gespielten Formationen",
        labels,
        labels.map((f) => filteredData.filter((r) => r["Formation"] === f).length),
        40
        );

        const homeAwayCanvas = createCanvasWithTitle("Formationen: Heim vs. Auswärts", resultContainer);
        createResponsiveGroupedBarChart(
        homeAwayCanvas,
        "Formationen Heim vs. Auswärts",
        labels,
        {
            Heim: labels.map((f) => homeFormationCounts[f] || 0),
            Auswärts: labels.map((f) => awayFormationCounts[f] || 0)
        },
        40
        );

        const winCanvas = createCanvasWithTitle("Siegformationen", resultContainer);
        createResponsiveBarChart(
        winCanvas,
        "Siegformationen",
        labels,
        labels.map((f) => winFormationCounts[f] || 0),
        40
        );

        const platzDropdown = document.createElement("select");
        platzDropdown.innerHTML = `
        <option value="S">Kleiner Kunstrasen</option>
        <option value="M">Normaler Kunstrasen</option>
        <option value="L">Großer Kunstrasen</option>
        <option value="Kunstrasen">Kunstrasen (alle Größen)</option>
        <option value="NR">Rasenplatz</option>`;
        platzDropdown.style.marginBottom = "1rem";
        resultContainer.appendChild(platzDropdown);

        const platzCanvas = createCanvasWithTitle("Formationen auf verschiedenen Plätzen", resultContainer);

        platzDropdown.addEventListener("change", () =>
        updatePlatzChart(platzDropdown.value, platzFormationCounts, platzCanvas, labels)
        );
        updatePlatzChart("S", platzFormationCounts, platzCanvas, labels);
    }

    function updatePlatzChart(platzType, platzFormationCounts, platzCanvas, labels) {
        const platzData = labels.map((label) => {
        if (platzType === "Kunstrasen") {
            return (
            (platzFormationCounts["S"]?.[label] || 0) +
            (platzFormationCounts["M"]?.[label] || 0) +
            (platzFormationCounts["L"]?.[label] || 0)
            );
        }
        return platzFormationCounts[platzType]?.[label] || 0;
        });

        const barHeight = 40;
        const chartHeight = labels.length * barHeight;
        platzCanvas.style.height = `${chartHeight}px`;

        if (chartInstanceForPlatz) chartInstanceForPlatz.destroy();

        chartInstanceForPlatz = new Chart(platzCanvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [
            {
                label: `Formationen auf ${platzType}`,
                data: platzData,
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1
            }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: { x: { beginAtZero: true }, y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
        });
    }

    // ----------------------------
    // Letzte 5 Spiele (mit Klick-Details)
    // ----------------------------
    function displayLastFiveGames(data, _, selectedTeam) {
    if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");

    if (Array.isArray(selectedTeam)) selectedTeam = selectedTeam[0];
    selectedTeam = (selectedTeam ?? "").trim();
    const sel = canon(selectedTeam);

    const isIntStr = (v) => /^\d+$/.test(String(v ?? "").trim());
    const whereIsHome = (w) => {
        const v = norm(w);
        return v === "home" || v === "heim" || v === "h";
    };

    // 1) Nur Spiele des Teams + nur gespielte Partien
    let filtered = data.filter((r) => {
        const involvesTeam = canon(r.Heim) === sel || canon(r.Auswärts) === sel;
        const played = isIntStr(r.H_tore) && isIntStr(r.A_tore);
        return involvesTeam && played;
    });

    // 2) Duplikate entfernen: wenn Spalte 'where' existiert, nur 'home'-Sicht behalten
    const hasWhere = filtered.some((r) => r.hasOwnProperty("where"));
    if (hasWhere) {
        filtered = filtered.filter((r) => whereIsHome(r.where));
    }

    if (!filtered.length) {
        return displayNoDataMessage(`Keine gespielten Partien für "${selectedTeam}".`);
    }

    // 3) Nach Spieltag absteigend sortieren und die letzten 5 Spiele nehmen
    const parseIntSafe = (v) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : -1;
    };
    filtered.sort((a, b) => parseIntSafe(b.Spieltag) - parseIntSafe(a.Spieltag));
    const lastFive = filtered.slice(0, 5);

    // Hilfen
    const esc = (s) =>
        String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const parseGoals = (raw) => {
        if (!raw) return [];
        return raw
        .split(/\s*;\s*|\s*\|\s*/i)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
            const score = (s.match(/^\s*(\d+:\d+)/) || [,""])[1];
            const minute = (s.match(/\((\d{1,3}(?:\+\d{1,2})?)\.\)/) || [,""])[1];
            const scorer = s.replace(/^\s*\d+:\d+\s*/, "").replace(/\(.*?\)\s*/, "").trim();
            return { minute, scorer, score };
        });
    };

    // 4) Karten rendern
    let html = `<div style="display:flex;flex-direction:column;gap:.3rem;margin-top:.3rem;width:100%;">`;
    lastFive.forEach((row, idx) => {
        const hTeam = row.Heim || "Unbekannt";
        const aTeam = row.Auswärts || "Unbekannt";
        const h = parseInt(row.H_tore, 10);
        const a = parseInt(row.A_tore, 10);

        let border = "gray";
        if (canon(hTeam) === sel) border = h > a ? "green" : h === a ? "orange" : "red";
        else if (canon(aTeam) === sel) border = a > h ? "green" : a === h ? "orange" : "red";

        html += `
        <div class="game-card" data-idx="${idx}"
            style="cursor:pointer;font-size:.9rem;border:1px solid #ddd;border-left:5px solid ${border};border-radius:.1rem;padding:.3rem;background:#f9f9f9;box-shadow:1px 1px 2px rgba(0,0,0,.1);">
            <div style="display:flex;justify-content:space-between;margin-bottom:.1rem;">
            <span style="font-weight:bold;">${esc(hTeam)}</span><span>${h}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
            <span style="font-weight:bold;">${esc(aTeam)}</span><span>${a}</span>
            </div>
            <div class="details-slot" style="display:none;"></div>
        </div>`;
    });
    html += `</div>`;
    resultContainer.innerHTML = html;

    // 5) Klick-Details: Formation & Aufstellung jeweils für Heim und Auswärts (+ optional Tore)
    resultContainer.onclick = (ev) => {
        const card = ev.target.closest(".game-card");
        if (!card) return;
        const idx = parseInt(card.getAttribute("data-idx"), 10);
        const row = lastFive[idx];
        const slot = card.querySelector(".details-slot");

        const goals = parseGoals(row.ToreRaw);
        const goalsHTML = goals.length
        ? `<div style="margin-top:.5rem;"><strong>Tore:</strong>
            <ul style="margin:.25rem 0 0 1rem;padding:0;">
                ${goals
                .map(
                    (g) =>
                    `<li>${esc(g.minute ? g.minute + "'" : "")} ${esc(g.scorer)}${
                        g.score ? ` <span style="color:#999">(${esc(g.score)})</span>` : ""
                    }</li>`
                )
                .join("")}
            </ul>
            </div>`
        : "";

        const details = `
        <div class="game-details" style="padding:.6rem;background:#fff;border-top:1px dashed #ddd;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div>
                <div style="font-weight:600;margin-bottom:.25rem;">Heim</div>
                <div><strong>Formation:</strong> ${esc(row.HeimFormation || "unbekannt")}</div>
                <div><strong>Aufstellung:</strong> ${esc(row.HeimStartelf || "—")}</div>
            </div>
            <div>
                <div style="font-weight:600;margin-bottom:.25rem;">Auswärts</div>
                <div><strong>Formation:</strong> ${esc(row.AuswaertsFormation || "unbekannt")}</div>
                <div><strong>Aufstellung:</strong> ${esc(row.AuswaertsStartelf || "—")}</div>
            </div>
            </div>
            ${goalsHTML}
        </div>`;

        if (slot.style.display === "none") {
        slot.innerHTML = details;
        slot.style.display = "block";
        } else {
        slot.style.display = "none";
        }
    };
    }
    function displayLastFiveGames(data, _, selectedTeam) {
    if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");

    if (Array.isArray(selectedTeam)) selectedTeam = selectedTeam[0];
    selectedTeam = (selectedTeam ?? "").trim();

    const norm = (s) => (s ?? "").toString().normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
    const sel  = norm(selectedTeam);
    const isIntStr = (v) => /^\d+$/.test(String(v ?? "").trim());
    const parseIntSafe = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : -1; };
    const whereIsHome = (w) => {
        const v = norm(w);
        return v === "home" || v === "heim" || v === "h";
    };
    const esc = (s) => String(s ?? "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

    // Parser für "1:0 (15.) Spieler" etc.
    const parseGoals = (raw) => {
        if (!raw) return [];
        return raw
        .split(/\s*;\s*|\s*\|\s*/i)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
            const score  = (s.match(/^\s*(\d+:\d+)/) || [,""])[1];
            const minute = (s.match(/\((\d{1,3}(?:\+\d{1,2})?)\.\)/) || [,""])[1];
            const scorer = s.replace(/^\s*\d+:\d+\s*/, "").replace(/\(.*?\)\s*/, "").trim();
            return { minute, scorer, score };
        });
    };

    // 1) Nur Spiele mit Ergebnis, an denen das Team beteiligt ist
    let filtered = data.filter(r =>
        (norm(r.Heim) === sel || norm(r.Auswärts) === sel) &&
        isIntStr(r.H_tore) && isIntStr(r.A_tore)
    );

    // 2) Duplikate vermeiden: wenn 'where' existiert, nur 'home' behalten
    const hasWhere = filtered.some(r => Object.prototype.hasOwnProperty.call(r, "where"));
    if (hasWhere) filtered = filtered.filter(r => whereIsHome(r.where));

    if (!filtered.length) {
        return displayNoDataMessage(`Keine gespielten Partien für "${selectedTeam}".`);
    }

    // 3) Nach Spieltag absteigend sortieren und Top 5
    filtered.sort((a, b) => parseIntSafe(b.Spieltag) - parseIntSafe(a.Spieltag));
    const lastFive = filtered.slice(0, 5);

    // 4) Karten rendern
    let html = `<div style="display:flex;flex-direction:column;gap:.3rem;margin-top:.3rem;width:100%;">`;
    lastFive.forEach((row, idx) => {
        const hTeam = row.Heim || "Unbekannt";
        const aTeam = row.Auswärts || "Unbekannt";
        const h = parseInt(row.H_tore, 10);
        const a = parseInt(row.A_tore, 10);

        let border = "gray";
        if (norm(hTeam) === sel) border = h > a ? "green" : h === a ? "orange" : "red";
        else if (norm(aTeam) === sel) border = a > h ? "green" : a === h ? "orange" : "red";

        html += `
        <div class="game-card" data-idx="${idx}"
            style="cursor:pointer;font-size:.9rem;border:1px solid #ddd;border-left:5px solid ${border};border-radius:.1rem;padding:.3rem;background:#f9f9f9;box-shadow:1px 1px 2px rgba(0,0,0,.1);">
            <div style="display:flex;justify-content:space-between;margin-bottom:.1rem;">
            <span style="font-weight:bold;">${esc(hTeam)}</span><span>${h}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
            <span style="font-weight:bold;">${esc(aTeam)}</span><span>${a}</span>
            </div>
            <div class="details-slot" style="display:none;"></div>
        </div>`;
    });
    html += `</div>`;
    resultContainer.innerHTML = html;

    // 5) Klick-Details (beide Teams + Tore beider Teams ohne Bulletpoints)
    resultContainer.onclick = (ev) => {
        const card = ev.target.closest(".game-card");
        if (!card) return;

        const idx = parseInt(card.getAttribute("data-idx"), 10);
        const row = lastFive[idx];
        const slot = card.querySelector(".details-slot");

        // Spiegel-Zeile finden (falls nötig fürs Auswärts-Tore-Backup)
        const mirror = data.find(d =>
        norm(d.Heim) === norm(row.Auswärts) &&
        norm(d.Auswärts) === norm(row.Heim) &&
        isIntStr(d.H_tore) && isIntStr(d.A_tore)
        );

        // Torschützen beider Teams (bevorzugt getrennte Felder, sonst Fallback)
        const homeGoals = parseGoals(row.HeimToreRaw || row.ToreRaw || "");
        const awayGoals = parseGoals(row.AuswaertsToreRaw || (mirror ? mirror.ToreRaw : "") || "");

        const goalsBlock = (label, arr) => {
        if (!arr.length) return "";
        return `
            <div style="margin-top:.5rem;">
            <strong>${esc(label)}:</strong>
            <div style="margin-top:.25rem;">
                ${arr.map(g =>
                `<div>${esc(g.minute ? g.minute + "'" : "")} ${esc(g.scorer)}${
                    g.score ? ` <span style="color:#999">(${esc(g.score)})</span>` : ""
                }</div>`
                ).join("")}
            </div>
            </div>`;
        };

        const details = `
        <div class="game-details" style="padding:.6rem;background:#fff;border-top:1px dashed #ddd;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div>
                <div style="font-weight:600;margin-bottom:.25rem;">Heim</div>
                <div><strong>Formation:</strong> ${esc(row.HeimFormation || "unbekannt")}</div>
                <div><strong>Aufstellung:</strong> ${esc(row.HeimStartelf || "—")}</div>
            </div>
            <div>
                <div style="font-weight:600;margin-bottom:.25rem;">Auswärts</div>
                <div><strong>Formation:</strong> ${esc(row.AuswaertsFormation || "unbekannt")}</div>
                <div><strong>Aufstellung:</strong> ${esc(row.AuswaertsStartelf || "—")}</div>
            </div>
            </div>
            ${goalsBlock(`Tore ${row.Heim || "Heim"}`, homeGoals)}
            ${goalsBlock(`Tore ${row.Auswärts || "Auswärts"}`, awayGoals)}
        </div>`;

        if (slot.style.display === "none") {
        slot.innerHTML = details;
        slot.style.display = "block";
        } else {
        slot.style.display = "none";
        }
    };
    }



    function displayNextFiveGames(data, _, selectedTeam) {
        if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");

        if (Array.isArray(selectedTeam)) selectedTeam = selectedTeam[0];
        selectedTeam = selectedTeam?.trim();

        const sortedData = data.sort(
        (a, b) => parseInt(a["Spieltag"], 10) - parseInt(b["Spieltag"], 10)
        );
        const firstUnplayedIndex = sortedData.findIndex((row) => row["H_tore"] === "NA");
        if (firstUnplayedIndex === -1) return displayNoDataMessage("Keine zukünftigen Spiele verfügbar.");

        const nextFiveGames = sortedData.slice(firstUnplayedIndex, firstUnplayedIndex + 5);

        const matchupsWithHinspiel = {};
        sortedData.forEach((row) => {
        const spieltag = parseInt(row["Spieltag"], 10);
        if (spieltag < 16) {
            const key = `${row["Heim"]}_${row["Auswärts"]}`;
            matchupsWithHinspiel[key] = row["H_tore"] + ":" + row["A_tore"];
        }
        });

        let html = `<div style="display:flex;flex-direction:column;gap:.3rem;margin-top:.3rem;width:100%;">`;
        nextFiveGames.forEach((row) => {
        const homeTeam = row["Heim"] || "Unbekannt";
        const awayTeam = row["Auswärts"] || "Unbekannt";
        const hTore = row["H_tore"] === "NA" ? "-" : row["H_tore"];
        const aTore = row["A_tore"] === "NA" ? "-" : row["A_tore"];
        const matchday = parseInt(row["Spieltag"], 10);

        let hinspielNote = "";
        if (matchday > 15) {
            const reverseKey = `${awayTeam}_${homeTeam}`;
            if (matchupsWithHinspiel[reverseKey]) {
            const hinErg = matchupsWithHinspiel[reverseKey];
            const [hH, aH] = hinErg.split(":").map(Number);
            let gew = "";
            if (hH > aH) gew = `für ${teamAbbreviations[awayTeam] || awayTeam}`;
            else if (aH > hH) gew = `für ${teamAbbreviations[homeTeam] || homeTeam}`;
            else gew = "unentschieden";
            hinspielNote = `<span style="font-size:.8rem;color:gray;text-align:right;">Hinspiel: ${hinErg} ${gew}</span>`;
            }
        }

        html += `
            <div style="font-size:.9rem;border:1px solid #ddd;border-radius:.1rem;padding:.3rem;background:#f9f9f9;box-shadow:1px 1px 2px rgba(0,0,0,.1);">
            <div style="display:flex;justify-content:space-between;margin-bottom:.1rem;">
                <span style="font-weight:bold;">${homeTeam}</span><span>${hTore}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-weight:bold;">${awayTeam}</span><span>${aTore}</span>
            </div>
            ${hinspielNote}
            </div>`;
        });
        html += `</div>`;
        resultContainer.innerHTML = html;
    }

    function displayTable(data, columns, selectedTeam, columnStyles = {}) {
        if (!data || !data.length) return displayNoDataMessage("Keine Daten verfügbar.");

        if (selectedTeam) {
        data = data.filter((row) => {
            const team = row["team"] || row["Team"] || "";
            return canon(team) === canon(selectedTeam);
        });
        }

        const top10Data = data.slice(0, 10);
        if (!top10Data.length) return displayNoDataMessage("Keine Daten für das ausgewählte Team.");

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "0.9rem";

        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>${columns
        .map((col) => {
            const style = columnStyles[col] || {};
            return `<th style="text-align:${style.textAlign || "center"};width:${style.width || "auto"};padding:.5rem;background:#f4f4f4;">${col}</th>`;
        })
        .join("")}</tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        top10Data.forEach((row) => {
        const tr = document.createElement("tr");
        columns.forEach((col) => {
            const style = columnStyles[col] || {};
            const td = document.createElement("td");
            td.textContent = row[col] ?? "-";
            td.style.textAlign = style.textAlign || "center";
            td.style.padding = "0.5rem";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        resultContainer.appendChild(createBox(table, { maxWidth: "800px" }));
    }

    // ----------------------------
    // Update & Event Binding
    // ----------------------------
    function updateResults() {
        resetResultContainer();

        const selectedCategory = categorySelect.value;
        const selectedTeam = teamSelect.value;

        if (!selectedCategory || !selectedTeam) {
        const p = document.createElement("p");
        p.textContent = "Bitte wählen Sie ein Team und eine Kategorie aus.";
        resultContainer.appendChild(p);
        return;
        }

        const cfg = categories[selectedCategory];
        if (!cfg) {
        console.error(`Kategorie "${selectedCategory}" nicht gefunden.`);
        return;
        }
        loadCSVandFilter(cfg.csvPath, selectedTeam, cfg.columns, cfg.displayFunction);
    }

    // Init
    populateDropdown(teamSelect, teams, "Team auswählen");
    populateDropdown(categorySelect, Object.keys(categories), "Kategorie auswählen");

    teamSelect.addEventListener("change", updateResults);
    categorySelect.addEventListener("change", updateResults);
    });
