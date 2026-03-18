# GitHub 上传说明

## 上传什么

上传整个项目源码目录即可，但 `.gitignore` 里列出的内容不会被提交。

现在不会上传的关键内容有：

- `.env`
- `.next`
- `node_modules`
- `public/uploads`
- `prisma/dev.db`

也就是说：

- 代码会上传
- 数据库不会上传
- 后台上传的图片不会上传

---

## 上传前先做什么

在项目根目录打开终端，先看一下状态：

```bash
git status
```

---

## 第一次上传

如果你们还没有初始化 Git：

```bash
git init
git add .
git commit -m "init website project"
```

然后把本地仓库连到 GitHub：

```bash
git remote add origin 你的仓库地址
git branch -M main
git push -u origin main
```

---

## 以后更新上传

以后每次更新只需要：

```bash
git add .
git commit -m "update site content and ui"
git push
```

---

## 仓库地址怎么填

推荐直接用你 GitHub 仓库页面给的地址。

常见是这两种：

```bash
https://github.com/你的用户名/仓库名.git
```

或者

```bash
git@github.com:你的用户名/仓库名.git
```

---

## 注意

不要把这些手动传上去：

- `.env`
- `prisma/dev.db`
- `public/uploads`

这些应该只留在你本地或服务器上。
