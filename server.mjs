import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const port = Number(process.env.PORT || 8765);
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const tournamentStatePath = join(rootDir, 'tournament-state.json');
const publishedSpreadsheetId = '2PACX-1vTX2csVgYL_ZdHNx2wyx2aIAAq2klSg0uMRaxKKbikDIdsNYc7adkAmvCFezgmWNUmDR1QULJcZ-DkA';

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg'
};

function send(response, status, body, headers = {}) {
    response.writeHead(status, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...headers
    });
    response.end(body);
}

async function readTournamentState() {
    try {
        return JSON.parse(await readFile(tournamentStatePath, 'utf8'));
    } catch {
        return { results: {}, presence: {}, updatedAt: null };
    }
}

async function writeTournamentState(state) {
    const nextState = { ...state, updatedAt: new Date().toISOString() };
    await writeFile(tournamentStatePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
    return nextState;
}

// --- Relais temps réel (contrôle à distance entre appareils du réseau) ---
// Chaque client (écran ou télécommande) ouvre un flux SSE sur /events et publie
// ses messages via POST /publish. Le serveur rediffuse à tous les autres clients
// du même "channel". Remplace BroadcastChannel qui ne marche qu'en local navigateur.
const channels = new Map(); // channelName -> Set<{ clientId, response }>

function broadcast(channelName, payload, senderId = '') {
    const subscribers = channels.get(channelName);
    if (!subscribers) return;
    const frame = `data: ${JSON.stringify(payload).replace(/\n/g, ' ')}\n\n`;
    for (const subscriber of subscribers) {
        if (subscriber.clientId !== senderId) subscriber.response.write(frame);
    }
}

function subscribe(requestUrl, response) {
    const channelName = requestUrl.searchParams.get('channel') || 'default';
    const clientId = requestUrl.searchParams.get('client') || `anon-${Date.now()}`;

    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
    });
    response.write('retry: 2000\n\n');

    const subscriber = { clientId, response };
    if (!channels.has(channelName)) {
        channels.set(channelName, new Set());
    }
    const subscribers = channels.get(channelName);
    subscribers.add(subscriber);

    const heartbeat = setInterval(() => response.write(': ping\n\n'), 20000);

    const cleanup = () => {
        clearInterval(heartbeat);
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
            channels.delete(channelName);
        }
    };

    response.on('close', cleanup);
    response.on('error', cleanup);
}

async function publish(request, requestUrl, response) {
    const channelName = requestUrl.searchParams.get('channel') || 'default';
    const senderId = requestUrl.searchParams.get('client') || '';

    const chunks = [];
    for await (const chunk of request) {
        chunks.push(chunk);
    }
    const payload = Buffer.concat(chunks).toString('utf8');

    const subscribers = channels.get(channelName);
    if (subscribers) {
        const frame = `data: ${payload.replace(/\n/g, ' ')}\n\n`;
        for (const subscriber of subscribers) {
            if (subscriber.clientId !== senderId) {
                subscriber.response.write(frame);
            }
        }
    }

    send(response, 204, '');
}

async function handleTournamentState(request, response) {
    if (request.method === 'GET') {
        send(response, 200, JSON.stringify(await readTournamentState()), {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json; charset=utf-8'
        });
        return;
    }

    if (request.method !== 'POST') {
        send(response, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
    }

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    let update;
    try {
        update = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        send(response, 400, 'Invalid JSON', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
    }

    const state = await readTournamentState();
    if (update.type === 'result' && /^\d+$/.test(String(update.matchId)) && update.result) {
        state.results[String(update.matchId)] = update.result;
    } else if (update.type === 'clear-result' && /^\d+$/.test(String(update.matchId))) {
        delete state.results[String(update.matchId)];
    } else if (update.type === 'presence' && typeof update.player === 'string') {
        state.presence[update.player] = Boolean(update.present);
    } else if (update.type === 'presence-all' && update.presence && typeof update.presence === 'object') {
        state.presence = { ...state.presence, ...update.presence };
    } else {
        send(response, 400, 'Unsupported update', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
    }

    const saved = await writeTournamentState(state);
    broadcast('tournament', { type: 'state-updated', update: update.type, matchId: update.matchId || null });
    send(response, 200, JSON.stringify(saved), {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
    });
}

async function proxySheet(requestUrl, response) {
    const gid = requestUrl.searchParams.get('gid');

    if (!gid || !/^\d+$/.test(gid)) {
        send(response, 400, 'Missing or invalid gid', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/e/${publishedSpreadsheetId}/pub?gid=${gid}&single=true&output=csv`;
    const sheetResponse = await fetch(sheetUrl);

    if (!sheetResponse.ok) {
        send(response, sheetResponse.status, `Google Sheets error: ${sheetResponse.status}`, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        return;
    }

    send(response, 200, await sheetResponse.text(), {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/csv; charset=utf-8'
    });
}

async function serveStatic(requestUrl, response) {
    const routeAliases = new Map([
        ['/', '/organizer.html'],
        ['/index.html', '/organizer.html'],
        ['/organizer', '/organizer.html'],
        ['/table', '/table.html'],
        ['/scores', '/scores.html'],
        ['/qr', '/qr-codes.html'],
        ['/ecran', '/live-screen.html'],
        ['/presentation', '/index3.html'],
        ['/joueurs', '/joueurs.html'],
        ['/remise-prix', '/remise-prix.html']
    ]);
    const pathname = decodeURIComponent(routeAliases.get(requestUrl.pathname) || requestUrl.pathname);
    const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(rootDir, normalizedPath);

    if (!filePath.startsWith(rootDir)) {
        send(response, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
    }

    try {
        const body = await readFile(filePath);
        send(response, 200, body, {
            'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream'
        });
    } catch {
        send(response, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
}

createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
        send(response, 204, '');
        return;
    }

    try {
        const requestUrl = new URL(request.url, `http://${request.headers.host}`);

        if (requestUrl.pathname === '/events') {
            subscribe(requestUrl, response);
            return;
        }

        if (requestUrl.pathname === '/publish') {
            await publish(request, requestUrl, response);
            return;
        }

        if (requestUrl.pathname === '/sheet') {
            await proxySheet(requestUrl, response);
            return;
        }

        if (requestUrl.pathname === '/api/state') {
            await handleTournamentState(request, response);
            return;
        }

        if (requestUrl.pathname === '/health') {
            send(response, 200, 'ok', {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return;
        }

        await serveStatic(requestUrl, response);
    } catch (error) {
        console.error(error);
        send(response, 500, 'Internal server error', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
}).listen(port, '0.0.0.0', () => {
    const lanAddresses = Object.values(networkInterfaces())
        .flat()
        .filter(iface => iface && iface.family === 'IPv4' && !iface.internal)
        .map(iface => iface.address);

    console.log(`Top 6 server running:`);
    console.log(`  Écran     : http://127.0.0.1:${port}/`);
    for (const address of lanAddresses) {
        console.log(`  Télécommande (même WiFi) : http://${address}:${port}/control.html`);
    }
});
