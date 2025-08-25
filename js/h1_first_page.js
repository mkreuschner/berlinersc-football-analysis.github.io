document.addEventListener("DOMContentLoaded", () => {
  // --- DOM refs ---
  const matchdaySelect   = document.getElementById("matchdaySelect");
  const matchdayContainer= document.getElementById("dataMatchday");
  const tableSelect      = document.getElementById("tableSelect");
  const tableContainer   = document.getElementById("table-container");
  const prevButton       = document.getElementById("prevMatchday");
  const nextButton       = document.getElementById("nextMatchday");

  let matchdaysData = [];
  let currentMatchday = 1;

  // --- Logos / Namen ---
  const LOGO_BASE = "images/logo/h1/"; // relativ zur HTML-Datei

  // Voller → kurzer Teamname (wie in deinen Tabellen)
  const teamNameMapping = {
    "Berliner SC": "BSC",
    "SV Empor Berlin": "Empor",
    "VSG Altglienicke II": "Altglienicke",
    "TSV Rudow Berlin": "Rudow",
    "VfB Fortuna Biesdorf": "Biesdorf",
    "Frohnauer SC": "Frohnau",
    "Füchse Berlin": "Füchse",
    "TSV Mariendorf 1897": "Mariendorf",
    "SV BW Hohen Neuendorf": "Neuendorf",
    "Polar Pinguin Berlin": "Polar",
    "SC Charlottenburg": "SCC",
    "FSV Spandauer Kickers": "Spaki",
    "SC Staaken 1919": "Staaken",
    "SFC Stern 1900": "Stern 1900",
    "SSC Südwest 1947": "Südwest",
    "Berlin Türkspor": "Türkspor",
    "1. FC Wilmersdorf": "Wilmersdorf",
    "Sp.Vg. Blau Weiß 1890 Berlin": "Blau-Weiß"
  };

  // Kurzname → Dateiname (nur Sonderfälle nötig)
  const logoMap = {
    "BSC": "bsc.jpg",
    "Empor": "empor.jpg",
    "Altglienicke": "altglienicke.jpg",
    "Rudow": "rudow.jpg",
    "Biesdorf": "biesdorf.jpg",
    "Frohnau": "frohnau.jpg",
    "Füchse": "fuechse.jpg",
    "Mariendorf": "mariendorf.jpg",
    "Neuendorf": "neuendorf.jpg",
    "Polar": "polarpinguin.jpg",
    "SCC": "scc.jpg",
    "Spaki": "spaki.jpg",
    "Staaken": "staaken.jpg",
    "Stern 1900": "stern1900.jpg",
    "Südwest": "suedwest.jpg",
    "Türkspor": "tuerkspor.jpg",
    "Wilmersdorf": "wilmersdorf.jpg",
    "Blau-Weiß": "blauweiss90.jpg"
  };

  const normalizeTeamName = (name) => teamNameMapping[name] || name;

  const slugifyTeamName = (name) =>
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ä/gi,'ae').replace(/ö/gi,'oe').replace(/ü/gi,'ue').replace(/ß/g,'ss')
        .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  function logoUrlFor(nameRaw){
    const short = normalizeTeamName(nameRaw);
    if (logoMap[short]) return LOGO_BASE + logoMap[short];
    return LOGO_BASE + slugifyTeamName(short) + ".jpg"; // Fallback
  }

  function renderTeamCell(nameRaw){
    const short = normalizeTeamName(nameRaw);
    const safe  = escapeHtml(short);
    const firstSrc = logoUrlFor(short);
    // jpg⇄png Fallback
    return `<span class="team-cell">
      <img class="team-logo" src="${firstSrc}" alt="${safe} Logo"
           onerror="
             if (!this.dataset.tried && this.src.endsWith('.jpg')) { this.dataset.tried='png'; this.src=this.src.slice(0,-4)+'.png'; }
             else if (this.dataset.tried==='png' && this.src.endsWith('.png')) { this.style.display='none'; }
             else { this.style.display='none'; }
           ">
      <span>${safe}</span>
    </span>`;
  }

  // Tabellen: Vollnamen in Kurzformen wandeln (damit Map/Logos passen)
  function replaceTeamNames(data, teamColumn) {
    return data.map(row => {
      if (row[teamColumn]) row[teamColumn] = normalizeTeamName(row[teamColumn]);
      return row;
    });
  }

  // --- CSV laden (Spieltag) ---
  Papa.parse("https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H1/Routput/match_results_and_probabilities_H1.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (!results.data || results.data.length === 0) {
        matchdayContainer.innerHTML = "<p>Keine Daten verfügbar.</p>";
        return;
      }
      matchdaysData = results.data.filter(row =>
        row["matchday"] && row["H"] && row["A"] && ("Tore_H" in row) && ("Tore_A" in row)
      );
      if (matchdaysData.length === 0) {
        matchdayContainer.innerHTML = "<p>Keine gültigen Daten verfügbar.</p>";
        return;
      }
      populateMatchdayDropdown(matchdaysData);
      displayMatchday(currentMatchday);
    },
    error: (error) => {
      console.error("Fehler beim Laden der Spieltagsdaten:", error);
    }
  });

  function populateMatchdayDropdown(data) {
    const uniqueMatchdays = [...new Set(data.map(row => parseInt(row["matchday"])))]
      .sort((a,b) => a-b);
    uniqueMatchdays.forEach(md => {
      const option = document.createElement("option");
      option.value = md;
      option.textContent = `Spieltag ${md}`;
      matchdaySelect.appendChild(option);
    });
    matchdaySelect.value = currentMatchday;
  }

  function displayMatchday(matchday) {
    const filteredData = matchdaysData.filter(row => parseInt(row["matchday"]) === matchday);
    if (filteredData.length === 0) {
      matchdayContainer.innerHTML = "<p style='text-align:center;'>Keine Spiele für diesen Spieltag verfügbar.</p>";
      return;
    }

    let html = `<div style="display:flex;flex-direction:column;gap:0.3rem;margin-top:0.3rem;max-width:400px;
                            align-items:center;justify-content:center;margin-left:auto;margin-right:auto;">`;

    filteredData.forEach(row => {
      const homeTeam = renderTeamCell(row["home_team"] || row["H"] || "Unbekannt");
      const awayTeam = renderTeamCell(row["away_team"] || row["A"] || "Unbekannt");
      const homeGoals = row["goals_home"] || row["Tore_H"];
      const awayGoals = row["goals_away"] || row["Tore_A"];
      const isPlayed = homeGoals !== undefined && awayGoals !== undefined &&
                       homeGoals !== "" && awayGoals !== "" &&
                       homeGoals !== "NA" && awayGoals !== "NA";

      html += `<div style="font-size:.9rem;border:1px solid #ddd;border-radius:.2rem;padding:.4rem;background-color:#fdfdfd;box-shadow:1px 1px 3px rgba(0,0,0,.05);width:100%;">`;

      if (isPlayed) {
        html += `
          <div style="padding:.4rem;border:1px solid #ddd;border-radius:.3rem;background-color:#f8f8f8;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;">
              <div>${homeTeam}</div><span>${escapeHtml(homeGoals)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>${awayTeam}</div><span>${escapeHtml(awayGoals)}</span>
            </div>
          </div>`;
      } else {
        const probHome = Math.round((parseFloat(row["prob_home_win"]) || 0) * 100);
        const probDraw = Math.round((parseFloat(row["prob_draw"]) || 0) * 100);
        const probAway = Math.round((parseFloat(row["prob_away_win"]) || 0) * 100);

        html += `
          <div style="padding:.4rem;border:1px solid #ddd;border-radius:.3rem;background-color:#f9f9f9;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
              <div>${homeTeam}</div><span>${probHome}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem;">
              <span style="font-style:italic;">Unentschieden</span><span>${probDraw}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>${awayTeam}</div><span>${probAway}%</span>
            </div>
          </div>`;
      }
      html += `</div>`;
    });

    html += `</div>`;
    matchdayContainer.innerHTML = html;
  }

  // --- Navigation Spieltag ---
  prevButton.addEventListener("click", () => {
    const minMd = Math.min(...matchdaysData.map(row => parseInt(row["matchday"])));
    if (currentMatchday > minMd) {
      currentMatchday--;
      displayMatchday(currentMatchday);
      matchdaySelect.value = currentMatchday;
    }
  });

  nextButton.addEventListener("click", () => {
    const maxMd = Math.max(...matchdaysData.map(row => parseInt(row["matchday"])));
    if (currentMatchday < maxMd) {
      currentMatchday++;
      displayMatchday(currentMatchday);
      matchdaySelect.value = currentMatchday;
    }
  });

  matchdaySelect.addEventListener("change", () => {
    const selected = parseInt(matchdaySelect.value);
    if (!isNaN(selected)) {
      currentMatchday = selected;
      displayMatchday(currentMatchday);
    }
  });

  // --- Tabellen ---
  tableSelect.addEventListener("change", function () {
    const opt = this.options[this.selectedIndex];
    const filePath = opt.value;
    const columns = (opt.getAttribute("data-columns") || "").split(",").map(s => s.trim()).filter(Boolean);
    const specialFormat = opt.getAttribute("data-special");

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
      complete: (results) => {
        let data = results.data;
        data = replaceTeamNames(data, "team");   // Kurzformen
        displayFilteredTable(data, container, columnsToShow);
      },
      error: (error) => {
        console.error("Fehler beim Laden der CSV-Datei:", error);
        container.innerHTML = `<p style="text-align:center;">Fehler beim Laden der Tabellendaten.</p>`;
      }
    });
  }

  function loadTableCSVWithSpecialFormatting(filePath, columnsToShow, container) {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let data = results.data.map(row => {
          const filteredRow = {};
          columnsToShow.forEach(column => {
            filteredRow[column] = row[column] || "-";
          });
          return filteredRow;
        });
        data = replaceTeamNames(data, "team");   // Kurzformen
        displayFormattedTable(data, container);
      },
      error: (error) => {
        console.error("Fehler beim Laden der Formtabelle:", error);
        container.innerHTML = `<p style="text-align:center;">Fehler beim Laden der Formtabelle.</p>`;
      }
    });
  }

  function displayFormattedTable(data, container) {
    if (data.length === 0) {
      container.innerHTML = `<p style="text-align:center;">Keine Daten verfügbar.</p>`;
      return;
    }

    const formWeights = { E5:1, E4:2, E3:3, E2:4, E1:5 };
    const points = { S:3, U:1, N:0 };

    let html = `
<div style="border:1px solid #ddd;border-radius:.5rem;padding:1rem;background-color:#f9f9f9;box-shadow:1px 1px 4px rgba(0,0,0,.1);max-width:500px;margin:1rem auto;display:flex;flex-direction:column;">
  <table style="width:100%;border-collapse:collapse;font-size:.9rem;table-layout:fixed;">
    <colgroup>
      <col style="width:10%"><col style="width:auto"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:10%">
    </colgroup>
    <thead style="background-color:#f4f4f4;"><tr>`;

    Object.keys(data[0]).forEach((key, idx) => {
      const alignStyle = (key.toLowerCase() === "team" || idx === 1) ? "text-align:left;" : "text-align:center;";
      html += `<th style="padding:.5rem;${alignStyle}border-bottom:1px solid #ddd;">${escapeHtml(key)}</th>`;
    });
    html += `<th style="padding:.5rem;text-align:center;border-bottom:1px solid #ddd;">Formwert</th></tr></thead><tbody>`;

    data.forEach(row => {
      html += `<tr style="border-bottom:1px solid #ddd;">`;

      let totalScore = 0, totalWeight = 0;

      Object.entries(row).forEach(([key, value], idx) => {
        let style = "padding:.5rem;white-space:nowrap;";
        const isTeam = key.toLowerCase() === "team" || idx === 1;

        if (isTeam) {
          style += "text-align:left;font-weight:bold;width:auto;overflow:hidden;text-overflow:ellipsis;";
          html += `<td style="${style}">${renderTeamCell(String(value))}</td>`;
        } else {
          style += "text-align:center;";

          // Farbzuweisung + Formwertung nur auf E5..E1
          if (["S","U","N"].includes(String(value))) {
            if (value === "S") style += "background-color:#d4edda;color:#155724;";
            else if (value === "U") style += "background-color:#fff3cd;color:#856404;";
            else if (value === "N") style += "background-color:#f8d7da;color:#721c24;";
            if (formWeights[key] !== undefined) {
              totalScore += points[value] * formWeights[key];
              totalWeight += formWeights[key];
            }
          }

          html += `<td style="${style}">${escapeHtml(String(value))}</td>`;
        }
      });

      const weightedScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : "0.0";
      html += `<td style="padding:.5rem;text-align:center;font-weight:bold;">${weightedScore}</td></tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  function displayFilteredTable(data, container, columnsToShow) {
    if (data.length === 0) {
      container.innerHTML = `<p style="text-align:center;">Keine Daten verfügbar.</p>`;
      return;
    }

    const filteredData = data.map(row => {
      const obj = {};
      columnsToShow.forEach(col => { obj[col] = row[col] || "-"; });
      return obj;
    });

    let html = `
<div style="border:1px solid #ddd;border-radius:.5rem;padding:1rem;background-color:#f9f9f9;box-shadow:1px 1px 4px rgba(0,0,0,.1);max-width:500px;margin:1rem auto;display:flex;flex-direction:column;">
  <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
    <colgroup>
      <col style="width:5%"><col style="width:auto"><col style="width:5%"><col style="width:10%"><col style="width:10%"><col style="width:10%">
    </colgroup>
    <thead style="background-color:#f4f4f4;"><tr>`;

    columnsToShow.forEach((column, idx) => {
      const alignStyle = (column.toLowerCase() === "team" || idx === 1) ? "text-align:left;" : "text-align:center;";
      html += `<th style="padding:.5rem;${alignStyle}border-bottom:1px solid #ddd;">${escapeHtml(column)}</th>`;
    });

    html += `</tr></thead><tbody>`;

    filteredData.forEach(row => {
      html += `<tr style="border-bottom:1px solid #ddd;">`;

      Object.entries(row).forEach(([key, value], idx) => {
        let style = "padding:.5rem;";
        const isTeam = key.toLowerCase() === "team" || idx === 1;

        if (isTeam) {
          style += "text-align:left;font-weight:bold;width:auto;overflow:hidden;text-overflow:ellipsis;";
          html += `<td style="${style}">${renderTeamCell(String(value))}</td>`;
        } else {
          style += "text-align:center;";
          html += `<td style="${style}">${escapeHtml(String(value))}</td>`;
        }
      });

      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }
});
