/* One shared WebGL renderer. No framework, network calls, or visible text. */
(()=>{
'use strict';
const config={maxSelected:3,hoverProgress:.18,hoverMs:240,peelMs:240,settleMs:50,motion:{origin:{x:1,y:1},target:{x:0,y:0}}};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const data=window.STICKERS;
const groups=[[0,1,4,5,8,9],[2,3,6,7,10,11]];
const layer=document.querySelector('#peel-layer');
const tray=document.querySelector('.collection');
let engine,enginePromise,loadPromise,sourceQueue=Promise.resolve(),active=null,busy=false,generation=0,animation=0,progress=0,failed=false,currentMotion=config.motion;
const buttons=new Map();
function emit(name,item){document.dispatchEvent(new CustomEvent(name,{detail:{id:item.id,sticker:item}}));}
function place(button,item){const r=button.getBoundingClientRect();const scale=Math.min(r.width*.86/item.width,r.height*.86/item.height);const w=item.width*scale,h=item.height*scale;Object.assign(layer.style,{left:`${r.x+r.width/2-r.width}px`,top:`${r.y+r.height/2-r.height}px`,width:`${r.width*2}px`,height:`${r.height*2}px`});engine?.setOptions({display:{width:w,height:h}});engine?.resize();}
function tween(to,ms){cancelAnimationFrame(animation);const from=progress;const start=performance.now();return new Promise(resolve=>{function frame(now){const t=Math.min(1,(now-start)/Math.max(1,ms));const ease=t*t*(3-2*t);progress=from+(to-from)*ease;engine?.setPeelProgress(progress,currentMotion);if(t<1)animation=requestAnimationFrame(frame);else resolve();}animation=requestAnimationFrame(frame);});}
function activate(button,item){
 if(active===button&&loadPromise)return loadPromise;
 loadPromise=activateSource(button,item);return loadPromise;
}
async function activateSource(button,item){
 const token=++generation;cancelAnimationFrame(animation);
 if(active)active.dataset.active='false';active=button;layer.style.opacity='0';place(button,item);
 try{
  if(!engine){enginePromise??=StickerForge.createSticker(layer,{outline:{width:0},edge:{width:.6,strength:.25},shadow:{opacity:.18,blur:12,distance:7},lighting:{intensity:.35,ambient:.85},peel:{radius:.12,stiffness:.72,residue:false,release:'stay'},back:{color:'#f7f4ea',gloss:.08,roughness:.95},material:{type:'original'},sound:{enabled:false},wind:0,tilt:0,quality:'medium'});engine=await enginePromise;}
  if(token!==generation)return false;
  sourceQueue=sourceQueue.catch(()=>{}).then(()=>token===generation?engine.setSource({type:'image',src:item.src,padding:0,textureMaxEdge:512}):undefined);
  await sourceQueue;
  if(token!==generation)return false;
  place(button,item);currentMotion={origin:item.peelOrigin||config.motion.origin,target:config.motion.target};progress=0;engine.setPeelProgress(0,currentMotion);button.dataset.active='true';layer.style.opacity='1';return true;
 }catch(error){failed=true;layer.style.opacity='0';button.dataset.active='false';console.error('Sticker renderer unavailable',error);emit('sticker:error',item);return false;}
}
function deactivate(){++generation;cancelAnimationFrame(animation);if(active)active.dataset.active='false';active=null;loadPromise=null;layer.style.opacity='0';progress=0;}
function restore(item){if(busy)return;const button=buttons.get(item.id);tray.querySelector(`[data-id="${item.id}"]`)?.remove();button.dataset.state='ready';button.disabled=false;emit('sticker:restore',item);}
function collect(button,item,slot){button.dataset.state='peeled';button.disabled=true;const target=document.createElement('button');target.className='collected';target.dataset.id=item.id;target.dataset.slot=String(slot??[0,1,2].find(n=>![...tray.children].some(b=>Number(b.dataset.slot)===n)));target.style.gridColumn=String(Number(target.dataset.slot)+1);target.style.gridRow='1';target.setAttribute('aria-label',`放回${item.label}`);const img=new Image();img.src=item.src;img.alt='';img.draggable=false;target.append(img);target.onclick=()=>{};tray.append(target);if(!reduced())target.animate([{transform:'scale(1.12) rotate(-3deg)',opacity:0},{transform:'scale(.97)',opacity:1},{transform:'scale(1)'}],{duration:280,easing:'ease-out'});emit('sticker:placed',item);}
async function peel(button,item){
 if(busy||button.dataset.state==='peeled'||tray.children.length>=config.maxSelected)return;busy=true;button.dataset.state='peeling';emit('sticker:peelstart',item);
 const ready=await activate(button,item);
 if(ready&&!reduced())await tween(1,config.peelMs);
 else if(!reduced())await button.animate([{opacity:1},{opacity:0}],{duration:250,fill:'forwards'}).finished;
 button.dataset.state='peeled';deactivate();button.dataset.state='peeled';emit('sticker:detached',item);
 await new Promise(r=>setTimeout(r,reduced()?0:config.settleMs));button.getAnimations().forEach(a=>a.cancel());collect(button,item);busy=false;
}
groups.forEach((group,g)=>{const panel=document.querySelectorAll('.panel')[g];group.forEach(index=>{const item=data[index];const button=document.createElement('button');button.className='sticker';button.dataset.id=item.id;button.dataset.state='ready';button.setAttribute('aria-label',`撕下${item.label}`);const img=new Image();img.src=item.src;img.alt='';img.draggable=false;button.append(img);panel.append(button);buttons.set(item.id,button);
 const hover=async()=>{if(busy||reduced()||failed||button.dataset.state==='peeled')return;if(await activate(button,item)){if(!busy){layer.getAnimations().forEach(a=>a.cancel());layer.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-2px) rotate(-1.5deg)',offset:.45},{transform:'translateY(0) rotate(0)'}],{duration:340,easing:'ease-out'});await tween(config.hoverProgress,config.hoverMs);}}};
 button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover();});button.addEventListener('focus',hover);
 const leave=async()=>{if(busy||active!==button)return;const token=generation;await tween(0,180);if(!busy&&token===generation)deactivate();};button.addEventListener('pointerleave',leave);button.addEventListener('blur',leave);button.onclick=()=>{if(!window.StickerDrag?.active)peel(button,item);};
 });});
window.addEventListener('resize',()=>{if(active){const item=data.find(x=>x.id===active.dataset.id);place(active,item);}});
window.addEventListener('scroll',()=>{if(active){const item=data.find(x=>x.id===active.dataset.id);place(active,item);}},{passive:true});
window.StickerDemo={config,
get busy(){return busy;},
async liftCollected(id,button){if(busy||!data.some(x=>x.id===id))return false;busy=true;deactivate();return true;},
endCollectedDrag(){busy=false;},
async detachForDrag(id){const item=data.find(x=>x.id===id),button=buttons.get(id);if(busy||!item||button.dataset.state==='peeled'||tray.children.length>=config.maxSelected)return false;busy=true;button.dataset.state='peeling';emit('sticker:peelstart',item);const ready=await activate(button,item);if(ready&&!reduced())await tween(1,650);deactivate();button.dataset.state='peeled';emit('sticker:detached',item);return true;},
finishDrag(id,slot){const item=data.find(x=>x.id===id),button=buttons.get(id);busy=false;if(slot==null){restore(item);}else{collect(button,item,slot);} },
remove:id=>{const item=data.find(x=>x.id===id);if(item)restore(item);},
peel:id=>{const item=data.find(x=>x.id===id);if(item)return peel(buttons.get(id),item);},reset:()=>{if(busy)return;deactivate();data.forEach(restore);},getState:()=>data.map(item=>({id:item.id,state:buttons.get(item.id).dataset.state})),destroy:()=>{deactivate();engine?.destroy();}};
})();
