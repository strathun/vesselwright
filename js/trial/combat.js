import { stoneName } from '../engine/rites.js';
import { emit, on } from '../bus.js';
import { BLIGHT, BRK, EL, EN, FX, STAT, lineup } from '../data.js';
import { recordDisc } from '../engine/discovery.js';
import { grantXP } from '../engine/growth.js';
import { allRites } from '../engine/rites.js';
import { S, addRes, mkStone, restock, save } from '../state.js';
import { buildDock, gainsHTML, hud, showOver } from './hud.js';
import { draw, popAt, popSelf, resize } from './view.js';
import { renderPurse, setTab } from '../ui/app.js';
import { toast } from '../ui/toast.js';
import { $, clamp, fmt } from '../util.js';

export let T=null;
// Record what happened during a descent for the summary card.
on('discover',d=>{if(T&&T.gains)T.gains.disc.push(`${d.name} (+${d.v}\u25c7)`);});
on('levelup',d=>{if(T&&T.gains)T.gains.lvl.push(`${stoneName(d.st)} \u2192 level ${d.st.lv}`);});
on('mastered',d=>{if(T&&T.gains)T.gains.lvl.push(`${stoneName(d.st)} mastered \u2014 a copy crystallized`);});

export let raf=0,lastT=0;
export const sumB=(k,f,cap)=>Math.min(cap,T.boons.filter(b=>b.k===k).reduce((a,b)=>a+b.p*f,0));
export const glaze=()=>sumB('glaze',.025,.6), veil=()=>sumB('veil',.025,.5), kindled=()=>1+sumB('kindled',.015,.6);
export function startTrial(mode,depth){
  const rites=allRites();
  if(!rites.length){toast('Socket at least one verb stone before you descend.');return;}
  T={mode,depth,line:mode==='proving'?['effigy']:lineup(depth),idx:0,hp:S.vMax,max:S.vMax,shield:0,shEl:null,tempo:60,strain:0,fury:0,boons:[],fuseQ:[],
     rites,sel:0,aim:1,phase:'run',fx:[],ev:[],evT:0,evEnd:0,chill:0,brace:0,braceUsed:false,windup:false,used:{},wt:0,ut:0,shake:0,hurt:0,
     chainSeq:[],ch:null,cur:null,log:[],run:{shards:0,stones:[]},gains:null,dealt:0,dealtT:0};
  $('#trial').hidden=false;document.body.style.overflow='hidden';document.body.classList.add('intrial');
  spawn();resize();buildDock();
  lastT=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
}
export function spawn(){
  const key=T.line[T.idx],D=EN[key],d=Math.max(1,T.depth);
  const hs=1+.35*(d-1),ps=1+.25*(d-1);
  const hp=D.effigy?9999:Math.round(D.hp*hs);
  T.en={key,def:D,hp,max:hp,ps,ct:D.ct*Math.max(.7,1-.04*(d-1)),charge:0,parts:D.parts.map(p=>({...p,wound:0,wmax:hp*p.sh*.6,broken:false,vuln:[],flash:0})),
        st:[],shield:0,focus:false,hollow:0,enrage:0,weak:0,sunder:0,expose:false,last:null};
  T.en.next=pickMove(T.en);
  T.aim=Math.min(T.aim,T.en.parts.length-1);if(D.parts.length>1&&T.aim===0)T.aim=D.effigy?1:0;
  T.gains={xp:0,lvl:[],disc:[],shards:0,stones:[]};
  T.tempo=Math.max(T.tempo,50);T.strain=0;T.fury=0;T.boons=[];T.shield=0;T.shEl=null;T.fuseQ=[];T.used={};T.chill=0;T.dealt=0;
  T.phase='run';$('#tOver').hidden=true;
  log(`${D.name} rises from the dark.`);
}
export function pickMove(E){
  let ms=E.def.moves;if(E.last&&E.last.pow===0)ms=ms.filter(m=>m.pow>0);
  const tot=ms.reduce((a,m)=>a+m.w,0);let r=Math.random()*tot;for(const m of ms){r-=m.w;if(r<=0){E.last=m;return m;}}E.last=ms[0];return ms[0];
}
export function log(s){T.log.unshift(s);T.log.length=Math.min(T.log.length,30);$('#tlog').innerHTML=T.log.slice(0,3).map(l=>`<div>${l}</div>`).join('');}
export function frame(now){if(!T)return;const dt=Math.min(.05,(now-lastT)/1000);lastT=now;update(dt);draw();hud();raf=requestAnimationFrame(frame);}
export function update(dt){
  T.ut+=dt;
  T.fx.forEach(f=>f.t+=dt);T.fx=T.fx.filter(f=>f.t<f.life);
  T.shake=Math.max(0,T.shake-dt*2);T.hurt=Math.max(0,T.hurt-dt*1.5);
  T.en.parts.forEach(p=>p.flash=Math.max(0,p.flash-dt));
  if(T.phase==='run'){T.wt+=dt;runTick(dt);}
  else if(T.phase==='resolve'){T.evT+=dt;while(T.ev.length&&T.ev[0].at<=T.evT){const e=T.ev.shift();e.fn();}if(!T.ev.length&&T.evT>=T.evEnd)afterResolve();}
  else if(T.phase==='chain'){T.ch.t+=dt;if(T.ch.t>T.ch.dur){log('The ring closes. The chain slips away.');endChain();}}
}
export function runTick(dt){
  const E=T.en;
  const regen=22*(1+sumB('quick',.03,1.5))*(T.chill>0?.65:1);
  T.tempo=Math.min(100,T.tempo+regen*dt);T.chill=Math.max(0,T.chill-dt);
  T.strain=Math.max(0,T.strain-5*dt);
  T.shield=Math.max(0,T.shield-T.shield*.02*dt);if(T.shield<.5){T.shield=0;T.shEl=null;}
  const bloom=sumB('bloom',.1,99);if(bloom)T.hp=Math.min(T.max,T.hp+bloom*dt);
  T.boons.forEach(b=>b.t-=dt);T.boons=T.boons.filter(b=>b.t>0);
  E.st.forEach(s=>{s.t-=dt;s.acc=(s.acc||0)+dt;
    if(s.acc>=1){s.acc-=1;
      if(s.k==='burn'){const part=E.parts[s.part];const m=aff(part,'ember');const v=.22*s.p*m;
        if(v<0){E.hp=Math.min(E.max,E.hp-v);popAt(s.part,'+'+fmt(-v),'#e9a46a');}else dmgEnemy(s.part,v,{col:'#e9a46a',small:true});}
      if(s.k==='seed'){const v=.08*s.p;T.hp=Math.min(T.max,T.hp+v);popSelf('+'+fmt(v),'#9ccf7a',true);}}});
  E.st=E.st.filter(s=>s.t>0);
  E.parts.forEach(p=>{p.vuln.forEach(v=>v.t-=dt);p.vuln=p.vuln.filter(v=>v.t>0);});
  if(enemyDead())return victory();
  if(E.def.effigy&&!S.opt.effigyHits){E.charge=0;T.windup=false;}
  else{
    const slow=Math.min(.7,E.st.filter(s=>s.k==='chill').reduce((a,s)=>a+.025*s.p,0));
    const rate=(1/E.ct)*(1-slow)*(1+E.enrage);
    E.charge+=rate*dt;const remain=(1-E.charge)/rate;T.windup=remain<.45&&E.next.pow>0;T.remain=remain;
    if(E.charge>=1)enemyAttack();
  }
  if(T.phase==='run'&&S.opt.auto&&T.tempo>=100)freeze();
}
export const aff=(part,k)=>k&&part.aff[k]!==undefined?part.aff[k]:1;
export function vulnOf(part){return part.vuln.reduce((a,v)=>a+v.v,0);}
export function famBonus(uid){const st=S.stones[uid];return st?1+st.aff[T.en.def.fam]/200:1;}
export function hitChance(acc,part){return clamp(acc-part.ev-T.strain*.35,15,99);}
export function harmEst(p,part){
  const E=T.en;let el=1;
  if(p.el){el=0;for(const k in p.el.counts)el+=p.el.counts[k]*aff(part,k);el/=p.el.total;}
  const mult=aff(part,p.form)*el;
  const armor=Math.max(0,part.arm-E.sunder)*(1-(p.pen||0));
  return {mult,dmg:p.mag*mult*(1-armor)*(1+vulnOf(part))*(E.expose?1.3:1)};
}
export function blightEst(p,part){const E=T.en;return p.mag*.9*BLIGHT[E.def.fam]*(1+vulnOf(part))*(E.expose?1.3:1);}
export function enemyDead(){return !T.en.def.effigy&&T.en.hp<=0;}
export function freeze(){if(T.phase==='run'){T.phase='freeze';buildDock();}}
export function unfreeze(){if(T.phase==='freeze')T.phase='run';}
export function execute(){
  if(T.phase!=='freeze')return;const R=T.rites[T.sel];if(!R)return;
  if(T.tempo<R.tempo-.01){flashMsg(`Not enough tempo for ${R.name}. Resume and let it fill.`);return;}
  T.tempo-=R.tempo;doRite(R,T.aim,0,false);
}
export function flashMsg(s){T.fx.push({type:'msg',text:s,t:0,life:1.8});}
export function doRite(R,aim,depth,perfect){
  T.phase='resolve';T.ev=[];T.evT=0;
  const m=T.mode==='proving'?.5:1;
  const novel=!S.codex['r:'+R.sig];
  T.strain=Math.min(100,T.strain+R.strain+(depth?8*depth:0));
  const keys=[...R.disc];if(depth>=1)keys.push('c'+(depth+1));
  recordDisc(keys);
  grantXP(R.uid,10*(novel?2:1)*m);R.dom.forEach(d=>grantXP(d.uid,6*(novel?2:1)*m));
  R.dom.forEach(d=>addRes(R.uid,d.uid,8*m));
  for(let i=1;i<R.modSeq.length;i++)addRes(R.modSeq[i-1].uid,R.modSeq[i].uid,5*m);
  if(depth>0&&T.cur)addRes(T.cur.rite.uid,R.uid,12*m);
  T.used[R.uid]=1;
  const hasHarm=R.packets.some(p=>p.side==='foe'&&p.kind==='harm'&&!p.fuse);
  const ctx={fury:1,chainM:1+.12*depth+(perfect?.15:0),acc:R.acc,uid:R.uid};
  if(hasHarm&&T.fury>0){ctx.fury=1+T.fury/30;log(`Fury spent: ×${ctx.fury.toFixed(2)}`);T.fury=0;}
  const det=T.fuseQ;T.fuseQ=[];
  log(`${R.name}${depth?` — chain ${depth+1}${perfect?', perfect':''}`:''}`);
  T.fx.push({type:'title',text:R.name,t:0,life:1.1});
  let at=.18;const step=Math.max(.04,.16-R.packets.length*.005);
  let armed=0;
  R.packets.forEach(p=>{if(p.fuse){T.fuseQ.push({p:{...p,fuse:false},aim});armed++;return;}T.ev.push({at,fn:()=>applyPacket(p,aim,ctx)});at+=step;});
  if(armed)T.ev.push({at,fn:()=>{flashMsg(`${armed} packet${armed>1?'s':''} fused — they will detonate after your next rite`);}});
  if(det.length){at+=.25;T.ev.push({at,fn:()=>{log('The fused charge detonates.');T.shake=.6;}});
    const dctx={fury:1,chainM:1,acc:95,uid:R.uid};det.forEach(d=>{at+=.07;T.ev.push({at,fn:()=>applyPacket(d.p,d.aim,dctx)});});}
  T.evEnd=at+.4;T.cur={rite:R,aim,depth};
}
export function afterResolve(){
  T.rites=allRites();
  if(enemyDead())return victory();
  if(T.hp<=0)return defeat();
  const R=T.cur.rite;T.chainSeq.push(R.sock);
  const opts=R.chain.map(s=>T.rites.find(r=>r.sock===s)).filter(r=>r&&!T.chainSeq.includes(r.sock));
  if(opts.length){T.phase='chain';T.ch={t:0,dur:1.15,perf:.75,opts,aim:T.cur.aim,depth:T.cur.depth};}
  else endChain();
}
export function endChain(){T.chainSeq=[];T.ch=null;T.phase='run';buildDock();}
export function chainPress(i){
  const c=T.ch;if(!c)return;const d=Math.abs(c.t-c.perf);
  if(d>.22){log('Mistimed. The chain breaks.');flashMsg('Mistimed');endChain();return;}
  const R=c.opts[Math.min(i,c.opts.length-1)];
  doRite(R,c.aim,c.depth+1,d<=.09);
}
export function bracePress(){
  if(T.phase!=='run'||!T.windup||T.braceUsed)return;
  T.braceUsed=true;if(T.remain<.2){T.brace=.55;flashMsg('Perfect brace');}else{T.brace=.35;flashMsg('Braced');}T.strain=Math.min(100,T.strain+3);
}
export function otherPart(aim){const n=T.en.parts.length;if(n<2)return aim;let r=Math.floor(Math.random()*(n-1));if(r>=aim)r++;return r;}
export function applyPacket(p,aim,ctx){
  const E=T.en;
  if(p.side==='self'){
    if(p.kind==='mend'){const v=p.mag*ctx.chainM;T.hp=Math.min(T.max,T.hp+v);popSelf('+'+fmt(v),'#9ccf7a');if(p.el)boonsFrom(p.el,p.mag*.5);}
    else if(p.kind==='ward'){const v=p.mag*ctx.chainM;T.shield+=v;if(p.el)T.shEl=p.el;popSelf('+'+fmt(v)+' ward','#8fc6e8');}
    else if(p.kind==='harm'){const v=Math.min(Math.max(0,T.hp-1),p.mag*.5);T.hp-=v;T.fury+=p.mag*ctx.chainM;popSelf('-'+fmt(v)+' · fury','#e58f8f');T.hurt=.25;}
    else if(p.kind==='hex'){if(p.el)boonsFrom(p.el,p.mag*ctx.chainM);else{T.strain=Math.max(0,T.strain-1.5*p.mag);T.tempo=Math.min(100,T.tempo+p.mag*.5);popSelf('composure','#e6c6f2');}}
    return;
  }
  const targets=p.tgt==='all'?E.parts.map((_,i)=>i):p.tgt==='other'?[otherPart(aim)]:[aim];
  targets.forEach(i=>hitPart(p,i,ctx));
}
export function boonsFrom(el,power){el.keys.forEach(k=>{const b=EL[k].boon;T.boons.push({k:b,p:power*el.pot[k],t:8});popSelf(STAT[b].n,'#bfe3d8',true);});}
export function hitPart(p,i,ctx){
  const E=T.en,part=E.parts[i];
  if(p.kind==='mend'){const v=blightEst(p,part)*ctx.chainM;dmgEnemy(i,v,{col:'#c8e07a',tag:'blight'});procEl(p,i);return;}
  if(Math.random()*100>hitChance(ctx.acc,part)){popAt(i,'miss','#8a93a3');return;}
  if(p.kind==='harm'){
    const est=harmEst(p,part);const crit=Math.random()<(p.crit||0)+T.strain*.0025;
    let v=est.dmg*ctx.fury*ctx.chainM*kindled()*(crit?1.75:1)*famBonus(ctx.uid);
    if(E.def.passive==='aegis'&&!E.parts[0].broken&&!crit)v*=.5;
    if(est.mult<0){const h=Math.abs(v);E.hp=Math.min(E.max,E.hp+h);popAt(i,`+${fmt(h)} drunk`,'#e9a46a');recordDisc(['absorb']);log(`${part.n} drinks the ${p.el?p.el.name:'blow'}.`);return;}
    dmgEnemy(i,v,{crit});
    if(part.thorns){const r=v*.2;T.hp=Math.max(1,T.hp-r);popSelf('-'+fmt(r)+' thorns','#e58f8f',true);}
    procEl(p,i);
    if(kindled()>1&&Math.random()<.3)enStatus('burn',p.mag*.3,i);
  }else if(p.kind==='ward'){const v=.015*p.mag*ctx.chainM;part.vuln.push({v,t:10});popAt(i,`brittle +${Math.round(v*100)}%`,'#b9c6d8');part.flash=.2;}
  else if(p.kind==='hex'){
    if(p.el)p.el.keys.forEach(k=>enStatus(EL[k].status,p.mag*ctx.chainM*p.el.pot[k],i));
    else{E.charge=Math.max(0,E.charge-.015*p.mag*ctx.chainM);popAt(i,'dazed','#e6c6f2');}
  }
}
export function procEl(p,i){if(!p.el)return;p.el.keys.forEach(k=>{if(Math.random()<.3*p.el.pot[k]+(p.sure||0))enStatus(EL[k].status,p.mag*.5*p.el.pot[k],i);});}
export function enStatus(k,power,i){
  const E=T.en;
  if(k==='shock'){const v=.02*power;E.charge=Math.max(0,E.charge-v);popAt(i,`shock −${Math.round(v*100)}%`,'#e6d35a',true);return;}
  if(k==='hollow'){E.hollow=Math.min(.75,E.hollow+.03*power);popAt(i,'hollowed','#a184dc',true);return;}
  E.st.push({k,p:power,t:{burn:4,chill:6,seed:8}[k],part:i,acc:0});popAt(i,STAT[k].n.toLowerCase(),{burn:'#e07b3c',chill:'#8fc6e8',seed:'#7cbc66'}[k],true);
}
export function dmgEnemy(i,v,o={}){
  const E=T.en,part=E.parts[i];
  if(E.shield>0){const a=Math.min(E.shield,v);E.shield-=a;v-=a;if(a>0)popAt(i,`${fmt(a)} blocked`,'#8a93a3',true);}
  if(v<=0)return;
  E.hp-=v;T.dealt+=v;part.wound+=v;part.flash=.25;
  popAt(i,(o.crit?'✶ ':'')+fmt(v),o.col||(o.crit?'#ffe08a':'#f3ead6'),o.small,o.crit);
  if(v>E.max*.1||o.crit)T.shake=Math.max(T.shake,.35);
  if(!part.broken&&part.brk&&part.wound>=part.wmax)breakPart(i);
  if(E.def.effigy&&E.hp<E.max*.5)E.hp=E.max;
}
export function breakPart(i){
  const E=T.en,p=E.parts[i];p.broken=true;
  if(p.brk==='weaken')E.weak++;if(p.brk==='slow')E.ct*=1.3;if(p.brk==='sunder')E.sunder+=.2;if(p.brk==='expose')E.expose=true;
  log(`${p.n} breaks — ${BRK[p.brk]}.`);T.fx.push({type:'title',text:`${p.n} broken`,t:0,life:1.4,col:'#f2d58d'});T.shake=.6;
  recordDisc(['b:'+E.key+':'+p.n]);
}
export function enemyAttack(){
  const E=T.en,m=E.next;E.charge=0;
  let pow=m.pow*E.ps;if(E.parts[m.p].broken)pow*=.4;pow*=Math.pow(.8,E.weak);
  if(m.fx==='enrage'){E.enrage=Math.min(1,E.enrage+.2);log(`${E.def.name} howls. It quickens.`);flashMsg(`${m.n}: it quickens`);}
  if(m.fx==='focus'){E.focus=true;log(`${E.def.name} takes aim. Its next blow will land hard.`);flashMsg(`${m.n}: its next blow is focused`);}
  if(m.fx==='armorUp'){E.shield+=16*E.ps;log(`${E.def.name} hardens (${fmt(16*E.ps)} shield).`);flashMsg(`${m.n}: it hardens`);}
  if(pow>0){
    if(E.focus){pow*=1.6;E.focus=false;}
    pow*=1-E.hollow;E.hollow=0;
    if(Math.random()<veil()){popSelf('evaded','#bfe3d8');log(`${m.n} passes through your veil.`);}
    else{
      let dmg=pow*(1-T.brace)*(1-glaze())*(1+T.strain*.004);
      const shieldable=m.fx==='pierceWard'?dmg*.5:dmg;
      const a=Math.min(T.shield,shieldable);T.shield-=a;dmg-=a;
      if(a>0&&T.shEl){const el=T.shEl;el.keys.forEach(k=>enStatus(EL[k].status,a*el.pot[k]*.8,Math.floor(Math.random()*E.parts.length)));}
      T.hp-=dmg;
      if(m.fx==='drain'&&dmg>0)E.hp=Math.min(E.max,E.hp+dmg*.5);
      if(m.fx==='strainUp')T.strain=Math.min(100,T.strain+18);
      if(m.fx==='chillYou')T.chill=6;
      if(m.fx==='rot')T.shield*=.5;
      popSelf('-'+fmt(dmg),'#cf5a4e');T.shake=.5;T.hurt=.45;
      log(`${E.def.name}: ${m.n} — ${fmt(dmg)}${a>0?` (${fmt(a)} warded)`:''}${T.brace?(T.brace>.5?' · perfect brace':' · braced'):''}${m.fx==='drain'?' · it feeds':''}${m.fx==='strainUp'?' · strain rises':''}${m.fx==='chillYou'?' · your tempo slows':''}${m.fx==='rot'?' · your ward rots':''}`);
    }
  }
  T.brace=0;T.braceUsed=false;E.next=pickMove(E);
  if(T.hp<=0){T.hp=0;defeat();}
}
export function victory(){
  T.phase='over';const E=T.en;
  recordDisc(['x:'+E.key]);
  Object.keys(T.used).forEach(u=>{const st=S.stones[u];if(st){st.aff[E.def.fam]=Math.min(100,st.aff[E.def.fam]+4);grantXP(u,12);}});
  const d=T.depth;const sh=Math.round((8+E.max/8)*(1+.3*(d-1)));S.shards+=sh;T.run.shards+=sh;T.gains.shards=sh;
  if(Math.random()<.45&&E.def.drops.length){const f=E.def.drops[Math.floor(Math.random()*E.def.drops.length)];const u=mkStone([f]);T.run.stones.push(FX[f].name);T.gains.stones.push(FX[f].name);}
  log(`${E.def.name} falls.`);
  const last=T.idx>=T.line.length-1;
  let extra='';
  if(last){const bonus=20*d;S.shards+=bonus;T.run.shards+=bonus;const roll=Math.random();const rar=roll<.4?1:2;const c=Object.keys(FX).filter(f=>FX[f].rar===rar);const f=c[Math.floor(Math.random()*c.length)];mkStone([f]);T.run.stones.push(FX[f].name);
    const opened=d>=S.maxDepth;S.maxDepth=Math.max(S.maxDepth,d+1);restock();
    extra=`<p class="muted">Depth ${d} is cleared. The warden's hoard: ${bonus}▪ and a ${FX[f].name} stone.${opened?` Depth ${d+1} opens.`:''}</p>`;}
  save();
  showOver(last?`Depth ${d} cleared`:`${E.def.name} falls`,gainsHTML()+extra,
    last?[['Return to the bench','home',true]]:[[`Onward to foe ${T.idx+2} of ${T.line.length}`,'next',true],['Withdraw to the bench','home']]);
}
export function defeat(){
  T.phase='over';save();
  showOver('The Vessel falls',`<p class="muted">It is carried back up. What your stones learned stays with them, and the shards already taken are yours.</p>`+gainsHTML(),[['Return to the bench','home',true]]);
}
export function endTrial(){cancelAnimationFrame(raf);T=null;emit('trial-end');$('#trial').hidden=true;document.body.style.overflow='';document.body.classList.remove('intrial');save();renderPurse();setTab('bench');}
export function leave(){
  if(!T)return;
  if(T.phase==='over'){endTrial();return;}
  T.phase='over';
  showOver(T.mode==='proving'?'Leave the proving ground':'Withdraw',`<p class="muted">${T.mode==='proving'?`You dealt ${fmt(T.dealt)} damage to the effigy.`:'The Vessel climbs back to the bench. Growth and discoveries are kept.'}</p>`+gainsHTML(),[['Return to the bench','home',true]]);
}
export function selectRite(i){if(!T.rites[i])return;T.sel=i;if(T.phase==='run')freeze();buildDock();}
