---
title: Hexo 疑难杂症
date: 2024-12-28 22:56:28
updated: 2024-12-28 22:56:28
tags:
    - Hexo
    - Butterfly
categories: [Hexo,Butterfly]
keywords:
  - Hexo
  - Butterfly
  - 隐藏页脚
  - 页面跳转
  - 界面未完全加载
description:
---

## butterfly通过样式隐藏页脚

如果配置文件没有提供选项，可以通过 CSS 隐藏页脚区域。
打开或创建 source/css/_layout/footer.styl 文件。

添加以下内容：

```css
复制代码
#footer {
  display: none !important;
}
```

## hexo 页面跳转时，界面未完全加载

页面刷新时正常的，但是从其他页面跳转过来时，js代码加载的内容都没加载出来

我的做法是采用延时执行js的函数：

```js
setTimeout(function () { Render(); }, 100); // 延迟渲染，确保布局已完成

    //这个方法不行
    document.addEventListener("DOMContentLoaded", function () {Render();});
```

## hexo butterfly 主题的布局修改

### 隐藏侧边栏：Front-matter中添加

```
aside: false
```

如果要今后添加的的page或者post都隐藏侧边栏可以在模版Front-matter中添加上面的代码就行。但是已有的界面是需要自己手动添加从而实现隐藏效果。
scaffolds\page.md
scaffolds\post.md

若是要完全隐藏或者在特殊的page隐藏可以在butterfly.config中修改配置实现：这里好像不能添加自定义的page，不然将会省事很多。

```yaml
aside:
  enable: true
  hide: false
  # Show the button to hide the aside in bottom right button
  button: true
  mobile: true
  # Position: left / right
  position: right
  display:
    archive: true
    tag: true
    category: true
```

### 拓宽页面内容div

* 方法一：直接在md/html/js文件中添加js代码
  ```js
    //内容扩宽
    const page = document.getElementById("page");
    page.style.width = "100%"; // 撑满屏幕
    // page.style.setProperty("padding", "160px", "important");
    page.style.padding = "86px"; // 撑满屏幕 不加单位视为百分百
    const content = document.getElementById("content-inner");
    content.style.maxWidth = "100%"; // 撑满屏幕
    content.style.margin = "0"; // 撑满屏幕
    content.style.padding = "0"; // 撑满屏幕
  ```
* 方法二：直接在themes\butterfly\source\js\main.js文件中添加js代码
  ```js
    //内容扩宽
    const page = document.getElementById("page");
    if (page && saveStatus == 'hide') {
    page.style.width = "100%"; // 撑满屏幕
    page.style.padding = "86px"; // 撑满屏幕 不加单位视为百分百
    const content = document.getElementById("content-inner");
    content.style.maxWidth = "100%"; // 撑满屏幕
    content.style.margin = "0"; // 撑满屏幕
    content.style.padding = "0"; // 撑满屏幕
    }
  ```

强调：
样式中尺寸有两种表现：百分百、具体像素值（12px）。
自带的标签可能会有默认样式信息，例如`<Img>`,若是要修改，需要使用 !important 提高当前样式的优先级


``` html
 <img src="${project.image}" class="project-cover">
 <style>
 .project-cover {
      max-width: 100%;
      /* 图片宽度不会超出容器宽度 */
      max-height: 100%;
      /* 图片高度不会超出容器高度 */
      object-fit: contain;
      /* 保持图片比例，完全显示图片 */
      display: block;
      /* 防止图片默认的 inline 行为 */
      margin: 0 !important;/* 防止img默认的样式覆盖，提高当前样式的优先级*/
      /* 设置外边距为零 */
      border: none;
      /* 移除边框 */
    }
 </style>
```
或者这样：
``` js
page.style.setProperty("padding", "160px", "important");
```

## div中的图片居中
display: flex; 
flex-direction: column;
align-items: center;
``` css
    .project-card {
      background: #505050;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 10px;
      display: flex;
      /* 设置为弹性布局 */
      flex-direction: column;
      /* 子元素纵向排列 */
      align-items: center;
      /* 子元素水平居中 */
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
```

## 格子布局

**总结对比** 
| 用法 | 列数 | 列宽度计算 | 剩余空间行为 | 
| --- | --- | --- | --- | 
| repeat(4, 1fr) | 固定为 4 列 | 按容器宽度动态调整 | 每列均分剩余空间 | 
| repeat(auto-fit, 250px) | 动态调整 | 固定为 250px | 剩余空间为空白（列不会超出内容） | 
| repeat(auto-fit, minmax(250px, 1fr)) | 动态调整 | 最小 250px，最大均分剩余空间 | 剩余空间被列均分,空列也会被均分掉 | 
| repeat(auto-fill, minmax(250px, 1fr)) | 动态调整 | 最小 250px，最大均分剩余空间 | 剩余空间被列均分，但空列会保留 | 

``` css
 .projects {
      display: grid;
      /* 指定4列，每列等分容器宽度 */
      grid-template-columns: repeat(4, 1fr); 
      grid-template-columns: repeat(auto-fit, 250px);
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      /* grid-auto-rows: 150px; */
      /* 每行高度固定为 150px */
      gap: 20px;
      /* 格子间距 20px*/
    }
```


<br>


##  `auto-fit` 与 `auto-fill` 的主要区别 
- **`auto-fit`** : 将列压缩以适应容器宽度，仅保留有内容的列，列之间的多余空间会重新分配。
 
- **`auto-fill`** : 尽可能填满容器，即使某些列是“空的”，也会在容器内保留这些占位列。





`repeat(auto-fit, minmax(250px, 1fr))` 

---
- 重点是“**压缩列数** ”：如果列宽足够，未使用的列会被移除，只有实际需要的列保留。
- 剩余空间会被现有列均分。
- 只生成实际需要的列，不创建空列。
- 列总数 = **实际内容列数** 。

<br>

`repeat(auto-fill, minmax(250px, 1fr))` 

---
- 重点是“**填满容器** ”：尝试创建更多列，即使其中部分列没有内容（生成“空列”作为占位）。
- 剩余空间会均分到所有列（包括空列）。
- 列总数 = **容器能容纳的最大列数** 。

<br>

**详细比较表** 
| 特性 | auto-fit | auto-fill | 
| --- | --- | --- | 
| 列数 | 根据实际内容调整列数 | 根据容器宽度填满列数 | 
| 剩余空间分配 | 均分到现有列 | 均分到所有列（包括空列） | 
| 未使用的列 | 移除 | 保留为占位列 | 
| 空列是否创建 | 否 | 是 | 
| 优势 | 精简布局，适合动态内容数量，仅有实际内容需要显示时 ,移除无用列，避免产生空白列| 容器填满，适合固定布局，需要固定网格布局（占位列）时 ,空列提供一致的布局效果 | 

