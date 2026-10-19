/* STRIKEZONE FPS v3.21 | corrected raised floor footing and blue/red shirts tactical soldier overhaul with optional enhanced WebGL2 renderer
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
  sun.position.set(-86,130,-52);sun.target.position.set(0,0,0);sun.castShadow=true;
  sun.shadow.camera.left=-126;sun.shadow.camera.right=126;sun.shadow.camera.top=126;sun.shadow.camera.bottom=-126;
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
    const stone=[0,1,2,23,26,28,32,36,39].includes(id),wood=[4,7,14].includes(id),metal=[3,8,9,20,21,25,31,33,37,38].includes(id);
    const glass=[10,25,35,40].includes(id),light=[15,18,19,24,34].includes(id);
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
      if(id===25||id===35){const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,'#345e74');g.addColorStop(.48,'#6ca2ba');g.addColorStop(1,'#1f374f');c.fillStyle=g;c.globalAlpha=.78;c.fillRect(0,0,256,256);c.globalAlpha=1;}
    }else if(id===0){
      for(let j=0;j<900;j++){c.fillStyle=rng()>.5?'rgba(81,54,23,.1)':'rgba(255,255,225,.1)';c.fillRect(rng()*256,rng()*256,2+rng()*5,2+rng()*5);}
    }

    // Grime, serial plates, rolling shutter seams and weather staining create
    // a more believable urban material scale than uniformly colored cubes.
    if([31,37,38].includes(id)){
      for(let y=0;y<256;y+=11){
        c.fillStyle='rgba(0,0,0,.19)';c.fillRect(0,y,256,1.4);
        c.fillStyle='rgba(255,255,255,.045)';c.fillRect(0,y+2,256,1);
      }
      for(let j=0;j<23;j++){
        const x=rng()*256,y=rng()*256;
        c.fillStyle=id===38?'rgba(115,39,20,.20)':'rgba(16,24,28,.16)';
        c.fillRect(x,y,3+rng()*21,2+rng()*7);
      }
    }
    if(id===32||id===36){
      for(let j=0;j<180;j++){
        const x=rng()*256,y=rng()*256;
        c.fillStyle='rgba(24,22,20,.08)';c.fillRect(x,y,1+rng()*13,1+rng()*5);
      }
      for(const lineY of [34,92,152,213]){
        c.strokeStyle='rgba(20,33,33,.21)';c.lineWidth=1.5;
        c.beginPath();c.moveTo(0,lineY);c.lineTo(256,lineY+4*rng());c.stroke();
      }
    }
    if(id===39){
      for(let x=0;x<256;x+=38)for(let y=0;y<256;y+=38){
        c.strokeStyle='rgba(43,54,62,.22)';c.lineWidth=2;
        c.strokeRect(x,y,38,38);
      }
    }
    if(id===34){
      c.fillStyle='rgba(17,26,26,.42)';
      for(let x=-256;x<450;x+=48){
        c.save();c.translate(x,0);c.rotate(-.30);c.fillRect(0,-40,13,410);c.restore();
      }
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
    {label:'BLUE BASE',sub:'NORTH DEPLOYMENT',color:'#39bef2',pos:[0,3.55,-80.9],yaw:0},
    {label:'RED BASE',sub:'SOUTH DEPLOYMENT',color:'#f3744f',pos:[0,3.55,80.9],yaw:Math.PI},
    {label:'NORTH CHECKPOINT',sub:'SECURE CORRIDOR · BLUE APPROACH',color:'#c9bd9e',pos:[0,4.6,-52.66],yaw:Math.PI},
    {label:'ARMORY & STORES',sub:'INDOOR COMBAT · UNIT 09',color:'#c7ad80',pos:[0,4.6,-29.65],yaw:Math.PI},
    {label:'TACTICAL COMMAND',sub:'CONTROL ROOM · UNIT 10',color:'#d7b95e',pos:[0,4.5,-7.65],yaw:Math.PI},
    {label:'MAINTENANCE',sub:'SERVICE WORKSHOP · UNIT 11',color:'#a9bea4',pos:[0,4.6,14.35],yaw:Math.PI},
    {label:'SOUTH CHECKPOINT',sub:'SECURE CORRIDOR · RED APPROACH',color:'#c9bd9e',pos:[0,4.6,37.34],yaw:Math.PI},
  ];
  // Distinct readable signs on the eight buildings (the same signs on both
  // north- and south-facing entrances so players can orient while flanking).
  const buildingNames=[
    ['FREIGHT DEPOT','UNIT 01 · CARGO', '#e3a654'],
    ['COMMS CENTER','UNIT 02 · SIGNALS', '#56b7d8'],
    ['VEHICLE GARAGE','UNIT 03 · MOTORPOOL','#deae59'],
    ['FIELD CLINIC','UNIT 04 · MEDICAL','#50d7c4'],
    ['OPS OFFICES','UNIT 05 · SECURITY','#6da2d2'],
    ['NIGHT MARKET','UNIT 06 · STOREFRONT','#e6a25f'],
    ['BARRACKS','UNIT 07 · LIVING QUARTERS','#91ad79'],
    ['POWER STATION','UNIT 08 · GENERATORS','#e3bd65']
  ];
  let buildingId=0;
  for(const z of [-35,-12,12,35])for(const x of [-24,24]){
    const [label,sub,color]=buildingNames[buildingId++];
    signs.push({label,sub,color,pos:[x,4.52,z-8.99],yaw:Math.PI});
    signs.push({label,sub,color,pos:[x,4.52,z+8.99],yaw:0});
  }
  for(const sign of signs){
    const tex=signTex(sign.label,sign.sub,sign.color);const m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,fog:false});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.9,.98),m);
    mesh.position.set(...sign.pos);mesh.rotation.y=sign.yaw;scene.add(mesh);
  }
  // Architectural cues for the five additional enterable interiors.
  // Rounded ductwork, fluorescent strips and true panes add environmental detail.
  const roofMetal=new THREE.MeshStandardMaterial({color:0x53636a,roughness:.51,metalness:.52});
  const fluorescent=new THREE.MeshBasicMaterial({color:0xd7e9d7});
  const glazing=new THREE.MeshPhysicalMaterial({color:0x96c0bf,transparent:true,
      opacity:.15,metalness:.16,roughness:.19,depthWrite:false,side:THREE.DoubleSide});
  const sectorZ=[-45,-22,0,22,45];
  const sectorLight=new THREE.BoxGeometry(2.3,.11,.33);
  const ductGeo=new THREE.CylinderGeometry(.15,.15,5.1,10);
  const windowGeo=new THREE.PlaneGeometry(1.83,1.47);
  sectorZ.forEach((z,i)=>{
    for(const x of [-7.3,0,7.3]){
      const fixture=new THREE.Mesh(sectorLight,fluorescent);
      fixture.position.set(x,5.20+(i%2)*.65,z+1.25);
      scene.add(fixture);
      const housing=new THREE.Mesh(new THREE.BoxGeometry(2.52,.17,.49),roofMetal);
      housing.position.set(x,5.31+(i%2)*.65,z+1.25);scene.add(housing);
    }
    for(const side of [-1,1]){
      const pipe=new THREE.Mesh(ductGeo,roofMetal);
      pipe.rotation.x=Math.PI/2;
      pipe.position.set(side*9.75,5.33+(i%2)*.65,z);scene.add(pipe);
      for(const windowZ of [z-3.6,z+3.7]){
        const glassPane=new THREE.Mesh(windowGeo,glazing);
        glassPane.rotation.y=Math.PI/2;
        glassPane.position.set(side*11.53,1.89,windowZ);
        scene.add(glassPane);
      }
      const sideSign=signTex(i%2?'RESTRICTED':'TACTICAL ACCESS',
        i%2?'AUTHORIZED PERSONNEL':'SECURE SECTION',i%2?'#e1b97b':'#aed3cb');
      const plaque=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.63),
        new THREE.MeshBasicMaterial({map:sideSign,side:THREE.DoubleSide,fog:false}));
      plaque.position.set(side*11.86,3.90,z);
      plaque.rotation.y=Math.PI/2;scene.add(plaque);
    }
  });
  // Genuine openings: the panes are translucent rather than opaque wall boxes.
  // Physically, gameplay collisions come only from the sills, so bullets can
  // pass through windows in both renderer profiles.
  const paneMaterial=new THREE.MeshPhysicalMaterial({color:0x83b6c9,transparent:true,
    opacity:.16,metalness:.25,roughness:.17,depthWrite:false,side:THREE.DoubleSide});
  const paneGeoH=new THREE.PlaneGeometry(1.70,1.45),paneGeoV=new THREE.PlaneGeometry(1.57,1.45);
  let blockIndex=0;
  for(const z of [-35,-12,12,35])for(const x of [-24,24]){
    const odd=blockIndex%2===1;
    for(const [side,windowX] of [[-1,x+(odd?-4.3:4.5)],[1,x+(odd?4.4:-4.3)]]){
      const p=new THREE.Mesh(paneGeoH,paneMaterial);
      p.position.set(windowX,1.9,z+side*8.79);scene.add(p);
    }
    for(const [side,windowZ] of [[-1,z+(odd?-4.5:4.5)],[1,z+(odd?4.5:-4.5)]]){
      const p=new THREE.Mesh(paneGeoV,paneMaterial);
      p.rotation.y=Math.PI/2;p.position.set(x+side*8.75,1.9,windowZ);scene.add(p);
    }
    blockIndex++;
  }
  // Curved ducts, ventilation fans and power hardware break up box silhouettes
  // in the enhanced GPU renderer. All are decorative above walking height.
  const ductMetal=new THREE.MeshStandardMaterial({color:0x56666d,metalness:.72,roughness:.42});
  const darkIron=new THREE.MeshStandardMaterial({color:0x26353f,metalness:.56,roughness:.48});
  const rotorMat=new THREE.MeshStandardMaterial({color:0x9ca6a5,metalness:.56,roughness:.47});
  let roofIndex=0;
  for(const z of [-35,-12,12,35])for(const x of [-24,24]){
    const h=[5.6,5.3,5.8,5.4,5.45,5.15,5.4,5.9][roofIndex],
          sign=roofIndex%2?-1:1;
    const fan=new THREE.Mesh(new THREE.CylinderGeometry(.77,.77,.22,24),darkIron);
    fan.position.set(x+sign*5.65,h+1.13,z-3.5);scene.add(fan);
    const grate=new THREE.Mesh(new THREE.TorusGeometry(.58,.045,8,28),rotorMat);
    grate.position.set(x+sign*5.65,h+1.28,z-3.5);grate.rotation.x=-Math.PI/2;scene.add(grate);
    for(let j=0;j<4;j++){
      const blade=new THREE.Mesh(new THREE.BoxGeometry(.95,.06,.15),rotorMat);
      blade.position.set(x+sign*5.65,h+1.28,z-3.5);
      blade.rotation.y=j*Math.PI/4;scene.add(blade);
    }
    const tubing=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,3.7,10),ductMetal);
    tubing.position.set(x-sign*5.7,h+1.96,z+3.8);scene.add(tubing);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.46,.25,.14,16),darkIron);
    cap.position.set(x-sign*5.7,h+3.84,z+3.8);scene.add(cap);
    roofIndex++;
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
      // Short-lived firearm muzzle flash highlights automatic and burst fire.
      // It is a visual-only effect: shot timing/damage remain owned by the game.
      const gunFlash=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),
        new THREE.MeshBasicMaterial({color:0xffd585,transparent:true,opacity:.86,depthWrite:false}));
      gunFlash.position.set(0,1.255,1.66);torso.add(gunFlash);
      gunFlash.visible=false;
      // Bot-equipment silhouettes adapt to the current AI weapon.
      const pistol=new THREE.Group();pistol.position.set(.08,1.21,.30);torso.add(pistol);
      cube(pistol,[0,0,.20],[.16,.13,.36],steel);
      cube(pistol,[0,.11,.19],[.17,.035,.37],dark);
      cube(pistol,[0,-.17,.08],[.12,.30,.14],gear);
      cube(pistol,[0,.02,.44],[.05,.04,.18],steel);
      pistol.visible=false;
      const energyCannon=new THREE.Group();energyCannon.position.set(.018,1.22,.30);torso.add(energyCannon);
      cube(energyCannon,[0,0,.34],[.31,.26,.75],steel);
      cube(energyCannon,[0,0,.82],[.22,.21,.52],gear);
      const energyTrim=new THREE.MeshBasicMaterial({color:0x4cdbef});
      for(const side of [-1,1]){
        cube(energyCannon,[side*.20,.03,.82],[.08,.27,.77],steel);
        cube(energyCannon,[side*.22,.10,.80],[.045,.12,.55],energyTrim);
      }
      cube(energyCannon,[0,.02,1.23],[.23,.23,.27],glass);
      cube(energyCannon,[0,-.20,.26],[.14,.24,.16],gear);
      energyCannon.visible=false;
      const saber=new THREE.Group();saber.position.set(.25,1.12,.42);torso.add(saber);
      const saberLight=new THREE.MeshBasicMaterial({color:0x64faff});
      cube(saber,[0,0,.18],[.12,.12,.47],steel);
      cube(saber,[0,0,.45],[.17,.16,.09],dark);
      cube(saber,[0,0,1.02],[.088,.095,1.16],saberLight);
      saber.visible=false;
      for(const side of [-1,1])sphere(torso,[side*.206,1.086,.437],[.082,.071,.089],boots);
      // Police-style AEGIS raised shield for AI bots, colored viewplate and reinforced frame.
      const shield=new THREE.Group();shield.position.set(0,1.14,.53);torso.add(shield);
      const shieldArmor=new THREE.MeshStandardMaterial({color:0x2b3b44,metalness:.45,roughness:.5});
      const shieldGlass=new THREE.MeshPhysicalMaterial({color:0x70b9cc,metalness:.12,roughness:.22,transparent:true,opacity:.39,depthWrite:false,side:THREE.DoubleSide});
      cube(shield,[0,-.16,.04],[.76,.75,.09],shieldArmor);
      cube(shield,[0,.36,.04],[.76,.18,.1],shieldArmor);
      cube(shield,[-.36,.06,.02],[.07,1.1,.11],steel);
      cube(shield,[.36,.06,.02],[.07,1.1,.11],steel);
      cube(shield,[0,.155,.08],[.64,.31,.022],shieldGlass);
      cube(shield,[0,-.55,.04],[.76,.07,.13],steel);
      shield.visible=false;
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.36,20),new THREE.MeshBasicMaterial({color:0x151714,transparent:true,opacity:.15,depthWrite:false}));
      shadow.position.y=.012;shadow.rotation.x=-Math.PI/2;root.add(shadow);
      // Distance-aware accessory details: keep silhouettes but suppress tiny parts far away.
      const smallDetails=[];
      root.traverse(m=>{
        if(!m.isMesh)return;
        const maxDim=Math.max(m.scale.x,m.scale.y,m.scale.z);
        if(maxDim<.17&&m!==patch){smallDetails.push(m);m.castShadow=false;}
      });
      return {root,torso,shirtPieces,legs,arms,patch,smallDetails,material:null,shield,shieldArmor,shieldGlass,gun,pistol,energyCannon,saber,shadow,gunFlash};
    }
    const units=Array.from({length:10},build);
    let currentCount=0;
    return {
      update(bots,viewpoint,nowSec){
        currentCount=Math.min(units.length,bots.length);
        for(let i=0;i<units.length;i++){
          const u=units[i],b=bots[i];u.root.visible=!!b;if(!b)continue;
          // Feet will be placed against world floor after the walking pose is evaluated.
          u.root.position.set(b.x,0,b.z);
          // Models face local +Z; gameplay forward is (+sin(yaw), +cos(yaw)).
          // Inverting yaw made the visible shield face the opposite lateral direction.
          u.root.rotation.y=b.yaw;
          u.shield.visible=b.weapon===7&&b.shieldHP>0;
          if(b.shieldMax&&b.shieldHP>0){
            const ratio=Math.max(0,Math.min(1,b.shieldHP/b.shieldMax));
            const tint=ratio>.66?0x2b3b44:ratio>.33?0x685b40:0x9a4935;
            const glassTint=ratio>.33?0x70b9cc:0xd68d68;
            u.shieldArmor.color.setHex(tint);
            u.shieldGlass.color.setHex(glassTint);
            u.shieldGlass.opacity=ratio>.33?.39:.23;
          }
          u.pistol.visible=b.weapon===4;
          u.energyCannon.visible=b.weapon===6;
          u.saber.visible=b.weapon===8;
          if(u.saber.visible)u.saber.rotation.y=Math.sin(nowSec*9)*.15;
          u.gun.visible=![4,6,7,8].includes(b.weapon);
          u.gunFlash.visible=!b.downed&&![6,7,8].includes(b.weapon)&&
             Number.isFinite(b.lastFiredAt)&&nowSec-b.lastFiredAt>=0&&nowSec-b.lastFiredAt<.115;
          u.gunFlash.position.z=b.weapon===4?.78:b.weapon===5?2.05:b.weapon===2?1.89:
            b.weapon===1?1.40:1.65;
          const gunScale=b.weapon===1?[.92,.95,.73]:b.weapon===2?[1,1,1.28]:
            b.weapon===3?[1.16,1.12,.9]:b.weapon===5?[1,1,1.55]:[1,1,1];
          u.gun.scale.set(...gunScale);
          const far=viewpoint&&((b.x-viewpoint.x)**2+(b.z-viewpoint.z)**2)>19*19;
          for(const item of u.smallDetails)item.visible=!far;
          const shirt=b.team===0?uniforms[0]:uniforms[1];
          if(u.material!==shirt){
            u.shirtPieces.forEach(m=>m.material=shirt);
            u.patch.material=b.team===0?allied:enemy;
            u.material=shirt;
          }
          // Death animation: all body parts, armor and held weapon topple together.
          // No walking, targeting or combat occurs because dead bots are display-only.
          if(b.downed){
            const fall=Math.min(1,Math.max(0,b.fall||0)),side=b.fallSide||1;
            u.root.rotation.x=side*1.43*fall;
            u.root.rotation.z=side*.10*fall;
            u.root.position.y=floorSurfaceAt(b.x,b.z)+.025+.11*fall;
            u.shadow.visible=false;
            u.torso.rotation.set(0,0,0);
            for(const leg of u.legs){leg.hip.rotation.x=.10*fall;leg.knee.rotation.x=.22*fall;}
            for(const arm of u.arms){arm.shoulder.rotation.x=.20*fall;arm.elbow.rotation.x=.30*fall;}
            continue;
          }
          // Re-enable an upright skeleton when this pooled mesh is reused on respawn.
          u.root.rotation.x=0;u.root.rotation.z=0;u.shadow.visible=true;
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
          u.root.position.y=Math.max(-.03,Math.min(1.55,requiredLift))+(b.airHeight||0);
        }
      },
      get count(){return currentCount;}
    };
  }
  let humanoidSystem=null;
  try{humanoidSystem=createOperatorSystem();}
  catch(err){console.warn('STRIKEZONE: humanoid model failed, using existing soldier graphics.',err);humanoidSystem=null;}


  // v3.26 — Procedural boss and two classes of zombies, rendered with the
  // same perspective and world lighting as the tactical soldiers.
  const flesh=new THREE.MeshStandardMaterial({color:0x768b6b,roughness:.95});
  const sprintFlesh=new THREE.MeshStandardMaterial({color:0xb2944d,roughness:.94});
  const undeadCloth=new THREE.MeshStandardMaterial({color:0x414d44,roughness:.94});
  const monsterArmor=new THREE.MeshStandardMaterial({color:0x392b4b,roughness:.76,metalness:.24});
  const monsterBone=new THREE.MeshStandardMaterial({color:0xddd6c0,roughness:.88});
  const monsterGlow=new THREE.MeshBasicMaterial({color:0xff4569});
  const monsterEye=new THREE.MeshBasicMaterial({color:0xff3b35});
  const unitBox=new THREE.BoxGeometry(1,1,1);
  const unitSphere=new THREE.SphereGeometry(1,10,8);
  const unitHorn=new THREE.ConeGeometry(1,1,7);
  function buildMonsterUnit(big=false){
    const root=new THREE.Group();scene.add(root);
    const body=new THREE.Group();root.add(body);
    const add=(geo,mat,x,y,z,sx,sy,sz,parent=body)=>{
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
      mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    };
    const arms=[],legs=[];
    if(big){
      add(unitBox,monsterArmor,0,2.30,0,2.18,2.35,1.52);
      add(unitSphere,monsterArmor,0,3.83,.08,1.01,.83,.88);
      add(unitBox,monsterBone,0,2.32,.86,1.28,.48,.19);
      for(const sign of [-1,1]){
        add(unitBox,monsterArmor,sign*1.34,2.91,0,.92,.72,.95);
        const arm=new THREE.Group();arm.position.set(sign*1.45,2.66,0);body.add(arm);
        add(unitBox,monsterArmor,sign*.10,-.69,.22,.70,1.63,.75,arm);
        add(unitBox,monsterBone,sign*.14,-1.46,.32,.80,.48,.75,arm);
        arms.push(arm);
        const leg=new THREE.Group();leg.position.set(sign*.66,1.35,0);body.add(leg);
        add(unitBox,monsterArmor,0,-.60,.05,.80,1.28,.86,leg);legs.push(leg);
        const horn=add(unitHorn,monsterBone,sign*.62,4.79,.02,.34,.98,.37);
        horn.rotation.z=-sign*.25;
        add(unitSphere,monsterGlow,sign*.39,3.92,.79,.17,.14,.1);
      }
      add(unitSphere,monsterGlow,0,2.3,1.00,.40,.22,.19);
    }else{
      add(unitBox,undeadCloth,0,1.15,0,.65,.84,.43);
      add(unitSphere,flesh,0,1.76,.07,.26,.32,.26);
      add(unitBox,monsterEye,-.11,1.80,.305,.095,.07,.05);
      add(unitBox,monsterEye,.11,1.80,.305,.095,.07,.05);
      for(const sign of [-1,1]){
        const arm=new THREE.Group();arm.position.set(sign*.40,1.45,.02);body.add(arm);
        add(unitBox,flesh,sign*.08,-.43,.21,.18,.90,.18,arm);
        arms.push(arm);
        const leg=new THREE.Group();leg.position.set(sign*.16,.73,0);body.add(leg);
        add(unitBox,undeadCloth,0,-.35,.025,.23,.82,.24,leg);legs.push(leg);
      }
    }
    root.visible=false;
    return {root,body,arms,legs,big};
  }
  const bossVisual=buildMonsterUnit(true);
  const zombieVisuals=Array.from({length:26},()=>buildMonsterUnit(false));
  const bossRing=new THREE.Mesh(
    new THREE.RingGeometry(5.1,6.8,48),
    new THREE.MeshBasicMaterial({color:0xff5d8d,transparent:true,opacity:.20,
      depthWrite:false,side:THREE.DoubleSide}));
  bossRing.rotation.x=-Math.PI/2;bossRing.visible=false;scene.add(bossRing);
  function updateMonsterVisuals(){
    const items=bridge.monsterData?.()||[];
    bossVisual.root.visible=false;
    for(const u of zombieVisuals)u.root.visible=false;
    let count=0;let activeBoss=null;
    for(const m of items){
      const u=m.boss?bossVisual:zombieVisuals[count++];
      if(!u)continue;
      u.root.visible=true;u.root.position.set(m.x,floorSurfaceAt(m.x,m.z),m.z);
      u.root.rotation.y=m.yaw;
      if(m.boss){activeBoss=m;u.body.rotation.y=Math.sin(m.phase*1.6)*.04;}
      else{
        const agile=!!m.agile;
        const skin=agile?sprintFlesh:flesh;
        for(const arm of u.arms)for(const part of arm.children)part.material=skin;
        u.root.scale.setScalar(agile?.88:1);
        u.body.rotation.x=agile?.30:.12;
      }
      for(let k=0;k<u.arms.length;k++){
        u.arms[k].rotation.x=m.boss?-.30+Math.sin(m.phase*3+k)*.25:
          -.85+Math.sin(m.phase*1.4+k*Math.PI)*.42;
        u.legs[k].rotation.x=Math.sin(m.phase*1.7+k*Math.PI)*(m.boss?.12:.22);
      }
    }
    const attack=bridge.monsterAttack?.();
    bossRing.visible=!!(activeBoss&&attack&&attack.until>attack.now);
    if(bossRing.visible){
      bossRing.position.set(activeBoss.x,.06,activeBoss.z);
      bossRing.material.opacity=.10+.22*(attack.until-attack.now)/.52;
    }
  }

  // v3.12 pooled glowing energy orbs and expanding radial shockwave rings.
  const energyCoreMat=new THREE.MeshBasicMaterial({color:0x8cffff});
  const energyHaloMat=new THREE.MeshBasicMaterial({color:0x28bedd,transparent:true,opacity:.24,depthWrite:false});
  const energyWaveMat=new THREE.MeshBasicMaterial({color:0x80ecff,transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide});
  const energyCoreGeom=new THREE.SphereGeometry(.29,14,12);
  const energyHaloGeom=new THREE.SphereGeometry(.50,12,9);
  const energyRingGeom=new THREE.TorusGeometry(1,.065,8,52);
  const energyOrbs=[];
  for(let i=0;i<6;i++){
    const group=new THREE.Group(),core=new THREE.Mesh(energyCoreGeom,energyCoreMat);
    const halo=new THREE.Mesh(energyHaloGeom,energyHaloMat);
    group.add(halo,core);group.visible=false;scene.add(group);energyOrbs.push(group);
  }
  const energyRings=[];
  for(let i=0;i<8;i++){
    const ring=new THREE.Mesh(energyRingGeom,energyWaveMat);ring.rotation.x=-Math.PI/2;
    ring.visible=false;scene.add(ring);energyRings.push(ring);
  }
  const energyLight=new THREE.PointLight(0x5edaff,0,7,2);scene.add(energyLight);
  function renderEnergyFX(){
    const fx=bridge.energyFX?.()||{shots:[],waves:[]};
    for(let i=0;i<energyOrbs.length;i++){
      const p=fx.shots[i],group=energyOrbs[i];group.visible=!!p;
      if(p){group.position.set(p.x,p.y,p.z);group.scale.setScalar(1+.12*Math.sin(performance.now()*.016+i));}
    }
    for(let i=0;i<energyRings.length;i++){
      const p=fx.waves[i],ring=energyRings[i];ring.visible=!!p;
      if(p){ring.position.set(p.x,p.y,p.z);ring.scale.setScalar(Math.max(.05,p.radius*Math.min(1,p.age/p.ttl)));}
    }
    const orb=fx.shots[0],wave=fx.waves[0];
    if(orb){energyLight.position.set(orb.x,orb.y,orb.z);energyLight.intensity=3.5;}
    else if(wave){energyLight.position.set(wave.x,wave.y,wave.z);energyLight.intensity=2*Math.max(0,1-wave.age/wave.ttl);}
    else energyLight.intensity=0;
  }

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
    const module=await import('./weapon-rig.js?v=3.26');
    realisticWeapons=module.createWeaponRig(THREE,gunScene);
    if(realisticWeapons.weaponCount!==9)throw new Error('Incomplete weapon set');
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
        const b=bridge.botData();for(let i=0;i<botHelmets.length;i++){const g=botHelmets[i],bot=b[i];g.visible=!humanoidSystem&&!!bot;if(!humanoidSystem&&bot){
          const fall=bot.downed?Math.max(0,Math.min(1,bot.fall||0)):0;
          g.position.set(bot.x,floorSurfaceAt(bot.x,bot.z)+.12*fall+(bot.downed?0:(bot.airHeight||0)),bot.z);
          g.rotation.set((bot.fallSide||1)*1.43*fall,bot.yaw,0);
          teamPatches[i].material=bot.team===0?armorBlue:armorRed;
        }}}
      if(humanoidSystem)humanoidSystem.update(bridge.botData(),camera.position,s.nowSec);
      updateMonsterVisuals();renderEnergyFX();
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