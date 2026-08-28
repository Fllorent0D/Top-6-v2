const SHEETS = {
    clubs: '1513969383',
    players: '311422638',
    matches: '1785200447',
};

const DIVISION_LABELS = {
    NAT: 'Nationale & WB', P1: 'Provinciale 1', P2: 'Provinciale 2',
    P3: 'Provinciale 3', P4: 'Provinciale 4', P5: 'Provinciale 5', P6: 'Provinciale 6',
};

const STORAGE_KEY = 'super-top6-organizer-v1';
const state = {
    clubs: [], players: [], matches: [],
    results: {}, presence: {}, currentSlotIndex: 0,
    view: 'overview', standingsDivision: 'NAT', presenceFilter: 'all',
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function parseCSV(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
            else if (char === '"') quoted = false;
            else field += char;
        } else if (char === '"') quoted = true;
        else if (char === ',') { row.push(field.trim()); field = ''; }
        else if (char === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; }
        else if (char !== '\r') field += char;
    }
    if (field || row.length) { row.push(field.trim()); rows.push(row); }
    return rows;
}

async function fetchSheet(gid) {
    const publishedId = '2PACX-1vTX2csVgYL_ZdHNx2wyx2aIAAq2klSg0uMRaxKKbikDIdsNYc7adkAmvCFezgmWNUmDR1QULJcZ-DkA';
    const candidates = [
        `/sheet?gid=${gid}`,
        `/api/sheet?gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?gid=${gid}&single=true&output=csv`,
    ];
    let lastError;
    for (const url of candidates) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            if (text.includes('<!DOCTYPE html>')) throw new Error('Réponse inattendue');
            return parseCSV(text);
        } catch (error) { lastError = error; }
    }
    throw lastError || new Error('Source inaccessible');
}

function hydrateLocalState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        state.results = saved.results || {};
        state.presence = saved.presence || {};
        state.currentSlotIndex = Number(saved.currentSlotIndex || 0);
    } catch { /* a corrupted local snapshot must not block the event */ }
}

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        results: state.results, presence: state.presence,
        currentSlotIndex: state.currentSlotIndex, savedAt: new Date().toISOString(),
    }));
}

async function loadTournament(showToast = false) {
    document.body.classList.add('is-loading');
    $('#loadingState').hidden = false;
    $('#errorState').hidden = true;
    try {
        const [clubRows, playerRows, matchRows] = await Promise.all([
            fetchSheet(SHEETS.clubs), fetchSheet(SHEETS.players), fetchSheet(SHEETS.matches),
        ]);

        state.clubs = clubRows.slice(1).filter(row => row[0]).map(row => ({ name: row[0], index: Number(row[1]) }));
        state.players = playerRows.slice(1).filter(row => row[1] && DIVISION_LABELS[row[3]]).map((row, index) => ({
            id: `p-${index + 1}`, name: row[1], club: row[2], division: row[3], sheetPresent: row[4].toUpperCase() === 'OK',
        }));
        const playerByName = Object.fromEntries(state.players.map(player => [player.name, player]));
        state.matches = matchRows.slice(2).filter(row => row[2] && DIVISION_LABELS[row[1]]).map(row => ({
            id: String(row[2]), division: row[1], number: Number(row[2]),
            playerA: row[3], playerB: row[4], referee: row[5], table: Number(row[6]),
            time: row[7], round: Number(row[8]), refereeDivision: row[9], importedScore: row[10] || '0-0',
            clubA: playerByName[row[3]]?.club || '', clubB: playerByName[row[4]]?.club || '',
        }));

        state.players.forEach(player => {
            if (!(player.name in state.presence)) state.presence[player.name] = player.sheetPresent;
        });
        await pullCentralState();
        const slots = getSlots();
        if (state.currentSlotIndex >= slots.length) state.currentSlotIndex = 0;
        renderAll();
        setSyncStatus('online', 'Planning synchronisé', `${state.matches.length} rencontres · données Google Sheets`);
        if (showToast) toast('Planning actualisé depuis Google Sheets');
    } catch (error) {
        $('#errorMessage').textContent = `${error.message}. Lancez l’application via start.sh pour utiliser le relais local.`;
        $('#errorState').hidden = false;
        setSyncStatus('error', 'Source inaccessible', 'Le planning n’a pas pu être chargé');
    } finally {
        $('#loadingState').hidden = true;
        document.body.classList.remove('is-loading');
    }
}

async function pullCentralState() {
    try {
        const response = await fetch('/api/state', { cache: 'no-store' });
        if (!response.ok) return false;
        const central = await response.json();
        state.results = { ...state.results, ...(central.results || {}) };
        state.presence = { ...state.presence, ...(central.presence || {}) };
        persist();
        return true;
    } catch { return false; }
}

async function pushCentralState(update) {
    try {
        const response = await fetch('/api/state', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return true;
    } catch {
        setSyncStatus('error', 'Sauvegarde locale', 'Le serveur central est momentanément indisponible');
        return false;
    }
}

function getSlots() { return [...new Set(state.matches.map(match => match.time))]; }
function resultFor(match) { return state.results[match.id]; }
function statusFor(match) {
    const result = resultFor(match);
    if (result?.status === 'completed') return 'completed';
    if (result?.status === 'live') return 'live';
    return 'upcoming';
}
function scoreFor(match) {
    const result = resultFor(match);
    if (result?.status !== 'completed' || !result?.sets?.length) return match.importedScore !== '0-0' ? match.importedScore : '—';
    const winsA = result.sets.filter(set => set.a > set.b).length;
    return `${winsA}–${result.sets.length - winsA}`;
}

function renderAll() {
    const divisions = Object.keys(DIVISION_LABELS).filter(code => state.matches.some(match => match.division === code));
    $('#navMatchCount').textContent = state.matches.length;
    $('#navPlayerCount').textContent = state.players.length;
    $('#divisionFilter').innerHTML = '<option value="all">Toutes les séries</option>' + divisions.map(code => `<option value="${code}">${DIVISION_LABELS[code]}</option>`).join('');
    $('#standingsTabs').innerHTML = divisions.map(code => `<button class="${code === state.standingsDivision ? 'is-active' : ''}" data-division="${code}">${code}</button>`).join('');
    renderOverview(); renderMatches(); renderPlayers(); renderStandings();
}

function renderOverview() {
    const slots = getSlots();
    const completed = state.matches.filter(match => statusFor(match) === 'completed').length;
    const present = state.players.filter(player => state.presence[player.name]).length;
    const currentTime = slots[state.currentSlotIndex] || '—';
    const currentMatches = state.matches.filter(match => match.time === currentTime);
    const live = currentMatches.filter(match => statusFor(match) === 'live').length;
    const occupied = live || currentMatches.filter(match => statusFor(match) !== 'completed').length;

    $('#completedMetric').innerHTML = `${completed} <small>/ ${state.matches.length}</small>`;
    $('#progressTrend').textContent = `${Math.round((completed / Math.max(state.matches.length, 1)) * 100)}% terminé`;
    $('#progressBar').style.width = `${(completed / Math.max(state.matches.length, 1)) * 100}%`;
    $('#presenceMetric').innerHTML = `${present} <small>/ ${state.players.length}</small>`;
    $('#presenceTrend').textContent = present === state.players.length ? 'Complet' : `${state.players.length - present} à pointer`;
    $('#tablesMetric').innerHTML = `${Math.min(occupied, 12)} <small>/ 12</small>`;
    $('#slotMetric').textContent = currentTime.replace('h', ':');
    $('#slotMetricDetail').textContent = `Créneau ${state.currentSlotIndex + 1} sur ${slots.length}`;
    $('#slotHeading').innerHTML = `${currentTime.replace('h', ':')} <span>· ${currentMatches.length} rencontres</span>`;
    $('#previousSlot').disabled = state.currentSlotIndex === 0;
    $('#nextSlot').disabled = state.currentSlotIndex >= slots.length - 1;
    $('#slotMatches').innerHTML = currentMatches.length ? currentMatches.map(matchCard).join('') : '<div class="empty-board">Aucune rencontre sur ce créneau.</div>';

    const notPresent = state.players.filter(player => !state.presence[player.name]);
    const pendingCurrent = currentMatches.filter(match => statusFor(match) !== 'completed');
    const actions = [];
    if (notPresent.length) actions.push({ icon: '♙', title: `${notPresent.length} présence${notPresent.length > 1 ? 's' : ''} à confirmer`, detail: notPresent.slice(0,2).map(p => p.name).join(', '), action: 'players', label: 'Pointer' });
    if (pendingCurrent.length) actions.push({ icon: '↔', title: `${pendingCurrent.length} résultat${pendingCurrent.length > 1 ? 's' : ''} attendu${pendingCurrent.length > 1 ? 's' : ''}`, detail: `Créneau de ${currentTime}`, action: 'score', match: pendingCurrent[0], label: 'Encoder' });
    const nextSlot = slots[state.currentSlotIndex + 1];
    if (nextSlot) actions.push({ icon: '◷', title: `Préparer le créneau de ${nextSlot}`, detail: `${state.matches.filter(m => m.time === nextSlot).length} feuilles de match`, action: 'next', label: 'Voir' });
    $('#actionList').innerHTML = actions.length ? actions.map((item, index) => `<div class="action-item"><span class="action-mark">${item.icon}</span><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></div><button data-action-index="${index}">${item.label}</button></div>`).join('') : '<div class="empty-board">Aucune action urgente.</div>';
    $$('#actionList [data-action-index]').forEach(button => button.addEventListener('click', () => {
        const item = actions[Number(button.dataset.actionIndex)];
        if (item.action === 'players') switchView('players');
        else if (item.action === 'score') openScoreDialog(item.match);
        else { state.currentSlotIndex += 1; persist(); renderOverview(); }
    }));

    $('#divisionProgress').innerHTML = Object.keys(DIVISION_LABELS).map(code => {
        const matches = state.matches.filter(match => match.division === code);
        const done = matches.filter(match => statusFor(match) === 'completed').length;
        return `<div><div class="division-row-head"><span>${DIVISION_LABELS[code]}</span><span>${done}/${matches.length}</span></div><div class="division-bar"><i style="width:${done / Math.max(matches.length,1) * 100}%"></i></div></div>`;
    }).join('');
    bindMatchCards($('#slotMatches'));
}

function matchCard(match) {
    const status = statusFor(match), result = resultFor(match);
    const winsA = result?.sets?.filter(set => set.a > set.b).length ?? '';
    const winsB = result?.sets?.filter(set => set.b > set.a).length ?? '';
    return `<article class="match-card is-${status}" data-match-id="${match.id}">
        <div class="match-card-head"><span class="table-number">TABLE ${match.table}</span><span class="division-badge">${match.division}</span></div>
        <div class="match-player"><span>${escapeHTML(shortName(match.playerA))}</span><span class="sets">${winsA}</span></div>
        <div class="match-player"><span>${escapeHTML(shortName(match.playerB))}</span><span class="sets">${winsB}</span></div>
        <div class="match-footer"><span>Arb. ${escapeHTML(shortName(match.referee))}</span><span>${status === 'completed' ? 'Terminé' : status === 'live' ? 'En cours' : 'À venir'}</span></div>
    </article>`;
}

function renderMatches() {
    const search = ($('#matchSearch')?.value || '').toLocaleLowerCase('fr');
    const division = $('#divisionFilter')?.value || 'all';
    const status = $('#statusFilter')?.value || 'all';
    const filtered = state.matches.filter(match => {
        const haystack = `${match.number} ${match.playerA} ${match.playerB} ${match.referee} ${match.table} ${match.time}`.toLocaleLowerCase('fr');
        return (!search || haystack.includes(search)) && (division === 'all' || match.division === division) && (status === 'all' || statusFor(match) === status);
    });
    const header = '<div class="match-table-row header"><span>#</span><span>Heure</span><span>Table</span><span>Rencontre</span><span>Arbitre</span><span>Statut</span><span>Résultat</span></div>';
    $('#matchesTable').innerHTML = header + filtered.map(match => {
        const statusValue = statusFor(match);
        const label = statusValue === 'completed' ? 'Terminé' : statusValue === 'live' ? 'En cours' : 'À venir';
        return `<div class="match-table-row" data-match-id="${match.id}"><strong>${match.number}</strong><span>${match.time}</span><span>T${match.table} · ${match.division}</span><span class="players-cell"><strong>${escapeHTML(shortName(match.playerA))}</strong><small>${escapeHTML(shortName(match.playerB))}</small></span><span>${escapeHTML(shortName(match.referee))}</span><span class="status-chip ${statusValue}">${label}</span><button class="row-action">${scoreFor(match)}</button></div>`;
    }).join('');
    bindMatchCards($('#matchesTable'));
}

function renderPlayers() {
    const search = ($('#playerSearch')?.value || '').toLocaleLowerCase('fr');
    const filtered = state.players.filter(player => {
        const matchesSearch = !search || `${player.name} ${player.club} ${player.division}`.toLocaleLowerCase('fr').includes(search);
        const present = Boolean(state.presence[player.name]);
        return matchesSearch && (state.presenceFilter === 'all' || (state.presenceFilter === 'present' ? present : !present));
    });
    $('#playersHeading').textContent = `${filtered.length} joueur${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''}`;
    $('#playerGrid').innerHTML = filtered.map(player => `<article class="player-card"><span class="avatar">${initials(player.name)}</span><div><strong>${escapeHTML(player.name)}</strong><small>${escapeHTML(player.club)} · ${player.division}</small></div><button class="presence-toggle ${state.presence[player.name] ? 'is-present' : ''}" data-player="${escapeAttr(player.name)}" aria-label="${state.presence[player.name] ? 'Marquer absent' : 'Marquer présent'}"></button></article>`).join('');
    $$('#playerGrid .presence-toggle').forEach(button => button.addEventListener('click', () => {
        const name = button.dataset.player;
        state.presence[name] = !state.presence[name]; persist(); pushCentralState({ type: 'presence', player: name, present: state.presence[name] }); renderPlayers(); renderOverview();
        toast(`${shortName(name)} · ${state.presence[name] ? 'présent' : 'à pointer'}`);
    }));
}

function computeStandings(division) {
    const players = state.players.filter(player => player.division === division).map(player => ({
        ...player, played: 0, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, pointsFor: 0, pointsAgainst: 0,
    }));
    const byName = Object.fromEntries(players.map(player => [player.name, player]));
    state.matches.filter(match => match.division === division).forEach(match => {
        const result = resultFor(match);
        if (result?.status !== 'completed' || !result?.sets?.length || !byName[match.playerA] || !byName[match.playerB]) return;
        const a = byName[match.playerA], b = byName[match.playerB];
        const winsA = result.sets.filter(set => set.a > set.b).length;
        const winsB = result.sets.length - winsA;
        const pointsA = result.sets.reduce((sum, set) => sum + set.a, 0);
        const pointsB = result.sets.reduce((sum, set) => sum + set.b, 0);
        a.played += 1; b.played += 1; a.setsFor += winsA; a.setsAgainst += winsB; b.setsFor += winsB; b.setsAgainst += winsA;
        a.pointsFor += pointsA; a.pointsAgainst += pointsB; b.pointsFor += pointsB; b.pointsAgainst += pointsA;
        if (winsA > winsB) { a.wins += 1; b.losses += 1; } else { b.wins += 1; a.losses += 1; }
    });
    return players.sort((a, b) => b.wins - a.wins || (b.setsFor - b.setsAgainst) - (a.setsFor - a.setsAgainst) || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst) || a.name.localeCompare(b.name, 'fr'));
}

function renderStandings() {
    $$('#standingsTabs button').forEach(button => button.classList.toggle('is-active', button.dataset.division === state.standingsDivision));
    $('#standingsTitle').textContent = DIVISION_LABELS[state.standingsDivision];
    const header = '<div class="standing-row header"><span>Pos.</span><span class="standing-player">Joueur</span><span>MJ</span><span>V</span><span>D</span><span>ΔS</span><span>ΔP</span></div>';
    $('#standingsTable').innerHTML = header + computeStandings(state.standingsDivision).map((player, index) => `<div class="standing-row"><span class="rank ${index < 3 ? 'top' : ''}">${index + 1}</span><span class="standing-player"><strong>${escapeHTML(player.name)}</strong><small>${escapeHTML(player.club)}</small></span><span>${player.played}</span><span class="win-count">${player.wins}</span><span>${player.losses}</span><span>${signed(player.setsFor - player.setsAgainst)}</span><span>${signed(player.pointsFor - player.pointsAgainst)}</span></div>`).join('');
}

function switchView(view) {
    state.view = view;
    $$('.nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.view === view));
    $$('.view').forEach(section => section.classList.toggle('is-active', section.id === `view-${view}`));
    const copy = {
        overview: ['SUPER TOP 6 · ÉDITION 2026', 'Bonjour, Florent.', 'Tout est prêt pour lancer la compétition.'],
        matches: ['PLANNING DE LA JOURNÉE', 'Toutes les rencontres', 'Suivez les tables, arbitres et résultats en un coup d’œil.'],
        players: ['ACCUEIL DES PARTICIPANTS', 'Joueurs & présences', 'Pointez les arrivées avant le lancement des poules.'],
        standings: ['RÉSULTATS EN DIRECT', 'Classements', 'Départage par victoires, différence de sets puis différence de points.'],
    }[view];
    $('#pageKicker').textContent = copy[0]; $('#pageTitle').textContent = copy[1]; $('#pageSubtitle').textContent = copy[2];
    if (view === 'matches') renderMatches(); if (view === 'players') renderPlayers(); if (view === 'standings') renderStandings();
    location.hash = view;
}

let activeMatch = null;
function openScoreDialog(match) {
    activeMatch = match;
    const existing = resultFor(match)?.sets || [];
    $('#scoreDialogTitle').textContent = `Match #${match.number}`;
    $('#scoreDialogMeta').textContent = `${match.time} · Table ${match.table} · ${DIVISION_LABELS[match.division]}`;
    $('#scorePlayerA').textContent = match.playerA; $('#scorePlayerB').textContent = match.playerB;
    $('#scorePlayerAClub').textContent = match.clubA; $('#scorePlayerBClub').textContent = match.clubB;
    $('#shortPlayerA').textContent = shortName(match.playerA); $('#shortPlayerB').textContent = shortName(match.playerB);
    $('#setRows').innerHTML = Array.from({ length: 5 }, (_, index) => `<label class="set-row"><span>Set ${index + 1}</span><input type="number" min="0" max="99" inputmode="numeric" data-set="${index}" data-side="a" value="${existing[index]?.a ?? ''}" aria-label="Points ${match.playerA}, set ${index + 1}"><input type="number" min="0" max="99" inputmode="numeric" data-set="${index}" data-side="b" value="${existing[index]?.b ?? ''}" aria-label="Points ${match.playerB}, set ${index + 1}"></label>`).join('');
    $('#scoreError').hidden = true;
    $('#clearResultButton').hidden = !resultFor(match);
    $('#scoreDialog').showModal();
    $('#setRows input')?.focus();
}

function readAndValidateSets() {
    const sets = [];
    for (let index = 0; index < 5; index += 1) {
        const aRaw = $(`[data-set="${index}"][data-side="a"]`).value;
        const bRaw = $(`[data-set="${index}"][data-side="b"]`).value;
        if (aRaw === '' && bRaw === '') continue;
        if (aRaw === '' || bRaw === '') throw new Error(`Le set ${index + 1} est incomplet.`);
        const a = Number(aRaw), b = Number(bRaw), high = Math.max(a, b), difference = Math.abs(a - b);
        if (a === b || high < 11 || difference < 2 || (high > 11 && difference !== 2)) throw new Error(`Le score du set ${index + 1} n’est pas valide (11 points minimum, 2 points d’écart).`);
        sets.push({ a, b });
    }
    if (!sets.length) throw new Error('Encodez au moins trois sets.');
    let winsA = 0, winsB = 0;
    for (let index = 0; index < sets.length; index += 1) {
        if (sets[index].a > sets[index].b) winsA += 1; else winsB += 1;
        if ((winsA === 3 || winsB === 3) && index !== sets.length - 1) throw new Error('Un set a été encodé après la fin du match.');
    }
    if (winsA !== 3 && winsB !== 3) throw new Error('Le vainqueur doit remporter trois sets.');
    return sets;
}

function saveScore(event) {
    event.preventDefault();
    try {
        const sets = readAndValidateSets();
        state.results[activeMatch.id] = { sets, status: 'completed', updatedAt: new Date().toISOString() };
        persist(); pushCentralState({ type: 'result', matchId: activeMatch.id, result: state.results[activeMatch.id] }); $('#scoreDialog').close(); renderOverview(); renderMatches(); renderStandings();
        toast(`Résultat du match #${activeMatch.number} enregistré`);
    } catch (error) { $('#scoreError').textContent = error.message; $('#scoreError').hidden = false; }
}

function openNextUnscored() {
    const currentTime = getSlots()[state.currentSlotIndex];
    const match = state.matches.find(item => item.time === currentTime && statusFor(item) !== 'completed') || state.matches.find(item => statusFor(item) !== 'completed');
    if (match) openScoreDialog(match); else toast('Toutes les rencontres sont déjà encodées.');
}

function bindMatchCards(root) {
    $$('[data-match-id]', root).forEach(element => element.addEventListener('click', () => openScoreDialog(state.matches.find(match => match.id === element.dataset.matchId))));
}

function exportData() {
    const data = { tournament: 'Super TOP 6 2026', exportedAt: new Date().toISOString(), players: state.players.map(player => ({ ...player, present: Boolean(state.presence[player.name]) })), matches: state.matches.map(match => ({ ...match, result: resultFor(match) || null })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `super-top6-2026-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
    toast('Export JSON téléchargé');
}

function setSyncStatus(kind, title, detail) {
    $('#syncDot').className = `sync-dot ${kind}`; $('#syncTitle').textContent = title; $('#syncDetail').textContent = detail;
}
function toast(message) {
    const element = $('#toast'); element.textContent = message; element.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('show'), 2600);
}
function shortName(name = '') { const parts = name.trim().split(/\s+/); return parts.length > 1 ? `${parts[0]} ${parts.slice(1).map(part => part[0]).join('.')}.` : name; }
function initials(name = '') { return name.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase(); }
function signed(value) { return value > 0 ? `+${value}` : String(value); }
function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]); }
function escapeAttr(value = '') { return escapeHTML(value); }

function bindEvents() {
    $$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
    $$('[data-go-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.goView)));
    $('#previousSlot').addEventListener('click', () => { state.currentSlotIndex = Math.max(0, state.currentSlotIndex - 1); persist(); renderOverview(); });
    $('#nextSlot').addEventListener('click', () => { state.currentSlotIndex = Math.min(getSlots().length - 1, state.currentSlotIndex + 1); persist(); renderOverview(); });
    $('#matchSearch').addEventListener('input', renderMatches); $('#divisionFilter').addEventListener('change', renderMatches); $('#statusFilter').addEventListener('change', renderMatches);
    $('#playerSearch').addEventListener('input', renderPlayers);
    $$('#presenceFilter button').forEach(button => button.addEventListener('click', () => { state.presenceFilter = button.dataset.presence; $$('#presenceFilter button').forEach(item => item.classList.toggle('is-active', item === button)); renderPlayers(); }));
    $('#markAllPresent').addEventListener('click', () => { state.players.forEach(player => { state.presence[player.name] = true; }); persist(); pushCentralState({ type: 'presence-all', presence: state.presence }); renderPlayers(); renderOverview(); toast('Tous les joueurs ont été pointés présents'); });
    $('#standingsTabs').addEventListener('click', event => { const button = event.target.closest('[data-division]'); if (!button) return; state.standingsDivision = button.dataset.division; renderStandings(); });
    $('#refreshButton').addEventListener('click', () => loadTournament(true)); $('#retryButton').addEventListener('click', () => loadTournament());
    $('#exportButton').addEventListener('click', exportData); $('#quickScoreButton').addEventListener('click', openNextUnscored);
    $('#scoreForm').addEventListener('submit', saveScore);
    $('#clearResultButton').addEventListener('click', () => { if (!activeMatch) return; delete state.results[activeMatch.id]; persist(); pushCentralState({ type: 'clear-result', matchId: activeMatch.id }); $('#scoreDialog').close(); renderOverview(); renderMatches(); renderStandings(); toast(`Résultat du match #${activeMatch.number} effacé`); });
}

function connectLiveUpdates() {
    if (!window.EventSource) return;
    const events = new EventSource(`/events?channel=tournament&client=organizer-${Date.now()}`);
    events.onmessage = async () => { if (await pullCentralState()) { renderOverview(); renderMatches(); renderPlayers(); renderStandings(); } };
}

document.addEventListener('DOMContentLoaded', () => {
    hydrateLocalState(); bindEvents();
    const initialView = location.hash.slice(1);
    if (['overview', 'matches', 'players', 'standings'].includes(initialView)) switchView(initialView);
    loadTournament(); connectLiveUpdates();
});
