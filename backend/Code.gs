/** @OnlyCurrentDoc */

/**
 * Weihnachtsessen 2026 · Backend (Google Apps Script + Google Sheet)
 *
 * Speichert die Antworten der Gäste im Tabellenblatt "Antworten".
 * Öffentlich ausgeliefert werden nur Name und Terminwahl. Unverträglichkeiten,
 * Nachrichten und die Bearbeitungs-Tokens bleiben im Sheet und sieht nur du.
 *
 * Einrichtung: siehe README.md im Repo.
 */

const SHEET_NAME = 'Antworten';
const HEADERS = ['id', 'token', 'name', 'votes', 'diet', 'message', 'created', 'updated'];
const MAX_ROWS = 25;               // Schutz gegen Spam
const VOTE_VALUES = ['y', 'm', 'n'];

function doGet() {
  try {
    return json_({ ok: true, responses: list_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot: Bots füllen das versteckte Feld aus. Still ignorieren.
    if (body.website) return json_({ ok: true, responses: list_() });
    if (body.action !== 'upsert') throw new Error('Unbekannte Aktion');

    const id = String(body.id || '');
    const token = String(body.token || '');
    if (!/^[A-Za-z0-9-]{8,80}$/.test(id) || !/^[A-Za-z0-9-]{16,160}$/.test(token)) throw new Error('Ungültige Kennung');

    const name = clean_(body.name, 40);
    if (!name) throw new Error('Name fehlt');

    const votes = {};
    const raw = body.votes || {};
    Object.keys(raw).slice(0, 20).forEach(function (k) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && VOTE_VALUES.indexOf(raw[k]) >= 0) votes[k] = raw[k];
    });

    const diet = clean_(body.diet, 300);
    const message = clean_(body.message, 500);
    const now = new Date().toISOString();

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === id) { rowIndex = i; break; }
    }

    if (rowIndex > 0) {
      if (values[rowIndex][1] !== token) throw new Error('Diese Antwort kann nur ihr Absender ändern');
      sh.getRange(rowIndex + 1, 3, 1, 4).setValues([[safe_(name), JSON.stringify(votes), safe_(diet), safe_(message)]]);
      sh.getRange(rowIndex + 1, 8).setValue(now);
    } else {
      if (values.length - 1 >= MAX_ROWS) throw new Error('Die Tafel ist voll');
      sh.appendRow([id, token, safe_(name), JSON.stringify(votes), safe_(diet), safe_(message), now, now]);
    }

    return json_({ ok: true, responses: list_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

/* ---------- helpers ---------- */

function list_() {
  const values = sheet_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    let votes = {};
    try { votes = JSON.parse(r[3] || '{}'); } catch (e) { votes = {}; }
    out.push({ id: String(r[0]), name: unsafe_(String(r[2])), votes: votes, updated: r[7] });
  }
  return out;
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Verhindert, dass Eingaben im Sheet als Formel ausgeführt werden.
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }
function unsafe_(s) { return s.charAt(0) === "'" ? s.slice(1) : s; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Einmal im Editor ausführen, um das Tabellenblatt anzulegen und die Berechtigung zu erteilen. */
function setup() {
  sheet_();
}
