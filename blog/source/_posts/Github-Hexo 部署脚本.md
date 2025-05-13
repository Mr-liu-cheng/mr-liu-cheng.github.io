---
title: Github-Hexo 部署脚本
date: 2025-05-12 14:16:02
updated: 2025-05-12 14:16:02
tags: GitHub-Actions,Hexo
categories: 
  - Hexo
  - [GitHub, Actions]
  - GitHub
    - Actions
keywords: GitHub-Actions,Hexo
description:
---

# 位置

- 根目录，不然是不会有action记录，不会执行
- token方式  ，推荐使用GITHUB_TOKEN
- 分支
- 相对路径： working-directory: blog，一般不用指定，我是因为创建一层父文件夹隔离导致无法正常访问才不得已需要它
- 只要你把 GitHub Actions 的 .yml 文件放在 .github/workflows/ 目录下，GitHub 就会自动识别并执行这个工作流，无论文件名是 deploy1.yml、deploy.yml 还是其他名字。





代码1：旧

```
name: Deploy Hexo to GitHub Pages

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          submodules: false  # 禁用子模块检查

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install
        working-directory: blog

      - name: Install Hexo Git Deployer
        run: |
          npm install hexo-deployer-git --save
          npm install hexo-cli -g
        working-directory: blog

      - name: Clean and Generate Static Files
        run: |
          hexo clean
          hexo generate
        working-directory: blog

      - name: Configure Git
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'

      - name: Deploy to GitHub Pages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          cd blog/public/
          git init
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add -A
          git commit -m "Create by workflows"
          git branch -M gh-pages
          git remote add origin https://x-access-token:${GITHUB_TOKEN}@github.com/Mr-liu-cheng/mr-liu-cheng.github.io.git
          git push origin gh-pages --force
```

代码2：
``` yml
name: Deploy Hexo Blog to GitHub Pages

on:
  push:
    branches:
      - master  # 你是用 master 而不是 main 分支

jobs:
  build-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install Hexo CLI
        run: npm install -g hexo-cli

      - name: Install dependencies
        run: npm install
        working-directory: blog

      - name: Clean old files
        run: hexo clean
        working-directory: blog

      - name: Generate static files
        run: hexo generate
        working-directory: blog

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./blog/public

```




这两种方式都能成功部署 Hexo 到 GitHub Pages，但它们实现机制不同，适用于不同场景。我们可以从**安全性、简洁性、维护性、灵活性**等维度对比，给你明确建议。

---

## ✅ 建议优先使用：**代码2（推荐）**

使用 `peaceiris/actions-gh-pages@v3` 这个 Action 更安全、更简洁，是目前社区中最常用的部署方式。

---

## ✨ 对比分析：

| 比较项     | 代码1（自己写 push 脚本）                         | ✅ 代码2（使用 peaceiris/actions-gh-pages） |
| ------- | ---------------------------------------- | ------------------------------------ |
| **简洁性** | ❌ 手动写 `git init`, `remote`, `push` 等，代码多 | ✅ 封装好了所有逻辑，只需设置参数                    |
| **安全性** | 🔐 需要小心 Token 拼接（可能泄露）                   | ✅ 使用官方方式处理 token，内置防泄露               |
| **维护性** | ❌ 需要自己维护 git 逻辑，容易出错                     | ✅ 官方维护的 Action，可靠稳定                  |
| **兼容性** | ✅ 更灵活（可以用于非 GitHub Pages 部署）             | 🟡 更专注于 GitHub Pages（但这就是你的目标）       |
| **常见性** | ❌ 不利于新人阅读维护                              | ✅ 目前 Hexo + GitHub Pages 最通用写法       |

---

## ✅ 推荐做法：

如果你只是想**把博客部署到 GitHub Pages（gh-pages 分支）**，建议**使用代码2**，维护简单、安全稳定。

---

## ⛳ 如果你未来要部署到其他仓库或服务器：

那可以使用代码1那样的「自定义部署逻辑」，比如部署到其他远程仓库、私服、服务器目录等。

---

需要我给你整理一份更完整的推荐 `deploy.yml` 模板吗？
