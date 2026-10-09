/* Evergrove 60-level progression manifest accessor (v1).
 * This file is intentionally NOT linked from index.html yet.
 * Safe to include later: does not replace the legacy maps/worlds.json or modify saves.
 * Public API: window.EvergroveProgression.load(), validate(), get(), getNext(),
 * getPrevious(), getRegion(), safeTowns(), isSafeZone(), connectedTo().
 */
(function(root){'use strict';
let manifest=null,byId=new Map(),regions=new Map(),pending=null;
const assert=(ok,message)=>{if(!ok)throw new Error("Evergrove progression: "+message);};
function validate(doc){
 assert(doc&&doc.schemaVersion===1,"unsupported schema");
 assert(Array.isArray(doc.maps)&&doc.maps.length===81,"expected 81 maps");
 assert(Array.isArray(doc.regions)&&doc.regions.length===20,"expected 20 regions");
 const ids=new Set(doc.maps.map(m=>m.id));assert(ids.size===81,"duplicate map IDs");
 assert(doc.maps[0].id==="base"&&doc.maps[80].id==="town-20","first/final town IDs");
 const mapById=new Map(doc.maps.map(m=>[m.id,m]));
 let levels=0,safeTowns=0;
 const footprintsTouch=(a,b)=>{
  const p=a.footprint,q=b.footprint;
  return p.x<q.x+q.width&&p.x+p.width>q.x&&p.y<q.y+q.height&&p.y+p.height>q.y;
 };
 for(let i=0;i<doc.maps.length;i++){
  const m=doc.maps[i],prev=doc.maps[i-1],next=doc.maps[i+1];
  assert(m.mapSize?.width===68&&m.mapSize?.height===48,"invalid dimensions: "+m.id);
  assert(m.orderIndex===i,"invalid progression order: "+m.id);
  assert(m.monsters?.enabled===false&&Array.isArray(m.monsters.spawnPoints)&&m.monsters.spawnPoints.length===0,"unexpected monster spawns: "+m.id);
  assert(m.flags?.monsterSpawningAllowed===false&&m.flags?.combatDamageAllowed===false,"monsters/damage must be disabled during map foundation: "+m.id);
  assert(m.adjacent?.previous===(prev?.id??null)&&m.adjacent?.next===(next?.id??null),"broken next/previous link: "+m.id);
  const expected=Number(!!prev)+Number(!!next);
  assert(m.portals?.length===expected,"wrong portal count: "+m.id);
  for(const p of m.portals){
   assert(ids.has(p.to),"unknown portal destination: "+m.id+"->"+p.to);
   assert(p.side==="north"||p.side==="south","progression portals must use north/south: "+m.id);
   assert((p.side==="north"&&p.to===next?.id)||(p.side==="south"&&p.to===prev?.id),"misdirected portal: "+m.id);
   const target=mapById.get(p.to);
   assert(target.portals.some(q=>q.to===m.id&&q.side===(p.side==="north"?"south":"north")),"nonreciprocal portal: "+m.id+"->"+p.to);
  }
  if(m.kind==="level"){
   levels++;assert(m.flags.safeZone===false,"level cannot be marked safe-zone town: "+m.id);
   assert(m.services.length===0&&m.layout?.futureMonsterAreas?.spawnPoints?.length===0,"unexpected service/enemy points: "+m.id);
  }else{
   safeTowns++;assert(m.flags.safeZone===true,"town must be safe: "+m.id);
   assert(m.services?.length===10,"all ten service categories required in "+m.id);
   assert(m.layout?.buildings?.length===24,"24 exterior buildings required in "+m.id);
   const buildings=m.layout.buildings;
   for(let a=0;a<buildings.length;a++){
    const b=buildings[a],f=b.footprint,door=b.door;
    assert(f.x>=0&&f.y>=0&&f.x+f.width<=68&&f.y+f.height<=48,"building out of bounds: "+b.id);
    assert(door.x>=0&&door.y>=0&&door.x<68&&door.y<48,"door out of bounds: "+b.id);
    assert(b.render?.enterable===false,"interiors not yet active: "+b.id);
    for(let j=a+1;j<buildings.length;j++)assert(!footprintsTouch(b,buildings[j]),"overlapping town buildings: "+b.id);
   }
  }
 }
 assert(levels===60&&safeTowns===21,"level/town counts");
 assert(Array.isArray(doc.progressionPath)&&doc.progressionPath.join("|")===doc.maps.map(m=>m.id).join("|"),"path list and map order must match");
 return {valid:true,levels,safeTowns,totalMaps:doc.maps.length,buildingExteriors:safeTowns*24,portalLinks:160};
}
function set(doc){const result=validate(doc);manifest=doc;byId=new Map(doc.maps.map(m=>[m.id,m]));regions=new Map(doc.regions.map(r=>[r.id,r]));return result;}
async function load(url="./maps/progression-60.json"){
 if(manifest)return manifest;
 if(pending)return pending;
 pending=(async()=>{
  const response=await fetch(url,{cache:"no-cache"});
  if(!response.ok)throw new Error("Unable to fetch map progression ("+response.status+")");
  const doc=await response.json();set(doc);return doc;
 })();
 try{return await pending;}finally{pending=null;}
}
function get(id){return byId.get(id)||null;}
function getNext(id){const m=get(id);return m?.adjacent.next?get(m.adjacent.next):null;}
function getPrevious(id){const m=get(id);return m?.adjacent.previous?get(m.adjacent.previous):null;}
function getRegion(idOrNumber){const id=typeof idOrNumber==="number"?"region-"+String(idOrNumber).padStart(2,"0"):idOrNumber;return regions.get(id)||null;}
function safeTowns(){return manifest?.maps.filter(m=>m.flags.safeZone)||[];}
function isSafeZone(id){return !!get(id)?.flags.safeZone;}
function connectedTo(id){return (get(id)?.portals||[]).map(p=>({side:p.side,to:p.to,name:get(p.to)?.displayName||p.to,gateTile:p.gateTile,arrival:p.arrival}));}
root.EvergroveProgression={load,validate,set,get,getNext,getPrevious,getRegion,safeTowns,isSafeZone,connectedTo,manifest:()=>manifest};
})(typeof window!=="undefined"?window:globalThis);
