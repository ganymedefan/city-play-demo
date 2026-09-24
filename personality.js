/* Pure scoring: any three distinct current stickers; order-independent tie break. */
(function(root){
const categories=['eat','coffee','draw','dog','ride','roam','rest'];
const weights={coffee:{coffee:2},riceball:{eat:2},icecream:{eat:2,rest:1},soda:{eat:2,roam:1},camera:{roam:2,draw:1},pen:{draw:2,coffee:1},frisbee:{dog:2,rest:1},headphones:{rest:2,roam:1},sneaker:{roam:2},rope:{dog:2},helmet:{ride:2},skateboard:{ride:2,roam:1}};
function classify(ids){if(ids.length!==3||new Set(ids).size!==3||ids.some(id=>!weights[id]))throw new Error('Select three distinct stickers');const sorted=[...ids].sort();const scores=Object.fromEntries(categories.map(x=>[x,0]));sorted.forEach(id=>Object.entries(weights[id]).forEach(([k,v])=>scores[k]+=v));const max=Math.max(...Object.values(scores));const tied=categories.filter(k=>scores[k]===max);let hash=2166136261;for(const char of sorted.join('|'))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;return{type:tied[hash%tied.length],scores,selected:sorted};}
const api={classify,categories,weights};if(typeof module!=='undefined')module.exports=api;else root.Personality=api;
})(typeof window!=='undefined'?window:globalThis);
