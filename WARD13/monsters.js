// WARD 13 v0.3 — procedural anatomical horror hunters (no external model downloads).
// Physical Nurse and crawling Patient stay in the world; spectral apparitions are short-lived.
export function createMonsterBody(THREE,type){
  const isNurse=type==="nurse", g=new THREE.Group();
  const material=(c,extras={})=>new THREE.MeshStandardMaterial({color:c,roughness:.97,metalness:0,side:THREE.DoubleSide,...extras});
  const bone=material(0x9f9990), sickSkin=material(isNurse?0x9c9d93:0x7b7c70), shadow=material(0x171619), wound=material(0x5a161a), cloth=material(0xaaa69a), darkCloth=material(0x45443f);
  function egg(x,y,z,a,b,c,m){const o=new THREE.Mesh(new THREE.SphereGeometry(1,14,11),m);o.position.set(x,y,z);o.scale.set(a,b,c);g.add(o);return o}
  function limb(A,B,r,m,base=r){const a=new THREE.Vector3(...A),b=new THREE.Vector3(...B),d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,base,d.length(),9),m);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(o);return o}
  function rag(xOffset=0,zOffset=0,top=1.42,bottom=.38,width=.42,color=0xada99c){
    const v=[],indices=[],pieces=14,upper=[],lower=[];for(let j=0;j<=pieces;j++){const a=j/pieces*Math.PI*2,wa=width*(.89+Math.sin(a*3)*.1),len=bottom+(Math.sin(a*7.1+1)*.085+Math.sin(a*11.5)*.05);
      upper.push([xOffset+Math.cos(a)*wa*.64,top,zOffset+Math.sin(a)*wa*.40]);
      lower.push([xOffset+Math.cos(a)*wa,len,zOffset+Math.sin(a)*wa*.86]);}
    for(let j=0;j<=pieces;j++){v.push(...upper[j],...lower[j]);if(j<pieces){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}}
    const geom=new THREE.BufferGeometry();geom.setAttribute("position",new THREE.Float32BufferAttribute(v,3));geom.setIndex(indices);geom.computeVertexNormals();const o=new THREE.Mesh(geom,material(color));g.add(o);return o
  }
  function faceCanvas(){
    const c=document.createElement("canvas");c.width=384;c.height=512;const x=c.getContext("2d");x.clearRect(0,0,384,512);
    const light=x.createRadialGradient(165,160,20,190,230,200);light.addColorStop(0,"#cbc8ba");light.addColorStop(.45,"#a6a79b");light.addColorStop(.74,"#6b6d68");light.addColorStop(1,"#202023");
    x.fillStyle=light;x.beginPath();x.moveTo(92,89);x.bezierCurveTo(48,195,72,329,178,420);x.bezierCurveTo(240,470,335,295,303,133);x.bezierCurveTo(258,20,120,25,92,89);x.fill();
    // Jagged sunken sockets and narrow points of light.
    for(const [ex,ey,skew] of [[135,198,-.12],[248,190,.16]]){
      const shade=x.createRadialGradient(ex,ey,2,ex,ey,73);shade.addColorStop(0,"#09090d");shade.addColorStop(.6,"#171316");shade.addColorStop(1,"#686761");
      x.fillStyle=shade;x.save();x.translate(ex,ey);x.rotate(skew);x.beginPath();x.ellipse(0,0,49,67,0,0,Math.PI*2);x.fill();x.restore();
      x.fillStyle="#b31f20";x.beginPath();x.ellipse(ex,ey+12,5,8,0,0,7);x.fill()
    }
    x.strokeStyle="rgba(62,28,30,.75)";x.lineWidth=4;for(let i=0;i<19;i++){const xx=88+(i*43)%215,yy=90+(i*97)%270;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx-14+(i%6)*5,yy+12+(i%4)*7);x.stroke()}
    x.fillStyle="#242022";x.beginPath();x.moveTo(193,220);x.lineTo(174,294);x.quadraticCurveTo(185,305,214,292);x.closePath();x.fill();
    const darkmouth=x.createLinearGradient(170,320,213,409);darkmouth.addColorStop(0,"#46191b");darkmouth.addColorStop(1,"#08090b");
    x.fillStyle=darkmouth;x.beginPath();x.ellipse(194,357,48,61,0,0,7);x.fill();
    x.fillStyle="#c6b4a2";for(let i=0;i<7;i++){const xx=153+i*13;x.save();x.translate(xx,326+(i%3)*3);x.rotate((i-3)*.08);x.fillRect(-4,0,8,13+(i%2)*5);x.restore()}
    x.fillStyle="#2f1e20";for(let i=0;i<6;i++){x.beginPath();x.moveTo(135+i*29,69);x.bezierCurveTo(103+i*27,128,108+i*22,191,78+i*45,275+(i%2)*70);x.lineWidth=15+i%3*4;x.strokeStyle="#17181b";x.stroke()}
    // Dirty torn forehead and skin shadows.
    x.strokeStyle="#4a2624";x.lineWidth=9;x.beginPath();x.moveTo(93,110);x.lineTo(129,152);x.lineTo(122,188);x.stroke();x.strokeStyle="#5e2022";x.lineWidth=3;x.beginPath();x.moveTo(252,252);x.bezierCurveTo(236,326,269,329,243,411);x.stroke();
    return new THREE.CanvasTexture(c)
  }
  const faceTex=faceCanvas();
  if(isNurse){
    // Torso tapers into overlapping dirty fabric folds; no featureless cone.
    egg(0,1.48,.02,.34,.55,.225,cloth);
    rag(-.11,.02,1.47,.43,.34,0xa8a49c);
    rag(.12,-.01,1.49,.3,.32,0x9b968d);
    egg(0,2.02,0,.245,.326,.205,sickSkin);
    egg(0,1.81,.05,.11,.22,.11,sickSkin);
    for(const sign of [-1,1]){
      const x=sign;
      egg(x*.33,1.68,.02,.145,.17,.16,cloth);
      limb([x*.35,1.68,.02],[x*.46,1.2,-.16],.105,cloth);
      egg(x*.46,1.21,-.16,.1,.11,.1,sickSkin);
      limb([x*.46,1.2,-.16],[x*.50,.71,-.26],.075,sickSkin,.096);
      egg(x*.51,.65,-.28,.11,.17,.078,sickSkin);
      for(let j=0;j<4;j++)limb([x*(.46+j*.034),.62,-.29],[x*(.45+j*.065),.37-(j%2)*.05,-.40],.016,bone,.023);
      limb([x*.18,.58,.02],[x*.19,.16,.05],.10,darkCloth);
      egg(x*.19,.08,-.09,.14,.08,.27,shadow)
    }
    // Neck tendons and lank dark hair.
    for(let j=0;j<17;j++){
      const angle=(j/16)*Math.PI*2,xx=Math.cos(angle)*.195,zz=Math.sin(angle)*.17;
      limb([xx,2.26,zz],[xx+Math.sin(j*13)*.08,1.52+(j%6)*.07,zz+.04],.014+(j%3)*.007,shadow,.03)
    }
    const c=new THREE.Mesh(new THREE.BoxGeometry(.48,.08,.34),cloth);c.position.set(0,2.29,-.02);g.add(c);
    const hat=new THREE.Mesh(new THREE.BoxGeometry(.12,.014,.02),wound);hat.position.set(0,2.339,-.206);g.add(hat);
    for(let j=0;j<36;j++){
      const u=Math.sin(j*52.31),v=Math.sin(j*97.11),sp=new THREE.Mesh(new THREE.SphereGeometry(.012+(j%5)*.013,5,4),wound);
      sp.position.set(u*.26,.53+(j%16)*.066,-.285-v*.045);sp.scale.set(1,.6,.4);g.add(sp)
    }
  }else{
    // Abnormally elongated crawling torso, exposed joints, dragged legs.
    const torso=egg(0,.72,.15,.34,.28,.78,darkCloth);torso.rotation.x=.15;
    for(const sign of [-1,1]){
      limb([sign*.29,.76,-.25],[sign*.52,.42,-.65],.11,sickSkin,.15);
      limb([sign*.52,.42,-.65],[sign*.69,.09,-1.40],.066,sickSkin,.092);
      for(let i=0;i<4;i++)limb([sign*(.61+i*.035),.10,-1.39],[sign*(.60+i*.047),.05,-1.56-(i%3)*.09],.019,bone,.025);
      limb([sign*.25,.66,.65],[sign*.45,.23,1.02],.15,sickSkin);
      limb([sign*.45,.23,1.02],[sign*.52,.12,1.28],.096,sickSkin)
    }
    egg(0,.82,-.64,.29,.29,.29,sickSkin);
    for(let j=0;j<10;j++)limb([Math.sin(j*4)*.20,.94, -.65],[Math.sin(j*4)*.22,.52+(j%3)*.07,-1.01],.018,shadow,.025)
  }
  // Face is textured with sunken eye sockets, exposed teeth, hair and wounds.
  const face=new THREE.Mesh(new THREE.PlaneGeometry(isNurse?.50:.58,isNurse?.70:.64),new THREE.MeshStandardMaterial({map:faceTex,transparent:true,roughness:1,side:THREE.DoubleSide,alphaTest:.1,depthWrite:false}));
  face.position.set(0,isNurse?2.02:.81,isNurse?-.225:-.91);g.add(face);
  // Vertical breathing shiver; mesh remains readable from front and behind.
  g.userData.motion={head:face,faceTex,sway:0};
  return g;
}
