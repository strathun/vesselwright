// The Save tab: cloud sign-in, save codes, backup restore, start over.
import { exportCode, fresh, migrate, parseCode, readBackup, save, setState, stashBackup } from '../state.js';
import { cloud, signIn, signOut, sync } from '../cloud.js';
import { emit } from '../bus.js';
import { UI } from './ui-state.js';
import { toast } from './toast.js';
import { $ } from '../util.js';

const ago = t => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago'; return new Date(t).toLocaleDateString();
};
const STATE_TEXT = {
  off: 'Cloud saves are unavailable', 'signed-out': 'Saved on this device only', syncing: 'Syncing…',
  synced: 'Synced', offline: 'Offline', error: 'Sync problem',
};

export function renderSyncPill() {
  const el = $('#syncpill'); if (!el) return;
  el.textContent = cloud.state === 'signed-out' || cloud.state === 'off' ? 'Local save' : STATE_TEXT[cloud.state];
  el.dataset.state = cloud.state;
}

export function renderSave() {
  const box = $('#tab-save'); if (!box) return;
  const b = readBackup();
  const signedIn = !!cloud.user;
  const pend = UI.importPending;
  box.innerHTML = `<div class="savegrid">
    <section class="panel">
      <h2>Cloud save</h2>
      <p class="syncline" data-state="${cloud.state}">${STATE_TEXT[cloud.state]}${cloud.state === 'synced' && cloud.lastSync ? ' · ' + ago(cloud.lastSync) : ''}</p>
      ${cloud.message ? `<p class="muted">${cloud.message}</p>` : ''}
      ${signedIn ? `
        <p class="muted">Signed in as <b class="mono">${cloud.user.email}</b>. Your save follows you to any device where you sign in.</p>
        <div class="btnrow"><button class="btn" id="syncnow">Sync now</button><button class="btn" id="signout">Sign out</button></div>`
      : cloud.state === 'off' ? '' : `
        <p class="muted">Sign in with your strathun.github.io account to keep one save across your phone and computer.</p>
        <form id="signin" class="form" novalidate>
          <label for="si-email">Email</label><input id="si-email" type="email" autocomplete="email" required>
          <label for="si-pass">Password</label><input id="si-pass" type="password" autocomplete="current-password" required>
          <p class="formerr" id="si-err" role="alert"></p>
          <button class="btn primary" type="submit" id="si-go">Sign in</button>
        </form>`}
    </section>
    <section class="panel">
      <h2>Save code</h2>
      <p class="muted">A save code is a full copy of your game as text. Keep one somewhere safe, or paste it on another device.</p>
      <div class="btnrow"><button class="btn" id="copycode">Copy save code</button></div>
      <textarea id="codeout" class="code" readonly hidden aria-label="Your save code"></textarea>
      <label for="codein" class="label" style="margin-top:14px;display:block">Load a save code</label>
      <textarea id="codein" class="code" placeholder="VW2:…" aria-label="Paste a save code"></textarea>
      <p class="formerr" id="code-err" role="alert"></p>
      <div class="btnrow">${pend ? `<button class="btn primary" id="codeyes">Replace my game with this save</button><button class="btn" id="codeno">Cancel</button>` : `<button class="btn" id="codeload">Load save code</button>`}</div>
      ${pend ? `<p class="muted">This replaces your current game. Your current game will be kept as the backup.</p>` : ''}
    </section>
    <section class="panel">
      <h2>Backup</h2>
      ${b ? `<p class="muted">From ${new Date(b.at).toLocaleString()}, ${b.reason}.</p><div class="btnrow"><button class="btn" id="restore">Restore backup</button></div>`
        : '<p class="muted">No backup yet. One is kept automatically whenever a save is replaced.</p>'}
    </section>
    <section class="panel">
      <h2>Start over</h2><p class="muted">Wipes every stone, discovery and depth. Your current game is kept as the backup.</p>
      <div class="btnrow"><button class="btn" id="reset">${UI.confirmReset ? 'Click again to wipe everything' : 'Start over'}</button>${UI.confirmReset ? '<button class="btn" id="noreset">Keep my progress</button>' : ''}</div>
    </section>
    <p class="muted mono version">Vesselwright ${globalThis.VW_VERSION || 'dev'}</p>
  </div>`;
}

function replaceWith(next, reason, msg) {
  stashBackup(reason);
  setState(next); save();
  emit('state-replaced', { source: 'local' });
  toast(msg);
}

export function initSave() {
  const box = $('#tab-save');
  box.addEventListener('submit', async e => {
    if (e.target.id !== 'signin') return;
    e.preventDefault();
    const email = $('#si-email').value.trim(), pass = $('#si-pass').value, err = $('#si-err'), go = $('#si-go');
    if (!email || !pass) { err.textContent = 'Enter your email and password.'; return; }
    go.disabled = true; go.textContent = 'Signing in…'; err.textContent = '';
    try { await signIn(email, pass); toast('Signed in. Syncing your save.'); }
    catch (x) { err.textContent = x.message; go.disabled = false; go.textContent = 'Sign in'; }
  });
  box.addEventListener('click', async e => {
    const id = e.target.closest('button') && e.target.closest('button').id;
    if (!id) return;
    if (id === 'syncnow') { await sync(); }
    if (id === 'signout') { await signOut(); toast('Signed out. Your save stays on this device.'); }
    if (id === 'copycode') {
      const code = exportCode(), out = $('#codeout');
      out.value = code; out.hidden = false;
      try { await navigator.clipboard.writeText(code); toast('Save code copied.'); }
      catch (x) { out.focus(); out.select(); toast('Select the code below and copy it.'); }
    }
    if (id === 'codeload') {
      const err = $('#code-err');
      try { UI.importPending = parseCode($('#codein').value); UI.importText = $('#codein').value; renderSave(); $('#codein').value = UI.importText; }
      catch (x) { err.textContent = x.message; }
    }
    if (id === 'codeno') { UI.importPending = null; renderSave(); }
    if (id === 'codeyes' && UI.importPending) { const n = UI.importPending; UI.importPending = null; replaceWith(n, 'replaced by a save code', 'Save code loaded.'); }
    if (id === 'restore') {
      const bk = readBackup(); if (!bk) return;
      let next; try { next = migrate(structuredClone(bk.data)); } catch (x) { toast(x.message); return; }
      replaceWith(next, 'replaced by restoring a backup', 'Backup restored. The game you had is now the backup.');
    }
    if (id === 'reset') {
      if (!UI.confirmReset) { UI.confirmReset = true; renderSave(); return; }
      UI.confirmReset = false; stashBackup('wiped by Start over');
      fresh(); save(); emit('state-replaced', { source: 'local' }); toast('A fresh lattice.');
    }
    if (id === 'noreset') { UI.confirmReset = false; renderSave(); }
  });
}
