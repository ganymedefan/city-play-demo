(()=>{
'use strict';
const tray=document.querySelector('.collection');
const fan=document.createElement('div');
fan.className='fan';
tray.before(fan);
const trigger=document.createElement('button');
trigger.className='fan-trigger';
trigger.type='button';
trigger.disabled=true;
trigger.setAttribute('aria-label','查看人格卡片');
fan.append(trigger);
const ghosts=document.createElement('div');
ghosts.className='fan-ghosts';
ghosts.setAttribute('aria-hidden','true');
ghosts.innerHTML='<i></i><i></i><i></i>';
fan.append(ghosts,tray);

const dialog=document.createElement('dialog');
dialog.className='result-dialog';
dialog.setAttribute('aria-label','人格卡片');
dialog.innerHTML=`<div class="result-card"><img class="card-reference" src="visual/asset-35.png" alt="" draggable="false"><div class="card-composed"><img class="card-background" src="visual/asset-22.png" alt="" draggable="false"><img class="card-header-logo" src="visual/asset-21.png" alt="" draggable="false"><img class="card-badge" src="visual/asset-16.png" alt="" draggable="false"><span class="person-art"><img alt="" draggable="false"></span><img class="card-you-are" src="visual/asset-30.png" alt="" draggable="false"><img class="card-personality-name" alt="" draggable="false"><img class="card-type-suffix" src="visual/asset-31.png" alt="" draggable="false"><img class="card-walker" src="visual/asset-6.png" alt="" draggable="false"></div><button class="card-action card-action--retry" type="button" aria-label="重新测试"><img src="visual/asset-32.png" alt="" draggable="false"></button><button class="card-action card-action--share" type="button" aria-label="分享按钮演示"><img src="visual/asset-33.png" alt="" draggable="false"></button></div>`;
document.body.append(dialog);
const picture=dialog.querySelector('.person-art img');
const name=dialog.querySelector('.card-personality-name');
const art={ride:'visual/asset-17.png',eat:'visual/asset-43.png',coffee:'visual/asset-42.png',draw:'visual/asset-38.png',dog:'visual/asset-39.png',roam:'visual/asset-36.png',rest:'visual/asset-37.png'};
const titleArt={eat:'visual/personality-eat.png',coffee:'visual/personality-coffee.png',draw:'visual/personality-draw.png',dog:'visual/personality-dog.png',ride:'visual/personality-ride.png',roam:'visual/personality-roam.png',rest:'visual/personality-rest.png'};
const names={eat:'走哪吃哪',coffee:'咖啡续命',draw:'走走画画',dog:'狗狗带路',ride:'骑了再说',roam:'随地乱逛',rest:'随地发呆'};
let result=null,loadTimer=0,closing=false;

function sync(){
 const selected=[...tray.querySelectorAll('.collected')];
 trigger.disabled=selected.length!==3;
 fan.dataset.ready=String(selected.length===3);
 [...ghosts.children].forEach((ghost,slot)=>ghost.style.visibility=selected.some(button=>Number(button.dataset.slot)===slot)?'hidden':'visible');
}
function showResult(){
 if(!result)return;
 dialog.dataset.personality=result.type;
 dialog.setAttribute('aria-label',`${names[result.type]}人格卡片`);
 name.src=titleArt[result.type];
 picture.hidden=!art[result.type];
 if(art[result.type])picture.src=art[result.type];else picture.removeAttribute('src');
 dialog.classList.remove('is-closing');
 dialog.showModal();
 document.dispatchEvent(new CustomEvent('personality:result',{detail:result}));
}
function startLoading(){
 const ids=[...tray.querySelectorAll('.collected')].map(button=>button.dataset.id);
 if(ids.length!==3||document.body.dataset.screen!=='selection'||window.StickerDrag?.active)return;
 result=Personality.classify(ids);
 document.body.dataset.screen='loading';
 clearTimeout(loadTimer);
 loadTimer=setTimeout(showResult,3000);
}
function close(){
 if(closing)return;
 closing=true;
 clearTimeout(loadTimer);
 dialog.classList.add('is-closing');
 setTimeout(()=>{
  dialog.close();
  dialog.classList.remove('is-closing');
  document.body.dataset.screen='home';
  window.StickerDemo.reset();
  result=null;
  closing=false;
 },300);
}
fan.addEventListener('click',startLoading);
dialog.querySelector('.card-action--retry').addEventListener('click',close);
const shareButton=dialog.querySelector('.card-action--share');
shareButton.addEventListener('click',()=>{
 shareButton.classList.remove('is-tapped');
 void shareButton.offsetWidth;
 shareButton.classList.add('is-tapped');
});
shareButton.addEventListener('animationend',()=>shareButton.classList.remove('is-tapped'));
dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
dialog.addEventListener('dragstart',event=>event.preventDefault());
dialog.addEventListener('contextmenu',event=>event.preventDefault());
document.addEventListener('sticker:placed',sync);
document.addEventListener('sticker:restore',sync);
document.addEventListener('sticker:reorder',sync);
sync();
window.PersonalityCard={classify:Personality.classify,getResult:()=>dialog.open?dialog.dataset.personality:null,setArt:(type,url)=>{if(type in art)art[type]=url;},artSlots:art};
})();
