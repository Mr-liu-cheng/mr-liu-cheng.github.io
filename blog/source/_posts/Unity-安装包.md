---
title: Unity 安装包
date: 2025-01-13 13:25:04
updated: 2025-01-13 13:25:04
tags:
categories:
keywords:
description:
---
# collab-proxy 缺失 PlasticSCM/log4netPlastic.dll

**描述：**
>error CS0006: Metadata file 'Library/PackageCache/com.unity.collab-proxy@2.6.0/Lib/Editor/PlasticSCM/log4netPlastic.dll' could not be found

**原因分析：**

这个错误 `error CS0006` 表示 **编译器无法找到所需的 DLL 文件**，而在你的报错信息中，缺失的文件是 `log4netPlastic.dll`，它属于 Unity Collaboration 或 PlasticSCM（Unity 的版本控制工具）。

创建项目时，我没有勾选：

![alt text](Unity-安装包报错/image.png) 

因此缺少插件。

---
**解决步骤：**
1. 在 `manifest.json` 中删除了 `com.unity.collab-proxy` 依赖项
2. 删除项目中的 `Library` 文件夹（可以直接在文件管理器中删除）。
3. 关闭 Unity 编辑器。
4. 重新打开 Unity 项目。Unity 会重新生成 `Library` 文件夹并更新依赖关系。


# 多余安装包移除

在 Unity 项目中，`manifest.json` 文件的 `dependencies` 列表定义了当前项目所包含的包。以下是对这些包的分类及其功能的简要介绍，并分析哪些是非必要的，可以根据需求移除。

---

### **核心包 (必要的)**
这些包是 Unity 运行和项目创建所必须的，通常不应移除。

1. `com.unity.modules.`
   - Unity 的核心模块，大部分是内置引擎功能的模块化组件。
   - 常用模块：
     - `com.unity.modules.animation`：动画功能（Mecanim）。
     - `com.unity.modules.particlesystem`：粒子系统。
     - `com.unity.modules.physics`：3D 物理系统。
     - `com.unity.modules.physics2d`：2D 物理系统。
     - `com.unity.modules.audio`：音频功能。
     - `com.unity.modules.ui`：UGUI 系统。
     - `com.unity.modules.imgui`：IMGUI 功能（用于编辑器自定义工具）。
   - 不常用模块：
     - `com.unity.modules.vehicles`：车辆模块。
     - `com.unity.modules.wind`：风力模拟。
     - `com.unity.modules.terrainphysics`：带物理功能的地形模块。
   - 建议：**根据具体需求保留常用模块，移除不需要的模块**。

2. `com.unity.ugui`
   - Unity 的基础 UI 系统（即 `UnityEngine.UI`）。
   - 建议：必要，保留。

3. `com.unity.timeline`
   - 提供时间轴功能，用于制作过场动画、剪辑等。
   - 建议：如果项目不涉及动画或时间轴功能，可以移除。

4. `com.unity.textmeshpro`
   - 高级文本渲染工具，几乎是所有项目的标配。
   - 建议：必要，保留。

---

### **开发工具 (可选，根据 IDE)**
这些包与开发环境有关，可以根据所用的开发工具选择性保留。

1. `com.unity.ide.rider`
   - 为 JetBrains Rider 提供支持。
   - 建议：如果使用 Rider 作为 IDE，保留；否则移除。

2. `com.unity.ide.visualstudio`
   - 为 Visual Studio 提供支持。
   - 建议：如果使用 Visual Studio，保留；否则移除。

3. `com.unity.ide.vscode`
   - 为 Visual Studio Code 提供支持。
   - 建议：如果使用 VS Code，保留；否则移除。

---

### **协作与测试 (可选)**
这些包与项目协作和测试有关，可以根据需求选择。

1. `com.unity.collab-proxy`
   - Unity Collaborate 的代理包，用于协作和版本控制。
   - 建议：如果不使用 Collaborate（推荐 Git），可以移除。

2. `com.unity.test-framework`
   - 提供测试框架，用于编写单元测试和集成测试。
   - 建议：如果项目不需要测试，可以移除。

---

### **渲染与特效 (根据项目需求)**
与渲染管线和图形功能相关，需根据项目需求选择。

1. `com.unity.render-pipelines.universal`
   - 通用渲染管线（URP），适用于大多数平台的优化渲染解决方案。
   - 建议：如果项目使用内置渲染管线且不使用 URP，可以移除。

---

### **可视化脚本 (可选)**
1. `com.unity.visualscripting`
   - Unity 的可视化脚本系统（Bolt）。
   - 建议：如果项目完全使用 C# 编程，不需要可视化脚本，可以移除。




## 不常用插件
以下是您提到的 Unity 模块的作用、使用方法以及适用场景的详细说明：
### **1. com.unity.timeline**
**作用**
- **Timeline** 是 Unity 提供的可视化时间线编辑工具，用于制作动画、过场动画、游戏事件序列等。
- 允许通过拖放资源（动画、声音、事件等）来创建复杂的时间轴序列。

**使用方法**
1. **打开 Timeline 窗口：**
   - 在 Unity 编辑器中，导航到 **Window > Sequencing > Timeline**。
2. **创建 Timeline：**
   - 选择一个 GameObject，右键点击并选择 **Create Timeline**。
3. **添加轨道（Track）：**
   - 添加动画轨道（Animation Track）、音频轨道（Audio Track）、信号轨道（Signal Track）等。
4. **播放控制：**
   - 使用 PlayableDirector 控制 Timeline 的播放。

**使用场景**
- **过场动画：** 制作带有镜头运动、角色动画和音效的游戏过场。
- **复杂事件序列：** 比如任务触发时多个游戏对象的交互（如解谜游戏）。
- **动画合成：** 将多个动画片段组合成复杂动画。

---

### **2. com.unity.visualscripting**
**作用**
- **Visual Scripting** 是 Unity 提供的可视化脚本工具，允许开发者通过图形界面（无需代码）实现逻辑功能。
- 为不擅长编程的设计师、艺术家提供了一种实现游戏逻辑的方法。

**使用方法**
1. **安装 Visual Scripting 模块：**
   - 在 Unity Package Manager 中搜索并安装 **Visual Scripting**。
2. **创建脚本图（Script Graph）：**
   - 在 GameObject 上添加 **Script Machine** 组件。
   - 打开图形化编辑器，拖放节点实现逻辑。
3. **常见节点：**
   - 条件分支（If）、变量设置/获取（Set/Get Variable）、事件监听（On Trigger Enter）等。

**使用场景**
- **快速原型开发：** 快速创建和测试逻辑功能。
- **任务管理：** 制作触发任务、计分板等。
- **交互设计：** 设计简单的交互功能，比如点击按钮切换场景。

---

### **3. com.unity.modules.vehicles**
**作用**
- 提供与车辆相关的功能，包括车轮碰撞检测（WheelCollider）和车辆运动控制。
- 可用于创建具有真实物理特性的车辆。

**使用方法**
1. **车辆控制：**
   - 使用 **WheelCollider** 模拟车轮的物理行为（如悬挂、摩擦力）。
   - 为车身（Rigidbody）添加适当的力来驱动车辆。
2. **脚本控制：**
   - 使用 `WheelCollider.motorTorque` 来控制车轮的动力。
   - 使用 `WheelCollider.steerAngle` 来控制转向。

**使用场景**
- **赛车游戏：** 制作真实感的车辆物理控制。
- **车辆模拟：** 比如汽车驾驶模拟器或工程车辆模拟（挖掘机、卡车）。
- **机器人控制：** 带轮机器人的物理模拟。

---

### **4. com.unity.modules.wind**
**作用**
- 提供基础的风力模拟功能，主要与树木和植被交互使用。
- 用于动态模拟场景中风吹动的效果。

**使用方法**
1. **添加 Wind Zone：**
   - 在场景中创建一个 **Wind Zone** 对象。
   - 设置风力强度（Wind Main）、湍流（Turbulence）等参数。
2. **与植被交互：**
   - 确保使用 Unity 的 SpeedTree 模型，树叶和枝干会响应 Wind Zone 的风力设置。

**使用场景**
- **自然场景：** 模拟风吹动的效果，比如吹动树叶、草地。
- **环境模拟：** 模拟暴风雨场景中的风力。
- **动态效果：** 用于提高场景的动态表现力。

---

### **5. com.unity.modules.terrainphysics**
**作用**
- 提供地形与物理系统的交互功能，允许物理对象在地形上正确运动和碰撞。
- 在地形上动态生成物理效果，比如球滚动、车辆行驶等。

**使用方法**
1. **创建带物理的地形：**
   - 在地形组件上勾选 **Enable Physics**。
   - 确保地形层级支持物理对象的碰撞（默认是 `Default` 层）。
2. **与 Rigidbody 交互：**
   - 放置 Rigidbody 的对象（如球、箱子）在地形上，它们会根据地形形状产生物理反应。

**使用场景**
- **物理交互：** 制作游戏中的滑坡效果、车辆行驶效果等。
- **地形动态变化：** 与其他物理对象互动，如物体滚落、坠毁。
- **开放世界游戏：** 制作大面积可交互地形，比如山地、丘陵。

---

### **总结**
| **模块**                     | **作用**                                | **典型场景**                                             |
|------------------------------|---------------------------------------|--------------------------------------------------------|
| **com.unity.timeline**       | 时间轴动画编辑工具                      | 游戏过场动画、事件序列、动画合成                          |
| **com.unity.visualscripting** | 图形化脚本工具                          | 快速原型、任务管理、简单交互逻辑                          |
| **com.unity.modules.vehicles**| 模拟车辆物理行为                        | 赛车游戏、车辆模拟、机器人物理                           |
| **com.unity.modules.wind**   | 风力模拟，影响树木和植被                 | 自然场景、暴风雨效果、提高动态表现                        |
| **com.unity.modules.terrainphysics** | 地形与物理交互                         | 开放世界物理效果（滑坡、滚动），动态地形与碰撞              |

这些模块主要是针对特定的功能需求开发，如果您的项目需要类似的功能，可以根据需求启用并结合 Unity 提供的 API 使用。

---

## **移除后的注意事项**
1. **如何移除**
   - 打开 `manifest.json` 文件，直接删除对应依赖项。
   - 运行 Unity，确保不会报错（删除前建议备份）。

2. **检查依赖关系**
   - 某些包可能依赖其他包，移除时需检查项目是否仍能正常运行。
   - 可以通过 Unity 的 **Package Manager** 界面检查依赖关系。

3. **性能优化**
   - 移除非必要的包可以减小项目体积，减少加载时间，优化性能。

---

## **建议的精简示例**

如果你的项目不涉及协作、不使用 URP 或 Visual Scripting 等功能，可以精简为：

```json
"dependencies": {
  "com.unity.textmeshpro": "3.0.6",
  "com.unity.timeline": "1.7.6",
  "com.unity.ugui": "1.0.0",
  "com.unity.modules.animation": "1.0.0",
  "com.unity.modules.audio": "1.0.0",
  "com.unity.modules.particlesystem": "1.0.0",
  "com.unity.modules.physics": "1.0.0",
  "com.unity.modules.ui": "1.0.0"
}
```

# 未使用的包

在 Unity 工程中，未使用的包可能会对项目产生一些负面影响，同时移除这些包也能带来诸多好处。以下是具体的分析：

---

## **未使用包的影响**

1. **占用磁盘空间**
   - Unity 包含的所有依赖项都会存储在 `Library` 和 `Packages` 文件夹中，占用本地磁盘空间。
   - 如果包中包含大量未使用的资源、脚本或工具（如渲染管线、测试框架），会使项目体积膨胀。

2. **增加加载时间**
   - Unity 编辑器启动时会解析所有的依赖项，即使某些包没有实际被使用，它们仍会在加载时被扫描、初始化。
   - 例如，`com.unity.collab-proxy`（Collaborate 相关工具）会加载协作工具的后台进程，可能会拖慢启动速度。

3. **影响构建时间**
   - 构建时，Unity 会对所有包进行依赖检查，未使用的包仍然会参与构建过程。
   - 这可能增加构建时间，甚至会因为某些包的依赖关系导致不必要的资源被打包进构建文件。

4. **代码冗余与冲突**
   - 部分包会引入额外的 API 和功能模块，如果不使用这些功能，会导致代码库显得臃肿。
   - 一些包可能与项目现有功能发生冲突或引入不必要的复杂性（如 **Visual Scripting** 与手写代码的逻辑冲突）。

5. **增加维护成本**
   - 未使用的包可能随着 Unity 版本更新而失效或产生错误（例如废弃的包无法与新版本兼容）。
   - 开发者需要额外花时间排查是否是这些无用包导致问题。


## **如何安全删除未使用的包**



1. **使用 Package Manager**
   - 打开 Unity 编辑器，依次点击 `Window -> Package Manager`。
   - 找到未使用的包，点击 `Remove`。项目的包使用 remove ,核心模块（Bulit-in）用 disable
   - 这个方式可以查询包的依赖，但是的逐个移除。

2. 手动编辑 `manifest.json`
   - 打开项目根目录的 `Packages/manifest.json` 文件。
   - 找到对应的包依赖，删除对应条目后保存。
   - 删除包后，清理 `Library` 文件夹，强制 Unity 重新生成项目缓存。
---

### **总结**

删除未使用的包可以显著减少项目体积、提升性能和可维护性，但需要谨慎操作，避免删除必要功能。建议通过工具（如 Package Manager）和测试（如完整运行项目）确保安全性，并针对不同项目需求决定具体的优化策略。



# **Unity 包管理器的四个主要页签**

1. **In Project（项目中）**  
   - **功能**：显示当前项目中安装的包，包括从 Unity Registry 添加的包或自定义包。  
   - **用途**：
     - 管理项目中使用的功能包，如升级、降级或移除。  
   - **场景**：想优化项目依赖，或确认已经安装的包的版本信息。

---

2. **Unity Registry（Unity 注册表）**  
   - **功能**：显示 Unity 官方提供的功能包（**未安装**）。  
   - **用途**：
     - 安装 Unity 官方维护的工具或模块（如 Animation Rigging、Cinemachine、URP）。  
   - **场景**：需要从 Unity 提供的功能库中添加新功能模块。

---

3. **My Assets（我的资源）**  
   - **功能**：显示与当前登录 Unity 账户绑定的 Asset Store 资源。  
   - **用途**：
     - 从 Asset Store 导入素材、工具或插件到项目中。  
   - **场景**：需要使用个人或团队已购买的资源。

---

4. **Built-in（内置模块）**  
   - **功能**：显示 Unity 引擎的核心内置模块（如 Audio、Physics、Terrain 等）。  
   - **特点**：
     - 这些模块是 Unity 引擎的核心组成部分，默认是启用状态。  
     - 可以选择禁用不需要的模块来减少项目构建体积。  
   - **用途**：
     - 查看哪些内置模块已启用或被禁用。  
     - 在特定场景下禁用不需要的模块（例如，2D 游戏可能不需要 3D Physics）。  
   - **场景**：优化项目性能或构建体积时管理内置模块。
