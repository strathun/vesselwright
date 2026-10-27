export const COLS=5, ROWS=4, NS=COLS*ROWS;
export const LV=[0,60,170,340,600];
export const EL={
  ember:{name:'Ember',sym:'Em',hex:'#e07b3c',status:'burn',boon:'kindled',adj:'Searing'},
  rime:{name:'Rime',sym:'Ri',hex:'#8fc6e8',status:'chill',boon:'glaze',adj:'Frozen'},
  volt:{name:'Volt',sym:'Vo',hex:'#e6d35a',status:'shock',boon:'quick',adj:'Crackling'},
  gloom:{name:'Gloom',sym:'Gl',hex:'#a184dc',status:'hollow',boon:'veil',adj:'Hollow'},
  verd:{name:'Verdance',sym:'Ve',hex:'#7cbc66',status:'seed',boon:'bloom',adj:'Verdant'},
};
export const ELS=Object.keys(EL);
export const pk=(a,b)=>[a,b].sort().join('+');
export const PAIR={};
[['ember','ember','Inferno'],['rime','rime','Glacier'],['volt','volt','Tempest'],['gloom','gloom','Abyss'],['verd','verd','Wildwood'],
 ['ember','rime','Steam'],['ember','volt','Plasma'],['ember','gloom','Cinder'],['ember','verd','Ash'],['rime','volt','Aurora'],
 ['rime','gloom','Pallor'],['rime','verd','Frostbloom'],['volt','gloom','Eclipse'],['volt','verd','Galvanic'],['gloom','verd','Mire']
].forEach(([a,b,n])=>PAIR[pk(a,b)]=n);
export const STAT={
  burn:{n:'Burn',d:'damage each second on the part'},chill:{n:'Chill',d:'the foe charges slower'},shock:{n:'Shock',d:'knocks back the foe’s charge'},
  hollow:{n:'Hollow',d:'the foe’s next attack is weaker'},seed:{n:'Seed',d:'the foe feeds you each second'},
  kindled:{n:'Kindled',d:'your harms hit harder and may burn'},glaze:{n:'Glaze',d:'incoming damage reduced'},quick:{n:'Quick',d:'tempo refills faster'},
  veil:{n:'Veil',d:'attacks may miss you'},bloom:{n:'Bloom',d:'you regenerate'}
};
export const FX={
  strike:{cls:'verb',name:'Strike',sym:'St',kind:'harm',side:'foe',mag:14,form:'blunt',acc:88,tempo:38,rar:0,d:'A blunt blow to the aimed part.'},
  lance:{cls:'verb',name:'Lance',sym:'La',kind:'harm',side:'foe',mag:11,form:'pierce',acc:82,tempo:32,pen:.3,crit:.12,rar:1,d:'A piercing thrust. Slips past some armor and crits more often.'},
  ward:{cls:'verb',name:'Ward',sym:'Wa',kind:'ward',side:'self',mag:16,tempo:30,rar:0,d:'Raise a shield over the Vessel.'},
  mend:{cls:'verb',name:'Mend',sym:'Me',kind:'mend',side:'self',mag:12,tempo:42,rar:0,d:'Restore the Vessel’s vigor.'},
  hex:{cls:'verb',name:'Hex',sym:'Hx',kind:'hex',side:'foe',mag:10,acc:94,tempo:30,rar:1,d:'Lay a curse on a part. Its nature comes from the essences it reaches; bare, it only dazes.'},
  ember:{cls:'ess',el:'ember',name:'Ember',sym:'Em',rar:0,d:'Fire. Burns the foe; inward, it kindles.'},
  rime:{cls:'ess',el:'rime',name:'Rime',sym:'Ri',rar:0,d:'Frost. Chills the foe; inward, it glazes.'},
  volt:{cls:'ess',el:'volt',name:'Volt',sym:'Vo',rar:0,d:'Lightning. Shocks the foe’s charge back; inward, it quickens.'},
  gloom:{cls:'ess',el:'gloom',name:'Gloom',sym:'Gl',rar:1,d:'Shadow. Hollows the foe’s next blow; inward, it veils.'},
  verd:{cls:'ess',el:'verd',name:'Verdance',sym:'Ve',rar:1,d:'Growth. Seeds the foe to feed you; inward, it blooms.'},
  echo:{cls:'mod',name:'Echo',sym:'Ec',rar:0,d:'Every packet repeats at reduced strength.'},
  spread:{cls:'mod',name:'Spread',sym:'Sp',rar:0,d:'Packets bound for the foe wash over every part, weaker. Turned inward, they swell 25%.'},
  invert:{cls:'mod',name:'Invert',sym:'Iv',rar:1,d:'Every packet lands on the other side.'},
  siphon:{cls:'mod',name:'Siphon',sym:'Si',rar:1,d:'Each packet casts a faint reflection on the other side. Harm and mend trade places in the reflection.'},
  weight:{cls:'mod',name:'Weight',sym:'We',rar:2,d:'Far stronger, slower, and straining.'},
  quicken:{cls:'mod',name:'Quicken',sym:'Qu',rar:1,d:'Much cheaper in tempo, slightly weaker.'},
  keen:{cls:'mod',name:'Keen',sym:'Ke',rar:1,d:'Sharper: surer aim, more crits, cuts through armor, surer riders.'},
  fork:{cls:'mod',name:'Fork',sym:'Fo',rar:2,d:'Each packet splits a copy toward a different part.'},
  fuse:{cls:'mod',name:'Fuse',sym:'Fu',rar:2,d:'Packets are held back, then detonate amplified when your next rite resolves.'},
};
export const MODS=['echo','spread','invert','siphon','weight','quicken','keen','fork','fuse'];
export const KN={'harm:foe':['Harm','k-harm'],'harm:self':['Sacrifice','k-sac'],'mend:self':['Mend','k-mend'],'mend:foe':['Blight','k-blight'],
          'ward:self':['Ward','k-ward'],'ward:foe':['Brittle','k-brittle'],'hex:foe':['Hex','k-hex'],'hex:self':['Boon','k-boon']};
export const KIND_INFO={
  'harm:foe':['Damage to the foe’s parts.','Strike something.'],
  'harm:self':['You bleed, and the wound becomes Fury that empowers your next harm.','A blow can be turned inward.'],
  'mend:self':['Restore vigor; essences grant boons.','Tend the Vessel.'],
  'mend:foe':['Mercy that rots. Ignores armor and affinity, never misses. Wraiths dread it.','Some mercy wounds.'],
  'ward:self':['A shield. Essences on it lash back at whoever strikes it.','Raise a guard.'],
  'ward:foe':['A shield pressed onto a part cracks it; the part takes more damage.','A guard can be pressed onto an enemy.'],
  'hex:foe':['Lays each essence’s curse.','Curse a part.'],
  'hex:self':['Curses worn as blessings. Bare, it steadies you.','Curses can be worn.']
};
export const BLIGHT={beast:1,construct:.5,wraith:2};
export const EN={
  hound:{name:'Gutter Hound',fam:'beast',hp:60,ct:4.2,parts:[
    {n:'Head',sh:.3,arm:0,ev:12,aff:{pierce:1.3,ember:1.4,rime:.6},brk:'weaken'},
    {n:'Flank',sh:.45,arm:.1,ev:4,aff:{blunt:1.2,verd:1.2},brk:'expose'},
    {n:'Legs',sh:.25,arm:0,ev:22,aff:{rime:1.3},brk:'slow'}],
    moves:[{n:'Gnaw',p:0,pow:9,w:3},{n:'Lunge',p:2,pow:13,w:2},{n:'Howl',p:0,pow:0,fx:'enrage',w:1}],
    drops:['ember','strike','lance','keen','verd'],
    shapes:[{p:2,t:'rect',x:-38,y:44,w:8,h:26},{p:2,t:'rect',x:40,y:44,w:8,h:26},{p:1,t:'ell',x:0,y:0,rx:64,ry:30},{p:0,t:'ell',x:-80,y:-22,rx:26,ry:20}]},
  shade:{name:'Wailing Shade',fam:'wraith',hp:70,ct:5,parts:[
    {n:'Mask',sh:.4,arm:0,ev:18,aff:{blunt:.5,pierce:.6,ember:1.3,verd:1.4,gloom:.3},brk:'weaken'},
    {n:'Shroud',sh:.6,arm:0,ev:30,aff:{blunt:.4,pierce:.5,ember:1.5,volt:1.2,gloom:.3},brk:'slow'}],
    moves:[{n:'Wail',p:0,pow:7,fx:'strainUp',w:2},{n:'Grasp',p:1,pow:11,fx:'chillYou',w:2},{n:'Leech',p:1,pow:10,fx:'drain',w:2}],
    drops:['gloom','invert','siphon','hex'],
    shapes:[{p:1,t:'poly',pts:[[0,-62],[62,82],[26,64],[0,88],[-26,64],[-62,82]]},{p:0,t:'ell',x:0,y:-70,rx:24,ry:28}]},
  golem:{name:'Cellar Golem',fam:'construct',hp:110,ct:6.4,parts:[
    {n:'Shell',sh:.45,arm:.5,ev:0,aff:{blunt:1.4,pierce:.6,volt:1.5,gloom:.5},brk:'sunder'},
    {n:'Arms',sh:.3,arm:.3,ev:5,aff:{blunt:1.1,rime:1.2},brk:'weaken'},
    {n:'Core',sh:.25,arm:0,ev:28,aff:{pierce:1.5,volt:1.6,rime:.7},brk:'expose'}],
    moves:[{n:'Slam',p:1,pow:18,w:3},{n:'Grind',p:0,pow:11,fx:'pierceWard',w:2},{n:'Stoke',p:2,pow:0,fx:'armorUp',w:1}],
    drops:['volt','weight','ward','fork'],
    shapes:[{p:1,t:'rect',x:-94,y:6,w:18,h:48},{p:1,t:'rect',x:94,y:6,w:18,h:48},{p:0,t:'rect',x:0,y:0,w:66,h:62},{p:2,t:'ell',x:0,y:-6,rx:20,ry:20}]},
  toad:{name:'Thornback Toad',fam:'beast',hp:85,ct:5.2,parts:[
    {n:'Back',sh:.4,arm:.35,ev:0,aff:{ember:1.6,verd:.4,blunt:.8},brk:'sunder',thorns:true},
    {n:'Tongue',sh:.2,arm:0,ev:30,aff:{pierce:1.5,rime:1.3},brk:'weaken'},
    {n:'Belly',sh:.4,arm:0,ev:6,aff:{blunt:1.3,volt:1.3},brk:'expose'}],
    moves:[{n:'Lash',p:1,pow:11,w:3},{n:'Spit',p:2,pow:8,fx:'rot',w:2},{n:'Swell',p:0,pow:0,fx:'armorUp',w:1}],
    drops:['verd','quicken','mend','spread'],
    shapes:[{p:1,t:'rect',x:-98,y:10,w:32,h:4},{p:0,t:'ell',x:6,y:-8,rx:60,ry:34},{p:2,t:'ell',x:0,y:34,rx:52,ry:20}]},
  sentinel:{name:'Rust Sentinel',fam:'construct',hp:130,ct:6,passive:'aegis',parts:[
    {n:'Visor',sh:.25,arm:.1,ev:25,aff:{pierce:1.6,volt:1.4},brk:'weaken'},
    {n:'Plate',sh:.5,arm:.55,ev:0,aff:{blunt:1.3,rime:1.3,ember:.6},brk:'sunder'},
    {n:'Pike',sh:.25,arm:.2,ev:10,aff:{blunt:1.1},brk:'weaken'}],
    moves:[{n:'Thrust',p:2,pow:20,fx:'pierceWard',w:3},{n:'Scan',p:0,pow:0,fx:'focus',w:1},{n:'Bash',p:1,pow:14,w:2}],
    drops:['keen','fuse','lance','rime'],
    shapes:[{p:2,t:'rect',x:80,y:-5,w:7,h:92},{p:1,t:'rect',x:0,y:15,w:46,h:62},{p:0,t:'rect',x:0,y:-68,w:28,h:16}]},
  lich:{name:'Lantern Lich',fam:'wraith',hp:200,ct:5.6,boss:true,parts:[
    {n:'Lantern',sh:.25,arm:0,ev:20,aff:{ember:-.5,rime:1.6,blunt:.6,pierce:.7},brk:'weaken'},
    {n:'Crown',sh:.3,arm:.2,ev:15,aff:{volt:1.4,gloom:.2,blunt:.5,pierce:.6},brk:'slow'},
    {n:'Ribs',sh:.45,arm:.1,ev:5,aff:{blunt:.8,verd:1.5,gloom:.2,pierce:.5},brk:'expose'}],
    moves:[{n:'Pyre',p:0,pow:22,w:2},{n:'Hush',p:1,pow:9,fx:'strainUp',w:2},{n:'Wither',p:2,pow:14,fx:'drain',w:2},{n:'Gather',p:1,pow:0,fx:'focus',w:1}],
    drops:['fuse','weight','fork','gloom'],
    shapes:[{p:2,t:'ell',x:0,y:22,rx:44,ry:56},{p:1,t:'poly',pts:[[-32,-46],[-24,-80],[-10,-58],[0,-90],[10,-58],[24,-80],[32,-46]]},{p:0,t:'ell',x:82,y:-12,rx:16,ry:22}]},
  effigy:{name:'Practice Effigy',fam:'beast',hp:9999,ct:6,effigy:true,parts:[
    {n:'Charm',sh:.2,arm:0,ev:20,aff:{pierce:1.4,gloom:1.5,volt:1.2},brk:null},
    {n:'Straw',sh:.6,arm:0,ev:0,aff:{ember:1.8,blunt:1.1,rime:.7},brk:null},
    {n:'Plate',sh:.2,arm:.5,ev:0,aff:{blunt:1.3,pierce:.6,volt:1.5,ember:.5},brk:null}],
    moves:[{n:'Sway',p:1,pow:5,w:1}],drops:[],
    shapes:[{p:1,t:'ell',x:0,y:12,rx:32,ry:74},{p:2,t:'rect',x:0,y:-4,w:40,h:18},{p:0,t:'ell',x:0,y:-82,rx:15,ry:15}]},
};
export const BRK={weaken:'its blows weaken',slow:'it charges slower',sunder:'its armor is sundered',expose:'it is exposed to all harm'};
export const DEPTHS=[null,['hound','shade'],['golem','hound','toad'],['shade','sentinel','toad'],['golem','sentinel','lich']];
export function lineup(d){ if(d<DEPTHS.length) return DEPTHS[d].slice(); const pool=['hound','shade','golem','toad','sentinel']; const a=pool[d%5], b=pool[(d*3+1)%5]; return [a,b===a?pool[(d+2)%5]:b,'lich']; }
export const PRICE=[15,28,45];
