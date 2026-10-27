import { emit } from '../bus.js';
import { EL, EN, FX, KN, PAIR, pk } from '../data.js';
import { poolOf, stoneName } from './rites.js';
import { S } from '../state.js';

export function discVal(k){
  if(k.startsWith('k:'))return 15; if(k.startsWith('e3:'))return 12; if(k.startsWith('e:'))return k.includes('+')?10:5;
  if(k.startsWith('s:'))return 4; if(k.startsWith('b:'))return 6; if(k.startsWith('x:'))return 8; if(/^c\d/.test(k))return 10;
  if(k==='deluge')return 15; if(k==='cascade')return 10; if(k.startsWith('m:'))return 12; if(k.startsWith('r:'))return 2; return 6;
}
export function discName(k){
  if(k.startsWith('k:'))return 'Rite form — '+KN[k.slice(2)][0];
  if(k.startsWith('e3:')){const fl=[];k.slice(3).split('+').forEach(t=>{const [e,n]=t.split('x');for(let i=0;i<(+n||1);i++)fl.push(e);});return 'Essence — '+poolOf(fl).name;}
  if(k.startsWith('e:')){const parts=k.slice(2).split('+');return 'Essence — '+(parts.length===1?EL[parts[0]].name:PAIR[pk(parts[0],parts[1])]);}
  if(k.startsWith('s:')){const [a,b]=k.slice(2).split('>');return `Concordance — ${FX[a].name} then ${FX[b].name}`;}
  if(k.startsWith('b:')){const [,e,p]=k.split(':');return `${EN[e].name}: ${p} broken`;}
  if(k.startsWith('x:'))return 'Felled — '+EN[k.slice(2)].name;
  if(/^c\d/.test(k))return `Chain of ${k.slice(1)}`;
  if(k.startsWith('m:'))return 'Mastery — '+stoneName({f:k.slice(2).split('+')});
  if(k.startsWith('r:'))return 'New formulation';
  return {cascade:'Cascade (8+ packets)',deluge:'Deluge (16+ packets)',absorb:'Something drinks your element',overreach:'Overreach (tempo past 100)','f:first':'First fusion'}[k]||k;
}
export function recordDisc(keys){
  const got=[];
  keys.forEach(k=>{if(S.codex[k])return;S.codex[k]=1;const v=discVal(k);S.insight+=v;got.push({k,v});
    const nm=discName(k);
    emit('discover',{k,v,name:nm});});
  return got;
}
