// Build responsive edge metadata from original SVG geometry, never raster scanlines.
// Original SVGs stay untouched. Subject paths are excluded from the background continuation.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage();
await fs.mkdir('public/images/home/edges',{recursive:true});
try {
 for(let n=1;n<=20;n++) {
  const id=n===1?'day-night':`study-${String(n).padStart(2,'0')}`;
  const source=await fs.readFile(`public/images/home/${id}.svg`,'utf8');
  const layers=await page.evaluate(source=>{
   function simplify(points) {
    if(points.length<=2) return points;
    const a=points[0],b=points.at(-1),dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
    let far=0,index=0;
    for(let i=1;i<points.length-1;i++) {
     const p=points[i],t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
     const d=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
     if(d>far){far=d;index=i;}
    }
    return far>.1225?[...simplify(points.slice(0,index+1)).slice(0,-1),...simplify(points.slice(index))]:[a,b];
   }
   document.body.innerHTML=source;
   const svg=document.querySelector('svg');
   return [...svg.children].flatMap(layer=>{
    const name=layer.id;
    if(!name || /texture|telescope|observer|mount$|observatory|bridge|building|tree|^sun$|^moon$|planet|crescent/.test(name)) return [];
    const shape=layer.tagName==='path'?layer:layer.querySelector(':scope > path');
    if(!shape) return [];
    const len=shape.getTotalLength(),box=shape.getBBox();
    if(box.y+box.height<470) return [];
    const edges=[]; const points=[];
    const steps=Math.ceil(len/1.5);
    // Preserve exact canvas corners: length sampling alone can cut the final fraction
    // of a pixel off a full-width polygon and expose the layer underneath at y=941.
    const snap=(v,max)=>Math.abs(v-max)<1.5?max:Math.abs(v)<1.5?0:v;
    for(let k=0;k<=steps;k++) {
     const p=shape.getPointAtLength(len*k/steps);
     points.push({x:snap(p.x,1672),y:snap(p.y,941)});
    }
    const simplified=simplify(points);
    let a=simplified[0];
    for(const b of simplified.slice(1)) {
     if(Math.max(a.y,b.y)>=470 && Math.abs(a.y-b.y)>.0001) edges.push([a.x,a.y,b.x,b.y].map(v=>Math.round(v*100)/100));
     a=b;
    }
    const fields=[...layer.querySelectorAll('g[filter] rect')].filter(r=>+r.getAttribute('y')>=350).map(r=>[+r.getAttribute('x'),+r.getAttribute('y'),+r.getAttribute('width'),r.getAttribute('fill')]);
    return [{name,fill:shape.getAttribute('fill'),opacity:+(shape.getAttribute('opacity')||layer.getAttribute('opacity')||1),edges,fields}];
   });
  },source);
  await fs.writeFile(`public/images/home/edges/${id}.json`,JSON.stringify(layers));
  console.log(id,layers.length);
 }
}finally {await browser.close();}
