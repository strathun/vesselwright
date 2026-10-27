import { EL, FX, KN, NS, PAIR, pk } from '../data.js';
import { S, linked, stoneCls } from '../state.js';
import { clamp, fmt, neighbors } from '../util.js';

export const MODFN={
  echo:(P,c,L)=>{const k=.6+.05*(L-1);c.tempo*=1.2;return P.concat(P.map(p=>({...p,mag:p.mag*k,tags:[...p.tags,'echo']})));},
  spread:(P,c,L)=>{const k=.55+.05*(L-1);c.tempo*=1.25;return P.map(p=>p.side==='foe'?{...p,tgt:'all',mag:p.mag*k}:{...p,mag:p.mag*(1.25+.05*(L-1))});},
  invert:(P,c,L)=>P.map(p=>({...p,side:p.side==='foe'?'self':'foe',mag:p.mag*(1+.05*(L-1))})),
  siphon:(P,c,L)=>{const k=.35+.05*(L-1);c.tempo*=1.1;const sw={harm:'mend',mend:'harm',ward:'ward',hex:'hex'};
    return P.concat(P.map(p=>({...p,side:p.side==='foe'?'self':'foe',kind:sw[p.kind],mag:p.mag*k,tags:[...p.tags,'siphon']})));},
  weight:(P,c,L)=>{const k=1.5+.1*(L-1);c.tempo*=1.3;c.strain+=6;return P.map(p=>({...p,mag:p.mag*k}));},
  quicken:(P,c,L)=>{c.tempo*=Math.max(.35,.55-.04*(L-1));return P.map(p=>({...p,mag:p.mag*.85}));},
  keen:(P,c,L)=>{c.acc+=10;c.tempo*=1.05;const k=.2+.04*(L-1);return P.map(p=>({...p,crit:(p.crit||0)+k,pen:Math.min(.9,(p.pen||0)+.4),sure:(p.sure||0)+.3}));},
  fork:(P,c,L)=>{const k=.7+.05*(L-1);c.tempo*=1.15;return P.concat(P.map(p=>p.side==='foe'?{...p,tgt:'other',mag:p.mag*k,tags:[...p.tags,'fork']}:{...p,mag:p.mag*.4,tags:[...p.tags,'fork']}));},
  fuse:(P,c,L)=>{const k=1.7+.1*(L-1);c.tempo*=.9;return P.map(p=>({...p,fuse:true,mag:p.mag*k}));},
};
export function poolOf(fl){
  const counts={};let total=0;fl.forEach(f=>{const e=FX[f].el;if(e){counts[e]=(counts[e]||0)+1;total++;}});
  if(!total)return null;
  const ord=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));
  let name;
  if(total===1)name=EL[ord[0]].name;
  else{const a=ord[0],b=counts[a]>=2?a:ord[1];const rest={...counts};rest[a]--;rest[b]--;
    const adj=Object.keys(rest).filter(k=>rest[k]>0).map(k=>EL[k].adj);name=(adj.length?adj.join(' ')+' ':'')+PAIR[pk(a,b)];}
  const sig=Object.keys(counts).sort().map(k=>k+(counts[k]>1?'x'+counts[k]:'')).join('+');
  const pot={};for(const k in counts)pot[k]=counts[k]*(.5+.5/total);
  return {counts,total,name,sig,pot,keys:Object.keys(counts).sort()};
}
export function stoneName(st){
  if(st.f.length===1)return FX[st.f[0]].name;
  const ess=st.f.filter(f=>FX[f].cls==='ess'),verbs=st.f.filter(f=>FX[f].cls==='verb'),mods=st.f.filter(f=>FX[f].cls==='mod');
  const en=ess.length?poolOf(ess).name:'';
  const vn=verbs.map(f=>FX[f].name).join('-'),mn=mods.map(f=>FX[f].name).join('-');
  if(vn)return (en?en+' ':'')+vn+(mn?' of '+mn:'');
  if(mn)return (en?en+' ':'')+mn;
  return en;
}
export const symOf=st=>st.f.map(f=>FX[f].sym).join('·');
export function domainOf(sock){
  const seen=new Set([sock]),q=[[sock,0]],dom=[],chain=[];
  while(q.length){const [s,d]=q.shift();
    for(const n of neighbors(s)){ if(seen.has(n)||!linked(s,n))continue; seen.add(n);
      const u=S.board[n];
      if(u){const st=S.stones[u]; if(stoneCls(st)==='verb'){chain.push(n);continue;} dom.push({sock:n,d:d+1,uid:u});}
      q.push([n,d+1]);}}
  dom.sort((a,b)=>a.d-b.d||a.sock-b.sock);
  return {dom,chain};
}
export function summarize(P){
  const g=new Map();
  P.forEach(p=>{const key=[p.kind,p.side,p.side==='foe'?p.tgt:'self',p.fuse?1:0].join('|');if(!g.has(key))g.set(key,{p,m:[]});g.get(key).m.push(p.mag);});
  return [...g.values()].map(({p,m})=>{
    const [kn,kc]=KN[p.kind+':'+p.side];
    const tg=p.side==='self'?'Vessel':p.tgt==='all'?'every part':p.tgt==='other'?'another part':'aimed part';
    const tot=m.reduce((a,b)=>a+b,0);
    const ms=m.length<=4?m.map(fmt).join(' + '):`${m.length} × ~${fmt(tot/m.length)} (Σ ${fmt(tot)})`;
    return {kn,kc,tg,ms,fuse:p.fuse,txt:`${kn} → ${tg}: ${ms}${p.fuse?' [fused]':''}`};
  });
}
export function compileRite(sock){
  const uid=S.board[sock],st=S.stones[uid],L=st.lv;
  const {dom,chain}=domainOf(sock);
  const essF=[],modSeq=[];
  st.f.forEach(f=>{const c=FX[f].cls;if(c==='ess')essF.push(f);if(c==='mod')modSeq.push({f,lv:L,uid});});
  dom.forEach(x=>{const s2=S.stones[x.uid];s2.f.forEach(f=>{const c=FX[f].cls;if(c==='ess')essF.push(f);if(c==='mod')modSeq.push({f,lv:s2.lv,uid:x.uid});});});
  const pool=poolOf(essF);
  const verbs=st.f.filter(f=>FX[f].cls==='verb');
  const sc=1+.12*(L-1);
  let P=[],tempo=0,acc=100;
  verbs.forEach(v=>{const F=FX[v];P.push({side:F.side,kind:F.kind,mag:F.mag*sc,form:F.form||null,tgt:'aim',crit:F.crit||0,pen:F.pen||0,sure:0,tags:[],fuse:false,el:null});tempo+=F.tempo;if(F.acc)acc=Math.min(acc,F.acc);});
  if(verbs.length>1)tempo*=.8;
  if(acc===100)acc=95;
  const c={tempo,strain:4,acc};
  const trace=[{label:verbs.map(v=>FX[v].name).join(' + ')+(L>1?` (level ${L})`:''),lines:summarize(P).map(x=>x.txt)}];
  if(pool){const bonus=1+Math.min(5,pool.total)*.08;P=P.map(p=>({...p,el:pool,mag:p.kind==='harm'?p.mag*bonus:p.mag}));
    trace.push({label:`steeped in ${pool.name}`,lines:summarize(P).map(x=>x.txt)});}
  let overflow=false;
  modSeq.forEach(m=>{P=MODFN[m.f](P,c,m.lv);c.strain+=2;
    if(P.length>40){c.strain+=Math.round((P.length-40)*.5);P=P.slice(0,40);overflow=true;}
    trace.push({label:FX[m.f].name+(m.lv>1?` (level ${m.lv})`:''),lines:summarize(P).map(x=>x.txt)});});
  const raw=c.tempo, cost=Math.round(clamp(raw,8,100));
  if(raw>100)c.strain+=Math.round((raw-100)/2);
  const disc=new Set();
  P.forEach(p=>disc.add('k:'+p.kind+':'+p.side));
  if(pool){disc.add(pool.total===1?'e:'+pool.keys[0]:pool.total===2?'e:'+pk(...Object.keys(pool.counts).flatMap(k=>Array(pool.counts[k]).fill(k))):'e3:'+pool.sig);}
  for(let i=1;i<modSeq.length;i++)disc.add('s:'+modSeq[i-1].f+'>'+modSeq[i].f);
  if(P.length>=8)disc.add('cascade'); if(P.length>=16)disc.add('deluge');
  if(raw>100)disc.add('overreach');
  const sig=verbs.join('+')+'|'+st.f.filter(f=>FX[f].cls!=='verb').join('+')+'|'+modSeq.map(m=>m.f).join('>')+'|'+(pool?pool.sig:'');
  disc.add('r:'+sig);
  const name=(pool?pool.name+' ':'')+verbs.map(v=>FX[v].name).join('-')+(modSeq.length?' · '+modSeq.map(m=>FX[m.f].name).join('·'):'');
  return {sock,uid,name,packets:P,trace,pool,tempo:cost,raw,strain:Math.round(c.strain),acc:Math.min(99,c.acc),dom,chain,modSeq,disc:[...disc],sig,overflow,verbs};
}
export function allRites(){const r=[];for(let i=0;i<NS;i++){const u=S.board[i];if(u&&stoneCls(S.stones[u])==='verb')r.push(compileRite(i));}return r;}
