// Boot: load the local save, render, then connect optional cloud sync and offline support.
import './trial/input.js';
import { load } from './state.js';
import { on } from './bus.js';
import { renderPurse, renderTab, setTab } from './ui/app.js';
import { initSave, renderSave, renderSyncPill } from './ui/save.js';
import { toast } from './ui/toast.js';
import { UI } from './ui/ui-state.js';
import { initCloud, setReplaceGuard } from './cloud.js';
import { T } from './trial/combat.js';
import { stoneName } from './engine/rites.js';

on('discover', d => { if (!d.k.startsWith('r:')) toast(`<b>Recorded</b> ${d.name} <b>+${d.v}◇</b>`); });
on('levelup', d => toast(`<b>${stoneName(d.st)}</b> reached level ${d.st.lv}`));
on('mastered', d => toast(`<b>Mastered.</b> A new ${stoneName(d.st)} crystallized in your satchel.`));
on('state-replaced', d => {
  Object.assign(UI, { held: null, view: null, fa: null, fb: null, confirmReset: false, importPending: null });
  renderPurse(); renderTab();
  if (d.source === 'cloud') toast('Loaded your newer save from the cloud.');
});
on('cloud', () => { renderSyncPill(); if (UI.tab === 'save') renderSave(); });

load();
renderPurse();
initSave();
setTab('bench');
renderSyncPill();
setReplaceGuard(() => !T);
initCloud();
document.getElementById('syncpill').addEventListener('click', () => setTab('save'));

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Offline support unavailable:', e));
}
