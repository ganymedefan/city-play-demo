import {WIDTH,HEIGHT,bones,poseAt,makeMesh,deformMesh} from './rig-core.js';
const $=id=>document.getElementById(id);
const canvas=$('art'),overlay=$('bones'),ctx=overlay.getContext('2d');
const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,preserveDrawingBuffer:true});
let playing=true,phase=0,manual=null,last=performance.now();
const mesh=makeMesh(),positions=new Float32Array(mesh.points.length);
const vertex=`attribute vec2 a_position;attribute vec2 a_uv;varying vec2 v_uv;uniform vec2 u_size;void main(){vec2 p=a_position/u_size;gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0,1);v_uv=a_uv;}`;
const fragment=`precision mediump float;varying vec2 v_uv;uniform sampler2D u_image;void main(){gl_FragColor=texture2D(u_image,v_uv);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function buffer(name,data,usage){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,usage);const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);return b;}
let program,positionBuffer;
function init(image){
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  positionBuffer=buffer('a_position',positions,gl.DYNAMIC_DRAW);buffer('a_uv',mesh.uv,gl.STATIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform2f(gl.getUniformLocation(program,'u_size'),WIDTH,HEIGHT);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  document.body.dataset.rigReady='true';$('status').textContent='7 个骨骼节点 · 连续网格绑定 · 原图贴图';requestAnimationFrame(tick);
}
function drawBones(pose){
  ctx.clearRect(0,0,overlay.width,overlay.height);if(!$('show-bones').checked)return;
  ctx.save();ctx.scale(overlay.width/WIDTH,overlay.height/HEIGHT);ctx.lineCap='round';ctx.lineWidth=6;
  for(const [chain,color,tip] of [[[1,2,3],'#ed7153',[430,1780]],[[4,5,6],'#287eff',[735,2080]]]){
    ctx.strokeStyle=color;ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<chain.length;i++){const p=pose.worlds[chain[i]];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();
    const id=chain.at(-1),p=pose.worlds[id],r=bones[id].rest,c=Math.cos(p.angle),s=Math.sin(p.angle),dx=tip[0]-r[0],dy=tip[1]-r[1];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+c*dx-s*dy,p.y+s*dx+c*dy);ctx.stroke();
    for(const id of chain){const p=pose.worlds[id];ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;}
  }ctx.restore();
}
function tick(now){
  const dt=Math.min(100,now-last);last=now;
  if(playing && !document.hidden){phase=(phase+dt/Number($('speed').value))%1;$('phase').value=Math.round(phase*1000);}
  const amplitude=Number($('amplitude').value)/100;
  const pose=poseAt(phase,manual?1:amplitude,manual);deformMesh(mesh,pose,positions);
  gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);drawBones(pose);
  $('phase-value').textContent=Math.round(phase*100)+'%';document.body.dataset.phase=phase.toFixed(4);document.body.dataset.mode=manual?'manual-joint':playing?'playing':'paused';
  requestAnimationFrame(tick);
}
function setPlaying(value){playing=value;$('play').textContent=value?'暂停':'播放';}
$('play').onclick=()=>{manual=null;setPlaying(!playing);};
$('phase').oninput=()=>{manual=null;setPlaying(false);phase=Number($('phase').value)/1000;};
$('rest').onclick=()=>{manual=Array(7).fill(0);setPlaying(false);$('joint-angle').value=0;$('joint-value').textContent='0°';};
$('resume').onclick=()=>{manual=null;$('joint-angle').value=0;$('joint-value').textContent='0°';setPlaying(true);};
$('amplitude').oninput=()=>{$('amplitude-value').textContent=Number($('amplitude').value)===0?'静止':Number($('amplitude').value)<=70?'小':'较明显';};
$('speed').oninput=()=>{$('speed-value').textContent=(Number($('speed').value)/1000).toFixed(1)+' 秒';};
$('poster').onchange=()=>{$('view').classList.toggle('poster',$('poster').checked);};
function manualJoint(){manual=Array(7).fill(0);manual[Number($('joint').value)]=Number($('joint-angle').value);setPlaying(false);$('joint-value').textContent=$('joint-angle').value+'°';}
$('joint-angle').oninput=manualJoint;$('joint').onchange=manualJoint;
if(!gl){$('status').textContent='当前浏览器无法启用 WebGL';$('status').classList.add('error');}
else{const image=new Image();image.onload=()=>{try{init(image);}catch(e){$('status').textContent=e.message;$('status').classList.add('error');console.error(e);}};image.onerror=()=>{$('status').textContent='原画加载失败';};image.src='original.png';}
