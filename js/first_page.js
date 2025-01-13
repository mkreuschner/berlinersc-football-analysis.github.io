// Event Listener für Spieltage
const matchdaySelect = document.getElementById("matchdaySelect");
const matchdayContainer = document.getElementById("dataMatchday");

// Event Listener für Tabellen
const tableSelect = document.getElementById("tableSelect");
const tableContainer = document.getElementById("dataTable");

matchdaySelect.addEventListener("change", function () {
    const selectedMatchday = matchdaySelect.value;
    if (selectedMatchday) {
        loadMatchdayCSV(selectedMatchday);
    } else {
        matchdayContainer.innerHTML = "<p>Bitte einen Spieltag auswählen.</p>";
    }
});

tableSelect.addEventListener("change", function () {
    const selectedTable = tableSelect.value;
    if (selectedTable) {
        loadTableCSV(selectedTable);
    } else {
        tableContainer.innerHTML = "<p>Bitte eine Tabelle auswählen.</p>";
    }
});

// Funktion zum Laden und Filtern der Spieltag-CSV-Datei
function loadMatchdayCSV(filePath) {
    Papa.parse(filePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            const data = results.data;
            const selectedOption = matchdaySelect.options[matchdaySelect.selectedIndex].text;
            let filteredData = [];
            if (selectedOption === "Letzter Spieltag") {
                // Spieltage mit Ergebnissen wie "2:1" filtern
                const playedMatchdays = data.filter(row => /^\d+:\d+$/.test(row["Tore"]));
                if (playedMatchdays.length > 0) {
                    const lastMatchdayNumber = Math.max(...playedMatchdays.map(row => parseInt(row["#"])));
                    filteredData = data.filter(row => parseInt(row["#"]) === lastMatchdayNumber);
                }
            } else if (selectedOption === "Nächster Spieltag") {
                // Der nächste Spieltag nach dem letzten Ergebnis
                const playedMatchdays = data.filter(row => /^\d+:\d+$/.test(row["Tore"]));
                if (playedMatchdays.length > 0) {
                    const lastMatchdayNumber = Math.max(...playedMatchdays.map(row => parseInt(row["#"])));
                    filteredData = data.filter(row => parseInt(row["#"]) === lastMatchdayNumber + 1);
                }
            }
            // Ersetzen der Teamnamen
            filteredData = replaceTeamNames(filteredData, ["H", "A"]);
            // Fülle auf 8 Zeilen, falls weniger vorhanden
            while (filteredData.length < 8) {
                filteredData.push({ "#": "-", H: "-", A: "-", Tore: "-" });
            }
            displayData(filteredData, matchdayContainer, ["#", "H", "A", "Tore"]);
        },
        error: function (error) {
            console.error("Fehler beim Laden der CSV-Datei:", error);
            matchdayContainer.innerHTML = "<p>Fehler beim Laden der Spieltagsdaten.</p>";
        }
    });
}

// Funktion zum Laden und Anzeigen der Tabellen-CSV-Datei
function loadTableCSV(filePath) {
    Papa.parse(filePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            let data = results.data;
            // Teamnamen basierend auf der Bildschirmgröße ersetzen
            if (isSmallScreen()) {
                data = replaceTeamNames(data, ["team"]);
            }
            displayData(data, tableContainer, null); // Lädt alle Spalten für Tabellen
        },
        error: function (error) {
            console.error("Fehler beim Laden der CSV-Datei:", error);
            tableContainer.innerHTML = "<p>Fehler beim Laden der Tabellendaten.</p>";
        }
    });
}

// Funktion zum Erstellen der HTML-Tabelle aus CSV-Daten
function displayData(data, container, columnsToShow) {
    if (data.length === 0) {
        container.innerHTML = "<p>Keine Daten verfügbar.</p>";
        return;
    }
    // Filtere nur die Spalten, die angezeigt werden sollen
    const filteredData = columnsToShow
        ? data.map(row => {
            const filteredRow = {};
            columnsToShow.forEach(column => {
                filteredRow[column] = row[column] || "-"; // Füge einen Platzhalter hinzu, wenn Daten fehlen
            });
            return filteredRow;
        })
        : data;
    // Erstelle die Tabelle
    let html = "<table style='width: 100%; border-collapse: collapse; font-size: 1rem; margin-top: 0.2rem;'>";
    html += "<thead style='background-color: #f4f4f4;'>";
    html += "<tr>";
    Object.keys(filteredData[0]).forEach(key => {
        html += `<th style='border: 0.1rem solid #fff; padding: 0.2rem; font-family: Inconsolata, monospace;'>${key}</th>`;
    });
    html += "</tr></thead><tbody>";
    filteredData.forEach(row => {
        html += "<tr>";
        Object.values(row).forEach(value => {
            html += `<td style='border: 0.1rem solid #fff; padding: 0.2rem; font-family: Inconsolata, monospace;'>${value}</td>`;
        });
        html += "</tr>";
    });
    html += "</tbody></table>";
    container.innerHTML = html;
}

// Funktion zur Erkennung der Bildschirmgröße
function isSmallScreen() {
    return window.innerWidth <= 768; // Definiert kleine Bildschirme (z. B. mobile Geräte)
}

// Funktion zum Ersetzen der Teamnamen
const teamNameMapping = {
    "TSV Rudow Berlin": "RUD",
    "BFC Preussen II": "PRE",
    "BFC Meteor 06": "MET",
    "BSV Eintracht Mahlsdorf II": "MAH",
    "SC Borsigwalde 1910": "BOR",
    "Berliner SV 1892": "BSV",
    "FC Viktoria 1889 Berlin II": "VIK",
    "FC Internationale Berlin 1980": "INT",
    "Türkiyemspor Berlin": "TUR",
    "Berliner SC II": "BSC",
    "Köpenicker FC": "KOP",
    "BSV Al-Dersimspor": "ALD",
    "FSV Berolina Stralau 1901": "STR",
    "SV Empor Berlin II": "EMP",
    "SV Stern Britz 1889": "BRI",
    "VfB Concordia Britz 1916": "CON"
};

function replaceTeamNames(data, columns) {
    return data.map(row => {
        columns.forEach(column => {
            if (row[column] && teamNameMapping[row[column]]) {
                row[column] = teamNameMapping[row[column]];
            }
        });
        return row;
    });
}
