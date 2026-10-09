/* Evergrove v0.18 · 81-map expedition. Original procedural scenes, no monsters.
   Reads maps/progression-60.json; keeps original worlds.json and v1 save format.
   Browser Canvas, mobile joystick, keyboard and click-to-run supported. */
(()=>{
'use strict';
const api=window.EvergroveNavGame,registry=window.EvergroveProgression;
if(!api||!registry)return;
const T=api.T,W=68,H=48,STAGE_W=W*T,STAGE_H=H*T,ENTER={x:34,y:41},
 COLORS={
 grass:['#80ae71','#72a666','#8fbc7b'],forest:['#598d65','#467d57','#65986e'],
 snow:['#e1e6dc','#cddcd9','#f4eede'],ice:['#abd4df','#c9e4e9','#91becb'],
 pine:['#3d7868','#4e8871','#658f7d'],sand:['#d8bf83','#e5cc93','#bdac76'],
 'dry-rock':['#b79876','#c6a080','#a9846a'],scrub:['#abac77','#8e9a68','#c7b67d'],
 stone:['#a49e92','#989d94','#bdaf98'],rubble:['#91948d','#8a8581','#b0ada5'],
 water:['#3d91b3','#51a7bf','#3b84ac'],reeds:['#6e9e79','#7dae78','#8cb986'],
 'wet-grass':['#78a48b','#699589','#83b3a0'],path:['#b5a58c','#c6b7a0','#a89981'],
 'stone-path':['#b8b3a6','#ccc8b7','#979d9b'],'earth-path':['#b6a087','#bea885','#c6ac88'],
 rock:['#8f837a','#a69a84','#776e6e'],cliff:['#656b70','#7c7f7f','#555f63'],
 lava:['#b65b42','#ee9152','#ac483f'],farm:['#a0a873','#adba7b','#9aa874'],
 'town-road':['#b8afa2','#c9c5b6','#a29f94']
};
const DIR={north:{x:34,y:2},south:{x:34,y:45}};
let data=null,map=null,scene=null,paint=null,route=[],holdUntil=0,previousTime=0,initialized=false,loadingError=null,launchVisible=false,openedTab='expedition',chapter=1,focusId='level-01';
const normId=v=>typeof v==='string'&&(v==='base'||/^level-(0[1-9]|[1-5][0-9]|60)$/.test(v)||/^town-(0[1-9]|1[0-9]|20)$/.test(v));
const planned=v=>v!=='base'&&normId(v);
const state=()=>api.state(),p=()=>api.player(),random=(x,y,s=1)=>{let v=Math.imul(x+284,73856093)^Math.imul(y+739,19349663)^Math.imul(s+29,83492791);v=Math.imul(v^(v>>>13),1274126177);return(v>>>0)/4294967296;};
const fill=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
const safe=(x,y)=>Math.max(0,Math.min(x,y));
const index=(x,y)=>y*W+x;
const clip=(v,min,max)=>Math.max(min,Math.min(v,max));
const current=()=>state()?.activeMap;
const isActive=()=>planned(current());
const owns=v=>registry.get(v);
const arrival=(side)=>side==='north'?{x:34.5,y:5.5}:{x:34.5,y:42.5};
const dis=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function nearest(mapScene,x,y){
 const cx=clip(Math.floor(x),1,W-2),cy=clip(Math.floor(y),1,H-2);
 if(mapScene.walkable[index(cx,cy)])return{x:cx+.5,y:cy+.5};
 for(let r=1;r<36;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const px=cx+dx,py=cy+dy;if(px<1||py<1||px>W-2||py>H-2)continue;
  if(mapScene.walkable[index(px,py)])return{x:px+.5,y:py+.5};
 }
 return{x:34.5,y:24.5};
}
function terrainFor(m,x,y){
 const stage=m.layout?.terrain,seed=m.layout?.generation?.seed||34;
 const center=34+Math.round(Math.sin(y*.13+seed*.0001)*4+Math.cos(y*.26+seed*.0002)*3);
 const gateway=(y<7||y>40)?34:center;
 const pathWide=(y<7||y>40)?4:(stage?.openWalkwayWidth||5);
 const nearTrail=Math.abs(x-gateway)<=Math.max(2,pathWide/2);
 const mainPlaza=m.kind!=='level'&&Math.abs(x-34)<8&&Math.abs(y-24)<8;
 const townRoad=m.kind!=='level'&&(Math.abs(x-34)<=4||Math.abs(y-25)<=3||[12,22,38].some(l=>Math.abs(y-l)<=1));
 if(townRoad||mainPlaza)return'town-road';
 if(nearTrail&&m.kind==='level')return stage?.primaryTerrain==='snow'?'stone-path':stage?.primaryTerrain==='sand'?'earth-path':'path';
 const mix=stage?.terrainMix||['grass','forest','earth-path','stone'];
 const primary=stage?.primaryTerrain||'grass',r=random(x,y,seed);
 const nearEdge=x<4||x>63||y<4||y>43;
 if(m.kind!=='level'){
  if(nearEdge&&r>.4)return'forest';
  return r<.11?'forest':'grass';
 }
 const density=stage?.coverDensityPercent||20;
 if((/lake|swamp|coast|river|canal/.test(m.biome))&&r<.10+(stage?.waterCoverPercent||0)/150&&x<25)return'water';
 if((/snow|taiga/.test(m.biome))&&r<.1)return'ice';
 if((/volcanic/.test(m.biome))&&r>.92)return'lava';
 if((/desert|canyon/.test(m.biome))&&r>.88)return'dry-rock';
 if((/abandoned|ruins|fortified|royal/.test(m.biome))&&r>.79)return'rubble';
 if(r<density/100)return mix[1]||primary;
 return primary;
}
function build(m){
 const tiles=new Array(W*H),walkable=new Uint8Array(W*H),objects=[],buildings=m.kind==='level'?[]:m.layout.buildings;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let t=terrainFor(m,x,y);
  const isGateApproach=Math.abs(x-34)<=3&&(y<=8||y>=39);
  if(isGateApproach)t=m.kind==='level'?'path':'town-road';
  tiles[index(x,y)]=t;
  walkable[index(x,y)]=!['water','cliff','lava'].includes(t)?1:0;
 }
 if(buildings.length){
  for(const b of buildings){const f=b.footprint;
   for(let y=f.y;y<f.y+f.height;y++)for(let x=f.x;x<f.x+f.width;x++)walkable[index(x,y)]=0;
   const xx=b.door.x,yy=b.door.y;if(yy>=0&&yy<H&&xx>=0&&xx<W){walkable[index(xx,yy)]=1;tiles[index(xx,yy)]='town-road';}
  }
 }
 for(let y=2;y<46;y++)for(let x=2;x<66;x++){
  if(!walkable[index(x,y)])continue;
  const onRoute=m.kind!=='level'?(Math.abs(x-34)<5||Math.abs(y-25)<4||[12,22,38].some(l=>Math.abs(l-y)<2)):
   tiles[index(x,y)]==='path'||tiles[index(x,y)]==='stone-path'||tiles[index(x,y)]==='earth-path';
  if(onRoute||Math.abs(x-34)<5&&(y<10||y>39)||Math.abs(x-34)<8&&Math.abs(y-24)<8)continue;
  const t=tiles[index(x,y)],r=random(x,y,(m.layout?.generation?.seed||479)+349);
  const treeChance=m.kind==='level'?.024:.01,rockChance=m.kind==='level'?.023:.008;
  if(r<treeChance&&/grass|pine|forest|snow|wet-grass/.test(t)){objects.push({x,y,type:'tree'});walkable[index(x,y)]=0;}
  else if(r<treeChance+rockChance&&t!=='water'){objects.push({x,y,type:'rock'});walkable[index(x,y)]=0;}
 }
 // Continuous traversable main corridor: guaranteed from top to bottom.
 for(let y=1;y<47;y++){
  let pathX=34+Math.round(Math.sin(y*.13+(m.layout?.generation?.seed||1)*.0001)*4+Math.cos(y*.26+(m.layout?.generation?.seed||1)*.0002)*3);
  if(y<10||y>38)pathX=34;
  for(let dy=-1;dy<=1;dy++)for(let dx=-3;dx<=3;dx++){const x=pathX+dx,yy=y+dy;
   if(x<1||x>=W-1||yy<1||yy>=H-1)continue;
   if(m.kind==='level'){walkable[index(x,yy)]=1;tiles[index(x,yy)]='path';}
  }
 }
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||x===W-1||y===0||y===H-1)walkable[index(x,y)]=0;
 return{m,tiles,walkable,objects,buildings,portals:m.portals};
}
function drawBackground(){
 const c=document.createElement('canvas');c.width=STAGE_W;c.height=STAGE_H;
 const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const m=scene.m;
 const seed=m.layout?.generation?.seed||4;
 const palette=m.visual?.palette||[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const t=scene.tiles[index(x,y)],px=x*T,py=y*T;
  const arr=COLORS[t]||COLORS.grass,shade=arr[Math.floor(random(x,y,seed+9)*arr.length)];
  fill(ctx,px,py,T,T,shade);
  if(t==='water'){
   fill(ctx,px+5,py+10,18,2,'#c7eff1');fill(ctx,px+13,py+22,12,2,'#68bfd2');
   fill(ctx,px+4,py+31,25,1,'#236f9c');
  }else if(/path|road|stone|rubble/.test(t)){
   fill(ctx,px+2,py+15,28,2,'#8e928461');fill(ctx,px+((x+y)%2?10:21),py+3,2,13,'#767d7a70');
   fill(ctx,px+4,py+18,21,2,'#e0d8c18a');
  }else if(t==='lava'){
   fill(ctx,px+5,py+5,13,3,'#f4c871');fill(ctx,px+15,py+23,11,3,'#eab079');
  }else{
   const v=random(x,y,seed+28);
   if(v>.28){fill(ctx,px+4+Math.floor(v*15),py+9,2,7,'#397853');fill(ctx,px+20,py+24,2,5,'#a4c88c');}
   if(v>.89){fill(ctx,px+10,py+15,4,5,'#f8d2c2');fill(ctx,px+15,py+17,4,4,'#f6e9b9');}
  }
 }
 if(m.kind!=='level'){
  // Decorative safe-town paving, surrounding compact rows of buildings.
  const px=34*T,py=24*T;
  ctx.fillStyle='#b8bcb09a';ctx.beginPath();ctx.ellipse(px,py,155,128,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e9d9b0';ctx.lineWidth=10;ctx.stroke();
  ctx.fillStyle='#3988a8';ctx.beginPath();ctx.ellipse(px,py,49,27,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e5d4a4';ctx.beginPath();ctx.ellipse(px,py,54,31,0,0,Math.PI*2);ctx.stroke();
 }
 return c;
}
function drawStructure(b,c,cx,cy,t){
 const f=b.footprint,x=f.x*T-cx,y=f.y*T-cy,w=f.width*T,h=f.height*T;
 if(x>api.canvas.width+60||x+w< -65||y>api.canvas.height+80||y+h< -160)return;
 const colors=t.visual?.palette||['#8b9b81','#b6a189','#daac7a','#7c8c8b'],roof=colors[(b.render?.variant||0)%colors.length];
 const shade=colors[(b.render?.variant+2)%colors.length];
 c.fillStyle='#19322b66';c.fillRect(x-8,y+h-1,w+16,14);
 fill(c,x,y+39,w,h-38,'#e3d4af');fill(c,x,y+39,w,5,'#8d7d69');
 for(let i=0;i<w;i+=24){fill(c,x+i+3,y+49,2,h-60,'#b5a38b');}
 fill(c,x-10,y+7,w+20,51,shade);fill(c,x-15,y+13,w+30,25,roof);
 for(let yy=14;yy<54;yy+=9)for(let xx=-11;xx<w+7;xx+=17){
  fill(c,x+xx+((yy/9)%2)*8,y+yy,14,7,roof);fill(c,x+xx,y+yy+2,11,2,'#ffffff2f');
 }
 const doorX=x+w/2-15,doorY=y+h-52;
 fill(c,doorX-4,doorY-5,38,59,'#4f4b44');fill(c,doorX,doorY,30,53,'#705443');
 fill(c,doorX+22,doorY+29,3,3,'#f9d898');
 for(const winX of [x+23,x+w-50]){
  fill(c,winX,y+74,28,31,'#715e55');fill(c,winX+4,y+78,20,22,'#9dd6df');
  fill(c,winX+11,y+79,3,20,'#456b78');fill(c,winX+3,y+88,21,2,'#52767b');
 }
 fill(c,x+w/2-45,y+37,90,23,'#785b43');fill(c,x+w/2-42,y+39,84,19,'#ad805c');
 c.fillStyle='#fff3d2';c.font='bold 9px monospace';c.textAlign='center';
 c.fillText(b.label.length>14?b.label.slice(0,13)+'…':b.label,x+w/2,y+51);
}
function drawProp(ob,c,cx,cy,m){
 const x=ob.x*T-cx,y=ob.y*T-cy;
 if(ob.type==='tree'){
  fill(c,x+9,y-25,14,53,'#76553a');
  fill(c,x-8,y-49,46,44,'#347a53');fill(c,x+2,y-61,34,30,'#4a9b5d');fill(c,x-5,y-45,14,6,'#91bf79');
 }else{
  fill(c,x-4,y-3,36,29,'#68766f');fill(c,x+3,y-15,27,20,'#a5a99f');fill(c,x+6,y-13,15,4,'#cbd1c0');
 }
}
function drawGates(c,cx,cy){
 for(const gate of scene.portals){
  const x=(gate.gateTile.x+.5)*T-cx,y=(gate.gateTile.y+.5)*T-cy;
  c.save();c.strokeStyle=gate.side==='north'?'#e0d49f':'#94d9db';c.lineWidth=3;c.beginPath();
  c.arc(x,y,17+2*Math.sin(performance.now()/350),0,Math.PI*2);c.stroke();c.fillStyle='#e8f7cb';
  c.fillRect(x-6,y-11,12,23);c.fillStyle='#f4e5b8';c.font='bold 11px monospace';c.textAlign='center';
  const to=owns(gate.to);c.strokeStyle='#1c3834';c.lineWidth=3;
  const label=(gate.side==='north'?'NEXT: ':'BACK: ')+(to?.displayName||'Willow Valley');
  c.strokeText(label,x,y-28);c.fillText(label,x,y-28);
  c.restore();
 }
}
function showHUD(){
 const st=state(),where=map;if(!where)return;
 const zone=document.getElementById('hudZone'),badge=document.getElementById('viewportBadge'),name=document.getElementById('zoneName');
 const clock=document.getElementById('hudClock'),hint=document.getElementById('contextHint');
 if(zone)zone.textContent=where.displayName.toUpperCase();
 if(name)name.textContent=where.displayName;
 if(badge)badge.textContent=(where.flags.safeZone?'🛡 SAFE TOWN':'✦ EXPLORATION · MONSTER-FREE')+' · '+(where.levelNumber?'LV '+where.levelNumber:where.displayName.toUpperCase());
 const h=Math.floor(st.time/60)%24,min=Math.floor(st.time%60);
 if(clock)clock.textContent='DAY '+st.day+' · '+String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')+' · '+(st.weather==='Rain'?'☂':'☀');
 if(hint)hint.textContent=where.kind==='level'?'🧭 North: next level / town · South: return · No monsters': '🏘 Safe town · Shops are exterior-only · North: next level';
}
function enter(to,side='south',force=false){
 if(!data||!registry.get(to))return false;
 const selected=registry.get(to);
 if(to==='base'){
  map=null;scene=null;paint=null;route=[];const st=state();st.activeMap='base';
  let pos={x:34.5,y:39.5};
  if(api.blocked(pos.x,pos.y)){pos={x:28.5,y:29.5};}
  p().x=pos.x;p().y=pos.y;
  st.discoveredMaps={...(st.discoveredMaps||{}),base:true};
  st.progressionLocation='base';holdUntil=performance.now()+1350;api.save();
  api.notify('🏡 Returned safely to Willow Valley');return true;
 }
 map=selected;scene=build(map);paint=drawBackground();route=[];
 const st=state();st.activeMap=to;st.progressionLocation=to;
 st.progressionLastTown=map.flags.safeZone?to:(st.progressionLastTown||'base');
 st.progressionVisited={...(st.progressionVisited||{}),[to]:true};
 let spawn=force?nearest(scene,p().x,p().y):nearest(scene,...Object.values(arrival(side)));
 if(!force)spawn=nearest(scene,arrival(side).x,arrival(side).y);
 p().x=spawn.x;p().y=spawn.y;
 holdUntil=performance.now()+1150;previousTime=performance.now();api.save();showHUD();
 api.notify((map.flags.safeZone?'🏘 Entered safe town: ':'🧭 Exploring ') +map.displayName);
 return true;
}
function checkGate(){
 if(!data||isActive()||api.modal()||performance.now()<holdUntil||window.EvergroveExpansion?.active())return;
 const pl=p();if(Math.hypot(pl.x-(ENTER.x+.5),pl.y-(ENTER.y+.5))<1.1){
  window.EvergroveNavigation?.cancel();
  enter('level-01','south');}
}
function drawBasePortal(){
 if(!data||isActive()||window.EvergroveExpansion?.active())return;
 const c=api.ctx,cam=api.camera(),x=(ENTER.x+.5)*T-cam.x,y=(ENTER.y+.5)*T-cam.y;
 c.save();c.strokeStyle='#f7dc9a';c.lineWidth=4;c.beginPath();
 c.arc(x,y,18+2*Math.sin(performance.now()/430),0,Math.PI*2);c.stroke();
 c.fillStyle='#92d6de';c.fillRect(x-7,y-13,14,26);
 c.fillStyle='#fff0b8';c.font='bold 12px monospace';c.lineWidth=4;c.textAlign='center';c.strokeStyle='#16322b';
 c.strokeText('✦ BEGIN EXPEDITION · LEVEL 1',x,y-29);c.fillText('✦ BEGIN EXPEDITION · LEVEL 1',x,y-29);
 c.restore();
}
function pass(x,y){if(!scene)return false;const tx=Math.floor(x),ty=Math.floor(y);return tx>=1&&ty>=1&&tx<W-1&&ty<H-1&&!!scene.walkable[index(tx,ty)]}
function canStand(x,y){const rad=.23;return [[-rad,-rad],[-rad,rad],[rad,-rad],[rad,rad]].every(([dx,dy])=>pass(x+dx,y+dy));}
function travelCheck(){
 if(!scene||performance.now()<holdUntil||api.modal())return;
 for(const g of scene.portals){
  const tile={x:g.gateTile.x+.5,y:g.gateTile.y+.5};
  if(dis(p(),tile)<.95){
   const next=owns(g.to);
   if(g.to==='base')enter('base');
   else if(next)enter(next.id,g.side==='north'?'south':'north');
   return;
  }
 }
}
function plan(tx,ty){
 if(!scene)return false;
 const sx=clip(Math.floor(p().x),1,W-2),sy=clip(Math.floor(p().y),1,H-2);
 const goal=nearest(scene,tx,ty),gx=Math.floor(goal.x),gy=Math.floor(goal.y);
 const queue=new Int32Array(W*H),previous=new Int32Array(W*H),seen=new Uint8Array(W*H);
 previous.fill(-1);let front=0,tail=1,start=index(sx,sy),target=index(gx,gy);
 queue[0]=start;seen[start]=1;
 while(front<tail){
  const i=queue[front++];if(i===target)break;
  const cx=i%W,cy=Math.floor(i/W);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=cx+dx,y=cy+dy;if(x<1||y<1||x>W-2||y>H-2)continue;
   const ni=index(x,y);if(seen[ni]||!scene.walkable[ni])continue;
   seen[ni]=1;previous[ni]=i;queue[tail++]=ni;
  }
 }
 if(!seen[target])return false;
 const points=[];let i=target;
 while(i!==start&&i!==-1){points.push({x:i%W+.5,y:Math.floor(i/W)+.5});i=previous[i];}
 route=points.reverse();return route.length>0;
}
function walkTo(side){
 if(side!=='north'&&side!=='south')return false;
 if(isActive())return plan(DIR[side].x,DIR[side].y);
 if(side==='north'&&data&&!window.EvergroveExpansion?.active()){
  return window.EvergroveNavigation?.go({x:ENTER.x+.5,y:ENTER.y+.5},null,true)??false;
 }
 return false;
}
function update(dt){
 if(!isActive()||api.modal()||!scene||!map)return;
 const input=api.getInput(),pl=p();let vx=0,vy=0;
 if(input.ArrowUp||input.mobileup)vy--;if(input.ArrowDown||input.mobiledown)vy++;
 if(input.ArrowLeft||input.mobileleft)vx--;if(input.ArrowRight||input.mobileright)vx++;
 vx+=(input.joyX||0);vy+=(input.joyY||0);
 if(Math.abs(vx)+Math.abs(vy)>.08)route=[];
 else if(route.length){
  const t=route[0],len=dis(pl,t);
  if(len<.12)route.shift();
  else{vx=(t.x-pl.x)/len;vy=(t.y-pl.y)/len;}
 }
 const len=Math.hypot(vx,vy);
 if(len>.01){if(len>1){vx/=len;vy/=len;}
  const speed=route.length||input.ShiftLeft||input.ShiftRight?4.7:3.1,step=dt*speed;
  if(canStand(pl.x+vx*step,pl.y))pl.x+=vx*step;
  if(canStand(pl.x,pl.y+vy*step))pl.y+=vy*step;
  pl.dir=Math.abs(vx)>Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
 }
 const now=performance.now();if(now-previousTime>500){previousTime=now;showHUD();}
 travelCheck();
}
function draw(){
 const c=api.ctx,cv=api.canvas,pl=p(),cam=api.camera();
 const cw=cv.width,ch=cv.height;
 if(!scene||!paint){c.fillStyle='#213b35';c.fillRect(0,0,cw,ch);c.fillStyle='#e9d5af';c.font='bold 17px monospace';
  c.fillText(loadingError?'Progression map unavailable: '+loadingError:'Loading 81-map world…',24,50);return;}
 cam.x=Math.round(clip(pl.x*T-cw/2,0,Math.max(0,STAGE_W-cw)));
 cam.y=Math.round(clip(pl.y*T-ch/2,0,Math.max(0,STAGE_H-ch)));
 c.imageSmoothingEnabled=false;c.fillStyle='#19342c';c.fillRect(0,0,cw,ch);
 c.drawImage(paint,-cam.x,-cam.y);
 const arr=[...scene.objects.map(o=>({y:o.y+.8,draw:()=>drawProp(o,c,cam.x,cam.y,map)}))];
 for(const b of scene.buildings)arr.push({y:b.footprint.y+b.footprint.height+.05,draw:()=>drawStructure(b,c,cam.x,cam.y,map)});
 arr.push({y:pl.y+.35,draw:()=>api.drawPlayer()});
 arr.sort((a,b)=>a.y-b.y);for(const a of arr)a.draw();
 drawGates(c,cam.x,cam.y);
 if(map.kind!=='level'){
  c.fillStyle='#f2e9be';c.font='bold 13px monospace';c.textAlign='center';
  c.fillText('🛡 SAFE ZONE · NO MONSTERS',34*T-cam.x, (24-4)*T-cam.y);
 }
 if(route.length){c.save();c.strokeStyle='#fff1aeaa';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();
 c.moveTo(pl.x*T-cam.x,pl.y*T-cam.y);for(const q of route)c.lineTo(q.x*T-cam.x,q.y*T-cam.y);
 c.stroke();c.restore();}
 showHUD();
}
function onPointerClick(event){
 if(!isActive()||api.modal()||!scene||event.target!==api.canvas||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 event.preventDefault();event.stopImmediatePropagation();
 const rect=api.canvas.getBoundingClientRect(),cam=api.camera();
 const tx=Math.floor(((event.clientX-rect.left)/rect.width*api.canvas.width+cam.x)/T);
 const ty=Math.floor(((event.clientY-rect.top)/rect.height*api.canvas.height+cam.y)/T);
 plan(tx,ty);
}
function fallbackWhenNoData(){const st=state();if(!isActive())return;st.activeMap='base';st.progressionLocation='base';p().x=17.5;p().y=27.5;api.save();api.notify('⚠ Progression maps are unavailable; returned to Willow Valley.');}
async function load(){
 try{
  data=await registry.load();
  initialized=true;
  const st=state(),saved=st.activeMap;
  if(planned(saved)){
   const selected=registry.get(saved);
   if(selected){map=selected;scene=build(selected);paint=drawBackground();const at=nearest(scene,p().x,p().y);p().x=at.x;p().y=at.y;
    holdUntil=performance.now()+1200;st.progressionVisited={...(st.progressionVisited||{}),[saved]:true};showHUD();api.save();}
   else fallbackWhenNoData();
  }
  window.dispatchEvent(new Event('evergrove:journey-ready'));
 }catch(error){loadingError=error?.message||String(error);console.warn('Evergrove progression unavailable',error);fallbackWhenNoData();}
}
function html(){
 if(!data)return '<div class="journey-status">Loading the 81-map expedition registry…</div>';
 const where=isActive()?current():'base',total=Object.keys(state().progressionVisited||{}).length;
 const opened=registry.get(focusId)||registry.get('level-01'),selectedRegion=registry.getRegion(chapter);
 const regionOptions=data.regions.map(r=>'<option value="'+r.number+'"'+(r.number===chapter?' selected':'')+'>Region '+String(r.number).padStart(2,'0')+' · '+r.townName+'</option>').join('');
 const path=['base',...selectedRegion.levelIds,selectedRegion.townId];
 const items=path.map((id,n)=>{const m=registry.get(id),visited=!!state().progressionVisited?.[id]||id==='base',active=id===where;
  return '<button class="journey-map-card'+(focusId===id?' chosen':'')+'" data-journey-view="'+id+'">'+
   '<b>'+(active?'● ':'')+m.displayName+'</b><small>'+(m.flags.safeZone?'🛡 SAFE TOWN':m.biome.replace(/-/g,' '))+'</small>'+
   '<small>'+(visited?'✓ Visited':'◇ Not explored')+'</small></button>';
 }).join('');
 const services=opened.kind!=='level'?'<div class="journey-services">'+opened.services.map(s=>'<span>'+s.name+'</span>').join('')+'</div>':'';
 const controls=(where==='base'?' <button data-journey-go="north">🏃 Go to Level 1 Gate</button>':
 opened.id===where?opened.portals.map(g=>'<button data-journey-go="'+g.side+'">🏃 Go '+(g.side==='north'?'Forward':'Back')+' to gate</button>').join(''):'');
 return '<div class="journey-atlas" id="journeyAtlas">' +
 '<div class="journey-atlas-top"><strong>🧭 THE 60-LEVEL EXPEDITION</strong><span>'+total+' / 81 visited</span>'+
 '<button data-journey-close="1">← Existing world</button></div>'+
 '<div class="journey-selector"><label for="journeyRegion">Choose chapter</label><select id="journeyRegion">'+regionOptions+'</select></div>'+
 '<div class="journey-atlas-grid"><aside class="journey-map-list">'+items+'</aside>'+
 '<section class="journey-map-inspector"><h3>'+opened.displayName+'</h3>'+
 '<p>'+opened.visual.identity+'</p>'+
 '<div class="journey-flag">'+(opened.flags.safeZone?'🛡 SAFE ZONE — No monsters':'🌿 EXPLORATION — No monsters yet')+'</div>'+
 '<div class="journey-stat">68 × 48 tiles · '+(opened.kind==='level'?'Level '+opened.levelNumber:'Town')+'</div>'+
 '<p>Theme: '+opened.visual.theme.replace(/-/g,' ')+'</p>'+
 (opened.kind==='level'?'<p>Landscape: '+opened.layout.terrain.visualVariation+'</p>':
 '<p>24 building exteriors; ten shop and service categories (interiors coming later).</p>'+services)+
 '<div class="journey-actions">'+controls+'</div>'+
 '<p class="journey-reminder">Explore by walking through gates. Selecting a map does not teleport you.</p>'+
 '</section></div></div>';
}
function openAtlas(){
 const body=document.getElementById('modalBody');if(!body)return;
 const existing=document.getElementById('atlasRoot');if(existing)existing.style.display='none';
 const old=document.getElementById('journeyAtlas');if(old)old.remove();
 body.insertAdjacentHTML('beforeend',html());launchVisible=true;
 const scope=document.getElementById('journeyAtlas');if(!scope)return;
 scope.addEventListener('click',e=>{
  const close=e.target.closest('[data-journey-close]');if(close){scope.remove();if(existing)existing.style.display='grid';launchVisible=false;return;}
  const card=e.target.closest('[data-journey-view]');if(card){
   focusId=card.dataset.journeyView;
   const m=owns(focusId);if(m?.regionId){const reg=registry.getRegion(m.regionId);if(reg)chapter=reg.number;}
   openAtlas();return;
  }
  const go=e.target.closest('[data-journey-go]');if(go){const side=go.dataset.journeyGo;
   api.closeModal?.();walkTo(side);return;}
 });
 const select=scope.querySelector('#journeyRegion');if(select)select.addEventListener('change',e=>{chapter=Number(e.target.value);focusId=data.regions[chapter-1].levelIds[0];openAtlas();});
}
function mountAtlas(){
 const sidebar=document.getElementById('atlasRegions')?.parentElement;if(!sidebar)return;
 if(!document.getElementById('journeyLaunch')){
  const launcher=document.createElement('button');launcher.id='journeyLaunch';launcher.type='button';
  launcher.className='atlas-journey-launch';launcher.textContent='🧭 Explore 81-map World';
  launcher.addEventListener('click',openAtlas);
  sidebar.prepend(launcher);
 }
 if(launchVisible)openAtlas();
}
document.addEventListener('click',onPointerClick,true);
document.addEventListener('keydown',e=>{if(isActive()&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!api.modal())route=[];},true);
window.EvergroveJourney={active:isActive,ready:()=>!!data,update,draw,checkBaseEntrance:checkGate,drawBaseEntrance:drawBasePortal,walkTo,go:enter,scene:()=>scene,map:()=>map,registry:()=>data,mountAtlas,openAtlas,html,passable:pass,generate:build,plan};
load();
})();