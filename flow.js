(()=>{
'use strict';
function scale(){
 const value=Math.min(innerWidth/1080,innerHeight/1920);
 document.body.style.setProperty('--scale',String(value));
}
scale();
addEventListener('resize',scale,{passive:true});
document.querySelector('.home-button').addEventListener('click',()=>{
 document.body.dataset.screen='selection';
});
})();
