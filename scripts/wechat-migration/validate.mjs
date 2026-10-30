import fs from 'node:fs/promises';
import path from 'node:path';
import { metadataSchema } from './schema.mjs';
import { hash, identity } from './core.mjs';
const root=path.resolve(process.argv[2]||'migration/local');
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const manifest=await read(path.join(root,'manifest.json'));
const seen=new Set();let failures=0;
for(const row of manifest.records) {
 if(!row.metadata) {console.log(`${row.stable_id}: ${row.state}`);continue;}
 try {
  const dir=path.dirname(path.join(root,row.metadata));
  const m=metadataSchema.parse(await read(path.join(dir,'metadata.json')));
  if(seen.has(m.identity.key)) throw Error('duplicate_identity');seen.add(m.identity.key);
  if(identity(m.source_url,m.identity).stable_id!==m.stable_id) throw Error('identity_mismatch');
  const images=await read(path.join(dir,'images.json'));
  for(const asset of [m.cover_original,...images].filter(a=>a?.file)) {
   const target=path.resolve(dir,asset.file);if(!target.startsWith(dir+path.sep)) throw Error('path_escape');
   if(hash(await fs.readFile(target))!==asset.sha256) throw Error('asset_hash_mismatch');
  }
  if(m.cover) await fs.access(path.join(dir,m.cover));
  if(m.derived.startAt&&m.derived.endAt&&Date.parse(m.derived.endAt)<Date.parse(m.derived.startAt)) throw Error('activity_end_before_start');
  console.log(JSON.stringify({id:m.stable_id,schema:'valid',assets:'verified',review:m.review.status,upload_ready:m.review.status==='approved'&&!!m.type&&m.identity.quality==='wechat_tuple'}));
 } catch(e) {failures++;console.error(row.stable_id,e.message);}
}
if(failures) process.exitCode=1;
