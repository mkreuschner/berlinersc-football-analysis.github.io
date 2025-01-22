document.addEventListener("DOMContentLoaded", () => {
    const teamSelect = document.getElementById("teamSelect");
    const categorySelect = document.getElementById("categorySelect");
    const resultContainer = document.getElementById("resultContainer");
    let chartInstance = null;
    let chartInstanceForPlatz = null;

    // Teams und Kategorien
    const teams = ["TSV Rudow Berlin", "BFC Preussen II", "BFC Meteor 06", "BSV Eintracht Mahlsdorf II",
        "SC Borsigwalde 1910", "Berliner SV 1892", "FC Viktoria 1889 Berlin II",
        "FC Internationale Berlin 1980", "Türkiyemspor Berlin", "Berliner SC II",
        "Köpenicker FC", "BSV Al-Dersimspor", "FSV Berolina Stralau 1901",
        "SV Empor Berlin II", "SV Stern Britz 1889", "VfB Concordia Britz 1916"];

    const teamAbbreviations = {
        "TSV Rudow Berlin": "RUD",
        "SC Borsigwalde 1910": "BOR",
        "BFC Preussen II": "PRE",
        "BFC Meteor 06": "MET",
        "FC Internationale Berlin 1980": "INT",
        "Türkiyemspor Berlin": "TUR",
        "Berliner SC II": "BSC",
        "Köpenicker FC": "KFC",
        "BSV Eintracht Mahlsdorf II": "MAH",
        "Berliner SV 1892": "BSV",
        "FSV Berolina Stralau 1901": "STR",
        "SV Stern Britz 1889": "BRI",
        "VfB Concordia Britz 1916": "CON"
    };


    const categories = {
        "Keypoints": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/keypoints.csv",
            columns: ["Team","Allgemein","Formation","Spieler","Platz","Standard off","Standard def"],
            displayFunction: displayKeypoints
        },
        "Head-2-Head": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/head2head.csv",
            columns: ["team","#","Ges_Bilanz","Rank_H","H_Bilanz","Rank_A","A_Bilanz","Rank_NR","NR_Bilanz","Rank_KR","KR_Bilanz","Rank_kKR","kKR_Bilanz","E5","E4","E3","E2","E1","Tore","Formation","Wahrscheinlichkeit","dreierKette","viererKette"],
            displayFunction: displayHeadToHead
        },
        "Exp Start11": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/exp11.csv",
            columns: ["Team","Formation","Anzahl","Total_Spiele","Wahrscheinlichkeit","dreier_kette","vierer_kette","Starting11_Team","Starting11_Position","Starting11_Nummer","Starting11_Name","Starting11_Weighted_Score"],
            displayFunction: displayExpectedStarting11
        },
        "Tore": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/goals.csv",
            columns: ["scorer", "team", "opponent", "minute", "score"],
            displayFunction: displayGoalsAnalysis
        },
        "Formation": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/formation_data.csv",
            columns: ["Spieltag", "Team", "Gegner", "Tore", "Gegentore", "Wo", "Platz", "Formation", "Wechsel"],
            displayFunction: displayFormationAnalysis
        },
        "Letzte 5 Spiele": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/last5games.csv",
            columns: ["Spieltag", "Heim", "Auswärts", "H_tore", "A_tore"],
            displayFunction: displayLastFiveGames
        },
        "Nächste 5 Spiele": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/next5games.csv",
            columns: ["Spieltag", "Heim", "Auswärts", "H_tore", "A_tore"],
            displayFunction: displayNextFiveGames
        },
        "Beste Spieler": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/best_score.csv",
            columns: ["Rank", "Name", "Nr", "Pos", "Spielzeit", "Score"],
            displayFunction: displayTable
        },
        "Scorerpoints": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/scorerpoints.csv",
            columns: ["Rank", "Name", "Pos", "Scorerpoints", "Spiele"],
            displayFunction: displayTable
        },
        "Torschützen": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/goalscorer.csv",
            columns: ["Rank", "Name", "Pos", "Tore", "Spiele"],
            displayFunction: displayTable
        },
        "Assists": {
            csvPath: "https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/assists.csv",
            columns: ["Rank", "Name", "Pos", "Assists", "Spiele"],
            displayFunction: displayTable
        }
    };

    // Dropdowns initialisieren
    function populateDropdown(dropdown, options, placeholder) {
        dropdown.innerHTML = `<option value="">-- ${placeholder} --</option>`;
        options.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option;
            opt.textContent = option;
            dropdown.appendChild(opt);
        });
    }

    // Inhalt zurücksetzen
    function resetResultContainer() {
        resultContainer.innerHTML = "";
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }


    function displayKeypoints(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Filter nach Team
        const selectedTeamData = data.find(row => row["Team"] === selectedTeam);

        if (!selectedTeamData) {
            displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
            return;
        }

        // Alle Spalten außer "Team" verarbeiten
        const categories = Object.keys(selectedTeamData).filter(key => key !== "Team");

        // Container für Keypoints erstellen
        const keypointsContainer = document.createElement("div");
        keypointsContainer.style.display = "grid";
        keypointsContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))";
        keypointsContainer.style.gap = "0.5rem";

        categories.forEach(category => {
            // Box für die Kategorie erstellen
            const box = document.createElement("div");
            box.style.border = "1px solid #ddd";
            box.style.borderRadius = "0.5rem";
            box.style.padding = "0.5rem";
            box.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            box.style.backgroundColor = "#f9f9f9";

            // Überschrift hinzufügen
            const title = document.createElement("div");
            title.style.marginBottom = "0.3rem";
            title.style.fontSize = "1.2rem";
            title.style.textAlign = "left";
            title.textContent = category;

            box.appendChild(title);

            // Inhalt verarbeiten und in Bulletpoints aufteilen
            const content = selectedTeamData[category] || "Keine Daten verfügbar.";
            const points = content.split(/\n|;/); // Trenner für neue Bulletpoints

            points.forEach(point => {
                const bullet = document.createElement("div");
                bullet.style.display = "flex";
                bullet.style.alignItems = "flex-start";
                bullet.style.gap = "0.3rem";

                // Bulletpoint-Symbol
                const bulletSymbol = document.createElement("div");
                bulletSymbol.style.width = "3px";
                bulletSymbol.style.height = "3px";
                bulletSymbol.style.backgroundColor = "#555";
                bulletSymbol.style.borderRadius = "50%";
                bulletSymbol.style.marginTop = "0.5rem";

                // Bulletpoint-Inhalt
                const bulletText = document.createElement("div");
                bulletText.textContent = point.trim();
                bulletText.style.fontSize = "0.9rem";

                bullet.appendChild(bulletSymbol);
                bullet.appendChild(bulletText);

                box.appendChild(bullet);
            });

            keypointsContainer.appendChild(box);
        });

        // Ergebnis anzeigen
        resultContainer.innerHTML = ""; // Vorherigen Inhalt löschen
        resultContainer.appendChild(keypointsContainer);
    }



    function displayHeadToHead(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Filter nach dem ausgewählten Team
        const selectedTeamData = data.find(row => row["team"] === selectedTeam);

        if (!selectedTeamData) {
            displayNoDataMessage(`Keine Daten für das Team "${selectedTeam}" verfügbar.`);
            return;
        }

        // Dropdown für den Vergleichsgegner erstellen
        const dropdownContainer = document.createElement("div");
        dropdownContainer.style.marginBottom = "1rem";

        const opponentDropdown = document.createElement("select");
        opponentDropdown.style.padding = "0.5rem";
        opponentDropdown.style.borderRadius = "0.5rem";
        opponentDropdown.style.border = "1px solid #ddd";

        // Dropdown-Optionen für Gegner
        const opponents = data.filter(row => row["team"] !== selectedTeam);
        opponentDropdown.innerHTML = opponents
            .map(opponent => `<option value="${opponent["team"]}">${opponent["team"]}</option>`)
            .join("");

        dropdownContainer.appendChild(opponentDropdown);
        resultContainer.innerHTML = ""; // Vorherigen Inhalt entfernen
        resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" }));

        // Funktion zur Berechnung der Form
        function calculateForm(teamData) {
            const formWeights = { E5: 1, E4: 2, E3: 3, E2: 4, E1: 5 };
            const formPoints = { S: 3, U: 1, N: 0 };

            let totalScore = 0;
            let totalWeight = 0;
            const formChain = [];

            Object.keys(formWeights).forEach(key => {
                const result = teamData[key] || "N"; // Standardwert N, falls keine Daten vorhanden
                const weight = formWeights[key];
                totalWeight += weight;
                totalScore += (formPoints[result] || 0) * weight;
                formChain.push(result);
            });

            const percentage = ((totalScore / (totalWeight * 3)) * 100).toFixed(1); // Normiert auf 100%
            return {
                percentage: `${percentage}%`,
                chain: formChain.join("-")
            };
        }

        // Funktion zur Aktualisierung der Tabelle
        const updateTable = (comparisonTeam) => {
            // Daten für den Vergleichsgegner finden
            const comparisonTeamData = data.find(row => row["team"] === comparisonTeam);

            if (!comparisonTeamData) {
                displayNoDataMessage(`Keine Daten für das Team "${comparisonTeam}" verfügbar.`);
                return;
            }

            // Form-Werte berechnen
            const team1Form = calculateForm(selectedTeamData);
            const team2Form = calculateForm(comparisonTeamData);

            // Tabelle erstellen
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = "0.9rem";

            // Kopfzeile
            const thead = document.createElement("thead");
            thead.innerHTML = `
            <tr>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">Kategorie</th>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">${selectedTeam}</th>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">${comparisonTeam}</th>
            </tr>
        `;
            table.appendChild(thead);

            // Körper
            const tbody = document.createElement("tbody");

            // Kategorien und Daten
            const categories = [
                { label: "Gesamtbilanz", key: "Ges_Bilanz", rankKey: "Rank_H" },
                { label: "Heimbilanz", key: "H_Bilanz", rankKey: "Rank_A" },
                { label: "Auswärtsbilanz", key: "A_Bilanz", rankKey: "Rank_NR" },
                { label: "Kunstrasenbilanz", key: "KR_Bilanz", rankKey: "Rank_kKR" },
                { label: "Form %", type: "formPercentage" }, // Zeigt den Form-%-Wert an
                { label: "Letzte 5 Spiele", type: "formChain" }, // Zeigt die Spielkette an
                { label: "Tore", key: "Tore" },
                { label: "Formation", key: "Formation", probKey: "Wahrscheinlichkeit" }
            ];

            // Zeilen für die Tabelle generieren
            categories.forEach(category => {
                const team1Value = category.type === "formPercentage"
                    ? team1Form.percentage
                    : category.type === "formChain"
                        ? team1Form.chain
                        : selectedTeamData[category.key] || "-";

                const team2Value = category.type === "formPercentage"
                    ? team2Form.percentage
                    : category.type === "formChain"
                        ? team2Form.chain
                        : comparisonTeamData[category.key] || "-";

                // Zusatzinformationen wie Rang und Wahrscheinlichkeit
                let team1Extra = "";
                let team2Extra = "";

                if (category.rankKey) {
                    const rank1 = selectedTeamData[category.rankKey];
                    const rank2 = comparisonTeamData[category.rankKey];
                    if (rank1) team1Extra += ` <span style="font-size: 0.8rem; color: gray;">(${rank1}.)</span>`;
                    if (rank2) team2Extra += ` <span style="font-size: 0.8rem; color: gray;">(${rank2}.)</span>`;
                }

                if (category.probKey) {
                    const prob1 = selectedTeamData[category.probKey];
                    const prob2 = comparisonTeamData[category.probKey];
                    if (prob1) team1Extra += ` <span style="font-size: 0.8rem; color: gray;">${prob1}</span>`;
                    if (prob2) team2Extra += ` <span style="font-size: 0.8rem; color: gray;">${prob2}</span>`;
                }

                // Tabellenzeilen hinzufügen
                const row = document.createElement("tr");
                row.innerHTML = `
                <td style="padding: 0.5rem; text-align: left; font-weight: bold;">${category.label}</td>
                <td style="padding: 0.5rem; text-align: center;">${team1Value}${team1Extra}</td>
                <td style="padding: 0.5rem; text-align: center;">${team2Value}${team2Extra}</td>
            `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);

            // Tabelle in den Container setzen
            resultContainer.innerHTML = ""; // Vorherige Tabelle entfernen
            resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" })); // Dropdown wieder hinzufügen
            resultContainer.appendChild(createBox(table, { maxWidth: "800px" }));
        };

        // Initiales Update der Tabelle mit dem ersten Gegner im Dropdown
        const initialOpponent = opponentDropdown.value;
        updateTable(initialOpponent);

        // Eventlistener für Dropdown
        opponentDropdown.addEventListener("change", () => {
            const selectedOpponent = opponentDropdown.value;
            updateTable(selectedOpponent);
        });
    }



    function displayExpectedStarting11(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Filter nach Team
        const filteredData = data.filter(row => row["Team"] === selectedTeam);

        if (!filteredData || filteredData.length === 0) {
            displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
            return;
        }

        // Formationen sammeln
        const formations = {};
        filteredData.forEach(row => {
            const formation = row["Formation"]?.trim();
            const probability = row["Wahrscheinlichkeit"]?.trim();
            if (formation && probability) {
                formations[formation] = probability;
            }
        });

        // Formation-Koordinaten
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
            "4-5-1" : [
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
            "3-2-3-2" : [
                { position: "TW", x: "50%", y: "80%" },
                { position: "IV", x: "70%", y: "60%" },
                { position: "IV", x: "50%", y: "60%" },
                { position: "IV", x: "30%", y: "60%" },
                { position: "ZDM", x: "60%", y: "40%" } ,
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
                { position: "RM", x: "80%", y: "30%" } ,
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
                { position: "ZDM", x: "60%", y: "40%" } ,
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
                { position: "RM", x: "80%", y: "40%" } ,
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
            { position: "RM", x: "80%", y: "40%" } ,
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

        // Erstelle separate Container für Dropdown und Tabelle/Feld
        const dropdownContainer = document.createElement("div");
        dropdownContainer.style.marginBottom = "1rem";

        const tableAndFieldContainer = document.createElement("div");
        tableAndFieldContainer.style.marginTop = "1rem";

        // Füge die Container dem resultContainer hinzu
        resultContainer.innerHTML = "";
        resultContainer.appendChild(createBox(dropdownContainer, { maxWidth: "400px" }));
        resultContainer.appendChild(tableAndFieldContainer);

        // Dropdown erstellen
        const formationDropdown = document.createElement("select");
        formationDropdown.style.padding = "0.5rem";
        formationDropdown.style.borderRadius = "0.5rem";
        formationDropdown.style.border = "1px solid #ddd";

        if (Object.keys(formations).length === 0) {
            formationDropdown.innerHTML = `<option value="">Keine Formationen verfügbar</option>`;
        } else {
            formationDropdown.innerHTML = Object.entries(formations)
                .map(([formation, probability]) =>
                    `<option value="${formation}">${formation} (${probability})</option>`
                )
                .join("");
        }

        dropdownContainer.appendChild(formationDropdown);

        // Eventlistener für Dropdown
        formationDropdown.addEventListener("change", () => {
            const selectedFormation = formationDropdown.value;
            updateStarting11TableAndField(selectedFormation);
        });

        // Standardformation setzen und anzeigen
        if (Object.keys(formations).length > 0) {
            const defaultFormation = Object.keys(formations)[0];
            updateStarting11TableAndField(defaultFormation);
        }

        // Funktion zur Aktualisierung der Tabelle und des Fußballfelds
        function updateStarting11TableAndField(selectedFormation) {
            const formationData = filteredData.filter(row => row["Formation"] === selectedFormation);
            const formationCoords = formationCoordinates[selectedFormation] || [];
            tableAndFieldContainer.innerHTML = ""; // Inhalt des Containers leeren

            // Sortiere die Spieler basierend auf der Positionsreihenfolge in der Formation
            const positionOrder = formationCoords.map(coord => coord.position);
            formationData.sort((a, b) => {
                const posA = a["Starting11_Position"];
                const posB = b["Starting11_Position"];
                return positionOrder.indexOf(posA) - positionOrder.indexOf(posB);
            });

            // Tabelle erstellen
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = "0.9rem";

            const thead = document.createElement("thead");
            thead.innerHTML = `
            <tr>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">Pos</th>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">Nr.</th>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">Name</th>
                <th style="text-align: center; padding: 0.5rem; background-color: #f4f4f4;">Score</th>
            </tr>
        `;
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            formationData.forEach(row => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td style="text-align: center; padding: 0.5rem;">${row["Starting11_Position"]}</td>
                <td style="text-align: center; padding: 0.5rem;">${row["Starting11_Nummer"]}</td>
                <td style="text-align: left; padding: 0.5rem;">${row["Starting11_Name"]}</td>
                <td style="text-align: center; padding: 0.5rem;">${parseFloat(row["Starting11_Weighted_Score"]).toFixed(3)}</td>
            `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            // Tabelle in einer Box anzeigen
            tableAndFieldContainer.appendChild(createBox(table, { maxWidth: "800px" }));

            // Fußballfeld erstellen
            const fieldContainer = document.createElement("div");
            fieldContainer.style.position = "relative";
            fieldContainer.style.width = "100%";
            fieldContainer.style.height = "400px";
            fieldContainer.style.backgroundColor = "#3a5f0b"; // Fußballfeldfarbe
            fieldContainer.style.borderRadius = "0.5rem";
            fieldContainer.style.marginTop = "0.5rem";

            // Linien zeichnen
            const fieldLines = document.createElement("div");
            fieldLines.style.position = "absolute";
            fieldLines.style.width = "100%";
            fieldLines.style.height = "100%";
            fieldLines.innerHTML = `
            <div style="position: absolute; top: 15%; left: -1%; width: 102%; height: 80%; border: 1px solid white;"></div> <!-- Torlinie -->
            <div style="position: absolute; top: 69%; left: 20%; width: 60%; height: 26%; border: 1px solid white;"></div> <!-- Strafraum -->
            <div style="position: absolute; top: 87%; left: 35%; width: 30%; height: 8%; border: 1px solid white;"></div> <!-- 5-Meter-Raum -->
            <div style="position: absolute; top: 5%; left: 40%; width: 20%; height: 20%; border-radius: 50%; border: 1px solid white;"></div> <!-- Elfmeterpunkt -->
        `;
            fieldContainer.appendChild(fieldLines);

            // Spieler dynamisch platzieren
            formationData.forEach((player, index) => {
                const positionCoords = formationCoords[index];
                if (!positionCoords) return;

                const playerDiv = document.createElement("div");
                playerDiv.style.position = "absolute";
                playerDiv.style.width = "30px";
                playerDiv.style.height = "30px";
                playerDiv.style.borderRadius = "50%";
                playerDiv.style.backgroundColor = "white";
                playerDiv.style.display = "flex";
                playerDiv.style.alignItems = "center";
                playerDiv.style.justifyContent = "center";
                playerDiv.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
                playerDiv.style.fontSize = "0.8rem";
                playerDiv.style.fontWeight = "bold";
                playerDiv.innerText = player["Starting11_Nummer"];

                // Spieler-Position berechnen
                playerDiv.style.left = positionCoords.x;
                playerDiv.style.top = positionCoords.y;
                playerDiv.style.transform = "translate(-50%, -50%)"; // Kreismitte als Referenzpunkt


                fieldContainer.appendChild(playerDiv);
            });

            // Fußballfeld in einer Box anzeigen
            tableAndFieldContainer.appendChild(createBox(fieldContainer, { maxWidth: "100%" }));
        }
    }




    // Allgemeine Tabelle anzeigen
    function displayTable(data, columns, selectedTeam, columnStyles = {}) {
        if (!data || data.length === 0) {
            const noDataMessage = document.createElement("p");
            noDataMessage.textContent = "Keine Daten verfügbar.";
            resultContainer.appendChild(noDataMessage);
            return;
        }

        // Daten nach Team filtern
        if (selectedTeam) {
            data = data.filter(row => {
                const team = row["team"] || row["Team"] || "";
                return team.trim().toLowerCase() === selectedTeam.trim().toLowerCase();
            });
        }

        const top10Data = data.slice(0, 10);
        if (top10Data.length === 0) {
            const noDataMessage = document.createElement("p");
            noDataMessage.textContent = "Keine Daten für das ausgewählte Team.";
            resultContainer.appendChild(noDataMessage);
            return;
        }

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "0.9rem";

        // Kopfzeile
        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>${columns.map(col => {
            const style = columnStyles[col] || {};
            return `<th style="text-align: ${style.textAlign || "center"}; width: ${style.width || "auto"}; padding: 0.5rem; background-color: #f4f4f4;">${col}</th>`;
        }).join("")}</tr>`;
        table.appendChild(thead);

        // Körper
        const tbody = document.createElement("tbody");
        top10Data.forEach(row => {
            const tr = document.createElement("tr");
            columns.forEach(col => {
                const style = columnStyles[col] || {};
                const td = document.createElement("td");
                td.textContent = row[col] || "-";
                td.style.textAlign = style.textAlign || "center";
                td.style.padding = "0.5rem";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        const box = createBox(table, { maxWidth: "800px" });
        resultContainer.appendChild(box);
    }

    function displayLastFiveGames(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Sicherstellen, dass selectedTeam ein String ist
        if (Array.isArray(selectedTeam)) {
            console.error("Selected Team is an array:", selectedTeam); // Debugging
            selectedTeam = selectedTeam[0]; // Nimm den ersten Wert des Arrays
        }

        selectedTeam = selectedTeam?.trim(); // Trimme den Teamnamen (falls erforderlich)

        // Filter Spiele basierend auf dem ausgewählten Team
        let filteredData = data.filter(row =>
            row["Heim"] === selectedTeam || row["Auswärts"] === selectedTeam
        );

        if (!filteredData || filteredData.length === 0) {
            displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
            return;
        }

        // Sortiere die Daten nach Spieltag in absteigender Reihenfolge
        filteredData.sort((a, b) => parseInt(b["Spieltag"], 10) - parseInt(a["Spieltag"], 10));

        // Anzeige der letzten 5 Spiele
        let html = `<div style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.3rem; width: 100%;">`;
        filteredData.slice(0, 5).forEach(row => {
            const homeTeam = row["Heim"] || "Unbekannt";
            const awayTeam = row["Auswärts"] || "Unbekannt";
            const hTore = parseInt(row["H_tore"] || "0", 10);
            const aTore = parseInt(row["A_tore"] || "0", 10);
            const spieltag = parseInt(row["Spieltag"], 10);

            // Ergebnis analysieren
            let borderColor = "gray"; // Standardfarbe für unbekannte Ergebnisse
            if (homeTeam === selectedTeam) {
                if (hTore > aTore) borderColor = "green"; // Heimteam gewinnt
                else if (hTore === aTore) borderColor = "orange"; // Unentschieden
                else borderColor = "red"; // Heimteam verliert
            } else if (awayTeam === selectedTeam) {
                if (aTore > hTore) borderColor = "green"; // Auswärtsteam gewinnt
                else if (aTore === hTore) borderColor = "orange"; // Unentschieden
                else borderColor = "red"; // Auswärtsteam verliert
            }

            // Hinspiel-Logik
            let hinspielInfo = "";
            if (spieltag > 15) {
                const hinspielErgebnis = row["Hinspiel"] || "-";
                hinspielInfo = `
            <div style="font-size: 0.8rem; color: #aaa; text-align: center; margin-top: 0.3rem;">
                Hinspiel: ${hinspielErgebnis}
            </div>
        `;
            }

            html += `
        <div style="font-size: 0.9rem; border: 1px solid #ddd; border-left: 5px solid ${borderColor}; border-radius: 0.1rem; padding: 0.3rem; background-color: #f9f9f9; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.1rem;">
                <span style="font-weight: bold;">${homeTeam}</span>
                <span>${hTore}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">${awayTeam}</span>
                <span>${aTore}</span>
            </div>
            ${hinspielInfo}
        </div>
    `;
        });

        html += `</div>`;
        resultContainer.innerHTML = html;
    }


    function displayNextFiveGames(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Sicherstellen, dass selectedTeam ein String ist
        if (Array.isArray(selectedTeam)) {
            console.error("Selected Team is an array:", selectedTeam); // Debugging
            selectedTeam = selectedTeam[0]; // Nimm den ersten Wert des Arrays
        }

        selectedTeam = selectedTeam?.trim(); // Trimme den Teamnamen (falls erforderlich)

        // Sortiere die Daten nach Spieltag aufsteigend
        const sortedData = data.sort((a, b) => parseInt(a["Spieltag"], 10) - parseInt(b["Spieltag"], 10));

        // Finde den ersten Spieltag, wo H_tore "NA" ist
        const firstUnplayedIndex = sortedData.findIndex(row => row["H_tore"] === "NA");

        if (firstUnplayedIndex === -1) {
            displayNoDataMessage("Keine zukünftigen Spiele verfügbar.");
            return;
        }

        // Extrahiere die nächsten fünf Spiele
        const nextFiveGames = sortedData.slice(firstUnplayedIndex, firstUnplayedIndex + 5);

        // Prüfe auf Hinspiel-Bemerkung
        const matchupsWithHinspiel = {};
        sortedData.forEach(row => {
            const spieltag = parseInt(row["Spieltag"], 10);
            if (spieltag < 16) {
                const matchupKey = `${row["Heim"]}_${row["Auswärts"]}`;
                matchupsWithHinspiel[matchupKey] = row["H_tore"] + ":" + row["A_tore"];
            }
        });

        // Anzeige der Spiele
        let html = `<div style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.3rem; width: 100%;">`;
        nextFiveGames.forEach(row => {
            const homeTeam = row["Heim"] || "Unbekannt";
            const awayTeam = row["Auswärts"] || "Unbekannt";
            const hTore = row["H_tore"] === "NA" ? "-" : row["H_tore"];
            const aTore = row["A_tore"] === "NA" ? "-" : row["A_tore"];
            const matchday = parseInt(row["Spieltag"], 10);

            // Hinspiel-Logik
            let hinspielNote = "";
            if (matchday > 15) {
                const reverseMatchupKey = `${awayTeam}_${homeTeam}`;
                if (matchupsWithHinspiel[reverseMatchupKey]) {
                    const hinspielErgebnis = matchupsWithHinspiel[reverseMatchupKey];
                    const [hToreHinspiel, aToreHinspiel] = hinspielErgebnis.split(":").map(Number);

                    // Gewinner bestimmen
                    let hinspielGewinner = "";
                    if (hToreHinspiel > aToreHinspiel) {
                        hinspielGewinner = `für ${teamAbbreviations[awayTeam] || awayTeam}`;
                    } else if (aToreHinspiel > hToreHinspiel) {
                        hinspielGewinner = `für ${teamAbbreviations[homeTeam] || homeTeam}`;
                    } else {
                        hinspielGewinner = "unentschieden";
                    }

                    hinspielNote = `
            <span style="font-size: 0.8rem; color: gray; text-align: right;">
                Hinspiel: ${hinspielErgebnis} ${hinspielGewinner}
            </span>`;
                }
            }

            html += `
        <div style="font-size: 0.9rem; border: 1px solid #ddd; border-radius: 0.1rem; padding: 0.3rem; background-color: #f9f9f9; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.1rem;">
                <span style="font-weight: bold;">${homeTeam}</span>
                <span>${hTore}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">${awayTeam}</span>
                <span>${aTore}</span>
            </div>
            ${hinspielNote}
        </div>
    `;
        });

        html += `</div>`;
        resultContainer.innerHTML = html;
    }



    // Tore-Analyse
    function displayGoalsAnalysis(data, _, team) {
        const goalBins = Array(18).fill(0);
        const concededBins = Array(18).fill(0);

        data.forEach(row => {
            const minute = parseInt(row["minute"], 10);
            const binIndex = Math.min(Math.floor(minute / 5), 17);
            if (row["team"] === team) {
                goalBins[binIndex]++;
            } else if (row["opponent"] === team) {
                concededBins[binIndex]++;
            }
        });

        // Diagramm erstellen
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
                indexAxis: 'y',
                scales: {
                    y: { beginAtZero: true },
                    x: { beginAtZero: true }
                },
                plugins: {
                    legend: { position: "top" }
                }
            }
        });

        // Tabelle der Tore und Gegentore
        const summaryTable = document.createElement("div");
        summaryTable.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
            <tr>
                <th style="text-align: left; width: 70%; padding: 0.5rem;">Kategorie</th>
                <th style="text-align: right; width: 30%; padding: 0.5rem;">Anzahl</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: left; padding: 0.5rem;">Tore</td>
                <td style="text-align: right; padding: 0.5rem;">${goalBins.reduce((a, b) => a + b, 0)}</td>
            </tr>
            <tr>
                <td style="text-align: left; padding: 0.5rem;">Gegentore</td>
                <td style="text-align: right; padding: 0.5rem;">${concededBins.reduce((a, b) => a + b, 0)}</td>
            </tr>
        </tbody>
    </table>`;
        const tableBox = createBox(summaryTable, { maxWidth: "800px" });
        resultContainer.appendChild(tableBox);
    }

    // Formation-Analyse
    function displayFormationAnalysis(data, _, selectedTeam) {
        if (!data || data.length === 0) {
            displayNoDataMessage("Keine Daten verfügbar.");
            return;
        }

        // Daten nach Team filtern
        const filteredData = selectedTeam
            ? data.filter(row => row["Team"] === selectedTeam)
            : data;

        if (!filteredData || filteredData.length === 0) {
            displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
            return;
        }

        // Analysen vorbereiten
        const uniqueFormations = new Set();
        let threeBackCount = 0;
        let totalSubstitutions = 0;

        const homeFormationCounts = {};
        const awayFormationCounts = {};
        const winFormationCounts = {};
        const platzFormationCounts = {};

        filteredData.forEach(row => {
            const formation = row["Formation"];
            const location = row["Wo"]; // "home" oder "away"
            const platz = row["Platz"]; // Platz-Typ
            const isWin = parseInt(row["Tore"], 10) > parseInt(row["Gegentore"], 10);

            if (formation.startsWith("3-")) threeBackCount++;
            uniqueFormations.add(formation);
            totalSubstitutions += parseInt(row["Wechsel"], 10) || 0;

            // Zähle Formationen nach Heim- und Auswärtsspielen
            if (location === "home") {
                homeFormationCounts[formation] = (homeFormationCounts[formation] || 0) + 1;
            } else if (location === "away") {
                awayFormationCounts[formation] = (awayFormationCounts[formation] || 0) + 1;
            }

            // Zähle Siegformationen
            if (isWin) {
                winFormationCounts[formation] = (winFormationCounts[formation] || 0) + 1;
            }

            // Zähle Formationen nach Platz-Typ
            platzFormationCounts[platz] = platzFormationCounts[platz] || {};
            platzFormationCounts[platz][formation] = (platzFormationCounts[platz][formation] || 0) + 1;
        });

        const avgSubstitutions = (totalSubstitutions / filteredData.length).toFixed(2);

        // Tabelle der Analysen
        const infoTable = document.createElement("div");
        infoTable.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
            <tr>
                <th style="text-align: left; width: 70%; padding: 0.5rem;">Kategorie</th>
                <th style="text-align: center; width: 30%; padding: 0.5rem;">Wert</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: left; padding: 0.5rem;">Unterschiedliche Formationen</td>
                <td style="text-align: center; padding: 0.5rem;">${uniqueFormations.size}</td>
            </tr>
            <tr>
                <td style="text-align: left; padding: 0.5rem;">Formationen mit Dreierkette</td>
                <td style="text-align: center; padding: 0.5rem;">${threeBackCount}</td>
            </tr>
            <tr>
                <td style="text-align: left; padding: 0.5rem;">Durchschnittliche Wechsel</td>
                <td style="text-align: center; padding: 0.5rem;">${avgSubstitutions}</td>
            </tr>
        </tbody>
    </table>`;
        resultContainer.appendChild(createBox(infoTable, { maxWidth: "800px" }));

        // Labels für alle Diagramme
        const labels = Array.from(uniqueFormations);

        // Diagramm 1: Anzahl der gespielten Formationen
        const formationCanvas = createCanvasWithTitle(
            "Anzahl der gespielten Formationen",
            resultContainer
        );
        createResponsiveBarChart(
            formationCanvas,
            "Anzahl der gespielten Formationen",
            labels,
            labels.map(formation =>
                filteredData.filter(row => row["Formation"] === formation).length
            ),
            40 // Feste Balkenhöhe
        );

        // Diagramm 2: Heim vs. Auswärts
        const homeAwayCanvas = createCanvasWithTitle(
            "Formationen: Heim vs. Auswärts",
            resultContainer
        );
        createResponsiveGroupedBarChart(
            homeAwayCanvas,
            "Formationen Heim vs. Auswärts",
            labels,
            {
                Heim: labels.map(formation => homeFormationCounts[formation] || 0),
                Auswärts: labels.map(formation => awayFormationCounts[formation] || 0)
            },
            40 // Feste Balkenhöhe
        );

        // Diagramm 3: Siegformationen
        const winCanvas = createCanvasWithTitle(
            "Siegformationen",
            resultContainer
        );
        createResponsiveBarChart(
            winCanvas,
            "Siegformationen",
            labels,
            labels.map(formation => winFormationCounts[formation] || 0),
            40 // Feste Balkenhöhe
        );

        // Diagramm 4: Formationen nach Platz-Typ mit Dropdown
        const platzDropdown = document.createElement("select");
        platzDropdown.innerHTML = `
        <option value="S">Kleiner Kunstrasen</option>
        <option value="M">Normaler Kunstrasen</option>
        <option value="L">Großer Kunstrasen</option>
        <option value="Kunstrasen">Kunstrasen (alle Größen)</option>
        <option value="NR">Rasenplatz</option>
    `;
        platzDropdown.style.marginBottom = "1rem";
        resultContainer.appendChild(platzDropdown);

        const platzCanvas = createCanvasWithTitle(
            "Formationen auf verschiedenen Plätzen",
            resultContainer
        );

        platzDropdown.addEventListener("change", () => {
            const selectedPlatz = platzDropdown.value;
            updatePlatzChart(selectedPlatz, platzFormationCounts, platzCanvas, labels);
        });

        // Diagramm für den Standard-Platztyp initialisieren
        updatePlatzChart("S", platzFormationCounts, platzCanvas, labels);
    }

    function updatePlatzChart(platzType, platzFormationCounts, platzCanvas, labels) {
        // Wenn "Kunstrasen" ausgewählt ist, addiere die Werte von S, M und L
        const platzData = labels.map(label => {
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

        if (chartInstanceForPlatz) {
            chartInstanceForPlatz.destroy();
        }

        chartInstanceForPlatz = new Chart(platzCanvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
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


// Funktion: Erstelle responsive Bar-Charts
    function createResponsiveBarChart(canvas, title, labels, data, barHeight = 40) {
        const chartHeight = labels.length * barHeight;
        canvas.style.height = `${chartHeight}px`;
        canvas.style.width = "100%";

        new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: title,
                        data: data,
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

// Funktion: Erstelle responsive Grouped-Bar-Charts
    function createResponsiveGroupedBarChart(canvas, title, labels, groupedData, barHeight = 40) {
        const chartHeight = labels.length * barHeight;
        canvas.style.height = `${chartHeight}px`;
        canvas.style.width = "100%";

        const datasets = Object.keys(groupedData).map((group, index) => ({
            label: group,
            data: groupedData[group],
            backgroundColor: index === 0 ? "rgba(75, 192, 192, 0.6)" : "rgba(255, 99, 132, 0.6)",
            borderColor: index === 0 ? "rgba(75, 192, 192, 1)" : "rgba(255, 99, 132, 1)",
            borderWidth: 1
        }));

        new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: datasets
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

// Funktion: Erstelle eine Canvas mit Titel
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

// Funktion: Anzeige bei fehlenden Daten
    function displayNoDataMessage(message) {
        const noDataMessage = document.createElement("p");
        noDataMessage.textContent = message;
        noDataMessage.style.textAlign = "center";
        noDataMessage.style.marginTop = "1rem";
        resultContainer.appendChild(noDataMessage);
    }

// Funktion: Erstelle Boxen
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


    // CSV laden und filtern
    function loadCSVandFilter(csvPath, selectedTeam, columns, displayFunction) {
        console.log("Selected Team:", selectedTeam); // Debugging: Zeigt das ausgewählte Team
        console.log("CSV Path:", csvPath); // Debugging: CSV-Pfad anzeigen

        Papa.parse(csvPath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                console.log("CSV Raw Results:", results); // Debugging: Zeige Rohdaten
                console.log("Spaltennamen in CSV:", results.meta.fields); // Debugging: Zeige Spaltennamen
                console.log("Geladene Daten (Original Data):", results.data); // Debugging: Zeige die geladenen Daten

                const rawData = results.data;
                const headers = results.meta.fields || [];

                // Prüfen, ob die erwarteten Spalten vorhanden sind (sofern definiert)
                if (columns && columns.length > 0) {
                    const missingColumns = columns.filter(col => !headers.includes(col));
                    if (missingColumns.length > 0) {
                        console.error("Fehlende Spalten in der CSV:", missingColumns);
                        displayNoDataMessage(`Die CSV-Datei enthält nicht alle benötigten Spalten: ${missingColumns.join(", ")}`);
                        return;
                    }
                }

                // Filter Logik anpassen je nach Kategorie
                let filteredData = [];
                if (columns.includes("Team")) {
                    filteredData = rawData.filter(row => row["Team"]?.trim().toLowerCase() === selectedTeam.toLowerCase());
                } else if (columns.includes("Heim") && columns.includes("Auswärts")) {
                    filteredData = rawData.filter(row =>
                        row["Heim"]?.trim().toLowerCase() === selectedTeam.toLowerCase() ||
                        row["Auswärts"]?.trim().toLowerCase() === selectedTeam.toLowerCase()
                    );
                } else {
                    filteredData = rawData; // Für Tabellen ohne spezifische Filterung
                }

                console.log("Gefilterte Daten (Filtered Data):", filteredData); // Debugging: Zeige gefilterte Daten

                // Wenn keine Daten gefunden wurden, logge die Fehlermeldung und zeige eine Nachricht an
                if (filteredData.length === 0) {
                    console.warn(`Keine Daten für das Team "${selectedTeam}" gefunden.`);
                    displayNoDataMessage(`Keine Daten verfügbar für das Team "${selectedTeam}".`);
                    return;
                }

                // Rufe die Anzeige-Funktion mit den gefilterten Daten auf
                try {
                    displayFunction(filteredData, columns, selectedTeam);
                } catch (error) {
                    console.error("Fehler beim Verarbeiten der Anzeige-Funktion:", error);
                    displayNoDataMessage("Ein Fehler ist beim Verarbeiten der Daten aufgetreten.");
                }
            },
            error: function (error) {
                console.error("Fehler beim Laden der CSV-Datei:", error);
                displayNoDataMessage("Die CSV-Datei konnte nicht geladen werden. Bitte überprüfen Sie den Dateipfad.");
            }
        });
    }




    // Ergebnisse aktualisieren
    function updateResults() {
        resetResultContainer();

        const selectedCategory = categorySelect.value;
        const selectedTeam = teamSelect.value;

        if (!selectedCategory || !selectedTeam) {
            const noSelectionMessage = document.createElement("p");
            noSelectionMessage.textContent = "Bitte wählen Sie ein Team und eine Kategorie aus.";
            resultContainer.appendChild(noSelectionMessage);
            return;
        }

        const categoryConfig = categories[selectedCategory];
        if (!categoryConfig) {
            console.error(`Kategorie "${selectedCategory}" nicht gefunden.`);
            return;
        }

        loadCSVandFilter(categoryConfig.csvPath, selectedTeam, categoryConfig.columns, categoryConfig.displayFunction);
    }

    // Dropdowns initialisieren
    populateDropdown(teamSelect, teams, "Team auswählen");
    populateDropdown(categorySelect, Object.keys(categories), "Kategorie auswählen");

    // Eventlistener hinzufügen
    teamSelect.addEventListener("change", updateResults);
    categorySelect.addEventListener("change", updateResults);
});
