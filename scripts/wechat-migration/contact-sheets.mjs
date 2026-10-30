import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(process.argv[2] || 'migration/local');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
for(const row of manifest.records.filter(r=>r.metadata)) {
  const dir=path.dirname(path.join(root,row.metadata));
  const m=JSON.parse(await fs.readFile(path.join(dir,'metadata.json'),'utf8'));
  const images=JSON.parse(await fs.readFile(path.join(dir,'images.json'),'utf8'));
  const items=[{file:m.cover_original?.file,label:'original cover'},...images.filter(i=>i.file).map(i=>({file:i.file,label:`${i.index} - ${i.width}x${i.height} ${(i.exclusion_flags||[]).join(',')}`}))].filter(i=>i.file);
  const layers=[];
  for(const [i,item] of items.entries()) {
    const left=(i%3)*380,top=Math.floor(i/3)*280;
    const buf=await sharp(path.join(dir,item.file)).resize(360,240,{fit:'contain',background:'#fff'}).flatten({background:'#fff'}).png().toBuffer();
    layers.push({input:buf,left:left+10,top:top+30});
    layers.push({input:Buffer.from(`<svg width="380" height="28"><text x="10" y="21" font-size="16">${item.label}</text></svg>`),left,top});
  }
  await sharp({create:{width:1140,height:Math.ceil(items.length/3)*280,channels:3,background:'#eee'}}).composite(layers).jpeg().toFile(path.join(dir,'contact-sheet.jpg'));
  console.log(path.join(dir,'contact-sheet.jpg'));
}
