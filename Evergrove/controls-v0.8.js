/* Evergrove v0.8 — keyboard selection includes unavailable choices. */
(()=>{'use strict';
const frame=document.getElementById('gameFrame'), layer=document.getElementById('modalLayer'), body=document.getElementById('modalBody');
if(!frame||!layer||!body)return;
const menuOpen=()=>!layer.classList.contains('hidden');
const editable=e=>e.target?.closest?.('input,textarea,select,[contenteditable="true"]');
const candidates=()=>[...body.querySelectorAll('button,summary')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length>0);
let selected=0,wasOpen=false,lastChoice=null,feedbackTimeout=null;
function current(){const all=candidates();return all.length?all[((selected%all.length)+all.length)%all.length]:null;}
function mark(){
 const all=candidates();
 body.querySelectorAll('.keyboard-selected').forEach(el=>el.classList.remove('keyboard-selected'));
 if(!all.length){lastChoice=null;return;}
 if(lastChoice&&all.includes(lastChoice))selected=all.indexOf(lastChoice);
 else selected=((selected%all.length)+all.length)%all.length;
 const el=all[selected];lastChoice=el;el.classList.add('keyboard-selected');
 if(!el.disabled)el.focus({preventScroll:true});
 const scroll=el.closest('.dialogue-choices,.modal-body');
 if(scroll){const r=el.getBoundingClientRect(),v=scroll.getBoundingClientRect();
 if(r.top<v.top||r.bottom>v.bottom)el.scrollIntoView({block:'nearest',inline:'nearest'});}
}
function move(delta){const all=candidates();if(!all.length)return;
 selected=(((lastChoice&&all.includes(lastChoice))?all.indexOf(lastChoice):selected)+delta+all.length)%all.length;
 lastChoice=null;mark();
}
function unavailable(el){
 const name=(el.textContent||'').toLowerCase();let reason='This option is currently unavailable.';
 if(name.includes('gift')&&name.includes('none'))reason='You do not have a suitable gift in your bag.';
 else if(name.includes('chat'))reason='You already chatted with this villager today.';
 else if(name.includes('spend time'))reason='You have already spent time together today.';
 else if(name.includes('ring'))reason='You need a Promise Ring before proposing.';
 else if(name.includes('buy')||name.includes('meal'))reason='You do not have enough gold.';
 else if(name.includes('craft')||name.includes('select'))reason='You do not have the required materials.';
 const result=document.getElementById('dialogueResult');
 if(result&&layer.classList.contains('dialogue-layer')){result.textContent='🔒 '+reason;result.hidden=false;return;}
 let status=layer.querySelector('.keyboard-choice-status');
 if(!status){status=document.createElement('div');status.className='keyboard-choice-status';status.setAttribute('role','status');layer.appendChild(status);}
 status.textContent='🔒 '+reason;status.hidden=false;clearTimeout(feedbackTimeout);
 feedbackTimeout=setTimeout(()=>{if(status.isConnected)status.hidden=true;},2600);
}
function confirm(){const el=current();if(!el)return;if(el.disabled){unavailable(el);return;}el.click();}
const back=()=>document.getElementById('modalClose')?.click(),click=id=>document.getElementById(id)?.click();
function process(action){
 if(menuOpen()){if(action==='talk')confirm();else if(action==='use')back();else move(action==='previous'?-1:1);return;}
 if(action==='talk')click('touchInteract');
 else if(action==='use')click('touchUse');
 else if(action==='previous')click('touchToolPrev');
 else click('touchToolNext');
}
const actions={KeyZ:'talk',KeyX:'use',KeyA:'previous',KeyS:'next'};
const arrows={ArrowUp:-1,ArrowDown:1,ArrowLeft:'back',ArrowRight:'confirm'};
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||editable(e)||e.isComposing)return;
 const action=actions[e.code];
 if(action){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
 process(action);frame.querySelector('[data-pad-action="'+action+'"]')?.classList.add('pressed');return;}
 if(!menuOpen()||!(e.code in arrows))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(e.repeat&&(e.code==='ArrowLeft'||e.code==='ArrowRight'))return;
 const step=arrows[e.code];if(step==='back')back();else if(step==='confirm')confirm();else move(step);
},true);
document.addEventListener('keyup',e=>{
 const action=actions[e.code];if(!action||editable(e))return;
 frame.querySelector('[data-pad-action="'+action+'"]')?.classList.remove('pressed');
},true);
frame.querySelectorAll('[data-pad-action]').forEach(b=>b.addEventListener('click',()=>process(b.dataset.padAction)));
layer.addEventListener('focusin',e=>{
 const i=candidates().indexOf(e.target);if(i<0||e.target.disabled||lastChoice?.disabled)return;
 selected=i;lastChoice=e.target;
 body.querySelectorAll('.keyboard-selected').forEach(el=>el.classList.remove('keyboard-selected'));e.target.classList.add('keyboard-selected');
});
layer.addEventListener('click',e=>{const el=e.target.closest('button,summary'),i=candidates().indexOf(el);if(i>=0){selected=i;lastChoice=el;mark();}});
function update(){
 if(!menuOpen()){wasOpen=false;selected=0;lastChoice=null;return;}
 if(!wasOpen){selected=0;lastChoice=null;wasOpen=true;}
 const all=candidates();if(lastChoice&&!all.includes(lastChoice)){selected=0;lastChoice=null;}
 mark();
}
const obs=new MutationObserver(m=>{if(m.some(x=>x.target===layer&&x.attributeName==='class'||x.target===body&&x.type==='childList'||x.type==='attributes'&&x.attributeName==='hidden'&&x.target.matches?.('[data-dialogue-pane]')))queueMicrotask(update);});
obs.observe(layer,{attributes:true,attributeFilter:['class']});
obs.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
window.addEventListener('blur',()=>frame.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed')));
})();