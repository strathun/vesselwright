import { BRK, EL, ELS, EN, FX, KIND_INFO, KN, MODS, PAIR, pk } from '../data.js';
import { discName } from '../engine/discovery.js';
import { S } from '../state.js';
import { $ } from '../util.js';

export function renderCodex(){
  const C=S.codex;
  const kinds=Object.keys(KN);
  const kf=kinds.filter(k=>C['k:'+k]).length;
  const pairs=[];ELS.forEach((a,i)=>ELS.forEach((b,j)=>{if(j>=i)pairs.push(pk(a,b));}));
  const ef=ELS.filter(e=>C['e:'+e]).length+pairs.filter(p=>C['e:'+p]).length;
  const triples=Object.keys(C).filter(k=>k.startsWith('e3:'));
  const sf=Object.keys(C).filter(k=>k.startsWith('s:')).length;
  const forms=Object.keys(C).filter(k=>k.startsWith('r:')).length;
  const enemies=Object.keys(EN).filter(k=>k!=='effigy');
  const feats=[['c2','Chain of 2'],['c3','Chain of 3'],['c4','Chain of 4'],['c5','Chain of 5'],['cascade','Cascade'],['deluge','Deluge'],['overreach','Overreach'],['absorb','An element drunk'],['f:first','First fusion']];
  const masteries=Object.keys(C).filter(k=>k.startsWith('m:'));
  $('#tab-codex').innerHTML=`<div class="codex">
   <section><div class="secthead"><h2>Rite forms</h2><span class="mono muted">${kf} / 8</span></div>
    <div class="cgrid">${kinds.map(k=>{const f=C['k:'+k];return `<div class="ccard ${f?'found':'lost'}"><h3 class="${f?KN[k][1]:''}">${f?KN[k][0]:'Unrecorded'}</h3><p>${f?KIND_INFO[k][0]:'“'+KIND_INFO[k][1]+'”'}</p></div>`;}).join('')}</div></section>
   <section><div class="secthead"><h2>Essences</h2><span class="mono muted">${ef} / 20${triples.length?` · ${triples.length} beyond`:''}</span></div>
    <div class="matrix"><table><tr><th></th>${ELS.map(e=>`<th style="color:${C['e:'+e]?EL[e].hex:'var(--faint)'}">${EL[e].sym}</th>`).join('')}</tr>
    ${ELS.map((a,i)=>`<tr><th style="color:${C['e:'+a]?EL[a].hex:'var(--faint)'}">${EL[a].sym}</th>${ELS.map((b,j)=>{if(j<i)return '<td class="x"></td>';const k=pk(a,b);return C['e:'+k]?`<td class="f" style="background:linear-gradient(135deg,${EL[a].hex},${EL[b].hex})">${PAIR[k]}</td>`:'<td>?</td>';}).join('')}</tr>`).join('')}</table></div>
    ${triples.length?`<p class="muted" style="font-size:.85rem">Beyond pairs: ${triples.map(k=>discName(k).replace('Essence — ','')).join(', ')}</p>`:'<p class="muted" style="font-size:.85rem">Three or more essences reaching one verb make something stranger.</p>'}</section>
   <section><div class="secthead"><h2>Concordance</h2><span class="mono muted">${sf} / 81 · one modifier applied right after another</span></div>
    <div class="matrix conc"><table><tr><th>then →</th>${MODS.map(m=>`<th>${FX[m].sym}</th>`).join('')}</tr>${MODS.map(a=>`<tr><th>${FX[a].name}</th>${MODS.map(b=>C['s:'+a+'>'+b]?`<td class="f" title="${FX[a].name} then ${FX[b].name}"></td>`:'<td></td>').join('')}</tr>`).join('')}</table></div></section>
   <section><div class="secthead"><h2>Bestiary</h2><span class="mono muted">${enemies.filter(e=>C['x:'+e]).length} / ${enemies.length} felled</span></div>
    <div class="cgrid">${enemies.map(e=>{const E=EN[e],f=C['x:'+e];return `<div class="ccard ${f?'found':'lost'}"><h3>${f||Object.keys(C).some(k=>k.startsWith('b:'+e+':'))?E.name:'Unmet'}</h3><p>${E.fam}${E.boss?' · warden':''}</p><p>${E.parts.map(p=>C['b:'+e+':'+p.n]?`<span style="color:var(--bone)">${p.n} — ${BRK[p.brk]}</span>`:`<span>${f?p.n:'?'} unbroken</span>`).join('<br>')}</p></div>`;}).join('')}</div></section>
   <section><div class="secthead"><h2>Feats</h2><span class="mono muted">${forms} formulations tested · ${masteries.length} masteries</span></div>
    <div class="feats">${feats.map(([k,n])=>`<span class="feat ${C[k]?'found':''}">${C[k]?n:'?'}</span>`).join('')}${masteries.map(k=>`<span class="feat found">${discName(k)}</span>`).join('')}</div></section>

  </div>`;
}
