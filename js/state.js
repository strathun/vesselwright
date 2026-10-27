// The save: every persistent fact about the player's game lives in S.
// Bump SAVE_VERSION and add a step to MIGRATIONS whenever the shape of S changes,
// so existing saves (local and cloud) keep loading.
import { FX, LV, NS } from './data.js';
import { lk, rk } from './util.js';
import { emit } from './bus.js';

export let S = null;
export const SAVE_KEY = 'vesselwright.save';
export const BACKUP_KEY = 'vesselwright.backup';
export const SAVE_VERSION = 2;

const MIGRATIONS = {
  // v1 was the original single-file prototype.
  1: o => { o.savedAt = o.savedAt || 0; o.pristine = false; o.v = 2; return o; },
};
export function migrate(o) {
  if (!o || typeof o !== 'object' || typeof o.v !== 'number') throw new Error('That is not a Vesselwright save.');
  if (o.v > SAVE_VERSION) throw new Error(`This save is from a newer version of the game (save format ${o.v}). Update the game and try again.`);
  while (o.v < SAVE_VERSION) {
    const step = MIGRATIONS[o.v];
    if (!step) throw new Error(`No upgrade path from save format ${o.v}.`);
    o = step(o);
  }
  if (!o.stones || !Array.isArray(o.board) || o.board.length !== NS) throw new Error('This save is damaged.');
  return o;
}

export function mkStone(f, lv = 1) {
  const uid = 's' + (S.uid++);
  S.stones[uid] = { uid, f: f.slice(), xp: LV[lv - 1], lv, mastered: false, aff: { beast: 0, construct: 0, wraith: 0 } };
  return uid;
}
export function fresh() {
  S = { v: SAVE_VERSION, savedAt: 0, pristine: true, uid: 1, stones: {}, board: Array(NS).fill(null), unlocked: Array(NS).fill(false), links: {},
    filament: 5, insight: 10, shards: 30, codex: {}, res: {}, stock: [], maxDepth: 1, vMax: 100, buys: { fil: 0, hp: 0 }, unlockCount: 0,
    opt: { auto: false, effigyHits: true } };
  [6, 7, 8, 11, 12, 13].forEach(i => S.unlocked[i] = true);
  S.board[6] = mkStone(['strike']); S.board[7] = mkStone(['ember']); S.links[lk(6, 7)] = 1;
  S.board[12] = mkStone(['mend']);
  ['strike', 'lance', 'ward', 'hex', 'rime', 'volt', 'echo', 'spread', 'invert', 'siphon'].forEach(f => mkStone([f]));
  restock();
}
/** Replace the whole save (cloud load, import, restore). */
export function setState(o) { S = o; }

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { S = migrate(JSON.parse(raw)); return; }
  } catch (e) { console.warn('Local save could not be loaded:', e); }
  fresh();
}
/** Write locally only, without stamping a new time or notifying sync. */
export function writeLocal() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
/** The normal save: called after any player action. */
export function save() {
  S.savedAt = Date.now(); S.pristine = false;
  writeLocal();
  emit('saved');
}

// ---- Backups: one slot, written before anything overwrites the save ----
export function stashBackup(reason) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: Date.now(), reason, data: S })); } catch (e) { /* ignore */ }
}
export function readBackup() {
  try { const b = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null'); return b && b.data ? b : null; } catch (e) { return null; }
}

// ---- Save codes: portable text copies of the save ----
const CODE_PREFIX = 'VW2:';
export function exportCode() {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return CODE_PREFIX + btoa(bin);
}
export function parseCode(code) {
  const t = (code || '').trim().replace(/\s+/g, '');
  if (!t.startsWith(CODE_PREFIX)) throw new Error('Save codes start with "' + CODE_PREFIX + '". Check that the whole code was pasted.');
  let json;
  try { const bin = atob(t.slice(CODE_PREFIX.length)); json = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
  catch (e) { throw new Error('This code is incomplete or garbled. Copy it again and paste the whole thing.'); }
  return migrate(JSON.parse(json));
}

// ---- Small queries over S ----
export const linked = (a, b) => !!S.links[lk(a, b)];
export function stoneCls(st) { if (st.f.some(x => FX[x].cls === 'verb')) return 'verb'; if (st.f.some(x => FX[x].cls === 'mod')) return 'mod'; return 'ess'; }
export function res(a, b) { return S.res[rk(a, b)] || 0; }
export function addRes(a, b, v) { if (!a || !b || a === b) return; const k = rk(a, b); S.res[k] = Math.min(100, (S.res[k] || 0) + v); }
export function onBoard(uid) { return S.board.indexOf(uid); }
export function satchelStones() { const on = new Set(S.board.filter(Boolean)); return Object.values(S.stones).filter(s => !on.has(s.uid)); }
export function restock() {
  const w = []; const pool = Object.keys(FX);
  for (let i = 0; i < 4; i++) { const roll = Math.random(); const rar = roll < .5 ? 0 : roll < .85 ? 1 : 2; const c = pool.filter(f => FX[f].rar === rar); w.push(c[Math.floor(Math.random() * c.length)]); }
  S.stock = w;
}
