# 项目结构与技术说明

本文面向后续开发维护者，用于快速理解 ZJUAAA 官网的技术栈、目录结构、页面模块、数据流、安全边界和运维入口。部署操作请看 `docs/deployment-guide.md`，后台内容操作请看 `docs/admin-guide.md`。

## 1. 项目定位

本项目是浙江大学学生天文爱好者协会官网与内容管理后台，采用 Next.js App Router 构建。一个仓库同时包含：

- 前台展示页面
- 后台内容管理页面
- 管理员账号与登录认证
- 内部资料账号密码访问
- 文件上传、媒体变体和内部文件下载
- Prisma + SQLite 数据访问
- 生产健康检查、预检脚本和日志汇总脚本

日常内容更新主要通过后台完成，一般不需要修改源代码。代码更新时要优先保护生产数据库、公开上传目录、内部文件目录和日志目录。

## 2. 技术栈

前端与服务端：

- Next.js 15 App Router
- React 19
- TypeScript
- 原生 CSS，拆分在 `src/app/styles/*.css`
- `next/image` 用于图片展示
- Server Actions 与 Route Handlers 混合使用

认证与数据：

- NextAuth v5 beta
- Prisma
- SQLite
- bcryptjs
- 内部资料独立 Cookie 签名认证

内容渲染与媒体：

- react-markdown
- gray-matter
- remark-gfm
- remark-math
- rehype-katex
- KaTeX
- sharp，用于图片校验、缩略图和水印变体
- adm-zip，用于手册 ZIP 批量导入

测试与运维：

- ESLint
- TypeScript typecheck
- Vitest
- Playwright
- PM2 + Nginx 生产运行

## 3. 常用命令

```bash
npm run dev                     # 本地开发
npm run build                   # 生产构建，包含 prisma generate
npm run start                   # 生产启动
npm run lint                    # ESLint 检查
npm run typecheck               # TypeScript 检查
npm run test:unit               # Vitest 单元测试
npm run test:e2e                # Playwright 冒烟测试

npm run ops:preflight           # 生产环境预检
npm run ops:scan-orphan-uploads # 只读扫描未被引用的上传文件
npm run ops:summarize-downloads # 汇总内部资料下载日志

npm run db:generate             # 生成 Prisma Client
npm run db:init                 # 初始化数据库结构
npm run db:sync                 # 同步 Prisma 结构
npm run db:seed-admin           # 创建或重置管理员
npm run db:seed-categories      # 初始化手册栏目
```

说明：

- `npm run build` 已包含 `prisma generate`。
- 没有修改 `prisma/schema.prisma` 时，不需要执行数据库结构同步。
- 生产更新前后建议执行 `npm run ops:preflight` 和 `/api/health` 检查。

## 4. 根目录结构

| 路径 | 说明 |
| --- | --- |
| `src/app` | Next.js App Router 页面、布局、Server Actions 和 Route Handlers |
| `src/app/styles` | 前台、后台、内部页和主题 CSS |
| `src/components/site` | 前台展示组件 |
| `src/components/admin` | 后台管理组件 |
| `src/lib` | 数据库、认证、上传、日志、安全和工具模块 |
| `prisma/schema.prisma` | Prisma 数据模型定义 |
| `scripts` | 数据库、生产预检、上传扫描、日志汇总脚本 |
| `tests` | Vitest 单元测试与 Playwright 冒烟测试 |
| `config` | 可配置安全策略，例如管理员密码最小长度 |
| `public` | 静态资源 |
| `uploads` | 本地开发公开上传目录 |
| `private_uploads` | 默认内部文件目录，不应公开托管 |
| `logs` | 本地默认审计日志和下载日志目录 |
| `docs` | 项目文档 |

生产环境建议把数据库、上传文件、内部文件和日志放在 `/srv/data/zjuaaa-site`，不要放在 Git 管理的代码目录中。

## 5. 前台页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页，展示社团形象、摄影精选、近期活动、科普推荐 |
| `/knowledge` | 知识科普列表，主要作为公众号文章入口 |
| `/knowledge/[slug]` | 科普详情或站内兜底详情 |
| `/activities` | 社团活动列表 |
| `/astrophotography` | 天文摄影作品列表 |
| `/astrophotography/[slug]` | 天文摄影详情 |
| `/manual` | 天文手册栏目总览 |
| `/manual/start` | 手册内容清单 |
| `/manual/[category]` | 某个手册栏目的文章列表 |
| `/manual/[category]/[chapter]` | 手册文章详情 |
| `/internal` | 内部资料入口，需内部账号密码 |
| `/internal/files` | 内部文件下载页 |
| `/internal/publicity` | 宣传部作品集 |
| `/internal/stories` | 内部故事云 |
| `/about` | 关于我们、照片墙、历届成员 |
| `/join-us` | 加入我们 |
| `/contact` | 联系我们 |

## 6. 后台页面

| 路径 | 说明 |
| --- | --- |
| `/admin` | 后台仪表盘 |
| `/admin/login` | 管理员登录 |
| `/admin/site` | 首页与基础站点信息管理 |
| `/admin/settings` | 关于、加入、联系、历届成员、手册入口等设置 |
| `/admin/posts` | 知识科普管理 |
| `/admin/activities` | 社团活动管理 |
| `/admin/gallery` | 天文摄影作品管理 |
| `/admin/manual` | 手册文章管理 |
| `/admin/manual/categories` | 手册栏目管理 |
| `/admin/manual/import` | 手册 ZIP 批量导入 |
| `/admin/media` | 媒体库 |
| `/admin/internal` | 内部资料后台入口 |
| `/admin/internal/files` | 内部下载文件管理 |
| `/admin/internal/publicity` | 宣传部作品管理 |
| `/admin/internal/stories` | 内部故事管理 |
| `/admin/admins` | 管理员账号管理 |

## 7. API 与 Route Handlers

| 路径 | 说明 |
| --- | --- |
| `/api/auth/[...nextauth]` | NextAuth 登录认证接口 |
| `/api/health` | 健康检查，校验数据库连接并返回上传目录、内部文件目录 |
| `/media/[...path]` | 公开上传图片读取、缩略图和水印变体 |
| `/admin/api/media` | 后台媒体库上传接口 |
| `/admin/api/upload` | 后台编辑器图片上传接口 |
| `/admin/api/import` | 手册 ZIP 批量导入接口 |
| `/admin/api/import/categories` | 手册导入栏目辅助接口 |
| `/admin/api/media/search` | 后台媒体搜索接口 |
| `/internal/files/[id]/download` | 内部文件下载接口，需要内部资料 Cookie |

## 8. 主要数据模型

| 模型 | 用途 |
| --- | --- |
| `AdminUser` | 管理员账号、启用状态、最后登录时间 |
| `SiteSetting` | 站点基础设置、首页文案、页脚、关于、照片墙、历届成员等 |
| `MediaAsset` | 媒体库图片记录 |
| `KnowledgePost` | 知识科普卡片与站内 Markdown |
| `ActivityNotice` | 社团活动卡片 |
| `AstroPhoto` | 天文摄影作品 |
| `ManualCategory` | 天文手册栏目 |
| `ManualChapter` | 天文手册文章 |
| `InternalFile` | 内部资料下载文件 |
| `PublicityWork` | 宣传部作品 |
| `InternalStory` | 内部故事云内容 |

枚举：

- `AdminStatus`: `ACTIVE`、`DISABLED`
- `ContentStatus`: `DRAFT`、`PUBLISHED`、`ARCHIVED`

## 9. 内容模块关系

知识科普：

- 展示标题、封面、摘要、作者和外部链接。
- 通常跳转到公众号原文。
- 也支持站内 Markdown 兜底详情。

社团活动：

- 展示活动标题、封面、摘要、地点、时间和外部链接。
- 适合承接公众号推文、报名页或活动详情页。

天文手册：

- 保存完整 Markdown 正文。
- 支持栏目、文章、目录、公式、图片、封图和批量导入。
- Markdown frontmatter 会被解析为元数据，不会进入正文。
- ZIP 导入会校验路径穿越、文件数量和未压缩体积。

内部资料：

- `/internal` 使用独立账号密码保护，不依赖后台管理员登录态。
- 文件记录保存到 `InternalFile`，实际文件放在非公开目录。
- 下载接口会先校验内部资料访问 Cookie，再读取文件。
- 下载日志写入 `downloads.jsonl`，可用 `npm run ops:summarize-downloads` 汇总。
- 宣传部作品保存到 `PublicityWork`，图片来自媒体库。
- 内部故事保存到 `InternalStory`，前台以故事云方式展示。

天文摄影：

- 保存作品标题、作者、说明、目标天区、拍摄地点、器材参数和图片。
- 图片路径通常指向媒体库或上传目录。

关于我们：

- 展示社团介绍、照片墙和历届成员。
- 历届成员存储在 `SiteSetting.alumniGroupsJson` 中，按年份倒序显示。
- 年份错误属于内容数据问题，通常在 `/admin/settings` 修正即可。

## 10. 图片与文件流转

公开图片上传：

1. 后台上传图片到 `UPLOAD_DIR`，默认本地 `uploads`。
2. `validateImageFile` 使用扩展名、MIME 和 sharp 元数据校验图片。
3. 数据库保存 `MediaAsset` 记录和 `/uploads/...` 文件路径。
4. 前台通过 `getImageVariantUrl` 把 `/uploads/...` 转成 `/media/uploads/...?variant=...`。
5. `/media/[...path]` 从 `UPLOAD_DIR` 或 `public/uploads` 读取文件。

图片格式与变体：

- 新上传只允许 JPG、PNG、GIF、WebP。
- SVG 不允许作为新图片上传。
- 已存在上传目录中的 SVG 仍可被媒体读取路由按原路径访问。
- `variant=thumb` 会生成 WebP 缩略图。
- `variant=original` 会对可处理图片添加水印。
- 媒体响应带 ETag 和长期缓存头。

内部文件上传与下载：

1. 后台 `/admin/internal/files` 上传内部文件。
2. 文件保存到 `INTERNAL_FILE_DIR` 指定目录，默认 `private_uploads/internal-files`。
3. 数据库保存 `InternalFile` 元数据和 `storagePath`。
4. 前台 `/internal/files` 只展示已发布文件。
5. 下载接口校验内部资料 Cookie，读取文件并写入下载日志。

相关文件：

- `src/lib/uploads.ts`
- `src/lib/upload-validation.ts`
- `src/lib/upload-names.ts`
- `src/lib/image-variants.ts`
- `src/lib/internal-storage.ts`
- `src/app/media/[...path]/route.ts`
- `src/app/internal/files/[id]/download/route.ts`

## 11. 认证、权限与安全边界

后台管理：

- `middleware.ts` 负责路由级拦截和跳转。
- `src/lib/auth.ts` 配置 NextAuth Credentials 登录。
- `src/lib/admin-session.ts` 在后台服务端页面和 Server Actions 中做兜底校验。
- 后台登录失败限流在 `src/lib/login-rate-limit.ts`，为进程内存级别，PM2 重启后会清空。
- 管理员密码最小长度由 `config/admin-security.json` 控制，当前为 12 位。
- `src/lib/admin-security.ts` 防止禁用当前管理员或最后一个启用管理员。

内部资料：

- `src/lib/internal-auth.ts` 校验 `INTERNAL_USERNAME`、`INTERNAL_PASSWORD` 和 `INTERNAL_AUTH_SECRET`。
- 登录成功后写入仅限 `/internal` 路径的签名 Cookie。
- 文件下载接口同样校验该 Cookie。

审计日志：

- `src/lib/audit-log.ts` 写入管理员操作日志 `audit.jsonl`。
- 内部文件下载写入 `downloads.jsonl`。
- 日志目录由 `AUDIT_LOG_DIR` 控制，生产环境应指向持久目录。
- 日志写入是 best-effort，不应阻断后台操作或下载。

不要只依赖前端隐藏来保护后台或内部资料内容。

## 12. 环境变量

常用变量：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | Prisma SQLite 数据库路径 |
| `AUTH_SECRET` | NextAuth 密钥 |
| `NEXTAUTH_SECRET` | NextAuth 兼容密钥，建议与 `AUTH_SECRET` 一致 |
| `NEXTAUTH_URL` | 站点完整 URL |
| `ADMIN_USERNAME` | 初始化管理员用户名 |
| `ADMIN_PASSWORD` | 初始化管理员密码，至少 12 位 |
| `ADMIN_DISPLAY_NAME` | 初始化管理员显示名 |
| `INTERNAL_AUTH_SECRET` | 内部资料 Cookie 签名密钥 |
| `INTERNAL_USERNAME` | 内部资料账号 |
| `INTERNAL_PASSWORD` | 内部资料密码 |
| `UPLOAD_DIR` | 公开上传目录 |
| `INTERNAL_FILE_DIR` | 内部文件目录 |
| `AUDIT_LOG_DIR` | 审计日志和下载日志目录 |

参考 `.env.example`。生产环境不要使用示例占位密钥。

## 13. 运维脚本与健康检查

`scripts/preflight-production.mjs`：

- 读取 `.env` 和当前进程环境变量。
- 检查 `DATABASE_URL`、`AUTH_SECRET`。
- 生产模式下检查内部资料变量、日志目录和占位密钥。
- 检查 `UPLOAD_DIR`、`INTERNAL_FILE_DIR`、`AUDIT_LOG_DIR` 是否存在。
- 检查 `next.config.ts` 中 `bodySizeLimit: "512mb"`。
- 执行一次数据库 `SELECT 1`。

`scripts/scan-orphan-uploads.mjs`：

- 只读扫描 `UPLOAD_DIR`。
- 汇总数据库和 Markdown 中引用的 `/uploads/...`。
- 输出未被引用的上传文件，不会删除任何文件。

`scripts/summarize-download-logs.mjs`：

- 读取 `AUDIT_LOG_DIR/downloads.jsonl`。
- 按状态、日期和文件统计内部下载。

`/api/health`：

- 用于部署后健康检查。
- 成功时返回 `ok: true`、数据库状态、上传目录、内部文件目录和耗时。
- 失败时返回 503。

## 14. 测试覆盖

单元测试：

- `tests/upload-validation.test.ts`：图片校验，包含 SVG 拒绝。
- `tests/upload-names.test.ts`：上传文件名清洗。
- `tests/zip-import-validation.test.ts`：ZIP 导入路径和体积校验。
- `tests/login-rate-limit.test.ts`：后台登录失败限流。
- `tests/admin-security.test.ts`：管理员密码长度和禁用保护。
- `tests/audit-log.test.ts`：审计日志和下载日志。

端到端/冒烟测试：

- `tests/smoke.spec.ts`：后台匿名跳转、公开页面、健康检查、媒体 404、内部下载未授权、SVG 上传拒绝、后台分页页面等。

常用验证组合：

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

有浏览器和本地服务时再跑：

```bash
npm run test:e2e
```

## 15. 维护注意事项

不要随意删除或大改以下文件：

- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/admin-session.ts`
- `src/lib/internal-auth.ts`
- `src/lib/internal-storage.ts`
- `src/lib/db.ts`
- `src/lib/upload-validation.ts`
- `src/lib/audit-log.ts`
- `src/app/media/[...path]/route.ts`
- `src/app/internal/files/[id]/download/route.ts`
- `prisma/schema.prisma`
- `next.config.ts`

修改规则：

- 修改 `prisma/schema.prisma` 后，开发环境和服务器都需要同步数据库结构。
- 修改上传、媒体和内部文件逻辑时，必须确认不会删除或移动现有生产文件。
- 修改认证和后台 Server Actions 时，要考虑旧页面提交可能触发 Next.js Server Action 版本不匹配，部署后建议刷新后台页面。
- 修改上传大小时，要同时检查 `next.config.ts` 和 Nginx `client_max_body_size`。
- 修改日志目录时，要确保 `AUDIT_LOG_DIR` 指向持久目录并具备写入权限。
- 内容数据错误，例如历届成员年份写错，优先通过后台修正，不要直接改数据库。
