const csvFilePath = 'https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H1/Routput/player_data_H1.csv';
let playersData = [];

// CSV-Daten laden und parsen
Papa.parse(csvFilePath, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        if (results.errors.length) {
            console.error('Parsing-Fehler:', results.errors);
            alert('Fehler beim Laden der Daten. Bitte überprüfen Sie die Datei.');
        } else {
            playersData = results.data;
            console.log('Erfolgreich geladen:', playersData);
            populateTeamDropdown();
        }
    },
    error: function(err) {
        console.error('PapaParse-Fehler:', err);
        alert('Fehler beim Laden der CSV-Datei: ' + err.message);
    }
});

// Team-Dropdown mit Teams füllen
function populateTeamDropdown() {
    const teams = [...new Set(playersData.map(player => player.Team).filter(Boolean))]; // Einzigartige Teams
    const teamSelect = document.getElementById('teamSelect');
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });
}

// Spieler-Dropdown basierend auf ausgewähltem Team aktualisieren
function updatePlayerDropdown() {
    const selectedTeam = document.getElementById('teamSelect').value;
    const playerSelect = document.getElementById('playerSelect');
    playerSelect.innerHTML = '<option value="">Wähle einen Spieler</option>';
    if (selectedTeam) {
        const players = playersData.filter(player => player.Team === selectedTeam).map(player => player.Name);
        players.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            playerSelect.appendChild(option);
        });
    }
}

// Spieler suchen und Eigenschaften anzeigen
function searchPlayer() {
    const selectedPlayer = document.getElementById('playerSelect').value;
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Alte Ergebnisse löschen
    if (selectedPlayer) {
        const player = playersData.find(p => p.Name === selectedPlayer);
        if (player) {
            resultDiv.innerHTML = `
    <div style="text-align: center; font-family: "Inconsolata", sans-serif; margin: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 10px;">
        <!-- Nummer in groß -->
        <h1 style="font-size: 3rem; margin: 0;">#${player.Nummer || 0}</h1>
        <!-- Pos in kleinerer Schrift -->
        <p style="font-size: 0.8rem; color: gray; margin: 5px 0;">${player.Team || "Nicht verfügbar"}</p>
        <!-- Name und Position in einer Zeile -->
        <h2 style="font-size: 2rem; margin: 5px 0;">${player.Name || "Nicht verfügbar"}</h2>
        <!-- Team in kleinerer Schrift -->
        <p style="font-size: 1.3rem; color: gray; margin: 5px 0;">${player.most_position || "n/a"}</p>
        <!-- Score mit konditionaler Hintergrundfarbe -->
        <div style="
            font-size: 1.5rem;
            margin: 5px 0;
            padding: 5px 10px; /* Einstellbares Padding */
            border-radius: 10px;
            display: inline-block; /* Passt die Breite an den Inhalt an */
            background-color: hsl(${(120 * player.weighted_score).toFixed(0)}, 100%, 50%);
            color: white;
        ">
            ${(player.weighted_score * 100).toFixed(0)}
        </div>
        <!-- Spiele und Spielzeit in einer Zeile -->
        <p style="font-size: 1rem; margin: 5px 0;">
            Spiele: ${player.Spiele || 0} 
        </p>
        <p style="font-size: 1rem; margin: 5px 0;">&nbsp; 
            <span style="color: green;">&#9650; ${player.Einwechslung || 0}</span> &nbsp;|&nbsp;
            <span style="color: red;">&#9660; ${player.Auswechslung || 0}</span>
        </p>
        <!-- Einwechslung und Auswechslung mit Dreiecken -->
        <p style="font-size: 1rem; margin: 5px 0;">
            Spielzeit: ${player.Spielzeit || 0} [min]
        </p>
        <!-- Tore -->
        <p style="font-size: 1rem; margin: 5px 0;">
            Tore: ${player.Tore || 0} &nbsp;|&nbsp; Assists: ${player.Assists || 0}
        </p>
    </div>
`;
        } else {
            resultDiv.innerHTML = '<p>Spieler nicht gefunden.</p>';
        }
    } else {
        resultDiv.innerHTML = '<p>Bitte wähle einen Spieler aus.</p>';
    }
}

// Tabbed Menu
function openMenu(evt, menuName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("menu");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" w3-dark-grey", "");
    }
    document.getElementById(menuName).style.display = "block";
    evt.currentTarget.firstElementChild.className += " w3-dark-grey";
}
document.getElementById("myLink").click();
