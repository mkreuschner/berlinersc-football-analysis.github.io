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
    Papa.parse("https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/Spieltage.csv", {
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

    // Spieltag anzeigen
    function displayMatchday(matchday) {
        const filteredData = matchdaysData.filter(row => parseInt(row["matchday"]) === matchday);
        if (filteredData.length === 0) {
            matchdayContainer.innerHTML = "<p>Keine Spiele für diesen Spieltag verfügbar.</p>";
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.3rem;">`;

        filteredData.forEach(row => {
            const homeTeam = row["H"] || "Unbekannt";
            const awayTeam = row["A"] || "Unbekannt";
            const homeGoals = row["Tore_H"] || "0";
            const awayGoals = row["Tore_A"] || "0";

            html += `
            <div style="font-size: 0.9rem; border: 1px solid #ddd; border-radius: 0.1rem; padding: 0.3rem; background-color: #f9f9f9; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.1rem;">
                    <span style="font-weight: bold;">${homeTeam}</span>
                    <span>${homeGoals}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">${awayTeam}</span>
                    <span>${awayGoals}</span>
                </div>
            </div>
        `;
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
                data = replaceTeamNames(data, "team"); // Ersetzt Teamnamen in der Spalte "Team"

                displayFilteredTable(data, container, columnsToShow);
            },
            error: function (error) {
                console.error("Fehler beim Laden der CSV-Datei:", error);
                container.innerHTML = "<p>Fehler beim Laden der Tabellendaten.</p>";
            }
        });
    }

    // Spezielle Formatierung für die Formtabelle
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
                data = replaceTeamNames(data, "team"); // Ersetzt Teamnamen in der Spalte "Team"

                displayFormattedTable(data, container);
            },
            error: function (error) {
                console.error("Fehler beim Laden der Formtabelle:", error);
                container.innerHTML = "<p>Fehler beim Laden der Formtabelle.</p>";
            }
        });
    }

    function displayFilteredTable(data, container, columnsToShow) {
        if (data.length === 0) {
            container.innerHTML = "<p>Keine Daten verfügbar.</p>";
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

        // HTML für die Tabelle mit Header und angepasster Spaltenausrichtung
        let html = `
    <div style="border: 1px solid #ddd; border-radius: 0.5rem; padding: 0.5rem; background-color: #f9f9f9; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); margin-top: 0.5rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
            <colgroup>
                <col style="width: 5%;"> <!-- Spalte 1 -->
                <col style="width: auto; text-align: left; font-weight: bold;"> <!-- Dynamische Spalte 2 -->
                <col style="width: 5%; text-align: center;"> <!-- Spalte 3 -->
                <col style="width: 5%; text-align: center;"> <!-- Spalte 4 -->
                <col style="width: 5%; text-align: center;"> <!-- Spalte 5 -->
                <col style="width: 5%; text-align: center;"> <!-- Spalte 6 -->
            </colgroup>
            <thead style="background-color: #f4f4f4;">
                <tr>`;

        // Erstelle Tabellen-Header
        columnsToShow.forEach((column, index) => {
            const alignStyle = index === 1 ? "text-align: left;" : "text-align: center;";
            html += `<th style="padding: 0.5rem; ${alignStyle} border-bottom: 1px solid #ddd;">${column}</th>`;
        });

        html += `</tr></thead><tbody>`;

        // Erstelle Tabellen-Zeilen
        filteredData.forEach(row => {
            html += `<tr style="border-bottom: 1px solid #ddd;">`;

            Object.entries(row).forEach(([key, value], index) => {
                let style = "padding: 0.5rem;";

                // Spalte 2: Links ausgerichtet und fett
                if (index === 1) {
                    style += "text-align: left; font-weight: bold;";
                }

                // Spalten 3 bis 7: Inhalte einfärben (für "S", "U", "N")
                if (index == 0 ) {
                    style += "text-align: center;";
                    if (value === "1") {
                        style += "background-color: #d4edda; color: #155724;"; // Grün für "S"
                    } else if (value === "2") {
                        style += "background-color: #fff3cd; color: #856404;"; // Gelb für "U"
                    } else if (value === "14" || value === "15" || value === "16") {
                        style += "background-color: #f8d7da; color: #721c24;"; // Rot für "N"
                    }
                }

                html += `<td style="${style}">${value}</td>`;
            });

            html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }


    // Anzeige der Formtabelle mit spezieller Formatierung
    function displayFormattedTable(data, container) {
        if (data.length === 0) {
            container.innerHTML = "<p>Keine Daten verfügbar.</p>";
            return;
        }

        // HTML für die Tabelle mit Header und angepasster Spaltenausrichtung
        let html = `
    <div style="border: 1px solid #ddd; border-radius: 0.5rem; padding: 0.5rem; background-color: #f9f9f9; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); margin-top: 0.5rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
            <colgroup>
                <col style="width: 2%;"> <!-- Spalte 1 -->
                <col style="width: auto;"> <!-- Spalte 2 -->
                <col style="width: 5%;"> <!-- Spalte 3 -->
                <col style="width: 5%;"> <!-- Spalte 4 -->
                <col style="width: 5%;"> <!-- Spalte 5 -->
                <col style="width: 5%;"> <!-- Spalte 6 -->
                <col style="width: 5%;"> <!-- Spalte 7 -->
            </colgroup>
            <thead style="background-color: #f4f4f4;">
                <tr>`;

        // Erstelle Tabellen-Header basierend auf den Spaltennamen
        Object.keys(data[0]).forEach((key, index) => {
            const alignStyle = index === 1 ? "text-align: left;" : "text-align: center;";
            html += `<th style="padding: 0.5rem; ${alignStyle} border-bottom: 1px solid #ddd;">${key}</th>`;
        });

        html += `</tr></thead><tbody>`;

        // Erstelle Tabellen-Zeilen
        data.forEach(row => {
            html += `<tr style="border-bottom: 1px solid #ddd;">`;

            Object.entries(row).forEach(([key, value], index) => {
                let style = "padding: 0.5rem;";

                // Spalte 2: Links ausgerichtet und fett
                if (index === 1) {
                    style += "text-align: left; font-weight: bold;";
                }

                // Spalten 3 bis 7: Inhalte einfärben (für "S", "U", "N")
                if (index >= 2 && index <= 6) {
                    style += "text-align: center;";
                    if (value === "S") {
                        style += "background-color: #d4edda; color: #155724;"; // Grün für "S"
                    } else if (value === "U") {
                        style += "background-color: #fff3cd; color: #856404;"; // Gelb für "U"
                    } else if (value === "N") {
                        style += "background-color: #f8d7da; color: #721c24;"; // Rot für "N"
                    }
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
