/* STRIKEZONE FPS v2.0 | optional enhanced WebGL2 renderer
 * Keeps the solo gameplay, AI, collisions and software fallback in index.html.
 * Three.js ESM is loaded over HTTPS only when browser WebGL2 is usable.
 */
const bridge = window.StrikeZoneRenderBridge;
const status = document.getElementById('rendererState');
const tag = document.getElementById('gfxTag');
const updateStatus=(s)=>{if(status)status.textContent=s;};
const updateTag=(s)=>{if(tag)tag.textContent=s;};

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
      metalness:metal?.53:glass?.18:.02,side:THREE.DoubleSide,emissive:light?new THREE.Color(neutral[id]||0xffffff):new THREE.Color(0x000000),
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

  let quality=bridge.quality||'high',sizeW=0,sizeH=0,shadowSize=0,activeActors=[],activeGun=[];
  let lastActors=-1,lastGun=-1,started=false;
  const cleanup=(meshes)=>{for(const m of meshes){m.parent?.remove(m);m.geometry.dispose();}};
  function setQuality(profile){quality=profile;
    const settings=profile==='performance'?{dpr:.95,shadow:0,shadowSize:512,exposure:1.40}:
      profile==='ultra'?{dpr:2,shadow:1,shadowSize:2048,exposure:1.52}:{dpr:1.5,shadow:1,shadowSize:1024,exposure:1.46};
    const dpr=Math.min(settings.dpr,devicePixelRatio||1);
    renderer.setPixelRatio(dpr);renderer.toneMappingExposure=settings.exposure;
    renderer.shadowMap.enabled=!!settings.shadow;
    if(shadowSize!==settings.shadowSize){sun.shadow.mapSize.set(settings.shadowSize,settings.shadowSize);
      sun.shadow.map?.dispose();sun.shadow.map=null;shadowSize=settings.shadowSize;}
    sizeW=0;sizeH=0;
    updateStatus(`ENHANCED 3D · ${profile.toUpperCase()} · PBR MATERIALS · SHADOWS ${settings.shadow?'ON':'OFF'}`);
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
      const aimFov=s.ads&&s.running?53:78;if(camera.fov!==aimFov){camera.fov=aimFov;camera.updateProjectionMatrix();}
      dome.position.copy(camera.position);skyMat.uniforms.t.value=s.nowSec;
      dust.position.y=Math.sin(s.nowSec*.35)*.13;
      const elapsed=stamp*.001;
      if(elapsed-lastActors>.046){cleanup(activeActors);activeActors=grouped(bridge.actorGeometry(),{dynamic:true});for(const m of activeActors)actorGroup.add(m);lastActors=elapsed;
        const b=bridge.botData();for(let i=0;i<botHelmets.length;i++){const g=botHelmets[i],bot=b[i];g.visible=!!bot;if(bot){g.position.set(bot.x,0,bot.z);g.rotation.y=-bot.yaw;}}}
      if(elapsed-lastGun>.035){cleanup(activeGun);activeGun=grouped(bridge.weaponGeometry(),{weapon:true,dynamic:true});for(const m of activeGun)gunGroup.add(m);lastGun=elapsed;}
      const playerVisible=s.running&&s.alive;
      gunGroup.visible=playerVisible;
      renderer.autoClear=false;renderer.clear(true,true,true);renderer.render(scene,camera);
      if(playerVisible){renderer.clearDepth();renderer.render(gunScene,gunCam);}
      if(!started){window.__strike3DActive=true;started=true;updateStatus(`ENHANCED 3D · ${quality.toUpperCase()} · SHADOWS / PBR ON`);}
      requestAnimationFrame(loop);
    }catch(error){window.__strike3DActive=false;console.warn('STRIKEZONE: GPU renderer runtime exception; reverting to classic rendering.',error);
      renderer.domElement.remove();renderer.dispose();updateStatus('CLASSIC WEBGL · GRAPHICS FALLBACK');updateTag('CLASSIC WEBGL · SAFE MODE');}
  }
  requestAnimationFrame(loop);
}