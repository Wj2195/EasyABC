/* Evergrove v0.17 — original hand-coded layered fantasy pixel-art Willow Valley.
 * Pure Canvas 2D rendering. No third-party image files, ROM art or raster backdrops.
 * Ground tiles + world-space objects + entity depth + foreground light.
 * World geometry and save data continue to come from the legacy Evergrove engine. */
(()=>{
'use strict';
const g=window.EvergroveNavGame;if(!g)return;
const T=g.T,W=g.MW,H=g.MH;
const colors={
 grass:['#6d9d58','#79ad65','#83b36d','#588d57'],farm:['#829f55','#92ad63','#a2b56b','#6a9254'],
 village:['#719d65','#82ad6b','#92b977','#5c925d'],forest:['#467e50','#55935e','#659c5c','#366f52'],
 path:['#b1aaa0','#bcb6a6','#d1c9b7','#8e9188'],ruins:['#7b8684','#929893','#abb0a6','#647875'],
 mountain:['#82887d','#a0a697','#afb19d','#65716d'],water:['#327ca8','#3d9bba','#51b0cf','#245f90']
};
const BASE={wall:'#edd9aa',shadow:'#9d8e74',beam:'#805d43',stone:'#90958f',gold:'#e8bb65'};
const HOUSE_THEMES={
 home:{roof:'#b9563a',shade:'#783a36',hi:'#df9160',wall:'#ebd7b5',wood:'#88614a',sign:'COTTAGE',symbol:'✿'},
 shop:{roof:'#4a83b6',shade:'#345a82',hi:'#8db8dc',wall:'#edddba',wood:'#8a694a',sign:'MARKET',symbol:'◇'},
 inn:{roof:'#775f9b',shade:'#51436e',hi:'#b59bc7',wall:'#f1dbb6',wood:'#926d52',sign:'INN',symbol:'☾'},
 library:{roof:'#ac7450',shade:'#784b3c',hi:'#d9a879',wall:'#e4d4bb',wood:'#765b4d',sign:'ARCHIVE',symbol:'✦'},
 workshop:{roof:'#327e77',shade:'#245853',hi:'#83b6a0',wall:'#e9d5b0',wood:'#84674e',sign:'FORGE',symbol:'⚒'}
};
const CANVASES=new Map(),PREFETCH=new Map();
let ground=null,frame=0;
const rnd=(x,y,seed=1)=>{
 let z=Math.imul((x|0)+674,73856093)^Math.imul((y|0)+123,19349663)^Math.imul(seed+17,83492791);
 z=Math.imul(z^(z>>>13),1274126177);return (z>>>0)/4294967296;
};
const r=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const make=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};
const road=(x,y)=>x>=28&&x<=46&&y>=21&&y<=33;
const plaza=(x,y)=>{const dx=(x-36.5)/5.7,dy=(y-28)/5.4;return dx*dx+dy*dy<1;};
const paving=(c,x,y,texture=0)=>{
 const px=x*T,py=y*T;
 const v=rnd(x,y,64),palette=colors.path; r(c,px,py,T,T,palette[Math.floor(v*4)]);
 // Interlocking ashlar stones: horizontal seams and staggered brick bonds.
 r(c,px,py+15,32,2,'#838e84');
 r(c,px+((y%2)?12:22),py,2,15,'#8f9789');
 r(c,px+((y%2)?23:9),py+17,2,15,'#8f9789');
 r(c,px+1,py+1,26,2,'#ded5c2');
 r(c,px+2,py+18,24,2,'#cbcbb8');
 for(let i=0;i<4;i++){
  const xx=3+Math.floor(rnd(x+i,y,11)*25),yy=4+Math.floor(rnd(x,y+i,12)*26);
  r(c,px+xx,py+yy,2,1,i%2?'#969e8e':'#eee3c9');
 }
};
const flower=(c,px,py,hue)=>{
 r(c,px+2,py+6,2,9,'#366f50');r(c,px,py+7,6,2,'#77a85d');
 r(c,px,py+1,4,3,hue);r(c,px+4,py+4,4,3,hue);r(c,px+1,py+6,4,3,hue);
 r(c,px+3,py+3,3,3,'#f9eab0');
};
function terrainTile(c,x,y){
 const t=g.typeAt(x,y),px=x*T,py=y*T,v=rnd(x,y,1),p=colors[t]||colors.grass;
 if(t==='path'||t==='ruins'||(t==='village'&&road(x,y))||plaza(x,y)){paving(c,x,y);return;}
 r(c,px,py,T,T,p[Math.min(3,Math.floor(v*4))]);
 if(t==='water'){
  r(c,px,py+24,32,5,'#245f8b');
  for(let k=0;k<3;k++){const ox=Math.floor(rnd(x,y,k+21)*22),oy=Math.floor(rnd(y,x,k+35)*22);
   r(c,px+ox,py+oy,12,2,'#83cbd9');r(c,px+ox+3,py+oy+3,7,1,'#dbecdc');}
  return;
 }
 if(t==='mountain'||t==='ruins'){
  r(c,px+2,py+4,24,3,'#bec0aa');r(c,px+5,py+7,2,17,'#59675e');
  r(c,px+8,py+22,16,2,'#545e5a');r(c,px+22,py+12,7,3,'#ced0b6');return;
 }
 for(let j=0;j<5;j++){
  const ox=Math.floor(rnd(x,j*3+y,5)*28),oy=Math.floor(rnd(x+j,y,7)*28);
  r(c,px+ox,py+oy,2,4,j%2?'#9cbe74':'#3c8459');
 }
 if(v>.75||t==='forest'&&v>.45){
  const ox=6+Math.floor(rnd(y,x,8)*19),oy=9+Math.floor(rnd(x,y,9)*13);
  flower(c,px+ox,py+oy,v>.94?'#f5bfd2':'#f5e7d0');
 }
 if(t==='farm'&&v>.23){r(c,px+6,py+19,10,2,'#7f9150');r(c,px+18,py+13,7,2,'#a6cb74');}
}
function drawGround(){
 const sheet=make(W*T,H*T),c=sheet.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)terrainTile(c,x,y);
 // Circular town plaza surrounding a magical crystal monument.
 const cx=36.5*T,cy=28*T;
 c.save();c.translate(cx,cy);c.scale(1,.91);
 c.beginPath();c.arc(0,0,T*6.35,0,Math.PI*2);c.fillStyle='#7b8f85';c.fill();
 c.lineWidth=16;c.strokeStyle='#d5ceb6';c.stroke();
 c.beginPath();c.arc(0,0,T*5.62,0,Math.PI*2);c.fillStyle='#b4b6a3';c.fill();c.lineWidth=6;c.strokeStyle='#849d90';c.stroke();
 c.beginPath();c.arc(0,0,T*4.3,0,Math.PI*2);c.lineWidth=4;c.setLineDash([15,8]);c.strokeStyle='#e9d8a5';c.stroke();c.setLineDash([]);
 c.restore();
 // Restamp center stone seams without completely replacing the circular inset.
 for(let y=23;y<=33;y++)for(let x=31;x<=42;x++){if(!plaza(x,y))continue;
  const px=x*T,py=y*T;r(c,px+4,py+6,20,2,'#8b978b88');r(c,px+12,py+18,17,2,'#e6ddc199');}
 // Make entrance steps, planting beds and street framing.
 for(const [x,y,w,h] of [[28,21,9,2],[38,21,9,2],[28,33,9,2],[38,33,9,2]]){
  r(c,x*T,y*T,w*T,h*T,'#536f5a');r(c,x*T+5,y*T+4,w*T-10,h*T-9,'#85a269');
  for(let k=0;k<w*4;k++){const fx=x*T+8+(k*23)%(w*T-16),fy=y*T+8+(k*11)%(h*T-16);
   if(k%4===0)flower(c,fx,fy,k%8?'#f0b6cc':'#f5e1a0');}}
 for(let y=38;y<=47;y++)for(let x=31;x<=39;x++)if(g.typeAt(x,y)!=='water')paving(c,x,y);
 return sheet;
}
function spriteAt(w,h,draw){const sheet=make(w,h);sheet.getContext('2d').imageSmoothingEnabled=false;draw(sheet.getContext('2d'));return sheet;}
function buildingSprite(h){
 const theme=HOUSE_THEMES[h.id]||HOUSE_THEMES.home,pw=h.w*T,ph=h.h*T,w=pw+48,ht=ph+77;
 return spriteAt(w,ht,c=>{
  const ox=24,oy=43,b=pw-8;
  // Heavy masonry foundation and soft contact shadow.
  r(c,ox-15,oy+ph-5,pw+31,14,'#153f3455');
  r(c,ox+3,oy+59,pw-7,ph-56,theme.wall);
  r(c,ox+7,oy+61,pw-15,4,'#fff1ce');
  for(let yy=73;yy<ph;yy+=15)for(let xx=9;xx<pw-10;xx+=26){
   r(c,ox+xx+(yy%2)*6,oy+yy,20,2,'#c5ac84');
   r(c,ox+xx+1,oy+yy+2,2,10,'#d0c099');
  }
  r(c,ox+1,oy+ph-21,pw-3,21,'#7a8171');r(c,ox+2,oy+ph-21,pw-4,3,'#f2dfa9');
  // Roof shadow and architectural fascia.
  r(c,ox-14,oy+25,pw+30,44,'#283e3d7a');
  r(c,ox-15,oy+22,pw+30,41,theme.shade);
  for(let ty=27;ty<=58;ty+=11)for(let tx=-10;tx<pw+12;tx+=16){
   r(c,ox+tx+((ty%2)*6),oy+ty,14,9,theme.roof);
   r(c,ox+tx+((ty%2)*6),oy+ty,14,2,theme.hi);
   r(c,ox+tx+((ty%2)*6)+12,oy+ty,2,9,theme.shade);
  }
  // Tiered triangular gable with clipped pixels.
  for(let band=0;band<7;band++){
   const inset=band*8;r(c,ox+inset-9,oy+18-band*5,pw-inset*2+17,7,band%2?theme.roof:theme.shade);
   r(c,ox+inset-8,oy+18-band*5,pw-inset*2+15,2,theme.hi);
  }
  r(c,ox-16,oy+62,pw+32,7,'#453e3d');r(c,ox-15,oy+62,pw+30,3,'#edc58c');
  // Timber-frame walls, sconces and different window sizes.
  r(c,ox+11,oy+72,6,ph-88,theme.wood);r(c,ox+pw-18,oy+72,6,ph-88,theme.wood);
  for(const fx of [24,pw-51]){
    r(c,ox+fx-4,oy+78,31,39,'#473e3b');
    r(c,ox+fx,oy+82,24,30,'#adcfda');
    r(c,ox+fx+3,oy+85,18,22,'#dff1cb');r(c,ox+fx+10,oy+83,3,29,'#657b79');
    r(c,ox+fx-6,oy+113,35,5,'#9a7854');r(c,ox+fx-6,oy+117,35,2,'#e4bb80');
  }
  // Main doorway retains legacy functional center, at the lower edge.
  r(c,ox+pw/2-18,oy+ph-63,36,64,'#5c4437');
  r(c,ox+pw/2-13,oy+ph-56,26,55,'#372f31');
  r(c,ox+pw/2-8,oy+ph-48,16,44,'#6c5140');
  r(c,ox+pw/2+4,oy+ph-28,3,4,'#ffe2a0');
  r(c,ox+pw/2-22,oy+ph-2,44,7,'#e9d4ad');
  // Hanging shop sign and its insignia.
  r(c,ox+pw/2-43,oy+4,86,28,'#674636');r(c,ox+pw/2-40,oy+7,80,22,'#ad8053');
  r(c,ox+pw/2-38,oy+8,76,2,'#e3bb85');
  c.font='bold 12px monospace';c.textAlign='center';c.fillStyle='#fff0c8';
  c.fillText(theme.symbol+' '+theme.sign,ox+pw/2,oy+23);
  // Garden crates, roof chimney, glowing lamp.
  r(c,ox+pw-21,oy-9,15,38,'#8c8275');r(c,ox+pw-18,oy-11,11,5,'#aeb0a0');
  for(const xx of [ox+4,ox+pw-14]){
   r(c,xx,oy+ph-26,11,17,'#795c3b');r(c,xx+2,oy+ph-30,7,8,'#3d8153');r(c,xx+3,oy+ph-33,5,6,'#e8b8ba');
  }
 });
}
function treeSprite(variant){
 const w=108,h=119,p=['#26744c','#328557','#4b9c62'][variant],dark=['#17543f','#256b4a','#367b53'][variant],light=['#76bd6b','#7dc572','#9fd17b'][variant];
 return spriteAt(w,h,c=>{
  r(c,26,101,62,11,'#153c3866');
  r(c,48,57,15,54,'#644932');r(c,51,73,5,32,'#ba8452');r(c,43,90,7,5,'#8b6140');
  const blobs=[[32,48,50,44],[56,45,41,49],[9,44,45,48],[47,13,49,49],[15,17,45,51]];
  for(const [x,y,ww,hh] of blobs){r(c,x+3,y+6,ww,hh,dark);r(c,x,y,ww,hh,p);
   r(c,x+3,y+3,ww-12,5,light);r(c,x+9,y+12,8,9,light);r(c,x+ww-12,y+23,7,8,dark);}
  for(let i=0;i<20;i++){const x=13+Math.floor(rnd(i,variant,5)*78),y=12+Math.floor(rnd(i,variant,6)*64);
   r(c,x,y,5,4,i%5===0?'#e6c3a5':light);}
 });
}
function rockSprite(){return spriteAt(56,48,c=>{
 r(c,3,39,48,8,'#163c3966');r(c,8,23,38,19,'#526967');r(c,5,15,34,23,'#829b94');r(c,14,7,26,15,'#abb5ab');
 r(c,13,9,18,5,'#d2d4bd');r(c,11,28,18,3,'#a6b7a5');r(c,34,27,9,10,'#526d69');
 });}
function screen(x,y){const cam=g.camera();return {x:Math.round(x*T-cam.x),y:Math.round(y*T-cam.y)};}
function drawBuilding(h){const key='building:'+h.id;let image=CANVASES.get(key);if(!image){image=buildingSprite(h);CANVASES.set(key,image);}
 const {x,y}=screen(h.x,h.y);g.ctx.drawImage(image,x-24,y-43);
}
function drawTree(o){const variant=Math.floor(rnd(o.x,o.y,44)*3),key='tree:'+variant;
 let image=CANVASES.get(key);if(!image){image=treeSprite(variant);CANVASES.set(key,image);}
 const {x,y}=screen(o.x+.5,o.y+.5);g.ctx.drawImage(image,x-54,y-103);
}
function drawRock(o){let image=CANVASES.get('rock');if(!image){image=rockSprite();CANVASES.set('rock',image);}
 const {x,y}=screen(o.x+.5,o.y+.5);g.ctx.drawImage(image,x-28,y-33);
}
function fountain(){
 return spriteAt(200,205,c=>{
  const cx=100,base=172;
  // Stone steps, water basin and luminous concentric rings.
  c.fillStyle='#28483e77';c.beginPath();c.ellipse(cx,174,87,23,0,0,Math.PI*2);c.fill();
  for(let i=0;i<3;i++){c.fillStyle=['#706e68','#959790','#d4c8af'][i];c.beginPath();
   c.ellipse(cx,base-i*8,79-i*11,25-i*3,0,0,Math.PI*2);c.fill();}
  c.fillStyle='#3976a2';c.beginPath();c.ellipse(cx,142,54,18,0,0,Math.PI*2);c.fill();
  c.fillStyle='#66d7e5';c.beginPath();c.ellipse(cx,140,43,12,0,0,Math.PI*2);c.fill();
  c.fillStyle='#a3f7f7';c.beginPath();c.ellipse(cx,136,29,7,0,0,Math.PI*2);c.fill();
  // Crystal tower — two bevels and a separate side facet.
  c.fillStyle='#5c76d9';c.beginPath();c.moveTo(100,17);c.lineTo(128,57);c.lineTo(116,117);c.lineTo(100,136);c.lineTo(78,112);c.lineTo(73,61);c.closePath();c.fill();
  c.fillStyle='#9fe7fc';c.beginPath();c.moveTo(100,17);c.lineTo(100,134);c.lineTo(78,108);c.lineTo(73,61);c.closePath();c.fill();
  c.fillStyle='#d4fcfc';c.beginPath();c.moveTo(100,26);c.lineTo(87,64);c.lineTo(95,106);c.lineTo(100,121);c.closePath();c.fill();
  c.fillStyle='#b0f5ff';c.fillRect(96,17,7,30);
  c.fillStyle='#3fb3eb';c.fillRect(116,69,8,35);
  c.fillStyle='#f5fcfc';c.fillRect(83,62,5,11);
  r(c,76,119,48,11,'#aeb5b1');r(c,69,128,62,12,'#738991');
  r(c,78,140,45,6,'#d8e3d2');
 });
}
function lantern(c,x,y){r(c,x+3,y+8,5,36,'#4d514c');r(c,x-3,y,18,15,'#6a5d45');r(c,x,y+2,12,11,'#ffdea0');
 r(c,x+2,y+4,8,7,'#fff2b8');r(c,x-4,y-3,20,4,'#a58d65');}
function flowerbed(c,x,y){
 r(c,x,y+10,66,24,'#56694d');r(c,x+3,y+8,60,20,'#4f9761');
 for(let i=0;i<12;i++){const fx=x+3+((i*13)%56),fy=y+11+((i*19)%15);
  flower(c,fx,fy,i%3===0?'#fff0c6':i%2?'#e6a2bd':'#bbd8da');}
}
function propSprites(list){
 const listProps=[
  {x:32,y:25,type:'garden'},{x:40,y:25,type:'garden'},{x:32,y:31,type:'garden'},{x:40,y:31,type:'garden'},
  {x:29,y:27,type:'lamp'},{x:44,y:27,type:'lamp'},{x:29,y:33,type:'lamp'},{x:44,y:33,type:'lamp'},
  {x:37,y:35,type:'banner'},{x:28,y:23,type:'banner'},{x:45,y:23,type:'banner'},
  {x:34,y:32,type:'crate'},{x:44,y:30,type:'stall'},{x:40,y:32,type:'flowers'},
  {x:33,y:42,type:'tower'},{x:40,y:42,type:'tower'},
  {x:18,y:21,type:'planter'},{x:27,y:36,type:'flowers'},
  {x:31,y:39,type:'lamp'},{x:45,y:39,type:'lamp'}
 ];
 for(const d of listProps)list.push({y:d.y+.6,draw:()=>drawProp(d)});
 list.push({y:28.6,draw:()=>drawFountain()});
}
function drawFountain(){
 let img=CANVASES.get('fountain');if(!img){img=fountain();CANVASES.set('fountain',img);}
 const v=screen(36.5,28.5),c=g.ctx;
 c.save();c.globalAlpha=.17+.11*Math.sin(frame/36);c.fillStyle='#a8eafa';c.beginPath();c.arc(v.x,v.y-65,79,0,7);c.fill();c.restore();
 c.drawImage(img,v.x-100,v.y-174);
}
function drawProp(p){
 const c=g.ctx,v=screen(p.x,p.y),x=v.x,y=v.y;
 if(p.type==='lamp'){lantern(c,x-5,y-31);return;}
 if(p.type==='flowers'||p.type==='garden'){flowerbed(c,x-34,y-23);return;}
 if(p.type==='planter'){r(c,x-13,y-5,26,17,'#886449');r(c,x-10,y-10,20,10,'#377958');
 for(let i=0;i<4;i++)flower(c,x-9+i*6,y-18+i%2*3,'#f4becf');return;}
 if(p.type==='crate'){
  r(c,x-15,y-12,29,25,'#82613f');r(c,x-13,y-10,25,4,'#ca985a');r(c,x-9,y-4,4,17,'#b78550');return;
 }
 if(p.type==='banner'){r(c,x-3,y-57,6,69,'#77684f');r(c,x-13,y-55,27,39,'#285ca0');
  r(c,x-10,y-52,21,4,'#edc76c');r(c,x-9,y-42,19,16,'#367bb7');r(c,x-4,y-38,9,11,'#ffd58a');return;}
 if(p.type==='stall'){r(c,x-46,y-14,95,39,'#795c40');r(c,x-43,y-16,86,19,'#b7ab81');
  for(let i=0;i<6;i++)r(c,x-43+i*14,y-43,14,28,i%2?'#f4ead6':'#b74847');
  for(let i=0;i<9;i++)r(c,x-39+i*9,y-13,6,6,i%3?'#e5ad54':'#93bd66');return;}
 if(p.type==='tower'){
  r(c,x-22,y-64,43,76,'#737d76');
  for(let yy=-60;yy<8;yy+=12)for(let xx=-18;xx<18;xx+=18){r(c,x+xx+(yy%2?6:0),y+yy,16,2,'#c6c6af');}
  r(c,x-24,y-71,47,12,'#5b6863');for(let xx=-22;xx<=16;xx+=14)r(c,x+xx,y-79,9,13,'#8b9990');
  r(c,x-6,y-21,12,21,'#243c46');r(c,x-3,y-18,6,17,'#9b906e');
 }
}
function foreground(){
 frame++;const c=g.ctx,cam=g.camera(),p=g.player();
 // Glow of the crystal changes over time, preserving sprites and movement layers.
 const sx=36.5*T-cam.x,sy=28.5*T-cam.y-75;
 c.save();c.globalAlpha=.18+.13*Math.sin(frame/24);c.strokeStyle='#d1f7ff';c.lineWidth=2;
 for(let i=0;i<3;i++){const angle=frame/61+i*2.09;
  c.beginPath();c.arc(sx+Math.sin(angle)*(41+i*9),sy+Math.cos(angle)*(30+i*9),2+i%2,0,Math.PI*2);c.stroke();}
 c.restore();
 // Soft atmospheric highlights and sparkling river ripples, rain/night handled by game.
 if(frame%9===0){c.save();c.globalAlpha=.35;c.fillStyle='#bceef9';const yy=41*T-cam.y;for(let k=0;k<4;k++){
  const x=(12+k*5)*T-cam.x+Math.sin(frame/20+k)*6;
  c.fillRect(Math.floor(x),Math.floor(yy+Math.cos(frame/34+k)*4),12,1);
 }c.restore();}
}
function collision(x,y){
 // The fountain occupies the center of its circular stone base; paths wrap around it.
 const dx=x-36.5,dy=y-28.5;return dx*dx+dy*dy<1.3*1.3;
}
function drawBackground(ctx,camera,w,h){
 if(!ground)ground=drawGround();
 ctx.imageSmoothingEnabled=false;
 const left=Math.max(0,Math.floor(camera.x)),top=Math.max(0,Math.floor(camera.y));
 const sw=Math.min(w,ground.width-left),sh=Math.min(h,ground.height-top);
 if(sw>0&&sh>0)ctx.drawImage(ground,left,top,sw,sh,0,0,sw,sh);
}
function drawMiniMap(canvas){
 if(!ground)ground=drawGround();
 const c=canvas.getContext('2d');if(!c)return;
 canvas.width=W*8;canvas.height=H*8;c.imageSmoothingEnabled=false;
 c.drawImage(ground,0,0,canvas.width,canvas.height);
 // Legacy interactive buildings remain visible in atlas despite the new art renderer.
 for(const h of g.homes){
  const t=HOUSE_THEMES[h.id]||HOUSE_THEMES.home;
  r(c,h.x*8,h.y*8,h.w*8,h.h*8,t.roof);
  r(c,(h.x+h.w/2)*8-3,(h.y+h.h)*8-5,6,5,'#f5dc9a');
 }
 r(c,36.5*8-6,28.5*8-6,12,12,'#9deeff');
}
window.EvergroveHD={drawBackground,drawBuilding,drawTree,drawRock,propSprites,foreground,collision,drawMiniMap,
 reset:()=>{ground=null;CANVASES.clear();}};
})();