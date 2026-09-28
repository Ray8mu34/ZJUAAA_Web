import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const label = process.argv[2] || 'current';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Use a simple capture label.');
const remote = process.argv.includes('--reference');
const boundary = process.argv.includes('--boundary');
const statesOnly = process.argv.includes('--states-only');
const origin = remote ? 'https://zjuaaa.cn' : 'http://127.0.0.1:3200';
const output = path.resolve('docs/design-qa', label);
await fs.mkdir(output, {recursive:true});
const browser = await chromium.launch();
const report = [];
const pages = remote ? ['/','/activities','/manual','/contact','/about'] : boundary ? ['/','/knowledge','/activities','/astrophotography','/manual','/about/gallery','/about/members'] : ['/','/knowledge','/activities','/astrophotography','/manual','/manual/observing-0','/manual/observing-0/lesson-0-0','/about','/about/gallery','/about/members','/contact','/join-us','/internal'];
for(const width of remote ? [1440,390] : [1440,900,390]) {
  const context = await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'dark'});
  const page=await context.newPage();
  async function settleImages() {
    await page.evaluate(async()=>{
      await document.fonts.ready;
      document.querySelectorAll('img').forEach(i=>{i.loading='eager';});
      await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))), new Promise(r=>setTimeout(r,8000))]);
    });
  }
  await page.clock.setFixedTime(new Date('2026-09-28T04:00:00Z'));
  for(const route of statesOnly ? [] : pages) {
    const response=await page.goto(origin+route,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{
      await document.fonts.ready;
      for(let y=0;y<document.body.scrollHeight;y+=600) {window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}
      await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))]);
      window.scrollTo(0,0);
    });
    const name=route==='/'?'home':route.slice(1).replaceAll('/','-');
    await page.screenshot({path:path.join(output,`${name}-${width}.png`),fullPage:true,animations:'disabled'});
    report.push({route,width,status:response.status(),...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.currentSrc)}))});
  }
  if(!remote && !boundary && !statesOnly) {
    await page.goto(origin+'/knowledge?q=不存在的观测目标',{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(output,`knowledge-empty-${width}.png`),fullPage:true});
    await page.goto(origin+'/manual/observing-5',{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(output,`manual-empty-${width}.png`),fullPage:true});
    await page.goto(origin+'/knowledge',{waitUntil:'networkidle'});
    await page.evaluate(()=>localStorage.setItem('zjuaaa-theme','light'));
    await page.reload({waitUntil:'networkidle'});
    await page.screenshot({path:path.join(output,`knowledge-light-${width}.png`),fullPage:true});
  }
  if(statesOnly) {
    await page.goto(origin+'/internal');
    await page.getByLabel('账号',{exact:true}).fill('design');
    await page.getByLabel('密码',{exact:true}).fill('design-qa-only');
    await page.getByRole('button',{name:'登录',exact:true}).click();
    await page.locator('.internal-module-card').first().waitFor();
    for(const route of ['/internal','/internal/files','/internal/publicity','/internal/stories']) {
      await page.goto(origin+route,{waitUntil:'networkidle'});
      await settleImages();
      await page.screenshot({path:path.join(output,`${route.slice(1).replaceAll('/','-')}-${width}.png`),fullPage:true});
    }
    await page.goto(origin+'/activities',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'下一个活动'}).click();
    await settleImages();
    await page.screenshot({path:path.join(output,`activities-long-${width}.png`),fullPage:true});
    await page.goto(origin+'/astrophotography',{waitUntil:'networkidle'});
    await page.locator('.astro-gallery-item').first().click();
    await settleImages();
    await page.screenshot({path:path.join(output,`photo-dialog-${width}.png`),fullPage:true});
    for(const route of ['/activities','/manual','/contact','/manual/observing-0/lesson-0-0']) {
      await page.goto(origin+route,{waitUntil:'networkidle'});
      await page.evaluate(()=>localStorage.setItem('zjuaaa-theme','light'));
      await page.reload({waitUntil:'networkidle'});
      await settleImages();
      await page.screenshot({path:path.join(output,`${route.slice(1).replaceAll('/','-')}-light-${width}.png`),fullPage:true});
    }
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
const captures=[];
for(const filename of (await fs.readdir(output)).filter(f=>f.endsWith('.png'))) {
  const {width,height}=await sharp(path.join(output,filename)).metadata();
  const expectedWidth=Number(filename.match(/-(\d+)\.png$/)[1]);
  captures.push({filename,width,height,expectedWidth});
}
await fs.writeFile(path.join(output,'captures.json'),JSON.stringify(captures,null,2));
console.log(`Saved ${captures.length} full-page captures to ${output}`);
if(report.some(r=>r.status!==200||r.overflow||r.brokenImages.length)||captures.some(c=>c.width!==c.expectedWidth)) { console.error('Inspect report.json and captures.json for layout or media failures.');process.exitCode=1; }
