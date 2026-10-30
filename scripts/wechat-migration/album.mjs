import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { attr, nodes, text, canonicalUrl, identity } from './core.mjs';

export function parseAlbum(html) {
  const all=nodes(parse(html));
  const rows=all.filter(n=>n.tagName==='li'&&attr(n,'data-msgid')).map(n=>{
    const source_url=canonicalUrl(attr(n,'data-link'));
    const timeNode=nodes(n).find(c=>attr(c,'class').split(' ').includes('js_article_create_time'));
    const coverNode=nodes(n).find(c=>attr(c,'class').split(' ').includes('album__item-img'));
    return {title:attr(n,'data-title'),source_url,type:'article',listing_source:'public_album',identity:identity(source_url,{appmsgid:attr(n,'data-msgid'),itemidx:attr(n,'data-itemidx')}),
      times:{album_create_time:Number(text(timeNode).trim())||null},album_cover_url:attr(coverNode,'style').match(/url\((.*?)\)/)?.[1]||null};
  });
  if(!rows.length) throw Error('album_empty_or_blocked');
  const totalValue=html.match(/\barticle_count:\s*['"](\d+)['"]/)?.[1];
  const total=totalValue?Number(totalValue):null;
  const more=html.match(/\bcontinue_flag:\s*['"]([01])['"]/)?.[1];
  if(more===undefined) throw Error('album_pagination_fields_missing');
  return {total,more:more==='1',rows};
}
export function selectArticles(rows) {
  const boundary=rows.findIndex(r=>r.title.includes('2016.10.17')&&r.title.includes('星河耿耿'));
  if(boundary<0) throw Error('user_exclusion_boundary_not_found');
  return rows.map((r,i)=>({...r,selection:i>=boundary?'excluded':(['2247488185','2247487766'].includes(r.identity.appmsgid)?'excluded':'include'),
    exclusion_reason:i>=boundary?'用户确认红框起及以下早期文章已迁移':(['2247488185','2247487766'].includes(r.identity.appmsgid)?'用户确认这篇已迁移':null)}));
}
async function main(){
  const input=process.argv[2];if(!input)throw Error('usage: node album.mjs <public-album-url> [output-directory]');
  const source=new URL(input);if(source.hostname!=='mp.weixin.qq.com'||source.pathname!=='/mp/appmsgalbum')throw Error('invalid_album_url');
  const base=new URL('https://mp.weixin.qq.com/mp/appmsgalbum');
  for(const k of ['__biz','album_id']){const v=source.searchParams.get(k);if(!v)throw Error(`missing_${k}`);base.searchParams.set(k,v);}
  base.searchParams.set('action','getalbum');
  const root=path.resolve(process.argv[3]||'migration/local/knowledge-collection');await fs.mkdir(root,{recursive:true});
  const rows=[],seen=new Set();let cursor=null,total=null,more=true,page=0;
  while(more&&page<20){
    const pageFile=path.join(root,`album-page-${String(++page).padStart(2,'0')}.html`);
    let html;
    try{html=await fs.readFile(pageFile,'utf8');}
    catch(e){
      if(e.code!=='ENOENT')throw e;
      if(page>1)await new Promise(r=>setTimeout(r,3500));
      const u=new URL(base);u.searchParams.set('count','10');
      if(cursor){u.searchParams.set('begin_msgid',cursor.appmsgid);u.searchParams.set('begin_itemidx',String(cursor.itemidx));}
      const response=await fetch(u,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'zh-CN,zh;q=0.9'}});
      if(!response.ok)throw Error(`http_${response.status}`);
      html=await response.text();parseAlbum(html);await fs.writeFile(pageFile,html);
    }
    const parsed=parseAlbum(html);if(total!==null&&parsed.total!==null&&total!==parsed.total)throw Error('album_changed_during_collection');
    if(parsed.total!==null)total=parsed.total;
    if(total===null)throw Error('first_page_total_missing');
    let added=0;for(const r of parsed.rows){if(!seen.has(r.identity.key)){rows.push(r);seen.add(r.identity.key);added++;}}
    if(!added)throw Error('pagination_stalled');
    cursor=parsed.rows.at(-1).identity;more=parsed.more;
    await fs.writeFile(path.join(root,'album-checkpoint.json'),JSON.stringify({page,total,collected:rows.length,next_cursor:cursor,more},null,2));
    console.log(JSON.stringify({page,added,collected:rows.length,total,more}));
  }
  if(more||rows.length!==total)throw Error(`incomplete_album_${rows.length}_of_${total}`);
  const selection=selectArticles(rows);
  await fs.writeFile(path.join(root,'inventory.json'),JSON.stringify({source_url:base.toString(),fetched_at:new Date().toISOString(),total,selection},null,2));
  await fs.writeFile(path.join(root,'input.json'),JSON.stringify(selection.filter(r=>r.selection==='include'),null,2));
  console.log(JSON.stringify({included:selection.filter(r=>r.selection==='include').length,excluded:selection.filter(r=>r.selection==='excluded').length}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
