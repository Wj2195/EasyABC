// WARD 13 procedural supernatural apparitions and physical hunter visuals.
// The ghosts are temporary psychological events; the Nurse/Patient are persistent hunters.
export function createHauntings(THREE,scene,getContext,playCue){
  const textures=[0,1,2].map(kind=>paintSpectre(kind));
  let active=null, lastFloor=-1, lastSpawn=0, encounters=0;
  const forward=new THREE.Vector3();
  function paintSpectre(kind){
    const c=document.createElement("canvas"); c.width=512;c.height=1024;const g=c.getContext("2d");const W=c.width,H=c.height;
    const halo=g.createRadialGradient(256,360,30,256,450,390);
    halo.addColorStop(0,kind===0?"rgba(114,143,150,.30)":"rgba(126,49,47,.22)");halo.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=halo;g.fillRect(0,0,W,H);
    // Distorted gown with torn silhouette and tapering shadow wisps.
    const outline=g.createLinearGradient(0,240,0,1010);
    outline.addColorStop(0,kind===1?"rgba(198,191,172,.88)":"rgba(54,62,66,.97)");
    outline.addColorStop(.55,kind===1?"rgba(134,126,118,.91)":"rgba(42,44,49,.90)");
    outline.addColorStop(1,"rgba(17,17,24,0)");
    g.fillStyle=outline;g.beginPath();g.moveTo(202,390);g.lineTo(309,390);g.bezierCurveTo(350,450,362,635,440,952);
    g.lineTo(375,903);g.lineTo(338,1001);g.lineTo(292,944);g.lineTo(245,1024);g.lineTo(204,926);g.lineTo(145,1002);g.lineTo(125,903);g.lineTo(76,962);g.bezierCurveTo(136,628,158,458,202,390);g.fill();
    // Uneven arms with long dangling fingers.
    for(const [side,shift] of [[-1,-1],[1,1]]){
      g.strokeStyle=kind===2?"rgba(139,139,136,.85)":"rgba(91,90,92,.82)";g.lineCap="round";g.lineWidth=28;
      const start=256+side*65, end=256+side*(kind===2?170:135);g.beginPath();g.moveTo(start,435);g.bezierCurveTo(start+side*22,575,end-side*12,653,end,784);g.stroke();
      g.lineWidth=6;for(let i=0;i<4;i++){g.beginPath();g.moveTo(end+(i-1.5)*8,784);g.lineTo(end+(i-1.5)*15+shift*9,825+(i%2)*27);g.stroke()}
    }
    // Pale, long, decayed face. Hollow dark eyes with tiny reflecting pupils.
    const face=g.createRadialGradient(230,245,8,253,270,120);
    face.addColorStop(0,kind===1?"#d0c4b3":"#a3a8a3");face.addColorStop(.58,kind===1?"#aba89a":"#858e90");face.addColorStop(1,"#343a40");
    g.fillStyle=face;g.beginPath();g.ellipse(255,260,84,117,kind===2?.13:-.07,0,Math.PI*2);g.fill();
    g.fillStyle="#15191b";for(const x of [215,292]){g.beginPath();g.ellipse(x,251,29,42,(x===215?-.18:.15),0,Math.PI*2);g.fill();
      g.fillStyle=kind===0?"#a7bfc9":"#d96d66";g.beginPath();g.ellipse(x,260,4,6,0,0,Math.PI*2);g.fill();g.fillStyle="#15191b"}
    g.fillStyle="#151317";g.beginPath();g.ellipse(257,326,19,kind===2?48:34,0,0,Math.PI*2);g.fill();
    if(kind!==2){g.strokeStyle="#d0c6b4";g.lineWidth=2;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(256+i*6,300);g.lineTo(256+i*7,346);g.stroke()}}
    g.strokeStyle="rgba(55,26,33,.85)";g.lineWidth=5;
    for(const x of [215,290]){g.beginPath();g.moveTo(x,285);g.bezierCurveTo(x-8,345,x+17,370,x+4,407);g.stroke()}
    // Heavy tangled hair partially hides the face; hair has an uneven cut.
    g.strokeStyle=kind===1?"#30292b":"#12181c";g.lineCap="round";
    for(let i=0;i<31;i++){let x=177+(i*5.4),off=Math.sin(i*12.2)*22,down=(kind===2?510:410)+((i*43)%175);g.lineWidth=6+(i%4)*3;g.beginPath();g.moveTo(x,159+(i%3)*6);g.bezierCurveTo(x+off,315,x-off*.5,470,x+off,down);g.stroke()}
    if(kind===1){g.fillStyle="#b6b6ad";g.beginPath();g.moveTo(172,170);g.lineTo(335,170);g.lineTo(303,126);g.lineTo(206,126);g.closePath();g.fill();g.fillStyle="#7c1d1b";g.fillRect(244,135,18,34);g.fillRect(231,146,45,12)}
    // Scratches and cloth grime.
    g.strokeStyle="rgba(105,39,42,.65)";g.lineWidth=4;
    for(let i=0;i<19;i++){const xx=110+(i*29)%290,yy=440+(i*67)%415;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+8,yy+21);g.stroke()}
    return new THREE.CanvasTexture(c);
  }
  function clear(){
    if(active){scene.remove(active.group);active.material.dispose();active=null}
  }
  function canSeeThrough(x,z,px,pz,collides){
    const dist=Math.hypot(px-x,pz-z);
    for(let t=.4;t<dist-.7;t+=.5){
      const a=t/dist;if(collides(x+(px-x)*a,z+(pz-z)*a,.1))return false
    }
    return true;
  }
  function appear(collides){
    const {state,yaw}=getContext();
    if(!state||state.won||active)return false;
    // Distinct behaviours: ahead, in peripheral vision, or behind the player.
    const mode=Math.random();
    const offsets=mode<.57?[0,.22,-.28,.42]:mode<.85?[.9,-.85,1.05,-1.1]:[2.5,-2.5,Math.PI];
    let pos=null;
    outer: for(const angle of offsets)for(const d of [3.5,5,6.8,2.6]){
      const a=yaw+angle,x=state.x-Math.sin(a)*d,z=state.z-Math.cos(a)*d;
      if(!collides(x,z,.2)&&canSeeThrough(state.x,state.z,x,z,collides)){pos={x,z};break outer}
    }
    if(!pos)return false;
    const kind=(encounters++%5===4)?2:Math.floor(Math.random()*2.8);
    const material=new THREE.MeshBasicMaterial({map:textures[Math.min(kind,2)],transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,alphaTest:.015,toneMapped:false});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.25,4.35),material);
    plane.position.y=2.08;plane.renderOrder=4;
    const group=new THREE.Group();group.position.set(pos.x,0,pos.z);group.add(plane);
    const glow=new THREE.PointLight(kind===1?0xc64243:0x8da5b2,.65,3.8,2);glow.position.set(0,2.2,0);group.add(glow);
    scene.add(group);
    active={group,plane,material,glow,age:0,duration:1.65+Math.random()*1.25,kind,glimpse:0,vanishing:false,float:Math.random()*9};
    playCue(kind);return true;
  }
  function update(dt){
    if(!active)return;
    const h=active,{state,camera}=getContext();
    h.age+=dt;
    h.group.position.y=Math.sin(h.age*3.5+h.float)*.085;
    const dx=state.x-h.group.position.x,dz=state.z-h.group.position.z;
    h.plane.rotation.y=Math.atan2(dx,dz);
    camera.getWorldDirection(forward);
    const v=new THREE.Vector3(h.group.position.x-state.x,1.55-camera.position.y,h.group.position.z-state.z).normalize();
    if(forward.dot(v)>.965&&h.age>.55){h.glimpse+=dt;if(h.glimpse>.35&&!h.vanishing){h.vanishing=true;h.duration=Math.min(h.duration,h.age+.25)}}
    let fade=h.age<.22?h.age/.22:h.age>h.duration-.45?Math.max(0,(h.duration-h.age)/.45):1;
    h.material.opacity=fade*(.74+.16*Math.sin(h.age*31))*(Math.random()<.04?.1:1);
    h.glow.intensity=fade*(.3+.5*Math.abs(Math.sin(h.age*8)));
    if(state.hauntRepel>0){h.duration=Math.min(h.duration,h.age+.18);h.vanishing=true}
    if(h.age>=h.duration)clear();
  }
  return {appear,update,clear};
}

export function createMonsterBody(THREE,type){
  // A more disturbing three-dimensional hunter instead of a plain cylinder.
  const group=new THREE.Group();
  const make=(geometry,color,materialExtras={})=>new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.93,...materialExtras}));
  const orb=(parent,x,y,z,sx,sy,sz,color)=>{const m=make(new THREE.SphereGeometry(1,12,9),color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m};
  const limb=(parent,start,end,r,color)=>{const v1=new THREE.Vector3(...start),v2=new THREE.Vector3(...end),vec=new THREE.Vector3().subVectors(v2,v1);const m=make(new THREE.CylinderGeometry(r*.67,r,vec.length(),7),color);m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());parent.add(m);return m};
  const dark=0x13161a,blood=0x5a151a;
  if(type==="nurse"){
    const gown=make(new THREE.CylinderGeometry(.3,.59,1.48,10),0xb4ada2);
    gown.position.y=1.12;group.add(gown);
    orb(group,0,2.03,-.04,.235,.33,.22,0x9a9c92);
    orb(group,0,2.18,.135,.26,.26,.21,0x272728);
    for(const sign of [-1,1]){
      orb(group,sign*.098,2.06,-.254,.085,.102,.033,dark);
      orb(group,sign*.10,2.06,-.282,.021,.035,.012,0x9e292a);
      limb(group,[sign*.34,1.77,0],[sign*.49,.98,-.24],.12,0x9e9d95);
      limb(group,[sign*.49,.98,-.24],[sign*.52,.5,-.49],.09,0x89877f);
      for(let j=0;j<3;j++)limb(group,[sign*.52+j*.028,.51,-.47],[sign*.59+j*.028,.22,-.55-j*.02],.022,0x807a75);
      limb(group,[sign*.20,.5,0],[sign*.20,.07,-.07],.13,0x514f4e);
    }
    orb(group,0,1.91,-.256,.064,.135,.02,dark);
    const cap=make(new THREE.BoxGeometry(.50,.10,.23),0xc9c6b9);cap.position.set(0,2.34,-.06);group.add(cap);
    const stripe=make(new THREE.BoxGeometry(.12,.025,.015),blood);stripe.position.set(0,2.352,-.186);group.add(stripe);
    for(let i=0;i<8;i++)limb(group,[((i%4)-1.5)*.08,2.2,.08],[((i%4)-1.5)*.12,1.67+(i%3)*.10,-.20],.025,0x242429);
    for(let i=0;i<9;i++){const splatter=make(new THREE.SphereGeometry(.025+(i%3)*.018,6,4),blood);splatter.position.set(Math.sin(i*2)*.25,.7+(i%5)*.17,-.40);group.add(splatter)}
    group.userData.motion={head:group.children[1],sway:0};
  }else{
    // Low, crawling, asymmetrical silhouette with unnaturally long forearms.
    const torso=make(new THREE.CylinderGeometry(.3,.38,1.25,10),0x666a64);
    torso.position.set(0,.63,0);torso.rotation.x=Math.PI/2;group.add(torso);
    const head=orb(group,0,.69,-.85,.29,.29,.29,0x8c897f);
    orb(group,-.11,.70,-1.11,.10,.10,.03,dark);orb(group,.13,.70,-1.11,.10,.1,.03,dark);
    orb(group,0,.54,-1.11,.10,.14,.025,0x271b1a);
    for(const side of [-1,1]){
      limb(group,[side*.33,.68,-.3],[side*.63,.29,-.66],.12,0x7c8176);
      limb(group,[side*.63,.29,-.66],[side*.7,.12,-1.4],.082,0x8f9187);
      for(let j=0;j<3;j++)limb(group,[side*.7+j*.035,.14,-1.4],[side*.70+j*.035,.09,-1.63],.022,0x8d8980);
      limb(group,[side*.30,.60,.54],[side*.51,.19,1],.15,0x555950);
    }
    group.userData.motion={head,sway:0};
  }
  return group;
}
