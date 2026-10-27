import { T, blightEst, famBonus, harmEst, hitChance, kindled, vulnOf } from './combat.js';
import { $, clamp, fmt } from '../util.js';

export const cv=$('#arena'),cx=cv.getContext('2d');
export function resize(){const r=cv.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));cx.setTransform(dpr,0,0,dpr,0,0);}
window.addEventListener('resize',()=>{if(T)resize();});
export function geo(){const W=cv.clientWidth,H=cv.clientHeight;const s=Math.min(W/560,H/330);return {W,H,s,ox:W/2,oy:H*.47};}
export function partCenter(i){const g=geo();const sh=T.en.def.shapes.filter(x=>x.p===i);let x=0,y=0;sh.forEach(q=>{if(q.t==='poly'){const c=q.pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]);x+=c[0]/q.pts.length;y+=c[1]/q.pts.length;}else{x+=q.x;y+=q.y;}});
  return {x:g.ox+x/sh.length*g.s,y:g.oy+y/sh.length*g.s+bob()};}
export function bob(){return Math.sin(T.wt*2.2)*3;}
export function popAt(i,text,col,small,big){const c=partCenter(i);T.fx.push({type:'num',x:c.x+(Math.random()*30-15),y:c.y-10+(Math.random()*10-5),text,col,t:0,life:small?1:1.3,size:big?24:small?12:17});}
export function popSelf(text,col,small){const g=geo();T.fx.push({type:'num',x:g.W*.12+Math.random()*16,y:g.H*.8,text,col,t:0,life:small?1:1.3,size:small?12:17});}
export function shapePath(q,g,b){
  cx.beginPath();const X=g.ox+q.x*g.s,Y=g.oy+q.y*g.s+b;
  if(q.t==='ell')cx.ellipse(X,Y,q.rx*g.s,q.ry*g.s,0,0,Math.PI*2);
  else if(q.t==='rect')cx.rect(X-q.w*g.s,Y-q.h*g.s,q.w*2*g.s,q.h*2*g.s);
  else{q.pts.forEach((p,k)=>{const px=g.ox+p[0]*g.s,py=g.oy+p[1]*g.s+b;k?cx.lineTo(px,py):cx.moveTo(px,py);});cx.closePath();}
}
export function hitTest(mx,my){const g=geo(),b=bob();const sh=T.en.def.shapes;
  for(let k=sh.length-1;k>=0;k--){const q=sh[k];shapePath(q,g,b);if(cx.isPointInPath(mx*(cv.width/cv.clientWidth),my*(cv.height/cv.clientHeight)))return q.p;}return -1;}
export function draw(){
  {const dpr=Math.min(2,window.devicePixelRatio||1);if(Math.abs(cv.width-Math.round(cv.clientWidth*dpr))>1||Math.abs(cv.height-Math.round(cv.clientHeight*dpr))>1)resize();}
  const g=geo(),{W,H}=g,E=T.en;
  cx.save();cx.clearRect(0,0,W,H);
  const gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1b2433');gr.addColorStop(.62,'#121923');gr.addColorStop(1,'#0b0f15');cx.fillStyle=gr;cx.fillRect(0,0,W,H);
  // vaulted arches
  cx.strokeStyle='rgba(155,160,166,.06)';cx.lineWidth=1;
  for(let k=-3;k<=3;k++){cx.beginPath();cx.arc(W/2+k*W*.22,H*.62,W*.16,Math.PI,0);cx.stroke();}
  // floor grid
  const hz=H*.64;cx.strokeStyle='rgba(207,168,90,.08)';
  for(let k=-10;k<=10;k++){cx.beginPath();cx.moveTo(W/2+k*18,hz);cx.lineTo(W/2+k*W*.18,H);cx.stroke();}
  for(let k=1;k<7;k++){const y=hz+(H-hz)*Math.pow(k/7,1.7);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}
  if(T.shake>0)cx.translate((Math.random()-.5)*T.shake*14,(Math.random()-.5)*T.shake*10);
  // shadow
  cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(g.ox,g.oy+105*g.s,120*g.s,14*g.s,0,0,Math.PI*2);cx.fill();
  // enemy
  const b=bob(),frozen=T.phase==='freeze'||T.phase==='chain';
  const wind=T.windup&&T.phase==='run';
  E.def.shapes.forEach(q=>{const p=E.parts[q.p];shapePath(q,g,b);
    const sel=frozen&&q.p===T.aim;
    let fill=p.broken?'#1e232c':'#2a3446';if(p.flash>0)fill='#e9dcc0';else if(wind)fill='#40303a';
    cx.fillStyle=fill;cx.fill();
    cx.setLineDash(p.broken?[5,4]:[]);cx.lineWidth=sel?2.5:1.4;cx.strokeStyle=sel?'#f2d58d':p.broken?'#59647a':'#c9bfa6';cx.stroke();cx.setLineDash([]);
  });
  // vessel glyph
  const vx=W*.12,vy=H*.82;cx.strokeStyle='#cfa85a';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(vx,vy-22);cx.lineTo(vx+14,vy);cx.lineTo(vx,vy+12);cx.lineTo(vx-14,vy);cx.closePath();cx.stroke();
  if(T.shield>0){cx.strokeStyle=`rgba(143,198,232,${.3+Math.min(.6,T.shield/40)})`;cx.beginPath();cx.arc(vx,vy-4,28,0,Math.PI*2);cx.stroke();}
  if(T.fuseQ.length){cx.fillStyle='#e9a46a';for(let k=0;k<Math.min(8,T.fuseQ.length);k++){const a=T.ut*2+k*Math.PI/4;cx.beginPath();cx.arc(vx+Math.cos(a)*36,vy-4+Math.sin(a)*36,2.5,0,Math.PI*2);cx.fill();}}
  // windup
  if(wind){cx.font=`600 ${Math.round(15)}px 'IBM Plex Mono', monospace`;cx.textAlign='center';cx.fillStyle=T.braceUsed?'#8a93a3':(T.remain<.2?'#ffd7a0':'#f0b0a8');cx.fillText(T.braceUsed?'BRACED':'BRACE — SPACE',g.ox,H-16);}
  // freeze overlay & sphere
  if(frozen){cx.fillStyle='rgba(20,40,70,.22)';cx.fillRect(-20,-20,W+40,H+40);
    const R=140*g.s;cx.strokeStyle='rgba(207,168,90,.35)';cx.lineWidth=1;
    for(let k=0;k<6;k++){const a=T.ut*.35+k*Math.PI/6;cx.beginPath();cx.ellipse(g.ox,g.oy,Math.abs(Math.cos(a))*R,R,0,0,Math.PI*2);cx.stroke();}
    for(let j=-2;j<=2;j++){const yy=g.oy+j*R/3,rr=Math.sqrt(R*R-(j*R/3)**2);cx.beginPath();cx.ellipse(g.ox,yy,rr,rr*.2,0,0,Math.PI*2);cx.stroke();}
    if(T.phase==='freeze')drawLabels(g,R);
  }
  // chain ring
  if(T.phase==='chain'){const c=T.ch;const tr=30;const r=tr+(c.perf-c.t)*120;const d=Math.abs(c.t-c.perf);const yy=g.oy;
    cx.lineWidth=3;cx.strokeStyle='rgba(242,213,141,.5)';cx.beginPath();cx.arc(g.ox,yy,tr,0,Math.PI*2);cx.stroke();
    cx.strokeStyle=d<=.09?'#9ccf7a':d<=.22?'#f2d58d':'#cf5a4e';cx.beginPath();cx.arc(g.ox,yy,Math.max(4,r),0,Math.PI*2);cx.stroke();
    cx.font=`500 13px 'IBM Plex Mono', monospace`;cx.textAlign='center';cx.fillStyle='#e9e0c9';
    cx.fillText(c.opts.map((o,i)=>`${i===0?'SPACE':i+1}: ${o.name}`).join('   '),g.ox,yy+tr+46);}
  // fx
  T.fx.forEach(f=>{const a=1-f.t/f.life;
    if(f.type==='num'){cx.globalAlpha=Math.min(1,a*1.6);cx.font=`600 ${f.size}px 'IBM Plex Mono', monospace`;cx.textAlign='center';cx.fillStyle=f.col;cx.fillText(f.text,f.x,f.y-f.t*34);}
    if(f.type==='title'){cx.globalAlpha=Math.min(1,a*2);cx.font=`${Math.round(Math.min(26,W/22))}px 'IM Fell English SC', Georgia, serif`;cx.textAlign='center';cx.fillStyle=f.col||'#e9e0c9';cx.fillText(f.text,W/2,34);}
    if(f.type==='msg'){cx.globalAlpha=Math.min(1,a*2);cx.font=`500 13px 'IBM Plex Mono', monospace`;cx.textAlign='center';cx.fillStyle='#f2d58d';cx.fillText(f.text,W/2,58);}
    cx.globalAlpha=1;});
  cx.restore();
  if(T.hurt>0){const v=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.7);v.addColorStop(0,'rgba(207,90,78,0)');v.addColorStop(1,`rgba(207,90,78,${T.hurt*.5})`);cx.fillStyle=v;cx.fillRect(0,0,W,H);}
}
export function drawLabels(g,R){
  const E=T.en,Rt=T.rites[T.sel];if(!Rt)return;
  const fury=Rt.packets.some(p=>p.side==='foe'&&p.kind==='harm')&&T.fury>0?1+T.fury/30:1;
  const items=E.parts.map((p,i)=>{const c=partCenter(i);let dmg=0,on=false,word='';
    Rt.packets.forEach(pk=>{if(pk.side!=='foe'||pk.fuse)return;const hits=pk.tgt==='all'||(pk.tgt==='aim'&&i===T.aim);if(!hits)return;on=true;
      if(pk.kind==='harm'){const e=harmEst(pk,p);dmg+=e.dmg*fury*kindled()*famBonus(Rt.uid)*(E.def.passive==='aegis'&&!E.parts[0].broken?.5:1);
        if(!word)word=e.mult<0?'absorbs':e.mult>=1.25?'weak':e.mult<=.75?'resists':'';}
      if(pk.kind==='mend')dmg+=blightEst(pk,p);});
    return {i,p,c,dmg,on,word,hit:hitChance(Rt.acc,p)};});
  const W=g.W,lw=Math.min(128,W*.3),lh=50;
  ['L','R'].forEach(side=>{
    const list=items.filter(it=>(side==='L')===(it.c.x<g.ox||(it.c.x===g.ox&&it.i%2===0))).sort((a,b)=>a.c.y-b.c.y);
    let y=Math.max(8,g.oy-list.length*lh/2-((list.length-1)*8)/2);
    list.forEach(it=>{
      let x=side==='L'?g.ox-R-lw-14:g.ox+R+14;x=clamp(x,6,W-lw-6);
      const sel=it.i===T.aim;
      cx.strokeStyle=sel?'#f2d58d':'rgba(201,191,166,.5)';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(it.c.x,it.c.y);cx.lineTo(side==='L'?x+lw:x,y+lh/2);cx.stroke();
      cx.fillStyle=sel?'rgba(42,52,70,.95)':'rgba(18,24,35,.88)';cx.fillRect(x,y,lw,lh);cx.strokeRect(x,y,lw,lh);
      cx.textAlign='left';cx.fillStyle=it.p.broken?'#8a93a3':'#e9e0c9';cx.font=`15px 'IM Fell English SC', Georgia, serif`;cx.fillText(it.p.n+(it.p.broken?' (broken)':''),x+7,y+17);
      cx.font=`500 11px 'IBM Plex Mono', monospace`;cx.fillStyle='#9ba0a6';
      const hasFoe=Rt.packets.some(pk=>pk.side==='foe'&&pk.kind!=='mend');
      cx.fillText(hasFoe?`hit ${Math.round(it.hit)}%`:'',x+7,y+32);
      if(it.on&&it.dmg>0){cx.fillStyle='#f3ead6';cx.fillText(`~${fmt(it.dmg)}`,x+62,y+32);}
      if(it.word){cx.fillStyle=it.word==='weak'?'#9ccf7a':it.word==='absorbs'?'#e9a46a':'#cf8a7e';cx.fillText(it.word,x+7,y+45);}
      else if(vulnOf(it.p)>0){cx.fillStyle='#b9c6d8';cx.fillText(`brittle +${Math.round(vulnOf(it.p)*100)}%`,x+7,y+45);}
      y+=lh+8;});
  });
}
