const csvFilePath = 'https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/player_data.csv';
let playersData = [];
const formations = {
    "4-4-2": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "RM", x: "74%", y: "55%" },
        { position: "ZM", x: "54%", y: "55%" },
        { position: "ZM", x: "34%", y: "55%" },
        { position: "LM", x: "14%", y: "55%" },
        { position: "ST", x: "54%", y: "40%" },
        { position: "ST", x: "34%", y: "40%" }
    ],
    "4-2-3-1": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "ZM", x: "54%", y: "55%" },
        { position: "ZM", x: "34%", y: "55%" },
        { position: "RM", x: "74%", y: "45%" },
        { position: "ZM", x: "44%", y: "45%" },
        { position: "LM", x: "14%", y: "45%" },
        { position: "ST", x: "44%", y: "35%" }
    ],
    "4-2-2-2": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "RM", x: "74%", y: "45%" },
        { position: "ZM", x: "54%", y: "58%" },
        { position: "ZM", x: "34%", y: "58%" },
        { position: "LM", x: "14%", y: "45%" },
        { position: "ST", x: "54%", y: "40%" },
        { position: "ST", x: "34%", y: "40%" }
    ],
    "4-4-1-1": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "RM", x: "74%", y: "55%" },
        { position: "ZM", x: "54%", y: "55%" },
        { position: "ZM", x: "34%", y: "55%" },
        { position: "LM", x: "14%", y: "55%" },
        { position: "ST", x: "44%", y: "40%" },
        { position: "ST", x: "44%", y: "30%" }
    ],
    "4-3-3": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "ZM", x: "69%", y: "55%" },
        { position: "ZM", x: "44%", y: "55%" },
        { position: "ZM", x: "39%", y: "55%" },
        { position: "RM", x: "69%", y: "40%" },
        { position: "ST", x: "44%", y: "40%" },
        { position: "LM", x: "39%", y: "40%" }
    ],
    "4-1-4-1": [
        { position: "TW", x: "44%", y: "85%" },
        { position: "RV", x: "74%", y: "70%" },
        { position: "IV", x: "54%", y: "70%" },
        { position: "IV", x: "34%", y: "70%" },
        { position: "LV", x: "14%", y: "70%" },
        { position: "ZM", x: "44%", y: "55%" },
        { position: "RM", x: "74%", y: "40%" },
        { position: "ZM", x: "54%", y: "40%" },
        { position: "ZM", x: "34%", y: "40%" },
        { position: "LM", x: "14%", y: "40%" },
        { position: "ST", x: "44%", y: "30%" }
    ]
};

Papa.parse(csvFilePath, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        playersData = results.data;
        populateTeamDropdown();
        updateTable();
    },
    error: function(err) {
        console.error('Error loading CSV:', err);
    }
});

function populateTeamDropdown() {
    const teamSelect = document.getElementById('teamSelect');
    teamSelect.innerHTML = '<option value="">Select Team</option>';
    const teams = [...new Set(playersData.map(player => player.Team).filter(Boolean))];
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });
}

function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear table rows
    const footballField = document.getElementById('footballFieldContainer');

    // Remove only existing player circles, not the SVG
    footballField.querySelectorAll('.player-circle').forEach(circle => circle.remove());

    // Dynamically get the selected formation
    const selectedFormation = document.getElementById('formationSelect').value;
    const formation = formations[selectedFormation];
    if (!formation) {
        console.error("Formation not found:", selectedFormation);
        return;
    }

    const selectedTeam = document.getElementById('teamSelect').value;
    const teamPlayers = playersData.filter(player => player.Team === selectedTeam).sort((a, b) => a.Nummer - b.Nummer);

    formation.forEach((entry, index) => {
        const row = document.createElement('tr');
        const dropdownCell = document.createElement('td');
        const dropdown = document.createElement('select');
        dropdown.className = 'dropdown';
        const defaultOption = document.createElement('option');
        defaultOption.text = "#";
        defaultOption.value = "";
        dropdown.appendChild(defaultOption);
        teamPlayers.forEach(player => {
            const option = document.createElement('option');
            option.text = player.Nummer || "N/A";
            option.value = player.Nummer;
            dropdown.appendChild(option);
        });
        dropdownCell.appendChild(dropdown);
        row.appendChild(dropdownCell);
        const positionCell = document.createElement('td');
        positionCell.textContent = entry.position; // Update dynamically based on formation
        row.appendChild(positionCell);
        const nameCell = document.createElement('td');
        nameCell.textContent = '';
        row.appendChild(nameCell);
        const scoreCell = document.createElement('td');
        scoreCell.textContent = '';
        row.appendChild(scoreCell);
        tableBody.appendChild(row);
        const circle = document.createElement('div');
        circle.className = 'player-circle';
        circle.style.position = 'absolute';
        circle.style.width = '12%';
        circle.style.height = '8%';
        circle.style.borderRadius = '50%';
        circle.style.color = 'white';
        circle.style.textAlign = 'center';
        circle.style.display = 'flex';
        circle.style.justifyContent = 'center';
        circle.style.alignItems = 'center';
        circle.style.fontSize = '1.2rem';
        circle.style.fontWeight = 'bold';
        circle.style.top = entry.y;
        circle.style.left = entry.x;
        circle.style.backgroundColor = 'gray';
        dropdown.onchange = () => updatePlayerInfo(dropdown, nameCell, scoreCell, circle, selectedTeam);
        footballField.appendChild(circle);
    });
}

function updatePlayerInfo(dropdown, nameCell, scoreCell, circle, selectedTeam) {
    const selectedNumber = dropdown.value;
    const player = playersData.find(p => p.Nummer === selectedNumber && p.Team === selectedTeam);
    if (player) {
        nameCell.textContent = player.Name.split(' ').pop();
        scoreCell.textContent = player.weighted_score;
        circle.textContent = selectedNumber;
        const score = player.weighted_score;
        const red = Math.round(255 * (1 - score));
        const green = Math.round(255 * score);
        circle.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
    } else {
        nameCell.textContent = '';
        scoreCell.textContent = '';
        circle.textContent = '';
        circle.style.backgroundColor = 'gray';
    }
}