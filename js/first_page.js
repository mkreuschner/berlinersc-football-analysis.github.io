document.addEventListener("DOMContentLoaded", () => {
    const matchdaySelect = document.getElementById("matchdaySelect");
    const matchdayContainer = document.getElementById("dataMatchday");
    const tableSelect = document.getElementById("tableSelect");
    const tableContainer = document.getElementById("table-container");
    const prevButton = document.getElementById("prevMatchday");
    const nextButton = document.getElementById("nextMatchday");
    let matchdaysData = [];
    let currentMatchday = 1;

    // CSV-Datei für Spieltage laden und Dropdown füllen
    Papa.parse("https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/output/match_results_and_probabilities.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            console.log("Rohdaten aus CSV:", results); // Debug: CSV-Ergebnisse überprüfen
            if (!results.data || results.data.length === 0) {
                console.error("Keine Daten in der CSV-Datei gefunden.");
                matchdayContainer.innerHTML = "<p>Keine Daten verfügbar.</p>";
                return;
            }
            matchdaysData = results.data.filter(row => row["matchday"] && row["H"] && row["A"] && row["Tore_H"] && row["Tore_A"]);
            console.log("Gefilterte Daten:", matchdaysData); // Debug: Gefilterte Daten überprüfen
            if (matchdaysData.length === 0) {
                console.error("Keine gültigen Einträge in der CSV-Datei gefunden.");
                matchdayContainer.innerHTML = "<p>Keine gültigen Daten verfügbar.</p>";
                return;
            }
            populateMatchdayDropdown(matchdaysData);
            displayMatchday(currentMatchday);
        },
        error: function (error) {
            console.error("Fehler beim Laden der Spieltagsdaten:", error);
        }
    });

    // Dropdown für Spieltage füllen
    function populateMatchdayDropdown(data) {
        const uniqueMatchdays = [...new Set(data.map(row => parseInt(row["matchday"])))].sort((a, b) => a - b);
        uniqueMatchdays.forEach(matchday => {
            const option = document.createElement("option");
            option.value = matchday;
            option.textContent = `Spieltag ${matchday}`;
            matchdaySelect.appendChild(option);
        });
        matchdaySelect.value = currentMatchday; // Standardwert setzen
    }

    function displayMatchday(matchday) {
        const filteredData = matchdaysData.filter(row => parseInt(row["matchday"]) === matchday);
        if (filteredData.length === 0) {
            matchdayContainer.innerHTML = "<p style='text-align: center;'>Keine Spiele für diesen Spieltag verfügbar.</p>";
            return;
        }

        let html = `<div style="
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 0.3rem;
        max-width: 400px;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
    ">`;

        filteredData.forEach(row => {
            const homeTeam = row["home_team"] || row["H"] || "Unbekannt";
            const awayTeam = row["away_team"] || row["A"] || "Unbekannt";
            const homeGoals = row["goals_home"] || row["Tore_H"];
            const awayGoals = row["goals_away"] || row["Tore_A"];
            const isPlayed = homeGoals !== undefined && awayGoals !== undefined && homeGoals !== "" && awayGoals !== ""&& homeGoals !== "NA" && awayGoals !== "NA";

            html += `<div style="
            font-size: 0.9rem;
            border: 1px solid #ddd;
            border-radius: 0.2rem;
            padding: 0.4rem;
            background-color: #fdfdfd;
            box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.05);
            width: 100%;
        ">`;

            if (isPlayed) {
                html += `
                <div style="padding: 0.4rem; border: 1px solid #ddd; border-radius: 0.3rem; background-color: #f8f8f8;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                        <strong>${homeTeam}</strong>
                        <span>${homeGoals}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${awayTeam}</strong>
                        <span>${awayGoals}</span>
                    </div>
                </div>`;
            } else {
                const probHome = parseFloat(row["prob_home_win"]) || 0;
                const probDraw = parseFloat(row["prob_draw"]) || 0;
                const probAway = parseFloat(row["prob_away_win"]) || 0;

                html += `
                <div style="padding: 0.4rem; border: 1px solid #ddd; border-radius: 0.3rem; background-color: #f9f9f9;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                        <strong>${homeTeam}</strong>
                        <span>${Math.round(probHome * 100)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                        <span style="font-style: italic;">Unentschieden</span>
                        <span>${Math.round(probDraw * 100)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${awayTeam}</strong>
                        <span>${Math.round(probAway * 100)}%</span>
                    </div>
                </div>`;
            }


            html += `</div>`;
        });

        html += `</div>`;
        matchdayContainer.innerHTML = html;
    }


    // Spieltagsnavigation
    prevButton.addEventListener("click", () => {
        if (currentMatchday > Math.min(...matchdaysData.map(row => parseInt(row["matchday"])))) {
            currentMatchday--;
            displayMatchday(currentMatchday);
            matchdaySelect.value = currentMatchday;
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentMatchday < Math.max(...matchdaysData.map(row => parseInt(row["matchday"])))) {
            currentMatchday++;
            displayMatchday(currentMatchday);
            matchdaySelect.value = currentMatchday;
        }
    });

    // Auswahl aus Dropdown
    matchdaySelect.addEventListener("change", () => {
        const selectedMatchday = parseInt(matchdaySelect.value);
        if (!isNaN(selectedMatchday)) {
            currentMatchday = selectedMatchday;
            displayMatchday(currentMatchday);
        }
    });

    // Tabellenlogik: Dropdown für Tabellen
    tableSelect.addEventListener("change", function () {
        const selectedOption = this.options[this.selectedIndex];
        const filePath = selectedOption.value;
        const columns = selectedOption.getAttribute("data-columns").split(",");
        const specialFormat = selectedOption.getAttribute("data-special");

        if (filePath) {
            if (specialFormat === "form") {
                loadTableCSVWithSpecialFormatting(filePath, columns, tableContainer);
            } else {
                loadTableCSV(filePath, columns, tableContainer);
            }
        } else {
            tableContainer.innerHTML = "<p>Bitte eine Tabelle auswählen.</p>";
        }
    });

    function loadTableCSV(filePath, columnsToShow, container) {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                let data = results.data;

                // Teamnamen ersetzen
                data = replaceTeamNames(data, "team");

                // Tabelle anzeigen
                displayFilteredTable(data, container, columnsToShow);
            },
            error: function (error) {
                console.error("Fehler beim Laden der CSV-Datei:", error);
                container.innerHTML = `<p style="text-align: center;">Fehler beim Laden der Tabellendaten.</p>`;
            }
        });
    }

    function loadTableCSVWithSpecialFormatting(filePath, columnsToShow, container) {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                let data = results.data.map(row => {
                    const filteredRow = {};
                    columnsToShow.forEach(column => {
                        filteredRow[column] = row[column] || "-";
                    });
                    return filteredRow;
                });

                // Teamnamen ersetzen
                data = replaceTeamNames(data, "team");

                // Tabelle mit spezieller Formatierung anzeigen
                displayFormattedTable(data, container);
            },
            error: function (error) {
                console.error("Fehler beim Laden der Formtabelle:", error);
                container.innerHTML = `<p style="text-align: center;">Fehler beim Laden der Formtabelle.</p>`;
            }
        });
    }

    function displayFormattedTable(data, container) {
        if (data.length === 0) {
            container.innerHTML = `<p style="text-align: center;">Keine Daten verfügbar.</p>`;
            return;
        }

        // Gewichtung für die Spalten E5 bis E1
        const formWeights = {
            E5: 1,
            E4: 2,
            E3: 3,
            E2: 4,
            E1: 5
        };

        // Punktezuordnung
        const points = {
            S: 3,
            U: 1,
            N: 0
        };

        // HTML für die Tabelle mit zentriertem Container
        let html = `
    <div style="
        border: 1px solid #ddd; 
        border-radius: 0.5rem; 
        padding: 1rem; 
        background-color: #f9f9f9; 
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1); 
        max-width: 500px; 
        margin: 1rem auto; 
        display: flex; 
        flex-direction: column;
    ">
        <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 0.9rem; 
            table-layout: fixed;
        ">
            <colgroup>
                <col style="width: 10%;">   <!-- Spalte 1: Feste Breite -->
                <col style="width: auto;"> <!-- Spalte 2 (Team): Flexibel -->
                <col style="width: 5%;">  <!-- Spalte 3: Feste Breite -->
                <col style="width: 5%;">  <!-- Spalte 4: Feste Breite -->
                <col style="width: 5%;">  <!-- Spalte 5: Feste Breite -->
                <col style="width: 5%;">  <!-- Spalte 6: Feste Breite -->
                <col style="width: 10%;">  <!-- Spalte 7: Feste Breite -->
            </colgroup>
            <thead style="background-color: #f4f4f4;">
                <tr>`;

        // Tabellen-Header erstellen
        Object.keys(data[0]).forEach((key, index) => {
            const alignStyle = index === 1 ? "text-align: left;" : "text-align: center;";
            html += `<th style="padding: 0.5rem; ${alignStyle} border-bottom: 1px solid #ddd;">${key}</th>`;
        });
        html += `<th style="padding: 0.5rem; text-align: center; border-bottom: 1px solid #ddd;">Formwert</th>`;
        html += `</tr></thead><tbody>`;

        // Tabellen-Zeilen erstellen
        data.forEach(row => {
            html += `<tr style="border-bottom: 1px solid #ddd;">`;

            let totalScore = 0;
            let totalWeight = 0;

            Object.entries(row).forEach(([key, value], index) => {
                let style = "padding: 0.5rem; white-space: nowrap;"; // Text wird nicht umgebrochen

                // Spalte 2 (Team): Links ausgerichtet und flexibel
                if (index === 1) {
                    style += "text-align: left; font-weight: bold; width: auto; overflow: hidden; text-overflow: ellipsis;";
                } else {
                    style += "text-align: center;";
                }

                // Farbzuweisung für "S", "U", "N"
                if (["S", "U", "N"].includes(value)) {
                    if (value === "S") {
                        style += "background-color: #d4edda; color: #155724;"; // Grün für "S"
                        totalScore += points[value] * formWeights[key];
                    } else if (value === "U") {
                        style += "background-color: #fff3cd; color: #856404;"; // Orange für "U"
                        totalScore += points[value] * formWeights[key];
                    } else if (value === "N") {
                        style += "background-color: #f8d7da; color: #721c24;"; // Rot für "N"
                    }
                    totalWeight += formWeights[key];
                }

                html += `<td style="${style}">${value}</td>`;
            });

            // Berechnung des gewichteten Durchschnittswerts mit einer Nachkommastelle
            const weightedScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : "0.0";

            // Hinzufügen der berechneten Spalte
            html += `<td style="padding: 0.5rem; text-align: center; font-weight: bold;">${weightedScore}</td>`;
            html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }





    function displayFilteredTable(data, container, columnsToShow) {
        if (data.length === 0) {
            container.innerHTML = `<p style="text-align: center;">Keine Daten verfügbar.</p>`;
            return;
        }

        // Filtere die Daten nach den gewünschten Spalten
        const filteredData = data.map(row => {
            const filteredRow = {};
            columnsToShow.forEach(column => {
                filteredRow[column] = row[column] || "-";
            });
            return filteredRow;
        });

        // HTML für die Tabelle mit zentriertem Container
        let html = `
    <div style="
        border: 1px solid #ddd; 
        border-radius: 0.5rem; 
        padding: 1rem; 
        background-color: #f9f9f9; 
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1); 
        max-width: 500px; 
        margin: 1rem auto; 
        display: flex; 
        flex-direction: column;
    ">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <colgroup>
                <col style="width: 5%;">   <!-- Spalte 1: Feste Breite -->
                <col style="width: auto;"> <!-- Spalte 2 (Team): Flexibel -->
                <col style="width: 5%;">  <!-- Spalte 3: Feste Breite -->
                <col style="width: 10%;">  <!-- Spalte 4: Feste Breite -->
                <col style="width: 10%;">  <!-- Spalte 5: Feste Breite -->
                <col style="width: 10%;">  <!-- Spalte 6: Feste Breite -->
            </colgroup>
            <thead style="background-color: #f4f4f4;">
                <tr>`;

        // Tabellen-Header erstellen
        columnsToShow.forEach((column, index) => {
            const alignStyle = index === 1 ? "text-align: left;" : "text-align: center;";
            html += `<th style="padding: 0.5rem; ${alignStyle} border-bottom: 1px solid #ddd;">${column}</th>`;
        });

        html += `</tr></thead><tbody>`;

        // Tabellen-Zeilen erstellen
        filteredData.forEach(row => {
            html += `<tr style="border-bottom: 1px solid #ddd;">`;

            Object.entries(row).forEach(([key, value], index) => {
                let style = "padding: 0.5rem;";

                // Spalte 2 (Team): Links ausgerichtet und flexibel
                if (index === 1) {
                    style += "text-align: left; font-weight: bold; width: auto; overflow: hidden; text-overflow: ellipsis;";
                } else {
                    style += "text-align: center;";
                }

                html += `<td style="${style}">${value}</td>`;
            });

            html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }



    // CSV-Datei für die Formtabelle laden
    displayFormattedTable(data, document.getElementById("table-container"));

    // Teamnamen ersetzen
    function replaceTeamNames(data, teamColumn) {
        const teamNameMapping = {
            "TSV Rudow Berlin": "Rudow",
            "BFC Preussen II": "Preussen II",
            "BFC Meteor 06": "Meteor",
            "BSV Eintracht Mahlsdorf II": "Mahlsdorf II",
            "SC Borsigwalde 1910": "Borsigwalde",
            "Berliner SV 1892": "BSV 92",
            "FC Viktoria 1889 Berlin II": "Viktoria II",
            "FC Internationale Berlin 1980": "Inter",
            "Türkiyemspor Berlin": "Tükiyem",
            "Berliner SC II": "BSC II",
            "Köpenicker FC": "Köpenick",
            "BSV Al-Dersimspor": "Al-Dersim",
            "FSV Berolina Stralau 1901": "Stralau",
            "SV Empor Berlin II": "Empor II",
            "SV Stern Britz 1889": "Britz",
            "VfB Concordia Britz 1916": "Concordia"
        };

        return data.map(row => {
            if (row[teamColumn] && teamNameMapping[row[teamColumn]]) {
                row[teamColumn] = teamNameMapping[row[teamColumn]];
            }
            return row;
        });
    }

});
