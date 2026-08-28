(function () {
    const publishedId = '2PACX-1vTX2csVgYL_ZdHNx2wyx2aIAAq2klSg0uMRaxKKbikDIdsNYc7adkAmvCFezgmWNUmDR1QULJcZ-DkA';
    const gids = { players: '311422638', matches: '1785200447' };
    const labels = { NAT: 'Nationale & WB', P1: 'Provinciale 1', P2: 'Provinciale 2', P3: 'Provinciale 3', P4: 'Provinciale 4', P5: 'Provinciale 5', P6: 'Provinciale 6' };

    function parseCSV(text) {
        const rows = []; let row = [], field = '', quoted = false;
        for (let index = 0; index < text.length; index += 1) {
            const char = text[index];
            if (quoted) {
                if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
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

    async function sheet(gid) {
        const urls = [`/sheet?gid=${gid}`, `/api/sheet?gid=${gid}`, `https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?gid=${gid}&single=true&output=csv`];
        let error;
        for (const url of urls) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const body = await response.text();
                if (body.includes('<!DOCTYPE html>')) throw new Error('Réponse invalide');
                return parseCSV(body);
            } catch (caught) { error = caught; }
        }
        throw error || new Error('Planning inaccessible');
    }

    async function loadSchedule() {
        const [playerRows, matchRows] = await Promise.all([sheet(gids.players), sheet(gids.matches)]);
        const players = playerRows.slice(1).filter(row => row[1] && labels[row[3]]).map(row => ({ name: row[1], club: row[2], division: row[3] }));
        const byName = Object.fromEntries(players.map(player => [player.name, player]));
        const matches = matchRows.slice(2).filter(row => row[2] && labels[row[1]]).map(row => ({
            id: String(row[2]), number: Number(row[2]), division: row[1], playerA: row[3], playerB: row[4], referee: row[5], table: Number(row[6]), time: row[7], round: Number(row[8]), clubA: byName[row[3]]?.club || '', clubB: byName[row[4]]?.club || '',
        }));
        return { players, matches };
    }

    async function getState() {
        const response = await fetch('/api/state', { cache: 'no-store' });
        if (!response.ok) throw new Error(`État central indisponible (${response.status})`);
        return response.json();
    }

    async function post(update) {
        const response = await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) });
        if (!response.ok) throw new Error(`Sauvegarde refusée (${response.status})`);
        return response.json();
    }

    function subscribe(client, callback) {
        if (!window.EventSource) return null;
        const source = new EventSource(`/events?channel=tournament&client=${encodeURIComponent(client)}`);
        source.onmessage = event => callback(JSON.parse(event.data));
        return source;
    }

    function status(match, central) {
        return central.results?.[match.id]?.status || 'upcoming';
    }

    function score(match, central) {
        const result = central.results?.[match.id];
        const sets = result?.sets || [];
        return {
            a: sets.filter(set => set.a > set.b).length,
            b: sets.filter(set => set.b > set.a).length,
            sets,
            current: result?.current || { a: 0, b: 0 },
        };
    }

    function standings(division, schedule, central) {
        const rows = schedule.players.filter(player => player.division === division).map(player => ({ ...player, played: 0, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, pointsFor: 0, pointsAgainst: 0 }));
        const byName = Object.fromEntries(rows.map(player => [player.name, player]));
        schedule.matches.filter(match => match.division === division).forEach(match => {
            const result = central.results?.[match.id];
            if (result?.status !== 'completed' || !result.sets?.length) return;
            const a = byName[match.playerA], b = byName[match.playerB]; if (!a || !b) return;
            const winsA = result.sets.filter(set => set.a > set.b).length, winsB = result.sets.length - winsA;
            const pointsA = result.sets.reduce((sum, set) => sum + set.a, 0), pointsB = result.sets.reduce((sum, set) => sum + set.b, 0);
            a.played += 1; b.played += 1; a.setsFor += winsA; a.setsAgainst += winsB; b.setsFor += winsB; b.setsAgainst += winsA;
            a.pointsFor += pointsA; a.pointsAgainst += pointsB; b.pointsFor += pointsB; b.pointsAgainst += pointsA;
            if (winsA > winsB) { a.wins += 1; b.losses += 1; } else { b.wins += 1; a.losses += 1; }
        });
        return rows.sort((a,b) => b.wins-a.wins || (b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst) || (b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst) || a.name.localeCompare(b.name, 'fr'));
    }

    function shortName(name = '') {
        const parts = name.trim().split(/\s+/); return parts.length > 1 ? `${parts[0]} ${parts.slice(1).map(part => part[0]).join('.')}.` : name;
    }
    function escape(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]); }
    function signed(value) { return value > 0 ? `+${value}` : String(value); }

    window.Top6 = { labels, loadSchedule, getState, post, subscribe, status, score, standings, shortName, escape, signed };
}());
