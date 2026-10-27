import { COLS, EL, FX, LV, NS, ROWS, STAT } from '../data.js';
import { discName } from '../engine/discovery.js';
import { allRites, stoneName, summarize } from '../engine/rites.js';
import { S, linked, onBoard, res, satchelStones, stoneCls } from '../state.js';
import { commit } from './app.js';
import { tileHTML } from './tiles.js';
import { toast } from './toast.js';
import { UI } from './ui-state.js';
import { $, lk, neighbors } from '../util.js';

export const unlockCost=()=>10+6*S.unlockCount;
export const filUsed=()=>Object.keys(S.links).length;
export function renderBoard(){
  const b=$('#board');let h='';
  for(let i=0;i<NS;i++){const r=Math.floor(i/COLS),c=i%COLS;
    const L=((c+.5)/COLS*100).toFixed(2),Tp=((r+.5)/ROWS*100).toFixed(2);
    if(!S.unlocked[i]){const cost=unlockCost();h+=`<button class="sock locked${S.insight>=cost?' afford':''}" style="left:${L}%;top:${Tp}%" data-sock="${i}" aria-label="Unlock socket for ${cost} insight">◇${cost}</button>`;continue;}
    const u=S.board[i];const held=UI.held&&UI.held.uid===u&&u;
    h+=`<button class="sock${UI.held&&!u?' target':''}" style="left:${L}%;top:${Tp}%" data-sock="${i}" aria-label="Socket ${i+1}${u?': '+stoneName(S.stones[u]):' (empty)'}">${u?tileHTML(S.stones[u],{held}):''}</button>`;
  }
  for(let i=0;i<NS;i++){const r=Math.floor(i/COLS),c=i%COLS;
    [[i+1,c<COLS-1,'h'],[i+COLS,r<ROWS-1,'v']].forEach(([j,ok,dir])=>{
      if(!ok||!S.unlocked[i]||!S.unlocked[j])return;
      const on=linked(i,j);const a=S.board[i],bb=S.board[j];const rv=(on&&a&&bb)?res(a,bb)/100:0;
      const cx=dir==='h'?((c+1)/COLS*100):((c+.5)/COLS*100), cy=dir==='h'?((r+.5)/ROWS*100):((r+1)/ROWS*100);
      const sz=dir==='h'?`width:7.5%;height:5%`:`width:2.6%;height:9.4%`;
      h+=`<button class="bridge ${dir}${on?' on':''}${rv>=1?' ready':''}" style="left:${cx}%;top:${cy}%;${sz};--res:${rv.toFixed(2)}" data-link="${i},${j}" aria-label="${on?'Remove':'Lay'} filament" title="${on?'Filament'+(rv>0?' — resonance '+Math.round(rv*100):''):'Lay filament'}"></button>`;});
  }
  b.innerHTML=h;
  $('#filament').textContent=`Filament ${filUsed()} / ${S.filament}`;
}
export function riteCard(R){
  const st=S.stones[R.uid];
  const flow=[`<li class="v">${R.verbs.map(v=>FX[v].name).join('+')}</li>`];
  if(R.pool)flow.push(`<li class="arrow">←</li><li class="e" style="background:${R.pool.keys.length===1?EL[R.pool.keys[0]].hex:`linear-gradient(90deg,${R.pool.keys.map(k=>EL[k].hex).join(',')})`}">${R.pool.name}</li>`);
  R.modSeq.forEach(m=>flow.push(`<li class="arrow">→</li><li class="m">${FX[m.f].name}</li>`));
  const res=summarize(R.packets).map(x=>`<li><span class="kind ${x.kc}">${x.kn}</span><span>→ ${x.tg}</span><span class="mono">${x.ms}</span>${x.fuse?'<span class="label">fused</span>':''}</li>`).join('');
  let riders='';
  if(R.pool){const fo=R.packets.some(p=>p.side==='foe'),se=R.packets.some(p=>p.side==='self'&&(p.kind==='hex'||p.kind==='mend')),wa=R.packets.some(p=>p.side==='self'&&p.kind==='ward');
    const parts=[];
    if(fo)parts.push('Curses: '+R.pool.keys.map(k=>`${STAT[EL[k].status].n} ${Math.round(R.pool.pot[k]*100)}%`).join(', '));
    if(se)parts.push('Boons: '+R.pool.keys.map(k=>STAT[EL[k].boon].n).join(', '));
    if(wa)parts.push('Ward lashes back with '+R.pool.keys.map(k=>STAT[EL[k].status].n).join(', '));
    riders=`<p class="riders">${parts.join(' · ')}</p>`;}
  const chains=R.chain.length?`<p class="chains">Chains into ${R.chain.map(s=>stoneName(S.stones[S.board[s]])).join(', ')}</p>`:'';
  const pend=R.disc.filter(k=>!S.codex[k]);
  const named=pend.filter(k=>!k.startsWith('r:')).map(k=>discName(k).replace(/^.*? — /,''));
  const unrec=pend.length?`<p class="unrec">◇ Unrecorded${named.length?': '+named.join(' · '):''}${pend.some(k=>k.startsWith('r:'))?(named.length?' · ':': ')+'untested formulation':''}</p>`:'';
  const trace=`<details class="trace"><summary>Trace</summary><ol>${R.trace.map(t=>`<li><b>${t.label}</b>${t.lines.map(l=>`<span class="pl">${l}</span>`).join('')}</li>`).join('')}</ol>${R.overflow?'<p class="riders">Packets overflowed the lattice; the excess turned to strain.</p>':''}</details>`;
  return `<article class="rite"><header>${tileHTML(st,{sm:true})}<div><h3>${R.name}</h3><div class="meta">Tempo ${R.tempo}${R.raw>100?' (overreach)':''} · Strain ${R.strain}${R.packets.some(p=>p.side==='foe'&&p.kind!=='mend')?' · Aim '+R.acc:''} · ${R.packets.length} packet${R.packets.length>1?'s':''}</div></div></header>
    <ol class="flow">${flow.join('')}</ol><ul class="result">${res}</ul>${riders}${chains}${unrec}${trace}</article>`;
}
export function renderReadout(){
  const rites=allRites();
  let h='<div class="board-head"><h2>Rites</h2><span class="label">what each verb will do</span></div>';
  if(!rites.length)h+='<p class="dormant">No verb stones are socketed. Strike, Lance, Ward, Mend and Hex are verbs; everything else shapes them.</p>';
  h+=rites.map(riteCard).join('');
  // dormant meshes: components with non-verb stones but no verb
  const seen=new Set();let dormant=0;
  for(let i=0;i<NS;i++){if(seen.has(i)||!S.board[i])continue;const comp=[i],q=[i];seen.add(i);
    while(q.length){const s=q.shift();neighbors(s).forEach(n=>{if(!seen.has(n)&&linked(s,n)){seen.add(n);comp.push(n);q.push(n);}});}
    if(!comp.some(s=>S.board[s]&&stoneCls(S.stones[S.board[s]])==='verb'))dormant++;}
  if(dormant)h+=`<p class="dormant">${dormant} socketed stone${dormant>1?'s sit':' sits'} in a mesh with no verb. ${dormant>1?'They do':'It does'} nothing until filament reaches a verb.</p>`;
  $('#readout').innerHTML=h;
}
export function renderSatchel(){
  const list=satchelStones();
  const order={verb:0,ess:1,mod:2};
  list.sort((a,b)=>order[stoneCls(a)]-order[stoneCls(b)]||stoneName(a).localeCompare(stoneName(b)));
  const sat=$('#satchel');sat.classList.toggle('drop',!!(UI.held&&UI.held.from==='board'));
  sat.innerHTML=list.length?list.map(st=>tileHTML(st,{held:UI.held&&UI.held.uid===st.uid,attr:`data-stone="${st.uid}" role="button" tabindex="0"`})).join(''):'<span class="muted">Everything is socketed.</span>';
}
export function renderDetail(){
  const uid=(UI.held&&UI.held.uid)||UI.view;const st=uid&&S.stones[uid];
  const d=$('#detail');
  if(!st){d.innerHTML='<h3>Stone</h3><p class="muted">Pick up a stone to read it. Stones grow with use, learn the families they fell, and resonate with the stones they work beside. Resonant pairs can be fused.</p>';return;}
  const next=st.lv<5?LV[st.lv]:null, prev=LV[st.lv-1];
  const pct=next?((st.xp-prev)/(next-prev)*100):100;
  const partners=Object.entries(S.res).filter(([k])=>k.split('|').includes(uid)).map(([k,v])=>({o:k.split('|').find(x=>x!==uid),v})).filter(x=>S.stones[x.o]).sort((a,b)=>b.v-a.v).slice(0,4);
  const pos=onBoard(uid);
  d.innerHTML=`<div style="display:flex;gap:12px;align-items:center">${tileHTML(st)}<div style="min-width:0"><h3>${stoneName(st)}</h3><div class="label">${{verb:'Verb',mod:'Modifier',ess:'Essence'}[stoneCls(st)]}${st.f.length>1?' · fused':''}${pos>=0?' · socketed':''}</div></div></div>
    <ul class="facets">${st.f.map(f=>`<li><b>${FX[f].name}.</b> ${FX[f].d}</li>`).join('')}</ul>
    <div class="kv"><span class="label">Level ${st.lv}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="mono muted">${next?st.xp+'/'+next:'max'}</span>
    ${stoneCls(st)==='verb'?['beast','construct','wraith'].map(f=>`<span class="label">vs ${f}</span><span class="bar"><i style="width:${st.aff[f]}%;background:var(--verd)"></i></span><span class="mono muted">+${Math.round(st.aff[f]/2)}%</span>`).join(''):''}</div>
    ${partners.length?`<div class="label" style="margin-top:12px">Resonance</div><div class="kv">${partners.map(p=>`<span>${stoneName(S.stones[p.o])}</span><span class="bar"><i style="width:${p.v}%;background:${p.v>=100?'#f2d58d':'var(--brass2)'}"></i></span><span class="mono muted">${Math.round(p.v)}</span>`).join('')}</div>`:''}
    <div class="btnrow">${pos>=0?`<button class="btn" data-act="unsock" data-uid="${uid}">Unsocket</button>`:''}<button class="btn" data-act="tofuse" data-uid="${uid}">Take to fusion</button></div>`;
}
export function renderBench(){renderBoard();renderReadout();renderSatchel();renderDetail();}
export function onSock(i){
  if(!S.unlocked[i]){const c=unlockCost();if(S.insight>=c){S.insight-=c;S.unlocked[i]=true;S.unlockCount++;toast(`Socket opened for <b>${c}◇</b>`);}else toast(`Opening this socket takes <b>${c}◇</b> Insight. Insight comes from discovery.`);commit();return;}
  const cur=S.board[i];
  if(UI.held){
    if(UI.held.from==='board'){if(UI.held.sock!==i){S.board[UI.held.sock]=cur;S.board[i]=UI.held.uid;}UI.view=UI.held.uid;UI.held=null;}
    else{S.board[i]=UI.held.uid;UI.view=UI.held.uid;UI.held=null;}
  }else if(cur){UI.held={from:'board',sock:i,uid:cur};}
  commit();
}
export function onLink(a,b){
  const k=lk(a,b);if(S.links[k])delete S.links[k];
  else{if(filUsed()>=S.filament){toast('Out of filament. The Reliquary sells more.');return;}S.links[k]=1;}
  commit();
}
$('#board').addEventListener('click',e=>{const s=e.target.closest('[data-sock]');if(s){onSock(+s.dataset.sock);return;}const l=e.target.closest('[data-link]');if(l){const [a,b]=l.dataset.link.split(',').map(Number);onLink(a,b);}});
$('#satchel').addEventListener('click',e=>{const t=e.target.closest('[data-stone]');
  if(t){const uid=t.dataset.stone;if(UI.held&&UI.held.uid===uid){UI.held=null;UI.view=uid;}
    else if(UI.held&&UI.held.from==='board'){S.board[UI.held.sock]=null;UI.view=UI.held.uid;UI.held=null;}
    else UI.held={from:'satchel',uid};commit();return;}
  if(UI.held&&UI.held.from==='board'){S.board[UI.held.sock]=null;UI.view=UI.held.uid;UI.held=null;commit();}});
$('#satchel').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.stone){e.preventDefault();e.target.click();}});
