import { COLS, LV, ROWS } from './data.js';

export const $=s=>document.querySelector(s);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const fmt=n=>Math.abs(n)>=10?String(Math.round(n)):(Math.round(n*10)/10).toString();
export const lk=(a,b)=>a<b?a+'-'+b:b+'-'+a;
export const rk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
export const lvOf=xp=>{let l=1;for(let i=1;i<LV.length;i++)if(xp>=LV[i])l=i+1;return l;};
export function neighbors(i){const r=Math.floor(i/COLS),c=i%COLS,o=[];if(c>0)o.push(i-1);if(c<COLS-1)o.push(i+1);if(r>0)o.push(i-COLS);if(r<ROWS-1)o.push(i+COLS);return o;}
