// Cloud saves through the strathun.github.io Supabase project.
// Local storage is always written first; the cloud copy follows a few seconds later.
// Conflict rule: the save with the newest savedAt wins, and the loser is kept as the local backup.
// A pristine (never-played) local save always yields to the cloud.
import { S, SAVE_VERSION, migrate, setState, stashBackup, writeLocal } from './state.js';
import { emit, on } from './bus.js';

const SUPABASE_URL = 'https://gfiigncjwtuslwqlyasr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaWlnbmNqd3R1c2x3cWx5YXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDIxMjcsImV4cCI6MjA5MjI3ODEyN30.skircARSZLElxN1w0aoxRP9sbIRDEPmSC4hbtHQSqyw';
const TABLE = 'vesselwright_saves';
const PUSH_DELAY = 4000;

let sb = null, timer = 0, inflight = null, again = false;
let canReplace = () => true;

/** Read-only view of sync status for the UI. state: off | signed-out | syncing | synced | offline | error */
export const cloud = { state: 'off', user: null, message: '', lastSync: 0 };
function set(state, message = '') { cloud.state = state; cloud.message = message; emit('cloud'); }

/** Supply a check that says whether the save may be swapped right now (not mid-descent). */
export function setReplaceGuard(fn) { canReplace = fn; }

export function initCloud() {
  if (!window.supabase || !window.supabase.createClient) { set('off', 'Cloud saves could not load. Playing locally.'); return; }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  sb.auth.onAuthStateChange((event, session) => {
    cloud.user = session ? session.user : null;
    if (!cloud.user) { set('signed-out'); return; }
    // Supabase asks that callbacks not await its own calls, so defer.
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') setTimeout(sync, 0);
    else emit('cloud');
  });
  on('saved', schedule);
  on('trial-end', () => { if (cloud.user) sync(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); timer = 0; sync(); } });
  window.addEventListener('online', () => { if (cloud.user) sync(); });
}

function schedule() {
  if (!cloud.user) return;
  clearTimeout(timer);
  timer = setTimeout(() => { timer = 0; sync(); }, PUSH_DELAY);
}

/** Compare with the cloud copy and move whichever side is older. Safe to call any time. */
export function sync() {
  if (!sb || !cloud.user) return Promise.resolve();
  if (inflight) { again = true; return inflight; }
  inflight = doSync().finally(() => { inflight = null; if (again) { again = false; sync(); } });
  return inflight;
}

async function doSync() {
  if (!navigator.onLine) { set('offline', 'Offline. Progress is saved on this device and will sync when you reconnect.'); return; }
  set('syncing');
  const uid = cloud.user.id;
  const { data: row, error } = await sb.from(TABLE).select('data').eq('user_id', uid).maybeSingle();
  if (error) { set('error', describe(error)); return; }

  const remote = row && row.data;
  const remoteAt = remote ? remote.savedAt || 0 : -1;
  const localAt = S.pristine ? -2 : S.savedAt || 0;

  if (remote && remoteAt > localAt) {
    if (!canReplace()) { set('synced', 'A newer cloud save is waiting. It will load when you return to the bench.'); return; }
    let next;
    try { next = migrate(structuredClone(remote)); } catch (e) { set('error', e.message); return; }
    if (!S.pristine) stashBackup('replaced by a newer cloud save');
    setState(next); writeLocal();
    emit('state-replaced', { source: 'cloud' });
  } else if (!remote || localAt > remoteAt) {
    const { error: upErr } = await sb.from(TABLE).upsert(
      { user_id: uid, data: S, version: SAVE_VERSION, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' });
    if (upErr) { set('error', describe(upErr)); return; }
  }
  cloud.lastSync = Date.now();
  set('synced');
}

function describe(err) {
  const m = err && (err.message || String(err));
  if (/relation .* does not exist|Could not find the table/i.test(m)) return 'The saves table is missing in Supabase. Run supabase/schema.sql in the SQL editor.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Could not reach the cloud. Progress is saved on this device.';
  return m;
}

export async function signIn(email, password) {
  if (!sb) throw new Error('Cloud saves are not available right now.');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}
export async function signOut() {
  if (!sb) return;
  clearTimeout(timer); timer = 0;
  await sync();
  await sb.auth.signOut();
}
