import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPublicResponseLocation,identity,canonicalUrl,normalizeBackend,parseArticle} from './core.mjs';
const url='https://mp.weixin.qq.com/s?__biz=abc&mid=12&idx=2&sn=signature&token=secret';
test('account scoped IDs deduplicate tracking variants, never titles',()=>{
 assert.equal(identity(url).key,'wechat:abc:12:2');
 assert.equal(identity(url).stable_id,identity(url+'&scene=123').stable_id);
 assert.notEqual(identity(url).stable_id,identity(url.replace('abc','other')).stable_id);
 assert.ok(!canonicalUrl(url).includes('secret'));
 assert.equal(identity('https://mp.weixin.qq.com/s/short').quality,'provisional_url');
});
test('nested backend JSON preserves distinct clocks, rejects partial malformed page and strips credentials',()=>{
 const a={title:'题',link:url,digest:'原摘要',appmsgid:12,itemidx:2,create_time:1,update_time:2,token:'secret'};
 const response={token:'secret',publish_page:JSON.stringify({total_count:1,publish_list:[{publish_info:JSON.stringify({sent_info:{time:3},appmsgex:[a]})}]})};
 const result=normalizeBackend(response);
 assert.deepEqual(result.rows[0].times,{create_time:1,update_time:2,sent_info_time:3});
 assert.ok(!JSON.stringify(result).includes('secret'));
 assert.throws(()=>normalizeBackend({base_resp:{ret:200013}}),/200013/);
 assert.throws(()=>normalizeBackend({publish_page:{publish_list:[{publish_info:'{}'}]}}),/malformed/);
});
test('HTML nesting, entities, lazy images, account is not author, UTC dates',()=>{
 const h=`<meta property="og:title" content="A &amp; B"><div id="js_name">公众号</div><div id="js_content"><section><p>正文<br>第二行<img data-src="https://mmbiz.qpic.cn/a?a=1&amp;b=2"></p></section><p>末尾</p></div><script>var biz="abc";var mid="12";var idx="2";var msg_desc=htmlDecode("完整摘要");var publish_time="1728799811";</script>`;
 const p=parseArticle(h,url);
 assert.equal(p.title,'A & B');assert.match(p.content,/末尾/);assert.equal(p.author,null);
 assert.equal(p.images[0],'https://mmbiz.qpic.cn/a?a=1&b=2');assert.equal(p.summary,'完整摘要');
 assert.equal(p.published_at,'2024-10-13T06:10:11.000Z');
});
test('200 OK captcha or empty shell is never success',()=>{
 assert.throws(()=>parseArticle('<html>环境异常 请完成验证</html>',url),/captcha/);
 assert.throws(()=>parseArticle('<title>微信公众平台</title>',url),/not_rendered/);
 assert.throws(()=>assertPublicResponseLocation('https://mp.weixin.qq.com/mp/wappoc_appmsgcaptcha?poc_token=redacted'),/captcha_required/);
 assert.throws(()=>parseArticle('<script src="/mp/wappoc_appmsgcaptcha"></script>',url),/captcha_required/);
});
