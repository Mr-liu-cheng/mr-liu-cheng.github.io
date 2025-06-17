---
title: Unity 打图集 - 合批减少DrawCall
date: 2025-06-17 14:16:02
updated: 2025-06-17 14:16:02
tags: Unity
categories: Unity
keywords: Unity,打图集,合批,DrawCall
description:
---

在 Unity 中，通过**打图集（图集打包）+ Canvas 优化策略**可以有效实现 **UI 合批（Batching）**，从而减少 DrawCall 提高性能。下面是详细说明和实战指导：

---

## 🧩 一、为什么打图集能减少 DrawCall？

Unity UI 使用的是基于 Canvas 的渲染系统，**同一个材质（图集）+ 同一个 Canvas + 无深度遮挡排序冲突** 时，可以自动合并为一个 DrawCall。

举个例子：

* 如果你有 100 个 UI 元素，使用的是 **相同图集的 Sprite**，且放在 **同一个 Canvas** 下，就只需要 **1 个 DrawCall**。
* 但如果他们用的是不同贴图、不同材质、不同 Shader，就需要多个 DrawCall。

---

## 📦 二、图集如何打包（使用 Unity 自带 Sprite Atlas）

### ✅ 步骤一：创建 Sprite Atlas 图集

1. `Assets > Create > 2D > Sprite Atlas`
2. 给图集命名，例如 `UIAtlas_Main`
3. 选中图集，点击 Inspector 中的 **Objects for Packing > Add Object**
4. 把你的 Sprite 图标拖进去
5. 勾选 `Include in Build`（默认开启）
6. 设置 Packing Tag（用于动态图集）

> ✔️ Unity 在构建或运行时会将图集中 Sprite 合并成一张大图，共用一套材质。

---

### ✅ 步骤二：确保引用的图片来自图集

你 UI 的 Image、Button 等组件要使用的是 **图集中 Sprite**，而不是原始散图。

---

### ✅ 步骤三：检查合批条件

想要成功合批，必须满足以下**合批三要素**：

| 条件                          | 原因              |
| --------------------------- | --------------- |
| 相同材质（图集打包 + 使用相同 Shader）    | 否则材质切换会打断合批     |
| 相同 Canvas（Static Canvas 最好） | 不同 Canvas 会分开渲染 |
| 没有 UI 组件遮挡冲突（深度/排序）         | 会触发中断合批         |

> ⚠️ 设置 Sprite 的 **Packing Tag** 也要统一（用于旧的 SpritePacker 系统）

---

## 🛠️ 三、辅助工具（推荐使用）

### ✅ Sprite Atlas Viewer

查看哪些 Sprite 打进图集。

### ✅ Frame Debugger（查看是否合批）

1. 打开 `Window > Analysis > Frame Debugger`
2. Enable
3. 在 UI 显示状态下，查看是否多个 UI 共享同一个材质（会合批），如果中间切了材质就说明被打断。

---

## 💡 四、进一步优化建议

| 优化点                           | 说明                       |
| ----------------------------- | ------------------------ |
| **使用统一 Shader 和材质**           | 比如 UGUI 默认的 `UI/Default` |
| **静态 UI 和动态 UI 分 Canvas**     | 动态变化（数值、动画）会频繁重建         |
| **使用 CanvasGroup 控制显隐**       | 避免 `SetActive` 触发重建      |
| **使用 UI 批处理分析器**（Unity 2022+） | 可查看 UI DrawCall 合批详情     |
| **避免多 Sprite 图集打包在不同图集中**     | 跨图集无法合批                  |

---

## ✅ 图集打包策略建议（常用实践）

| 图集名              | 包含内容         | 说明            |
| ---------------- | ------------ | ------------- |
| `UIAtlas_Common` | 通用按钮、底框、面板背景 | 所有界面共享        |
| `UIAtlas_Home`   | 主界面相关 UI 图   | 按功能模块拆分       |
| `UIAtlas_Fight`  | 战斗中用到的 UI 元素 | 战斗场景专用，防止资源浪费 |

---

## ✅ 实战示例总结

假设你有以下 UI：

* 按钮 A 用图 A
* 按钮 B 用图 B
* 图 A、图 B 都打在 `UIAtlas_Common`

→ 合批 ✅（1 DrawCall）

但如果：

* 按钮 A 用图集 Atlas\_A
* 按钮 B 用图集 Atlas\_B

→ 不合批 ❌（2 DrawCall）

---

## 📌 常见合批失败原因排查

| 问题                | 原因                                  |
| ----------------- | ----------------------------------- |
| DrawCall 没减少      | 图集没用上 / 材质不同                        |
| 改变 Text 内容导致重新合批  | 每帧都会触发 Canvas rebuild               |
| 使用了不同的 Shader     | 材质不同就不能合批                           |
| 动态加载的 Sprite 没入图集 | 需要用 Addressable Atlas / SpriteAtlas |

---

## 🎯 总结

| 步骤                  | 要点                                |
| ------------------- | --------------------------------- |
| 打图集                 | 使用 Sprite Atlas 包含所有常用 UI 图       |
| 引用图集                | 所有 Image / SpriteRenderer 使用图集内图片 |
| 同 Canvas            | 尽量放在一个不频繁变化的 Canvas 下             |
| 用 Frame Debugger 验证 | 实时查看是否合批成功                        |

---

需要我提供一个 Sprite Atlas 图集打包模板 + 合批检测脚本吗？或者你可以贴出当前 UI 层级 + Sprite 设置截图，我帮你定位是否打包和合批成功。
