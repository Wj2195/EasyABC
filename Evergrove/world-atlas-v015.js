/* Evergrove v0.15 — connected world with guided gateway access. */
(()=>{
'use strict';
const api=window.EvergroveNavGame;if(!api)return;
const BASE={id:'base',name:'Willow Valley',width:68,height:48,emoji:'🏡'};
const TERRAIN={grass:'#79b979',farm:'#93ad65',path:'#bdad88',forest:'#4f9365',stone:'#839b91',water:'#4c95b2',cliff:'#6c7680',ruins:'#8c9e98'};
let selectedId=null;
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function registry(){return window.EvergroveExpansion?.registry?.()||null;}
const grid=()=>window.EvergroveWorldGrid;
function maps(){return [BASE,...(registry()?.maps||[]).map(m=>({...m,emoji:'🌲'}))];}
function currentId(){return api.state().activeMap&&api.state().activeMap!=='base'?api.state().activeMap:'base';}
function isExplored(id){return id==='base'||currentId()===id||!!api.state().discoveredMaps?.[id];}
function source(id){return maps().find(m=>m.id===id)||BASE;}
function nameFor(id){return source(id).name;}
function portalList(id){const data=registry();return id==='base'?(data?.basePortals||[]):(source(id).portals||[]);}
function regionRows(){
 return maps().map(m=>{
   const current=currentId()===m.id,discovered=isExplored(m.id);
   const status=current?'● YOU ARE HERE':discovered?'✓ VISITED':'◇ NOT YET VISITED';
   return '<button type="button" class="atlas-region'+(selectedId===m.id?' selected':'')+'" data-atlas-region="'+escapeHTML(m.id)+'" aria-pressed="'+String(selectedId===m.id)+'" title="View '+escapeHTML(m.name)+' map">'+
     '<span class="atlas-thumb" aria-hidden="true">'+(m.emoji||'🗺️')+'</span><span class="atlas-info"><strong>'+escapeHTML(m.name)+'</strong><small>'+escapeHTML(status)+'</small><small>'+m.width+' × '+m.height+' tiles</small></span></button>';
 }).join('');
}

const CELLX=131,CELLY=88,BOXW=112,BOXH=65;
function networkHTML(){
 const world=registry(),regions=maps(),g=grid();
 if(!world||!g)return '<div class="atlas-footnote">Loading world connections…</div>';
 const nodes=regions.map(m=>({...m,grid:m.grid||{x:0,y:0}}));
 const here=nodes.find(m=>m.id===selectedId)||nodes[0];
 const open=g.neighbors(world,here.id).filter(x=>x.available).map(v=>({...v.coord,side:v.side,open:true}));
 const all=[...nodes,...open];
 const minX=Math.min(...all.map(x=>x.grid?.x??x.x)),minY=Math.min(...all.map(x=>x.grid?.y??x.y));
 const maxX=Math.max(...all.map(x=>x.grid?.x??x.x)),maxY=Math.max(...all.map(x=>x.grid?.y??x.y));
 const W=(maxX-minX+1)*CELLX,H=(maxY-minY+1)*CELLY;
 const center=m=>({x:(m.grid.x-minX)*CELLX+CELLX/2,y:(m.grid.y-minY)*CELLY+CELLY/2});
 const lines=[],byCoord=new Map(nodes.map(m=>[m.grid.x+','+m.grid.y,m]));
 for(const m of nodes)for(const side of ['east','south']){
  const d=g.DIR[side],target=byCoord.get((m.grid.x+d.dx)+','+(m.grid.y+d.dy));
  if(!target)continue;
  const a=center(m),b=center(target);
  lines.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#ecd898" stroke-width="5" stroke-linecap="round"/>');
 }
 const card=m=>{
  const c=center(m),sel=m.id===selectedId,now=m.id===currentId(),seen=isExplored(m.id);
  return '<button type="button" class="atlas-network-node'+(sel?' selected':'')+(now?' current':'')+'" data-atlas-region="'+escapeHTML(m.id)+'"'+
    ' style="left:'+(c.x-BOXW/2)+'px;top:'+(c.y-BOXH/2)+'px" title="View '+escapeHTML(m.name)+'">'+
    '<span class="atlas-node-name">'+escapeHTML(m.name)+'</span><small>'+ (now?'● HERE':seen?'✓ VISITED':'◇ EXPLORE')+'</small></button>';
 };
 const slots=open.map(p=>{const x=(p.x-minX)*CELLX+CELLX/2,y=(p.y-minY)*CELLY+CELLY/2;
   return '<div class="atlas-empty-slot" title="Free '+p.side+' expansion slot" style="left:'+(x-BOXW/2)+'px;top:'+(y-BOXH/2)+'px">+ OPEN '+p.side.toUpperCase()+'</div>';
 }).join('');
 return '<div class="atlas-network" style="width:'+W+'px;height:'+H+'px"><svg class="atlas-network-lines" width="'+W+'" height="'+H+'" aria-hidden="true">'+lines.join('')+'</svg>'+
 nodes.map(card).join('')+slots+'</div>';
}

function markup(){
 const mapList=maps(),id=currentId();
 selectedId=mapList.some(m=>m.id===id)?id:'base';
 const explored=mapList.filter(m=>isExplored(m.id)).length;
 const count=mapList.reduce((n,m)=>n+m.width*m.height,0);
 return '<div class="atlas-root" id="atlasRoot"><aside class="atlas-sidebar" aria-label="Available world maps">'+
 '<div class="atlas-label">🧭 CONNECTED WORLD</div>'+ '<div class="atlas-network-scroll" id="atlasNetwork">'+networkHTML()+'</div>'+ '<div class="atlas-label">🌍 AVAILABLE REGIONS</div>'+
 '<p class="atlas-total">'+mapList.length+' maps · '+count.toLocaleString()+' total tiles</p>'+
 '<div class="atlas-regions" id="atlasRegions">'+regionRows()+'</div>'+
 '<div class="atlas-key">'+explored+'/'+mapList.length+' visited<br>Compass: N ↑ · E → · S ↓ · W ←<br>+ OPEN = free expansion side</div>'+
 '</aside><section class="atlas-main" aria-label="Selected map preview">'+
 '<div class="atlas-main-head"><strong id="atlasRegionTitle"></strong><span id="atlasRegionStatus" class="atlas-state"></span></div>'+
 '<div class="atlas-map-frame"><canvas id="fullMap" class="atlas-preview-canvas" role="img" aria-label="Preview of selected region"></canvas><span class="atlas-map-hint">● Your position · ◉ Portal · ■ Object</span></div>'+
 '<div class="atlas-stats" id="atlasStats"></div>'+
 '<div class="atlas-label">CONNECTED GATEWAYS</div><div class="atlas-portal-list" id="atlasPortals"></div>'+
 '<div class="atlas-footnote" id="atlasNote">View maps here. Walk through a glowing portal in-game to travel; viewing a map does not teleport you.</div>'+
 '</section></div>';
}
function drawExpansion(map,canvas){
 const tile=Math.max(3,Math.min(10,Math.floor(910/map.width),Math.floor(670/map.height)));
 canvas.width=map.width*tile;canvas.height=map.height*tile;
 const c=canvas.getContext('2d');if(!c)return;
 c.imageSmoothingEnabled=false;
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
   const t=map.terrain?.[x+','+y]||map.defaultTerrain||'grass';
   c.fillStyle=TERRAIN[t]||TERRAIN.grass;c.fillRect(x*tile,y*tile,tile,tile);
   if((x*11+y*7)%7===0){c.fillStyle='#ffffff15';c.fillRect(x*tile+1,y*tile+1,Math.max(1,tile-2),1);}
 }
 for(const object of map.objects||[]){
   if(!Number.isFinite(object.x)||!Number.isFinite(object.y))continue;
   c.fillStyle=object.type==='tree'?'#1d614b':'#5d6d6b';
   c.fillRect(object.x*tile+Math.max(0,tile*.14),object.y*tile+Math.max(0,tile*.14),Math.max(2,tile*.72),Math.max(2,tile*.72));
 }
 const drawDot=(x,y,color,r)=>{c.fillStyle=color;c.strokeStyle='#142a2e';c.lineWidth=Math.max(1,tile*.18);c.beginPath();c.arc(x*tile,y*tile,r,0,Math.PI*2);c.stroke();c.fill();};
 for(const p of portalList(map.id))drawDot(p.x+.5,p.y+.5,'#ffe29a',Math.max(3,tile*.46));
 if(map.spawn)drawDot(map.spawn.x,map.spawn.y,'#c5ddff',Math.max(2,tile*.35));
 if(currentId()===map.id){const p=api.player();drawDot(p.x,p.y,'#ffffff',Math.max(3,tile*.52));}
}
function drawBase(canvas){
 if(api.drawBaseMap){api.drawBaseMap();}else{const c=canvas.getContext('2d');c.fillStyle=TERRAIN.forest;c.fillRect(0,0,canvas.width,canvas.height);}
 const c=canvas.getContext('2d');if(!c)return;
 for(const p of portalList('base')){
   c.strokeStyle='#2d4038';c.lineWidth=2;c.fillStyle='#f6dda2';c.beginPath();c.arc((p.x+.5)*8,(p.y+.5)*8,5,0,Math.PI*2);c.stroke();c.fill();
 }
}
function update(){
 const root=$('atlasRoot'),canvas=$('fullMap');if(!root||!canvas)return;
 const map=source(selectedId),at=currentId(),now=selectedId===at,visited=isExplored(selectedId);
 for(const b of root.querySelectorAll('[data-atlas-region]')){
   b.classList.toggle('selected',b.dataset.atlasRegion===selectedId);
   b.setAttribute('aria-pressed',String(b.dataset.atlasRegion===selectedId));
 }
 $('atlasNetwork').innerHTML=networkHTML();
 $('atlasRegionTitle').textContent=map.name;
 $('atlasRegionStatus').textContent=now?'● CURRENT AREA':visited?'✓ EXPLORED':'◇ NOT YET VISITED';
 $('atlasStats').innerHTML='<span>↔ '+map.width+' × '+map.height+' tiles</span><span>▦ '+(map.width*map.height).toLocaleString()+' tiles</span>'+
 '<span>◉ '+portalList(map.id).length+' gateways</span>';
 const portals=portalList(map.id);
 $('atlasPortals').innerHTML=portals.length?portals.map(p=>
   '<button type="button" class="atlas-gateway" data-atlas-region="'+escapeHTML(p.to)+'" title="Preview connected area">◉ '+escapeHTML(p.side?.toUpperCase()||'GATE')+' → '+escapeHTML(nameFor(p.to))+'</button>'+
   (now?'<button type="button" class="atlas-gateway atlas-guide" data-atlas-go="'+escapeHTML(p.side||'')+'" title="Automatically walk to this gateway">🏃 Go to gateway</button>':'')
 ).join(''):'<span class="atlas-footnote">No connected gates are published for this region yet.</span>';
 const currentWorld=registry(),gridApi=grid(),open=currentWorld&&gridApi?gridApi.neighbors(currentWorld,map.id).filter(s=>s.available).map(s=>s.side.toUpperCase()):[];
 $('atlasNote').textContent=(now?'Your current region. ':'Preview only — ')+'Linked gateways are at the middle of each map edge. '+(open.length?'Free sides: '+open.join(', ')+'.':'All four sides connected.')+' Travel only through portals in-game.';
 if(map.id==='base')drawBase(canvas);else drawExpansion(map,canvas);
}
function choose(id){
 if(!maps().some(m=>m.id===id))return;
 selectedId=id;update();
}
function guide(side){
 const portal=portalList(currentId()).find(p=>p.side===side);
 if(!portal)return;
 api.closeModal?.();
 if(currentId()==='base')window.EvergroveNavigation?.go({x:portal.x+.5,y:portal.y+.5},null,true);
 else window.EvergroveExpansion?.routeToGate?.(portal);
}
function mount(){
 const root=$('atlasRoot');if(!root)return;
 root.addEventListener('click',e=>{const go=e.target.closest('[data-atlas-go]');if(go&&root.contains(go)){guide(go.dataset.atlasGo);return;}const b=e.target.closest('[data-atlas-region]');if(!b||!root.contains(b))return;choose(b.dataset.atlasRegion);});
 update();
 window.EvergroveJourney?.mountAtlas?.();
}
function refresh(){
 if(!$('atlasRoot'))return;
 const body=$('modalBody');if(!body)return;
 const old=selectedId;
 body.innerHTML=markup();
 if(old&&maps().some(m=>m.id===old))selectedId=old;
 mount();
}
window.addEventListener('evergrove:maps-ready',refresh);
window.EvergroveAtlas={markup,mount,choose,refresh,maps,guide,preview:()=>selectedId};
})();