/* STRIKEZONE v3.43: rigged, skinned tactical soldier.
   Source: three.js example Soldier.glb — Vanguard by T. Choonyung/Mixamo.
   Loaded as a game asset; skeleton animation is part of the playable game.
   If the remote sample cannot load the existing procedural FPS rigs remain available.
*/
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/utils/SkeletonUtils.js';

const MODEL_URLS=[
 'https://threejs.org/examples/models/gltf/Soldier.glb',
 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Soldier.glb',
 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Soldier.glb'
];
const LIMIT=10;
function poseClass(id){return id===1?'raptor':id===2||id===5?'ranger':id===7?'aegis':id===6?'nova':id===8?'blade':'vanguard';}
export async function loadTacticalSoldiers(THREE,scene){
 const loader=new GLTFLoader();
 let asset=null,lastError=null;
 for(const url of MODEL_URLS){
  try{asset=await loader.loadAsync(url);if(asset?.scene)break;}
  catch(error){lastError=error;console.warn('STRIKEZONE soldier mirror unavailable:',url,error);}
 }
 if(!asset?.scene)throw new Error('Rigged soldier failed to load: '+(lastError?.message||'asset missing'));
 const clips=Object.fromEntries(asset.animations.map(a=>[a.name.toLowerCase(),a]));
 // Bounds from the static imported scene are NOT reliable for Mixamo skinning.
 // We fit each animated rig after its first Idle pose instead.
 const TARGET_HEIGHT=1.83;
 const initialBounds=new THREE.Box3().setFromObject(asset.scene,true);
 if(initialBounds.isEmpty())throw new Error('Imported soldier has no visible geometry');
 const TEAM=[0x68c7f9,0xfa7882];
 const materialSteel=new THREE.MeshStandardMaterial({color:0x252d32,roughness:.54,metalness:.64});
 const materialGrip=new THREE.MeshStandardMaterial({color:0x111a20,roughness:.83});
 const materialTan=new THREE.MeshStandardMaterial({color:0x887b65,roughness:.82,metalness:.10});
 const cyan=new THREE.MeshBasicMaterial({color:0x48deff});
 const red=new THREE.MeshBasicMaterial({color:0xf56c75});
 const cubeGeo=new THREE.BoxGeometry(1,1,1);
 const cylGeo=new THREE.CylinderGeometry(1,1,1,10);
 function cube(host,mat,x,y,z,w,h,d){
  const o=new THREE.Mesh(cubeGeo,mat);
  o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;
  host.add(o);return o;
 }
 function cylinder(host,mat,x,y,z,r,length){
  const o=new THREE.Mesh(cylGeo,mat);o.position.set(x,y,z);
  o.scale.set(r,length,r);o.rotation.x=Math.PI/2;o.castShadow=true;
  host.add(o);return o;
 }
 function equipWeapon(root,weapon){
  const gun=new THREE.Group();root.add(gun);
  const role=poseClass(weapon);
  const isShield=weapon===7,isSaber=weapon===8,isEnergy=weapon===6,isSidearm=weapon===4;
  // Compact silhouette in front of the vest, rather than a giant cuboid face-covering gun.
  gun.position.set(isShield?.02:-.03,isShield?1.20:1.27,.30);
  gun.rotation.set(0,-.17,-.19);
  if(isShield){
   cube(gun,materialGrip,0,0,.11,.67,.88,.095);
   cube(gun,materialSteel,0,.32,.17,.69,.15,.12);
   cube(gun,materialSteel,-.30,.03,.18,.09,.77,.12);
   cube(gun,materialSteel,.30,.03,.18,.09,.77,.12);
   cube(gun,new THREE.MeshStandardMaterial({color:0x5e98ab,roughness:.27,metalness:.35}),0,.18,.22,.48,.23,.026);
   return gun;
  }
  if(isSaber){
   gun.position.set(.20,1.14,.34);gun.rotation.x=-.1;
   cube(gun,materialSteel,0,0,.13,.12,.12,.31);
   cube(gun,cyan,0,0,.75,.075,.075,1.02);
   return gun;
  }
  const receiver=isEnergy?.26:isSidearm?.13:.19;
  const length=weapon===5?.82:weapon===2?.68:weapon===1?.41:isSidearm?.27:isEnergy?.55:.52;
  cube(gun,materialSteel,0,0,.18,receiver,.15,length);
  cube(gun,materialGrip,0,.081,.15,receiver*.84,.035,length*.7);
  if(!isSidearm){
   cube(gun,materialTan,0,-.05,-.22,.15,.13,.31);
   cube(gun,materialGrip,0,-.18,.11,.11,.29,.12);
   cube(gun,materialSteel,0,-.13,.01,.10,.24,.13);
  }else cube(gun,materialGrip,0,-.16,.11,.09,.22,.11);
  cylinder(gun,materialSteel,0,.005,length*.79+.21,isSidearm?.025:.036,length*.75);
  cube(gun,materialSteel,0,.14,.03,.095,.09,.14);
  if(role==='ranger'){
   cube(gun,materialGrip,0,.20,.08,.12,.10,.28);
   cylinder(gun,materialSteel,0,.20,.37,.045,.20);
  }
  if(role==='nova'){
   cube(gun,materialGrip,0,.035,.45,.30,.22,.58);
   for(const side of [-1,1])cube(gun,cyan,side*.13,.06,.48,.025,.08,.48);
  }
  return gun;
 }
 function makeUnit(preview=false){
  const container=new THREE.Group();
  const figure=new THREE.Group();container.add(figure);
  const rig=cloneSkeleton(asset.scene);
  // Preserve the imported GLB scene's native transform. Overwriting rig.scale
  // is why boots became enormous while world-sized weapon props floated.
  const normalizedBody=new THREE.Group();
  normalizedBody.add(rig);
  figure.add(normalizedBody);
  let calibrated=false;
  function calibrateAnimatedBody(){
   if(calibrated)return;
   // Measure actual skinned vertices AFTER AnimationMixer applies the idle pose.
   // Computing the bounding box at load time caused only enormous boots to appear.
   normalizedBody.position.set(0,0,0);
   normalizedBody.rotation.set(0,0,0);
   normalizedBody.scale.set(1,1,1);
   container.position.set(0,0,0);
   container.rotation.set(0,0,0);
   figure.rotation.set(0,0,0);
   rig.updateWorldMatrix(true,true);
   const posedBox=new THREE.Box3().setFromObject(rig,true);
   const size=posedBox.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.y)||size.y<=.10)
     throw new Error('Animated soldier has invalid bounds');
   const scale=TARGET_HEIGHT/size.y;
   const mid=posedBox.getCenter(new THREE.Vector3());
   normalizedBody.scale.setScalar(scale);
   normalizedBody.position.set(-mid.x*scale,-posedBox.min.y*scale,-mid.z*scale);
   normalizedBody.rotation.y=Math.PI;
   normalizedBody.updateWorldMatrix(true,true);
   const check=new THREE.Box3().setFromObject(normalizedBody,true);
   const actualHeight=check.getSize(new THREE.Vector3()).y;
   if(!Number.isFinite(actualHeight)||Math.abs(actualHeight-TARGET_HEIGHT)>.16)
     throw new Error('Animated soldier normalization failed: '+actualHeight);
   calibrated=true;
  }
  const bodyColors=[];
  rig.traverse(object=>{
   if(!object.isMesh)return;
   object.castShadow=true;object.receiveShadow=true;
   if(object.material){
    const mats=Array.isArray(object.material)?object.material:[object.material];
    const unique=mats.map(mat=>mat.clone());
    object.material=Array.isArray(object.material)?unique:unique[0];
    bodyColors.push(...unique.filter(x=>x?.color));
   }
  });
  // Real armor geometry & proportions come from the rigged model. Only team
  // patches and weapon props are procedural: they never replace the human mesh.
  const patches=[];
  for(const side of [-1,1]){
   const patch=cube(figure,new THREE.MeshStandardMaterial({color:TEAM[0],roughness:.70}),side*.27,1.50,.08,.09,.13,.20);
   patch.rotation.z=side*.12;patch.visible=!preview;patches.push(patch);
  }
  const weaponHost=new THREE.Group();figure.add(weaponHost);
  // Do not show uncalibrated block weapons in the close-up operator preview:
  // the imported human silhouette should be visible without floating props.
  weaponHost.visible=!preview;
  const muzzle=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),
   new THREE.MeshBasicMaterial({color:0xffdb7e,transparent:true,opacity:.88}));
  muzzle.position.set(0,1.28,1.13);figure.add(muzzle);muzzle.visible=false;
  let weapon=-1,team=-1;
  const mixer=new THREE.AnimationMixer(rig);
  const state={name:'',action:null};
  function changePose(name){
   if(name===state.name)return;
   const clip=clips[name]||clips.idle||asset.animations[0];
   if(!clip)return;
   const next=mixer.clipAction(clip);
   next.reset().fadeIn(.19).play();
   if(state.action&&state.action!==next)state.action.fadeOut(.19);
   state.action=next;state.name=name;
  }
  changePose('idle');
  let lastWalking=0,phase=0;
  return {
   root:container,
   sync(actor,delta,previewTime,rotation){
    container.visible=!!actor;
    if(!actor)return;
    const w=actor.weapon??0,side=actor.team===1?1:0;
    if(team!==side){
     for(const patch of patches)patch.material.color.setHex(TEAM[side]);
     team=side;
    }
    if(weapon!==w){
     weaponHost.clear();
     equipWeapon(weaponHost,w);
     weapon=w;
    }
    const move=preview?0:Math.abs((actor.walk??0)-lastWalking);
    lastWalking=actor.walk??0;
    const walking=!preview&&move>.04&&!actor.downed;
    changePose(walking?(move>.23?'run':'walk'):'idle');
    // Only advance animation clocks when visible, cap to avoid giant jumps.
    mixer.update(Math.min(.07,Math.max(.001,delta)));
    calibrateAnimatedBody();
    if(preview){
     container.position.set(0,0,0);
     container.rotation.y=rotation;
     figure.rotation.set(0,Math.sin(previewTime*.68)*.012,0);
     muzzle.visible=false;
    }else{
     container.position.set(actor.x,floorY(actor),actor.z);
     container.rotation.y=actor.yaw||0;
     figure.rotation.set(0,0,0);
     if(actor.downed){
      figure.rotation.x=Math.min(1,Math.max(0,actor.fall||0))*1.38;
     }
     muzzle.visible=!actor.downed&&Number.isFinite(actor.lastFiredAt)&&
       previewTime-actor.lastFiredAt<.085&&previewTime>=actor.lastFiredAt&&
       ![7,8].includes(w);
    }
   }
  };
 }
 function floorY(actor){
  // Host will supply world elevation. Terrain correction occurs in update().
  return (actor.airHeight||0)+(actor.floor||0);
 }
 const units=Array.from({length:LIMIT},()=>makeUnit());
 for(const unit of units){scene.add(unit.root);unit.root.visible=false;}
 return {
  loaded:true,
  update(actors,dt,clock,floorHeight){
   const length=Math.min(LIMIT,actors.length);
   for(let i=0;i<units.length;i++){
    const soldier=units[i],actor=actors[i];
    if(i>=length||!actor){soldier.root.visible=false;continue;}
    // Keep ground level consistent with the existing physics map's floors.
    actor.floor=floorHeight(actor.x,actor.z);
    soldier.sync(actor,dt,clock,0);
   }
  },
  createPreview(){
   return makeUnit(true);
  },
  hide(){
   for(const unit of units)unit.root.visible=false;
  }
 };
}
