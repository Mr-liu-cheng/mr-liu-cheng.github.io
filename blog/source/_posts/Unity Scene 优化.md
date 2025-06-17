---
title: Unity Scene 优化
date: 2025-06-17 14:16:02
updated: 2025-06-17 14:16:02
tags: Unity
categories: Unity
keywords: Unity,Scene
description:
---

我做的编辑器拓展开发，卡顿是出现在通过配置生成上万个带指向的3d球体和linerenderer，根据每个点的配置信息来设置球体的旋转偏量，3d空间位置,两个点之间通过linerenderer连接，创建过程耗时很长，卡顿是出现在编辑器静态界面，而非运行状态。当前面临的 **编辑器卡顿问题**，本质上是因为：

> ✅ 在 **非运行时的编辑器模式（EditMode）中批量生成上万个带有 Mesh 和 LineRenderer 的 GameObject**，Unity 会：
>
> * 每次 `GameObject.Instantiate()` 都触发内部注册与序列化
> * 每个 LineRenderer 或 Transform 修改都会立即记录在场景状态中
> * 在主线程阻塞执行，触发 **大量 Hierarchy 刷新、Inspector 重绘、Undo 缓存注册、序列化数据写入**
>   → 导致 Unity 编辑器卡死或极度卡顿

---

## ✅ 针对性优化建议（编辑器扩展模式专属）

---

### 🧱 一、核心优化原则

| 问题来源                                       | 优化手段                                                |
| ------------------------------------------ | --------------------------------------------------- |
| 每个 `GameObject` 实时创建、注册 Undo、序列化           | ✅ 使用 `EditorApplication.delayCall` 分批异步创建 / 禁用 Undo |
| 每次 Transform 设置都会触发刷新                      | ✅ 批量设置坐标，**禁用场景刷新**（SceneView\.RepaintControl）      |
| 每个对象生成都立即刷新 Hierarchy                      | ✅ **临时关闭自动刷新界面**，批量结束后一次性刷新                         |
| 每次 `LineRenderer.SetPositions()` 修改也会导致 GC | ✅ 合并线段/简化结构/使用 GPU 绘制优化线渲染                          |

---

### 🔧 二、操作级优化方式（编辑器端）

#### ✅ 1. 禁用 Undo.RecordObject

如果不是必要的编辑器撤销操作，**禁用 `Undo.RegisterCreatedObjectUndo()`** 可以显著减少性能开销：

```csharp
GameObject go = GameObject.Instantiate(prefab);
go.transform.SetParent(parent, false);
// 删除 Undo 这句 ↓
// Undo.RegisterCreatedObjectUndo(go, "Create Point");
```

---

#### ✅ 2. 批量暂停 Scene 刷新 + Hierarchy 重绘

```csharp
EditorApplication.delayCall += () =>
{
    // 暂停场景刷新
    SceneView.duringSceneGui -= OnSceneGUI; // 如果你有实时绘制
    EditorApplication.QueuePlayerLoopUpdate(); // 延迟刷新

    // 批量操作
    for (int i = 0; i < configData.Length; i++)
    {
        CreateOnePoint(configData[i]);
    }

    // 手动刷新场景与 Hierarchy
    SceneView.RepaintAll();
    EditorApplication.RepaintHierarchyWindow();
};
```

---

#### ✅ 3. 使用 Coroutine 风格的异步分帧生成（模拟帧分批）

```csharp
IEnumerator GeneratePointsStepByStep()
{
    const int batchSize = 200;
    for (int i = 0; i < allPoints.Count; i++)
    {
        CreateOnePoint(allPoints[i]);

        if (i % batchSize == 0)
        {
            yield return null; // 下一帧
        }
    }

    Debug.Log("生成完成！");
}
```

用 `EditorCoroutineUtility.StartCoroutine(GeneratePointsStepByStep(), this)` 来调用

> ✅ 来自 Unity.EditorCoroutines 包，推荐引入用于编辑器分帧逻辑

---

#### ✅ 4. 创建时不要激活 GameObject，最后一起启用

```csharp
GameObject go = Instantiate(prefab);
go.SetActive(false); // 禁用初始化逻辑和渲染负担
// 设置坐标、旋转等
go.SetActive(true);
```

---

#### ✅ 5. 使用 Mesh 或 DrawMesh 替代 LineRenderer（合并优化）

* 将多个线段数据汇总，手动用 `GL.LINES` 或 `Graphics.DrawMeshNow()` 在 SceneView 渲染而不是生成上万个 LineRenderer
* 或者使用一个 `Mesh` 合并所有线段的渲染顶点，自定义材质渲染

---

## 📌 Bonus：GPU 绘制线连接方案（不生成 GameObject）

* 使用一个 `ScriptableObject` 维护线段列表
* 在 Scene GUI 中绘制：

```csharp
Handles.color = Color.green;
for (int i = 0; i < lines.Count; i++)
{
    Handles.DrawLine(lines[i].start, lines[i].end);
}
```

➡️ 不创建 GameObject，不占用层级，无 GC/卡顿 ✅

---

## ✅ 推荐组合优化方案（低开销）

| 目标             | 实现方式                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| 支持查看上万个点 + 连接线 | `Handles.DrawLine()` 在 SceneView 中实时渲染                                         |
| 支持选中点位         | 注册 `HandleUtility.AddDefaultControl()` + `HandleUtility.PickGameObject` 实现点击识别 |
| 仅在运行前批量生成真实物体  | 提供按钮：“生成 GameObject” → 批量生成，**不自动创建**                                          |

---

## 🚀 实用工具推荐

* ✅ [Editor Coroutines](https://docs.unity3d.com/Packages/com.unity.editorcoroutines@1.0/manual/index.html)：编辑器异步分帧执行逻辑
* ✅ [SceneView.onSceneGUIDelegate](https://docs.unity3d.com/ScriptReference/SceneView-onSceneGUIDelegate.html)：用于绘制线、不创建对象
* ✅ [Odin Inspector](https://odininspector.com/)：可视化控制面板和配置生成控制器

---

## 🧠 总结

| 类型     | 建议                                     |
| ------ | -------------------------------------- |
| ❌ 不要   | 一次性创建上万个 GameObject + LineRenderer（会卡） |
| ✅ 推荐   | 分批延迟创建、禁用 Undo、绘制到 Scene GUI 替代真实对象    |
| 🛠️ 补充 | 可以提供一个“点位配置→可视化→生成真实节点”的分离工具           |



---

你在 `OnSceneGUI` 中绘制上万条线，导致移动视角卡顿，是 **合理且常见的问题**。原因如下：

---

### 🧠 原因：`Handles.DrawLine` 在 `OnSceneGUI` 中是 CPU 密集型 + 每帧运行

* 每次移动场景视角时，`SceneView.OnSceneGUI` 都会触发重新绘制
* `Handles.DrawLine` 属于 **Immediate Mode GUI**（IMGUI），无法批量合批优化
* 当你绘制上万个点或线段，编辑器主线程完全吃满（全在 CPU 上渲染、无缓存）

---

## ✅ 解决方案：降低绘制密度 + 使用 GPU 批量绘制

---

### ✅ 方案一：仅在静止或需要时绘制（减少频率）

你可以 **只在窗口打开或点击按钮时才绘制一次**，而不是一直监听 `SceneView.duringSceneGui`：

```csharp
private bool forceDraw = false;

private void OnGUI()
{
    if (GUILayout.Button("预览线条"))
    {
        forceDraw = true;
        SceneView.RepaintAll();
    }
}

private void OnSceneGUI(SceneView view)
{
    if (!forceDraw) return;

    // 画完一帧后不再绘制
    forceDraw = false;

    DrawLinesOnce(); 
}
```

---

### ✅ 方案二：GL + CommandBuffer 批量绘制（推荐）

可以使用 `GL.LINES` + 自定义材质，在 GPU 中绘制所有线条，一次性渲染，不产生 GC 和 CPU 压力。

#### 步骤：

1. 创建一个材质（使用 `Unlit/Color` 或自定义 Shader）
2. 在 Scene GUI 中注册一个 `Camera.onPostRender` 或 `SceneView.onSceneGUIDelegate`
3. 使用 `GL.Begin(GL.LINES)` 批量绘制所有连接线

#### 示例代码：

```csharp
[InitializeOnLoad]
public class LineDrawer
{
    static Material lineMat;

    static LineDrawer()
    {
        SceneView.duringSceneGui += OnSceneGUI;
        lineMat = new Material(Shader.Find("Hidden/Internal-Colored"));
        lineMat.hideFlags = HideFlags.HideAndDontSave;
        lineMat.SetInt("_ZWrite", 0);
        lineMat.SetInt("_Cull", (int)UnityEngine.Rendering.CullMode.Off);
        lineMat.SetInt("_ZTest", (int)UnityEngine.Rendering.CompareFunction.Always);
    }

    static void OnSceneGUI(SceneView sceneView)
    {
        if (!shouldDraw) return;

        Handles.BeginGUI();
        // 可在 GUI 绘制按钮等
        Handles.EndGUI();

        GL.PushMatrix();
        lineMat.SetPass(0);
        GL.LoadProjectionMatrix(sceneView.camera.projectionMatrix);
        GL.modelview = sceneView.camera.worldToCameraMatrix;

        GL.Begin(GL.LINES);
        GL.Color(Color.yellow);
        foreach (var (a, b) in lines)
        {
            GL.Vertex(a);
            GL.Vertex(b);
        }
        GL.End();

        GL.PopMatrix();
    }

    static bool shouldDraw = true;
    static List<(Vector3, Vector3)> lines = new();

    public static void SetLines(List<(Vector3, Vector3)> lineData)
    {
        lines = lineData;
        shouldDraw = true;
    }
}
```

> ✅ 优势：
>
> * 使用 GPU 绘制，不卡顿
> * 不生成 GameObject，也不会触发 Scene 刷新
> * 可实时预览 + 快速刷新

---

### ✅ 方案三：对远离视野的线段/点位做视锥剔除

```csharp
if (SceneView.lastActiveSceneView != null)
{
    var cam = SceneView.lastActiveSceneView.camera;
    Plane[] planes = GeometryUtility.CalculateFrustumPlanes(cam);

    foreach (var (a, b) in links)
    {
        if (GeometryUtility.TestPlanesAABB(planes, new Bounds((a + b) / 2, Vector3.one * 0.5f)))
        {
            Handles.DrawLine(a, b);
        }
    }
}
```

> 📌 降低绘制线段数量，对可见部分仅绘制，性能可大幅提升

---

## ✅ 总结推荐

| 场景需求      | 推荐方案                                       |
| --------- | ------------------------------------------ |
| 上万条线，实时预览 | ✅ 使用 `GL.LINES` 批量绘制，避免 `Handles.DrawLine` |
| 临时静态可视化   | 只绘制一次 `OnSceneGUI`，绘完关闭                    |
| 编辑器工具面板控制 | 提供“开启预览”、“关闭预览”按钮控制绘制状态                    |
| 远距离线段过滤   | 添加视锥剔除只绘可见连接线                              |

---



### ❗你遇到的问题

1. **使用 `GL.LINES` 绘制的线段**，确实**不会自动跟随 Scene 中对象的移动**，因为 `GL.Vertex` 是在 `SceneView.camera` 的一次性投影矩阵下静态绘制的，除非你主动刷新数据。

2. **你在编辑器 Scene 操作顶点（或对象）时卡顿**，是因为：

   * 你每帧都进行 **大量线段计算 + 绘制（如上万个）**
   * 并且你不断访问/同步变化的坐标 → 每帧都 CPU 扫一次全量顶点 → 毫无缓存

---

## ✅ 解决方案：动态、流式、可跟随的高效绘制策略

---

### ✅ 方案一：**仅展示当前视野范围的少量线段**

结合视锥体剔除 + 距离裁剪，大幅降低绘制压力：

```csharp
Plane[] planes = GeometryUtility.CalculateFrustumPlanes(sceneCam);

foreach (var (a, b) in links)
{
    var mid = (a + b) * 0.5f;
    if (!GeometryUtility.TestPlanesAABB(planes, new Bounds(mid, Vector3.one * 1f))) continue;

    // 只有视野范围内的才画
    GL.Vertex(a);
    GL.Vertex(b);
}
```

---

### ✅ 方案二：**仅绘制选中或焦点区域的连接线**

```csharp
Vector3 camPos = sceneCam.transform.position;
float maxDrawDistance = 100f;

foreach (var (a, b) in links)
{
    if ((a - camPos).sqrMagnitude > maxDrawDistance * maxDrawDistance &&
        (b - camPos).sqrMagnitude > maxDrawDistance * maxDrawDistance)
        continue;

    GL.Vertex(a);
    GL.Vertex(b);
}
```

---

### ✅ 方案三：**数据缓存 + 变化时更新**

你需要避免每帧都全量重计算所有坐标。可以这样优化：

```csharp
private List<Vector3> cachedPoints = new();
private bool needUpdate = true;

private void UpdateDataIfNeeded()
{
    if (!needUpdate) return;

    cachedPoints.Clear();
    foreach (var go in allPointObjects)
        cachedPoints.Add(go.transform.position);

    needUpdate = false;
}

private void OnSceneGUI()
{
    UpdateDataIfNeeded();

    // 绘制线段用 cachedPoints
}
```

然后在对象位置变化时设置 `needUpdate = true`。你可以：

* 用 `EditorApplication.hierarchyChanged` 监听结构变化
* 或在 `Selection` 改变时做刷新

---

### ✅ 方案四：使用 `Graphics.DrawMeshNow` 合批绘制动态线条

自己生成一整张 `Mesh`（比如线段的 cylinder 或 quad），然后一次性 `Graphics.DrawMeshNow()` 绘制所有线段，这种方式：

* 支持跟随坐标变动（每帧更新 mesh）
* GPU 绘制，不卡
* 可打包成 `GizmosRenderer` 或 `SceneView` 工具

这是很多大型编辑器工具（如 DOTS Inspector、AI Debugger）常用方案。

---

## 🔧 如果你要动态显示/更新线段，并跟随场景中球体移动

### ✅ 最佳方案组合建议：

| 项目   | 使用方式                                                                             |
| ---- | -------------------------------------------------------------------------------- |
| 点位   | 实体使用 `GameObject + Sphere`（可交互、选中）                                               |
| 连线   | 用单个 `Mesh` 合批绘制所有线段，动态更新（非 `LineRenderer`，避免生成上万个）                               |
| 性能保障 | 添加视锥体剔除 + 距离剔除逻辑                                                                 |
| 数据管理 | 使用数组缓存点位坐标，仅在坐标改变时更新一次线段 `Mesh`                                                  |
| 触发更新 | 使用自定义按钮 / Unity `EditorApplication.update` / `SceneView.duringSceneGui` 判断是否需要更新 |

---

### 🚀 是否需要我帮你写一个：

* 自动从所有球体位置构建一张合批线段 `Mesh`
* 支持动态更新（如某球体移动后线段自动更新）
* 不依赖 LineRenderer 或 GL，每次仅绘制 1 个合批对象





