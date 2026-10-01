/* A real hierarchy and linear-blend skinning of the supplied illustration.
   Coordinates are pixels of original.png. No generated animation frames. */
export const WIDTH = 1148;
export const HEIGHT = 2188;
export const bones = [
  {name:'身体', parent:-1, rest:[700,1040]},
  {name:'右髋', parent:0, rest:[650,1090]},
  {name:'右膝', parent:1, rest:[540,1300]},
  {name:'右踝', parent:2, rest:[550,1640]},
  {name:'左髋', parent:0, rest:[780,1160]},
  {name:'左膝', parent:4, rest:[735,1500]},
  {name:'左踝', parent:5, rest:[745,1900]},
];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const radians=d=>d*Math.PI/180;

// Three bones per leg: hip -> knee -> ankle. These IDs never exchange.
// Continuous angles stay small so the original oblique drawing stays legible.
export function poseAt(phase, amplitude=1, manual=null) {
  const t=phase*Math.PI*2;
  const swing=Math.sin(t);
  const angles=manual || [0, 4.2*swing, -3.0* Math.sin(t+.55),
    2.2*Math.sin(t+1.0), -4.2*swing, 3.0*Math.sin(t+.55),
    -2.2*Math.sin(t+1.0)];
  const worlds=[];
  for(let i=0;i<bones.length;i++){
    const b=bones[i], a=radians(angles[i]*amplitude);
    if(b.parent<0){
      worlds.push({x:b.rest[0],y:b.rest[1]+(manual?0:2.5*amplitude*Math.sin(2*t)),angle:a});
    }else{
      const p=worlds[b.parent], rp=bones[b.parent].rest;
      const dx=b.rest[0]-rp[0],dy=b.rest[1]-rp[1],c=Math.cos(p.angle),s=Math.sin(p.angle);
      worlds.push({x:p.x+c*dx-s*dy,y:p.y+s*dx+c*dy,angle:p.angle+a});
    }
  }
  return {worlds,angles,phase,amplitude};
}
function splitLine(y){
  const points=[[1050,730],[1200,695],[1370,648],[1540,652],[1700,665],[1810,680],[1910,590],[2188,510]];
  for(let i=1;i<points.length;i++)if(y<=points[i][0]){
    const [y0,x0]=points[i-1],[y1,x1]=points[i];return x0+(x1-x0)*clamp((y-y0)/(y1-y0),0,1);
  }
  return points.at(-1)[1];
}
export function weightsAt(x,y){
  const w=new Float32Array(7);
  // Original clothing and skin remain on one continuous texture/mesh.
  // Blend through the pelvis; there is no cut or alpha replacement at a hem.
  const legs=smooth(1030,1190,y);
  const far=smooth(splitLine(y)-100,splitLine(y)+100,x);
  w[0]=1-legs;
  for(const [fraction,hip,knee,ankle] of [[1-far,1,2,3],[far,4,5,6]]){
    const k=bones[knee].rest[1],a=bones[ankle].rest[1];
    const lower=smooth(k-90,k+100,y), foot=smooth(a-75,a+70,y);
    w[hip]=legs*fraction*(1-lower);
    w[knee]=legs*fraction*lower*(1-foot);
    w[ankle]=legs*fraction*lower*foot;
  }
  return w;
}
export function deformPoint(x,y,weights,pose){
  let ox=0,oy=0;
  for(let i=0;i<bones.length;i++)if(weights[i]>0){
    const b=bones[i],p=pose.worlds[i],dx=x-b.rest[0],dy=y-b.rest[1],c=Math.cos(p.angle),s=Math.sin(p.angle);
    ox+=weights[i]*(p.x+c*dx-s*dy);oy+=weights[i]*(p.y+s*dx+c*dy);
  }
  return [ox,oy];
}
export function makeMesh(columns=72,rows=136){
  const points=[],weights=[],uv=[],indices=[];
  for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){
    const x=c/columns*WIDTH,y=r/rows*HEIGHT;
    points.push(x,y);uv.push(c/columns,r/rows);weights.push(weightsAt(x,y));
  }
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
    const a=r*(columns+1)+c,b=a+1,d=a+columns+1,e=d+1;
    indices.push(a,b,d,b,e,d);
  }
  return {points:new Float32Array(points),weights,uv:new Float32Array(uv),indices:new Uint16Array(indices),columns,rows};
}
export function deformMesh(mesh,pose,output=new Float32Array(mesh.points.length)){
  for(let i=0;i<mesh.weights.length;i++){
    const [x,y]=deformPoint(mesh.points[i*2],mesh.points[i*2+1],mesh.weights[i],pose);
    output[i*2]=x;output[i*2+1]=y;
  }
  return output;
}
