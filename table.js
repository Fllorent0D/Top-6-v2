let schedule = null;
let central = { results: {}, presence: {} };
let tableNumber = Number(new URLSearchParams(location.search).get('table'));
let tableMatches = [];
let matchIndex = 0;
let draft = { sets: [], current: { a: 0, b: 0 }, history: [] };

const $ = selector => document.querySelector(selector);

async function init() {
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 12) {
        showTablePicker(); return;
    }
    $('#tableTitle').textContent = `TABLE ${tableNumber}`;
    try {
        [schedule, central] = await Promise.all([Top6.loadSchedule(), Top6.getState()]);
        tableMatches = schedule.matches.filter(match => match.table === tableNumber);
        matchIndex = Math.max(0, tableMatches.findIndex(match => Top6.status(match, central) !== 'completed'));
        $('#scoreLoading').hidden = true; $('#scoreboard').hidden = false; $('#networkPill').classList.add('online'); $('#networkPill').lastChild.textContent = ' En direct';
        renderMatch();
        Top6.subscribe(`table-${tableNumber}-${Date.now()}`, refreshCentral);
    } catch (error) { $('#scoreLoading').textContent = error.message; $('#networkPill').classList.add('error'); }
}

function showTablePicker() {
    $('#scoreLoading').hidden = true; $('#tablePicker').hidden = false;
    $('#tableButtons').innerHTML = Array.from({length:12},(_,index)=>`<button data-table="${index+1}">${index+1}</button>`).join('');
    document.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', () => { location.href = `/table?table=${button.dataset.table}`; }));
}

async function refreshCentral() {
    central = await Top6.getState();
    const current = tableMatches[matchIndex];
    if (current && central.results[current.id]?.updatedAt !== draft.updatedAt) renderMatch();
}

function renderMatch() {
    const match = tableMatches[matchIndex]; if (!match) return;
    const saved = central.results?.[match.id];
    draft = {
        sets: (saved?.sets || []).map(set => ({...set})),
        current: saved?.status === 'live' ? { ...(saved.current || {a:0,b:0}) } : { a: 0, b: 0 },
        history: [], updatedAt: saved?.updatedAt,
    };
    $('#matchSelect').innerHTML = tableMatches.map((item,index)=>`<option value="${index}" ${index===matchIndex?'selected':''}>#${item.number} · ${item.time} · ${Top6.shortName(item.playerA)} / ${Top6.shortName(item.playerB)}</option>`).join('');
    $('#previousMatch').disabled = matchIndex === 0; $('#nextMatch').disabled = matchIndex === tableMatches.length - 1;
    $('#matchDivision').textContent = match.division; $('#matchTime').textContent = match.time; $('#matchReferee').textContent = `Arbitre · ${Top6.shortName(match.referee)}`;
    $('#playerA').textContent = match.playerA; $('#playerB').textContent = match.playerB; $('#clubA').textContent = match.clubA; $('#clubB').textContent = match.clubB;
    if (saved?.status === 'completed') showWinner(match, saved); else { $('#winnerScreen').hidden = true; $('#scoreboard').hidden = false; renderScore(); if (saved?.status !== 'live') saveLive(); }
}

function renderScore() {
    const winsA = draft.sets.filter(set=>set.a>set.b).length, winsB = draft.sets.length-winsA;
    $('#pointsA').textContent = draft.current.a; $('#pointsB').textContent = draft.current.b; $('#setsA').textContent = winsA; $('#setsB').textContent = winsB; $('#setNumber').textContent = draft.sets.length+1;
    $('#setsStrip').innerHTML = draft.sets.map((set,index)=>`<span class="set-chip">S${index+1}<strong>${set.a}–${set.b}</strong></span>`).join('');
    const canValidate = isWonSet(draft.current.a,draft.current.b);
    $('#validateSetButton').disabled = !canValidate; $('#validateSetButton').textContent = canValidate ? `Valider ${draft.current.a}–${draft.current.b} →` : 'Valider le set →';
    $('#undoButton').disabled = !draft.history.length;
}

function isWonSet(a,b) { const high=Math.max(a,b); return high>=11 && Math.abs(a-b)>=2; }

function addPoint(side) {
    draft.history.push({ ...draft.current }); draft.current[side] += 1; renderScore(); saveLive();
}

function undo() {
    if (!draft.history.length) return; draft.current = draft.history.pop(); renderScore(); saveLive();
}

async function saveLive() {
    const match=tableMatches[matchIndex];
    const result={ status:'live', sets:draft.sets, current:draft.current, updatedAt:new Date().toISOString(), source:`table-${tableNumber}` };
    central.results[match.id]=result; draft.updatedAt=result.updatedAt;
    try { await Top6.post({type:'result',matchId:match.id,result}); $('#networkPill').classList.add('online'); }
    catch { $('#networkPill').classList.add('error'); toast('Connexion perdue — nouvelle tentative au prochain point'); }
}

async function validateSet() {
    if (!isWonSet(draft.current.a,draft.current.b)) return;
    draft.sets.push({...draft.current}); draft.current={a:0,b:0}; draft.history=[];
    const winsA=draft.sets.filter(set=>set.a>set.b).length,winsB=draft.sets.length-winsA;
    const match=tableMatches[matchIndex];
    if (winsA===3 || winsB===3) {
        const result={status:'completed',sets:draft.sets,current:{a:0,b:0},updatedAt:new Date().toISOString(),source:`table-${tableNumber}`};
        central.results[match.id]=result; await Top6.post({type:'result',matchId:match.id,result}); showWinner(match,result); toast('Résultat envoyé à la direction du tournoi');
    } else { renderScore(); await saveLive(); }
}

function showWinner(match,result) {
    const winsA=result.sets.filter(set=>set.a>set.b).length,winsB=result.sets.length-winsA;
    $('#scoreboard').hidden=true; $('#winnerScreen').hidden=false; $('#winnerName').textContent=winsA>winsB?match.playerA:match.playerB; $('#winnerScore').textContent=`${winsA} – ${winsB}`;
}

function changeMatch(index) { matchIndex=Math.max(0,Math.min(tableMatches.length-1,index)); renderMatch(); }
function toast(message){const el=$('#scoreToast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2500);}

document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-score-side]').forEach(button=>button.addEventListener('click',()=>addPoint(button.dataset.scoreSide)));
    $('#undoButton').addEventListener('click',undo); $('#validateSetButton').addEventListener('click',validateSet);
    $('#previousMatch').addEventListener('click',()=>changeMatch(matchIndex-1)); $('#nextMatch').addEventListener('click',()=>changeMatch(matchIndex+1));
    $('#matchSelect').addEventListener('change',event=>changeMatch(Number(event.target.value)));
    $('#nextAfterWin').addEventListener('click',()=>changeMatch(Math.min(matchIndex+1,tableMatches.length-1)));
    init();
});
