import { T, bracePress, chainPress, execute, freeze, leave, selectRite, unfreeze } from './combat.js';
import { cv, hitTest } from './view.js';
import { $ } from '../util.js';

cv.addEventListener('pointerdown',e=>{
  if(!T||T.phase==='over')return;const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
  if(T.phase==='chain'){chainPress(0);return;}
  if(T.phase==='run'&&T.windup&&!T.braceUsed){bracePress();return;}
  const p=hitTest(mx,my);
  if(T.phase==='run'){freeze();if(p>=0)T.aim=p;return;}
  if(T.phase==='freeze'&&p>=0){if(p===T.aim)execute();else T.aim=p;}
});
document.addEventListener('keydown',e=>{
  if(!T)return;
  if(T.phase==='over'){return;}
  const k=e.key;
  if(k===' '){e.preventDefault();if(T.phase==='chain')chainPress(0);else bracePress();return;}
  if(k==='f'||k==='F'){e.preventDefault();if(T.phase==='freeze')unfreeze();else freeze();return;}
  if(k==='Escape'){unfreeze();return;}
  if(/^[1-9]$/.test(k)){const n=+k-1;if(T.phase==='chain'){chainPress(n-0);return;}selectRite(n);return;}
  if(k==='e'||k==='E'||k==='Enter'){e.preventDefault();execute();return;}
  if(T.phase==='freeze'&&(k==='ArrowLeft'||k==='ArrowRight')){e.preventDefault();const n=T.en.parts.length;T.aim=(T.aim+(k==='ArrowRight'?1:n-1))%n;}
});
$('#bFreeze').addEventListener('click',()=>{if(!T)return;if(T.phase==='freeze')unfreeze();else freeze();});
$('#bExec').addEventListener('click',()=>{if(T)execute();});
$('#bLeave').addEventListener('click',leave);
