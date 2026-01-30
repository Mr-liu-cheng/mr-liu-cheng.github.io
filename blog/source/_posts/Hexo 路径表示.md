---
title: Hexo 路径表示
date: 2024-12-01 22:57:02
updated: 2024-12-25 14:28:12
categories: Hexo
tags:
  - Hexo
description: Hexo 路径表示(绝对路径和相对路径)
keywords:
  - Hexo
  - 路径表示
  - 相对路径
  - 绝对路径
#用于设置全局默认的封面图片（Cover Image），通常显示在首页、分类页面、标签页面等的顶部区域。
# cover: /img/favicon.png
---

在 Hexo 中，路径表示（即如何表示文件和目录的路径）有几个常见的用法和约定，具体取决于你是在配置站点、创建内容，还是处理资源。以下是常见的路径表示方式和相关解释：

## **相对路径与绝对路径**

- **相对路径** ：Hexo 中很多地方使用相对路径，通常相对路径是相对于 Hexo 项目的根目录或某些子目录的。例如：
  
  - `source/_posts/` 表示博客文章的存储位置。
  - `source/_pages/` 表示页面文件的存储位置。
- **绝对路径** ：通常是相对于网站根目录的路径，例如：
  
  - `/about/` 代表网站根目录下的 `about` 页面（通常通过 Hexo 配置生成）。

## **Hexo 配置文件中的路径表示** 
在 Hexo 的 `_config.yml` 配置文件中，许多路径表示都是相对于站点根目录的。例如：

```yaml
# Hexo站点的URL
url: http://yoursite.com

# 博客的URL路径
permalink: :year/:month/:day/:title/

# 存放站点文件的目录
source_dir: source
public_dir: public
```

- **`url`** ：表示站点的根 URL。
- **`permalink`** ：指定生成的文章 URL 格式。`/` 斜杠表示站点根目录。
- **`source_dir`**  和 ****`source_dir`**  和 `public_dir`** ：定义了源文件和生成后的文件所在的目录。

## **创建文章与页面的路径表示**
在 Hexo 中，创建文章和页面时通常会有路径约定：

- **文章路径** ：默认情况下，文章会存放在 `source/_posts/` 目录下。

```bash
hexo new post "My First Post"
```

该命令会在 `source/_posts/` 目录下创建一个新的 Markdown 文件，文件名是文章标题的拼音。

- **页面路径** ：页面会存放在 `source/_pages/` 目录下。

```bash
hexo new page "About"
```

该命令会在 `source/_pages/` 下创建一个新的页面文件，通常用于站点的静态页面（如关于页面、联系页面等）。

## **静态资源路径表示** 
在 Hexo 中，静态资源（如图片、JavaScript 文件、CSS 文件等）通常放在 `source` 目录中的子目录中，然后通过相对路径引用。这些资源会被复制到 `public` 目录下，并可以通过 URL 引用。

- 例如，你可以把图片放在 `source/images/` 目录中，引用时使用相对路径：

```markdown
![Image](images/my-image.jpg)
```

该图片会被复制到 `public/images/` 目录，并且可以通过 `/images/my-image.jpg` 访问。

## **主题配置中的路径** 
在 Hexo 主题的 `_config.yml` 配置文件中，通常会有一些与路径相关的设置，特别是与静态资源和模板文件相关的路径。例如：

```yaml
theme: landscape

# 主题中静态资源的路径
favicon: /favicon.ico
logo: /images/logo.png
```

- `favicon` 和 `logo` 等设置中使用的是站点根目录的路径（如 `/images/logo.png`），这些路径在生成站点时会指向 `public` 目录中的相应位置。

## **URL 路径与文件路径的映射** 
Hexo 将博客文章文件的路径（例如 `source/_posts/`）转换为对应的 URL 路径。例如，如果你有一个 `source/_posts/2024/hello-world.md` 的文章文件，Hexo 会将其转换为：

```plaintext
http://yoursite.com/2024/hello-world/
```

路径映射规则是通过 `_config.yml` 中的 `permalink` 配置项进行控制的。你可以自定义文章的 URL 路径格式，例如：

```yaml
permalink: :year/:month/:day/:title/
```

这样，文章的 URL 路径会包含年份、月份、日期和文章标题。

## 路径和文件系统中的斜杠

- 在 Hexo 中，路径使用 `/` 斜杠表示文件和目录之间的分隔符。即使在 Windows 系统中，Hexo 仍然使用 `/` 作为路径分隔符，这是因为 Hexo 在不同操作系统上有统一的路径处理方式。

## **Hexo 路径表示的小技巧**

- **绝对路径引用：**  如果想要在站点中引用根目录下的文件，可以使用 `/` 开头的绝对路径。例如，`/images/logo.png` 会引用 `public/images/logo.png`。
- **相对路径引用：**  在文章或页面中引用文件时，通常使用相对路径。例如，`./images/photo.jpg` 会引用 `source/images/photo.jpg`。

**例子：在 Hexo 中使用路径**

假设你有以下文件结构：

```perl
hexo/
  source/
    _posts/
      my-first-post.md
    images/
      logo.png
  themes/
    my-theme/
      _config.yml
  _config.yml
```

1. **创建一个新文章** ：

```bash
hexo new post "My First Post"
```

这将在 `source/_posts/` 中创建一个 `my-first-post.md` 文件。

2. **在文章中引用图片** ：

```markdown
![Logo](/images/logo.png)
```

这会引用 `public/images/logo.png` 文件。

3. **修改 `_config.yml` 配置** ：

```yaml
url: http://mywebsite.com
permalink: :year/:month/:day/:title/
```

这将使生成的文章 URL 类似于 `http://mywebsite.com/2024/01/01/my-first-post/`。

**总结**

在 Hexo 中，路径的表示方式通常依赖于文件系统的位置、站点的根目录以及 `_config.yml` 中的配置。你可以使用相对路径和绝对路径来链接文章、页面、静态资源，并通过配置文件来控制 URL 路径和静态资源的位置。

## ./和../

`./` 和 `../` 是文件路径中的相对路径符号，通常用于指示文件系统中的位置。它们在命令行、编程、文件引用等场景中都非常常见。下面是它们的具体含义：


### `./` 的含义

- `./` 表示当前目录（即你当前所在的目录）。
- 它通常用来表示当前目录下的某个文件或文件夹，或者作为命令行中的前缀来执行当前目录中的程序。

**例子：**

- `./file.txt`：指当前目录下的 `file.txt` 文件。
- 在命令行中执行当前目录中的程序：`./myprogram`。
  在 Hexo 或其他 Web 开发场景中，`./` 主要用于引用当前目录中的文件。例如，在文章中引用当前目录下的图片：

```markdown
![My Image](./images/photo.jpg)
```

这表示引用 `source/images/photo.jpg` 文件。

### `../` 的含义

- `../` 表示上一级目录（即当前目录的父目录）。
- 它通常用于返回到当前目录的上一级目录，在文件系统中向上移动一个层级。

**例子：**

- `../file.txt`：指的是上一级目录中的 `file.txt` 文件。
- `../../`：表示上上一级目录。
  在 Hexo 或其他开发场景中，`../` 用于引用上级目录中的文件。例如，假设你在 `source/_posts/` 目录下，并且想要引用 `source/images/` 目录中的文件，可以使用 `../`：

```markdown
![Logo](../images/logo.png)
```

这表示从当前目录 `source/_posts/` 向上一级（即 `source/`）跳转，再进入 `images/` 目录，最终引用 `logo.png` 文件。

**实际示例**

假设文件结构如下：

```bash
hexo/
  source/
    _posts/
      post1.md
    images/
      logo.png
```

- 如果你在 `post1.md` 文件中想要引用 `logo.png` 文件：

```markdown
![Logo](../images/logo.png)
```

这样，`../` 表示从 `source/_posts/` 目录向上返回到 `source/` 目录，然后再进入 `images/` 目录。

- 如果你在 `source/images/` 中，想引用 `source/_posts/post1.md` 文件：

```markdown
[Post 1](../_posts/post1.md)
```

这样，`../` 会让你从 `images/` 目录返回到 `source/`，然后进入 `_posts/` 目录。

**总结：**

- **`./`** ：当前目录。
- **`../`** ：上一级目录（父目录）。

这两个符号是相对路径的一部分，帮助你在不同的目录之间进行导航。

