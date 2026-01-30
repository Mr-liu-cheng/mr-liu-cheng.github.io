---
title: GitHub Actions部署流程
date: 2025-05-08 14:16:02
updated: 2025-01-08 14:16:02
tags: [GitHub,Actions]
categories: [GitHub,Actions]
keywords: [GitHub,Actions]
description:
---
我们来逐步**解读你提供的 GitHub Actions 自动部署 Hexo 博客的完整脚本**，帮助你理解每一步在干什么、为什么需要它：

---

### 🧾 YAML 脚本结构快速回顾

```yaml
name: Deploy Hexo to GitHub Pages

on:
  push:
    branches:
      - master
```

#### ✅ 含义：

* `name`: 工作流的名称，显示在 GitHub Actions 页中。
* `on.push.branches`: 表示当你向 `master` 分支推送代码时，会自动触发这个部署工作流。

---

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

#### ✅ 含义：

* 定义了一个名为 `build` 的任务（job）
* `runs-on: ubuntu-latest` 表示 GitHub 提供的云服务器上使用最新的 Ubuntu 系统执行任务

---

### 🚀 核心步骤一览

---

#### 1️⃣ 获取仓库代码

```yaml
- name: Checkout repository
  uses: actions/checkout@v2
```

✅ 使用官方的 `checkout` Action 把当前仓库的源码拉下来。

---

#### 2️⃣ 设置 Node.js 环境

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v2
  with:
    node-version: '20'
```

✅ 安装指定版本的 Node.js 环境，因为 Hexo 是基于 Node.js 的静态站点生成器。

---

#### 3️⃣ 安装依赖

```yaml
- name: Install Dependencies
  run: npm install
```

✅ 安装你 `package.json` 中定义的所有 Hexo 插件、主题依赖（比如主题支持的 `hexo-renderer-*`、`hexo-generator-*` 等）。

---

#### 4️⃣ 安装部署插件和 Hexo CLI

```yaml
- name: Install Hexo Git Deployer
  run: |
    npm install hexo-deployer-git --save
    npm install hexo-cli -g
```

✅ `hexo-deployer-git`: 用于将生成的静态文件部署到 GitHub Pages
✅ `hexo-cli -g`: 全局安装 Hexo 命令行工具，后面需要执行 `hexo generate` 命令

---

#### 5️⃣ 生成静态页面

```yaml
- name: Clean and Generate Static Files
  run: |
    hexo clean
    hexo generate
```

✅ `hexo clean`: 清理之前生成的 `public/`
✅ `hexo generate`: 将 Markdown 和配置转化为静态网站内容，放入 `public/` 文件夹

---

#### 6️⃣ 配置 Git 信息（用于提交）

```yaml
- name: Configure Git
  run: |
    git config --global user.name 'github-actions[bot]'
    git config --global user.email 'github-actions[bot]@users.noreply.github.com'
```

✅ 配置 Git 用户信息，避免提交时报错。

---

#### 7️⃣ 推送到 GitHub Pages

```yaml
- name: Deploy to GitHub Pages
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    cd public/
    git init
    git add -A
    git commit -m "Create by workflows"
    git remote add origin https://${{ secrets.GH_TOKEN }}@github.com/Mr-liu-cheng/mr-liu-cheng.github.io.git
    git push origin HEAD:gh-pages -f
```

✅ 这段代码作用：

* 进入 Hexo 生成的 `public/` 静态目录
* 初始化 Git 仓库
* 用你设置的 `GH_TOKEN`（GitHub Token）认证身份
* 将 `public/` 目录的内容强制推送到部署仓库（`gh-pages` 分支）

这样 GitHub Pages 就可以用 `gh-pages` 分支中的内容部署网页。

---

### 🔒 `GH_TOKEN` 是干什么用的？

这是一个 **私密令牌（Personal Access Token）**，用于允许 GitHub Actions 自动推送内容到仓库。

你需要在源仓库的 **Settings > Secrets** 中添加：

* 名称：`GH_TOKEN`
* 内容：GitHub PAT，要求权限包含：`repo`（公开仓库也可不选）

---

### ✅ 总结：这个 Actions 脚本做了什么？

简要流程如下：

```
你 git push 文章 --> GitHub 触发 Action --> 自动安装依赖并构建静态网站 --> 自动部署 public/ 到 gh-pages
```

📌 **结果：你写完文章推送后，网页几秒后自动更新，不再需要本地执行 `hexo deploy` 命令。**

---

是否需要我帮你生成一个带图标徽章的 README 标明“本项目使用 GitHub Actions 自动部署”？
