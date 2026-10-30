import { parse, serialize } from 'parse5';
import { createHash } from 'node:crypto';

export const hash = value => createHash('sha256').update(value).digest('hex');
export function assertPublicResponseLocation(url) {
  const u=new URL(url);
  if(u.pathname.includes('wappoc_appmsgcaptcha')) throw new Error('captcha_required');
}
export function nodes(root) { return [root, ...(root.childNodes || []).flatMap(nodes)]; }
export const attr = (node, key) => node?.attrs?.find(a => a.name === key)?.value || '';
export function text(node) {
  if (!node || ['script', 'style', 'noscript', 'svg'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(text).join('') + (/^(p|div|section|br|h[1-6]|li)$/.test(node.tagName) ? '\n' : '');
}
const clean = s => s.replace(/[\u200b\u00a0]/g, ' ').split('\n').map(x => x.trim()).filter(Boolean).join('\n');
const decode = s => text(parse(`<span>${s}</span>`)).trim();
export function canonicalUrl(input) {
  const u = new URL(input.replaceAll('&amp;', '&'));
  if (!['http:', 'https:'].includes(u.protocol) || u.hostname !== 'mp.weixin.qq.com' || !/^\/s(?:\/|$)/.test(u.pathname)) throw new Error('unsupported_article_url');
  u.protocol = 'https:'; u.hash = '';
  for (const key of [...u.searchParams.keys()]) if (!['__biz', 'mid', 'idx', 'sn'].includes(key)) u.searchParams.delete(key);
  return u.toString();
}
function literal(html, name) {
  const match = html.match(new RegExp(`\\b(?:var|let|const)\\s+${name}\\s*=\\s*(?:htmlDecode\\()?(["'])(.*?)\\1`));
  if (!match) return null;
  return decode(match[2].replace(/\\x([a-f\d]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u([a-f\d]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(["'\\])/g, '$1'));
}
export function identity(url, values = {}) {
  const u = new URL(canonicalUrl(url));
  const biz = values.biz || u.searchParams.get('__biz') || null;
  const mid = values.appmsgid || u.searchParams.get('mid') || null;
  const idx = values.itemidx ?? u.searchParams.get('idx');
  const complete = !!(biz && mid && /^\d+$/.test(String(idx)) && Number(idx) > 0);
  const key = complete ? `wechat:${biz}:${mid}:${Number(idx)}` : `url:${canonicalUrl(url)}`;
  return { biz, appmsgid: mid ? String(mid) : null, itemidx: idx ? Number(idx) : null, key, quality: complete ? 'wechat_tuple' : 'provisional_url', stable_id: `wx-${hash(key).slice(0, 24)}` };
}
export function parseArticle(html, sourceUrl) {
  const tree = parse(html), all = nodes(tree);
  const byId = id => all.find(n => attr(n, 'id') === id);
  const meta = key => attr(all.find(n => n.tagName === 'meta' && (attr(n, 'property') === key || attr(n, 'name') === key)), 'content');
  const body = byId('js_content');
  const title = clean(text(byId('activity-name'))) || meta('og:title');
  const content = clean(text(body));
  if (!title || !body || (!content && !nodes(body).some(n => n.tagName === 'img'))) {
    const visible = text(tree);
    throw new Error(/环境异常|完成验证/.test(visible)||/wappoc_appmsgcaptcha/.test(html) ? 'captcha_required' : /频繁|freq control/.test(visible) ? 'rate_limited' : 'article_not_rendered');
  }
  const timestamp = html.match(/(?:publish_time%22%3A|publish_time["']?\s*[:=]\s*["']?)(\d{10})/)?.[1] || literal(html, 'ct');
  const displayDate = html.match(/\bcreate_time:\s*['"](\d{4}-\d{2}-\d{2} \d{2}:\d{2})['"]/)?.[1] || null;
  const published = timestamp && /^\d{10}$/.test(timestamp) ? new Date(Number(timestamp) * 1000).toISOString() : null;
  const images = [...new Set(nodes(body).filter(n => n.tagName === 'img').map(n => attr(n, 'data-src') || attr(n, 'src')).filter(s => /^https?:\/\//.test(s)))];
  return {
    title, summary: literal(html, 'msg_desc') || meta('description') || meta('og:description') || null,
    summary_source: literal(html, 'msg_desc') ? 'public.msg_desc' : 'public.meta.description',
    original_cover_url: meta('og:image') || literal(html, 'msg_cdn_url'),
    author: null,
    meta_author: meta('author') || null,
    source_account: clean(text(byId('js_name'))) || null,
    published_at: published, published_at_source: published ? 'public.publish_time_or_ct' : null,
    times: { public_publish_timestamp: timestamp || null, public_display_date: displayDate },
    identity: identity(sourceUrl, { biz: literal(html, 'biz'), appmsgid: literal(html, 'mid'), itemidx: literal(html, 'idx') }),
    images, content, content_html: serialize(body), source_sha256: hash(html)
  };
}

// Deliberately whitelist article fields. Never persist backend response headers or credentials.
export function normalizeBackend(response, account = {}) {
  if (response.base_resp?.ret && response.base_resp.ret !== 0) throw new Error(`backend_ret_${response.base_resp.ret}`);
  const unpack = v => typeof v === 'string' ? JSON.parse(v) : v;
  const page = unpack(response.publish_page);
  if (!Array.isArray(page?.publish_list)) throw new Error('unsupported_backend_shape');
  const rows = [];
  for (const publication of page.publish_list) {
    const info = unpack(publication.publish_info);
    if (!Array.isArray(info?.appmsgex)) throw new Error('malformed_publish_info');
    for (const a of info.appmsgex) {
      const source_url = canonicalUrl(a.link);
      rows.push({ source_url, source_account: account.name || null, title: a.title || null,
        digest: a.digest ?? null, cover: a.cover || null, author: a.author_name || null,
        identity: identity(source_url, { biz: account.biz, appmsgid: a.appmsgid, itemidx: a.itemidx }),
        times: { create_time: a.create_time ?? null, update_time: a.update_time ?? null, sent_info_time: info.sent_info?.time ?? null } });
    }
  }
  return { total_count: page.total_count, publication_count: page.publish_list.length, rows };
}
