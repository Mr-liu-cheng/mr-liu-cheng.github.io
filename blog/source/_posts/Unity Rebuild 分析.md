---
title: Unity Rebuild 分析
date: 2025-06-17 12:06:02
updated: 2025-06-17 12:06:02
tags: Unity
categories: Unity
keywords: Unity,Rebuild
description:
---

在 Unity 的 **UI 系统（UGUI）中**，**Rebuild** 是指 UI 元素在生命周期中的某些阶段发生变化时触发的一种“重建”流程。频繁的 Rebuild 会带来性能问题，尤其在界面复杂或频繁更新时。下面是关于 Rebuild 的全面分析：

---

## 🧩 什么是 Rebuild？

UI 元素发生如下变化时，会触发 Rebuild：

* 位置/大小发生变化（`RectTransform` 变动）
* 内容变动（Text 文本变了）
* 属性变动（颜色、字体、sprite 等）

Unity 会将这些 UI 元素加入到一个队列，在 Canvas 的渲染阶段进行一次“重建”。

---

## 🔍 Rebuild 的类型（对应 `CanvasUpdate` 枚举）

Unity 的 Rebuild 会按照 **5 个阶段**进行处理，分别是：

```csharp
public enum CanvasUpdate {
    Prelayout,
    Layout,
    PostLayout,
    PreRender,
    LatePreRender,
    MaxUpdateValue
}
```

这些阶段由 `CanvasUpdateRegistry` 控制，主要包括两类 Rebuild：

| 类型                  | 说明                               | 触发者                                  |
| ------------------- | -------------------------------- | ------------------------------------ |
| **Layout Rebuild**  | 布局信息变更（如`HorizontalLayoutGroup`） | `ILayoutElement`、`ILayoutController` |
| **Graphic Rebuild** | 视觉元素变更（如 `Image`, `Text` 内容）     | `Graphic`, `IMeshModifier`           |

---

## 🚨 常见 Rebuild 导致性能问题的原因

| 问题                               | 描述                              |
| -------------------------------- | ------------------------------- |
| 频繁修改 Text / Image                | 每次都会触发 Layout 或 Graphic Rebuild |
| RectTransform 动态变化               | 会导致父物体及子物体一起重建                  |
| ContentSizeFitter、LayoutGroup 滥用 | 它们高度依赖 Rebuild，效率低下             |
| SetActive(false/true) UI元素       | 重新激活会触发全部子元素重建                  |
| 动画修改 UI 位置                       | 每帧调用 `SetPosition` 会触发 Rebuild  |
| ScrollView 滚动项频繁刷新               | 若没有对象池复用，每帧都 Rebuild            |

---

## 🔧 如何分析 Rebuild（工具 & 方法）

### ✅ 1. 使用 **Profiler**

1. 打开 Unity Profiler（Window > Analysis > Profiler）。
2. 查看 **UI 系统模块**（Rendering / UI）：

   * **Canvas.SendWillRenderCanvases**
   * **Canvas.BuildBatch**
   * **Canvas.UpdateBatches**
   * **Canvas.SendPreWillRenderCanvases**

   如果这些函数耗时很长或频繁出现，说明 Rebuild 很频繁。

### ✅ 2. 使用 **UI Debug 工具 / Debug 输出**

#### 方法一：在 `IMeshModifier` 或 `ILayoutElement` 中添加日志

```csharp
public class DebugLayoutElement : MonoBehaviour, ILayoutElement {
    public void CalculateLayoutInputHorizontal() {
        Debug.Log($"{name} - CalculateLayoutInputHorizontal");
    }
    public void CalculateLayoutInputVertical() {
        Debug.Log($"{name} - CalculateLayoutInputVertical");
    }
    public float minWidth => 0;
    public float preferredWidth => 100;
    public float flexibleWidth => -1;
    public float minHeight => 0;
    public float preferredHeight => 50;
    public float flexibleHeight => -1;
    public int layoutPriority => 1;
}
```

#### 方法二：继承 `Graphic` 打印 `OnPopulateMesh`

```csharp
protected override void OnPopulateMesh(VertexHelper vh) {
    Debug.Log($"{name} - Graphic Rebuild");
    base.OnPopulateMesh(vh);
}
```

---

## ✅ 如何优化频繁 Rebuild 的 UI

| 优化手段                                 | 说明                         |
| ------------------------------------ | -------------------------- |
| 合理拆分 Canvas                          | 大的 UI 拆为多个 Canvas（静态/动态分开） |
| 使用 CanvasGroup 控制显隐                  | 避免频繁使用 `SetActive`         |
| 尽量不要频繁修改 Text                        | 特别是数字跳动的情况，建议合并/缓存         |
| 减少使用 LayoutGroup + ContentSizeFitter | 用 Anchor + 脚本代替            |
| 滚动列表使用对象池复用                          | 避免每帧加载/卸载                  |

---

## 🎯 补充：Canvas Rebuild vs DrawCall 的区别

* **Rebuild**：UI 元素的计算、重建、顶点重构阶段，对 CPU 有压力
* **DrawCall**：UI 实际绘制阶段，对 GPU 有压力
* 两者互相独立，但经常一起出现（UI 更新频繁就会导致两者上升）

---

## 🧠 总结

| 关键点         | 内容                                  |
| ----------- | ----------------------------------- |
| Rebuild 是什么 | UI 元素更新时的重建逻辑（布局或图形）                |
| 如何查看        | Profiler + 日志 + Frame Debugger      |
| 如何优化        | 拆 Canvas、避免频繁变化、用对象池、少用 LayoutGroup |

---

如果你能贴出当前频繁触发 Rebuild 的 UI 层级截图或结构，我可以进一步帮你定位是哪类组件或结构导致的性能瓶颈。是否需要我给你一个自动统计每帧 UI Rebuild 的脚本？
