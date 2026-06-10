# 服务器部署指南

本文面向负责服务器部署和运维的同学。示例以 Ubuntu 22.04、PM2、Nginx、SQLite 为基础。

## 1. 推荐目录结构

```text
/srv/apps/zjuaaa-site                         # 项目代码
/srv/data/zjuaaa-site/dev.db                  # SQLite 数据库
/srv/data/zjuaaa-site/uploads                 # 公开图片上传目录
/srv/data/zjuaaa-site/internal-files          # 内部文件目录
/srv/data/zjuaaa-site/.env                    # 生产环境变量
/srv/backups/zjuaaa-site                      # 备份目录
```

建议把数据库、上传文件、内部文件和 `.env` 放在 `/srv/data`，不要放在会被 Git 更新覆盖的代码目录里。

## 2. 环境要求

- Ubuntu 22.04 LTS
- Node.js 22.x
- npm
- PM2
- Nginx
- sqlite3
- Git

## 3. 首次部署

### 3.1 安装基础软件

```bash
apt update && apt upgrade -y
apt install -y git curl unzip nginx sqlite3
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
```

### 3.2 创建目录

```bash
mkdir -p /srv/apps
mkdir -p /srv/data/zjuaaa-site/uploads
mkdir -p /srv/data/zjuaaa-site/internal-files
mkdir -p /srv/backups/zjuaaa-site
```

### 3.3 拉取代码

```bash
cd /srv/apps
git clone https://github.com/Ray8mu34/ZJUAAA_Web.git zjuaaa-site
cd /srv/apps/zjuaaa-site
```

### 3.4 创建环境变量

先生成随机密钥：

```bash
openssl rand -base64 48
```

创建生产 `.env`：

```bash
cat > /srv/data/zjuaaa-site/.env << 'EOF'
DATABASE_URL="file:/srv/data/zjuaaa-site/dev.db"
AUTH_SECRET="替换为随机密钥"
AUTH_URL="https://zjuaaa.cn"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="替换为初始后台密码"
ADMIN_DISPLAY_NAME="ZJUAAA Admin"

INTERNAL_AUTH_SECRET="替换为另一段随机密钥"
INTERNAL_USERNAME="替换为内部资料账号"
INTERNAL_PASSWORD="替换为内部资料密码"
INTERNAL_FILE_DIR="/srv/data/zjuaaa-site/internal-files"

NODE_ENV="production"
UPLOAD_DIR="/srv/data/zjuaaa-site/uploads"
EOF
```

将代码目录中的 `.env` 链接到数据目录：

```bash
rm -f /srv/apps/zjuaaa-site/.env
ln -s /srv/data/zjuaaa-site/.env /srv/apps/zjuaaa-site/.env
```

### 3.5 安装依赖并初始化数据库

```bash
cd /srv/apps/zjuaaa-site
npm install
npx prisma generate
npx prisma db push --skip-generate
npm run db:seed-admin
npm run db:seed-categories
```

### 3.6 构建并启动

```bash
npm run build
pm2 start npm --name zjuaaa-site -- start
pm2 save
pm2 startup
```

## 4. Nginx 配置

### 4.1 创建站点配置

```bash
cat > /etc/nginx/sites-available/zjuaaa-site << 'EOF'
server {
    listen 80;
    server_name zjuaaa.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name zjuaaa.cn;

    ssl_certificate /etc/letsencrypt/live/zjuaaa.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zjuaaa.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 512M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

启用配置：

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/zjuaaa-site /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4.2 申请 HTTPS 证书

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d zjuaaa.cn
nginx -t
systemctl reload nginx
```

## 5. 防火墙与安全组

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

腾讯云轻量服务器控制台安全组也需要放行：

- 22
- 80
- 443

## 6. 日常更新代码

通用更新命令：

```bash
cd /srv/apps/zjuaaa-site
git pull
npm install
npx prisma generate
npx prisma db push --skip-generate
npm run build
pm2 restart zjuaaa-site
pm2 logs zjuaaa-site --lines 30
```

如果这次代码没有数据库结构变更，`npx prisma db push --skip-generate` 通常不会改变数据库；保留该步骤可以减少遗漏。

## 7. 内部资料相关配置

内部资料功能依赖以下环境变量：

| 变量 | 说明 |
| --- | --- |
| `INTERNAL_AUTH_SECRET` | 内部资料登录 Cookie 签名密钥，建议使用 `openssl rand -base64 48` |
| `INTERNAL_USERNAME` | 内部资料账号 |
| `INTERNAL_PASSWORD` | 内部资料密码 |
| `INTERNAL_FILE_DIR` | 内部文件保存目录，建议 `/srv/data/zjuaaa-site/internal-files` |

更新或首次配置内部资料变量：

```bash
cd /srv/apps/zjuaaa-site
cp .env ".env.bak.$(date +%Y%m%d%H%M%S)"
grep -vE '^(INTERNAL_AUTH_SECRET|INTERNAL_USERNAME|INTERNAL_PASSWORD|INTERNAL_FILE_DIR)=' .env > .env.tmp
cat .env.tmp > .env
rm .env.tmp
cat >> .env <<EOF
INTERNAL_AUTH_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
INTERNAL_USERNAME="替换为内部资料账号"
INTERNAL_PASSWORD="替换为内部资料密码"
INTERNAL_FILE_DIR="/srv/data/zjuaaa-site/internal-files"
EOF
mkdir -p /srv/data/zjuaaa-site/internal-files
pm2 restart zjuaaa-site
```

注意：内部资料账号密码不是后台管理员账号。修改后，已登录的内部资料访问者可能需要重新登录。

## 8. 数据库结构变更

当 `prisma/schema.prisma` 发生变化时，生产环境需要同步数据库结构：

```bash
cd /srv/apps/zjuaaa-site
npx prisma generate
npx prisma db push --skip-generate
npm run build
pm2 restart zjuaaa-site
```

注意：

- `prisma generate` 只生成 Prisma Client。
- `prisma db push` 才会同步数据库结构。
- 如果新增非空字段，最好在 schema 中设置默认值，避免已有数据无法迁移。
- 执行数据库同步前建议先备份。

## 9. 备份与恢复

### 9.1 备份数据库

```bash
cp /srv/data/zjuaaa-site/dev.db /srv/backups/zjuaaa-site/dev-$(date +%F-%H%M).db
```

### 9.2 备份公开上传文件

```bash
rsync -a /srv/data/zjuaaa-site/uploads/ /srv/backups/zjuaaa-site/uploads-$(date +%F-%H%M)/
```

### 9.3 备份内部文件

```bash
rsync -a /srv/data/zjuaaa-site/internal-files/ /srv/backups/zjuaaa-site/internal-files-$(date +%F-%H%M)/
```

### 9.4 恢复数据库

```bash
pm2 stop zjuaaa-site
cp /srv/backups/zjuaaa-site/dev-2026-03-26-1200.db /srv/data/zjuaaa-site/dev.db
pm2 start zjuaaa-site
```

### 9.5 恢复上传文件

```bash
rsync -a /srv/backups/zjuaaa-site/uploads-2026-03-26-1200/ /srv/data/zjuaaa-site/uploads/
rsync -a /srv/backups/zjuaaa-site/internal-files-2026-03-26-1200/ /srv/data/zjuaaa-site/internal-files/
pm2 restart zjuaaa-site
```

## 10. 常用运维命令

查看服务：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs zjuaaa-site --lines 50
pm2 logs zjuaaa-site --err --lines 50
```

重启：

```bash
pm2 restart zjuaaa-site
```

停止：

```bash
pm2 stop zjuaaa-site
```

检查端口：

```bash
ss -tulpn | grep 3000
```

检查 Nginx：

```bash
nginx -t
systemctl status nginx
```

查看 SQLite：

```bash
sqlite3 /srv/data/zjuaaa-site/dev.db
.tables
.schema InternalFile
.schema PublicityWork
.quit
```

## 11. 上线检查清单

- [ ] 首页可以打开。
- [ ] `/admin` 会要求登录。
- [ ] 管理员可以登录后台。
- [ ] 媒体库可以上传图片。
- [ ] 前台图片可以正常显示。
- [ ] 知识科普、活动、摄影、手册页面可以打开。
- [ ] 手册 Markdown 和公式正常渲染。
- [ ] `/internal` 会要求内部账号密码。
- [ ] `/internal/files` 可查看并下载已发布内部文件。
- [ ] `/internal/publicity` 可查看宣传部作品。
- [ ] PM2 服务状态正常。
- [ ] Nginx 配置检查通过。
- [ ] HTTPS 生效。
- [ ] 已完成数据库、公开上传文件和内部文件备份。

## 12. 常见故障排查

| 问题 | 排查方向 |
| --- | --- |
| 页面 500 | 查看 PM2 错误日志，常见原因是数据库字段缺失 |
| 后台登录失败 | 检查 `AUTH_SECRET`、`AUTH_URL`、管理员账号和数据库 |
| 内部资料登录失败 | 检查 `INTERNAL_USERNAME`、`INTERNAL_PASSWORD`、`INTERNAL_AUTH_SECRET` |
| 上传失败 | 检查 `UPLOAD_DIR`、`INTERNAL_FILE_DIR` 权限和 Nginx `client_max_body_size` |
| 图片不显示 | 检查上传目录、文件权限、`/media/...` 路由 |
| 内部文件无法下载 | 检查内部资料是否已登录、文件是否存在、`INTERNAL_FILE_DIR` 是否正确 |
| Nginx 502 | 检查 PM2 是否运行，端口 3000 是否监听 |
| 更新后报 Prisma 错误 | 执行 `npx prisma generate` 和 `npx prisma db push --skip-generate` |
