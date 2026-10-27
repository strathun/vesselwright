import { FX, LV } from '../data.js';
import { recordDisc } from '../engine/discovery.js';
import { stoneName } from '../engine/rites.js';
import { S, mkStone, onBoard, res, stoneCls } from '../state.js';
import { commit } from './app.js';
import { tileHTML } from './tiles.js';
import { toast } from './toast.js';
import { UI } from './ui-state.js';
import { $ } from '../util.js';

export function fuseCost(a,b){return Math.max(0,Math.ceil((100-res(a,b))*.3));}
export function renderFuse(){
  const A=UI.fa&&S.stones[UI.fa],B=UI.fb&&S.stones[UI.fb];
  let preview='<p class="muted">Choose two stones. Stones that have worked side by side resonate; at full resonance, fusion is free. Before that, Insight makes up the difference.</p>';
  if(A&&B){
    const f=[...A.f,...B.f];
    if(f.length>3)preview=`<p class="muted">A stone can hold at most three facets. These two together hold ${f.length}.</p>`;
    else{const lv=Math.max(1,Math.round((A.lv+B.lv)/2));const tmp={f,lv,mastered:false,xp:LV[lv-1]};const cost=fuseCost(A.uid,B.uid);const r=res(A.uid,B.uid);
      preview=`<div style="display:flex;gap:14px;align-items:center;margin-top:6px">${tileHTML(tmp)}<div><h3>${stoneName(tmp)}</h3><div class="label">${{verb:'Verb',mod:'Modifier',ess:'Essence'}[stoneCls(tmp)]} · level ${lv}</div></div></div>
      <ul class="facets">${f.map(x=>`<li><b>${FX[x].name}.</b> ${FX[x].d}</li>`).join('')}</ul>
      <p class="muted" style="font-size:.86rem">${stoneCls(tmp)==='verb'?'Its own modifiers apply first, in facet order, before anything it reaches along filament. Two verbs fire together for less tempo than apart.':stoneCls(tmp)==='mod'?'Applies each of its modifiers in turn, from one socket.':'Counts as every essence it holds.'}</p>
      <div class="resmeter kv"><span class="label">Resonance</span><span class="bar"><i style="width:${r}%;background:${r>=100?'#f2d58d':'var(--brass2)'}"></i></span><span class="mono muted">${Math.round(r)}</span></div>
      <div class="btnrow"><button class="btn primary" id="doFuse" ${S.insight<cost?'disabled':''}>Fuse${cost?` for ${cost}◇`:''}</button><span class="muted" style="align-self:center;font-size:.85rem">${cost&&S.insight<cost?'Not enough Insight.':''}</span></div>`;}
  }
  const ready=Object.entries(S.res).filter(([k,v])=>v>=100).map(([k])=>k.split('|')).filter(([a,b])=>S.stones[a]&&S.stones[b]&&S.stones[a].f.length+S.stones[b].f.length<=3);
  const all=Object.values(S.stones).sort((a,b)=>stoneName(a).localeCompare(stoneName(b)));
  $('#tab-fuse').innerHTML=`<div class="fuse"><div class="panel">
      <h2>Fusion</h2>
      <div class="slots"><button class="slot" data-slot="a">${A?tileHTML(A):'First'}</button><span class="plus">+</span><button class="slot" data-slot="b">${B?tileHTML(B):'Second'}</button></div>
      ${preview}
    </div><div class="panel">
      <h2>Resonant pairs</h2>${ready.length?`<ul class="pairs">${ready.map(([a,b])=>`<li><button data-pair="${a},${b}">${tileHTML(S.stones[a],{sm:true})}${tileHTML(S.stones[b],{sm:true})}<span>${stoneName(S.stones[a])} + ${stoneName(S.stones[b])}</span></button></li>`).join('')}</ul>`:'<p class="muted">None yet. Use stones together in the Undercroft and they will start to hum.</p>'}
      <h2 style="margin-top:16px">All stones</h2>
      <div class="stonelist">${all.map(st=>`<span class="wrap">${onBoard(st.uid)>=0?'<span class="on">ON</span>':''}${tileHTML(st,{held:st.uid===UI.fa||st.uid===UI.fb,attr:`data-fpick="${st.uid}" role="button" tabindex="0"`})}</span>`).join('')}</div>
    </div></div>`;
}
$('#tab-fuse').addEventListener('click',e=>{
  const p=e.target.closest('[data-fpick]');if(p){const u=p.dataset.fpick;if(u===UI.fa)UI.fa=null;else if(u===UI.fb)UI.fb=null;else if(!UI.fa)UI.fa=u;else UI.fb=u;renderFuse();return;}
  const s=e.target.closest('[data-slot]');if(s){if(s.dataset.slot==='a')UI.fa=null;else UI.fb=null;renderFuse();return;}
  const pr=e.target.closest('[data-pair]');if(pr){[UI.fa,UI.fb]=pr.dataset.pair.split(',');renderFuse();return;}
  if(e.target.closest('#doFuse'))doFuse(UI.fa,UI.fb);
});
export function doFuse(a,b){
  const A=S.stones[a],B=S.stones[b];if(!A||!B)return;const f=[...A.f,...B.f];if(f.length>3)return;
  const cost=fuseCost(a,b);if(S.insight<cost)return;S.insight-=cost;
  const lv=Math.max(1,Math.round((A.lv+B.lv)/2));const nu=mkStone(f,lv);const N=S.stones[nu];
  ['beast','construct','wraith'].forEach(k=>N.aff[k]=Math.max(A.aff[k],B.aff[k]));
  const sa=onBoard(a),sb=onBoard(b);
  if(sa>=0){S.board[sa]=nu;if(sb>=0)S.board[sb]=null;}else if(sb>=0)S.board[sb]=nu;
  delete S.stones[a];delete S.stones[b];
  Object.keys(S.res).forEach(k=>{const [x,y]=k.split('|');if(!S.stones[x]||!S.stones[y])delete S.res[k];});
  recordDisc(['f:first']);
  toast(`<b>${stoneName(N)}</b> is born.`);
  UI.fa=nu;UI.fb=null;UI.view=nu;commit();
}
