---
title: Unity Overdraw 分析
date: 2025-06-17 14:16:02
updated: 2025-06-17 14:16:02
tags: Unity
categories: Unity
keywords: Unity,Overdraw
description:
---

在 Unity 中查看界面（UI）的 Overdraw（过度绘制）情况，可以使用 **Unity 的 Scene 视图 + Frame Debugger** 以及 **Profiler 和 RenderDoc 工具**。下面是详细方法：

---

## ✅ 方法一：Scene 视图中的 Overdraw 模式（推荐）

### 操作步骤：

1. 打开 Unity 编辑器。
2. 切换到 **Scene** 视图（不是 Game 视图）。
3. 在 Scene 视图左上角点击 **"Shaded" 下拉菜单**。
4. 选择 **"Overdraw"** 模式。

> ✅ 在该模式下，颜色越亮说明重叠的次数越多，白色代表非常多次重叠。

### 注意事项：

* 这个模式主要对 **UI 的渲染顺序** 和 **透明图片叠加** 非常直观。
* 你需要选中 `Canvas` 或 UI 元素所在的层级来定位问题。

---

## ✅ 方法二：Frame Debugger（推荐用于查找具体调用）

### 操作步骤：

1. 打开 Unity 的 **Window > Analysis > Frame Debugger**。
2. 点击左上角的 **Enable**。
3. 运行游戏，进入你要查看的 UI 界面。
4. 在 Frame Debugger 中浏览每一帧的绘制调用，可以看到哪些 UI 元素被重复绘制。

> 可以具体看到哪些组件被渲染、是否有冗余的 UI 被 DrawCall 多次渲染。

---

## ✅ 方法三：Unity Profiler（整体观察开销）

1. 打开 **Window > Analysis > Profiler**。
2. 切换到 **Rendering** 模块。
3. 查看：

   * **Draw Calls（绘制调用次数）**
   * **Batches（批处理）**
   * **Overdraw/SetPass Calls**

虽然 Profiler 不能直接可视化 Overdraw，但可以通过高 Draw Call 和 SetPass 判断是否 UI 渲染过重。

---

## ✅ 方法四：使用 RenderDoc（需要更专业分析）

RenderDoc 是一个图形调试器，可以看到逐像素的绘制信息。

1. 安装 RenderDoc 并启用 Unity 支持（Player Settings）。
2. 捕捉一帧 UI 显示画面。
3. 查看 Overdraw 情况以及各层级 UI 的实际渲染。

适用于你想深入了解 GPU 层面上的渲染瓶颈时。

---
## 🎯 小结

| 工具                       | 用途                | 优点    |
| ------------------------ | ----------------- | ----- |
| Scene View 的 Overdraw 模式 | 快速查看 UI 哪些地方重叠    | 快速可视化 |
| Frame Debugger           | 精确分析哪些 UI 元素被重复绘制 | 精准    |
| Profiler                 | 查看整体 UI 渲染开销      | 性能趋势  |
| RenderDoc                | 专业 GPU 分析工具       | 最精细   |

---

如你是做 UI 优化（如美术导图 or prefab 重构），建议从 **Scene Overdraw + Frame Debugger 结合使用**，可以快速定位 UI 过度绘制区域。

如果你想，我也可以教你怎么看具体哪个 Image 或 Text 的 Overdraw 最高。需要我帮你看图或分析具体 prefab 的结构吗？
