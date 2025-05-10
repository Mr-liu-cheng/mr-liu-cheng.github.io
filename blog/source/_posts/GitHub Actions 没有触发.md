谢谢提供路径信息。

你的 GitHub Actions 没有触发的**核心原因**在于：

> 你把 `deploy.yml` 放在了 **`mr-liu-cheng.github.io/blog/.github/workflows/deploy.yml`**
> 而它 **应该放在仓库根目录下的 `.github/workflows/` 中**，即：
> ✅ 正确路径是：
>
> ```
> mr-liu-cheng.github.io/.github/workflows/deploy.yml
> ```

---

## 🔧 为什么要这样放？

GitHub Actions 的工作流只会被识别和执行 **主仓库 `.github/workflows/` 目录下的 YAML 文件**，这是固定机制，不能嵌套到子目录或子文件夹里（比如你现在的 `blog/` 子目录）。

---

## ✅ 修复步骤（只需一次性修改）

你可以按下面操作调整：

### ① 把 `deploy.yml` 移动到主目录 `.github/workflows/`：

```bash
# 从 blog 子目录移回仓库根目录
mkdir -p .github/workflows
mv blog/.github/workflows/deploy.yml .github/workflows/deploy.yml
```

### ② 提交并推送修改：

```bash
git add .github/workflows/deploy.yml
git commit -m "Fix: Move deploy.yml to correct workflows directory"
git push origin master
```

### ③ 推送任意文章或文件到 `master` 分支再试一次：

```bash
echo "test" >> test.md
git add .
git commit -m "Trigger deployment"
git push origin master
```

然后你去 GitHub 页面上看 Actions 选项卡，应该就会触发部署流程了 ✅

---

## 🚀 补充建议

如果你有多级子目录结构用于管理博客源码，可以在 `blog/` 下保留源码，但确保部署 workflow 放在主路径下。

或者用两仓库方案也可以（一个写博客源码，一个部署页面），具体可根据你习惯来。

---

是否需要我给你一份推荐结构的 Hexo 博客项目模板？也可以直接 fork 来用。
