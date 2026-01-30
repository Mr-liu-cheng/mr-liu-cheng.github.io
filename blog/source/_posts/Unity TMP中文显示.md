---
title: Unity TMP中文显示
date: 2024-12-13 00:20:00
updated: 2024-12-25 14:28:12
tags: 
  - TMP
  - Unity
categories: Unity
description: Unity 使用系统字体生成TMP字体资源
keywords:
  - Unity
  - TMP
  - 相对路中文显示径
  - 字体资源
---

# 创建tmp中文字体资源

1.**选择Window/TextMeshPro/Font Asset Creator**

2.**Font Asset Creator设置界面如图**
![alt text](unity-tmp中文显示/image-1.png)
Source Font File：拖入需要使用的字体

- Sampling Point Size：设置用于生成字体纹理的字体大小（以磅为单位）
- Auto Sizeing：自动设置大小
- Custom Size：自定义大小，在文本框中输入所需的大小

Padding：字间距，填充越大，过渡越平滑，从而允许更高质量的渲染和更大的效果，如粗轮廓。

Packing Method：指定如何使字符适合字体纹理。

- Optimum：查找仍然适合纹理中所有字符的最大可能自动字体大小。
- Fast：更快地计算字符打包，但可能使用比优化模式更小的字体大小。

Atlas Resolution：设置字体纹理的大小宽度和高度，以像素为单位

Character Set：选择预定义的字符集。

- ASCII：包括 ASCII 字符集中的可见字符。
- Extended ASCII：包括扩展 ASCII 字符集中的可见字符。
- ASCII Lowercase：仅包含 ASCII 字符集中可见的小写字符。
- ASCII Uppercase：仅包含 ASCII 字符集中可见的大写字符
- Numbers+Sysbols：仅包括来自 ASCII 字符集的可见数字和符号。
- Custom Range：输入一系列十进制值或值范围，以指定要包括的字符。
- Unicode Range(Hex)：输入一系列 unicode 十六进制值或值范围，以指定要包含的字符。
- Custom Characters：输入字符序列以指定要包含的字符。
- Characters from File：指定的文本资源

Render Mode：指定输出字体图集时要使用的渲染模式。

- SMOOTH_HINTED：将图集渲染为抗锯齿位图，并将字符像素与纹理像素对齐以获得更清晰的结果。
- SMOOTH：将图集渲染为抗锯齿位图。
- RASTER_HINTED：将图集渲染为非抗锯齿位图，并将字符像素与纹理像素对齐以获得更清晰的结果。
- RASTER：将图集渲染为非抗锯齿位图。
- SDF：使用较慢但更准确的 SDF 生成模式渲染图集，并且没有过采样。
- SDF8：使用较慢但更准确的 SDF 生成模式和 8 倍过采样渲染图集。
- SDF16：使用更慢但更准确的 SDF 生成模式和 16 倍过采样渲染图集。
- SDF32：使用较慢但更准确的 SDF 生成模式和 32 倍过采样渲染图集。将此设置用于具有复杂或小字符的字体。
- SDFAA_HINTED：使用更快但不太准确的 SDF 生成模式渲染图集，并将字符像素与纹理像素对齐以获得更清晰的结果，它生成的字体图集足以满足大多数情况。
- SDFAA：使用更快但不太准确的 SDF 生成模式渲染图集，它生成的字体图集足以满足大多数情况。

Get Kerning Pairs：启用此选项可从字体复制字距调整数据。

Generate Font Atlas：我们把包含中文字体的文件拖入Characters from File中，然后点击此按钮开始生成

3.生成后，如上面效果图
注意：字体越多，生成的时间越长…Packing Method还是选Fast吧，Optimum太慢了

4.点击Save按钮保存

5.现在就可以正常使用这个字体了

# tmp创建字体报错:

![alt text](unity-tmp中文显示/image.png)

问题原因:

* 字体贴图空间不足

字体贴图的分辨率（Font Atlas Resolution）不够大，无法容纳所有字符。

生成 3000 字符所需的贴图分辨率和时间较低，一般`1024x1024` 或`2048x2048` 即可完成。

生成 7000 字符可能需要`4096x4096` 或更高分辨率，耗时更长。

* 字符范围太大

您可能尝试一次性添加过多的字符，例如一个完整的 Unicode 中文字符集。

* 字体文件不支持这些字符

使用的字体文件可能并未包含这些特定的字符。

* 渲染模式设置不当

当前的 Render Mode 设置可能导致字体生成失败。

---

* **选择 3000 汉字：**
  * 如果项目是游戏、日常应用或现代场景，3000 字足够使用。
  * 性能优先的项目，如 WebGL、移动端、嵌入式系统。
* **选择 7000 汉字：**
  * 如果项目需要显示古文、法律文书或覆盖专业领域的特殊字符。
  * 针对高性能设备或专业场景，如 PC 端应用、大型屏幕展示。

汉字集下载：

[https://github.com/wy-luke/Unity-TextMeshPro-Chinese-Characters-Set](https://github.com/wy-luke/Unity-TextMeshPro-Chinese-Characters-Set)

