/* Evergrove v0.16 — ORIGINAL farming, village life, and sword/hunting systems.
   Mechanically inspired by classic farming/adventure games; no external ROM assets. */
(()=>{'use strict';
const game=window.EvergroveNavGame;if(!game)return;
const state=()=>game.state(),player=()=>game.player();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const dirAngle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
const CROPS={
 seed:{name:'Turnip',item:'turnip',icon:'🥬',season:['Spring','Autumn'],days:4,price:12,color:'#eff0ca'},
 carrotSeed:{name:'Carrot',item:'carrot',icon:'🥕',season:['Spring','Autumn'],days:6,price:17,color:'#eb8e54'},
 cornSeed:{name:'Sun Corn',item:'corn',icon:'🌽',season:['Summer'],days:8,regrow:3,price:23,color:'#f4d56b'},
 pumpkinSeed:{name:'Moon Pumpkin',item:'pumpkin',icon:'🎃',season:['Autumn'],days:9,price:40,color:'#e8a654'}
};
const SEEDIDS=Object.keys(CROPS),SEASONS=['Spring','Summer','Autumn','Winter'];
const MONSTER_DEFS={
 mossling:{name:'Mossling',hp:34,color:'#79c787',speed:1.04,aggro:5,range:.95,damage:5,windup:.45,loot:'fiber'},
 emberfox:{name:'Emberfox',hp:46,color:'#ec996a',speed:1.4,aggro:6.1,range:1.05,damage:8,windup:.55,loot:'essence'},
 puddlepuff:{name:'Puddlepuff',hp:38,color:'#8ecbe6',speed:.9,aggro:4.6,range:1,damage:6,windup:.75,loot:'herb'},
 treant:{name:'Bramble Treant',color:'#547f55',hp:85,speed:.7,aggro:6,range:1.35,damage:13,windup:.95,loot:'wood'},
 thornboar:{name:'Thornboar',color:'#c1a46a',hp:60,speed:1.35,aggro:6,range:1.08,damage:9,windup:.58,loot:'fiber'},
 cragling:{name:'Cragling',color:'#9b8a8e',hp:65,speed:.85,aggro:5.6,range:1.2,damage:11,windup:.8,loot:'ore'},
 tidewisp:{name:'Tide Wisp',color:'#6bbdc5',hp:48,speed:1.45,aggro:6.4,range:1,damage:8,windup:.65,loot:'herb'}
};
const HUNTS={
 'autumn-grove':{title:'Bramble Hollow',type:'treant',spots:[[17,11],[52,12],[16,37],[55,37]]},
 'starglow-highlands':{title:'Stonefall Ridge',type:'cragling',spots:[[12,11],[52,15],[20,37],[49,36]]},
 'sunmeadow-plains':{title:'Thornbush Trail',type:'thornboar',spots:[[13,15],[51,12],[18,36],[49,35]]},
 'moonlit-coast':{title:'Silverwater Shore',type:'tidewisp',spots:[[15,11],[52,13],[18,36],[47,40]]}
};
const GATHER_SPOTS={
 'autumn-grove':[[21,17,'mushroom'],[47,35,'herb'],[13,34,'mushroom']],
 'starglow-highlands':[[17,19,'herb'],[51,30,'ore'],[18,36,'herb']],
 'sunmeadow-plains':[[20,16,'berry'],[49,34,'herb'],[13,36,'berry']],
 'moonlit-coast':[[16,19,'seashell'],[51,31,'seashell'],[20,37,'herb']]
};
const VILLAGERS=[
 {id:'elara',name:'Elara',title:'Market gardener',x:26,y:24,color:'#d8aa89',emoji:'👩🏽‍🌾',favorite:'carrot',romance:true,line:'I bring fresh produce into town every morning.'},
 {id:'bram',name:'Bram',title:'Village guard',x:41,y:28,color:'#9bb4d3',emoji:'🛡️',favorite:'ore',romance:false,line:'Hunting grounds are safer if you watch for an enemy wind-up.'},
 {id:'sora',name:'Sora',title:'Herbalist',x:35,y:32,color:'#bf9fc7',emoji:'🌿',favorite:'herb',romance:true,line:'Herbs grow where the forest meets the open paths.'}
];
let attack={kind:'',time:0,until:0,angle:0}, charging=null,autotime=0,npcTimer=0,actors={},recentHits=new WeakMap();
const statusEl=()=>document.getElementById('livingStatus');
function season(){return SEASONS[Math.floor((state().day-1)/30)%4];}
function seedChoice(){const s=state();return CROPS[s.seedChoice]?s.seedChoice:'seed';}
function updateBadge(){const box=statusEl();if(!box)return;const s=state(),seed=CROPS[seedChoice()],rest=season();
 box.textContent='🌾 '+rest+' · '+seed.icon+' '+seed.name+' seeds '+(s.inventory[seedChoice()]||0)+' · Press R to change';
 box.title='When Seeds are equipped, press R or tap this display to choose a different seed.';}
function cycleSeed(){const s=state(),n=SEEDIDS.indexOf(seedChoice());s.seedChoice=SEEDIDS[(n+1)%SEEDIDS.length];updateBadge();game.notify('🌱 Selected '+CROPS[s.seedChoice].name+' seed bag');game.save();}
function init(){
 for(const p of VILLAGERS)if(!game.npcs.some(n=>n.id===p.id))game.npcs.push({...p,home:{x:p.x,y:p.y},scheduleAt:0,route:[],dir:'down'});
 const c=document.createElement('button');c.id='livingStatus';c.type='button';c.className='living-badge';c.addEventListener('click',cycleSeed);
 (document.getElementById('gameFrame')||document.body).appendChild(c);
 updateBadge();
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-game-tool="seeds"]');if(b&&state().selected==='seeds')cycleSeed();},true);
 window.addEventListener('keydown',e=>{if(e.code==='KeyR'&&!game.modal()&&!e.target.closest?.('input,textarea,select')){e.preventDefault();e.stopImmediatePropagation();cycleSeed();}},true);
 const attackKeys=new Set(['Space','KeyF','KeyX']);
 const attackActive=()=>!game.modal()&&state().selected==='sword';
 window.addEventListener('keydown',e=>{
  if(!attackKeys.has(e.code)||!attackActive()||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)beginCharge();
 },true);
 window.addEventListener('keyup',e=>{
  if(!attackKeys.has(e.code)||!charging)return;
  e.preventDefault();e.stopImmediatePropagation();releaseCharge();
 },true);
 const button=document.getElementById('touchUse');
 if(button){
  button.addEventListener('pointerdown',e=>{if(attackActive()){e.preventDefault();beginCharge();}},true);
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,e=>{if(charging){e.preventDefault();releaseCharge();}},true);
  button.addEventListener('click',e=>{if(attackActive()){e.preventDefault();e.stopImmediatePropagation();}},true);
 }
 window.addEventListener('blur',()=>{if(charging)releaseCharge();});
}
function attemptEnergy(cost){return game.consumeEnergy(cost);}
function resourceText(txt){game.notify(txt);game.updateUI();game.save();}
function eligible(x,y){const type=game.typeAt(x,y),key=x+','+y,st=state();
 return ['farm','grass'].includes(type)&&!game.blocked(x+.5,y+.5)&&!st.placed.some(o=>o.x===x&&o.y===y)&&!st.crops[key];}
function farmAction(tool,x,y){
 if(!['hoe','seeds','water'].includes(tool))return false;
 const s=state(),key=x+','+y,crop=s.crops[key];
 if(tool==='hoe'){
  if(s.tilled[key]){game.notify('This soil is already prepared.');return true;}
  if(!eligible(x,y)){game.notify('Clear an open field tile before using the hoe.');return true;}
  if(!attemptEnergy(2))return true;
  s.tilled[key]=true;game.fx(x+.5,y+.5,'🤎');game.save();return true;
 }
 if(tool==='seeds'){
  const chosen=seedChoice(),info=CROPS[chosen];
  if(!info.season.includes(season())){game.notify(info.name+' grows in '+info.season.join(' / ')+'.');return true;}
  if((s.inventory[chosen]||0)<1){game.notify('No '+info.name+' seed bags. Buy one from Willow Market.');return true;}
  if(!s.tilled[key]){game.notify('Prepare the center tile with the hoe first.');return true;}
  const plots=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const tx=x+dx,ty=y+dy,id=tx+','+ty;
    if(s.tilled[id]&&eligible(tx,ty))plots.push(id);
  }
  if(!plots.length){game.notify('No prepared empty tiles in this 3×3 patch.');return true;}
  if(!attemptEnergy(2))return true;
  for(const id of plots)s.crops[id]={kind:chosen,progress:0,stage:0,watered:false,planted:s.day};
  const planted=plots.length;
  game.give(chosen,-1);game.fx(x+.5,y+.5,info.icon);resourceText('🌱 Sowed '+planted+' '+info.name+' tiles from one seed bag.');
  return true;
 }
 if(!crop){game.notify('No crop here. Prepare the soil and plant seeds.');return true;}
 const info=CROPS[crop.kind]||CROPS.seed;const mature=(crop.progress??(crop.stage||0)*2)>=info.days||crop.stage>=3;
 if(mature){
  if(!attemptEnergy(2))return true;
  game.give(info.item,1);s.stats.harvested++;s.player.gold+=info.price;game.earnXP(18);
  game.fx(x+.5,y+.5,info.icon);
  if(info.regrow){crop.progress=info.days-info.regrow;crop.stage=2;crop.watered=false;}
  else{delete s.crops[key];delete s.tilled[key];}
  resourceText(info.icon+' Harvested '+info.name+' · +'+info.price+'g');
  return true;
 }
 if(crop.watered){game.notify('Already watered this plot today.');return true;}
 if(!attemptEnergy(1))return true;
 crop.watered=true;game.fx(x+.5,y+.5,'💧');game.save();return true;
}
function advanceDay(){
 const s=state();let ripe=0;
 const newSeason=SEASONS[Math.floor(s.day/30)%4],isChange=season()!==newSeason;
 for(const [id,crop] of Object.entries(s.crops)){
  const info=CROPS[crop.kind]||CROPS.seed;
  if(crop.progress===undefined)crop.progress=Math.min(info.days,(crop.stage||0)*2);
  if(isChange&&!info.season.includes(newSeason)){delete s.crops[id];delete s.tilled[id];continue;}
  if(crop.watered||s.weather==='Rain')crop.progress=Math.min(info.days,crop.progress+1);
  crop.stage=crop.progress>=info.days?3:crop.progress>=info.days*.6?2:crop.progress>=info.days*.25?1:0;
  if(crop.stage===3)ripe++;
  crop.watered=false;
 }
 return ripe;
}
function cropPaint(x,y,crop){
 const info=CROPS[crop.kind]||CROPS.seed;
 const c=game.ctx,T=game.T,cam=game.camera(),px=x*T-cam.x,py=y*T-cam.y;
 game.drawSoil(px,py,crop.watered);
 const stage=crop.stage||0;
 const color=stage===3?info.color:'#73a966';
 c.fillStyle='#478c62';c.fillRect(px+15,py+13,4,17);
 c.fillStyle='#79bd70';c.fillRect(px+8,py+11,8,7);c.fillRect(px+19,py+13,9,6);
 if(stage>=1){c.fillStyle='#57995b';c.fillRect(px+12,py+7,7,11);c.fillRect(px+6,py+16,7,6);}
 if(stage>=2){c.fillStyle=color;c.fillRect(px+10,py+14,15,15);c.fillRect(px+13,py+9,11,8);}
 if(stage===3){c.fillStyle=color;c.fillRect(px+7,py+14,20,14);c.fillStyle='#f5dfad';c.fillRect(px+12,py+11,5,4);c.font='13px serif';c.fillText(info.icon,px+7,py+15);}
}
function planNPC(n,target){
 const w=68,h=48,start={x:Math.floor(n.x),y:Math.floor(n.y)},goal={x:Math.floor(target.x),y:Math.floor(target.y)};
 const q=[start],seen=new Set([start.x+','+start.y]),prev=new Map();let end=start,head=0;
 const pass=(x,y)=>x>=1&&y>=1&&x<w-1&&y<h-1&&!game.blocked(x+.5,y+.5);
 while(head<q.length&&head<3300){
  const p=q[head++];end=p;if(p.x===goal.x&&p.y===goal.y)break;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=p.x+dx,y=p.y+dy,k=x+','+y;if(seen.has(k)||!pass(x,y))continue;
   seen.add(k);prev.set(k,p.x+','+p.y);q.push({x,y});
  }
 }
 const route=[];let k=end.x+','+end.y;
 while(prev.has(k)&&route.length<500){const [x,y]=k.split(',').map(Number);route.push({x,y});k=prev.get(k);}
 n.route=route.reverse();
}
function npcDestination(n,time){
 const h=time/60;
 if(h<9)return n.home;
 if(h<12)return {x:34,y:23};
 if(h<16)return n.id==='bram'?{x:43,y:29}:n.id==='sora'?{x:29,y:32}:{x:29,y:25};
 if(h<19)return {x:38,y:29};
 return n.home;
}
function updateNpc(dt){
 const t=state().time;
 for(const n of game.npcs){
  n.walking=false;
  if(!n.home)n.home={x:n.x,y:n.y};
  n.route=n.route||[];
  if(n.scheduleAt===undefined)n.scheduleAt=0;
  if(autotime>=n.scheduleAt){
   const target=npcDestination(n,t);n.scheduleAt=autotime+4+(n.x*17%3);
   if(Math.hypot(n.x-target.x,n.y-target.y)>1.5)planNPC(n,target);
  }
  if(!n.route.length)continue;
  const target=n.route[0],dx=target.x-n.x,dy=target.y-n.y,d=Math.hypot(dx,dy);
  if(d<.06){n.route.shift();continue;}
  const step=Math.min(d,.8*dt),nx=n.x+dx/d*step,ny=n.y+dy/d*step;
  if(game.blocked(nx+.5,ny+.5)){n.route=[];continue;}
  n.x=nx;n.y=ny;n.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  n.walking=true;
 }
}
function monstersFor(map){
 const id=map?.id;if(!HUNTS[id])return[];
 if(!actors[id]){
  const def=HUNTS[id];
  actors[id]=def.spots.map((xy,i)=>({id:id+'-'+i,type:def.type,x:xy[0]+.5,y:xy[1]+.5,homeX:xy[0]+.5,homeY:xy[1]+.5,hp:MONSTER_DEFS[def.type].hp,alive:true,respawn:0,cooldown:0,windup:0,stun:0,mode:'idle',moveTimer:0}));
 }
 return actors[id];
}
function monsterDef(m){return MONSTER_DEFS[m.type]||{name:'Wild Spirit',color:'#9dbf95',hp:40,speed:1,aggro:5,range:1,damage:7,windup:.6,loot:'essence'};}
function defeat(m,inExpansion){
 m.alive=false;m.respawn=25;m.windup=0;
 const s=state();s.stats.defeated++;game.give('essence',1);
 if(inExpansion){game.give(monsterDef(m).loot,1);game.notify('✨ Defeated '+monsterDef(m).name+' · Essence +1, '+monsterDef(m).loot+' +1');}
 else game.notify('✨ Creature defeated · Spirit essence +1');
 game.earnXP(28);game.fx(m.x,m.y,'✨');game.updateUI();game.save();
}
function hurt(m,damage,inExpansion){
 if(!m.alive)return;
 m.hp-=damage;m.stun=.25;m.windup=0;game.fx(m.x,m.y,'💥');
 if(m.hp<=0)defeat(m,inExpansion);
}
function walkableExpansion(map,x,y){
 if(x<1||y<1||x>=map.width-1||y>=map.height-1)return false;
 const xx=Math.floor(x),yy=Math.floor(y);
 if(['water','cliff'].includes(map.terrain?.[xx+','+yy]))return false;
 return !(map.objects||[]).some(o=>o.x===xx&&o.y===yy&&isResourceVisible(map,o));
}
function hitPlayer(m,def){
 const s=state(),p=player();p.hp=Math.max(0,p.hp-def.damage);game.fx(p.x,p.y,'💢');
 if(p.hp>0)return;
 p.hp=100;p.energy=65;p.gold=Math.max(0,p.gold-15);
 if(window.EvergroveExpansion?.active())window.EvergroveExpansion.travel('base',{x:17.5,y:27.5});
 else{p.x=17.5;p.y=27.5;}
 game.notify('💔 You fainted and woke at your cottage (−15g).');
 game.save();
}
function runMonster(m,dt,map=null){
 if(!m.alive){m.respawn-=dt;if(m.respawn<=0){m.alive=true;m.hp=monsterDef(m).hp;m.x=m.homeX||m.spawnX;m.y=m.homeY||m.spawnY;m.mode='idle';}return;}
 const def=monsterDef(m),p=player(),d=dist(m,p);
 m.cooldown=Math.max(0,(m.cooldown||0)-dt);m.stun=Math.max(0,(m.stun||0)-dt);
 if(m.stun>0)return;
 if(m.windup>0){
  m.windup-=dt;m.mode='windup';
  if(m.windup<=0){
   if(dist(m,p)<def.range+.36)hitPlayer(m,def);
   m.cooldown=1.2;m.mode='recover';
  }
  return;
 }
 if(d<def.range&&m.cooldown<=0){m.windup=def.windup;m.mode='windup';return;}
 if(m.cooldown>0&&d<2){m.mode='recover';return;}
 let dx=0,dy=0;
 if(d<def.aggro&&d>def.range*.65){dx=(p.x-m.x)/d;dy=(p.y-m.y)/d;m.mode='chase';}
 else {m.moveTimer=(m.moveTimer||0)-dt;if(m.moveTimer<=0){m.moveTimer=2+Math.random()*3;const a=Math.random()*Math.PI*2;m.dx=Math.cos(a);m.dy=Math.sin(a);}
  dx=m.dx||0;dy=m.dy||0;m.mode='patrol';
 }
 const step=def.speed*dt*(m.mode==='chase'?1:.42);
 const pass=(x,y)=>map?walkableExpansion(map,x,y):(!game.blocked(x,y)&&x>=46&&x<=game.MW-1.5&&y>=12&&y<=game.MH-1.5);
 if(pass(m.x+dx*step,m.y))m.x+=dx*step;
 if(pass(m.x,m.y+dy*step))m.y+=dy*step;
}
function updateBaseMonsters(dt,all){for(const m of all){if(m.homeX===undefined){m.homeX=m.spawnX;m.homeY=m.spawnY;}runMonster(m,dt);}}
function updateBase(dt){autotime+=dt;npcTimer+=dt;updateNpc(dt);attackTick(dt);if(npcTimer>2){npcTimer=0;updateBadge();}}
function updateExpansion(dt,map){
 autotime+=dt;attackTick(dt);for(const m of monstersFor(map))runMonster(m,dt,map);
}
function attackTick(dt){if(attack.until>0){attack.until-=dt;if(attack.until<0)attack.until=0;}}
function beginCharge(){if(charging||game.modal()||state().selected!=='sword')return;charging={at:performance.now()};}
function releaseCharge(){
 if(!charging)return;
 const held=(performance.now()-charging.at)/1000;charging=null;
 swing(held>=.78?'spin':'slash');
}
function swing(kind='slash'){
 if(state().selected!=='sword'||game.modal())return false;
 if(attack.until>0)return true;
 const cost=kind==='spin'?13:4;if(!attemptEnergy(cost))return true;
 const p=player(),angle=dirAngle[p.dir]??0,active=window.EvergroveExpansion?.active();
 attack={kind,time:.3,until:kind==='spin'?.5:.22,angle};
 const monsters=active?monstersFor(window.EvergroveExpansion.currentMap?.()):game.monsters();
 let hits=0;
 for(const m of monsters){
  if(!m.alive)continue;
  const d=dist(p,m),a=Math.atan2(m.y-p.y,m.x-p.x);
  const relative=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));
  if(d>(kind==='spin'?2.35:2.1)||kind==='slash'&&Math.abs(relative)>Math.PI*.38)continue;
  hurt(m,kind==='spin'?38+Math.max(0,p.level-1)*2:19+Math.max(0,p.level-1)*2,!!active);hits++;
 }
 game.fx(p.x,p.y,kind==='spin'?'🌀':'⚔️');
 if(hits)game.notify((kind==='spin'?'🌀 Spin strike':'⚔️ Sword slash')+' hit '+hits+' monster'+(hits===1?'':'s'));
 game.updateUI();game.save();return true;
}
function swordAction(){return swing('slash');}
function drawVillageDecor(sprites){
 const decorations=[
  {x:29,y:27,type:'lantern'},{x:45,y:28,type:'lantern'},
  {x:37,y:26,type:'flower-stall'},{x:39,y:30,type:'fruit-cart'},{x:35,y:30,type:'sign'}
 ];
 for(const d of decorations)sprites.push({y:d.y+.25,draw:()=>{
  const c=game.ctx,T=game.T,cam=game.camera(),x=d.x*T-cam.x,y=d.y*T-cam.y;
  c.save();
  if(d.type==='lantern'){
   c.fillStyle='#695a4a';c.fillRect(x+13,y-17,5,34);
   c.fillStyle='#e8b96e';c.fillRect(x+7,y-18,18,15);
   c.fillStyle='#ffeeaa';c.fillRect(x+11,y-16,10,10);
  }else if(d.type==='sign'){
   c.fillStyle='#79634b';c.fillRect(x+14,y-13,5,31);
   c.fillStyle='#e5c39a';c.fillRect(x+3,y-18,28,13);
   c.fillStyle='#55745b';c.fillRect(x+8,y-14,18,4);
  }else{
   c.fillStyle='#896449';c.fillRect(x+3,y+6,27,12);
   c.fillStyle=d.type==='fruit-cart'?'#c9b17b':'#cd8984';
   c.fillRect(x+1,y-9,30,8);
   c.fillStyle=d.type==='fruit-cart'?'#f0ce6a':'#eeacb7';
   c.fillRect(x+8,y+1,7,6);c.fillRect(x+19,y+1,6,6);
  }
  c.restore();
 }});
}
function drawCombat(){
 const c=game.ctx,cam=game.camera(),p=player(),T=game.T;
 if(charging){
  const progress=clamp((performance.now()-charging.at)/780,0,1);
  c.save();c.strokeStyle=progress===1?'#ffe68c':'#a4e7cb';c.lineWidth=4;
  c.beginPath();c.arc(p.x*T-cam.x,p.y*T-cam.y-21,20,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  c.restore();
 }
 if(attack.until>0){
  const x=p.x*T-cam.x,y=p.y*T-cam.y-6;
  c.save();c.strokeStyle=attack.kind==='spin'?'#fff2b0':'#d9f7ff';c.lineWidth=6;c.shadowColor='#e4f2b8';c.shadowBlur=11;
  c.beginPath();
  if(attack.kind==='spin')c.arc(x,y,52,0,Math.PI*2);
  else c.arc(x,y,46,attack.angle-.70,attack.angle+.70);
  c.stroke();c.restore();
 }
 if(!window.EvergroveExpansion?.active()){
  for(const m of game.monsters()){if(!m.alive||m.windup<=0)continue;
   const sx=m.x*T-cam.x,sy=m.y*T-cam.y;
   c.save();c.strokeStyle='#ff8c76';c.lineWidth=3;c.beginPath();c.arc(sx,sy,18+5*Math.sin(performance.now()/80),0,Math.PI*2);c.stroke();c.restore();
  }
 }
}
function drawExpansion(map,c,cx,cy){
 const T=game.T;
 for(const [x,y,item] of GATHER_SPOTS[map.id]||[]){
  if((state().gatheredAreas?.[map.id+':forage:'+x+','+y]||0)>state().day)continue;
  const px=(x+.5)*T-cx,py=(y+.5)*T-cy;
  c.save();c.fillStyle=item==='seashell'?'#bbebdc':item==='mushroom'?'#e9b0a3':item==='ore'?'#c6c3d8':'#a6da7d';
  c.fillRect(px-5,py-7,11,12);c.fillStyle='#e9f5ba';c.fillRect(px-2,py-12,4,5);
  c.restore();
 }
 for(const m of monstersFor(map)){
  if(!m.alive)continue;const def=monsterDef(m),x=Math.round(m.x*T-cx),y=Math.round(m.y*T-cy);
  c.save();c.fillStyle='#143f3344';c.fillRect(x-13,y+8,28,6);
  if(m.type==='treant'){
   c.fillStyle='#725b43';c.fillRect(x-11,y-21,23,31);c.fillStyle='#367555';c.fillRect(x-19,y-30,39,17);
   c.fillRect(x-23,y-24,12,19);c.fillRect(x+11,y-24,12,19);c.fillStyle='#d6b678';c.fillRect(x-5,y-13,4,4);c.fillRect(x+5,y-13,4,4);
   c.fillStyle='#8cd47a';c.fillRect(x-15,y-28,9,5);
  }else{
   c.fillStyle=def.color;c.fillRect(x-14,y-17,28,26);
   c.fillRect(x-10,y-22,7,8);c.fillRect(x+5,y-22,7,8);
   c.fillStyle='#eaf3cf';c.fillRect(x-7,y-7,5,4);c.fillRect(x+4,y-7,5,4);
  }
  if(m.mode==='chase'){c.fillStyle='#ffe3a1';c.font='bold 15px sans-serif';c.fillText('!',x-2,y-38);}
  if(m.windup>0){c.strokeStyle='#f17772';c.lineWidth=3;c.beginPath();c.arc(x,y,22+4*Math.sin(performance.now()/85),0,Math.PI*2);c.stroke();}
  if(m.hp<def.hp){c.fillStyle='#453f46';c.fillRect(x-16,y-37,32,5);c.fillStyle='#b9db88';c.fillRect(x-15,y-36,30*Math.max(0,m.hp)/def.hp,3);}
  c.restore();
 }
}
function isResourceVisible(map,obj){
 const id=map.id+':'+obj.x+','+obj.y;
 return (state().gatheredAreas?.[id]||0)<=state().day;
}
function interactExpansion(){
 const map=window.EvergroveExpansion?.currentMap?.();if(!map)return false;
 const s=state(),p=player();
 for(const [x,y,item] of GATHER_SPOTS[map.id]||[]){
  const key=map.id+':forage:'+x+','+y;
  if((s.gatheredAreas?.[key]||0)>s.day||dist(p,{x:x+.5,y:y+.5})>1.8)continue;
  s.gatheredAreas=s.gatheredAreas||{};s.gatheredAreas[key]=s.day+2;
  game.give(item,1);game.fx(x+.5,y+.5,item==='herb'?'🌿':item==='mushroom'?'🍄':item==='seashell'?'🐚':'🫐');
  resourceText('Foraged '+item+' in '+map.name);return true;
 }
 game.notify('Explore the hunting grounds, harvest glowing plants, or use tools on rocks and trees.');
 return true;
}
function expansionAction(tool,x,y){
 const map=window.EvergroveExpansion?.currentMap?.();
 if(!map)return false;
 const p=player();
 if(dist(p,{x:x+.5,y:y+.5})>2.8){game.notify('Move closer to the resource.');return true;}
 const obj=map.objects?.find(o=>o.x===x&&o.y===y&&isResourceVisible(map,o));
 if((tool==='axe'&&obj?.type==='tree')||(tool==='pick'&&obj?.type==='rock')){
  if(!attemptEnergy(tool==='axe'?4:5))return true;
  const id=map.id+':'+obj.x+','+obj.y;
  state().gatheredAreas=state().gatheredAreas||{};state().gatheredAreas[id]=state().day+2;
  game.give(tool==='axe'?'wood':'ore',tool==='axe'?3:2);
  if(tool==='axe')game.give('fiber',1);else game.give('stone',1);
  game.fx(x+.5,y+.5,tool==='axe'?'🪵':'💎');
  resourceText(tool==='axe'?'🪵 Gathered wood and fiber':'⛏️ Gathered ore and stone');
  return true;
 }
 if(tool==='sword')return swordAction();
 if(tool==='orb'){game.notify('Hunting-ground creatures cannot be captured yet.');return true;}
 if(tool==='hoe'||tool==='seeds'||tool==='water'){game.notify('This is a wilderness hunting area. Farm in Willow Valley.');return true;}
 if(obj)game.notify('Use the '+(obj.type==='tree'?'axe':'pickaxe')+' to gather this resource.');
 return true;
}
init();
window.EvergroveLiving={season,cycleSeed,farmAction,advanceDay,cropPaint,swordAction,beginCharge,releaseCharge,drawCombat,drawVillageDecor,interactExpansion,updateBase,updateBaseMonsters,updateExpansion,drawExpansion,expansionAction,isResourceVisible,currentMonsters:()=>monstersFor(window.EvergroveExpansion?.currentMap?.()),HUNTS,CROPS};
})();
