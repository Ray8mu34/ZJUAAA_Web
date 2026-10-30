import { z } from 'zod';
const nullableString=z.string().nullable();
const iso=z.string().datetime({offset:true}).nullable();
export const metadataSchema=z.object({
 schema_version:z.literal(1), stable_id:z.string().regex(/^wx-[a-f0-9]{24}$/),
 identity:z.object({biz:nullableString,appmsgid:nullableString,itemidx:z.number().int().positive().nullable(),key:z.string(),quality:z.enum(['wechat_tuple','provisional_url']),stable_id:z.string()}),
 type:z.enum(['article','activity']).nullable(),title:z.string().min(1),published_at:iso,published_at_source:nullableString,
 summary:nullableString,summary_source:z.string(),summary_generated:z.boolean(),source_url:z.string().url(),source_account:nullableString,author:nullableString,
 original_cover_url:nullableString,cover:nullableString,cover_original:z.object({file:z.string(),width:z.number(),height:z.number(),sha256:z.string(),bytes:z.number()}).nullable(),
 cover_selection:z.object({method:z.enum(['original','visual_review']),review_status:z.string()}).passthrough(),
 raw:z.object({times:z.record(z.union([z.string(),z.number(),z.null()])),backend_digest:nullableString,public_summary:nullableString,meta_author:nullableString,backend_title:nullableString,album_title:nullableString.optional(),album_cover_url:nullableString.optional()}),
 derived:z.object({startAt:iso,endAt:iso,locationZh:nullableString,activity_type:nullableString,tags:z.array(z.string()),evidence:z.array(z.object({field:z.string(),quote:z.string(),source:z.string()}).passthrough())}),
 provenance:z.object({method:z.string(),source_sha256:z.string()}).passthrough(),
 review:z.object({status:z.enum(['pending','approved','needs_review']),account_confirmed:z.boolean(),title_verified:z.boolean(),date_verified:z.boolean(),digest_verified:z.boolean()}).passthrough(),
 warnings:z.array(z.string())
}).strict();
