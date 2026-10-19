/* STRIKEZONE FPS v3.9 — original procedural tactical weapon assets.
 * Six permanently cached PBR models. Visual-only: gameplay/ammunition remains in index.html.
 * Positive Z points toward the player; barrels point toward negative Z.
 */
export function createWeaponRig(THREE, scene){
  const groups=[], flashes=[], mags=[];
  const resources=new Set(), mats=new Set(), textures=new Set();
  const stockColors=[0x29343b,0x34383c,0x51534c,0x68452b,0x2c3339,0x987a50];
  const limbSkin=new THREE.MeshStandardMaterial({color:0x987966,roughness:.94});
  const metal=new THREE.MeshStandardMaterial({color:0x626d73,metalness:.83,roughness:.34});
  const darkMetal=new THREE.MeshStandardMaterial({color:0x27333a,metalness:.84,roughness:.31});
  const brightMetal=new THREE.MeshStandardMaterial({color:0x9ba7ad,metalness:.84,roughness:.30});
  const rubber=new THREE.MeshStandardMaterial({color:0x222729,metalness:.08,roughness:.93});
  const glass=new THREE.MeshStandardMaterial({color:0x174b59,metalness:.44,roughness:.10,emissive:0x0e3c47,emissiveIntensity:.35});
  const marking=new THREE.MeshStandardMaterial({color:0xb3a88f,metalness:.55,roughness:.45});
  const brass=new THREE.MeshStandardMaterial({color:0xb69a5d,metalness:.74,roughness:.32});
  const orange=new THREE.MeshBasicMaterial({color:0xffc068,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false});
  const plasma=new THREE.MeshStandardMaterial({color:0x289dc6,metalness:.28,roughness:.18,emissive:0x167cd1,emissiveIntensity:1.3});
  const plasmaCore=new THREE.MeshBasicMaterial({color:0x7dfaff});
  const energyFlash=new THREE.MeshBasicMaterial({color:0x77faff,transparent:true,opacity:.90,side:THREE.DoubleSide,depthWrite:false});
  for(const m of [limbSkin,metal,darkMetal,brightMetal,rubber,glass,marking,brass,orange,plasma,plasmaCore,energyFlash])mats.add(m);
  function texture(seed,base){
    const c=document.createElement('canvas');c.width=c.height=256;
    const ctx=c.getContext('2d');
    const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967295;};
    ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
    for(let i=0;i<6800;i++){
      const v=(rng()*100+90)|0;
      ctx.fillStyle='rgba('+v+','+v+','+v+','+(0.016+rng()*.040)+')';
      const x=rng()*256,y=rng()*256;ctx.fillRect(x,y,1+rng()*2,1+rng()*2);
    }
    for(let y=0;y<256;y+=6){
      ctx.strokeStyle='rgba(255,255,255,.018)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=4;textures.add(t);return t;
  }
  const gripTex=texture(21983,'#a8a8a8');
  const camoTex=texture(33511,'#8b968f');
  const materials={
    black:new THREE.MeshStandardMaterial({color:0x58656b,map:gripTex,roughness:.72,metalness:.10}),
    olive:new THREE.MeshStandardMaterial({color:0x87917b,map:gripTex,roughness:.78,metalness:.08}),
    tan:new THREE.MeshStandardMaterial({color:0xcbb99e,map:gripTex,roughness:.82,metalness:.04}),
    wood:new THREE.MeshStandardMaterial({color:0xb38155,map:camoTex,roughness:.69,metalness:.02}),
    camo:new THREE.MeshStandardMaterial({color:0x899b8c,map:camoTex,roughness:.89,metalness:.04}),
    glove:new THREE.MeshStandardMaterial({color:0x404849,map:gripTex,roughness:.88,metalness:.04}),
    skin:limbSkin,steel:metal,dark:darkMetal,chrome:brightMetal,
    rubber,glass,detail:marking,brass
  };
  Object.values(materials).forEach(m=>mats.add(m));
  function geometry(g){resources.add(g);return g;}
  function mesh(parent,geo,mat,pos){
    const m=new THREE.Mesh(geometry(geo),mat);m.position.set(pos[0],pos[1],pos[2]);
    m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
  }
  function box(parent,x,y,z,w,h,d,mat,rad=.012){
    if(rad>0&&w>rad*3&&h>rad*3&&d>rad*3){
      const r=Math.min(rad,w*.17,h*.17,d*.17);
      const sh=new THREE.Shape();
      const wi=w-2*r,hi=h-2*r,dep=d-2*r;
      sh.moveTo(-wi/2,-hi/2);sh.lineTo(wi/2,-hi/2);sh.lineTo(wi/2,hi/2);
      sh.lineTo(-wi/2,hi/2);sh.closePath();
      const m=mesh(parent,new THREE.ExtrudeGeometry(sh,{depth:dep,steps:1,bevelEnabled:true,bevelSegments:2,bevelThickness:r,bevelSize:r,curveSegments:3}),mat,[x,y,z-dep/2]);
      return m;
    }
    return mesh(parent,new THREE.BoxGeometry(w,h,d),mat,[x,y,z]);
  }
  function tube(parent,x,y,z,rad,len,mat,radEnd=rad,sides=12){
    const m=mesh(parent,new THREE.CylinderGeometry(radEnd,rad,len,sides,1,false),mat,[x,y,z]);
    m.rotation.x=Math.PI/2;return m;
  }
  function rod(parent,a,b,radius,mat){
    const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b);
    const mid=v1.clone().add(v2).multiplyScalar(.5);
    const d=v2.clone().sub(v1);
    const m=mesh(parent,new THREE.CylinderGeometry(radius,radius,d.length(),9),mat,mid.toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    return m;
  }
  function grip(parent,x,y,z,mat){
    const g=box(parent,x,y,z,.128,.31,.135,mat,.028);g.rotation.x=-.20;
    box(parent,x,y-.16,z+.025,.145,.055,.143,rubber,.017);
    for(let k=0;k<5;k++)box(parent,x+.064,y-.08+k*.045,z,.008,.009,.095,darkMetal,0);
    return g;
  }
  function rail(parent,zstart,zend,y,width=.15){
    box(parent,0,y,(zstart+zend)/2,width,.043,Math.abs(zend-zstart),darkMetal,.009);
    const step=.075;
    for(let z=zstart;z>zend;z-=step)box(parent,0,y+.024,z,width+.03,.025,.024,brightMetal,.004);
  }
  function optic(parent,z,y,large=false){
    const rad=large?.114:.076,len=large?.48:.27;
    // Real hollow tube: old CylinderGeometry endcaps were opaque black discs.
    // Keep an open center through both optic rings, even in hip/ADS view.
    for(const side of [-1,1]){
      const endZ=z+side*len*.47;
      mesh(parent,new THREE.TorusGeometry(rad*.82,rad*.16,8,24),side===-1?metal:darkMetal,[0,y,endZ]);
    }
    for(let n=0;n<4;n++){
      const angle=n*Math.PI/2;
      const ox=Math.cos(angle)*rad*.85,oy=Math.sin(angle)*rad*.85;
      rod(parent,[ox, y+oy,z-len*.44],[ox,y+oy,z+len*.44],rad*.12,darkMetal);
    }
    for(const ofs of [-len*.22,len*.22]){
      box(parent,0,y-rad-.043,z+ofs,.072,.082,.046,metal,.012);
    }
    box(parent,0,y-rad-.12,z,.09,.038,.13,metal,.011);
    if(large){
      tube(parent,.14,y,z+.05,.046,.12,metal);
      tube(parent,.14,y,z+.05,.026,.13,brightMetal);
      box(parent,0,y+.13,z+.05,.075,.038,.08,metal,.012);
    }
  }
  function handguard(parent,length,width=.24,mat=materials.black,holes=6){
    box(parent,0,0,-.35-length/2,width,.24,length,mat,.035);
    for(const side of [-1,1]){
      for(let j=0;j<holes;j++){
        const z=-.48-(j+.5)*(length-.25)/holes;
        box(parent,side*(width/2+.002),.012,z,.008,.06,.085,darkMetal,.002);
        box(parent,side*(width/2+.008),.012,z,.004,.025,.046,brightMetal,0);
      }
    }
    rail(parent,-.35,-.35-length,.153,width*.60);
    box(parent,0,-.125,-.35-length/2,width*.8,.055,length*.88,darkMetal,.01);
  }
  function magazine(parent,z,long=false,curved=true){
    const node=new THREE.Group();node.position.set(0,-.17,z);parent.add(node);
    const height=long?.38:.29;
    const m=box(node,0,-height/2,0,.18,height,.18,metal,.024);
    if(curved)m.rotation.x=-.22;
    box(node,0,-height+.006,.023,.18,.035,.19,darkMetal,.01);
    for(const side of [-1,1])for(let j=0;j<5;j++){
      box(node,side*.093,-.055-j*(height-.09)/5,.005,.005,.010,.13,brightMetal,0);
    }
    return node;
  }
  function stock(parent,z,shape='telescopic',mat=materials.black){
    if(shape==='fold'){
      rod(parent,[-.10,-.02,z],[.0,-.03,z+.40],.022,metal);
      box(parent,0,-.035,z+.41,.21,.29,.09,mat,.029);
      box(parent,0,-.04,z+.47,.18,.34,.035,rubber,.013);
      return;
    }
    if(shape==='solid'){
      box(parent,0,-.105,z+.31,.225,.27,.58,mat,.08);
      box(parent,0,-.09,z+.61,.225,.30,.045,rubber,.013);
      box(parent,0,.015,z+.19,.22,.07,.25,mat,.025);
      return;
    }
    rod(parent,[-.10,.01,z],[-.10,.01,z+.38],.025,brightMetal);
    rod(parent,[.10,.01,z],[.10,.01,z+.38],.025,brightMetal);
    box(parent,0,-.035,z+.39,.235,.27,.12,mat,.032);
    box(parent,0,-.055,z+.455,.20,.285,.035,rubber,.015);
    box(parent,0,.10,z+.26,.19,.07,.33,mat,.028);
  }
  function detailReceiver(parent,name,bodyMat,compact=false){
    const len=compact?.47:.68,width=compact?.20:.31;
    box(parent,0,0,0,width,.26,len,metal,.041);
    box(parent,0,.13,0,width*.94,.064,len*.92,bodyMat,.014);
    box(parent,0,-.12,.08,width*.94,.07,len*.66,bodyMat,.01);
    // Bolt carrier/ejection port on the right side
    box(parent,width*.51,.026,-.045,.013,.092,.24,darkMetal,.004);
    box(parent,width*.54,.025,-.015,.014,.037,.12,brightMetal,.003);
    box(parent,width*.56,-.078,.125,.02,.04,.045,brightMetal,.002);
    // Grip and trigger guard
    grip(parent,.0,-.28,.24,materials.glove);
    rod(parent,[-.07,-.15,.17],[-.07,-.30,.13],.008,metal);
    rod(parent,[.07,-.15,.17],[.07,-.30,.13],.008,metal);
    rod(parent,[-.07,-.30,.13],[.07,-.30,.13],.009,metal);
    // Fire selector switch and charging handle
    tube(parent,width*.55,-.065,.18,.026,.055,marking);
    box(parent,0,.19,.19,.17,.055,.07,darkMetal,.008);
    // Unique machine-stamped decal card
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const cx=canvas.getContext('2d');cx.fillStyle='#12202a';cx.fillRect(0,0,512,96);
    cx.fillStyle='#c4c3ba';cx.font='700 33px Arial';cx.fillText(name,15,42);
    cx.fillStyle='#7c9cab';cx.font='19px Arial';cx.fillText('STRIKEZONE // TACTICAL SERIES',15,76);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);
    const labelMat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});mats.add(labelMat);
    const label=mesh(parent,new THREE.PlaneGeometry(.245,.054),labelMat,[width/2+.015,.045,.095]);
    label.rotation.y=Math.PI/2;
    return width;
  }
  function ventSlots(parent,zStart,zEnd,y,mat){
    for(let z=zStart;z>zEnd;z-=.085){
      box(parent,-.14,y,z,.015,.042,.04,mat,.005);
      box(parent,.14,y,z,.015,.042,.04,mat,.005);
    }
  }
  function muzzle(parent,z,size=.078){
    tube(parent,0,0,z,size,.13,darkMetal,size*.90,16);
    for(const sign of [-1,1]){
      box(parent,sign*size*.72,0,z,.016,size*.55,.060,brightMetal,0);
    }
    box(parent,0,size*.9,z,.030,.018,.07,brightMetal,.003);
  }
  function addHands(g,weapon){
    // Two gloved hands and visible fabric-covered forearms connect to the gun.
    const supportZ=weapon===4?-.12:weapon===5?-.72:-.53;
    rod(g,[-.32,-.40,supportZ+.44],[-.23,-.19,supportZ],.104,materials.camo);
    rod(g,[.34,-.44,.49],[.22,-.18,.16],.107,materials.camo);
    box(g,-.21,-.16,supportZ,.19,.15,.24,materials.glove,.054);
    box(g,.20,-.24,.19,.17,.21,.18,materials.glove,.052);
    for(const side of [-1,1]){
      const ox=side===-1?-.23:.21,z=side===-1?supportZ-.08:.13;
      for(let k=0;k<4;k++)box(g,ox+(k-1.5)*.036,-.20,z,.030,.10,.085,materials.glove,.010);
      box(g,ox,-.30,z+.05,.17,.028,.15,rubber,.010);
    }
  }
  function makeWeapon(index){
    const g=new THREE.Group();scene.add(g);
    const meta={mags:[],flash:null,barrelZ:-1.50};
    const type=index;const stockmat=[materials.black,materials.black,materials.olive,materials.wood,materials.black,materials.tan,materials.black][index];
    let width=.26;
    if(type===0){ // VORTEX AR
      width=detailReceiver(g,'VORTEX AR',materials.black);
      handguard(g,.82,.28,materials.black,7);
      tube(g,0,0,-1.45,.057,.62,metal,.057,20);muzzle(g,-1.82,.069);meta.barrelZ=-1.89;
      stock(g,.35,'telescopic',materials.black);meta.mags.push(magazine(g,-.13,true,true));
      optic(g,-.15,.37,false);
      box(g,0,-.18,-.72,.15,.23,.18,materials.black,.018);
      ventSlots(g,-.55,-1.06,.01,metal);
    }else if(type===1){ // RAPTOR SMG
      width=detailReceiver(g,'RAPTOR 9',materials.black,true);
      handguard(g,.43,.25,materials.black,4);
      tube(g,0,0,-.95,.066,.45,darkMetal);muzzle(g,-1.19,.073);meta.barrelZ=-1.26;
      stock(g,.22,'fold',materials.black);
      meta.mags.push(magazine(g,.03,true,false));
      optic(g,-.12,.31,false);
      box(g,0,-.24,-.53,.14,.28,.12,materials.glove,.022);
      box(g,-.16,.105,-.62,.050,.16,.20,metal,.010);
    }else if(type===2){ // RANGER DMR
      width=detailReceiver(g,'RANGER DMR',materials.olive);
      handguard(g,1.05,.27,materials.olive,9);
      tube(g,0,0,-1.77,.050,1.00,metal);muzzle(g,-2.30,.057);meta.barrelZ=-2.37;
      stock(g,.39,'solid',materials.olive);
      meta.mags.push(magazine(g,-.11,false,true));
      optic(g,-.05,.44,true);
      box(g,0,.17,.59,.215,.080,.29,rubber,.020);
      box(g,.13,-.21,-1.20,.042,.25,.22,metal,.010);
    }else if(type===3){ // JUDGE 12
      width=detailReceiver(g,'JUDGE 12',materials.wood);
      tube(g,0,.04,-1.18,.098,1.15,brightMetal);muzzle(g,-1.82,.087);meta.barrelZ=-1.88;
      tube(g,0,-.13,-1.13,.066,1.03,darkMetal);tube(g,0,-.13,-1.63,.080,.06,brass);
      box(g,0,-.09,-.75,.30,.25,.49,materials.wood,.038);
      stock(g,.38,'solid',materials.wood);
      box(g,0,.22,-.12,.09,.072,.39,darkMetal,.016);
      for(let i=0;i<5;i++)tube(g,-.20,-.04,-.26+i*.105,.032,.085,brass);
      // No detachable magazine on a tube-fed shotgun
    }else if(type===4){ // SPECTRE P9
      const pistolSlide=box(g,0,.01,-.16,.24,.18,.73,metal,.035);
      box(g,0,-.11,.05,.22,.13,.35,materials.black,.030);
      const p=box(g,0,-.34,.13,.17,.40,.23,materials.black,.038);p.rotation.x=-.18;
      box(g,0,-.54,.16,.20,.05,.26,rubber,.012);
      tube(g,0,.005,-.52,.046,.36,metal);muzzle(g,-.65,.052);meta.barrelZ=-.72;
      for(const side of [-1,1])for(let j=0;j<5;j++)
        box(g,side*.121,.045,-.06+j*.052,.008,.105,.017,brightMetal,.003);
      box(g,0,.15,.05,.045,.070,.03,marking);box(g,0,.14,-.48,.054,.046,.032,marking);
      rod(g,[-.10,-.22,-.05],[.10,-.22,-.05],.012,darkMetal);
      meta.mags.push(box(g,0,-.40,.15,.14,.35,.175,darkMetal,.014));
    }else if(type===5){ // PHANTOM SR
      width=detailReceiver(g,'PHANTOM SR',materials.tan);
      handguard(g,1.19,.29,materials.tan,11);
      tube(g,0,0,-1.90,.054,1.15,metal,.052,20);
      muzzle(g,-2.53,.092);meta.barrelZ=-2.59;
      stock(g,.40,'solid',materials.tan);
      box(g,0,.18,.62,.25,.08,.40,rubber,.025);
      meta.mags.push(magazine(g,-.14,false,false));
      optic(g,-.12,.49,true);
      // folding bipod with rubber feet
      for(const side of [-1,1]){
        rod(g,[side*.14,-.08,-1.45],[side*.30,-.55,-1.78],.020,metal);
        box(g,side*.30,-.58,-1.78,.14,.035,.06,rubber,.008);
      }
      tube(g,.175,.028,.19,.035,.13,brightMetal);
      rod(g,[.18,.05,.19],[.33,-.04,.20],.028,metal);
    }else{ // NOVA PULSE — magnetic plasma accelerator with glowing capacitor rails
      detailReceiver(g,'NOVA PULSE',materials.black);
      box(g,0,.025,-.70,.39,.36,.95,metal,.045);
      box(g,0,.02,-1.15,.31,.27,.61,materials.black,.035);
      for(const sign of [-1,1]){
        box(g,sign*.25,.015,-.82,.14,.32,1.02,metal,.024);
        box(g,sign*.26,.035,-.92,.034,.18,.75,plasma,.012);
        rod(g,[sign*.18,-.15,-.52],[sign*.18,-.15,-1.37],.041,darkMetal);
        for(let k=0;k<4;k++)box(g,sign*.18,.24,-.45-k*.25,.16,.09,.082,plasma,.016);
      }
      const chamber=tube(g,0,.02,-1.01,.146,.76,plasma,.14,18);
      g.userData.energyCore=chamber;
      for(let n=0;n<5;n++){
        const coil=new THREE.Mesh(new THREE.TorusGeometry(.19,.043,8,20),plasmaCore);
        coil.position.set(0,.02,-.61-n*.19);g.add(coil);
      }
      tube(g,0,.02,-1.58,.16,.28,metal,.16,14);
      tube(g,0,.02,-1.74,.145,.13,plasma,.145,18);
      meta.barrelZ=-1.84;
      stock(g,.43,'solid',materials.black);
      meta.mags.push(magazine(g,.02,false,false));
      rail(g,-.15,-1.50,.26,.18);
      box(g,0,.37,-.55,.18,.16,.32,plasma,.025);
      box(g,0,-.32,-.55,.17,.25,.23,materials.glove,.027);
      muzzle(g,-1.84,.16);
    }
    if(index!==4)addHands(g,index);
    else{
      rod(g,[.34,-.43,.49],[.16,-.29,.16],.10,materials.camo);
      box(g,.12,-.29,.11,.18,.20,.22,materials.glove,.045);
    }
    // Dedicated four-blade muzzle flash, never drawn for the wrong weapon.
    const flash=new THREE.Group();g.add(flash);
    const front=meta.barrelZ;
    const star=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),index===6?energyFlash:orange);
    flash.add(star);star.position.set(0,0,front);star.scale.set(.8,.8,2.3);
    for(let k=0;k<4;k++){
      const m=new THREE.Mesh(new THREE.ConeGeometry(.075,.42,4),index===6?energyFlash:orange);
      m.position.set(Math.cos(k*Math.PI/2)*.10,Math.sin(k*Math.PI/2)*.10,front-.12);
      m.rotation.set(Math.PI/2,0,k*Math.PI/2);flash.add(m);
    }
    flash.visible=false;meta.flash=flash;
    g.visible=false;groups.push(g);mags.push(meta.mags);flashes.push(flash);
  }
  for(let i=0;i<7;i++)makeWeapon(i);
  let current=-1;
  function update(s){
    if(!s||!s.running||!s.alive){
      for(const g of groups)g.visible=false;
      // Reset cached identity so respawning with the same weapon re-enables it.
      current=-1;
      return;
    }
    const i=Math.max(0,Math.min(6,s.weapon|0));
    if(current!==i){if(current>=0)groups[current].visible=false;current=i;}
    const g=groups[i],aim=!!s.ads,weapon=i;
    // Visibility must be set every living frame, not only when weapon index changes.
    // When using the sniper scope, keep the rifle out of the sight picture.
    g.visible=!((i===2||i===5)&&aim);
    const gait=Math.sin(s.bob||0)*.009;
    const shake=Math.abs(Math.sin((s.bob||0)*.8))*.007;
    // Place optical sight nearer the crosshair in ADS; preserve a right-hand hip position.
    const adsX=weapon===4?.03:0;
    const hipX=weapon===4?.41:.40;
    // In ADS, center the optic's actual height on the camera reticle instead of
    // lifting the whole model above the crosshair.
    const scale=weapon===4?.94:weapon===5?.83:weapon===6?.87:.91;
    const opticHeights=[.37,.31,.44,.21,.15,.49,.37];
    const centerY=aim?-opticHeights[weapon]*scale:-.32;
    g.scale.setScalar(scale);
    g.position.set(aim?adsX:hipX+gait,
      centerY+shake-s.recoil*.23,weapon===4?-.66:-.80);
    g.rotation.set(-s.recoil*.20,0,gait*.34+(aim?0:-.035));
    const reload=(s.reloadDuration&&s.reloadRemaining)?Math.max(0,Math.min(1,s.reloadRemaining/s.reloadDuration)):0;
    if(reload>0){const p=1-reload;g.rotation.x+=Math.sin(p*Math.PI)*.34;g.position.y-=Math.sin(p*Math.PI)*.12;}
    for(const m of mags[i]){
      if(!m||!m.isObject3D)continue;
      m.position.y=(m.userData.baseY??(m.userData.baseY=m.position.y))-(reload>0?Math.sin((1-reload)*Math.PI)*.17:0);
    }
    if(i===6&&g.userData.energyCore){g.userData.energyCore.scale.setScalar(1+(s.energyCharge||0)*.30);}
    const f=flashes[i];f.visible=s.flash>.015;
    if(f.visible){const size=.72+s.flash*7;f.scale.setScalar(size);}
  }
  function dispose(){
    for(const g of groups)scene.remove(g);
    for(const g of resources)g.dispose();
    for(const m of mats)m.dispose();
    for(const t of textures)t.dispose();
  }
  return {update,dispose,weaponCount:groups.length,version:'3.12-nova-pulse'};
}
