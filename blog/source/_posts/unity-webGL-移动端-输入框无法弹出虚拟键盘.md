---
title: unity webGL 移动端 输入框无法弹出虚拟键盘
date: 2024-12-13 14:00:58
updated: 2024-12-25 14:28:12
tags:
    - unity
    - webGL
categories: 
  - [Unity,WebGL]
description: webGL 移动端本身不支持输入框弹出虚拟键盘
keywords:
  - unity
  - webGL
  - 输入框
  - 虚拟键盘
---

1. 去这个网站下载工程：
   
   [https://github.com/kou-yeung/WebGLInput](https://github.com/kou-yeung/WebGLInput)

2. 将下载工程中的WebGLSupport文件夹拷贝到自己的工程中
   
   ![](unity-webGL-移动端-输入框无法弹出虚拟键盘/20241213_141006_image.png)

3. 将WebGLInput.cs组件添加到InputField组件挂载的对象上
4. 勾选show html element 不然输入后不显示。

