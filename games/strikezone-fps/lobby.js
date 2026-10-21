/* STRIKEZONE v3.42 — Original tactical hangar lobby (no purchased assets). */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const menu=$('mainMenu');
if(!menu||menu.classList.contains('szLobby'))return;
const header=menu.querySelector('.menuHeader');
const content=menu.querySelector('.menuContent');
const training=menu.querySelector('.trainingOptions');
const footer=menu.querySelector('.menuFooter');
const controls=content.querySelector('.menuActions');
const modes=content.querySelector('.modeSelect');
const armory=content.querySelector('.armoryChooser');
const buttons={};
for(const id of ['deploy','onlineBtn','howTo','menuFullscreen','menuSound']){
 buttons[id]=$(id);if(!buttons[id])return;
}
menu.classList.add('szLobby');
// Keep the legacy training control OUT of the lobby stacking context.
// The same live controls are moved into the popup on demand.
const trainingHome=document.createElement('div');
trainingHome.id='szTrainingControlStorage';
trainingHome.hidden=true;
trainingHome.style.display='none';
menu.append(trainingHome);
trainingHome.append(training);
header.insertAdjacentHTML('afterbegin',
 '<button id="szProfile" class="szProfile" type="button" aria-label="Open player account">'+
 '<span class="szProfileFace">◈</span><span><b id="szLobbyName">GUEST OPERATIVE</b>'+
 '<small id="szLobbyRank">TACTICAL OPERATIVE</small></span></button>');
header.insertAdjacentHTML('beforeend',
 '<div class="szTopStatus"><span>✦ <b id="szLobbyXP">0</b> XP</span><span>◎ <b id="szLobbyKills">0</b> KILLS</span>'+
 '<button type="button" id="szTopFriends" aria-label="Friends">♟ FRIENDS</button>'+
 '<button type="button" id="szTopSettings" aria-label="Settings">⚙</button></div>');
const markup=`
<div id="szLobbyBody" class="szLobbyBody">
  <aside class="szLobbyNews">
    <section class="szNewsFeature"><span class="szLabel">LATEST UPDATE</span>
      <h3>TACTICAL<br><em>EVOLUTION</em></h3>
      <p>Enhanced squad AI · New operator lobby · Online friends</p>
      <button type="button" class="szDetailLink" data-lobby-tab="news">VIEW UPDATE →</button>
    </section>
    <section class="szNewsTile"><span class="szLabel">FIELD TRAINING</span>
      <h3>DAILY OPERATIONS</h3>
      <p>Practice aiming, movement and squad tactics against AI.</p>
      <button type="button" class="szDetailLink" data-lobby-tab="missions">VIEW TRAINING RECORD →</button>
    </section>
    <section class="szNewsTile squad"><span class="szLabel">SQUAD OPERATIONS</span>
      <h3>FRIENDS & INVITES</h3>
      <p>Create a private room and invite your registered friends.</p>
      <button type="button" class="szDetailLink" data-lobby-tab="friends">OPEN FRIENDS →</button>
    </section>
  </aside>
  <section class="szLobbyStage" aria-label="Selected soldier 3D preview">
    <div class="szHangarLights" aria-hidden="true"></div>
    <div class="szPreviewTop"><span class="szLabel">OPERATOR PREVIEW</span>
      <span class="szTeamBadge"><i></i> BLUE TEAM</span></div>
    <div class="szPreviewFloor" aria-hidden="true"></div>
    <canvas id="szOperatorCanvas" aria-label="Animated 3D preview of selected playable operator"></canvas>
    <div id="szPreviewFallback" class="szPreviewFallback" aria-live="polite">
      <span class="szFallbackHelmet">⬡</span>
      <span>INITIALIZING 3D OPERATOR</span>
    </div>
    <div class="szStageCaption"><span id="szStageRole">VANGUARD</span>
      <span id="szStageWeapon">VORTEX AR · ASSAULT RIFLE</span>
      <small>DRAG TO ROTATE THE SOLDIER</small></div>
  </section>
  <aside class="szLobbyGear">
    <span class="szLabel">CURRENT LOADOUT</span>
    <h2 id="szGearRole">VANGUARD</h2>
    <p id="szGearDescription">Balanced frontline assault operator.</p>
    <div class="szStatRow"><label>FIREPOWER</label><div><i id="szStatDamage"></i></div></div>
    <div class="szStatRow"><label>FIRE RATE</label><div><i id="szStatRate"></i></div></div>
    <div class="szStatRow"><label>RANGE</label><div><i id="szStatRange"></i></div></div>
    <div class="szSelectedWeapon"><span class="szLabel">EQUIPPED WEAPON</span>
      <b id="szGearWeapon">VORTEX AR</b><small id="szGearType">ASSAULT RIFLE</small></div>
    <div id="szGearArmory"></div>
    <div class="szPowerLabel">◈ SHIELD POWER <small>3s DEFENSE · 60s COOLDOWN</small></div>
  </aside>
  <aside class="szLobbyPlay">
    <div class="szMapCard"><span class="szLabel">MAP 001</span>
      <h3>TRI-SECTOR<br>LABYRINTH</h3><p>TACTICAL URBAN COMBAT</p></div>
    <div id="szPlayActions"></div>
    <span class="szPlayNote">OFFLINE TRAINING OR PRIVATE ONLINE MATCHES</span>
  </aside>
</div>
<section class="szRosterStrip" aria-label="Operator appearance choices">
 <header><span>CHARACTER LINEUP</span><small>SELECT TO EQUIP · YOUR CHOICE CHANGES THE MATCH LOADOUT</small></header>
 <div id="szRosterItems" class="szRosterItems"></div>
</section>
<nav id="szLobbyTabs" class="szLobbyTabs" aria-label="Main lobby navigation">
 <button type="button" data-lobby-tab="equipment">◈ <span>EQUIPMENT</span></button>
 <button type="button" data-lobby-tab="missions">✦ <span>MISSIONS</span></button>
 <button type="button" data-lobby-tab="friends">♙ <span>FRIENDS</span></button>
 <button type="button" data-lobby-tab="rankings">▥ <span>LEADERBOARD</span></button>
 <button type="button" data-lobby-tab="news">▤ <span>NEWS</span></button>
</nav>
<div id="szLobbyDrawer" class="szLobbyDrawer" hidden role="dialog" aria-modal="true" aria-labelledby="szDrawerTitle">
 <div class="szDrawerCard"><header><h2 id="szDrawerTitle">EQUIPMENT</h2>
 <button type="button" id="szDrawerClose" aria-label="Close panel">✕</button></header>
 <div id="szDrawerContent"></div></div>
</div>`;
footer.insertAdjacentHTML('beforebegin',markup);
$('szGearArmory').append(armory);
$('szPlayActions').append(buttons.deploy,buttons.onlineBtn);
buttons.deploy.innerHTML='⚔ <span>QUICK BATTLE</span>';
buttons.onlineBtn.innerHTML='◎ <span>ONLINE ROOM</span>';
const custom=document.createElement('button');
custom.id='szCustomMatch';custom.type='button';custom.className='szGoldBtn';
custom.innerHTML='♟ <span>CUSTOM MATCH</span>';
buttons.deploy.after(custom);
const fieldTraining=document.createElement('button');
fieldTraining.type='button';
fieldTraining.id='szFieldTraining';
fieldTraining.className='szFieldTrainingBtn';
fieldTraining.textContent='⚙ FIELD TRAINING / SETTINGS';
$('szPlayActions').append(fieldTraining);
const drawer=$('szLobbyDrawer'),drawerContent=$('szDrawerContent'),title=$('szDrawerTitle');
const gearMeta=[
 {role:'VANGUARD',type:'ASSAULT OPERATOR',description:'Versatile armored fighter for mid-range engagements.',weapon:0},
 {role:'RAPTOR',type:'SMG OPERATOR',description:'Light tactical kit built for close quarters.',weapon:1},
 {role:'RANGER',type:'MARKSMAN',description:'Focused precision combat at longer distances.',weapon:2},
 {role:'AEGIS',type:'SHIELD UNIT',description:'Armored breacher with a directional ballistic shield.',weapon:7},
 {role:'NOVA',type:'ENERGY OPERATOR',description:'Experimental energy cannon and shockwave support.',weapon:6},
 {role:'BLADE',type:'MELEE UNIT',description:'Fast close-combat operator with an energy blade.',weapon:8}
];
const weaponNames=['VORTEX AR','RAPTOR SMG','RANGER DMR','JUDGE 12','SPECTRE P9','PHANTOM SR','NOVA PULSE','AEGIS S8','LIGHTSABER'];
const weaponTypes=['ASSAULT RIFLE','SUBMACHINE GUN','MARKSMAN RIFLE','COMBAT SHOTGUN','SIDEARM','SNIPER RIFLE','ENERGY CANNON','BALLISTIC SHIELD','ENERGY BLADE'];
const roleForWeapon=id=>id===1?gearMeta[1]:id===2||id===5?gearMeta[2]:
 id===7?gearMeta[3]:id===6?gearMeta[4]:id===8?gearMeta[5]:
 gearMeta[0];
const lineup=$('szRosterItems');
for(const [index,role] of gearMeta.entries()){
 const item=document.createElement('button');item.type='button';
 item.className='szRosterCard';item.dataset.weapon=role.weapon;
 item.innerHTML='<span class="szRosterGlyph">'+['♜','⌁','⌖','⬡','◈','✧'][index]+'</span>'+
  '<strong>'+role.role+'</strong><small>'+role.type+'</small>';
 item.addEventListener('click',()=>selectWeapon(role.weapon));lineup.append(item);
}
function selectWeapon(id){
 const select=$('loadoutSelect');
 if(!select||id<0||id>=select.options.length)return;
 select.value=String(id);select.dispatchEvent(new Event('change',{bubbles:true}));
}
function updateSelection(){
 const select=$('loadoutSelect');
 const weapon=Math.max(0,Math.min(8,Number(select.value)||0));
 const role=roleForWeapon(weapon),w=weaponNames[weapon];
 $('szStageRole').textContent=role.role;
 $('szGearRole').textContent=role.role;
 $('szStageWeapon').textContent=w+' · '+weaponTypes[weapon];
 $('szGearWeapon').textContent=w;
 $('szGearType').textContent=weaponTypes[weapon];
 $('szGearDescription').textContent=role.description;
 const stats=[
  [76,72,64],[60,96,41],[85,38,82],[100,19,20],[65,60,43],
  [100,11,100],[78,18,71],[28,22,12],[95,30,7]
 ][weapon];
 for(const [id,val] of [['szStatDamage',stats[0]],['szStatRate',stats[1]],['szStatRange',stats[2]]]){
  $(id).style.width=val+'%';
 }
 for(const b of lineup.children)b.classList.toggle('selected',Number(b.dataset.weapon)===weapon);
 window.dispatchEvent(new CustomEvent('strike-zone-lobby-loadout',{detail:{weapon,role:role.role}}));
}
$('loadoutSelect').addEventListener('change',updateSelection);
function closeDrawer(){
 drawer.hidden=true;
 // Put old controls back into a permanently hidden home when popup closes.
 // They stay in the DOM and retain their event listeners and saved values.
 if(training.parentElement!==trainingHome)trainingHome.append(training);
 for(const id of ['howTo','menuFullscreen','menuSound']){
  if(buttons[id].parentElement!==controls)controls.append(buttons[id]);
 }
 if(modes.parentElement!==content)content.insertBefore(modes,armory);
 drawerContent.replaceChildren();
 menu.classList.remove('drawerOpen');
}
function openDrawer(label,nodes){
 closeDrawer();title.textContent=label;
 for(const node of nodes)drawerContent.append(node);
 drawer.hidden=false;menu.classList.add('drawerOpen');
}
function makeParagraph(t){const p=document.createElement('p');p.textContent=t;return p;}
function openSettings(){
 const wrap=document.createElement('div');wrap.className='szSettingsWrap';
 wrap.append(training,buttons.howTo,buttons.menuFullscreen,buttons.menuSound);
 openDrawer('FIELD TRAINING / SETTINGS',[wrap]);
}
function openMatch(){
 const wrap=document.createElement('div');wrap.className='szMatchDrawer';
 wrap.append(makeParagraph('Choose your match mode, then press START CUSTOM MATCH.'),modes);
 const start=document.createElement('button');start.type='button';start.className='szDrawerAction';
 start.textContent='▶ START CUSTOM MATCH';
 start.addEventListener('click',()=>{closeDrawer();buttons.deploy.click();});
 wrap.append(start);openDrawer('CUSTOM MATCH',[wrap]);
}
function openTab(tab){
 if(tab==='friends'){window.SZSocial?.openFriends?.();return;}
 if(tab==='equipment'){
  const description=makeParagraph('Select your operator below or change to any of the nine starting weapons.');
  const panel=document.createElement('div');panel.className='szEquipmentDrawer';
  const cards=document.createElement('div');cards.className='szEquipChoices';
  for(const role of gearMeta){
   const b=document.createElement('button');b.type='button';b.textContent=role.role+' · '+weaponNames[role.weapon];
   b.addEventListener('click',()=>{selectWeapon(role.weapon);closeDrawer();});
   cards.append(b);
  }
  panel.append(description,cards);openDrawer('EQUIPMENT',[panel]);
 }else if(tab==='missions'){
  const panel=document.createElement('div');
  panel.append(makeParagraph('FIELD TRAINING RECORD — progress is saved locally on this device.'));
  const copy=$('szTrainingSummary');if(copy){const stat=copy.cloneNode(true);stat.hidden=false;panel.append(stat);}
  else panel.append(makeParagraph('Win matches and eliminate bots to earn training XP.'));
  openDrawer('MISSIONS / TRAINING',[panel]);
 }else if(tab==='rankings'){
  const panel=document.createElement('div');
  panel.append(makeParagraph('Your local player statistics. Global online rankings have not launched.'));
  const stats=document.createElement('p');
  stats.textContent='MATCHES: '+($('careerMatches')?.textContent||'0')+
   '    KILLS: '+($('careerKills')?.textContent||'0')+
   '    XP: '+($('careerXp')?.textContent||'0');
  panel.append(stats);openDrawer('PLAYER LEADERBOARD',[panel]);
 }else if(tab==='news'){
  openDrawer('STRIKEZONE NEWS',[
   makeParagraph('v3.42 — Redesigned tactical lobby with operator preview and selectable loadouts.'),
   makeParagraph('v3.41 — Improved AI sound awareness, squad coordination, flanking and tactical weapons.'),
   makeParagraph('Online multiplayer, friends and team selection remain available.')
  ]);
 }
}
$('szTopSettings').addEventListener('click',openSettings);
fieldTraining.addEventListener('click',openSettings);
$('szTopFriends').addEventListener('click',()=>openTab('friends'));
$('szProfile').addEventListener('click',()=>window.SZSocial?.openAccount?.('login'));
custom.addEventListener('click',openMatch);
$('szDrawerClose').addEventListener('click',closeDrawer);
drawer.addEventListener('click',e=>{if(e.target===drawer)closeDrawer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden){e.stopImmediatePropagation();closeDrawer();}});
for(const button of menu.querySelectorAll('[data-lobby-tab]')){
 button.addEventListener('click',()=>openTab(button.dataset.lobbyTab));
}
const summary=document.createElement('div');summary.id='szTrainingSummary';summary.className='szTrainingSummary';
summary.hidden=true;menu.append(summary);
summary.textContent='BATTLE RECORD · Matches, Kills and XP';
function refreshProfile(){
 if(menu.classList.contains('hidden'))return;
 const account=window.SZSocial?.current?.();
 $('szLobbyName').textContent=account?.name||'GUEST OPERATIVE';
 $('szLobbyRank').textContent=account?.kind==='registered'?'REGISTERED OPERATIVE':'GUEST OPERATIVE';
 $('szLobbyXP').textContent=$('careerXp')?.textContent||'0';
 $('szLobbyKills').textContent=$('careerKills')?.textContent||'0';
 summary.textContent='MATCHES: '+($('careerMatches')?.textContent||'0')+
  ' · KILLS: '+($('careerKills')?.textContent||'0')+
  ' · XP: '+($('careerXp')?.textContent||'0');
}
function syncLobbyTeam(){
 const red=$('onlineTeamRed')?.classList.contains('selected');
 const team=red?1:0;
 const badge=menu.querySelector('.szTeamBadge');
 if(badge){
  badge.classList.toggle('red',!!team);
  badge.lastChild.textContent=team?' RED TEAM':' BLUE TEAM';
 }
 window.dispatchEvent(new CustomEvent('strike-zone-lobby-team',{detail:{team}}));
}
for(const id of ['onlineTeamRed','onlineTeamBlue']){
 $(id)?.addEventListener('click',syncLobbyTeam);
}
window.addEventListener('focus',refreshProfile);
setInterval(refreshProfile,2500);
refreshProfile();updateSelection();syncLobbyTeam();
window.StrikeZoneLobby={updateSelection,selectWeapon,openTab};
})();
