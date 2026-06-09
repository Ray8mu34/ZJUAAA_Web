# 项目结构与内容说明

本文面向开发维护者，用于快速理解 ZJUAAA 官网的技术栈、目录结构、内容模块和数据流。

## 1. 项目定位

本项目是浙江大学学生天文爱好者协会官网与内容管理后台，采用 Next.js App Router 构建。一个仓库同时包含：

- 前台展示页面
- 后台管理页面
- 登录认证
- 服务端接口
- 数据库访问逻辑
- 图片上传、缩略图与水印访问逻辑

网站内容主要由后台维护，日常更新通常不需要修改源码。

## 2. 技术栈

前端与服务端：

- Next.js 15
- React 19
- TypeScript
- 原生 CSS，主要集中在 `src/app/globals.css`
- `next/image` 用于图片展示

认证与数据：

- NextAuth v5 beta
- Prisma
- SQLite
- bcryptjs

内容渲染：

- react-markdown
- remark-gfm
- remark-math
- rehype-katex
- KaTeX

## 3. 常用命令

```bash
npm run dev              # 本地开发
npm run build            # 生产构建，包含 prisma generate
npm run start            # 生产启动
npm run db:generate      # 生成 Prisma Client
npm run db:init          # 初始化数据库结构
npm run db:sync          # 同步 Prisma 结构
npm run db:seed-admin    # 创建或重置管理员
npm run db:seed-categories # 初始化手册栏目
```

## 4. 根目录结构

| 路径 | 说明 |
| --- | --- |
| `src/app` | Next.js App Router 页面、布局和 Route Handlers |
| `src/components/site` | 前台展示组件 |
| `src/components/admin` | 后台管理组件 |
| `src/lib` | 数据库、认证、上传、图片地址等工具 |
| `prisma/schema.prisma` | 数据模型定义 |
| `scripts` | 数据库初始化、同步和种子脚本 |
| `public` | 静态资源 |
| `uploads` | 本地开发上传目录 |
| `docs` | 项目文档 |

## 5. 前台页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页，展示社团形象、摄影精选、近期活动、科普推荐 |
| `/knowledge` | 知识科普列表，主要作为公众号文章入口 |
| `/knowledge/[slug]` | 科普详情或站内兜底详情 |
| `/activities` | 社团活动列表，展示活动入口 |
| `/astrophotography` | 天文摄影作品列表 |
| `/astrophotography/[slug]` | 天文摄影详情 |
| `/manual` | 天文手册栏目总览 |
| `/manual/start` | 手册内容清单 |
| `/manual/[category]` | 某个手册栏目的文章列表 |
| `/manual/[category]/[chapter]` | 手册文章详情 |
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
| `/admin/admins` | 管理员账号管理 |

## 7. Route Handlers 与接口

| 路径 | 说明 |
| --- | --- |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth 认证路由 |
| `src/app/media/[...path]/route.ts` | 图片代理、缩略图、原图和水印处理 |
| `src/app/admin/api/upload/route.ts` | 后台编辑器图片上传 |
| `src/app/admin/api/import/route.ts` | 手册 ZIP 批量导入 |
| `src/app/admin/api/import/categories/route.ts` | 手册栏目列表 API |

## 8. 主要数据模型

| 模型 | 用途 |
| --- | --- |
| `AdminUser` | 管理员账号 |
| `SiteSetting` | 站点基础设置、首页文案、页脚、关于我们、历届成员等 |
| `MediaAsset` | 媒体库图片记录 |
| `KnowledgePost` | 知识科普卡片 |
| `ActivityNotice` | 社团活动卡片 |
| `AstroPhoto` | 天文摄影作品 |
| `ManualCategory` | 天文手册栏目 |
| `ManualChapter` | 天文手册文章 |

## 9. 内容模块关系

知识科普：

- 网站展示标题、封面、摘要和作者。
- 优先跳转公众号原文或外部链接。
- 适合做内容入口，不适合作为长期完整正文库。

社团活动：

- 网站展示活动标题、封面、摘要、地点、时间和外部链接。
- 适合承接公众号推文、报名页或活动详情页。

天文手册：

- 网站保存完整 Markdown 正文。
- 支持栏目、文章、目录、公式、图片和批量导入。
- 适合作为长期资料库。

天文摄影：

- 保存作品标题、作者、说明、目标天区、拍摄地点、器材参数和图片。

关于我们：

- 展示社团介绍、照片墙和历届成员。
- 历届成员在前台按年份倒序显示，最新年份在前。

## 10. 图片与文件流转

图片上传和访问分为几层：

1. 后台上传图片到上传目录。
2. 数据库保存媒体记录和文件路径。
3. 前台展示通常使用 `/media/...` 生成的缩略图或变体地址。
4. 查看原图时使用原图变体，可带水印。

相关文件：

- `src/lib/uploads.ts`
- `src/lib/image-variants.ts`
- `src/app/media/[...path]/route.ts`
- `src/components/site/media-frame.tsx`
- `src/components/admin/media-path-field.tsx`

## 11. 认证与权限

后台访问由两层保护：

1. `middleware.ts` 负责路由级拦截和跳转。
2. `src/lib/admin-session.ts` 在后台服务端页面中做兜底校验。

不要只依赖前端显示隐藏来保护后台页面。

## 12. 维护注意事项

不要随意删除或大改以下文件：

- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/admin-session.ts`
- `src/lib/db.ts`
- `src/app/media/[...path]/route.ts`
- `prisma/schema.prisma`

修改 `schema.prisma` 后，开发环境和服务器都需要同步数据库结构。
