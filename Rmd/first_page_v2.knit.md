---
title: first
output: html_document
---
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/Users/mkreuschnervsp/git/berlinersc-football-analysis.github.io/styles/third_page.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inconsolata">
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
<style>
h1.title { 
    display: none;  /* Titel verstecken */
}
body, html {
  height: 100%;
  font-family: "Inconsolata", sans-serif;
}
select, button {
    margin: 10px 0;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    max-width: 400px;
}

button {
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}

#result {
    margin-top: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    color: #333;
    border-radius: 5px;
    text-align: left;
    max-width: 400px;
    margin: 20px auto;
}

/* Ensure the navigation bar spans the full width of the screen */
#navbar {
  width: 100%; /* Make it span the full width */
  position: fixed; /* Keep it fixed at the top */
  top: 0;
  left: 0;
  z-index: 1000; /* Ensure it's above other elements */
  background-color: #000; /* Black background */
  font-size: 1.5rem;
}

/* Make the nav buttons also fill their columns properly */
.w3-row .w3-button {
  width: 100%;
  text-align: center;
  padding: 10px 0;
  color: white;
  text-decoration: none;
}

.w3-row .w3-button:hover {
  background-color: #333; /* Lighter shade for hover effect */
}

/* Ensure the content below starts after the navbar */
body {
  margin-top: 60px; /* Adjust based on navbar height */
}

/* General styling for the rest of the content */
.w3-content {
  margin-top: 20px;
  padding: 10px;
}

#statsTable {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

#statsTable th, #statsTable td {
    border: 1px solid #ccc;
    padding: 10px;
    text-align: left;
}

#statsTable th {
    background: #f4f4f4;
}
#about {
justify-content: center; /* Zentriert horizontal */
text-align: center; /* Horizontales Zentrieren */
}

#showStats {
    background-color: #000;
    color: white;
    font-size: 1.5rem;
}
#table-container {
            margin-top: 20px;
            padding: 20px;
            background-color: #f9f9f9;
            color: #333;
            border-radius: 5px;
            text-align: left;
            max-width: 700px;
            margin: 20px auto;
}
table {
    width: 100%;
    border-collapse: collapse;
}
table th, table td {
    border: 1px solid #ddd;
    padding: 8px;
}
table th {
    background-color: #f2f2f2;
    text-align: left;
}
</style>
</head>
<body>

<!-- Links (sit on top) -->
<div class="w3-top">
<div class="w3-row w3-padding w3-black">
<div class="navbar" id="navbar">
<div class="w3-col s3">
<a href="index.html" class="w3-button w3-block w3-black">TABELLEN</a>
</div>
<div class="w3-col s3">
<a href="teams.html" class="w3-button w3-block w3-black">TEAMS</a>
</div>
<div class="w3-col s3">
<a href="spieler.html" class="w3-button w3-block w3-black">PLAYER</a>
</div>
<div class="w3-col s3">
<a href="real11.html" class="w3-button w3-block w3-black">REAL11</a>
</div>
</div>
</div>
</div>

<!-- Add a background color and large text to the whole page -->
<div class="w3-sand w3-grayscale w3-large">

<div class="container">
<!-- Dropdown zur Auswahl der Spieltage -->
<div class="w3-container" id="about">
<div class="w3-content" style="max-width:700px">
<h5 class="w3-center w3-padding-64"><span class="w3-tag w3-wide">Spieltag</span></h5>
<div>
<select id="tableSelect">
<option value="">-- Spieltag auswählen --</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/gesamttabelle.csv">Letzter Spieltag</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/formtabelle.csv">Nächster Spieltag</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/heimtabelle.csv">Beliebig</option>
</select>
<!-- Container für die Spieltage -->
<div id="table-container">
<table id="dataTable"></table>
</div>
</div>
</div>
</div>
</div>
</div>

<div class="container">
<!-- Dropdown zur Auswahl der Tabelle -->
<div class="w3-container" id="about">
<div class="w3-content" style="max-width:700px">
<h5 class="w3-center w3-padding-64"><span class="w3-tag w3-wide">TABELLEN</span></h5>
<div>
<select id="tableSelect">
<option value="">-- Tabelle auswählen --</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/gesamttabelle.csv">Gesamttabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/formtabelle.csv">Formtabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/heimtabelle.csv">Heimtabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/auswaertstabelle.csv">Auswärtstabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/rasentabelle.csv">Rasentabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/kunstrasentabelle.csv">Kunstrasentabelle</option>
<option value="https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/kleinkunstrasentabelle.csv">kleiner-Platz-Tabelle</option>
</select>
<!-- Container für die Tabelle -->
<div id="table-container">
<table id="dataTable"></table>
</div>
</div>
</div>
</div>
</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.0.1/chart.umd.min.js"></script>
<script>
// Tabellen-Container und Dropdown-Feld
const tableSelect = document.getElementById("tableSelect");
const tableContainer = document.getElementById("dataTable");
// Event Listener für Dropdown-Änderungen
tableSelect.addEventListener("change", function() {
    const selectedTable = tableSelect.value;
    if (selectedTable) {
        // CSV-Datei laden und anzeigen
        loadCSV(selectedTable);
    } else {
        // Tabelle zurücksetzen
        tableContainer.innerHTML = "";
    }
});
// Funktion zum Laden und Anzeigen der CSV-Datei
function loadCSV(filePath) {
    Papa.parse(filePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            displayTable(results.data);
        },
        error: function(error) {
            console.error("Fehler beim Laden der CSV-Datei:", error);
            tableContainer.innerHTML = "<p>Fehler beim Laden der Tabelle.</p>";
        }
    });
}
// Funktion zum Erstellen der HTML-Tabelle aus CSV-Daten
function displayTable(data) {
    if (data.length === 0) {
        tableContainer.innerHTML = "<p>Keine Daten verfügbar.</p>";
        return;
    }
    let html = "<thead><tr>";
    Object.keys(data[0]).forEach(key => {
        html += `<th>${key}</th>`;
    });
    html += "</tr></thead><tbody>";
    data.forEach(row => {
        html += "<tr>";
        Object.values(row).forEach(value => {
            html += `<td>${value}</td>`;
        });
        html += "</tr>";
    });
    html += "</tbody>";
    tableContainer.innerHTML = html;
}
</script>
</body>
</html>
