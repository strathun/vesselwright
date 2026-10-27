import { DEPTHS, EN, lineup } from '../data.js';
import { S, save } from '../state.js';
import { startTrial } from '../trial/combat.js';
import { $ } from '../util.js';

export function renderDescend(){
  const n=Math.max(S.maxDepth,1);const cards=[];
  for(let d=1;d<=n;d++)cards.push(d);
  const up=n+1;
  $('#tab-descend').innerHTML=`<div class="board-head"><h2>The Undercroft</h2><span class="label">your lattice is sealed for the whole descent</span></div>
   <div class="depths">
    <div class="depth"><span class="num">0</span><h3>Proving Ground</h3><ul><li>A practice effigy that cannot fall</li><li>Discoveries count in full; stones grow at half pace</li><li>No shards, no risk</li></ul><button class="btn" data-go="0">Enter</button></div>
    ${cards.map(d=>`<div class="depth"><span class="num">${d}</span><h3>Depth ${d}${d>=DEPTHS.length?' · the deep':''}</h3><ul>${lineup(d).map(k=>`<li>${S.codex['x:'+k]||Object.keys(S.codex).some(c=>c.startsWith('b:'+k+':'))?EN[k].name:'Something unmet'}${EN[k].boss?' (warden)':''}</li>`).join('')}</ul><button class="btn primary" data-go="${d}">Descend</button></div>`).join('')}
    <div class="depth lock"><span class="num">${up}</span><h3>Depth ${up}</h3><ul><li>Clear depth ${n} to open the way</li></ul></div>
   </div>
   <div class="shop" style="margin-top:20px"><div class="panel"><h2>How the descent works</h2>
     <p class="muted" style="font-size:.9rem;max-width:62ch">Time runs. The foe charges, your tempo fills. Freeze time to aim: pick a rite, pick a part, and watch it resolve. If another verb shares the rite's mesh, a ring closes after it lands; strike the ring to chain. When the foe's charge is about to break, strike to brace. Everything your stones learn on the way down, they keep, even if the Vessel falls.</p>
     <div class="keys"><kbd>F</kbd><span>Freeze or resume time</span><kbd>1–9</kbd><span>Choose a rite (freezes time)</span><kbd>← →</kbd><span>Change the aimed part, or click it</span><kbd>E</kbd><span>Execute the rite (or click the aimed part again)</span><kbd>Space</kbd><span>Strike the ring: chain, or brace against a blow</span></div><div class="keys touchkeys"><kbd>Tap foe</kbd><span>Freeze time and aim at that part</span><kbd>Tap again</kbd><span>Execute the chosen rite on the aimed part</span><kbd>Rite bar</kbd><span>Choose a rite</span><kbd>Tap</kbd><span>When the ring closes, or as a blow lands: chain or brace</span></div></div>
    <div class="panel"><h2>Options</h2><div class="opts">
      <label><input type="checkbox" id="optAuto" ${S.opt.auto?'checked':''}> Freeze automatically when tempo is full</label>
      <label><input type="checkbox" id="optEff" ${S.opt.effigyHits?'checked':''}> The effigy strikes back</label></div></div></div>`;
}
$('#tab-descend').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){const d=+g.dataset.go;startTrial(d===0?'proving':'descent',d);}});
$('#tab-descend').addEventListener('change',e=>{if(e.target.id==='optAuto')S.opt.auto=e.target.checked;if(e.target.id==='optEff')S.opt.effigyHits=e.target.checked;save();});
