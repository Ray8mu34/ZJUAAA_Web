import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'.design-qa/collection');
const assets=path.join(root,'public/images/home');
const sourceDir=process.argv[2];
async function main(){
  await fs.mkdir(out,{recursive:true});await fs.mkdir(path.join(assets,'thumbs'),{recursive:true});
  const sourceNames=await fs.readdir(sourceDir);
  const only=process.argv.slice(3).map(Number);
  const ids=only.length?only:Array.from({length:20},(_,i)=>i+1);
  for(const n of ids){
    const id=n===1?'day-night':`study-${String(n).padStart(2,'0')}`;
    const svg=path.join(assets,id+'.svg');
    const native=await sharp(svg).png().toBuffer();
    await fs.writeFile(path.join(out,id+'.png'),native);
    await sharp(native).resize(600).webp({quality:85}).toFile(path.join(assets,'thumbs',id+'.webp'));
    const src=sourceNames.find(x=>x.startsWith(String(n).padStart(2,'0')+'_'));
    const original=await sharp(path.join(sourceDir,src)).resize(836,471,{fit:'fill'}).png().toBuffer();
    const result=await sharp(native).resize(836,471).png().toBuffer();
    const labels=Buffer.from(`<svg width="1672" height="34"><rect width="1672" height="34" fill="#fff"/><g font-family="Arial" font-size="18" fill="#111"><text x="12" y="24">${String(n).padStart(2,'0')} — Original</text><text x="848" y="24">Layered SVG</text></g></svg>`);
    await sharp({create:{width:1672,height:505,channels:3,background:'#fff'}}).composite([{input:labels,left:0,top:0},{input:original,left:0,top:34},{input:result,left:836,top:34}]).png().toFile(path.join(out,`compare-${String(n).padStart(2,'0')}.png`));
    console.log(id+' rendered');
  }
  const composite=[];
  for(let n=1;n<=20;n++){
    const id=n===1?'day-night':`study-${String(n).padStart(2,'0')}`;
    const im=await sharp(path.join(out,id+'.png')).resize(400,225).png().toBuffer();
    composite.push({input:im,left:((n-1)%4)*400,top:Math.floor((n-1)/4)*253});
    const label=Buffer.from(`<svg width="400" height="28"><rect width="400" height="28" fill="#152333"/><text x="12" y="20" font-family="Arial" font-size="17" fill="white">${String(n).padStart(2,'0')}</text></svg>`);
    composite.push({input:label,left:((n-1)%4)*400,top:Math.floor((n-1)/4)*253+225});
  }
  await sharp({create:{width:1600,height:1265,channels:3,background:'#152333'}}).composite(composite).png().toFile(path.join(out,'all-artworks.png'));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
