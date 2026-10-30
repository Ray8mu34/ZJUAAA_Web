import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAlbum,selectArticles} from './album.mjs';
const li='<li data-msgid="12" data-itemidx="2" data-title="A &amp; B" data-link="https://mp.weixin.qq.com/s?__biz=abc&amp;mid=12&amp;idx=2&amp;sn=x"><span class="js_article_create_time">1728799811</span></li>';
test('public album parses identity, title and date; later pages can omit total',()=>{
 const first=parseAlbum(li+`<script>article_count: '47', continue_flag: '1'</script>`);
 assert.equal(first.total,47);assert.equal(first.rows[0].title,'A & B');assert.equal(first.rows[0].identity.key,'wechat:abc:12:2');
 const last=parseAlbum(li+`<script>article_count: '', continue_flag: '0', reverse_continue_flag: '1'</script>`);
 assert.equal(last.total,null);assert.equal(last.more,false);
});
test('exclusions use explicit user boundary and IDs, not misleading reprint dates',()=>{
 const row=(title,id)=>({title,identity:{appmsgid:id}});
 const rows=[row('New','1'),row('Known','2247488185'),row('2016.10.17 | 星河耿耿，最闪亮的是哪一颗？','3'),row('2015 old','4')];
 assert.deepEqual(selectArticles(rows).map(r=>r.selection),['include','excluded','excluded','excluded']);
 assert.throws(()=>selectArticles([rows[0]]),/boundary_not_found/);
});
