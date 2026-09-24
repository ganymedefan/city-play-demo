(()=>{
const tray=document.querySelector('.collection'),fan=document.querySelector('.fan');
let pending=null,drag=null,timer=0,suppressUntil=0;
const api=window.StickerDrag={get active(){return !!drag;},get suppressClick(){return !!drag||performance.now()<suppressUntil;}};
const items=new Map(window.STICKERS.map(x=>[x.id,x]));
function targetAt(x,y){const r=fan.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;return Math.max(0,Math.min(2,Math.floor((x-r.left)/r.width*3)));}
function highlight(){const slot=drag?targetAt(drag.x,drag.y):null;fan.dataset.drop=String(slot!==null);document.querySelectorAll('.fan-ghosts i').forEach((el,i)=>el.dataset.target=String(slot===i));}
function moveGhost(){if(!drag?.ghost)return;drag.ghost.style.left=drag.x+'px';drag.ghost.style.top=drag.y+'px';highlight();}
function notify(){document.dispatchEvent(new CustomEvent('sticker:reorder'));}
function setSlot(button,slot){button.dataset.slot=String(slot);button.style.gridColumn=String(slot+1);}
async function start(){
 if(!pending||drag)return;clearTimeout(timer);const p=pending;pending=null;
 if(window.StickerDemo.busy||(!p.collected&&tray.children.length>=3))return;
 drag={...p,loading:true,ended:false,cancelled:false,ghost:null,oldSlot:p.collected?Number(p.button.dataset.slot):null};const d=drag;suppressUntil=performance.now()+10000;document.body.classList.add('dragging');
 if(p.collected){const ok=await window.StickerDemo.liftCollected(p.id,p.button);if(!ok){cleanup();return;}p.button.dataset.dragging='true';}
 else {const ok=await window.StickerDemo.detachForDrag(p.id);if(!ok){cleanup();return;}}
 if(d!==drag)return;d.loading=false;
 const ghost=new Image();ghost.className='drag-ghost';ghost.src=items.get(p.id).src;ghost.alt='';const r=p.rect;ghost.style.width=Math.min(r.width*.95,140)+'px';ghost.style.height=Math.min(r.height*.95,140)+'px';document.body.append(ghost);d.ghost=ghost;moveGhost();if(d.collected&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ghost.animate([{transform:'translate(-50%,-50%) rotate(0deg) scale(1)',filter:'drop-shadow(0 2px 1px #263a3418)'},{transform:'translate(-50%,-50%) rotate(-3deg) scale(1.08)',filter:'drop-shadow(0 12px 9px #263a3438)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});}if(d.ended)finish();
}
function cleanup(){clearTimeout(timer);if(drag){delete drag.button.dataset.dragging;drag.ghost?.remove();}drag=null;pending=null;document.body.classList.remove('dragging');fan.dataset.drop='false';document.querySelectorAll('.fan-ghosts i').forEach(el=>el.dataset.target='false');suppressUntil=performance.now()+350;}
function finish(){
 const d=drag;if(!d)return;d.ended=true;if(d.loading)return;
 let slot=d.cancelled?null:targetAt(d.x,d.y);
 if(d.collected){window.StickerDemo.endCollectedDrag();if(d.cancelled){/* Escape/pointercancel restores original slot. */}else if(slot===null){window.StickerDemo.remove(d.id);}else{const other=[...tray.children].find(b=>b!==d.button&&Number(b.dataset.slot)===slot);if(other)setSlot(other,d.oldSlot);setSlot(d.button,slot);notify();}}
 else {if(slot!==null){const occupied=[...tray.children].find(b=>Number(b.dataset.slot)===slot);if(occupied){const free=[0,1,2].find(n=>![...tray.children].some(b=>Number(b.dataset.slot)===n));if(free!==undefined)setSlot(occupied,free);else slot=null;}}window.StickerDemo.finishDrag(d.id,slot);}
 cleanup();
}
document.addEventListener('dragstart',e=>{if(e.target.closest('.sticker,.collected'))e.preventDefault();});
document.addEventListener('pointerdown',e=>{const button=e.target.closest('.sticker,.collected');if(!button||button.disabled||drag||window.StickerDemo.busy||e.button!==0)return;pending={button,id:button.dataset.id,collected:button.classList.contains('collected'),pointerId:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,rect:button.getBoundingClientRect()};e.preventDefault();button.setPointerCapture(e.pointerId);timer=setTimeout(start,300);});
document.addEventListener('pointermove',e=>{if(pending&&pending.pointerId===e.pointerId){pending.x=e.clientX;pending.y=e.clientY;}if(drag&&drag.pointerId===e.pointerId){drag.x=e.clientX;drag.y=e.clientY;moveGhost();}});
document.addEventListener('pointerup',e=>{clearTimeout(timer);if(pending?.pointerId===e.pointerId)pending=null;if(drag?.pointerId===e.pointerId){drag.x=e.clientX;drag.y=e.clientY;finish();}});
document.addEventListener('pointercancel',e=>{clearTimeout(timer);pending=null;if(drag?.pointerId===e.pointerId){drag.cancelled=true;finish();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){clearTimeout(timer);pending=null;if(drag){drag.cancelled=true;finish();}}});
window.addEventListener('blur',()=>{clearTimeout(timer);pending=null;if(drag){drag.cancelled=true;finish();}});
document.addEventListener('click',e=>{if(api.suppressClick&&e.target.closest('.sticker,.collected')){e.preventDefault();e.stopImmediatePropagation();}},true);
})();
