---
title: GitHub action 自动发布博客
date: 2025-05-12 14:16:02
updated: 2025-05-12 14:16:02
tags: GitHub Actions
categories: GitHub Actions
keywords: GitHub Actions
description:
---

完整推荐如下：

✅ 推荐版本（添加 clean、修正路径）

name: Deploy Hexo Blog to GitHub Pages

on:
  push:
    branches:
      - master

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

      - name: Clean previous builds
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

🔍 hexo deploy 是否还需要？

不需要！因为：
	•	hexo deploy 是调用 hexo-deployer-git 插件把 public 推到 GitHub。
	•	你已经使用了 peaceiris/actions-gh-pages，它更灵活稳定，也是 GitHub 官方推荐方式之一。
	•	所以你可以直接省略 hexo deploy，让 Actions 帮你部署更好。

是否需要我帮你配置一个同时部署文章和运行本地预览的 dev 构建方案？或者加上自动评论等插件支持？


你在 GitHub 仓库里看不到 public/ 文件夹 是正常的，因为：

1. public/ 是 Hexo 生成的构建产物，只存在于 GitHub Actions 的临时 Runner 中

	•	当你 push 到 master 分支时，GitHub Actions 会：
	•	克隆你的代码（含 blog/ 目录）
	•	安装依赖、执行 hexo generate，生成 public/ 静态页面
	•	将 public/ 目录上传到 gh-pages 分支（用于 GitHub Pages 托管）

	这些操作在 GitHub Actions 的临时环境中进行，不会提交 public/ 到 master 分支

2. 为什么不把 public/ 提交到源码里？

这是最佳实践。因为：
	•	public/ 是构建产物，自动生成的
	•	提交构建产物到源码分支（如 master）会让 repo 变得臃肿，历史记录难管理
	•	CI/CD 工具（如 GitHub Actions）已经可以自动构建和发布

3. 你可以在哪里看到生成后的 public 内容？

在 GitHub 仓库的 gh-pages 分支！

地址格式一般是：

https://github.com/你的用户名/你的仓库名/tree/gh-pages

比如：

https://github.com/mr-liu-cheng/mr-liu-cheng.github.io/tree/gh-pages

那里的文件内容就是 hexo generate 后的 public/ 文件。

4. 如果你非要在本地看到 public/？

可以本地跑：

cd blog
hexo clean
hexo g

然后就能在 blog/public/ 中看到生成的 HTML 静态页面。

总结：

问题	原因
GitHub 仓库里没有 public/	它是构建产物，只生成在 GitHub Actions 的临时环境中
构建后的页面在哪？	在 gh-pages 分支上，GitHub Pages 用来展示
本地要看 public/？	自己本地运行 hexo generate 即可

需要我帮你配置自动预览或访问地址验证一下部署成功了吗？




覆盖分支提交


你说的“原来的文件被清空了”，是指 GitHub 仓库中的文件，被 GitHub Actions 的部署流程替换/清空了，这确实是有可能的。

我们来详细分析下原因：

1. 你使用的是 peaceiris/actions-gh-pages

它的行为是：
部署时会把 gh-pages 分支内容全部清空，然后用你指定的 publish_dir 中的内容覆盖并提交。

也就是说，它不是“追加”，是替换整个 gh-pages 分支，用于 GitHub Pages 展示静态网站。





配置部署檢查：

最后确认几点：

	•	你的 Hexo 配置文件 _config.yml、source/ 等确实都在 blog/ 中
	•	deploy.yml 脚本中所有 Hexo 命令的 working-directory 都是 blog
	•	publish_dir 是 ./blog/public

部署完成后，可以访问 GitHub Pages 设置页面确认是否启用了 GitHub Pages，并且指向了 gh-pages 分支。
