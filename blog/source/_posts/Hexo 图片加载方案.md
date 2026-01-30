---
title: Hexo 图片加载方案
date: 2024-12-11 17:27:33
updated: 2024-12-25 14:28:12
tags: [Hexo,Butterfly]
categories: [Hexo,Butterfly]
description: 
keywords:
  - Hexo
  - Butterfly
  - 图片
---

# 安装 hexo-asset-image 插件

```
npm install hexo-asset-image --save
```

打开node_modules\hexo-asset-image\index.js文件59行附近：
修改代码为如下

```js
//src = srcArray.join('/');这个是源码,从这下面开始修改替换
var baseUrl = data.permalink;
// 判断当前页面是否为文章
if (data.layout === 'post') {
    // 匹配最后两个斜杠间的内容和最后的斜杠，并替换为单个斜杠，目的是去掉文档存放的文件夹名
    baseUrl = data.permalink.replace(/\/[^\/]+\/$/, '/'); 
}
$(this).attr('src', baseUrl +src);
console.info&&console.info("update link as:-->"+baseUrl+src);
```

## 页签页md文档中插入图片

上面的方法可以在普通文章使用，但是页签页内容插入图片会多出: .html后缀
```
https://xxx/musicPage/index.html
```
打开_config.yml ，修改如下：

```yml
pretty_urls:
  trailing_index: false
  trailing_html: false
```

### 1. trailing_index

这个选项控制是否在 URL 末尾自动添加 index。例如：

如果 trailing_index: true，那么像 https://example.com/posts/ 这样的 URL 会变成 https://example.com/posts/index.html。
如果 trailing_index: false，URL 末尾就不会自动添加 index，它会保持 https://example.com/posts/ 的形式。

### 2. trailing_html

这个选项控制是否在 URL 末尾添加 .html 后缀。例如：

如果 trailing_html: true，像 https://example.com/posts/ 会变成 https://example.com/posts/index.html。
如果 trailing_html: false，URL 会去掉 .html 后缀，直接使用像 https://example.com/posts/ 这样的格式。

```bash
hexo clean
hexo g
hexo d
hexo s
```

这个方式的好处在于：

* 支持vscode中正常预览
* 无需修改Ctrl+V粘贴的路径
* 本地构建的网站和正式部署的网站都能正常显示



# html 脚本中添加图片
我们直接复制粘贴的路径：
将路径
``` md
 ![alt text](index/image.png)
```
粘贴到scr中
``` html
  <img src="index/image.png" alt="捡贝" class="project-image w-full h-64 object-cover" />
```

我们会发现 html 最终生成的路径中少了 index 这一层：

src : index/image.png
```
update link as:-->https://xxxx/About/   image.png
```
我们需要在hexo-asset-image\index.js文件中处理：
``` js
 if(srcArray.length > 1 && srcArray[0]!="index")//添加判断防止使用html 加载图片时会抹去index层级
    srcArray.shift();
```
这段代码原本是要移出src中第一层目录，应为md格式会自动补充根目录，会出现重复目录，但是html 格式不涉及自动补充根目录，所以不需要这一步，因此要添加判断。

node_modules\hexo-asset-image\index.js需要修改部分的完整的代码
``` js
   $('img').each(function(){
        if ($(this).attr('src')){
          // For windows style path, we replace '\' to '/'.
          var src = $(this).attr('src').replace('\\', '/');
          //console.info&&console.info(".... "+src);
          if(!(/http[s]*.*|\/\/.*/.test(src)
            || /^\s+\//.test(src)
            || /^\s*\/uploads|images\//.test(src))) {
            // For "about" page, the first part of "src" can't be removed.
            // In addition, to support multi-level local directory.
            var linkArray = link.split('/').filter(function(elem){
              return elem != '';
            });
            var srcArray = src.split('/').filter(function(elem){
              return elem != '' && elem != '.';
            });
            // if(srcArray.length > 1 && srcArray[0]!="index")//添加判断防止使用html 加载图片时会抹去index层级
            // srcArray.shift();
            src = srcArray.join('/');
            // console.info&&console.info("____" +src);
            
            var baseUrl = data.permalink;
            // 判断当前页面是否为文章
            if (data.layout === 'post') {
              baseUrl = data.permalink.replace(/\/[^\/]+\/$/, '/'); // 匹配最后两个斜杠间的内容和最后的斜杠，并替换为单个斜杠
            }
            $(this).attr('src', baseUrl +src);
            console.info&&console.info("update link as:-->"+baseUrl+ "   "  +src);
          }
        }else{
          console.info&&console.info("no src attr, skipped...");
          console.info&&console.info($(this));
        }
      });
```
