import { chromium } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
if(!process.env.HOME_QA_DATABASE_URL) throw new Error('Use an isolated database');
process.env.DATABASE_URL=process.env.HOME_QA_DATABASE_URL;
const db=new PrismaClient(),original=await db.siteSetting.findUniqueOrThrow({where:{id:'site'}});
const browser=await chromium.launch({channel:'msedge'}),page=await browser.newPage({colorScheme:'dark',reducedMotion:'reduce'});
const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(let n=1;n<=20;n++){
  const id=n===1?'day-night':`study-${String(n).padStart(2,'0')}`;
  await db.siteSetting.update({where:{id:'site'},data:{homeStyle:id}});
  for(const [w,h] of [[1440,900],[1920,1080],[390,844],[844,390],[320,568]]){
   await page.setViewportSize({width:w,height:h});await page.goto('http://127.0.0.1:3101/');
   await page.locator('.hero-join[data-edge-ready="true"]').waitFor();
   await page.waitForFunction(()=>document.querySelector('.hero-join').style.getPropertyValue('--edge-width'));
   await page.locator('.home-artwork img').evaluate(im=>im.decode());
   const r=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}};
    const nav=document.querySelector('nav');nav.dataset.identity='same';
    return {hero:rect('.home-artwork'),tail:rect('.hero-join-tail'),title:rect('.scene-title'),main:rect('main'),overflow:document.documentElement.scrollWidth>innerWidth, links:[...nav.querySelectorAll('a')].map(a=>{const r=a.getBoundingClientRect();return {href:a.getAttribute('href'),x:r.x,y:r.y,right:r.right,b:r.bottom}})};
   });
   assert.equal(r.hero.h,h);assert.equal(r.tail.y,h);assert.equal(r.tail.h,w<=800?96:128);assert.equal(r.main.y,h+r.tail.h);assert.equal(r.links.length,8);assert.equal(r.overflow,false);
   assert(r.title.x>=-1&&r.title.right<=w+1&&r.title.y>=0&&r.title.b<=h,`${id} title ${w}`);
   for(const l of r.links)assert(l.x>=-1&&l.right<=w+1&&l.y>=0&&l.b<=h,`${id} link ${w} ${JSON.stringify(l)}`);
   if(n===2) await page.screenshot({path:`.design-qa/v2/main-${w}.png`});
   if(w===1440||w===390) await page.screenshot({path:`.design-qa/v2/${id}-${w===1440?'desktop':'mobile'}.png`});
   await page.evaluate(()=>window.scrollTo({top:innerHeight-80,behavior:'instant'}));
   await page.waitForFunction(()=>document.querySelector('.scene-header').classList.contains('is-pinned'));
   assert.equal(await page.locator('nav').getAttribute('data-identity'),'same');
   assert.equal(await page.locator('.scene-header').evaluate(e=>e.getBoundingClientRect().top),0);
   if(w===1440||w===390)await page.screenshot({path:`.design-qa/v2/seam-${id}-${w}.png`,clip:{x:0,y:0,width:w,height:Math.min(h,340)}});
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.waitForFunction(()=>!document.querySelector('.scene-header').classList.contains('is-pinned'));
   if(n===2){
    await page.getByRole('button',{name:'切换到白天模式'}).click();
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.getByRole('button',{name:'切换到黑夜模式'}).click();
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await page.keyboard.press('Tab');
   }
   results.push({id,w,h,pass:true});
  }
  console.log(id,'5 viewports passed');
 }
 assert.deepEqual(errors,[]);
 for(const w of [1440,390]){
  const tw=w===1440?360:156,th=Math.round(340*tw/w);
  const tiles=await Promise.all(Array.from({length:20},async(_,i)=>({input:await sharp(`.design-qa/v2/seam-${i===0?'day-night':`study-${String(i+1).padStart(2,'0')}`}-${w}.png`).resize(tw,th).png().toBuffer(),left:(i%4)*tw,top:Math.floor(i/4)*th})));
  await sharp({create:{width:tw*4,height:th*5,channels:3,background:'#fff'}}).composite(tiles).png().toFile(`.design-qa/v2/seams-${w}.png`);
 }
 await fs.writeFile('.design-qa/v2/verification.json',JSON.stringify({results,errors},null,2));
}finally{await db.siteSetting.update({where:{id:'site'},data:{homeStyle:original.homeStyle,updatedAt:original.updatedAt}});await db.$disconnect();await browser.close();}
