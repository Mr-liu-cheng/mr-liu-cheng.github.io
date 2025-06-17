---
title: Unity 后置界面截图代替
date: 2025-06-17 14:16:02
updated: 2025-06-17 14:16:02
tags: Unity
categories: Unity
keywords: Unity,截图
description:
---

这是一个非常实用且高级的 UI 性能优化技巧，尤其适用于**多层 UI 堆叠、全屏窗口频繁切换**的游戏中，比如背包、商店、角色等互相遮挡但不会频繁更新的界面。

---

## 🧠 目标描述

> **将被遮挡的 UI 页面（非焦点）截图为一张静态图片，然后只显示截图，暂时不渲染真实 UI 元素**，以降低 DrawCall 和 Canvas Rebuild 负担，充分释放 GPU 渲染资源。

---

## ✅ 技术实现步骤（Unity UGUI）

我们以“将后置界面截图 + 替换显示 + 隐藏原始 UI”为例讲解：

---

### 🧱 Step 1：截图后置 UI（RenderTexture 或 `ReadPixels`）

```csharp
public Texture2D CaptureUIScreen(RectTransform targetRect)
{
    // 1. 获取 UI 区域在屏幕空间的位置
    Vector3[] corners = new Vector3[4];
    targetRect.GetWorldCorners(corners);
    Rect rect = new Rect(corners[0].x, corners[0].y, 
                         corners[2].x - corners[0].x, 
                         corners[2].y - corners[0].y);

    // 2. 读取像素
    Texture2D tex = new Texture2D((int)rect.width, (int)rect.height, TextureFormat.RGB24, false);
    tex.ReadPixels(rect, 0, 0);
    tex.Apply();
    return tex;
}
```

> ✅ **推荐更高效方式：用 `RenderTexture + Camera.Render()` 单独渲染 UI 区域而不是 ReadPixels，避免阻塞主线程**（下面会说）

---

### 📦 Step 2：用 `RawImage` 显示截图内容

```csharp
RawImage screenshotDisplay;

void ShowScreenshot(Texture2D tex)
{
    if (screenshotDisplay == null)
    {
        GameObject go = new GameObject("ScreenshotUI", typeof(RectTransform), typeof(CanvasRenderer), typeof(RawImage));
        go.transform.SetParent(你的Canvas.transform);
        screenshotDisplay = go.GetComponent<RawImage>();
        screenshotDisplay.rectTransform.anchorMin = Vector2.zero;
        screenshotDisplay.rectTransform.anchorMax = Vector2.one;
        screenshotDisplay.rectTransform.offsetMin = Vector2.zero;
        screenshotDisplay.rectTransform.offsetMax = Vector2.zero;
    }

    screenshotDisplay.texture = tex;
    screenshotDisplay.enabled = true;
}
```

---

### 🔒 Step 3：隐藏真实 UI，锁定点击穿透

```csharp
真实UI.SetActive(false);
// 或者只禁用组件，但保留位置
真实UI.GetComponent<CanvasGroup>().alpha = 0;
真实UI.GetComponent<CanvasGroup>().blocksRaycasts = false;
```

---

### ✅ Step 4（可选）：切换回来时恢复 UI

```csharp
真实UI.SetActive(true);
screenshotDisplay.enabled = false;
```

---

## 🚀 推荐优化方式：用 `RenderTexture + UI 摄像机单独渲染 UI`

比 `ReadPixels` 更高效 ✅

1. 给 UI 界面加一层单独的 Canvas（`RenderMode = ScreenSpaceCamera`）
2. 分配一个专属 UI 摄像机，输出到一个 RenderTexture
3. 把这个 Texture 设置给 `RawImage`
4. 然后**关闭原 UI Canvas 显示，保留截图**

```csharp
Camera uiCamera;
RenderTexture rt;

void CaptureWithCamera(Canvas uiCanvas)
{
    rt = new RenderTexture(Screen.width, Screen.height, 0);
    uiCamera.targetTexture = rt;
    uiCamera.Render();

    screenshotDisplay.texture = rt;
    screenshotDisplay.enabled = true;

    uiCanvas.enabled = false;
}
```

---

## 📌 实用建议

| 项目                 | 推荐做法                             |
| ------------------ | -------------------------------- |
| UI 层级很多（嵌套 Canvas） | 将“不可见的后层 UI”截图后禁用 Canvas 组件      |
| UI 不频繁交互           | 完全截图为静态图                         |
| UI 中有动态内容          | 考虑部分截图或继续动态更新                    |
| 需要点击穿透             | `RawImage.raycastTarget = false` |

---

## ✅ 优点总结

* 🔥 **大幅减少 DrawCall**（隐藏真实 UI，RawImage 只需 1 DrawCall）
* 🚫 **避免 Canvas Rebuild**（UI 禁用或 alpha=0）
* 🧠 **优化 GPU 帧时间**（尤其是堆叠多个大 UI）

---

## 🎯 举例场景

| 场景                | 效果                       |
| ----------------- | ------------------------ |
| 背包界面被“角色换装界面”全屏遮挡 | 背包 UI 截图并替代显示，关闭其 Canvas |
| 商店全屏 UI 切到签到页面    | 商店改为截图，不再实时渲染            |
| 模拟对话剧情            | 截图背景 UI，前景角色/文本保持活动      |

---

如你需要我提供一个完整的封装脚本（支持 RenderTexture、RawImage 创建、Canvas 替换控制），可以直接发我你的 UI 管理方式或结构，我给你定制化生成。是否需要？
