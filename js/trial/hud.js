import { BRK, STAT } from '../data.js';
import { S } from '../state.js';
import { T, endTrial, selectRite, spawn } from './combat.js';
import { tileHTML } from '../ui/tiles.js';
import { $, clamp, fmt } from '../util.js';

export function gainsHTML(){const g=T.gains;const li=[];
  if(g.shards)li.push(`${g.shards}▪ Shards`);g.stones.forEach(s=>li.push(`Found a ${s} stone`));g.lvl.forEach(s=>li.push(s));g.disc.forEach(s=>li.push(s));
  return li.length?`<ul>${li.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p class="muted">Nothing new this time.</p>';}
export function showOver(title,body,btns){
  const o=$('#tOver');o.innerHTML=`<div class="card"><h2>${title}</h2>${body}<div class="btnrow">${btns.map(([l,a,p])=>`<button class="btn${p?' primary':''}" data-over="${a}">${l}</button>`).join('')}</div></div>`;o.hidden=false;
  const f=o.querySelector('.primary');if(f)f.focus();
}
$('#tOver').addEventListener('click',e=>{const b=e.target.closest('[data-over]');if(!b)return;const a=b.dataset.over;
  if(a==='next'){T.idx++;spawn();buildDock();}
  if(a==='home')endTrial();
});
export function buildDock(){
  if(!T)return;
  $('#dock').innerHTML=T.rites.map((R,i)=>`<button class="rbtn${i===T.sel?' sel':''}" data-rite="${i}">${tileHTML(S.stones[R.uid],{sm:true})}<span class="t"><span class="n">${i<9?(i+1)+'. ':''}${R.name}</span><span class="c">tempo ${R.tempo} · strain ${R.strain}</span></span></button>`).join('');
}
$('#dock').addEventListener('click',e=>{const b=e.target.closest('[data-rite]');if(!b||!T)return;selectRite(+b.dataset.rite);});
export const setW=(id,v)=>{$(id).style.width=clamp(v,0,100)+'%';};
export function chips(arr){return arr.map(([t,c,title])=>`<span class="chip ${c||''}" title="${title||''}">${t}</span>`).join('');}
export let lastChipsY='',lastChipsE='';
export function hud(){
  const E=T.en;
  setW('#gHp',T.hp/T.max*100);$('#vHp').textContent=`${Math.ceil(T.hp)}/${T.max}`;
  setW('#gSh',Math.min(100,T.shield/T.max*100*2));$('#vSh').textContent=fmt(T.shield);
  setW('#gTe',T.tempo);$('#vTe').textContent=Math.floor(T.tempo);
  const R=T.rites[T.sel];$('#mTe').style.left=(R?R.tempo:0)+'%';
  setW('#gSt',T.strain);$('#vSt').textContent=Math.round(T.strain);
  $('#hFury').textContent=T.fury>0?`Fury ${fmt(T.fury)}`:'';
  const bm={};T.boons.forEach(b=>{bm[b.k]=(bm[b.k]||0)+1;});
  const yc=Object.keys(bm).map(k=>[STAT[k].n+(bm[k]>1?' ×'+bm[k]:''),'b',STAT[k].d]);
  if(T.chill>0)yc.push(['Chilled','d','your tempo refills slower']);
  if(T.fuseQ.length)yc.push([`Fused ×${T.fuseQ.length}`,'b','detonates after your next rite']);
  if(T.shEl)yc.push([`${T.shEl.name} ward`,'b','lashes back when struck']);
  const ys=chips(yc);if(ys!==lastChipsY){$('#cYou').innerHTML=ys;lastChipsY=ys;}
  $('#eName').textContent=E.def.name;$('#eFam').textContent=`${E.def.fam}${T.mode==='descent'?` · depth ${T.depth} · ${T.idx+1}/${T.line.length}`:''}`;
  if(E.def.effigy){setW('#gEh',100);$('#vEh').textContent='∞';}else{setW('#gEh',E.hp/E.max*100);$('#vEh').textContent=`${Math.max(0,Math.ceil(E.hp))}`;}
  setW('#gEc',E.charge*100);$('#vEc').textContent=Math.floor(E.charge*100)+'%';
  const m=E.next;let pw=m.pow*E.ps*(E.parts[m.p].broken?.4:1)*Math.pow(.8,E.weak)*(E.focus?1.6:1)*(1-E.hollow);
  $('#eTele').innerHTML=E.def.effigy&&!S.opt.effigyHits?'Standing still.':`Next: <b>${m.n}</b>${m.pow?` ~${fmt(pw)}`:''} <span class="muted">from the ${E.parts[m.p].n.toLowerCase()}${m.fx==='pierceWard'?' · half pierces ward':''}${m.fx==='drain'?' · feeds on you':''}${m.fx==='strainUp'?' · raises strain':''}${m.fx==='chillYou'?' · chills your tempo':''}${m.fx==='rot'?' · rots your ward':''}</span>`;
  const sm={};E.st.forEach(s=>{sm[s.k]=(sm[s.k]||0)+1;});
  const ec=Object.keys(sm).map(k=>[STAT[k].n+(sm[k]>1?' ×'+sm[k]:''),'d',STAT[k].d]);
  if(E.hollow>0)ec.push([`Hollow −${Math.round(E.hollow*100)}%`,'d','next attack weakened']);
  if(E.shield>0)ec.push([`Shield ${fmt(E.shield)}`,'',"absorbs harm"]);
  if(E.enrage>0)ec.push([`Quickened +${Math.round(E.enrage*100)}%`,'','charges faster']);
  if(E.focus)ec.push(['Focused','','next blow ×1.6']);
  if(E.def.passive==='aegis'&&!E.parts[0].broken)ec.push(['Aegis','','halves harm that does not crit, while the visor holds']);
  E.parts.forEach(p=>{if(p.broken)ec.push([p.n+' broken','b',BRK[p.brk]]);});
  const es=chips(ec);if(es!==lastChipsE){$('#cEn').innerHTML=es;lastChipsE=es;}
  document.querySelectorAll('#dock .rbtn').forEach((b,i)=>{const r=T.rites[i];b.classList.toggle('poor',!!r&&T.tempo<r.tempo);});
  $('#bFreeze').innerHTML=T.phase==='freeze'?'Resume <kbd>F</kbd>':'Freeze <kbd>F</kbd>';
  $('#bExec').disabled=T.phase!=='freeze';
  let fl='';
  if(T.phase==='freeze'&&R){const part=E.parts[T.aim];fl=`<b>${R.name}</b> at the <b>${part.n.toLowerCase()}</b>${R.tempo>T.tempo?' · <span style="color:var(--blood)">needs '+R.tempo+' tempo</span>':''}`;}
  else if(T.phase==='run')fl=T.windup&&!T.braceUsed?'<b style="color:#f0b0a8">Brace!</b> Press Space as the blow lands.':'Time runs. Freeze to act.';
  else if(T.phase==='chain')fl=`Strike the ring: ${T.ch.opts.map((r,i)=>`<b>${i===0?'Space':i+1}</b> ${r.name}`).join(' · ')}`;
  else if(T.phase==='resolve')fl='…';
  if($('#focusline').innerHTML!==fl)$('#focusline').innerHTML=fl;
}
