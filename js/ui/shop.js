import { FX, PRICE } from '../data.js';
import { S, mkStone, restock } from '../state.js';
import { commit } from './app.js';
import { tileHTML } from './tiles.js';
import { toast } from './toast.js';
import { UI } from './ui-state.js';
import { $ } from '../util.js';

export const filCost=()=>15+10*S.buys.fil, hpCost=()=>25+15*S.buys.hp;
export function renderShop(){
  $('#tab-shop').innerHTML=`<div class="shop"><div><div class="board-head"><h2>Stones on offer</h2><button class="btn" id="reroll" ${S.shards<5?'disabled':''}>New stock · 5▪</button></div>
    <div class="wares">${S.stock.map((f,i)=>f?`<div class="ware">${tileHTML({f:[f],lv:1,mastered:false})}<div class="info"><h3>${FX[f].name}</h3><p>${FX[f].d}</p><button class="btn" data-buy="${i}" ${S.shards<PRICE[FX[f].rar]?'disabled':''}>Buy · ${PRICE[FX[f].rar]}▪</button></div></div>`:`<div class="ware"><div class="info"><p>Sold.</p></div></div>`).join('')}</div>
    <p class="hint">Stock turns over each time you return from the Undercroft.</p></div>
    <div class="panel"><h2>The Vessel</h2>
      <div class="ware" style="border:none;padding:0"><div class="info"><h3>Filament spool</h3><p>Two more lengths of filament. You hold ${S.filament}.</p><button class="btn" id="buyfil" ${S.shards<filCost()?'disabled':''}>Buy · ${filCost()}▪</button></div></div>
      <div class="ware" style="border:none;padding:0;margin-top:12px"><div class="info"><h3>Tempered frame</h3><p>+15 vigor. The Vessel holds ${S.vMax}.</p><button class="btn" id="buyhp" ${S.shards<hpCost()?'disabled':''}>Buy · ${hpCost()}▪</button></div></div>
      <p class="hint">Sockets are opened with Insight, on the lattice itself.</p></div></div>`;
}
$('#tab-shop').addEventListener('click',e=>{
  const b=e.target.closest('[data-buy]');if(b){const i=+b.dataset.buy,f=S.stock[i],p=PRICE[FX[f].rar];if(S.shards>=p){S.shards-=p;const u=mkStone([f]);S.stock[i]=null;UI.view=u;toast(`<b>${FX[f].name}</b> added to your satchel.`);commit();}return;}
  if(e.target.closest('#reroll')&&S.shards>=5){S.shards-=5;restock();commit();}
  if(e.target.closest('#buyfil')&&S.shards>=filCost()){S.shards-=filCost();S.buys.fil++;S.filament+=2;commit();}
  if(e.target.closest('#buyhp')&&S.shards>=hpCost()){S.shards-=hpCost();S.buys.hp++;S.vMax+=15;commit();}
});
