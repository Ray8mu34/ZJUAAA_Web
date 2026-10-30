import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { assertPublicResponseLocation, canonicalUrl, hash, identity, normalizeBackend, parseArticle } from './core.mjs';
import { metadataSchema } from './schema.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const root = path.resolve(opt('--out', 'migration/local'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = file => fs.readFile(file, 'utf8').then(s => JSON.parse(s.replace(/^\uFEFF/, '')));
async function atomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(`${file}.tmp`, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  await fs.rename(`${file}.tmp`, file);
}
async function existing(file) { try { return await json(file); } catch (e) { if(e.code === 'ENOENT') return null; throw e; } }
const assetHosts = new Set(['mmbiz.qpic.cn', 'mmbiz.qlogo.cn', 'mmbiz.qpic.com', 'mp.weixin.qq.com']);
async function fetchBytes(input, asset = false) {
  let u = new URL(input); u.protocol = 'https:';
  for (let redirects = 0; redirects < 4; redirects++) {
    assertPublicResponseLocation(u.toString());
    if (!(asset ? assetHosts.has(u.hostname) : u.hostname === 'mp.weixin.qq.com')) throw new Error('untrusted_redirect');
    const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36', 'Accept-Language': 'zh-CN,zh;q=0.9' } });
    if ([301,302,303,307,308].includes(r.status)) { u = new URL(r.headers.get('location'), u); continue; }
    if (!r.ok) throw new Error(`http_${r.status}`);
    const chunks = []; let size = 0;
    for await (const chunk of r.body) { size += chunk.length; if (size > 20 * 1024 * 1024) throw new Error('response_too_large'); chunks.push(chunk); }
    return { data: Buffer.concat(chunks), content_type: r.headers.get('content-type'), fetched_at: new Date().toISOString() };
  }
  throw new Error('too_many_redirects');
}
async function request(input, asset = false) {
  for(let attempt=0; attempt<3; attempt++) {
    try { return await fetchBytes(input, asset); }
    catch(e) { if(!/http_5\d\d|fetch failed|timeout|aborted/i.test(e.message) || attempt===2) throw e; await sleep((attempt+1)*5000); }
  }
}
async function imageFile(url, dir, stem, prior) {
  if(prior?.file) {
    try { if(hash(await fs.readFile(path.join(dir,prior.file)))===prior.sha256) return {file:prior.file,width:prior.width,height:prior.height,sha256:prior.sha256,bytes:prior.bytes}; } catch { /* Redownload missing assets. */ }
  }
  const { data } = await request(url, true);
  const m = await sharp(data, { limitInputPixels: 50000000 }).metadata();
  if(!['jpeg','png','webp','gif','avif'].includes(m.format)) throw new Error('unsupported_image');
  const file = `${stem}.${m.format === 'jpeg' ? 'jpg' : m.format}`;
  await fs.mkdir(path.dirname(path.join(dir,file)), {recursive:true});
  await fs.writeFile(path.join(dir, file), data);
  return { file, width:m.width, height:m.height, sha256:hash(data), bytes:data.length };
}
async function main() {
  await fs.mkdir(root, {recursive:true});
  const input = opt('--input');
  if (!input) throw new Error('usage: node scripts/wechat-migration/run.mjs --input <json> [--cached-dir <dir>] [--images] [--limit 5]');
  let entries = await json(input);
  if (args.includes('--backend')) {
    const normalized = normalizeBackend(entries, { name:opt('--account'), biz:opt('--biz') });
    await atomic(path.join(root,'backend-normalized.json'), normalized);
    entries = normalized.rows;
  }
  if (!Array.isArray(entries)) throw new Error('input_must_be_array');
  const limit = Number(opt('--limit','5'));
  if(!Number.isInteger(limit) || limit<1 || (limit>5 && !args.includes('--batch'))) throw new Error('sample_limit_max_5_use_batch_after_review');
  const manifestFile = path.join(root,'manifest.json');
  const manifest = await existing(manifestFile) || { schema_version:1, records:[], batch_approved:false };
  let processed = 0;
  for(const entry of entries.slice(0,limit)) {
    const url = canonicalUrl(entry.source_url);
    let record = manifest.records.find(r => r.source_urls.includes(url));
    if(record?.state === 'collected' && (!args.includes('--images') || record.images_downloaded) && !args.includes('--retry')) continue;
    if(processed++) await sleep(3000 + Math.random()*2000);
    try {
      const cached = opt('--cached-dir');
      const html = cached ? await fs.readFile(path.join(cached, `${new URL(url).pathname.split('/').pop()}.html`),'utf8') : (await request(url)).data.toString('utf8');
      const parsed = parseArticle(html,url);
      const id = parsed.identity.quality==='wechat_tuple'?parsed.identity:(entry.identity||parsed.identity);
      record = manifest.records.find(r => r.stable_id === id.stable_id) || record;
      if(record?.state === 'collected' && (!args.includes('--images') || record.images_downloaded) && !args.includes('--retry')) {
        if(!record.source_urls.includes(url)) record.source_urls.push(url);
        await atomic(manifestFile,manifest); continue;
      }
      const dir = path.join(root,'articles',id.stable_id);
      await fs.mkdir(dir,{recursive:true});
      const previous = await existing(path.join(dir,'metadata.json'));
      const warnings=[];
      if(entry.identity?.quality==='wechat_tuple'&&parsed.identity.quality==='wechat_tuple'&&entry.identity.key!==parsed.identity.key) warnings.push('backend_public_identity_mismatch');
      if(entry.title&&entry.title!==parsed.title) warnings.push('listing_public_title_mismatch');
      let cover=null;
      const original_cover_url=entry.cover || parsed.original_cover_url;
      if(original_cover_url) {
        try { cover=await imageFile(original_cover_url,dir,'cover-original',previous?.original_cover_url===original_cover_url?previous?.cover_original:null); }
        catch(e) { warnings.push(`cover:${e.message}`); }
      }
      const images=[];
      const priorImages=await existing(path.join(dir,'images.json'))||[];
      for(const [index,url] of parsed.images.entries()) {
        const priorImage=priorImages.find(i=>i.source_url===url);
        const item={ index:index+1, source_url:url, visual_review:priorImage?.visual_review||'pending',...(priorImage?.visual_reason?{visual_reason:priorImage.visual_reason}:{}) };
        if(args.includes('--images')) {
          try {
            await sleep(700);
            Object.assign(item,await imageFile(url,dir,`images/${String(index+1).padStart(3,'0')}`,priorImages.find(i=>i.source_url===url)));
            item.exclusion_flags=[];
            if(item.width<480 || item.height<240) item.exclusion_flags.push('low_resolution');
            if(item.width/item.height>4 || item.height/item.width>4) item.exclusion_flags.push('extreme_aspect_ratio');
            item.thumbnail=`thumbnails/${String(index+1).padStart(3,'0')}.jpg`;
            await fs.mkdir(path.join(dir,'thumbnails'),{recursive:true});
            await sharp(path.join(dir,item.file)).resize(360,240,{fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg().toFile(path.join(dir,item.thumbnail));
          } catch(e) {item.error=e.message;warnings.push(`image_${index+1}:${e.message}`);}
        } else if(priorImage?.file) Object.assign(item,priorImage);
        images.push(item);
      }
      const digest = entry.digest?.trim() ? entry.digest : parsed.summary;
      const type = previous?.type || entry.type || null;
      const metadata={schema_version:1,stable_id:id.stable_id,identity:id,type,title:parsed.title,published_at:parsed.published_at,
        published_at_source:parsed.published_at_source,summary:digest,summary_source:entry.digest?.trim()?'backend.digest':parsed.summary_source,
        summary_generated:false,source_url:url,source_account:parsed.source_account,author:entry.author||parsed.author,
        original_cover_url,cover:previous?.cover_selection?.method==='visual_review'?previous.cover:(cover?.file||null),
        cover_original:cover,cover_selection:previous?.cover_selection||{method:'original',review_status:'pending'},
        raw:{times:{...parsed.times,...entry.times},backend_digest:entry.digest??null,public_summary:parsed.summary,meta_author:parsed.meta_author,backend_title:entry.listing_source==='public_album'?null:(entry.title??null),album_title:entry.listing_source==='public_album'?entry.title:null,album_cover_url:entry.album_cover_url??null},
        derived:previous?.derived||{startAt:null,endAt:null,locationZh:null,activity_type:null,tags:[],evidence:[]},
        provenance:{method:cached?'http_cached_html':'http',listing_source:entry.listing_source||null,parsed_at:new Date().toISOString(),source_sha256:parsed.source_sha256},
        review:previous?.review||{status:'pending',account_confirmed:false,title_verified:false,date_verified:false,digest_verified:false},warnings};
      if(id.quality!=='wechat_tuple') warnings.push('identity_incomplete');
      if(!metadata.published_at) warnings.push('publish_time_missing');
      if(!metadata.summary?.trim()) warnings.push('summary_missing');
      if(!metadata.cover) warnings.push('cover_missing');
      if(parsed.content.length<100) warnings.push('image_based_body_no_full_text');
      if(!type) warnings.push('type_needs_review');
      metadataSchema.parse(metadata);
      await atomic(path.join(dir,'metadata.json'),metadata);
      await atomic(path.join(dir,'images.json'),images);
      await atomic(path.join(dir,'content.txt'),parsed.content);
      // Only body HTML is retained; scripts, session headers and whole-page runtime are not exported.
      await atomic(path.join(dir,'content.html'),parsed.content_html);
      const next={stable_id:id.stable_id,source_urls:[...new Set([...(record?.source_urls||[]),url])],state:warnings.some(w=>/^(cover:|image_\d+:)/.test(w))?'partial':'collected',images_downloaded:images.every(i=>i.file&&!i.error),review_status:metadata.review.status,metadata:`articles/${id.stable_id}/metadata.json`};
      if(record) Object.assign(record,next); else manifest.records.push(next);
      console.log(JSON.stringify({id:id.stable_id,title:parsed.title,date:parsed.published_at,images:images.length,warnings}));
    } catch(e) {
      const failure={stable_id:record?.stable_id||identity(url).stable_id,source_urls:[url],state:'failed',error:e.message};
      if(record) Object.assign(record,failure); else manifest.records.push(failure);
      await fs.appendFile(path.join(root,'errors.jsonl'),JSON.stringify({at:new Date().toISOString(),source_url:url,error:e.message})+'\n');
      console.log(JSON.stringify(failure));
      if(/captcha|required|rate_limited|http_429|http_403/.test(e.message)) { await atomic(manifestFile,manifest); break; }
    }
    manifest.updated_at=new Date().toISOString();
    await atomic(manifestFile,manifest);
  }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
