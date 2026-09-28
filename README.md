# ZJUAAA Site

浙江大学学生天文爱好者协会官网与内容管理后台，基于 Next.js App Router、Prisma 和 SQLite。

## 快速启动

```bash
npm install
cp .env.example .env
npm run db:init
npm run db:seed-admin
npm run db:seed-categories
npm run dev
```

本地打开 `http://localhost:3000`，后台入口是 `/admin`。

`.env.example` 已包含上传目录与日志目录示例：

- `UPLOAD_DIR`：公开媒体文件目录
- `INTERNAL_FILE_DIR`：内部资料文件目录
- `AUDIT_LOG_DIR`：管理员操作日志与内部资料下载日志目录

## 常用检查

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

只读运维检查：

```bash
npm run ops:preflight
npm run ops:scan-orphan-uploads
npm run ops:summarize-downloads
```

完整部署说明见 `docs/deployment-guide.md`。

## Design QA

`npm run design:qa` 会重建独立的开发验收数据库并在 `http://127.0.0.1:3200` 启动。
数据、上传文件、日志与构建缓存均位于 `.design-qa/`，不使用 `.env` 的数据库地址。
完整数据、空状态、少量数据、截图和测试方法见 [设计验收记录](docs/design-qa/README.md)。
