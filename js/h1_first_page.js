'use strict';

// ==============================
//  H1 – Frontend Logic (Final)
// ==============================
// Tabs:
//  - Spieltag: startet beim zuletzt GESPIELTEN Spieltag
//  - Tabellen: zentrierter Block, Spalten linksbündig, schwarzer Header
//  - Torjäger & Beste Spieler: Top-20, gewünschte Spaltenreihenfolge, Team-Logos,
//    schwarzer Header, und HORIZONTAL SCROLLBAR falls zu breit
// Voraussetzung: PapaParse (Papa) ist im HTML eingebunden.

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM refs ---
  const matchdaySelect     = document.getElementById('matchdaySelect');
  const matchdayContainer  = document.getElementById('dataMatchday');
  const prevButton         = document.getElementById('prevMatchday');
  const nextButton         = document.getElementById('nextMatchday');

  const tabellenSelect     = document.getElementById('tableSelect-tabellen');
  const tabellenContainer  = document.getElementById('table-container-tabellen');

  const scorerSelect       = document.getElementById('tableSelect-scorer');
  const scorerContainer    = document.getElementById('table-container-scorer');

  const playerSelect       = document.getElementById('tableSelect-player');
  const playerContainer    = document.getElementById('table-container-player');

  // --- Data state ---
  let matchdaysData = [];
  let currentMatchday = 1;

  // ==============================
  //  Logos / Teamnamen
  // ==============================
  const LOGO_BASE = 'images/logo/h1/';

  // Voller → kurzer Teamname
  const teamNameMapping = {
    'Berliner SC': 'BSC',
    'SV Empor Berlin': 'Empor',
    'VSG Altglienicke II': 'Altglienicke',
    'TSV Rudow Berlin': 'Rudow',
    'VfB Fortuna Biesdorf': 'Biesdorf',
    'Frohnauer SC': 'Frohnau',
    'Füchse Berlin': 'Füchse',
    'TSV Mariendorf 1897': 'Mariendorf',
    'SV BW Hohen Neuendorf': 'Neuendorf',
    'Polar Pinguin Berlin': 'Polar',
    'SC Charlottenburg': 'SCC',
    'FSV Spandauer Kickers': 'Spaki',
    'SC Staaken': 'Staaken',
    'SFC Stern 1900': 'Stern 1900',
    'SSC Südwest 1947': 'Südwest',
    'Berlin Türkspor': 'Türkspor',
    '1. FC Wilmersdorf': 'Wilmersdorf',
    'Sp.Vg. Blau Weiß 1890 Berlin': 'Blau-Weiß'
  };

  // Kurzname → Logo-Datei (nur Sonderfälle nötig)
  const logoMap = {
    'BSC': 'bsc.jpg',
    'Empor': 'empor.jpg',
    'Altglienicke': 'altglienicke.jpg',
    'Rudow': 'rudow.jpg',
    'Biesdorf': 'biesdorf.jpg',
    'Frohnau': 'frohnau.jpg',
    'Füchse': 'fuechse.jpg',
    'Mariendorf': 'mariendorf.jpg',
    'Neuendorf': 'neuendorf.jpg',
    'Polar': 'polarpinguin.jpg',
    'SCC': 'scc.jpg',
    'Spaki': 'spaki.jpg',
    'Staaken': 'staaken.jpg',
    'Stern 1900': 'stern1900.jpg',
    'Südwest': 'suedwest.jpg',
    'Türkspor': 'tuerkspor.jpg',
    'Wilmersdorf': 'wilmersdorf.jpg',
    'Blau-Weiß': 'blauweiss90.jpg'
  };

  const normalizeTeamName = (name) => teamNameMapping[name] || name;
  const slugifyTeamName = (name) => name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);

  function logoUrlFor(nameRaw) {
    const short = normalizeTeamName(nameRaw);
    if (logoMap[short]) return LOGO_BASE + logoMap[short];
    return LOGO_BASE + slugifyTeamName(short) + '.jpg';
  }

  function renderTeamCell(nameRaw) {
    const short = normalizeTeamName(nameRaw);
    const safe = escapeHtml(short);
    const firstSrc = logoUrlFor(short);
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

  function replaceTeamNames(data, teamColumn) {
    return data.map((row) => {
      if (row && row[teamColumn]) row[teamColumn] = normalizeTeamName(row[teamColumn]);
      return row;
    });
  }

  // ==============================
  //  CSV Loader (mit Cache)
  // ==============================
  const csvCache = new Map(); // url -> Promise(data[])
  function loadCSV(url) {
    if (!url) return Promise.resolve([]);
    if (csvCache.has(url)) return csvCache.get(url);
    const p = new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = (res.data || []).filter((r) => r && Object.keys(r).length);
          resolve(data);
        },
        error: (err) => reject(err)
      });
    });
    csvCache.set(url, p);
    return p;
  }

  // ==============================
  //  Utilities
  // ==============================
  function parseNumber(x) {
    if (x === null || x === undefined) return 0;
    const v = String(x).replace(',', '.').replace(/\s/g, '');
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  function findKeyCaseInsensitive(obj, name) {
    const lower = String(name).toLowerCase();
    return Object.keys(obj).find((k) => k.toLowerCase() === lower) || null;
  }

  function pickExistingKey(obj, candidatesArr) {
    if (!obj) return null;
    for (const c of candidatesArr) {
      const k = findKeyCaseInsensitive(obj, c);
      if (k) return k;
    }
    return null;
  }

  function isPlayedRow(row) {
    const h = row['goals_home'] ?? row['Tore_H'];
    const a = row['goals_away'] ?? row['Tore_A'];
    return h !== undefined && a !== undefined && h !== '' && a !== '' && h !== 'NA' && a !== 'NA';
  }

  // ==============================
  //  Gemeinsame Box-Wrapper für Tabellen
  // ==============================
  function tableBoxStart() {
    return (
      '<div style="display:flex;justify-content:center;">' +
        '<div style="width:min(960px,100%);margin:0 auto;border:1px solid #ddd;border-radius:.5rem;padding:1rem;background-color:#fff;box-shadow:1px 1px 4px rgba(0,0,0,.06);">' +
          '<div style="text-align:center;">'
    );
  }
  function tableBoxEnd() {
    return '</div></div></div>';
  }

  // ==============================
  //  Tabellen-Renderer (zentrierter Block, Zellen links, Header schwarz)
  // ==============================
  function displayFilteredTable(data, container, columnsToShow) {
    if (!data || !data.length) {
      container.innerHTML = '<p style="text-align:center;">Keine Daten verfügbar.</p>';
      return;
    }

    const columns = Array.isArray(columnsToShow) && columnsToShow.length
      ? columnsToShow
      : Object.keys(data[0]);

    const rows = data.map((row) => { const o = {}; columns.forEach((c) => { o[c] = row[c] ?? '-'; }); return o; });

    let html = tableBoxStart();
    html += '<table style="display:inline-table;border-collapse:collapse;font-size:.9rem;table-layout:auto;">';
    html += '<thead style="background:#000;color:#fff;"><tr>';
    columns.forEach((column) => {
      html += `<th style="padding:.5rem;text-align:left;white-space:nowrap;border-bottom:1px solid #000;">${escapeHtml(column)}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach((row) => {
      html += '<tr style="border-bottom:1px solid #eee;">';
      columns.forEach((key) => {
        let style = 'padding:.5rem;white-space:nowrap;text-align:left;';
        const raw = row[key]; const val = raw === undefined || raw === null ? '-' : String(raw);
        if (key.toLowerCase() === 'team') {
          style += 'font-weight:bold;';
          html += `<td style="${style}">${renderTeamCell(val)}</td>`;
        } else {
          html += `<td style="${style}">${escapeHtml(val)}</td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table>' + tableBoxEnd();
    container.innerHTML = html;
    // Nur für Tabellen im Tabellen-Tab einfärben
    if (container.id === 'table-container-tabellen') {
      const tableEl = container.querySelector('table');
      colorizeRanking(tableEl);
    }
  }

  // Custom-Renderer: identisch, aber mit horizontalem Scroll-Container
  function displayFilteredTableCustom(data, container, columnsToShow, opts = {}) {
    const { boldCols = [], useTeamLogos = false } = opts;
    if (!data || !data.length) {
      container.innerHTML = '<p style="text-align:center;">Keine Daten verfügbar.</p>';
      return;
    }

    const columns = Array.isArray(columnsToShow) && columnsToShow.length ? columnsToShow : Object.keys(data[0]);
    const rows = data.map((row) => { const o = {}; columns.forEach((c) => { o[c] = row[c] ?? '-'; }); return o; });

    let html = tableBoxStart();
    html += '<div style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%;">';
    html += '<table style="border-collapse:collapse;font-size:.9rem;table-layout:auto;">';
    html += '<thead style="background:#000;color:#fff;"><tr>';
    columns.forEach((column) => {
      html += `<th style="padding:.5rem;text-align:left;white-space:nowrap;border-bottom:1px solid #000;">${escapeHtml(column)}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach((row) => {
      html += '<tr style="border-bottom:1px solid #eee;">';
      columns.forEach((key) => {
        let style = 'padding:.5rem;white-space:nowrap;text-align:left;';
        if (boldCols.includes(key)) style += 'font-weight:bold;';
        const raw = row[key]; const val = raw === undefined || raw === null ? '-' : String(raw);
        if (useTeamLogos && key.toLowerCase() === 'team') {
          html += `<td style="${style}">${renderTeamCell(val)}</td>`;
        } else {
          html += `<td style="${style}">${escapeHtml(val)}</td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>' + tableBoxEnd();
    container.innerHTML = html;
    // Nur für Tabellen im Tabellen-Tab einfärben
    if (container.id === 'table-container-tabellen') {
      const tableEl = container.querySelector('table');
      colorizeRanking(tableEl);
    }
  }

  // ==============================
  //  SPIELTAG – Logik (aktueller gespielter Spieltag)
  // ==============================
  const MATCHDAY_URL = 'https://raw.githubusercontent.com/mkreuschner/berlinersc-football-analysis.github.io/main/data/H1/Routput/match_results_and_probabilities_H1.csv';

  function initSpieltag() {
    loadCSV(MATCHDAY_URL)
      .then((rows) => {
        matchdaysData = rows.filter((row) => row['matchday'] && row['H'] && row['A']);
        if (!matchdaysData.length) {
          matchdayContainer.innerHTML = '<p>Keine gültigen Daten verfügbar.</p>';
          return;
        }
        const playedSet = new Set(
          matchdaysData.filter(isPlayedRow).map((r) => parseInt(r['matchday'], 10)).filter((n) => !isNaN(n))
        );
        if (playedSet.size > 0) {
          currentMatchday = Math.max(...Array.from(playedSet));
        } else {
          const allSet = new Set(matchdaysData.map((r) => parseInt(r['matchday'], 10)).filter((n) => !isNaN(n)));
          currentMatchday = allSet.size > 0 ? Math.min(...Array.from(allSet)) : 1;
        }
        populateMatchdayDropdown(matchdaysData);
        displayMatchday(currentMatchday);
      })
      .catch((err) => {
        console.error('Fehler beim Laden der Spieltagsdaten:', err);
        matchdayContainer.innerHTML = '<p>Fehler beim Laden der Spieltagsdaten.</p>';
      });
  }

  function populateMatchdayDropdown(data) {
    if (!matchdaySelect) return;
    matchdaySelect.innerHTML = '';

    const uniqueMatchdays = [...new Set(data.map((row) => parseInt(row['matchday'], 10)))]
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    uniqueMatchdays.forEach((md) => {
      const option = document.createElement('option');
      option.value = md;
      option.textContent = `Spieltag ${md}`;
      matchdaySelect.appendChild(option);
    });

    matchdaySelect.value = String(currentMatchday);
  }

  function displayMatchday(matchday) {
    const md = parseInt(matchday, 10);
    const filteredData = matchdaysData.filter((row) => parseInt(row['matchday'], 10) === md);

    if (!filteredData.length) {
      matchdayContainer.innerHTML = "<p style='text-align:center;'>Keine Spiele für diesen Spieltag verfügbar.</p>";
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:0.4rem;margin-top:0.5rem;max-width:560px;align-items:center;justify-content:center;margin-left:auto;margin-right:auto;">';

    filteredData.forEach((row) => {
      const homeTeam = renderTeamCell(row['home_team'] || row['H'] || 'Unbekannt');
      const awayTeam = renderTeamCell(row['away_team'] || row['A'] || 'Unbekannt');
      const homeGoals = row['goals_home'] ?? row['Tore_H'];
      const awayGoals = row['goals_away'] ?? row['Tore_A'];
      const played = isPlayedRow(row);

      html += '<div style="font-size:.95rem;border:1px solid #ddd;border-radius:.4rem;padding:.6rem;background-color:#fff;box-shadow:1px 1px 3px rgba(0,0,0,.05);width:100%;">';

      if (played) {
        html += `
          <div style="padding:.4rem;border:1px solid #eee;border-radius:.3rem;background-color:#f8f8f8;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem;">
              <div>${homeTeam}</div><span>${escapeHtml(homeGoals)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>${awayTeam}</div><span>${escapeHtml(awayGoals)}</span>
            </div>
          </div>`;
      } else {
        const probHome = Math.round(parseNumber(row['prob_home_win']) * 100);
        const probDraw = Math.round(parseNumber(row['prob_draw']) * 100);
        const probAway = Math.round(parseNumber(row['prob_away_win']) * 100);

        html += `
          <div style="padding:.4rem;border:1px solid #eee;border-radius:.3rem;background-color:#fafafa;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">
              <div>${homeTeam}</div><span>${probHome}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">
              <span style="font-style:italic;">Unentschieden</span><span>${probDraw}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>${awayTeam}</div><span>${probAway}%</span>
            </div>
          </div>`;
      }

      html += '</div>';
    });

    html += '</div>';
    matchdayContainer.innerHTML = html;
  }

  // Navigation Spieltag
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const mdNums = [...new Set(matchdaysData.map((r) => parseInt(r['matchday'], 10)))].filter((n) => !isNaN(n));
      const minMd = mdNums.length ? Math.min(...mdNums) : 1;
      if (currentMatchday > minMd) {
        currentMatchday -= 1;
        displayMatchday(currentMatchday);
        if (matchdaySelect) matchdaySelect.value = String(currentMatchday);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const mdNums = [...new Set(matchdaysData.map((r) => parseInt(r['matchday'], 10)))].filter((n) => !isNaN(n));
      const maxMd = mdNums.length ? Math.max(...mdNums) : 1;
      if (currentMatchday < maxMd) {
        currentMatchday += 1;
        displayMatchday(currentMatchday);
        if (matchdaySelect) matchdaySelect.value = String(currentMatchday);
      }
    });
  }

  if (matchdaySelect) {
    matchdaySelect.addEventListener('change', () => {
      const selected = parseInt(matchdaySelect.value, 10);
      if (!Number.isNaN(selected)) {
        currentMatchday = selected;
        displayMatchday(currentMatchday);
      }
    });
  }

  // ==============================
  //  TABELLEN – MIT Dropdown (zentrierter Block, linksbündige Spalten)
  // ==============================
  function initTabellen() {
    if (!tabellenSelect || !tabellenContainer) return;

    function loadFromSelect() {
      const opt = tabellenSelect.options[tabellenSelect.selectedIndex];
      const url     = opt?.value || '';
      const colsStr = opt?.getAttribute('data-columns') || '';
      const special = opt?.getAttribute('data-special') || '';

      if (!url) {
        tabellenContainer.innerHTML = '<p style="text-align:center;">Bitte eine Tabelle auswählen.</p>';
        return;
      }

      loadCSV(url)
        .then((data) => {
          data = replaceTeamNames(data, 'team');
          data = replaceTeamNames(data, 'Team');
          if (special === 'form') {
            displayFilteredTable(data, tabellenContainer, Object.keys(data[0] || {}));
            return;
          }
          const columns = colsStr
            ? colsStr.split(',').map((s) => s.trim()).filter(Boolean).filter((c) => c in (data[0] || {}))
            : Object.keys(data[0] || {});
          displayFilteredTable(data, tabellenContainer, columns);
        })
        .catch((err) => {
          console.error('Fehler beim Laden der Tabelle:', err);
          tabellenContainer.innerHTML = '<p style="text-align:center;">Fehler beim Laden der Tabelle.</p>';
        });
    }

    tabellenSelect.addEventListener('change', loadFromSelect);

    const firstWithUrl = Array.from(tabellenSelect.options).find((o) => o.value);
    if (firstWithUrl) {
      tabellenSelect.value = firstWithUrl.value;
      loadFromSelect();
    }
  }

  // ==============================
  //  TORJÄGER – Top 20 (Rank, Nr, Name, Team, Pos, Spiele, Scorerpoints) + Logos
  // ==============================
  function initScorerTop20() {
    if (!scorerContainer) return;

    let url = '';
    if (scorerSelect) {
      scorerSelect.style.display = 'none';
      const first = Array.from(scorerSelect.options).find((o) => o.value);
      if (first) url = first.value;
    }
    if (!url) {
      scorerContainer.innerHTML = '<p style="text-align:center;">Keine Scorer-Quelle definiert.</p>';
      return;
    }

    loadCSV(url)
      .then((data) => {
        if (!data || !data.length) {
          scorerContainer.innerHTML = '<p style="text-align:center;">Keine Daten verfügbar.</p>';
          return;
        }

        data = replaceTeamNames(data, 'team');
        data = replaceTeamNames(data, 'Team');

        const s = data[0];
        const rankKey   = pickExistingKey(s, ['Rank','Rang','#']);
        const nrKey     = pickExistingKey(s, ['Nr','No','Number']);
        const nameKey   = pickExistingKey(s, ['Name']);
        const teamKey   = pickExistingKey(s, ['Team']);
        const posKey    = pickExistingKey(s, ['Pos','Position']);
        const spieleKey = pickExistingKey(s, ['Spiele','Games','G']);
        const goalsKey  = pickExistingKey(s, ['Tore','Goals','Treffer']);
        let   scorerKey = pickExistingKey(s, ['Scorerpoints','Scorerpunkte','Score','Punkte']);
        const assistsKey= pickExistingKey(s, ['Assists','Vorlagen']);

        if (goalsKey) data.sort((a,b) => parseNumber(b[goalsKey]) - parseNumber(a[goalsKey]));

        if (!scorerKey && goalsKey && assistsKey) {
          scorerKey = 'Scorerpoints';
          data = data.map(r => ({ ...r, Scorerpoints: parseNumber(r[goalsKey]) + parseNumber(r[assistsKey]) }));
        }

        if (!rankKey) {
          data = data.map((r, i) => ({ ...r, Rank: i + 1 }));
        }

        const order = [rankKey || 'Rank', nrKey, nameKey, teamKey, posKey, spieleKey, scorerKey || 'Scorerpoints']
          .filter(Boolean);
        const rest  = Object.keys(s).filter((k) => !order.includes(k));
        const columns = [...order, ...rest];

        const top = data.slice(0, 20);
        displayFilteredTableCustom(top, scorerContainer, columns, {
          boldCols: [nameKey || 'Name'],
          useTeamLogos: true
        });
      })
      .catch((err) => {
        console.error('Fehler beim Laden der Scorer:', err);
        scorerContainer.innerHTML = '<p style="text-align:center;">Fehler beim Laden der Scorer.</p>';
      });
  }

  // ==============================
  //  BESTE SPIELER – Top 20 (Rank, Nr, Name, Team, Pos, Spiele, Scorerpoints) + Logos
  // ==============================
  function initBestPlayerTop20() {
    if (!playerContainer) return;

    let url = '';
    if (playerSelect) {
      playerSelect.style.display = 'none';
      const first = Array.from(playerSelect.options).find((o) => o.value);
      if (first) url = first.value;
    }
    if (!url) {
      playerContainer.innerHTML = '<p style="text-align:center;">Keine Player-Quelle definiert.</p>';
      return;
    }

    loadCSV(url)
      .then((data) => {
        if (!data || !data.length) {
          playerContainer.innerHTML = '<p style="text-align:center;">Keine Daten verfügbar.</p>';
          return;
        }

        data = replaceTeamNames(data, 'team');
        data = replaceTeamNames(data, 'Team');

        const s = data[0];
        const rankKey   = pickExistingKey(s, ['Rank','Rang','#']);
        const nrKey     = pickExistingKey(s, ['Nr','No','Number']);
        const nameKey   = pickExistingKey(s, ['Name']);
        const teamKey   = pickExistingKey(s, ['Team']);
        const posKey    = pickExistingKey(s, ['Pos','Position']);
        const spieleKey = pickExistingKey(s, ['Spiele','Games','G']);
        const scorePref = ['Highest Score','Score','Punkte','Rating','Scorerpoints','Scorerpunkte'];
        const scoreKey  = pickExistingKey(s, scorePref);

        if (scoreKey) data.sort((a,b) => parseNumber(b[scoreKey]) - parseNumber(a[scoreKey]));

        const displayScoreCol = 'Scorerpoints';
        data = data.map(r => ({ ...r, [displayScoreCol]: r[scoreKey] ?? r['Scorerpoints'] ?? r['Scorerpunkte'] ?? '-' }));

        if (!rankKey) {
          data = data.map((r, i) => ({ ...r, Rank: i + 1 }));
        }

        const order = [rankKey || 'Rank', nrKey, nameKey, teamKey, posKey, spieleKey, displayScoreCol]
          .filter(Boolean);
        const rest  = Object.keys(data[0]).filter((k) => !order.includes(k));
        const columns = [...order, ...rest];

        const top = data.slice(0, 20);
        displayFilteredTableCustom(top, playerContainer, columns, {
          boldCols: [nameKey || 'Name'],
          useTeamLogos: true
        });
      })
      .catch((err) => {
        console.error('Fehler beim Laden der Bestenliste:', err);
        playerContainer.innerHTML = '<p style="text-align:center;">Fehler beim Laden der Bestenliste.</p>';
      });
  }


  // --- Rang-Highlighting -------------------------------------
  function colorizeRanking(table) {
    if (!table) return;

    const tbody = table.tBodies && table.tBodies[0] ? table.tBodies[0] : table;
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => !r.querySelector('th'));
    if (!rows.length) return;

    // Vorherige Klassen entfernen
    rows.forEach(r => r.classList.remove('rank-1','rank-2','rank-bottom'));

    const n = rows.length;
    if (n >= 1) rows[0].classList.add('rank-1');   // 1. Platz

    // letzte 3
    const lastCount = Math.min(3, n);
    for (let i = n - lastCount; i < n; i++) {
      if (i >= 0) rows[i].classList.add('rank-bottom');
    }
  }


  // Bootstrapping
  initSpieltag();
  initTabellen();
  initScorerTop20();
  initBestPlayerTop20();
});