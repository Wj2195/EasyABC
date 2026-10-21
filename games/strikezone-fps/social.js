/* STRIKEZONE v3.36: Supabase accounts, friend requests and private room invites. */
(function(){
'use strict';
const SB_URL='https://rygtjnzccemtpkjellgs.supabase.co';
const SB_KEY='sb_publishable_WQibr98hDPjOIVqA0twL1g_OVUxgynh';
const NAME=/^[a-z][a-z0-9_]{2,19}$/;
const $=id=>document.getElementById(id);
let db=null,sdkLoading=null,identity=null,handlers={},initialized=false;
let friends=[],pending=[],invites=[],knownInvites=new Set();
let lastError='',sessionReady=false;
const GUEST_STORAGE_KEY='strikezone-guest-session';
function makeGuest(){
 let n=null;try{n=sessionStorage.getItem(GUEST_STORAGE_KEY)}catch(_){}
 if(!/^GUEST-[A-Z2-9]{5}$/.test(n||'')){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b=new Uint8Array(5);crypto.getRandomValues(b);
  n='GUEST-'+Array.from(b,v=>chars[v%chars.length]).join('');
  try{sessionStorage.setItem(GUEST_STORAGE_KEY,n)}catch(_){}
 }
 return {kind:'guest',name:n,id:null};
}
function current(){return identity||makeGuest();}
function notify(message){
 const box=$('szSocialToast');if(!box)return;
 box.textContent=String(message);box.classList.add('visible');
 clearTimeout(notify.timer);notify.timer=setTimeout(()=>box.classList.remove('visible'),4400);
}
function status(msg,error=false){
 const el=$('szAccountStatus');if(el){
  el.textContent=msg||'';el.classList.toggle('error',error);
 }
}
function socialButton(label,click,kind){
 const b=document.createElement('button');b.type='button';
 b.className='szButton'+(kind?' '+kind:'');b.textContent=label;
 b.addEventListener('click',click);return b;
}
function switchView(tab){
 for(const b of document.querySelectorAll('.szTab')){
  b.classList.toggle('selected',b.dataset.tab===tab);
 }
 for(const v of document.querySelectorAll('.szView')){
  v.hidden=v.dataset.view!==tab;
 }
 status('');
}
function openAccount(tab='login'){switchView(tab);$('szAccountOverlay').hidden=false;}
function closeAccount(){$('szAccountOverlay').hidden=true;}
function openFriends(){
 if(current().kind!=='registered'){
  openAccount('register');status('Register or sign in to use the Friends list.',true);return;
 }
 $('szFriendsOverlay').hidden=false;refresh().catch(report);
}
function closeFriends(){$('szFriendsOverlay').hidden=true;}
function showAccountState(){
 const account=$('szAccountMenu'),friendButton=$('szFriendsMenu'),invite=$('szInviteFriends');
 if(account)account.textContent='◉ '+current().name;
 if(friendButton)friendButton.disabled=current().kind!=='registered';
 if(invite)invite.hidden=current().kind!=='registered';
 const badge=$('szFriendBadge');
 const count=pending.length+invites.length;
 if(badge){badge.hidden=!count;badge.textContent=count?String(count):'';}
 if(handlers.onIdentity)handlers.onIdentity(current());
}
function setIdentity(value){identity=value;showAccountState();}
function report(err){
 const msg=String(err?.message||err||'Unknown error');
 const help=/PGRST202|sz_profiles|42P01|42883|schema cache|sz_username_available/i.test(msg)?
 ' Apply supabase_social_setup.sql in the Supabase SQL Editor first.':'';
 status(msg+help,true);notify((msg+help).slice(0,150));
}
function setBusy(id,flag){const e=$(id);if(e)e.disabled=flag;}
async function connect(){
 if(db)return db;
 if(sdkLoading)return sdkLoading;
 sdkLoading=new Promise((resolve,reject)=>{
  const finish=()=>{
   if(!window.supabase?.createClient){
    reject(new Error('Supabase client did not load.'));return;
   }
   db=window.supabase.createClient(SB_URL,SB_KEY,{
    auth:{storageKey:'sz-auth-v1',persistSession:true,autoRefreshToken:true,
     detectSessionInUrl:false}
   });
   resolve(db);
  };
  if(window.supabase?.createClient){finish();return;}
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload=finish;
  script.onerror=()=>reject(new Error('Cannot load the login service. Check internet connection.'));
  document.head.append(script);
 }).catch(e=>{sdkLoading=null;throw e});
 return sdkLoading;
}
async function authenticatedIdentity(){
 const api=await connect();
 const {data:{session},error}=await api.auth.getSession();
 if(error)throw error;
 if(!session?.user)return null;
 const {data,error:profileError}=await api.from('sz_profiles')
  .select('id,username').eq('id',session.user.id).maybeSingle();
 if(profileError)throw profileError;
 return data?{kind:'registered',name:data.username,id:data.id}:null;
}
async function restore(){
 try{
  const account=await authenticatedIdentity();
  setIdentity(account||makeGuest());
  if(account){
   closeAccount();await refresh();
  }
 }catch(e){console.warn('STRIKEZONE account restore:',e);setIdentity(makeGuest());}
 finally{sessionReady=true;}
}
async function signUp(){
 const name=$('szRegName').value.toLowerCase().trim();
 const password=$('szRegPassword').value,confirm=$('szRegConfirm').value;
 if(!NAME.test(name))return status('Username: 3–20 characters, beginning with a letter; only letters, numbers and _.',true);
 if(password.length<8)return status('Password must contain at least 8 characters.',true);
 if(password!==confirm)return status('The passwords do not match.',true);
 setBusy('szRegSubmit',true);
 try{
  const api=await connect();
  const {data:ok,error:checkError}=await api.rpc('sz_username_available',{p_username:name});
  if(checkError)throw checkError;
  if(!ok)throw new Error('Username already taken. Choose another.');
  const email='sz_'+name+'@accounts.strikezone.invalid';
  const {data,error}=await api.auth.signUp({
   email,password,options:{data:{strikezone_username:name}}
  });
  if(error)throw error;
  if(!data?.session){
   status('Supabase email confirmation must be disabled for username-only signups. Registration cannot finish yet; ask the site owner to enable it.',true);
   return;
  }
  const acct=await authenticatedIdentity();
  if(!acct)throw new Error('The player profile was not created. Run the database migration.');
  setIdentity(acct);closeAccount();notify('Welcome, '+acct.name+'!');
  $('szRegPassword').value='';$('szRegConfirm').value='';
  await refresh();
 }catch(e){report(e)}
 finally{setBusy('szRegSubmit',false);}
}
async function signIn(){
 const name=$('szLoginName').value.toLowerCase().trim();
 const password=$('szLoginPassword').value;
 if(!NAME.test(name)||!password)return status('Enter your username and password.',true);
 setBusy('szLoginSubmit',true);
 try{
  const api=await connect();
  const {error}=await api.auth.signInWithPassword({
   email:'sz_'+name+'@accounts.strikezone.invalid',password
  });
  if(error)throw new Error('Username or password incorrect, or account not confirmed.');
  const acct=await authenticatedIdentity();
  if(!acct){await api.auth.signOut();throw new Error('No STRIKEZONE account exists for these credentials.');}
  setIdentity(acct);closeAccount();notify('Signed in as '+acct.name);
  $('szLoginPassword').value='';await refresh();
 }catch(e){report(e)}
 finally{setBusy('szLoginSubmit',false);}
}
async function signOut(){
 try{if(db)await db.auth.signOut();}catch(e){console.warn(e)}
 friends=[];pending=[];invites=[];knownInvites.clear();
 setIdentity(makeGuest());closeFriends();openAccount('guest');
 status('Signed out. You can continue as a Guest.');
}
function startGuest(){closeAccount();setIdentity(makeGuest());notify('Playing as '+current().name);}
async function loadNames(ids){
 const unique=[...new Set(ids.filter(Boolean))];
 if(!unique.length)return new Map();
 const {data,error}=await db.from('sz_profiles').select('id,username').in('id',unique);
 if(error)throw error;
 return new Map((data||[]).map(p=>[p.id,p.username]));
}
async function refresh(){
 if(current().kind!=='registered'||!db)return;
 const me=current().id;
 const [links,requests,roomInvites]=await Promise.all([
  db.from('sz_friendships').select('user_a,user_b')
   .or('user_a.eq.'+me+',user_b.eq.'+me),
  db.from('sz_friend_requests').select('id,sender_id,created_at')
   .eq('recipient_id',me).eq('status','pending').order('created_at',{ascending:false}),
  db.from('sz_room_invites').select('id,sender_id,room_code,created_at,expires_at')
   .eq('recipient_id',me).eq('status','pending')
   .gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false})
 ]);
 if(links.error)throw links.error;
 if(requests.error)throw requests.error;
 if(roomInvites.error)throw roomInvites.error;
 const ids=(links.data||[]).map(x=>x.user_a===me?x.user_b:x.user_a);
 const nextRequests=requests.data||[];
 const nextInvites=roomInvites.data||[];
 const usernames=await loadNames([...ids,...nextRequests.map(x=>x.sender_id),
  ...nextInvites.map(x=>x.sender_id)]);
 friends=ids.map(id=>({id,name:usernames.get(id)||'PLAYER'}));
 pending=nextRequests.map(x=>({...x,name:usernames.get(x.sender_id)||'PLAYER'}));
 invites=nextInvites.map(x=>({...x,name:usernames.get(x.sender_id)||'PLAYER'}));
 const newlyArrived=invites.filter(x=>!knownInvites.has(x.id));
 if(newlyArrived.length)
  notify('New match invite! Open Friends to accept.');
 for(const x of invites)knownInvites.add(x.id);
 showAccountState();renderLists();
}
function empty(container,label){
 const p=document.createElement('p');p.className='szMuted';p.textContent=label;
 container.append(p);
}
function listRow(container,name,desc,actions){
 const row=document.createElement('div');row.className='szListRow';
 const info=document.createElement('div'),h=document.createElement('strong');
 h.textContent=name;info.append(h);
 if(desc){const small=document.createElement('small');small.textContent=desc;info.append(small);}
 const controls=document.createElement('div');controls.className='szListActions';
 for(const item of actions)controls.append(socialButton(item[0],item[1]));
 row.append(info,controls);container.append(row);
}
function renderLists(){
 for(const key of ['szFriendsList','szRequestsList','szInvitesList'])$(key).replaceChildren();
 if(!friends.length)empty($('szFriendsList'),'No friends yet. Add someone by their exact username.');
 const room=handlers.getHostRoom?.();
 for(const friend of friends){
  listRow($('szFriendsList'),friend.name,room?'Room '+room:'Create a private room to invite',[
   [room?'INVITE':'OPEN ROOM',()=>inviteFriend(friend)]
  ]);
 }
 if(!pending.length)empty($('szRequestsList'),'No pending friend requests.');
 for(const req of pending){
  listRow($('szRequestsList'),req.name,'Wants to be friends',[
   ['ACCEPT',()=>respondRequest(req.id,true)],
   ['DECLINE',()=>respondRequest(req.id,false)]
  ]);
 }
 if(!invites.length)empty($('szInvitesList'),'No pending match invitations.');
 for(const invite of invites){
  listRow($('szInvitesList'),invite.name,'Invited you to room '+invite.room_code,[
   ['JOIN',()=>respondInvite(invite,true)],
   ['DECLINE',()=>respondInvite(invite,false)]
  ]);
 }
}
async function sendRequest(){
 const username=$('szFriendName').value.toLowerCase().trim();
 if(current().kind!=='registered')return openAccount('register');
 if(!NAME.test(username))return notify('Enter the exact username.');
 try{
  const {error}=await db.rpc('sz_send_friend_request',{p_username:username});
  if(error)throw error;
  $('szFriendName').value='';notify('Friend request sent to '+username+'.');
  await refresh();
 }catch(e){report(e)}
}
async function respondRequest(id,accept){
 try{
  const {error}=await db.rpc('sz_respond_friend_request',{
   p_request_id:id,p_accept:accept
  });
  if(error)throw error;
  notify(accept?'Friend request accepted.':'Friend request declined.');
  await refresh();
 }catch(e){report(e)}
}
async function inviteFriend(friend){
 if(current().kind!=='registered')return openAccount('register');
 const room=handlers.getHostRoom?.();
 if(!room){
  closeFriends();if(handlers.openRoom)handlers.openRoom();
  notify('Create a private room, then open Friends to invite '+friend.name+'.');return;
 }
 try{
  const {error}=await db.rpc('sz_send_room_invite',{
   p_friend_id:friend.id,p_room_code:room
  });
  if(error)throw error;
  notify('Invite sent to '+friend.name+' · Room '+room);
 }catch(e){report(e)}
}
async function respondInvite(invite,accept){
 try{
  const {error}=await db.rpc('sz_respond_room_invite',{
   p_invite_id:invite.id,p_accept:accept
  });
  if(error)throw error;
  if(accept){
   closeFriends();
   if(handlers.joinRoom)handlers.joinRoom(invite.room_code);
   notify('Joining room '+invite.room_code+'...');
  }else notify('Invitation declined.');
  await refresh();
 }catch(e){report(e)}
}
function setupDOM(){
 const actions=document.createElement('div');actions.id='szSocialButtons';
 const account=socialButton('ACCOUNT',()=>openAccount('login'));
 account.id='szAccountMenu';account.className='szSocialBtn';actions.append(account);
 const friendsBtn=socialButton('FRIENDS',openFriends);
 friendsBtn.id='szFriendsMenu';friendsBtn.className='szSocialBtn';
 const badge=document.createElement('span');badge.id='szFriendBadge';badge.hidden=true;
 friendsBtn.append(badge);actions.append(friendsBtn);
 const menu=document.querySelector('#mainMenu .menuActions');
 if(menu)menu.after(actions);
 const invite=socialButton('INVITE FRIENDS',openFriends);
 invite.id='szInviteFriends';invite.hidden=true;
 const room=$('onlineRoomInfo');if(room)room.append(invite);
 const accountOverlay=document.createElement('div');
 accountOverlay.className='szOverlay';accountOverlay.id='szAccountOverlay';accountOverlay.hidden=true;
 accountOverlay.innerHTML=[
 '<section class="szDialog" role="dialog" aria-label="STRIKEZONE player account">',
 '<div class="szHead"><span>STRIKE<em>ZONE</em> · ACCOUNT</span><button type="button" class="szButton" id="szAccountClose">✕</button></div>',
 '<p class="szIntro">Register a unique username and password to add friends and invite them to play. You can also play as a random Guest.</p>',
 '<div class="szTabs"><button type="button" class="szTab selected" data-tab="login">LOGIN</button>',
 '<button type="button" class="szTab" data-tab="register">REGISTER</button>',
 '<button type="button" class="szTab" data-tab="guest">GUEST</button></div>',
 '<div class="szView" data-view="login">',
 '<label for="szLoginName">USERNAME</label><input class="szInput" id="szLoginName" maxlength="20" autocomplete="username" autocapitalize="none">',
 '<label for="szLoginPassword">PASSWORD</label><input class="szInput" id="szLoginPassword" type="password" autocomplete="current-password">',
 '<div class="szActions"><button class="szButton primary" type="button" id="szLoginSubmit">LOGIN</button></div></div>',
 '<div class="szView" data-view="register" hidden>',
 '<label for="szRegName">CREATE USERNAME</label><input class="szInput" id="szRegName" maxlength="20" autocapitalize="none" placeholder="letters, digits and underscore">',
 '<label for="szRegPassword">PASSWORD (8+ CHARACTERS)</label><input class="szInput" id="szRegPassword" type="password" minlength="8" autocomplete="new-password">',
 '<label for="szRegConfirm">CONFIRM PASSWORD</label><input class="szInput" id="szRegConfirm" type="password" minlength="8" autocomplete="new-password">',
 '<p class="szNote">Keep your password safe. Password recovery is not available yet.</p>',
 '<div class="szActions"><button class="szButton primary" type="button" id="szRegSubmit">CREATE ACCOUNT</button></div></div>',
 '<div class="szView" data-view="guest" hidden>',
 '<p class="szIntro">Guests get a random name and can play offline or JOIN an existing room. Only registered players can create rooms, send friend requests and invite other players.</p>',
 '<div class="szActions"><button class="szButton primary" id="szGuestSubmit" type="button">PLAY AS GUEST</button></div></div>',
 '<p class="szMessage" id="szAccountStatus" role="status"></p>',
 '<div class="szActions"><button class="szButton" type="button" id="szSignOut">LOG OUT</button></div>',
 '</section>'
 ].join('');
 document.body.append(accountOverlay);
 const friendsOverlay=document.createElement('div');
 friendsOverlay.className='szOverlay';friendsOverlay.id='szFriendsOverlay';friendsOverlay.hidden=true;
 friendsOverlay.innerHTML=[
 '<section class="szDialog wide" role="dialog" aria-label="STRIKEZONE friends">',
 '<div class="szHead"><span>STRIKE<em>ZONE</em> · FRIENDS</span><button class="szButton" type="button" id="szFriendsClose">✕</button></div>',
 '<p class="szIntro">Search by exact username. Accept friend requests and invite your friends into private rooms.</p>',
 '<label for="szFriendName">ADD FRIEND BY USERNAME</label>',
 '<div style="display:flex;gap:7px"><input id="szFriendName" class="szInput" maxlength="20" autocapitalize="none" placeholder="Exact username">',
 '<button class="szButton primary" id="szFriendAdd" type="button">ADD</button></div>',
 '<section class="szListSection"><h3>YOUR FRIENDS</h3><div id="szFriendsList"></div></section>',
 '<section class="szListSection"><h3>FRIEND REQUESTS</h3><div id="szRequestsList"></div></section>',
 '<section class="szListSection"><h3>GAME INVITATIONS</h3><div id="szInvitesList"></div></section>',
 '<div class="szActions"><button class="szButton" type="button" id="szFriendsRefresh">REFRESH</button>',
 '<button class="szButton primary" type="button" id="szFriendsDone">DONE</button></div>',
 '</section>'
 ].join('');
 document.body.append(friendsOverlay);
 const toast=document.createElement('div');toast.id='szSocialToast';toast.setAttribute('role','status');
 document.body.append(toast);
 $('szAccountClose').addEventListener('click',closeAccount);
 $('szFriendsClose').addEventListener('click',closeFriends);
 $('szFriendsDone').addEventListener('click',closeFriends);
 $('szLoginSubmit').addEventListener('click',signIn);
 $('szRegSubmit').addEventListener('click',signUp);
 $('szGuestSubmit').addEventListener('click',startGuest);
 $('szSignOut').addEventListener('click',signOut);
 $('szFriendAdd').addEventListener('click',sendRequest);
 $('szFriendsRefresh').addEventListener('click',()=>refresh().catch(report));
 for(const tab of document.querySelectorAll('.szTab')){
  tab.addEventListener('click',()=>switchView(tab.dataset.tab));
 }
 for(const [input,action] of [['szLoginPassword',signIn],
  ['szRegConfirm',signUp],['szFriendName',sendRequest]]){
  $(input).addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();action();}
  });
 }
}
async function init(options={}){
 if(initialized)return;
 initialized=true;handlers=options;
 setupDOM();setIdentity(makeGuest());
 restore().catch(e=>console.warn(e));
 setInterval(()=>{if(current().kind==='registered')refresh().catch(e=>console.warn(e));},12000);
 try{
  if(!sessionStorage.getItem('sz-account-choice')){
   openAccount('login');sessionStorage.setItem('sz-account-choice','shown');
  }
 }catch(_){openAccount('login');}
}
window.SZSocial={init,current,canHost:()=>current().kind==='registered',
 openAccount,openFriends,refresh,notify};
})();
