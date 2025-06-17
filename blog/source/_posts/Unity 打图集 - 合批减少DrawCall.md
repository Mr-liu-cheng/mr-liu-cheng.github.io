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

## ✅ ① “没有 UI 组件遮挡冲突（深度/排序）” 为什么会影响合批？

### 🔍 背景知识：UI 合批的底层逻辑

Unity 的 UGUI 合批，基于 **Z-order（绘制顺序）连续性** 实现。也就是说，只有当 UI 元素的渲染顺序连续，且材质一样时，Unity 才能将它们合并成一个 DrawCall。

### ❌ 什么会打断顺序？比如：

1. 插入了一个使用不同材质的 UI 元素
2. 插入了一个透明度不同或开启了特殊 shader 特效的 UI 元素
3. 插入了一个被 **强制改变 Sorting Order**、**Canvas 设置不同 Sorting Layer** 的 UI 元素

### 🧱 举个例子说明：

你有这样一个结构：

```
Canvas
├── Image_A（图集 UIAtlas_Common）
├── 特效_B（独立材质）
├── Image_C（图集 UIAtlas_Common）
```

* `Image_A` 和 `Image_C` 可合批 ✅
* 但中间插了 `特效_B`（材质不同），**会强制结束一次 DrawCall**，然后重新开启下一次。

所以实际上你会看到两个 UIAtlas\_Common 的 DrawCall：

```
1. DrawCall #1: Image_A
2. DrawCall #2: 特效_B（不同材质）
3. DrawCall #3: Image_C
```

### 🎯 原则：

> Unity 合批只能在**相邻的、材质一致、ZOrder 不冲突的 UI 元素之间**生效。

* 哪怕你用的是同一张图集，如果中间有排序变化（比如使用 Canvas override sorting、Sorting Layer、Z轴不同），也会断掉合批。

---

## ✅ ② Packing Tag 一致性对 Sprite 合批的影响（主要是老系统）

### 🔍 什么是 Packing Tag？

在老版本 Unity（< 2019）使用的是 **Legacy Sprite Packer** 系统。这个系统会根据 Sprite 设置的 **Packing Tag** 把图打进图集。

### 🧠 原理：

* 所有设置了相同 Packing Tag 的 Sprite，会打进同一个图集，生成相同的材质引用。
* 不同 Packing Tag → 分到不同图集 → 不同材质 → 无法合批

> 哪怕你两个 Sprite 都放进图集中，但 Packing Tag 不一样，Unity 就会生成两张图 + 两个材质，就无法合批。

---

### ✅ 在 Unity 2019+ 新 Sprite Atlas 中：

Packing Tag 不再是必须项，但你仍然需要：

* 确保 Sprite 被添加到 **同一个 Sprite Atlas 资源**中
* Unity 会自动使用统一材质来合并渲染

---

## 📌 快速验证方法

你可以在 Editor 中使用以下方式检测是否图集和材质统一：

1. **Frame Debugger**（窗口：Window > Analysis > Frame Debugger）

   * Enable 后看 UI 的绘制调用
   * 如果多个 UI 元素共用一个材质，合批成功；否则就会看到多次 DrawCall 分开渲染

2. **Sprite 查看材质**

   * 选中一个 Sprite，点击 **Inspector > Debug 模式**
   * 查看其 `Atlas Texture` 和 `Material` 是否相同

---

## ✅ 总结

| 问题              | 原因                   | 如何避免                   |
| --------------- | -------------------- | ---------------------- |
| UI 渲染顺序打断合批     | ZOrder 排序冲突或混入不同材质元素 | 保证 UI 层次清晰、材质连续、不混特效   |
| Packing Tag 不一致 | 不同图集或材质会导致不能合并       | 使用统一图集或统一 Sprite Atlas |


## 打断合批案例
你这个结构如下：

```
Canvas
├── Image_A   （图集 UIAtlas_Common）
├── Image_A2  （图集 UIAtlas_Common）
├── 特效_B     （独立材质，非图集）
├── Image_C   （图集 UIAtlas_Common）
├── Image_C2  （图集 UIAtlas_Common）
```

---

### ✅ Unity 实际渲染时会怎么做？

Unity 的 **UGUI 合批（Batching）机制** 在遇到材质变化时会**强制结束当前批次，开始一个新 DrawCall**。

### 🎨 材质分析：

* `Image_A`、`Image_A2`、`Image_C`、`Image_C2` 都属于 **UIAtlas\_Common** 图集，共享 **同一个材质**
* `特效_B` 使用 **独立材质**，比如带特效 shader 的 Particle 或非图集 Sprite

---

## 📊 实际渲染批次和 DrawCall 结果如下：

| 顺序 | 内容            | 材质来源            | 是否合批                 |
| -- | ------------- | --------------- | -------------------- |
| 1  | Image\_A + A2 | UIAtlas\_Common | ✅ 合批，1个 DrawCall     |
| 2  | 特效\_B         | 特效材质            | ❌ 新材质，1个 DrawCall    |
| 3  | Image\_C + C2 | UIAtlas\_Common | ✅ 重新开始合批，1个 DrawCall |

### ✅ 结果总结：

* **DrawCalls**: **3 个**

  * DrawCall #1: Image\_A, Image\_A2（合批）
  * DrawCall #2: 特效\_B（单独材质）
  * DrawCall #3: Image\_C, Image\_C2（重新开始合批）

* **Batches**: 通常也是 **3 个**（如果你在 Profiler 中看 Batches 数和 DrawCall 数一样）

---

## 🚨 为什么会重新开一个 DrawCall？

* UGUI 渲染是按\*\*层级顺序（Transform 顺序）\*\*绘制的
* 如果中间某个对象使用了不同材质，Unity **无法将两段相同材质之间的元素合批**
* 所以 Image\_A 和 Image\_C 即使同图集，也 **无法合批**

---

## ✅ 优化建议（减少 DrawCall 到 2 个甚至 1 个）

### 方法一：将特效\_B 分离出当前 Canvas

```plaintext
Canvas_StaticUI（图集 UI）
├── Image_A
├── Image_A2
├── Image_C
├── Image_C2

Canvas_FX（独立材质，SortingOrder > StaticUI）
└── 特效_B
```

* 特效独立 Canvas，不再打断合批
* UIAtlas\_Common 全部可一次合批 ✅

➡️ **DrawCall 减为 2 个（图集 + 特效）**

---

### 方法二：如果特效只是一个闪光贴图，没有动态变化，尝试用图集内贴图代替

* 把特效贴图也加入到 UIAtlas\_Common 图集
* 改用普通 `Image` 展示

➡️ 所有 5 个都共用图集，**DrawCall 降为 1**

---

## ✅ 验证方法

使用 **Frame Debugger**：

> `Window > Analysis > Frame Debugger > Enable`

1. 选择 UI 相关 DrawCall，查看是否使用了同一个材质（图集）
2. 如果看到“结束一个批次，开启新材质绘制”，说明被打断
3. 查看断点是否就是你插入的 `特效_B`

---

## 🧠 总结

| 项目       | 数值 | 原因                          |
| -------- | -- | --------------------------- |
| DrawCall | 3  | 特效材质打断合批                    |
| 合批数      | 3  | UIAtlas\_Common 分两段合批，中间被打断 |

**优化方式**：将 `特效_B` 拆分 Canvas 或使用图集贴图代替特效材质，即可合批成功。

如果你希望我帮你写一个自动检测 UI 中打断合批的节点脚本，也可以告诉我。


