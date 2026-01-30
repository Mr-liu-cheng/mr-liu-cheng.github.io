---
title: hexo添加标签样式
date: 2024-12-15 20:16:16
updated: 2024-12-25 14:28:12
tags: [Hexo,Butterfly]
categories: [Hexo,Butterfly]
description: 
keywords:
  - Hexo
  - Butterfly
  - 标签
  - 样式
---

在 **Hexo Butterfly**  主题中，由于 Markdown 文件中的代码会经过 Hexo 的解析后转换为 HTML，而 HTML 的样式需要依赖主题中的 CSS 文件，直接嵌入的 TailwindCSS 或自定义 CSS 可能无法生效。如果你希望在 Hexo 中生效样式，可以尝试以下方法：


## 解决方法 1：使用行内样式 (style 属性)
在 Hexo Markdown 中，直接使用 HTML 的 `style` 属性为每个标签设置样式。这种方法不依赖外部 CSS 文件，可以确保样式生效。
示例： 


```html
<div class="skill-tags">
  <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Next</span>
  <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Plasmo</span>
  <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Typescript</span>
  <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Supabase</span>
  <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">TailwindCSS</span>
</div>
```

## 解决方法 2：在主题配置中添加自定义 CSS
步骤：
 
1. **找到 Butterfly 主题的 CSS 文件：** 
通常在 `source/css/_custom.css` 或 `source/_data/styles.styl` 中可以添加自定义样式。
 
1. **添加样式：** 

```css
.skill-tags .tag {
    background-color: #e0f7fa; /* 浅蓝色背景 */
    color: #006064; /* 深蓝色文字 */
    font-size: 0.875rem; /* 文字大小 */
    padding: 4px 12px; /* 内边距 */
    border-radius: 999px; /* 圆角背景 */
    display: inline-block;
    text-align: center;
}
```
 
3. **在 Markdown 文件中使用：** 

```html
<div class="skill-tags">
    <span class="tag">Next</span>
    <span class="tag">Plasmo</span>
    <span class="tag">Typescript</span>
    <span class="tag">Supabase</span>
    <span class="tag">TailwindCSS</span>
</div>
```

## 解决方法 3：使用 Hexo 的 `<style>` 标签 
如果不想全局修改，只想在某一篇文章中生效样式，可以直接在 Markdown 文件中添加 `<style>` 标签。
示例： 


```html
<style>
.skill-tags .tag {
    background-color: #e0f7fa; /* 浅蓝色背景 */
    color: #006064; /* 深蓝色文字 */
    font-size: 0.875rem; /* 文字大小 */
    padding: 4px 12px; /* 内边距 */
    border-radius: 999px; /* 圆角背景 */
    display: inline-block;
    text-align: center;
}
</style>

<div class="skill-tags">
    <span class="tag">Next</span>
    <span class="tag">Plasmo</span>
    <span class="tag">Typescript</span>
    <span class="tag">Supabase</span>
    <span class="tag">TailwindCSS</span>
</div>
```

注意： 
`<style>` 标签必须写在文章的 HTML 部分中，不能直接用在纯 Markdown 语法中。


## 解决方法 4：通过 Butterfly 的自定义组件功能
 Butterfly 主题支持自定义 `shortcode` 或 **Nunjucks 模板** ，可以在配置中添加一个通用组件。
步骤：
 
1. **在 Butterfly 的 `source/_data` 中创建 `custom.swig` 文件（如果不存在）。**
 
2. **定义一个标签模板：** 

```swig
{% for skill in skills %}
    <span class="tag" style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">{{ skill }}</span>
{% endfor %}
```
 
3. **在 Markdown 文件中使用：** 

```markdown
{% custom skills=["Next", "Plasmo", "Typescript", "Supabase", "TailwindCSS"] %}
```

**总结** 

---

如果样式完全无法生效，建议先检查以下内容：

1. Markdown 文件是否启用了 HTML 渲染（Hexo 默认支持）。

2. 自定义样式是否被主题的全局样式覆盖，可以用浏览器调试工具检查。

3. 如果是 TailwindCSS，确保它已集成到 Butterfly 主题中。优先推荐 **方法 2**（主题配置中添加 CSS）或 **方法 3**（文章中嵌入 `<style>` 标签），这些方法既灵活又能避免重复代码。

>样式效果
<div class="skill-tags">
    <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">效果一</span>
    <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Plasmo</span>
    <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Typescript</span>
    <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">Supabase</span>
    <span style="background-color: #e0f7fa; color: #006064; padding: 4px 12px; border-radius: 999px; display: inline-block; text-align: center;">TailwindCSS</span>
</div>
