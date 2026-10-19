/* STRIKEZONE FPS v3.11 | corrected raised floor footing and blue/red shirts tactical soldier overhaul with optional enhanced WebGL2 renderer
 * Keeps the solo gameplay, AI, collisions and software fallback in index.html.
 * Three.js ESM is loaded over HTTPS only when browser WebGL2 is usable.
 */
const bridge = window.StrikeZoneRenderBridge;
const status = document.getElementById('rendererState');
const tag = document.getElementById('gfxTag');
const updateStatus=(s)=>{if(status)status.textContent=s;};
const updateTag=(s)=>{if(tag){tag.textContent=s+(s.startsWith('ENHANCED WEBGL2')?' · PRESS G TO CHANGE':'');tag.dataset.rendererLabel=s;}};

if (!bridge) {
  updateStatus('Graphics bridge unavailable — classic renderer active');
} else {
  let webgl2=false;
  try {const probe=document.createElement('canvas');const g=probe.getContext('webgl2',{powerPreference:'high-performance',antialias:true});webgl2=!!g;g?.getExtension('WEBGL_lose_context')?.loseContext();} catch (_) {}
  if (!webgl2) {
    updateStatus('SOFTWARE MODE · Enable graphics acceleration in Chrome Settings → System for GPU quality');
    updateTag('SOFTWARE GRAPHICS · GPU UNAVAILABLE');
    document.querySelectorAll('#qualityBtns button').forEach(btn=>{btn.disabled=true;btn.title='This PC/browser has WebGL2 disabled; enable graphics acceleration to use HIGH/ULTRA GPU graphics';});
  } else {
    try {
      let THREE;
      try {THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');}
      catch (_) {THREE=await import('https://unpkg.com/three@0.160.1/build/three.module.js');}
      await startModernRenderer(THREE);
    } catch (e) {
      console.warn('STRIKEZONE: enhanced renderer failed. Retaining working classic renderer.',e);
      window.__strike3DActive=false;
      updateStatus('Classic WebGL active · GPU engine module unavailable');
      updateTag('CLASSIC WEBGL · SAFE FALLBACK');
      document.querySelectorAll('#qualityBtns button').forEach(btn=>{btn.disabled=true;btn.title='Enhanced engine unavailable; classic renderer is running';});
    }
  }
}

async function startModernRenderer(THREE){
  const parent=document.body;
  const renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance',precision:'highp'});
  renderer.domElement.id='modernCanvas';
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.48;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x708d9f,1);
  parent.insertBefore(renderer.domElement, document.getElementById('gfxTag'));
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x88aab7);
  scene.fog=new THREE.FogExp2(0xd2c0a3,.0065);
  const camera=new THREE.PerspectiveCamera(77,innerWidth/innerHeight,.055,330);
  const gunScene=new THREE.Scene();
  const gunCam=new THREE.PerspectiveCamera(69,innerWidth/innerHeight,.045,15);
  gunCam.position.set(0,0,0);
  gunCam.rotation.set(0,0,0);
  gunScene.add(new THREE.AmbientLight(0xffffff,1.28));
  const gunKey=new THREE.DirectionalLight(0xfff4da,2.4);gunKey.position.set(-2,4,4);gunScene.add(gunKey);
  // Soft blue opposing fill light reveals receiver edges, scope and grips without flattening the metal.
  const gunFill=new THREE.DirectionalLight(0xa4cce5,1.15);gunFill.position.set(3,1,2);gunScene.add(gunFill);
  const hemi=new THREE.HemisphereLight(0xd7edff,0x66533b,2.0);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffdfb6,3.4);
  sun.position.set(-65,95,-38);sun.target.position.set(0,0,0);sun.castShadow=true;
  sun.shadow.camera.left=-61;sun.shadow.camera.right=61;sun.shadow.camera.top=61;sun.shadow.camera.bottom=-61;
  sun.shadow.camera.near=.8;sun.shadow.camera.far=260;sun.shadow.bias=-.00028;sun.shadow.normalBias=.028;
  scene.add(sun,sun.target);
  const rim=new THREE.DirectionalLight(0x66b6d6,.82);rim.position.set(48,22,45);scene.add(rim);

  // Stable seeded textures generated locally: zero image downloads or tracking.
  function randomSeed(id){let seed=(15485863 + id*32452843)>>>0;return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967295;};}
  const idPalette=bridge.materials();
  const neutral=(idPalette||[]).map(rgb=>new THREE.Color(`rgb(${rgb.map(v=>Math.max(0,Math.min(255,v))).join(',')})`));
  const mats=new Map();
  const matFor=(id)=>{
    id=Math.max(0,Math.min(neutral.length-1,id));
    if(mats.has(id))return mats.get(id);
    const rng=randomSeed(id);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    const stone=[0,1,2,23,26,28].includes(id),wood=[4,7,14].includes(id),metal=[3,8,9,20,21,25].includes(id);
    const glass=[10,25].includes(id),light=[15,18,19,24].includes(id);
    const masonryColor=stone?'#bfc0ae':wood?'#d2c19b':metal?'#b7c4ce':glass?'#accbd5':'#f0ede0';
    c.fillStyle=masonryColor;c.fillRect(0,0,256,256);
    if(stone){
      for(let row=0;row<8;row++)for(let col=-1;col<7;col++){
        const x=col*46+(row%2?23:0),y=row*34;
        c.fillStyle=`rgba(16,28,40,${(.19+rng()*.11).toFixed(3)})`;c.fillRect(x,y,45,2.1);c.fillRect(x,y,2.2,34);
        c.fillStyle=`rgba(255,255,240,${(.09+rng()*.09).toFixed(3)})`;c.fillRect(x+3,y+4,40,1.2);
        c.fillStyle=`rgba(48,50,53,${(.035+rng()*.05).toFixed(3)})`;c.fillRect(x+6,y+10,10+rng()*26,2+rng()*7);
      }
    }else if(wood){
      for(let y=0;y<=256;y+=30){c.fillStyle='rgba(36,26,17,.39)';c.fillRect(0,y,256,3);c.fillStyle='rgba(255,234,181,.24)';c.fillRect(0,y+5,256,2)}
      for(let j=0;j<50;j++){c.fillStyle='rgba(63,38,13,.11)';c.fillRect(rng()*256,rng()*256,rng()*160,1+rng()*3);}
    }else if(metal){
      for(let y=0;y<=256;y+=34){c.fillStyle='rgba(11,25,40,.36)';c.fillRect(0,y,256,2);c.fillStyle='rgba(252,255,255,.13)';c.fillRect(0,y+4,256,1);}
      for(let x=12;x<256;x+=36)for(let y=10;y<256;y+=34){c.beginPath();c.arc(x,y,2.3,0,Math.PI*2);c.fillStyle='rgba(11,25,40,.45)';c.fill();}
      if(id===25){const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,'#345e74');g.addColorStop(.48,'#6ca2ba');g.addColorStop(1,'#1f374f');c.fillStyle=g;c.globalAlpha=.78;c.fillRect(0,0,256,256);c.globalAlpha=1;}
    }else if(id===0){
      for(let j=0;j<900;j++){c.fillStyle=rng()>.5?'rgba(81,54,23,.1)':'rgba(255,255,225,.1)';c.fillRect(rng()*256,rng()*256,2+rng()*5,2+rng()*5);}
    }
    for(let i=0;i<1350;i++){
      const a=rng();c.fillStyle=a>.52?'rgba(255,255,255,.09)':'rgba(23,31,36,.07)';
      c.fillRect(rng()*256,rng()*256,1+rng()*3,1+rng()*3);
    }
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const m=new THREE.MeshStandardMaterial({color:neutral[id]||0xc2b2a0,map,roughness:glass?.24:metal?.52:wood?.88:.94,
      metalness:metal?.53:glass?.18:.02,side:THREE.DoubleSide,bumpMap:(stone||wood||metal)?map:null,bumpScale:stone?.036:wood?.025:metal?.016:0,emissive:light?new THREE.Color(neutral[id]||0xffffff):new THREE.Color(0x000000),
      emissiveIntensity:light?.16:0,depthWrite:true});
    mats.set(id,m);return m;
  };
  function grouped(data,{weapon=false,dynamic=false}={}){
    const sets=new Map();
    for(let i=0;i+20<data.length;i+=21){
      // packed original: x,y,z,nx,ny,nz,material, repeated every vertex
      const id=Math.max(0,Math.min((idPalette||[]).length-1,Math.round(data[i+6])));
      let e=sets.get(id);if(!e){e={pos:[],normal:[],uv:[]};sets.set(id,e);}
      for(let j=i;j<i+21;j+=7){const x=data[j],y=data[j+1],z=data[j+2],nx=data[j+3],ny=data[j+4],nz=data[j+5];
        e.pos.push(x,y,weapon?-z:z);e.normal.push(nx,ny,weapon?-nz:nz);
        const u=Math.abs(ny)>.6?x*.21:Math.abs(nx)>.55?z*.21:x*.21;
        const v=Math.abs(ny)>.6?z*.21:y*.24;
        e.uv.push(u,v);
      }
    }
    const meshes=[];
    for(const [id,e] of sets){
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(e.pos,3));
      geo.setAttribute('normal',new THREE.Float32BufferAttribute(e.normal,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(e.uv,2));geo.computeBoundingSphere();
      const mesh=new THREE.Mesh(geo,matFor(id));mesh.castShadow=!weapon && ![0,17,19,20,24,25].includes(id);
      mesh.receiveShadow=!weapon;meshes.push(mesh);
    }
    return meshes;
  }
  for(const mesh of grouped(bridge.geometry()))scene.add(mesh);
  const actorGroup=new THREE.Group();scene.add(actorGroup);
  const gunGroup=new THREE.Group();gunScene.add(gunGroup);

  // Distant landscape ridges and physically lit atmospheric sky dome.
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 p;uniform float t;void main(){float h=clamp(normalize(p).y*.5+.5,0.,1.);vec3 low=vec3(.78,.68,.52),mid=vec3(.48,.66,.77),top=vec3(.06,.20,.34);vec3 c=mix(low,mid,smoothstep(.13,.55,h));c=mix(c,top,smoothstep(.47,1.,h));vec3 ray=normalize(p);float sun=pow(max(dot(ray,normalize(vec3(-.58,.70,-.32))),0.),430.);c+=vec3(1.,.78,.48)*sun*.83;float dusk=pow(1.-abs(ray.y),7.);c+=vec3(.28,.12,.04)*dusk*.32;gl_FragColor=vec4(c,1.);}`,
    uniforms:{t:{value:0}}});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(180,32,20),skyMat);dome.frustumCulled=false;scene.add(dome);
  // A small range of high-contrast world details authored as original procedural art.
  const signTex=(label,sub,color)=>{
    const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');
    x.fillStyle='#102b3e';x.fillRect(0,0,512,128);x.fillStyle=color;x.fillRect(0,0,10,128);x.fillRect(0,0,512,5);
    x.strokeStyle='#84b1bb';x.lineWidth=2;x.strokeRect(11,7,490,114);
    x.font='bold 42px Arial';x.fillStyle='#edf7f7';x.fillText(label,26,63);
    x.font='bold 18px Arial';x.fillStyle='#a8ccd9';x.fillText(sub,28,100);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const signs=[
    {label:'OUTPOST 06',sub:'NORTH COMMAND',color:'#eea849',pos:[-23,4.15,-6.25],yaw:0},
    {label:'ALPHA / ENTRY',sub:'AUTHORIZED PERSONNEL',color:'#29b7da',pos:[22,3.8,-13.88],yaw:0},
    {label:'TACTICAL ZONE',sub:'KEEP MOVING · FIND COVER',color:'#ec6d53',pos:[0,3.8,29.68],yaw:Math.PI},
    {label:'STORAGE',sub:'CAUTION · HEAVY EQUIPMENT',color:'#ddc052',pos:[-22,4.0,24.6],yaw:Math.PI},
  ];
  for(const sign of signs){
    const tex=signTex(sign.label,sign.sub,sign.color);const m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,fog:false});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.9,.98),m);
    mesh.position.set(...sign.pos);mesh.rotation.y=sign.yaw;scene.add(mesh);
  }
  // Visible industrial accents, pipes and illuminated signal panels.
  const darkSteel=new THREE.MeshStandardMaterial({color:0x172a36,metalness:.62,roughness:.42});
  const beacon=new THREE.MeshStandardMaterial({color:0x5bc4d0,emissive:0x30a9bc,emissiveIntensity:2.1,roughness:.29});
  const cyl=new THREE.CylinderGeometry(.08,.08,5.0,12);
  for(const [x,z] of [[-8,-8],[8,-8],[-8,8],[8,8]]){
    const pole=new THREE.Mesh(cyl,darkSteel);pole.position.set(x,2.5,z);pole.castShadow=true;scene.add(pole);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),beacon);lamp.position.set(x,5.08,z);scene.add(lamp);
  }
  const botHelmets=[];
  const helmetMat=new THREE.MeshStandardMaterial({color:0x314753,roughness:.56,metalness:.14});
  const visorMat=new THREE.MeshStandardMaterial({color:0x131e2b,roughness:.21,metalness:.28});
  for(let i=0;i<10;i++){
    const root=new THREE.Group();const h=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),helmetMat);h.scale.set(1.15,.80,1);h.position.y=1.8;root.add(h);
    const visor=new THREE.Mesh(new THREE.BoxGeometry(.45,.14,.10),visorMat);visor.position.set(0,1.77,.28);root.add(visor);
    root.visible=false;scene.add(root);botHelmets.push(root);
  }
  // Procedural distance dust. Fully independent of gameplay / hit detection.
  const dustGeo=new THREE.BufferGeometry();const dustPos=[];
  const rng=randomSeed(2026);
  for(let i=0;i<230;i++)dustPos.push((rng()-.5)*67,.4+rng()*6,(rng()-.5)*67);
  dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPos,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xfbe2ac,size:.055,transparent:true,opacity:.25,depthWrite:false}));scene.add(dust);


  // V3.0 art pass: decorative meshes are intentionally nonblocking.
  // All playable collision geometry continues to come from index.html.
  const art=new THREE.Group();scene.add(art);
  const artStone=new THREE.MeshStandardMaterial({color:0xe0cbaa,roughness:.87,bumpMap:matFor(1).map,bumpScale:.024});
  const artDark=new THREE.MeshStandardMaterial({color:0x273b46,metalness:.60,roughness:.42});
  const artBronze=new THREE.MeshStandardMaterial({color:0xa97842,metalness:.45,roughness:.48});
  const artWood=new THREE.MeshStandardMaterial({color:0xa76437,map:matFor(4).map,roughness:.78});
  const artLeaf=new THREE.MeshStandardMaterial({color:0x3d7359,roughness:.91,side:THREE.DoubleSide});
  const artCloth=new THREE.MeshStandardMaterial({color:0x4a989a,roughness:.97,side:THREE.DoubleSide});
  const artRedCloth=new THREE.MeshStandardMaterial({color:0xb75c4b,roughness:.96,side:THREE.DoubleSide});
  const artLight=new THREE.MeshStandardMaterial({color:0x82e1e7,emissive:0x3ca8b6,emissiveIntensity:1.6,roughness:.26});
  function decorBox(x,y,z,w,h,d,mat,ry=0){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;art.add(m);return m;
  }
  function decorCylinder(x,y,z,r,h,mat,sides=12){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,sides),mat);
    m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;art.add(m);return m;
  }
  function cable(ax,ay,az,bx,by,bz){
    const pts=[];for(let j=0;j<=10;j++){const t=j/10;pts.push(new THREE.Vector3(ax+(bx-ax)*t,ay+(by-ay)*t-Math.sin(t*Math.PI)*.48,az+(bz-az)*t));}
    const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.026,5,false),artDark);
    m.castShadow=true;art.add(m);
  }
  function palm(x,z,size){
    decorCylinder(x,2*size,z,.15*size,4*size,artWood,8);
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7;
      const l=new THREE.Mesh(new THREE.ConeGeometry(.42*size,3.8*size,3),artLeaf);
      l.position.set(x+Math.cos(a)*1.10*size,3.9*size,z+Math.sin(a)*1.10*size);
      l.rotation.set(Math.PI/2-.27,0,-a);l.castShadow=true;art.add(l);
    }
  }
  // High-set market awnings and rooftop equipment make building silhouettes distinct.
  for(const [x,z,w,d,mat] of [[-18,-6,5.2,2.6,artCloth],[17,5,4.8,2.4,artRedCloth],[0,23,5.5,2.6,artCloth]]){
    decorBox(x,4.8,z,w,.095,d,mat);
    for(const side of [-1,1])decorBox(x+side*w*.46,4.57,z,.08,.43,d,mat);
    decorBox(x,4.90,z-d*.48,w+.06,.10,.12,artBronze);
  }
  for(const [x,z,h] of [[-23,-13,7],[23,13,7],[22,-19,5.4],[-22,20,5.8],[0,26,5.5],[0,-27,5.5]]){
    decorBox(x,h+.48,z,2.55,.26,1.75,artDark);
    decorBox(x,h+.66,z,2.22,.08,1.46,artBronze);
    for(const v of [-.68,.68])decorBox(x+v,h+.85,z,.11,.34,1.25,artDark);
    decorCylinder(x+.65,h+1.20,z-.55,.16,.65,artDark);
    decorBox(x-.65,h+.94,z+.48,1.25,.22,.42,artStone);
  }
  // Street furniture and distant palms are decorative; player movement is never blocked by them.
  for(const [x,z,k] of [[-28,-25,1.0],[28,25,.92],[-28,25,.86],[28,-25,1.05]])palm(x,z,k);
  for(const [x,z] of [[-27,-12],[27,14],[-26,17],[26,-13]]){
    decorCylinder(x,3,z,.07,6,artDark);
    decorBox(x,5.95,z,.60,.25,.44,artBronze);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),artLight);lamp.position.set(x,5.70,z);art.add(lamp);
  }
  cable(-27,5.8,-12,-26,5.8,17);
  cable(27,5.8,14,26,5.8,-13);
  // More recognizable supply containers, overhead signboards and red / blue markers.
  for(const [x,z] of [[-22,5],[23,-3],[-17,25],[17,-25]]){
    decorBox(x,3.72,z,2.9,.88,.12,artDark);
    for(const side of [-1,1])decorBox(x+side*1.32,3.70,z,.10,.92,.17,artBronze);
    decorBox(x,3.72,z+.095,2.45,.15,.07,artLight);
  }
  // Higher-detail muzzle and sight for the existing first-person weapon meshes.
  const gunAccents=new THREE.Group();gunScene.add(gunAccents);
  const accentMetal=new THREE.MeshStandardMaterial({color:0x242e38,metalness:.82,roughness:.25});
  const accentRubber=new THREE.MeshStandardMaterial({color:0x10151a,metalness:.18,roughness:.82});
  const accentLens=new THREE.MeshStandardMaterial({color:0x1c8f9d,emissive:0x17616b,emissiveIntensity:.24,metalness:.42,roughness:.14});
  function gunPart(w,h,d,x,y,z,mat){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    o.position.set(x,y,z);gunAccents.add(o);return o;
  }
  gunPart(.21,.12,.39,.40,-.18,-.72,accentMetal);
  gunPart(.28,.15,.31,.40,-.18,-.91,accentRubber);
  gunPart(.055,.035,.55,.40,-.04,-1.00,accentMetal);
  gunPart(.05,.05,.08,.40,-.01,-1.38,accentLens);
  gunPart(.08,.18,.22,.53,-.35,-.83,accentRubber);
  const muzzleGlow=new THREE.PointLight(0xffb55d,0,2.3,2);muzzleGlow.position.set(.4,-.24,-1.57);gunScene.add(muzzleGlow);
  // Soldier silhouettes gain rounded helmets, armor plates, pouches and team patches.
  const armorBlue=new THREE.MeshStandardMaterial({color:0x2c6a90,metalness:.18,roughness:.72});
  const armorRed=new THREE.MeshStandardMaterial({color:0xa54837,metalness:.15,roughness:.76});
  const armorDark=new THREE.MeshStandardMaterial({color:0x2a3239,metalness:.19,roughness:.79});
  const teamPatches=[];
  for(const root of botHelmets){
    const plate=(w,h,d,x,y,z,mat)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;root.add(m);return m;
    };
    plate(.59,.43,.16,0,1.20,.27,armorDark);
    plate(.44,.52,.20,0,1.23,-.31,armorDark);
    for(const k of [-1,1]){
      plate(.22,.17,.31,k*.52,1.37,.04,armorDark);
      plate(.17,.22,.15,k*.20,.53,.16,armorDark);
      plate(.20,.31,.17,k*.37,1.03,.30,armorDark);
    }
    plate(.36,.11,.24,0,1.83,.12,armorDark);
    plate(.42,.10,.08,0,1.75,.36,accentLens);
    teamPatches.push(plate(.46,.15,.045,0,1.27,.38,armorBlue));
  }

  // Ground elevation matches the original temple slab and its three entry steps.
  function floorSurfaceAt(x,z){
    let height=0;
    if(Math.abs(x)<=7.02&&Math.abs(z)<=7.02)height=.60;
    for(const side of [-1,1])for(let step=0;step<3;step++){
      const centerZ=side*(8.4-step*.58);
      const width=10.4-step*.85;
      if(Math.abs(x)<=width*.5&&Math.abs(z-centerZ)<=.9)
        height=Math.max(height,.405+step*.12);
    }
    return height;
  }
  // v3.5: anatomically proportioned tactical operators — original procedural assets.
  // Full models are GPU-only. The original block soldiers remain a safe renderer fallback.
  function createOperatorSystem(){
    const sphereG=new THREE.SphereGeometry(1,14,11);
    const cylinderG=new THREE.CylinderGeometry(1,1,1,10);
    const boxG=new THREE.BoxGeometry(1,1,1);
    const skin=new THREE.MeshStandardMaterial({color:0xcaa585,roughness:.88});
    const helmet=new THREE.MeshStandardMaterial({color:0x595d55,roughness:.84});
    const gear=new THREE.MeshStandardMaterial({color:0x343c39,roughness:.82,metalness:.08});
    const plates=new THREE.MeshStandardMaterial({color:0x7c8278,roughness:.85});
    const dark=new THREE.MeshStandardMaterial({color:0x1a2429,roughness:.62,metalness:.28});
    const glass=new THREE.MeshStandardMaterial({color:0x233c45,roughness:.18,metalness:.34});
    const boots=new THREE.MeshStandardMaterial({color:0x1b201e,roughness:.94});
    const steel=new THREE.MeshStandardMaterial({color:0x212a2b,roughness:.42,metalness:.65});
    const wood=new THREE.MeshStandardMaterial({color:0x79412d,roughness:.66});
    const allied=new THREE.MeshStandardMaterial({color:0x2589ad,roughness:.65});
    const enemy=new THREE.MeshStandardMaterial({color:0xc65045,roughness:.65});
    function camo(colors,seed){
      let v=seed>>>0;const rnd=()=>{v=(v*1664525+1013904223)>>>0;return v/4294967295;};
      const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
      x.fillStyle=colors[0];x.fillRect(0,0,256,256);
      for(let i=0;i<190;i++){
        const xx=rnd()*272-8,yy=rnd()*272-8,r=3+rnd()*27;
        x.fillStyle=colors[1+Math.floor(rnd()*(colors.length-1))];x.beginPath();x.moveTo(xx-r,yy);
        for(let j=0;j<7;j++){const a=j*Math.PI*2/7,sz=r*(.5+rnd()*.65);x.lineTo(xx+Math.cos(a)*sz,yy+Math.sin(a)*sz*.65);}
        x.closePath();x.fill();
      }
      for(let i=0;i<1000;i++){x.fillStyle=rnd()>.5?'#ffffff08':'#00000008';x.fillRect(rnd()*256,rnd()*256,2+rnd()*3,2+rnd()*3);}
      const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
    }
    // Distinct, bright team-color combat shirts; neutral camouflage stays on trousers.
    const uniforms=[
      new THREE.MeshStandardMaterial({color:0xffffff,map:camo(['#3186bd','#206998','#5bacdc','#246d9c','#5aa6d2'],305),roughness:.94}),
      new THREE.MeshStandardMaterial({color:0xffffff,map:camo(['#c2443c','#9b342f','#e47666','#a53e34','#d86759'],607),roughness:.94})
    ];
    const trousers=new THREE.MeshStandardMaterial({color:0xffffff,map:camo(['#81887b','#536158','#9a9888','#505c54','#777969'],919),roughness:.98});
    const sphere=(parent,p,sz,mat)=>{
      const m=new THREE.Mesh(sphereG,mat);m.position.set(...p);m.scale.set(...sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    };
    const cube=(parent,p,sz,mat)=>{
      const m=new THREE.Mesh(boxG,mat);m.position.set(...p);m.scale.set(...sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    };
    function link(parent,a,b,r,mat){
      const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dif=to.clone().sub(from);
      const mesh=new THREE.Mesh(cylinderG,mat);
      mesh.position.copy(from).add(to).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dif.clone().normalize());
      mesh.scale.set(r,dif.length(),r);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    function build(){
      const root=new THREE.Group(),torso=new THREE.Group();root.visible=false;root.add(torso);scene.add(root);
      const shirtPieces=[];
      const garment=(parent,p,sz,isShirt=false)=>{
        const o=sphere(parent,p,sz,isShirt?uniforms[1]:trousers);
        if(isShirt)shirtPieces.push(o);
        return o;
      };
      // Tapered neck, jacket, waist and recognizable human face.
      garment(torso,[0,1.30,0],[.282,.342,.177],true);
      garment(torso,[0,1.03,0],[.211,.177,.144],true);
      sphere(torso,[0,.94,0],[.238,.139,.150],gear);
      sphere(torso,[0,1.552,0],[.073,.095,.077],skin);
      sphere(torso,[0,1.724,.016],[.144,.173,.134],skin);
      sphere(torso,[0,1.649,.139],[.104,.066,.024],helmet);
      for(const side of [-1,1]){
        sphere(torso,[side*.064,1.743,.145],[.056,.037,.023],glass);
        sphere(torso,[side*.15,1.727,.015],[.031,.054,.048],dark);
      }
      cube(torso,[0,1.741,.156],[.133,.017,.029],gear);
      // Fabric cap, hard ear cups, brim, short microphone.
      sphere(torso,[0,1.853,-.008],[.163,.105,.162],helmet);
      cube(torso,[0,1.809,.171],[.315,.018,.170],helmet);
      for(const side of [-1,1])cube(torso,[side*.177,1.738,.01],[.057,.139,.091],dark);
      link(torso,[.176,1.729,.01],[.129,1.614,.124],.011,steel);
      sphere(torso,[.128,1.616,.129],[.023,.018,.020],dark);
      // Layered tactical carrier and MOLLE pouches.
      sphere(torso,[0,1.319,.174],[.258,.296,.083],gear);
      sphere(torso,[0,1.310,-.173],[.236,.272,.084],gear);
      for(const side of [-1,1]){
        cube(torso,[side*.191,1.476,.109],[.062,.192,.064],plates);
        cube(torso,[side*.241,1.295,.130],[.080,.323,.095],plates);
        cube(torso,[side*.235,1.040,.052],[.081,.139,.123],gear);
      }
      for(const y of [1.40,1.32,1.245])for(const x of [-.15,-.05,.05,.15])cube(torso,[x,y,.253],[.069,.018,.018],plates);
      for(const x of [-.155,0,.155]){
        cube(torso,[x,1.169,.275],[.112,.182,.101],plates);
        cube(torso,[x,1.225,.33],[.093,.028,.018],gear);
      }
      cube(torso,[-.303,1.264,.035],[.093,.236,.135],dark);
      cube(torso,[.295,1.230,.028],[.082,.169,.121],gear);
      cube(torso,[0,.968,.149],[.434,.075,.075],gear);
      cube(torso,[0,.968,.194],[.113,.070,.038],plates);
      const patch=cube(torso,[.246,1.386,.211],[.079,.040,.024],enemy);
      // Jointed legs have moving hips and knees, shaped cloth and knee protection.
      const legs=[];
      for(const side of [-1,1]){
        const hip=new THREE.Group();hip.position.set(side*.145,.924,0);root.add(hip);
        garment(hip,[0,-.204,.014],[.127,.227,.124]);
        const knee=new THREE.Group();knee.position.set(0,-.396,.016);hip.add(knee);
        sphere(knee,[0,0,.025],[.114,.093,.125],plates);
        garment(knee,[0,-.179,-.008],[.102,.204,.113]);
        sphere(knee,[0,-.342,.02],[.115,.10,.129],boots);
        const foot=sphere(knee,[0,-.419,.095],[.132,.068,.207],boots);
        cube(knee,[0,-.420,.227],[.210,.028,.028],gear);
        legs.push({hip,knee,foot});
      }
      // Anatomically separate shoulders, elbows, hands and forearms.
      const arms=[];
      for(const side of [-1,1]){
        const shoulder=new THREE.Group();shoulder.position.set(side*.305,1.496,0);torso.add(shoulder);
        garment(shoulder,[side*.020,-.026,0],[.124,.117,.116],true);
        shirtPieces.push(link(shoulder,[0,-.06,.004],[side*.076,-.298,.138],.093,uniforms[1]));
        sphere(shoulder,[side*.078,-.302,.140],[.090,.088,.084],plates);
        const elbow=new THREE.Group();elbow.position.set(side*.078,-.30,.144);shoulder.add(elbow);
        shirtPieces.push(link(elbow,[0,0,0],[-side*.138,-.078,.209],.076,uniforms[1]));
        sphere(elbow,[-side*.137,-.074,.211],[.081,.077,.075],boots);
        arms.push({shoulder,elbow});
      }
      // Recognizable tactical rifle: stock, receiver, rails, curved magazine and barrel.
      const gun=new THREE.Group();gun.position.set(.022,1.238,.273);gun.rotation.set(0,-.14,-.08);torso.add(gun);
      cube(gun,[0,0,.139],[.21,.145,.413],steel);
      cube(gun,[0,.015,.468],[.147,.125,.430],gear);
      const barrel=cube(gun,[0,.014,.828],[.048,.048,.465],steel);
      cube(gun,[0,.014,1.077],[.07,.068,.127],dark);
      cube(gun,[0,-.063,-.183],[.200,.173,.326],wood);
      cube(gun,[0,-.233,.066],[.133,.326,.157],steel);
      cube(gun,[.01,-.253,.091],[.101,.268,.130],plates);
      cube(gun,[0,.113,.143],[.102,.044,.412],dark);
      cube(gun,[0,.162,.14],[.151,.071,.171],steel);
      cube(gun,[0,.174,.18],[.093,.049,.080],glass);
      cube(gun,[0,-.050,.568],[.205,.093,.266],wood);
      cube(gun,[0,-.10,-.333],[.254,.241,.096],dark);
      for(const side of [-1,1])sphere(torso,[side*.206,1.086,.437],[.082,.071,.089],boots);
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.36,20),new THREE.MeshBasicMaterial({color:0x151714,transparent:true,opacity:.15,depthWrite:false}));
      shadow.position.y=.012;shadow.rotation.x=-Math.PI/2;root.add(shadow);
      // Distance-aware accessory details: keep silhouettes but suppress tiny parts far away.
      const smallDetails=[];
      root.traverse(m=>{
        if(!m.isMesh)return;
        const maxDim=Math.max(m.scale.x,m.scale.y,m.scale.z);
        if(maxDim<.17&&m!==patch){smallDetails.push(m);m.castShadow=false;}
      });
      return {root,torso,shirtPieces,legs,arms,patch,smallDetails,material:null};
    }
    const units=Array.from({length:10},build);
    let currentCount=0;
    return {
      update(bots,viewpoint){
        currentCount=Math.min(units.length,bots.length);
        for(let i=0;i<units.length;i++){
          const u=units[i],b=bots[i];u.root.visible=!!b;if(!b)continue;
          // Feet will be placed against world floor after the walking pose is evaluated.
          u.root.position.set(b.x,0,b.z);
          u.root.rotation.y=-b.yaw;
          const far=viewpoint&&((b.x-viewpoint.x)**2+(b.z-viewpoint.z)**2)>19*19;
          for(const item of u.smallDetails)item.visible=!far;
          const shirt=b.team===0?uniforms[0]:uniforms[1];
          if(u.material!==shirt){
            u.shirtPieces.forEach(m=>m.material=shirt);
            u.patch.material=b.team===0?allied:enemy;
            u.material=shirt;
          }
          const gait=Math.sin(b.walk+b.phase),wave=Math.cos(b.walk+b.phase);
          for(let k=0;k<2;k++){
            const sign=k===0?1:-1;
            u.legs[k].hip.rotation.x=sign*gait*.40;
            u.legs[k].knee.rotation.x=Math.max(0,-sign*gait)*.40;
            u.arms[k].shoulder.rotation.x=sign*gait*.045;
            u.arms[k].elbow.rotation.x=.02+Math.max(0,-sign*gait)*.02;
          }
          u.torso.rotation.z=gait*.014;
          u.torso.rotation.x=.014+Math.abs(wave)*.015;
          // Height-correct each animated boot against its real walkable floor.
          u.root.updateMatrixWorld(true);
          let requiredLift=-Infinity;
          for(const leg of u.legs){
            const m=leg.foot.matrixWorld.elements;
            const footBottom=m[13]-Math.hypot(m[1],m[5],m[9]);
            const footX=m[12],footZ=m[14];
            requiredLift=Math.max(requiredLift,floorSurfaceAt(footX,footZ)+.027-footBottom);
          }
          // The temple sits at 0.6m: a 0.32m clamped correction sank legs into stone.
          u.root.position.y=Math.max(-.03,Math.min(1.55,requiredLift));
        }
      },
      get count(){return currentCount;}
    };
  }
  let humanoidSystem=null;
  try{humanoidSystem=createOperatorSystem();}
  catch(err){console.warn('STRIKEZONE: humanoid model failed, using existing soldier graphics.',err);humanoidSystem=null;}

  // Pooled tracer meshes avoid creating GPU buffers for each hit.
  const tracerPool=[];
  const tracerGeom=new THREE.CylinderGeometry(.010,.016,1,5);
  const tracerFriendly=new THREE.MeshBasicMaterial({color:0xffecb2});
  const tracerEnemy=new THREE.MeshBasicMaterial({color:0xff7563});
  const upAxis=new THREE.Vector3(0,1,0);
  for(let i=0;i<14;i++){
    const m=new THREE.Mesh(tracerGeom,tracerFriendly);m.visible=false;m.frustumCulled=false;scene.add(m);tracerPool.push(m);
  }

  // Six detailed first-person PBR guns. If their module fails to load, the original
  // lightweight gun meshes remain available as the fallback.
  let realisticWeapons=null;
  try{
    const module=await import('./weapon-rig.js?v=3.11');
    realisticWeapons=module.createWeaponRig(THREE,gunScene);
    if(realisticWeapons.weaponCount!==6)throw new Error('Incomplete weapon set');
  }catch(error){
    console.warn('STRIKEZONE: detailed weapon assets unavailable; using safe original gun meshes.',error);
    realisticWeapons?.dispose?.();
    realisticWeapons=null;
  }
  let quality=bridge.quality||'high',sizeW=0,sizeH=0,shadowSize=0,activeActors=[],activeGun=[];
  let lastActors=-1,lastGun=-1,started=false;
  const cleanup=(meshes)=>{for(const m of meshes){m.parent?.remove(m);m.geometry.dispose();}};
  function setQuality(profile){quality=profile;
    const settings=profile==='performance'?{dpr:.95,shadow:0,shadowSize:512,exposure:1.40}:
      profile==='ultra'?{dpr:2,shadow:1,shadowSize:2048,exposure:1.52}:{dpr:1.5,shadow:1,shadowSize:1024,exposure:1.46};
    const dpr=settings.dpr; // ULTRA supersamples on 1x displays for visibly higher detail.
    renderer.setPixelRatio(dpr);renderer.toneMappingExposure=settings.exposure;
    renderer.shadowMap.enabled=!!settings.shadow;
    if(shadowSize!==settings.shadowSize){sun.shadow.mapSize.set(settings.shadowSize,settings.shadowSize);
      sun.shadow.map?.dispose();sun.shadow.map=null;shadowSize=settings.shadowSize;}
    sizeW=0;sizeH=0;
    updateStatus(`ENHANCED 3D · ${profile.toUpperCase()} · ${dpr.toFixed(2)}x RESOLUTION · SHADOWS ${settings.shadow?'ON':'OFF'} (${settings.shadowSize}px)`);
    updateTag(`ENHANCED WEBGL2 · ${profile.toUpperCase()} QUALITY`);
  }
  setQuality(quality);
  window.addEventListener('strike-zone-graphics',e=>setQuality(e.detail?.profile||'high'));
  let previous=performance.now();
  const camTarget=new THREE.Vector3();
  function loop(stamp){
    if(!renderer.domElement.isConnected){window.__strike3DActive=false;return;}
    try {
      const dt=Math.min(.06,(stamp-previous)/1000);previous=stamp;
      const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
      if(sizeW!==w||sizeH!==h){sizeW=w;sizeH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();gunCam.aspect=w/h;gunCam.updateProjectionMatrix();}
      const s=bridge.state();
      let x=s.x,y=s.y+(s.crouch?.98:1.72)-s.landBob,z=s.z;
      if(!s.running){const t=s.nowSec*.12;x=Math.cos(t)*17;z=Math.sin(t)*21;y=7.2;camera.position.set(x,y,z);camTarget.set(0,2.3,0);camera.lookAt(camTarget);}
      else {camera.position.set(x,y,z);camTarget.set(x+Math.sin(s.yaw)*Math.cos(s.pitch),y+Math.sin(s.pitch),z+Math.cos(s.yaw)*Math.cos(s.pitch));camera.lookAt(camTarget);}
      const aimFov=s.scopeFov??(s.ads&&s.running?53:78);if(camera.fov!==aimFov){camera.fov=aimFov;camera.updateProjectionMatrix();}
      dome.position.copy(camera.position);skyMat.uniforms.t.value=s.nowSec;
      dust.position.y=Math.sin(s.nowSec*.35)*.13;
      const elapsed=stamp*.001;
      // New anatomical soldier rigs replace the cube-based enemies only on WebGL2.
      if(elapsed-lastActors>.046){cleanup(activeActors);activeActors=humanoidSystem?[]:grouped(bridge.actorGeometry(),{dynamic:true});for(const m of activeActors)actorGroup.add(m);lastActors=elapsed;
        const b=bridge.botData();for(let i=0;i<botHelmets.length;i++){const g=botHelmets[i],bot=b[i];g.visible=!humanoidSystem&&!!bot;if(!humanoidSystem&&bot){g.position.set(bot.x,Math.sin(bot.walk)*.012,bot.z);g.rotation.y=-bot.yaw;teamPatches[i].material=bot.team===0?armorBlue:armorRed;}}}
      if(humanoidSystem)humanoidSystem.update(bridge.botData(),camera.position);
      if(!realisticWeapons&&elapsed-lastGun>.035){cleanup(activeGun);activeGun=grouped(bridge.weaponGeometry(),{weapon:true,dynamic:true});for(const m of activeGun)gunGroup.add(m);lastGun=elapsed;}
      for(let i=0;i<tracerPool.length;i++){
        const o=tracerPool[i],t=bridge.tracerData()[i];
        o.visible=!!t;if(!t)continue;
        const delta=new THREE.Vector3(t.X-t.x,t.Y-t.y,t.Z-t.z);
        const length=delta.length();if(length<.002){o.visible=false;continue;}
        o.position.set((t.x+t.X)*.5,(t.y+t.Y)*.5,(t.z+t.Z)*.5);
        o.scale.y=length;o.material=t.friendly?tracerFriendly:tracerEnemy;
        o.quaternion.setFromUnitVectors(upAxis,delta.normalize());
      }
      const playerVisible=s.running&&s.alive;const scoped=!!(s.precisionScoped??s.sniperScoped);
      gunAccents.visible=!realisticWeapons&&playerVisible&&!scoped&&s.weapon<4;
      gunAccents.position.y=s.recoil*.09;
      muzzleGlow.intensity=playerVisible&&!scoped&&s.flash>.01?Math.min(8,s.flash*16):0;
      gunGroup.visible=playerVisible&&!realisticWeapons&&!scoped;
      if(realisticWeapons)realisticWeapons.update(s);
      renderer.autoClear=false;renderer.clear(true,true,true);renderer.render(scene,camera);
      if(playerVisible&&!scoped){renderer.clearDepth();renderer.render(gunScene,gunCam);}
      if(!started){window.__strike3DActive=true;started=true;updateStatus(`ENHANCED 3D · ${quality.toUpperCase()} · SHADOWS / PBR ON`);}
      requestAnimationFrame(loop);
    }catch(error){window.__strike3DActive=false;console.warn('STRIKEZONE: GPU renderer runtime exception; reverting to classic rendering.',error);
      renderer.domElement.remove();renderer.dispose();updateStatus('CLASSIC WEBGL · GRAPHICS FALLBACK');updateTag('CLASSIC WEBGL · SAFE MODE');}
  }
  requestAnimationFrame(loop);
}