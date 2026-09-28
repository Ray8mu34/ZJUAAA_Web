# 视觉验收环境

## 启动与恢复

项目依赖已安装后，在仓库根目录执行（原生 Windows / PowerShell，Node 24）：

```powershell
npm run design:qa
```

打开 http://127.0.0.1:3200 。此命令每次恢复丰富数据并启动 Next 开发服务器。首次运行需联网，按来源清单下载公开美术素材到本地忽略目录；之后复用缓存。素材下载完成后才重建 QA 数据库。

```powershell
npm run design:qa:seed                  # 只重建丰富数据
npm run design:qa:seed -- --empty       # 空集合
npm run design:qa:seed -- --sparse      # 少量内容
npm run design:qa:serve                 # 启动，保留当前 QA 数据
npm run design:qa:test                 # 对 QA 环境运行全部 Playwright 测试
npm run design:qa:build                # 用 QA 数据验生产构建，输出也隔离
npm run design:qa:capture -- review     # 统一完整页面截图
npm run design:qa:capture -- states --states-only
npm run design:qa:capture -- empty --boundary
```

切换数据前先结束正在运行的截图或测试。结束后用 `npm run design:qa:seed` 恢复丰富数据。服务器可以保持运行；seed 仅作用于固定的 QA 数据库。`--boundary` 用于 empty/sparse，避免访问不存在的详情页。

后台及内部资料测试账号均为 `design`，密码 `design-qa-only`。这些凭据只由 QA 启动脚本传给本地子进程，切勿用于部署。

## 隔离与数据范围

- Prisma schema 原样复用，通过现有 Prisma CLI 建库，无业务 mock、无生产数据拷贝。
- 数据库 URL 硬编码解析至仓库 `.design-qa/design.db`，不接受外部数据库参数，不采用调用者或 `.env` 中的 DATABASE_URL。
- `NODE_ENV=production` 时启动/seed 脚本立即拒绝执行。Next 的 QA 分支同时要求 development 与 DESIGN_QA=1。
- 图片、内部文件、审计日志和 Next 缓存都在 `.design-qa/`。不修改 `prisma/dev.db`、生产数据库或已有上传文件。
- 包含 10 篇科普（8+2 分页）、18 张作品（15+3 加载）、7 场活动（近期、未定日期、往年归档）、6 类手册（4/1/0 章节）、4 份可下载文本、4 件宣传作品、4 条故事以及虚构成员分组。
- 标题、摘要、作者与地点具有不同长度，包含缺封面、零章节、多段 Markdown、表格、公式、警示引用和长地址。
- 内容与成员身份均为虚构。天体图片、logo、课程封面和手册封面按清单从用户提供的公开官网下载，并缩小、去除元数据。公开资产来源记录在 `tests/fixtures/design-qa/media-sources.json`。没有抓取用户记录、成员照片、账号或私人资料。
- 图片只用于本仓库开发验收，并非重新授权的通用图片库。QA 展示的封面与虚构文章/栏目并不表示真实生产内容关系。

## 比较条件

完整页面：1440×900、900×900、390×844；device scale 1；Chromium；深色主题、减少动效。额外截图包含浅色主题、无搜索结果、零章节、长活动标题、图片弹窗及已登录内部资料。

QA 中固定服务端活动判断日期为 2026-09-28；浏览器时间同样固定；服务端随机摄影排序关闭，客户端刷新仍可正常使用。内容日期固定为 2026-09-01 及之前。正式环境保留原有时间与随机行为。

截图脚本会等待字体与图片，滚动完整页面触发懒加载，再回到顶部。输出 HTTP/图片/溢出检查报告，并检测 PNG 宽度是否与视口一致，以发现被 overflow:clip 掩盖的布局错误。

Windows 的 Next 图片优化缓存遇到长文件名限制，因此 QA 模式直接使用已经限制尺寸的 fixture 图片；正式环境的图片优化不变。QA 构建缓存独立，避免干扰日常开发。

在 Windows 上运行 `design:qa:build` 前请先结束 QA 开发服务器，避免 Prisma DLL 被占用。构建使用生产编译配置，但输出保留在 `.design-qa/production-build`，不会把 fixture 预渲染内容混入正常 `.next` 发布目录。此构建仅用于验证，不能部署。

## 本地产物

所有截图、评审报告和下载的图片素材均被 Git 忽略，不提交、不随部署分发。截图输出至 docs/design-qa/ 下的指定目录，素材缓存位于 tests/fixtures/design-qa/media/；数据库、上传文件和构建缓存位于 .design-qa/。仓库只保留实现、测试脚本、来源清单与使用说明。
