/* Evergrove v0.6 keyboard actions: arrows move; Z interact, X use/back, A previous, S next. */
(()=>{'use strict';
const frame=document.getElementById('gameFrame');if(!frame)return;
const modal=()=>!document.getElementById('modalLayer')?.classList.contains('hidden');
const click=id=>document.getElementById(id)?.click();
const candidates=()=>[...document.querySelectorAll('#modalBody button:not(:disabled)')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length>0);
let selected=0;
const mark=()=>{const all=candidates();if(!all.length)return;selected=((selected%all.length)+all.length)%all.length;all.forEach((el,i)=>{el.classList.toggle('keyboard-selected',i===selected);if(i===selected)el.focus({preventScroll:true});});};
const cycle=delta=>{const all=candidates();if(!all.length)return;const current=all.indexOf(document.activeElement);selected=(current<0?selected:current)+delta;mark();};
function process(action){const box=document.getElementById('modalLayer');if(modal()){if(action==='talk'){const all=candidates();if(!all.length){click('modalClose');return;}const active=all.includes(document.activeElement)?document.activeElement:all[Math.min(selected,all.length-1)];active?.click();}else if(action==='use'){const back=box?.querySelector('#modalBody [data-action="dlg-back"]:not([hidden])');if(back&&!back.closest('[hidden]'))back.click();else click('modalClose');}else cycle(action==='previous'?-1:1);return;}if(action==='talk')click('touchInteract');if(action==='use')click('touchUse');if(action==='previous')click('touchToolPrev');if(action==='next')click('touchToolNext');}
const keymap={KeyZ:'talk',KeyX:'use',KeyA:'previous',KeyS:'next'};
document.addEventListener('keydown',e=>{const action=keymap[e.code];if(!action||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;process(action);frame.querySelector('[data-pad-action="'+action+'"]')?.classList.add('pressed');},true);
document.addEventListener('keyup',e=>{const action=keymap[e.code];if(!action||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();frame.querySelector('[data-pad-action="'+action+'"]')?.classList.remove('pressed');},true);
frame.querySelectorAll('[data-pad-action]').forEach(button=>button.addEventListener('click',()=>process(button.dataset.padAction)));
const style=document.createElement('style');style.textContent='.keyboard-selected{outline:2px solid #eff4b5!important;outline-offset:1px!important;background:#51795d!important}';document.head.appendChild(style);
window.addEventListener('blur',()=>frame.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed')));
})();