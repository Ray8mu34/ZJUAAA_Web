# 项目结构与内容说明

本文面向开发维护者，用于快速了解 ZJUAAA 官网的技术栈、目录结构、页面模块和数据流。

## 1. 项目定位

本项目是浙江大学学生天文爱好者协会官网与内容管理后台，采用 Next.js App Router 构建。一个仓库同时包含：

- 前台展示页面
- 后台管理页面
- 管理员登录认证
- 内部资料账号密码访问
- 服务端接口
- Prisma + SQLite 数据访问
- 图片、手册和内部文件上传

日常内容更新主要通过后台完成，一般不需要修改源代码。

## 2. 技术栈

前端与服务端：

- Next.js 15
- React 19
- TypeScript
- 原生 CSS，主要集中在 `src/app/globals.css`
- `next/image` 用于固定比例图片和缩略图展示

认证与数据：

- NextAuth v5 beta
- Prisma
- SQLite
- bcryptjs
- 内部资料独立 Cookie 签名认证

内容渲染：

- react-markdown
- gray-matter
- remark-gfm
- remark-math
- rehype-katex
- KaTeX

## 3. 常用命令

```bash
npm run dev                 # 本地开发
npm run build               # 生产构建，包含 prisma generate
npm run start               # 生产启动
npm run db:generate         # 生成 Prisma Client
npm run db:init             # 初始化数据库结构
npm run db:sync             # 同步 Prisma 结构
npm run db:seed-admin       # 创建或重置管理员
npm run db:seed-categories  # 初始化手册栏目
```

## 4. 根目录结构

| 路径 | 说明 |
| --- | --- |
| `src/app` | Next.js App Router 页面、布局和 Route Handlers |
| `src/components/site` | 前台展示组件 |
| `src/components/admin` | 后台管理组件 |
| `src/lib` | 数据库、认证、上传、图片地址、内部资料工具 |
| `prisma/schema.prisma` | 数据模型定义 |
| `scripts` | 数据库初始化、同步和种子脚本 |
| `public` | 静态资源 |
| `uploads` | 本地开发上传目录 |
| `private_uploads` | 默认内部文件上传目录，不应公开托管 |
| `docs` | 项目文档 |

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
| `/admin/admins` | 管理员账号管理 |

## 7. 主要数据模型

| 模型 | 用途 |
| --- | --- |
| `AdminUser` | 管理员账号 |
| `SiteSetting` | 站点基础设置、首页文案、页脚、关于、历届成员等 |
| `MediaAsset` | 媒体库图片记录 |
| `KnowledgePost` | 知识科普卡片 |
| `ActivityNotice` | 社团活动卡片 |
| `AstroPhoto` | 天文摄影作品 |
| `ManualCategory` | 天文手册栏目 |
| `ManualChapter` | 天文手册文章 |
| `InternalFile` | 内部资料下载文件 |
| `PublicityWork` | 宣传部作品 |

## 8. 内容模块关系

知识科普：

- 展示标题、封面、摘要、作者和外部链接。
- 通常跳转到公众号原文。
- 适合作为内容入口，不适合承载长期完整正文库。

社团活动：

- 展示活动标题、封面、摘要、地点、时间和外部链接。
- 适合承接公众号推文、报名页或活动详情页。

天文手册：

- 保存完整 Markdown 正文。
- 支持栏目、文章、目录、公式、图片、封图和批量导入。
- Markdown frontmatter 会被解析为元数据，不会进入正文。

内部资料：

- `/internal` 使用独立账号密码保护，不依赖后台管理员登录态。
- 文件下载服务保存到 `InternalFile`，实际文件放在非公开目录。
- 宣传部作品保存到 `PublicityWork`，图片来自媒体库，前台以 3D 作品墙和时间线展示。

天文摄影：

- 保存作品标题、作者、说明、目标天区、拍摄地点、器材参数和图片。

关于我们：

- 展示社团介绍、照片墙和历届成员。
- 历届成员按年份倒序显示，最新年份在前。

## 9. 图片与文件流转

公开图片上传和访问：

1. 后台上传图片到上传目录。
2. 数据库保存媒体记录和文件路径。
3. 前台通常通过 `/media/...` 使用缩略图、原图或水印变体。

内部文件下载：

1. 后台 `/admin/internal/files` 上传文件。
2. 文件保存到 `INTERNAL_FILE_DIR` 指定目录，默认 `private_uploads/internal-files`。
3. 前台 `/internal/files` 只展示已发布文件。
4. 下载接口会先校验内部资料访问 Cookie，再读取文件。

相关文件：

- `src/lib/uploads.ts`
- `src/lib/image-variants.ts`
- `src/lib/internal-auth.ts`
- `src/lib/internal-storage.ts`
- `src/app/media/[...path]/route.ts`
- `src/app/internal/files/[id]/download/route.ts`

## 10. 认证与权限

后台管理由两层保护：

1. `middleware.ts` 负责路由级拦截和跳转。
2. `src/lib/admin-session.ts` 在后台服务端页面中做兜底校验。

内部资料由独立认证保护：

1. `src/lib/internal-auth.ts` 校验 `INTERNAL_USERNAME` 和 `INTERNAL_PASSWORD`。
2. 登录成功后写入仅限 `/internal` 路径的签名 Cookie。
3. 文件下载接口同样校验该 Cookie。

不要只依赖前端隐藏来保护后台或内部资料内容。

## 11. 维护注意事项

不要随意删除或大改以下文件：

- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/admin-session.ts`
- `src/lib/internal-auth.ts`
- `src/lib/internal-storage.ts`
- `src/lib/db.ts`
- `src/app/media/[...path]/route.ts`
- `prisma/schema.prisma`

修改 `schema.prisma` 后，开发环境和服务器都需要同步数据库结构。
