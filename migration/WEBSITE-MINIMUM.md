# 网站最小迁移字段（核对当前仓库，2026-09-29）

首先区分数据库必填、后台表单必填、公开页面实际使用。采集数据不应为了表单校验编造内容。作者真实姓名不在采集要求中。

## 科普 KnowledgePost

| 字段 | 数据库 / 后台 | 本次迁移处理 |
|---|---|---|
| titleZh | 无默认，新增校验非空 | 必须采集微信标题 |
| slug | 唯一、无默认；新增后台自动生成 | 上传程序由 stable_id 生成，不需要采集 |
| author | String 非 nullable；新增表单 required、服务端非空校验；更新没有非空校验 | 来源可空。staging `author:null`，直接数据库导入转换为 `""`；不推测真实姓名，不用公众号名称冒充作者。通过现有新增表单会被拦截 |
| externalUrl | 可空 | 本次必须：卡片跳公众号，缺失则跳本站详情页 |
| publishedAt | 可空；发布操作为空会补当前时间 | 历史迁移必须保留真实发文时间；不要把录入时间当原始日期 |
| summaryZh | 可空；为空不显示摘要 | 建议采集原 digest；不必生成 |
| coverImagePath | 可空；有占位图 | 建议下载来源封面，上传后映射服务器路径 |
| markdownZh | 默认空字符串 | 已有 externalUrl 时不需要正文，正文仅本地核验/选图 |
| status | 默认 DRAFT | 上传先草稿；要出现在网站上才设 PUBLISHED |
| isFeatured / sortOrder | 默认 false / 0 | 本地展示决策，不从微信猜测 |
| id / createdAt / updatedAt | 自动生成 | 不需要采集，也不要覆盖为发文时间 |

代码依据：`prisma/schema.prisma` KnowledgePost；`src/components/admin/post-editor.tsx`；`src/app/admin/posts/actions.ts`；`src/app/knowledge/page.tsx`。

作者展示不完全一致：科普索引页判空隐藏署名；首页精选及后台列表无条件显示“作者：”；无外链的本站详情也附带作者。本文只调查，不修改网站。如果保持空作者并设置首页精选，建议上传前让相关展示按空值隐藏。

## 活动 ActivityNotice

| 字段 | 数据库 / 后台 | 本次迁移处理 |
|---|---|---|
| titleZh | 无默认；新增校验非空 | 必须 |
| externalUrl | 可空 | 本次必须，否则活动链接指向本页 |
| startAt / endAt | 均可空 | 往期活动必须有真实已结束日期，否则会被当作近期活动；优先采集实际开始日期，结束日期有明确证据才填 |
| isArchived | 默认 false | 往期记录设 true；**这不等于 status=ARCHIVED** |
| status | 默认 DRAFT | 公开往期记录仍须 PUBLISHED；ARCHIVED 状态不会进入页面查询 |
| locationZh | 可空 | 有证据则填；往期列表缺省显示“—” |
| summaryZh / coverImagePath | 可空 | 近期宣传页使用；**当前往期活动列表不展示二者**，仍可保留供未来使用 |
| publishedAt / author / slug / category / tags / activity_type | 模型不存在 | 不向 ActivityNotice 写入这些字段；来源发文时间保留在 staging |
| id / createdAt / updatedAt | 自动生成 | 上传程序处理 |

依据：`prisma/schema.prisma` ActivityNotice；`src/app/admin/activities/actions.ts`；`src/app/activities/page.tsx`；`src/lib/activity-visibility.ts`。

活动归档条件：查询 status=PUBLISHED，且 isArchived=true，且 endAt（优先）或 startAt 早于现在。只有 isArchived 而没有时间仍不会进入往期列表。页面查询目前 take:80，扩展到超过 80 条要另行处理分页，采集脚本不应误以为数据库未写入。

## 最小采集契约

共同：`title`、`source_url`、微信身份三元组 `biz+appmsgid+itemidx`、内容类型（人工确认）。

科普补充：`published_at`；`summary` 和 `cover` 优先原始数据、可缺省。作者可空。

往期活动补充：实际 `startAt`（有结束时间则另存 `endAt`），以及日期证据；`locationZh` 可空。`isArchived` 与 `status` 是上传决策，不是微信原生字段。

正文、正文图、原始时间集合属于核验附件，不是网站上传的最低要求。本文为仓库代码结论，不代表线上部署与本地版本完全一致。
