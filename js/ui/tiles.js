import { EL, FX } from '../data.js';
import { stoneName, symOf } from '../engine/rites.js';
import { stoneCls } from '../state.js';

export function facetColor(f){const F=FX[f];return F.cls==='verb'?'#e2d6b8':F.cls==='mod'?'#cda65b':EL[F.el].hex;}
export function pips(st){return st.mastered?'◆'.repeat(5):'●'.repeat(st.lv)+'○'.repeat(5-st.lv);}
export function tileHTML(st,o={}){
  const cols=st.f.map(facetColor);
  const bg=cols.length===1?cols[0]:`linear-gradient(135deg,${cols.map((c,i)=>`${c} ${Math.round(i*100/(cols.length-1))}%`).join(',')})`;
  return `<div class="tile ${stoneCls(st)}${o.sm?' sm':''}${o.held?' held':''}" style="--tbg:${bg}" ${o.attr||''} title="${stoneName(st)} — level ${st.lv}"><span class="sym">${symOf(st)}</span>${o.sm?'':`<span class="nm">${stoneName(st)}</span>`}<span class="pips">${pips(st)}</span></div>`;
}
