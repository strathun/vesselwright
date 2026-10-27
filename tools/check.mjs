// Combination tester and project checks. Run: node tools/check.mjs
// Compiles every verb with every ordered chain of up to three essences/modifiers (plus fused stones)
// and fails on anything the system cannot resolve. Prints balance outliers and no-op modifiers as warnings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FX, KN, MODS, NS } from '../js/data.js';
import { S, fresh, mkStone, exportCode, parseCode, migrate, setState } from '../js/state.js';
import { compileRite, summarize } from '../js/engine/rites.js';
import { lk } from '../js/util.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

const VERBS = Object.keys(FX).filter(f => FX[f].cls === 'verb');
const ESS = Object.keys(FX).filter(f => FX[f].cls === 'ess');
const ITEMS = [...ESS, ...MODS];
const PATH = [0, 1, 2, 3, 4, 9]; // a straight run of sockets, nearest first

function build(verbFacets, chain) {
  fresh();
  S.board = Array(NS).fill(null); S.links = {};
  S.board[PATH[0]] = mkStone(verbFacets);
  chain.forEach((f, i) => { S.board[PATH[i + 1]] = mkStone(Array.isArray(f) ? f : [f]); S.links[lk(PATH[i], PATH[i + 1])] = 1; });
  return compileRite(PATH[0]);
}
const label = (v, c) => `[${[].concat(v).join('+')}] ${c.map(x => [].concat(x).join('+')).join(' > ') || '(bare)'}`;
const key = R => JSON.stringify([summarize(R.packets).map(x => x.txt), R.tempo]);

function validate(R, name) {
  if (!R.packets.length) err(`${name}: produced no packets`);
  if (R.packets.length > 40) err(`${name}: ${R.packets.length} packets (cap is 40)`);
  for (const p of R.packets) {
    if (!Number.isFinite(p.mag) || p.mag < 0) err(`${name}: packet magnitude ${p.mag}`);
    if (!KN[p.kind + ':' + p.side]) err(`${name}: no rite form defined for ${p.kind}:${p.side}`);
  }
  if (!Number.isFinite(R.tempo) || R.tempo < 8 || R.tempo > 100) err(`${name}: tempo ${R.tempo}`);
  if (!Number.isFinite(R.strain) || R.strain < 0) err(`${name}: strain ${R.strain}`);
  if (!Number.isFinite(R.acc)) err(`${name}: aim ${R.acc}`);
}
const harmPerTempo = R => R.packets.filter(p => p.side === 'foe' && p.kind === 'harm')
  .reduce((a, p) => a + p.mag * (p.tgt === 'all' ? 3 : 1) * (p.fuse ? 0.6 : 1), 0) / R.tempo;

let count = 0;
const eff = [];
function run(v, chain) {
  const name = label(v, chain);
  let R;
  try { R = build(v, chain); } catch (e) { err(`${name}: threw ${e.message}`); return null; }
  count++; validate(R, name);
  const h = harmPerTempo(R); if (h > 0) eff.push({ name, h });
  return R;
}

// 1. Every verb with every ordered chain of up to 3 items.
for (const v of VERBS) {
  run([v], []);
  for (const a of ITEMS) { run([v], [a]);
    for (const b of ITEMS) { run([v], [a, b]);
      for (const c of ITEMS) run([v], [a, b, c]); } }
}
// 2. Fused stones: verb+verb, verb+mod, verb+essence, and a fused modifier stone in a chain.
for (const v of VERBS) {
  for (const w of VERBS) if (w !== v) run([v, w], []);
  for (const m of [...MODS, ...ESS]) { run([v, m], []); run([v, m], ['ember']); }
  for (const m of MODS) for (const n of MODS) run([v], [[m, n]]);
}
// 3. No-op modifiers: a modifier should change something on every verb.
for (const v of VERBS) {
  const base = key(build([v], []));
  for (const m of MODS) if (key(build([v], [m])) === base) warn(`${FX[m].name} changes nothing on a bare ${FX[v].name}`);
}
// 4. Order sensitivity (informational).
let sensitive = 0, pairs = 0;
for (const v of VERBS) for (const a of MODS) for (const b of MODS) if (a < b) {
  pairs++; if (key(build([v], [a, b])) !== key(build([v], [b, a]))) sensitive++;
}
// 5. Balance outliers.
eff.sort((a, b) => b.h - a.h);
const med = eff[Math.floor(eff.length / 2)].h;
const outliers = eff.filter(x => x.h > med * 6);
if (outliers.length) warn(`${outliers.length} chains deal over 6× the median harm per tempo (${med.toFixed(2)}). Top: ` + outliers.slice(0, 5).map(x => `${x.name} ${x.h.toFixed(2)}`).join('; '));

// 6. Saves: code round trip and v1 migration.
fresh(); mkStone(['fork']); S.codex['k:harm:foe'] = 1;
const before = JSON.stringify(S);
const back = parseCode(exportCode());
if (JSON.stringify(back) !== before) err('save code round trip changed the save');
const v1 = JSON.parse(before); v1.v = 1; delete v1.savedAt; delete v1.pristine;
try { const m = migrate(v1); if (m.v !== 2 || m.savedAt !== 0) err('v1 migration produced the wrong shape'); } catch (e) { err('v1 migration threw: ' + e.message); }
try { parseCode('nonsense'); err('parseCode accepted garbage'); } catch (e) { /* expected */ }
setState(back);

// 7. Offline shell lists every module.
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(path.join(ROOT, 'js'))) {
  const rel = './' + path.relative(ROOT, f).split(path.sep).join('/');
  if (!sw.includes(`'${rel}'`)) err(`sw.js SHELL is missing ${rel} (the game would fail to start offline)`);
}

console.log(`Compiled ${count} rites. ${sensitive}/${pairs} modifier pairs are order-sensitive.`);
console.log(`Harm per tempo: median ${med.toFixed(2)}, best ${eff[0].h.toFixed(2)} (${eff[0].name}).`);
warnings.forEach(w => console.log('warn: ' + w));
if (errors.length) {
  console.log(`\n${errors.length} error(s):`); errors.slice(0, 40).forEach(e => console.log('  ' + e));
  process.exit(1);
}
console.log('All checks passed.');
