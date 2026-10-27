import { emit } from '../bus.js';
import { recordDisc } from './discovery.js';
import { S, mkStone } from '../state.js';
import { lvOf } from '../util.js';

export function grantXP(uid,amt){
  const st=S.stones[uid];if(!st)return;const before=st.lv;st.xp+=Math.round(amt);st.lv=lvOf(st.xp);
  if(st.lv>before)emit('levelup',{st});
  if(st.lv>=5&&!st.mastered){st.mastered=true;mkStone(st.f);emit('mastered',{st});recordDisc(['m:'+st.f.join('+')]);}
}
