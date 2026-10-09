/* Evergrove Map Expansion v0.12 — JSON map registry, travel & play. */
(()=>{'use strict';
const api=window.EvergroveNavGame;if(!api)return;
const {ctx,canvas,T}=api;
let worlds=null,current=null,background=null,route=[],cameraX=0,cameraY=0,lockedUntil=0;
const idTile=(x,y)=>x+','+y,lerp=Math.hypot, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const inside=(x,y,m=current)=>m&&x>=0&&y>=0&&x<m.width&&y<m.height;
const terrain=(m,x,y)=>m.terrain?.[idTile(x,y)]||m.defaultTerrain||'grass';
const objAt=(m,x,y)=>m.objects?.find(o=>o.x===x&&o.y===y);
const passable=(m,x,y)=>inside(x,y,m)&&!['water','cliff'].includes(terrain(m,x,y))&&!objAt(m,x,y);
const canStand=(x,y)=>{const r=.24;return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy])=>{const tx=Math.floor(x+dx),ty=Math.floor(y+dy);return passable(current,tx,ty);});};
const clearRoute=()=>{route=[];};
function safeArrival(m,pos){const x=Math.floor(pos.x),y=Math.floor(pos.y);if(passable(m,x,y))return pos;for(let rad=1;rad<Math.max(m.width,m.height);rad++){for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(Math.abs(dx)!==rad&&Math.abs(dy)!==rad)continue;if(passable(m,x+dx,y+dy))return{x:x+dx+.5,y:y+dy+.5};}}return m.spawn||{x:4.5,y:4.5};}
const tileCenter=(p)=>({x:p.x+.5,y:p.y+.5});
function portalAt(x,y){return current?.portals?.find(p=>p.x===x&&p.y===y);}
function paint(m){
 const c=document.createElement('canvas');c.width=m.width*T;c.height=m.height*T;
 const p=c.getContext('2d');p.imageSmoothingEnabled=false;
 const colors={grass:['#80b578','#8ac17a'],forest:['#539665','#629e6e'],path:['#bba783','#c7b28a'],stone:['#869c96','#95a69d'],water:['#4a9ab4','#5ba8bd'],cliff:['#626a75','#79808b'],farm:['#987454','#a9815e']};
 for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
   const t=terrain(m,x,y),pair=colors[t]||colors.grass;
   p.fillStyle=pair[(x*13+y*17+x*y)%2];p.fillRect(x*T,y*T,T,T);
   const v=Math.abs(Math.sin(x*81.21+y*13.71))%1;
   if(t==='water'){p.fillStyle='#a4e1df';p.fillRect(x*T+5,y*T+11,9,2);p.fillRect(x*T+19,y*T+24,7,2);}
   else if(t==='path'){p.fillStyle='#e8d5af';p.fillRect(x*T+3,y*T+5,13,2);if(v>.5)p.fillRect(x*T+18,y*T+21,9,2);}
   else if(t==='grass'||t==='forest'){p.fillStyle='#a3d18b';p.fillRect(x*T+5+Math.floor(v*15),y*T+9,2,4);if(v>.8){p.fillStyle='#f2bac6';p.fillRect(x*T+18,y*T+20,4,4);}}
   else if(t==='stone'||t==='cliff'){p.fillStyle='#b6bdb3';p.fillRect(x*T+5,y*T+17,17,2);}
 }
 return c;
}
function renderPortal(p){
 const sx=(p.x+.5)*T-cameraX,sy=(p.y+.5)*T-cameraY,v=performance.now()/320;
 ctx.save();ctx.strokeStyle='#f2dfa0';ctx.lineWidth=3;ctx.beginPath();
 ctx.ellipse(sx,sy,10+Math.sin(v)*2,7+Math.sin(v)*2,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#cde6b5';ctx.fillRect(sx-4,sy-8,8,14);
 ctx.font='bold 10px monospace';ctx.strokeStyle='#183f37';ctx.lineWidth=3;ctx.textAlign='center';
 const label=p.label||'Travel';ctx.strokeText(label,sx,sy-16);ctx.fillStyle='#f5e4b4';ctx.fillText(label,sx,sy-16);ctx.restore();
}
function drawBasePortal(){
 if(!worlds||current)return;
 const cam=api.camera();cameraX=cam.x;cameraY=cam.y;
 for(const p of worlds.basePortals||[])renderPortal(p);
}
function showZone(){
 if(!current)return;
 const name=current.name;
 const zone=document.getElementById('hudZone'),marker=document.getElementById('viewportBadge');
 if(zone)zone.textContent=name.toUpperCase();
 if(marker)marker.textContent='✦ EXPANSION · '+name.toUpperCase();
 const label=document.getElementById('zoneName');if(label)label.textContent=name;
 const time=document.getElementById('hudClock'),state=api.state();
 if(time){const h=Math.floor(state.time/60)%24,min=Math.floor(state.time%60);
 time.textContent='DAY '+state.day+' · '+String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')+' · '+(state.weather==='Rain'?'☂':'☀');}
}
function travel(to,arrival){
 if(!worlds)return;
 window.EvergroveNavigation?.cancel();
 const state=api.state(),p=api.player();
 if(to==='base'){
  current=null;state.activeMap='base';clearRoute();
  const target=arrival||state.basePosition||{x:28.5,y:27.5};
  p.x=target.x;p.y=target.y;lockedUntil=performance.now()+1000;
  api.save();api.notify('🧭 Returned to Willow Village');return true;
 }
 const map=worlds.maps.find(m=>m.id===to);if(!map){api.notify('This destination has not been published yet.');return false;}
 if(!current)state.basePosition={x:p.x,y:p.y};
 current=map;background=paint(map);clearRoute();
 state.activeMap=map.id;state.discoveredMaps={...(state.discoveredMaps||{}),base:true,[map.id]:true};const next=safeArrival(map,arrival||map.spawn||{x:4.5,y:4.5});
 p.x=next.x;p.y=next.y;lockedUntil=performance.now()+1000;
 api.save();api.notify('🧭 Entered '+map.name);showZone();return true;
}
function checkBasePortal(){
 if(!worlds||current||performance.now()<lockedUntil||api.modal())return;
 const p=api.player();
 for(const portal of worlds.basePortals||[]){
  if(lerp(p.x-(portal.x+.5),p.y-(portal.y+.5))<.46){travel(portal.to,portal.arrival);break;}
 }
}
function checkPortal(){
 if(!current||performance.now()<lockedUntil||api.modal())return;
 const p=api.player();
 for(const portal of current.portals||[]){
  if(lerp(p.x-(portal.x+.5),p.y-(portal.y+.5))<.48){travel(portal.to,portal.arrival);break;}
 }
}
function update(dt){
 if(!current||api.modal())return;
 const input=api.getInput(),p=api.player();
 let dx=Number(!!(input.ArrowRight||input.mobileright))-Number(!!(input.ArrowLeft||input.mobileleft));
 let dy=Number(!!(input.ArrowDown||input.mobiledown))-Number(!!(input.ArrowUp||input.mobileup));
 dx+=(input.joyX||0);dy+=(input.joyY||0);
 if(Math.abs(dx)+Math.abs(dy)>.09){clearRoute();}
 else if(route.length){
  const next=route[0],len=lerp(next.x-p.x,next.y-p.y);
  if(len<.08)route.shift();
  else{dx=(next.x-p.x)/len;dy=(next.y-p.y)/len;}
 }
 const l=lerp(dx,dy);if(l>.01){
  if(l>1){dx/=l;dy/=l;}
  const speed=route.length?4.7:(input.ShiftLeft||input.ShiftRight?4.7:3.1),step=speed*dt;
  let nx=p.x+dx*step,ny=p.y+dy*step;
  if(canStand(nx,p.y))p.x=nx;
  if(canStand(p.x,ny))p.y=ny;
  p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
 }
 checkPortal();
 if(current){showZone();if(performance.now()-lastSave>15000){lastSave=performance.now();api.save();}}
}
let lastSave=0;
function draw(){
 if(!current)return;
 const p=api.player(),w=current.width*T,h=current.height*T,W=canvas.width,H=canvas.height;
 cameraX=Math.round(clamp(p.x*T-W/2,Math.min(0,w-W),Math.max(0,w-W)));
 cameraY=Math.round(clamp(p.y*T-H/2,Math.min(0,h-H),Math.max(0,h-H)));
 // Negative camera values center small maps on large screens.
 const cam=api.camera();cam.x=cameraX;cam.y=cameraY;
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#203b36';ctx.fillRect(0,0,W,H);
 ctx.drawImage(background,-cameraX,-cameraY);
 const objects=(current.objects||[]).map(o=>({y:o.y+.8,draw:()=>o.type==='tree'?api.drawTree(o):api.drawRock(o)}));
 objects.push({y:p.y+.4,draw:()=>api.drawPlayer()});
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 for(const portal of current.portals||[])renderPortal(portal);
 if(route.length){ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#ffe9b0';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(p.x*T-cameraX,p.y*T-cameraY);for(const v of route)ctx.lineTo(v.x*T-cameraX,v.y*T-cameraY);ctx.stroke();ctx.restore();}
 showZone();
}
function plan(x,y){
 if(!current||!inside(x,y))return false;
 const p=api.player(),sx=Math.floor(p.x),sy=Math.floor(p.y),m=current;
 const size=m.width*m.height,visited=new Uint8Array(size),prev=new Int32Array(size),queue=new Int32Array(size);
 prev.fill(-1);let head=0,tail=1;const start=sy*m.width+sx;visited[start]=1;queue[0]=start;
 let target=-1,best=start,bestScore=Infinity;
 while(head<tail){
  const ix=queue[head++],cx=ix%m.width,cy=Math.floor(ix/m.width),score=(cx-x)**2+(cy-y)**2;
  if(score<bestScore){bestScore=score;best=ix;}
  if(cx===x&&cy===y){target=ix;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=cx+dx,yy=cy+dy,ni=yy*m.width+xx;
   if(!passable(m,xx,yy)||visited[ni])continue;
   visited[ni]=1;prev[ni]=ix;queue[tail++]=ni;
  }
 }
 if(target<0)target=best;
 const result=[];for(let at=target;at!==start&&at!==-1;at=prev[at])
 result.push({x:(at%m.width)+.5,y:Math.floor(at/m.width)+.5});
 route=result.reverse();return route.length>0;
}
function onClick(e){
 if(!current||!matchMedia('(hover: hover) and (pointer: fine)').matches||e.target!==canvas||api.modal())return;
 e.preventDefault();e.stopImmediatePropagation();
 const r=canvas.getBoundingClientRect();
 const x=Math.floor((((e.clientX-r.left)/r.width*canvas.width)+cameraX)/T);
 const y=Math.floor((((e.clientY-r.top)/r.height*canvas.height)+cameraY)/T);
 if(inside(x,y))plan(x,y);
}
document.addEventListener('click',onClick,true);
document.addEventListener('keydown',e=>{if(current&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!api.modal())clearRoute();},true);
async function load(){
 try{
  const response=await fetch('./maps/worlds.json',{cache:'no-cache'});if(!response.ok)throw Error('Map registry '+response.status);
  const data=await response.json();if(data.schema!==1||!Array.isArray(data.maps))throw Error('Unexpected map format');
  worlds=data;
  window.dispatchEvent(new Event('evergrove:maps-ready'));
  const state=api.state();if(state.activeMap&&state.activeMap!=='base'){
   const m=data.maps.find(m=>m.id===state.activeMap);
   if(m){current=m;state.discoveredMaps={...(state.discoveredMaps||{}),base:true,[m.id]:true};background=paint(m);if(!canStand(api.player().x,api.player().y)){
    const pos=safeArrival(m,m.spawn||{x:4.5,y:4.5});api.player().x=pos.x;api.player().y=pos.y;}showZone();}
   else{state.activeMap='base';api.player().x=28.5;api.player().y=27.5;}
  }
 }catch(e){console.warn('Evergrove expansion unavailable',e);}
}
window.EvergroveExpansion={active:()=>!!current,update,draw,checkBasePortal,drawBasePortal,cancel:clearRoute,
travel,ready:()=>!!worlds,registry:()=>worlds};
load();
})();