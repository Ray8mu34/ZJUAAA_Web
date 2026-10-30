// Metadata-only fallback: no article requests, no fabricated summaries.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { hash } from './core.mjs';
import { metadataSchema } from './schema.mjs';
const collection=path.resolve(process.argv[2]||'migration/local/knowledge-collection');
const root=path.join(collection,'staging');
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const save=async(f,v)=>{await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f+'.tmp',JSON.stringify(v,null,2)+'\n');await fs.rename(f+'.tmp',f);};
const inv=await read(path.join(collection,'inventory.json'));
const manifest={schema_version:1,batch_approved:true,scope:'Only 35 selected knowledge articles; local staging only',source_url:inv.source_url,records:[],excluded_count:inv.selection.filter(r=>r.selection==='excluded').length};
for(const entry of inv.selection.filter(r=>r.selection==='include')){
 const dir=path.join(root,'articles',entry.identity.stable_id);await fs.mkdir(dir,{recursive:true});
 const warnings=['article_access_requires_verification','summary_missing','body_not_fetched','album_cover_variant'];
 let previous=null;try{previous=await read(path.join(dir,'metadata.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(previous?.provenance.method!=='public_album'&&previous){
  manifest.records.push({stable_id:previous.stable_id,source_urls:[entry.source_url],state:'collected',metadata:`articles/${previous.stable_id}/metadata.json`,review_status:previous.review.status});continue;
 }
 let cover=previous?.cover_original||null;
 try{
  if(cover&&hash(await fs.readFile(path.join(dir,cover.file)))!==cover.sha256)cover=null;
 }catch{cover=null;}
 if(!cover&&entry.album_cover_url){
  try{
   const u=new URL(entry.album_cover_url);if(u.hostname!=='mmbiz.qpic.cn')throw Error('unexpected_image_host');u.protocol='https:';
   const response=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`http_${response.status}`);
   const data=Buffer.from(await response.arrayBuffer());if(data.length>20*1024*1024)throw Error('image_too_large');
   const m=await sharp(data,{limitInputPixels:50000000}).metadata();if(!['jpeg','png','gif','webp'].includes(m.format))throw Error('unsupported_image');
   const file=`cover-album.${m.format==='jpeg'?'jpg':m.format}`;
   await fs.writeFile(path.join(dir,file),data);cover={file,width:m.width,height:m.height,sha256:hash(data),bytes:data.length};
   await new Promise(r=>setTimeout(r,900));
  }catch(e){warnings.push(`cover:${e.message}`);}
 }
 if(!cover)warnings.push('cover_missing');
 const metadata={schema_version:1,stable_id:entry.identity.stable_id,identity:entry.identity,type:'article',title:entry.title,
  published_at:entry.times.album_create_time?new Date(entry.times.album_create_time*1000).toISOString():null,published_at_source:'public_album.create_time',
  summary:null,summary_source:'unavailable',summary_generated:false,source_url:entry.source_url,source_account:'浙大天协ZJUAAA',author:null,
  original_cover_url:entry.album_cover_url,cover:cover?.file||null,cover_original:cover,
  cover_selection:{method:'original',review_status:'needs_review',source:'public_album.cover_img_1_1',reason:'合集提供的封面缩略版本；尚未取得文章页原始封面'},
  raw:{times:entry.times,backend_digest:null,public_summary:null,meta_author:null,backend_title:null,album_title:entry.title,album_cover_url:entry.album_cover_url},
  derived:{startAt:null,endAt:null,locationZh:null,activity_type:null,tags:[],evidence:[]},
  provenance:{method:'public_album',source_url:inv.source_url,parsed_at:new Date().toISOString(),source_sha256:hash(JSON.stringify(entry))},
  review:{status:'needs_review',account_confirmed:true,title_verified:true,date_verified:false,digest_verified:false,notes:['标题与身份来自公开合集；发布时间为合集显示时间，尚未与详情页时间核对。','摘要与正文未获取，不能把采集状态当作完整审核通过。']},warnings};
 metadataSchema.parse(metadata);await save(path.join(dir,'metadata.json'),metadata);await save(path.join(dir,'images.json'),[]);
 manifest.records.push({stable_id:entry.identity.stable_id,source_urls:[entry.source_url],state:'metadata_only',metadata:`articles/${entry.identity.stable_id}/metadata.json`,images_downloaded:false,review_status:'needs_review'});
 await save(path.join(root,'manifest.json'),manifest);
 console.log(JSON.stringify({title:entry.title,cover:cover?`${cover.width}x${cover.height}`:null,state:'metadata_only'}));
}
