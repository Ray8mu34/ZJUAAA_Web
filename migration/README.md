# 微信历史迁移：调查与小样本结果

调查日期：2026-09-29（上海时间）。未登录后台，未写入网站数据库，未开始全量迁移。

**先读 [WEBSITE-MINIMUM.md](./WEBSITE-MINIMUM.md)：作者不需要真实姓名，staging 允许 null。** 当前后台新增校验与前台可空展示存在不一致，不能用虚构作者补齐。

## 推荐流程与实测边界

1. **后台结构化列表承担文章发现和原始 metadata 获取。** 自有公众号优先从“已发表”页面实际网络响应取列表，保留 digest、cover、link、appmsgid、itemidx、create_time、update_time、sent_info.time。适配器已支持 `publish_page` → `publish_list[].publish_info` → `appmsgex[]` 的两层 JSON 字符串。不要把草稿/素材库当成已发表历史清单。
2. **公共 HTTP parser 承担已知 URL 的补充验证、正文图和资源下载。** 本机 4/4 样本成功，均不需要 Cookie。本次推荐其作为已知 URL 的第一路径，但不能据此承诺长期稳定。源码不执行页面脚本，也不猜摘要、日期和署名。
3. **browser session 是 HTTP 失败后的备用。** 复用用户已经验证的浏览器，不自动导出 Cookie。不默认安装 reader、不启动带调试端口的新长期浏览器。本次浏览器工具两次失败（inventory fetch failed；打开样本超时），因此不能声称已验证浏览器会话稳定性。
4. **Computer Use 只负责扫码登录、异常页面、少量视觉核验。** 当前样本采集未依赖它。登录/验证码待浏览器连接恢复；验证码不循环重试、不绕过。

后台列表网络接口是网页内部接口，不能当成官方稳定 API 承诺；调用形状应以实际当前会话为准。若已有官方接口权限，可另外核验官方已发布列表的历史覆盖范围；本次没有凭据，也没有验证该路径，不建议为了几十篇迁移新增开发者凭据配置。

后台流程参考记录明确报告 `200013 freq control`。采用串行分页，初始每页 5～20 条、间隔 3～5 秒；这些是保守起点，不是微信保证的安全阈值。[后台 workflow](https://github.com/Alex-giao/wechat-mp-article-list/blob/b96b28e8429be594749072c21a1faa56f7c7fe45/references/backend-workflow.md)

## 开源项目：源码与实际运行评估

下面日期为 GitHub 默认分支最新 commit 日期，不等于功能仍有效的证明。未部署的项目明确标记“未实跑”。没有按 star 排名。

| 项目、审查版本 | 实现、登录、字段 | 本次证据与取舍 |
|---|---|---|
| [Alex-giao/wechat-mp-article-list](https://github.com/Alex-giao/wechat-mp-article-list/tree/b96b28e8429be594749072c21a1faa56f7c7fe45)，2026-06-12 | 仓库只有 README、SKILL、workflow，**没有采集程序源码**。登录公众号后台，从编辑器链接选择对话框观察 searchbiz/appmsgpublish；提供标题、摘要、封面、原文、作者、ID、多个时间字段 | 阅读完整 workflow，包括双层 JSON 和限流错误；作者记录 2026-03-12 的真实验证。本机未实跑后台。适合借鉴响应结构；不照搬 create_time→update_time 作为发布时间的优先级，也不照搬 300～500ms 快速分页 |
| [xiguawang/wechat-reader](https://github.com/xiguawang/wechat-reader/tree/2d590dd74b2f5ce9f2ac716a5b5571df34ea1844)，2026-09-03 | Playwright/CDP attach 或 persistent profile，DOM 抽取标题、content、html、publish_time。已验证会话可提高成功率，但不能消除风控 | 审查 browser_bridge.py / wechat_parser.py：有验证码、限流、空壳页状态；`author` 实际读 #js_name，易混淆公众号与署名；空文字的纯图推文会被判未渲染。浏览器可执行文件发现偏向 macOS/Linux，Windows 不能照 README 假设 setup 必成。未实跑。借鉴状态分类和手动恢复，避免默认长期保存 profile |
| [XUMUMI/read-wechat-articles](https://github.com/XUMUMI/read-wechat-articles/blob/23511a4a1bb5f17b8b9ab8638f498e96ea9cedd0/scripts/read_article.py)，2026-08-07 | Python 标准库 urllib + HTMLParser，无登录，标题/author meta/正文/图片/部分发布时间；8MiB 上限 | 在 dl_env 实跑原始脚本：对同批 HTML 3/4 可解析，纯图纳新报正文缺失；三篇成功结果的 published_at 全 null。另独立实时 HTTP 读取一篇成功，但日期仍 null。author meta 有公众号名，也有宣传署名，不能当真人姓名。不输出 digest、cover、微信 ID。值得借鉴轻量思路、lazy image 处理和大小限制；本项目用 parse5 修复 DOM/纯图片边界并补字段 |
| [ttttmr/Wechat2RSS](https://github.com/ttttmr/Wechat2RSS/tree/0416ecfb73e42e98b88b70e530609c406d3e5e42)，2026-07-31 | 微信读书授权、扫码登录，Docker 软件和授权配置；RSS/JSON Feed、query 提供标题、desc、created、content 等 | 检查仓库树，仅公开部署文档和辅助脚本，不能审计完整采集核心。官方 QA 说明只抓最新20篇、不抓历史，且只收群发；因此不适合本次完整回溯。未购买/部署，不能称“已跑通”。可借鉴指数退避和缓存，不能借鉴未公开核心代码 |

Wechat2RSS 的最近发布 v1.4.9 记录了图文修复，说明仍有维护，但不是完整历史可用性的证明。[changelog](https://wechat2rss.xlab.app/deploy/changelog)；[历史范围与风控](https://wechat2rss.xlab.app/deploy/qa)；[登录机制](https://wechat2rss.xlab.app/deploy/guide)；[输出 API](https://wechat2rss.xlab.app/deploy/api)。

`wechat-reader` 有多个同名仓库，上表明确采用用户描述的 browser-session 项目 xiguawang/wechat-reader，不混用 HTTP 同名项目结论。

## 真实样本

链接来自本地现有数据库，只读取得；数据库原有“测试一下”等标题和录入日期没有带入来源 metadata。四篇公共 HTML 都返回 HTTP 200、真实 js_content，四张原封面和 26 张正文图全部下载并校验 SHA-256。

| 文章 | 公众号时间（Asia/Shanghai） | 正文图 | 情况 |
|---|---|---:|---|
| [天文科普 · 从地心说到日心说](https://mp.weixin.qq.com/s/8AQW4G3XifouZZN-VYI8kg) | 2024-10-13 14:10:11 | 9 | 普通长文、旧文；标题/摘要/封面/正文/微信三元组均取得 |
| [寻找二十八星宿（上）](https://mp.weixin.qq.com/s/Hl9iWa4HnhZKcZkzSBNIXw) | 2024-12-16 14:47:19 | 8 | 主体为7张文字长图；content.txt 仅42字符的署名，**不能当完整正文**。原摘要可用，不做 OCR/摘要生成 |
| [活动预告 · 岁末星约](https://mp.weixin.qq.com/s/vYHR_c7_BIVsRhsWMlFr-Q) | 2025-12-30 18:33:28 | 5 | 活动正文明确：2025-12-31 11:00～13:00；地点“理学部中间空地及各学院展馆”。已存引用证据；原封面文字为主，视觉选择正文第2张望远镜观测照片，保留原封面 |
| [2026春纳 · 往星繁处](https://mp.weixin.qq.com/s/FRqFMjaUMSs7tZLLbufWUg) | 2026-03-09 21:00:21 | 4 | 纯图片正文，content.txt 为空仍为有效文章；纳新是否归作单场活动、具体活动时间尚待分类，不硬填 type |

所有样本账号显示为“浙大天协ZJUAAA”，biz 为 `Mzg5OTI5NjYwNg==`，appmsgid 分别为 2247487766 / 2247488185 / 2247488600 / 2247488609，itemidx 均为1。

验证边界：

- 标题来自正文标题节点；保留原始标题，不使用网站测试标题。
- 页面原始时间戳与页面内嵌日期字符串按上海时区比较，4/4 到分钟一致。**未完成浏览器渲染显示核验**，date_verified=false。
- summary 为公开页面 msg_desc，未截断，summary_generated=false；**尚未拿到后台 digest，不能宣称与后台逐字一致**，digest_verified=false。
- 原始封面下载 4/4，图片26/26；没有以图片URL返回代替真实下载。
- 4条短链目前有效；没有登录态参数。永久可用性无法保证，删除或平台规则变化仍会失效。
- 微信 ID 按 `biz+appmsgid+itemidx` 去重，不能仅用 appmsgid+itemidx 跨账号去重。短链与长链可以通过页面身份合并；本批全是 idx=1，多图文 idx>1 仅有离线测试、无真实样本。
- 本次没有验证码/429/空壳页；缺失字段、HTTP成功但正文无效都不会标成成功。浏览器和后台登录态过期未实测。
- 人工仍需确认内容类型、图片语义、活动日期/地点证据；不知道就留空。所有样本 review=needs_review，未标记可直接上传。

## Staging 契约

```text
migration/
  WEBSITE-MINIMUM.md
  README.md
  sample-input.json                   # 四条公开测试链接，可版本管理
  local/                             # 已 gitignore，不提交素材和会话数据
    manifest.json                    # 每篇状态、路径、URL别名、checkpoint
    errors.jsonl                     # 若发生失败才创建
    backend-normalized.json          # 导入后台响应时生成，字段白名单
    articles/<stable-id>/
      metadata.json
      cover-original.jpg             # 扩展名由实际内容确定，也可png/webp等
      content.txt                    # HTML可提取文字，不保证含长图文字
      content.html                   # js_content 内部片段，核验附件
      images.json                    # URL、尺寸、哈希、下载/视觉状态
      images/001.png                 # --images 开启时下载
      thumbnails/001.jpg
      contact-sheet.jpg
      cover-preview-16x10.jpg         # 仅活动选封面样本有
    probes/                          # 本次无Cookie的HTTP HTML测试快照
    research/                        # 开源脚本对比和结果
```

权威可执行 schema：`scripts/wechat-migration/schema.mjs`（Zod）。metadata 大纲：

```json
{
  "schema_version": 1,
  "stable_id": "wx-<微信三元组SHA256前24位>",
  "identity": {"biz":"...", "appmsgid":"2247488600", "itemidx":1, "key":"wechat:...:2247488600:1", "quality":"wechat_tuple", "stable_id":"wx-..."},
  "type": "activity",
  "title": "活动预告 | 岁末星约",
  "published_at": "2025-12-30T10:33:28.000Z",
  "published_at_source": "public.publish_time_or_ct",
  "summary": "2026，天小协与你全新出发",
  "summary_source": "public.msg_desc",
  "summary_generated": false,
  "source_url": "https://mp.weixin.qq.com/s/vYHR_c7_BIVsRhsWMlFr-Q",
  "source_account": "浙大天协ZJUAAA",
  "author": null,
  "original_cover_url": "<原始封面URL>",
  "cover": "images/002.jpg",
  "cover_original": {"file":"cover-original.jpg", "width":900, "height":383, "sha256":"...", "bytes":27095},
  "cover_selection": {"method":"visual_review", "review_status":"reviewed", "selected_image_index":2, "reason":"望远镜观测场景"},
  "raw": {"times":{"public_publish_timestamp":"1767090808", "public_display_date":"2025-12-30 18:33"}, "backend_digest":null, "public_summary":"2026，天小协与你全新出发", "meta_author":"相约2026的", "backend_title":null},
  "derived": {"startAt":"2025-12-31T11:00:00+08:00", "endAt":"2025-12-31T13:00:00+08:00", "locationZh":"理学部中间空地及各学院展馆", "activity_type":null, "tags":[], "evidence":[{"field":"startAt,endAt", "quote":"2025年12月31日（周三）11:00—13:00", "source":"content.txt"}]},
  "provenance": {"method":"http", "parsed_at":"<ISO8601>", "source_sha256":"..."},
  "review": {"status":"needs_review", "account_confirmed":false, "title_verified":true, "date_verified":false, "digest_verified":false},
  "warnings": []
}
```

示例的占位值仅用于说明；真实数据在 local 中，通过 schema 与资产哈希检查。后台输入时 raw.times 额外保留 create_time、update_time、sent_info_time，各自不覆盖；当前缺失的后台字段不伪造。原始 identity 字符串保留完整，目录哈希只是可移植文件名。没有三元组时 URL hash 仅作 provisional_url，禁止当最终唯一键上传。

所有 cover/images 路径相对文章目录。上传器须先上传资产，再将相对路径换成服务器 coverImagePath。不要将本地路径原样写进数据库。manifest 只表示采集状态，`collected` 不等于通过编辑审核；上传必须检查 review 和字段证据。type 与标签不是微信原生字段，缺失可空。活动的来源发布日期不映射 startAt，也不映射数据库 createdAt。

## 封面策略

默认保存原封面。图片下载后记录尺寸、大小、SHA-256，生成缩略图与联系表。当前实现先标记小于480×240或极端长宽比的候选；二维码、Logo、纯文字、聊天截图、表格、装饰图再由视觉逐张判断。**没有宣称已实现通用 OCR/二维码分类器**。本批联系表已视觉审查，排除了公众号二维码、长图、装饰图，结果在 images.json。

网站首页科普封面约16:10，科普索引封面为弹性高度 cover，当前活动宣传舞台用 contain，往期列表不显示封面。不能强制所有图片永久裁成一种比例。活动样本选择原始观测照片，另生成16:10裁剪预览验证主体仍在；完整图与原封面都保留。没有合适替代图就继续用原封面，不能取正文首图。本次活动首图恰是装饰图。

## 执行与恢复

项目已有 Node 环境；新增显式开发依赖 parse5@7.3.0，复用 sharp 和 zod。没有安装 Python 依赖，第三方脚本验证使用 dl_env。

```powershell
# 小样本默认最多5篇，已完成会跳过；不执行网站上传
node scripts/wechat-migration/run.mjs --input migration/sample-input.json --images

# 本次已有HTTP快照，可离线解析正文；缺失资产仍需网络下载
node scripts/wechat-migration/run.mjs --input migration/sample-input.json --cached-dir migration/local/probes --images

# 合并后台响应（仅支持上述publish_page形状；不接收Cookie/HAR/请求头）
node scripts/wechat-migration/run.mjs --input <仅响应体JSON路径> --backend --account 浙大天协ZJUAAA --biz Mzg5OTI5NjYwNg== --images

node scripts/wechat-migration/contact-sheets.mjs
node scripts/wechat-migration/validate.mjs
node --test scripts/wechat-migration/core.test.mjs
```

测试：4项离线回归通过；四个真实 metadata schema 和全部图像哈希检查通过；重复执行同一输入跳过已完成项。没有验证上传器、后台实时分页或浏览器恢复。

现有下载器串行文章间隔3～5秒，图片间隔700ms；网络/5xx最多3次请求，重试等待5/10秒。403/429/验证码/页面限流立即保存状态并停止本轮。文件通过临时文件rename提交，每篇完成保存manifest；部分图像失败标partial并记录错误，重新运行继续。已校验的已有图片按哈希复用。单进程运行，不同时启动两个采集器写同一输出目录。`--retry` 可重取已完成记录；人工修改的来源字段应先备份，当前仅主动保留 derived/review/封面选择，不能把它当通用双向编辑合并器。

全量步骤（尚未执行）：

1. 恢复浏览器连接、扫码进入公众号后台，确认账号；只读观察真实列表请求。Cookie/token只在会话内存，不粘进脚本、Git或日志，不导出带凭据的HAR。
2. 先导出一页响应并核验与本次四篇字段一致；时间冲突保留原值、人工处理。后台 digest 优先，公开摘要保留作比对。缺摘要不默认调用LLM。
3. 实现/验证后台分页适配器后再跑清单：保存每页已脱敏响应和 `{begin,count,total_count,last_success,seen_keys}`；成功持久化一页才推进begin。分页单位是发布记录，不是appmsgex文章数；多篇消息全部展开，不能以去重后的条数推进游标。遇畸形publish_info整页失败，不静默跳过。
4. 登录失效立即停；200013停并记录冷却时间，重新登录或冷却后从同页继续；若网络/5xx做有上限退避。不要持续刷验证码。结束核对发布记录数、展开文章数、去重数、失败数；total_count不必等于唯一文章数。
5. 清单稳定后，挑需要的几十篇，经过本报告审查再显式放开样本上限：`node scripts/wechat-migration/run.mjs --input <已确认清单.json> --batch --limit 50 --images`。默认不抓全部；只需卡片时可省略--images。URL列表存在不代表已证明后台历史覆盖完整。
6. 按review核验样本和异常项；另一上传器保留 stable_id→网站ID 的幂等映射。科普 slug 可用stable_id，author null转换空字符串；往期活动 status=PUBLISHED且isArchived=true，需真实已结束日期。当前数据库没有微信唯一键，不能仅按标题upsert。

本次交付的是可工作的**已知URL→staging采集器、后台响应离线适配器、校验与选图附件**。后台列表实时获取/分页仍待登录态和真实响应验证，不能称整个自动发现流程已经跑通。
