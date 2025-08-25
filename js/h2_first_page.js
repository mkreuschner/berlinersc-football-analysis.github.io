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
    Papa.parse("https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H2/Routput/match_results_and_probabilities_H2.csv", {
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
        display:flex;flex-direction:column;gap:0.3rem;margin-top:0.3rem;max-width:400px;
        align-items:center;justify-content:center;margin-left:auto;margin-right:auto;">`;

        filteredData.forEach(row => {
            const homeTeamRaw = row["home_team"] || row["H"] || "Unbekannt";
            const awayTeamRaw = row["away_team"] || row["A"] || "Unbekannt";
            const homeTeam = renderTeamCell(homeTeamRaw);
            const awayTeam = renderTeamCell(awayTeamRaw);
            const homeGoals = row["goals_home"] || row["Tore_H"];
            const awayGoals = row["goals_away"] || row["Tore_A"];
            const isPlayed = homeGoals !== undefined && awayGoals !== undefined &&
                     homeGoals !== "" && awayGoals !== "" && homeGoals !== "NA" && awayGoals !== "NA";

            html += `<div style="font-size:.9rem;border:1px solid #ddd;border-radius:.2rem;padding:.4rem;background-color:#fdfdfd;box-shadow:1px 1px 3px rgba(0,0,0,.05);width:100%;">`;

        if (isPlayed) {
      html += `
            <div style="padding:.4rem;border:1px solid #ddd;border-radius:.3rem;background-color:#f8f8f8;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;">
                <div>${homeTeam}</div>
                <span>${homeGoals}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>${awayTeam}</div>
                <span>${awayGoals}</span>
            </div>
            </div>`;
        } else {
        const probHome = parseFloat(row["prob_home_win"]) || 0;
        const probDraw = parseFloat(row["prob_draw"]) || 0;
        const probAway = parseFloat(row["prob_away_win"]) || 0;

      html += `
        <div style="padding:.4rem;border:1px solid #ddd;border-radius:.3rem;background-color:#f9f9f9;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
            <div>${homeTeam}</div>
            <span>${Math.round(probHome * 100)}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
            <span style="font-style:italic;">Unentschieden</span>
            <span>${Math.round(probDraw * 100)}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>${awayTeam}</div>
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
            "Berliner SC II": "BSC II",
            "SV Empor Berlin II": "Empor II",
            "BFC Preussen II": "Preussen II",
            "SC Berliner Amateure": "Amateure",
            "Berolina Mitte": "Berolina",
            "SC Borsigwalde 1910": "Borsigwalde",
            "Berliner SV 1892": "BSV 92",
            "SF Charlottenburg-Wilmmersdorf": "Charl-Wilm",
            "Friedenauer TSC": "Friedenau",
            "Berlin Hilalspor": "Hilalspor",
            "BSC Hürtürkel": "Hürtürkel",
            "FC Internationale Berlin 1980": "Inter",
            "SF Johannisthal": "Jo'thal",
            "DJK Neukölln": "Neukölln",
            "Pfeffersport": "Pfeffersport",
            "1.FC Schöneberg": "Schöneberg"
        };

        return data.map(row => {
            if (row[teamColumn] && teamNameMapping[row[teamColumn]]) {
                row[teamColumn] = teamNameMapping[row[teamColumn]];
            }
            return row;
        });
    }

});

// Basisordner deiner Logos
const LOGO_BASE = "images/logo/h2/"; 

// Optional: exakte Zuordnung für Sonderfälle/abweichende Schreibweisen
const logoMap = {
  "Berliner SC II": "bsc.jpeg",
  "SV Empor Berlin II": "empor.png",
  "BFC Preussen II": "preussen.jpeg",
  "SC Berliner Amateure": "amateure.jpeg",
  "Berolina Mitte": "berolina.png",
  "SC Borsigwalde 1910": "borsigwalde.png",
  "Berliner SV 1892": "bsv92.jpeg",
  "SF Charlottenburg-Wilmmersdorf": "charlwilm.png",
  "Friedenauer TSC": "friedenau.jpeg",
  "Berlin Hilalspor": "hilalspor.jpeg",
  "BSC Hürtürkel": "huertuerkel.jpeg",
  "FC Internationale Berlin 1980": "inter.jpeg",
  "SF Johannisthal": "johannisthal.jpeg",
  "DJK Neukölln": "neukölln.jpeg",
  "Pfeffersport": "pfeffersport.png",
  "1.FC Schöneberg": "schoeneberg.png"
  
};

// Fallback: aus Teamnamen Dateiname ableiten (ä->ae, ö->oe, ü->ue, ß->ss, Leerzeichen->-)
function slugifyTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Diakritika
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // alles Nicht-Alphanum. -> -
    .replace(/^-+|-+$/g, '');        // Trennstriche trimmen
}

function logoUrlFor(name) {
  if (logoMap[name]) return LOGO_BASE + logoMap[name];
  return LOGO_BASE + slugifyTeamName(name) + ".jpg"; // oder .svg
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]))}

function renderTeamCell(name){
  const url = logoUrlFor(name);
  return `<span class="team-cell">
            <img class="team-logo" src="${url}" alt="${escapeHtml(name)} Logo"
                 onerror="this.style.display='none'">
            <span>${escapeHtml(name)}</span>
          </span>`;
}

/**
 * Dekoriere bestimmte Spalten im fertigen Table mit Logos.
 * columnCandidates = mögliche Spaltenüberschriften aus deiner CSV (pass an!)
 */
function decorateTeamCells(tableEl, columnCandidates = ["Team","Heim","Gast","Home","Away"]) {
  if (!tableEl) return;
  const rows = Array.from(tableEl.querySelectorAll("tr"));
  if (!rows.length) return;

  // Header finden (th oder erste Zeile)
  const headerCells = Array.from(rows[0].querySelectorAll("th, td")).map(td=>td.textContent.trim());
  const teamColIdx = headerCells
    .map((name, idx) => columnCandidates.includes(name) ? idx : -1)
    .filter(idx => idx >= 0);

  // Falls keine Headerbeschriftung existiert: überspringen
  if (!teamColIdx.length) return;

  // alle Datenzeilen
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r].children;
    teamColIdx.forEach(ci => {
      const cell = cells[ci];
      if (!cell) return;
      const name = cell.textContent.trim();
      if (name) cell.innerHTML = renderTeamCell(name);
    });
  }
}

// Beispiel-Aufruf NACHDEM du die Tabelle in #dataMatchday befüllt hast:
decorateTeamCells(document.getElementById("dataMatchday"), ["Heim","Gast","Team"]);
