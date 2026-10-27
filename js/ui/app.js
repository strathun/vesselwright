import { S, onBoard, save } from '../state.js';
import { renderBench } from './bench.js';
import { renderCodex } from './codex.js';
import { renderDescend } from './descend.js';
import { renderFuse } from './fuse.js';
import { renderShop } from './shop.js';
import { renderSave } from './save.js';
import { UI } from './ui-state.js';
import { $ } from '../util.js';

export function renderPurse(){$('#insight').textContent=S.insight;$('#shards').textContent=S.shards;}
export function commit(){save();renderPurse();renderTab();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,uid=b.dataset.uid;
  if(a==='unsock'){const p=onBoard(uid);if(p>=0)S.board[p]=null;UI.held=null;UI.view=uid;commit();}
  if(a==='tofuse'){UI.held=null;UI.fa=uid;UI.fb=null;setTab('fuse');}
});
export function setTab(t){UI.tab=t;document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false'));
  ['bench','fuse','codex','shop','descend','save'].forEach(x=>$('#tab-'+x).hidden=x!==t);if(t!=='save')UI.confirmReset=false;renderTab();}
export function renderTab(){const t=UI.tab;if(t==='bench')renderBench();if(t==='fuse')renderFuse();if(t==='codex')renderCodex();if(t==='shop')renderShop();if(t==='descend')renderDescend();if(t==='save')renderSave();
  const ready=Object.entries(S.res).some(([k,v])=>v>=100&&k.split('|').every(u=>S.stones[u]));
  const fb=document.querySelector('#tabs [data-tab="fuse"]');fb.innerHTML='Fusion'+(ready?'<span class="dot" title="A pair is fully resonant"></span>':'');}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)setTab(b.dataset.tab);});
