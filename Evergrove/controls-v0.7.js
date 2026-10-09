/* Evergrove v0.7 keyboard actions: arrows select while a menu is open; Z interact, X use/back, A previous, S next. */
(()=>{'use strict';
const frame=document.getElementById('gameFrame');if(!frame)return;
const modal=()=>!document.getElementById('modalLayer')?.classList.contains('hidden');
const click=id=>document.getElementById(id)?.click();
const candidates=()=>[...document.querySelectorAll('#modalBody button:not(:disabled),#modalBody summary')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length>0);
let selected=0;
const mark=()=>{const all=candidates();if(!all.length)return;selected=((selected%all.length)+all.length)%all.length;all.forEach((el,i)=>{el.classList.toggle('keyboard-selected',i===selected);if(i===selected)el.focus({preventScroll:true});});};
const cycle=delta=>{const all=candidates();if(!all.length)return;const current=all.indexOf(document.activeElement);selected=(current<0?selected:current)+delta;mark();};
function process(action){const box=document.getElementById('modalLayer');if(modal()){if(action==='talk'){const all=candidates();if(!all.length){click('modalClose');return;}const active=all.includes(document.activeElement)?document.activeElement:all[Math.min(selected,all.length-1)];active?.click();}else if(action==='use'){click('modalClose');}else cycle(action==='previous'?-1:1);return;}if(action==='talk')click('touchInteract');if(action==='use')click('touchUse');if(action==='previous')click('touchToolPrev');if(action==='next')click('touchToolNext');}
const keymap={KeyZ:'talk',KeyX:'use',KeyA:'previous',KeyS:'next'};
const arrows={ArrowUp:'previous',ArrowDown:'next',ArrowLeft:'use',ArrowRight:'talk'};
document.addEventListener('keydown',e=>{const action=keymap[e.code]||(modal()?arrows[e.code]:null);if(!action||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat&&!['ArrowUp','ArrowDown'].includes(e.code))return;process(action);frame.querySelector('[data-pad-action="'+action+'"]')?.classList.add('pressed');},true);
document.addEventListener('keyup',e=>{const action=keymap[e.code];if(!action||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();frame.querySelector('[data-pad-action="'+action+'"]')?.classList.remove('pressed');},true);
frame.querySelectorAll('[data-pad-action]').forEach(button=>button.addEventListener('click',()=>process(button.dataset.padAction)));
const layer=document.getElementById('modalLayer'),body=document.getElementById('modalBody');
const observer=new MutationObserver(m=>{if(!modal())return;if(m.some(x=>x.target===layer||x.target===body&&x.type==='childList'||x.type==='attributes'&&x.attributeName==='hidden'&&x.target.matches?.('[data-dialogue-pane]'))){queueMicrotask(()=>{const all=candidates();if(!all.includes(document.activeElement))selected=0;mark()})}});
observer.observe(layer,{attributes:true,attributeFilter:['class']});observer.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
const style=document.createElement('style');style.textContent='.keyboard-selected{outline:2px solid #f8e2a0!important;outline-offset:1px!important;background:#547c62!important;box-shadow:0 0 10px #f6dc8f55!important}.choice.keyboard-selected{border-left:5px solid #f8e2a0!important}';document.head.appendChild(style);
window.addEventListener('blur',()=>frame.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed')));
})();