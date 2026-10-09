/* Evergrove v0.14 — shared cardinal world layout / gateway rules. */
(function(g){'use strict';
const DIR={north:{dx:0,dy:-1,opposite:'south',label:'NORTH'},east:{dx:1,dy:0,opposite:'west',label:'EAST'},south:{dx:0,dy:1,opposite:'north',label:'SOUTH'},west:{dx:-1,dy:0,opposite:'east',label:'WEST'}};
const DIRECTIONS=Object.keys(DIR);
const BASE={id:'base',name:'Willow Valley',width:68,height:48,grid:{x:0,y:0}};
const point=(map,side)=>{
 const x=Math.floor(map.width/2),y=Math.floor(map.height/2);
 return side==='north'?{x,y:0}:side==='south'?{x,y:map.height-1}:side==='west'?{x:0,y}:{x:map.width-1,y};
};
const arrival=(map,side)=>{const p=point(map,side);
 return {x:side==='west'?3.5:side==='east'?map.width-3.5:p.x+.5,
 y:side==='north'?3.5:side==='south'?map.height-3.5:p.y+.5};};
const findMap=(world,id)=>id==='base'?BASE:(world.maps||[]).find(m=>m.id===id);
function normalize(world){
 if(!world||!Array.isArray(world.maps))return world;
 const occupied=new Set(['0,0']);
 const legacyOffsets=[[1,0],[-1,0],[0,-1],[0,1]];
 for(const m of world.maps){
  if(!m.grid||!Number.isInteger(m.grid.x)||!Number.isInteger(m.grid.y)||
    occupied.has(m.grid.x+','+m.grid.y)){
   let found=null;
   for(let r=1;r<200&&!found;r++)for(let x=-r;x<=r&&!found;x++)for(let y=-r;y<=r&&!found;y++)
    if(Math.abs(x)+Math.abs(y)===r&&!occupied.has(x+','+y))found={x,y};
   m.grid=found||{x:world.maps.indexOf(m)+1,y:0};
   // Keep the first legacy expansion east of the village where possible.
   if(world.maps.indexOf(m)===0&&!occupied.has('1,0'))m.grid={x:1,y:0};
  }
  occupied.add(m.grid.x+','+m.grid.y);
 }
 world.baseGrid={x:0,y:0};
 const all=[BASE,...world.maps],positions=new Map(all.map(m=>[m.grid.x+','+m.grid.y,m]));
 for(const m of all){
  const portals=[];
  for(const [side,delta] of Object.entries(DIR)){
   const target=positions.get((m.grid.x+delta.dx)+','+(m.grid.y+delta.dy));
   if(!target)continue;
   portals.push({...point(m,side),side,to:target.id,arrival:arrival(target,delta.opposite),label:target.name});
  }
  if(m.id==='base')world.basePortals=portals;else {
  m.portals=portals;
  const clear=new Set();
  for(const side of DIRECTIONS){
    const p=point(m,side);
    for(let d=0;d<4;d++)for(let k=-1;k<=1;k++){
      const x=p.x+(side==='west'?d:side==='east'?-d:k);
      const y=p.y+(side==='north'?d:side==='south'?-d:k);
      if(x>=0&&y>=0&&x<m.width&&y<m.height)clear.add(x+','+y);
    }
  }
  m.terrain=m.terrain||{};
  for(const key of clear)m.terrain[key]='path';
  m.objects=(m.objects||[]).filter(o=>!clear.has(o.x+','+o.y));
 }
 }
 return world;
}
function neighbors(world,id){
 const m=findMap(world,id);if(!m||!m.grid)return [];
 const positions=new Map([BASE,...world.maps].map(v=>[v.grid.x+','+v.grid.y,v]));
 return DIRECTIONS.map(side=>{const d=DIR[side],coord={x:m.grid.x+d.dx,y:m.grid.y+d.dy},target=positions.get(coord.x+','+coord.y);
 return {side,coord,target:target||null,available:!target};});
}
function attach(world,sourceId,side,map){
 const source=findMap(world,sourceId),delta=DIR[side];
 if(!source||!delta||!map||!map.id)return false;
 const coord={x:source.grid.x+delta.dx,y:source.grid.y+delta.dy};
 if([BASE,...world.maps].some(m=>m.grid.x===coord.x&&m.grid.y===coord.y))return false;
 map.grid=coord;world.maps.push(map);normalize(world);return true;
}
g.EvergroveWorldGrid={BASE,DIR,DIRECTIONS,point,arrival,normalize,neighbors,attach,findMap};
})(window);