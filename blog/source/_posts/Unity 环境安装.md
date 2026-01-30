---
title: Unity 环境安装
date: 2025-01-14 12:07:07
updated: 2025-01-14 12:07:07
tags: Unity
categories: Unity
keywords: Unity
description:
---
# unity 模块添加
[官方解释](https://discussions.unity.com/t/unable-to-add-modules-to-installation-in-unity-hub-3-7-0/935934/12)

这段官方解释详细说明了为什么 **“Add Modules”** 按钮可能缺失以及如何通过手动方式修复。以下是总结和关键要点：

---

## **问题原因**

- **Unity Hub** 使用 `modules.json` 文件来记录某个 Unity 编辑器版本的模块安装状态。
- 如果该文件缺失或未正确生成，Unity Hub 就无法知道有哪些模块已安装，也无法显示 **“Add Modules”** 按钮。
- 如果编辑器是通过非 Unity Hub 安装的（例如手动下载解压安装），默认没有 `modules.json` 文件，Unity Hub 将无法管理该版本的模块。所以我们安装unity时hub上可能没有列出我们需要的版本，但是我们可以去官网找到对应的版本链接至UnityHub 这样就相当于使用UnityHub下载，支持模块管理。

---

## **解决方案**

如果你的 Unity 安装缺失 **“Add Modules”** 按钮，可以尝试以下步骤修复：

### 方法一：手动下载模块

  1. 选版本 [archive](https://unity.com/releases/editor/archive)
  2. [releases](https://unity.com/releases/editor/whats-new/2022.3.20#installers)，找到组件对应组件模块，如下：
   
   Component installers ->
   
   Windows :
   
   - Android Build Support
   - iOS Build Support
   - tvOS Build Support
   - Linux Build Support (IL2CPP)
   - Linux Build Support (Mono)
   - Linux Dedicated Server Build Support
   - Mac Build Support (Mono)
   - Mac Dedicated Server Build Support
   - Universal Windows Platform Build Support
   - WebGL Build Support
   - Windows Build Support (IL2CPP)
   - Windows Dedicated Server Build Support
   - Documentation

### 方法二：创建modules.json

#### **1. 检查 Unity 安装路径**

- 打开 Unity Hub 的 **Installs** 页。
- 点击 Unity 版本右侧的 **齿轮图标**，选择 **“Show in Explorer”** 或 **“Show in Finder”**。
- 在打开的文件夹中，确认是否存在 `modules.json` 文件。

#### **2. 手动创建 `modules.json` 文件**

如果文件缺失，可以手动创建：

1. 在 Unity 安装目录下新建一个文件，命名为 `modules.json`。
   
   - 注意文件扩展名必须为 `.json`。
   - 确保在操作系统中未隐藏扩展名（防止被误命名为 `modules.json.txt`）。
2. 打开文件并添加以下内容：
   
   ```json
   [{}]
   ```
3. 保存并关闭文件。

#### **3. 重启 Unity Hub**

- 完全退出 Unity Hub，确保它不在系统托盘运行。
- 重新打开 Unity Hub，检查 **“Add Modules”** 按钮是否出现。

---

### **重要注意事项**

1. **风险提示**：
   
   - 如果 `modules.json` 文件信息不正确，可能会导致 Unity Hub 无法正确管理模块安装/卸载。
   - 如果问题发生，可以删除 `modules.json` 文件并重试。
2. **推荐使用 Unity Hub 安装编辑器**：
   
   - Unity Hub 安装会自动生成 `modules.json`，并确保模块的正确状态。
3. **归档下载的版本建议单独管理**：
   
   - 如果从 [Unity 归档](https://unity.com/releases/editor/archive)下载的版本，最好直接使用 Unity Hub 安装或按照官方文档的安装步骤手动管理模块。

### 方法三：卸载，使用Unityhub重新安装 【推荐】

**强调：**

1. 不要使用中国版团结引擎，版本带c的就是
2. 不要单独下载unity editor 安装器，使用UnityHub下载

## Visual Studio 的安装

在 Unity 开发中，Visual Studio 的安装需要包含以下关键组件，以确保支持 Unity 的所有功能，包括 C# 脚本开发、IL2CPP 构建、调试和测试。

---

## **推荐的安装步骤**
1. 打开 **Visual Studio Installer**。
2. 选择要安装或修改的 Visual Studio 版本（例如 Visual Studio 2022）。
3. 点击 **修改**。
4. 在 **工作负载** 和 **单个组件** 中勾选以下内容。

---

## **必须安装的组件**

### **工作负载**
以下工作负载是 Unity 开发的基本需求：
1. **Game development with Unity**（使用 Unity 进行游戏开发）：
   - Unity 的官方推荐工作负载。
   - 包含 Unity 相关工具、调试器、测试工具和集成插件。

2. **.NET desktop development**（.NET 桌面开发）：
   - 提供必要的 .NET 和 C# 工具。

3. **Desktop development with C++**（C++ 桌面开发）：
   - **IL2CPP 构建**所需，用于将 Unity 项目转换为本地 C++ 代码并编译。

---

### **单个组件**
在顶部切换到 **单个组件**，选择以下组件：

#### **C# 和 .NET**
1. **.NET Framework 4.8 SDK**
2. **.NET Framework 4.8 Targeting Pack**
3. **NuGet Package Manager**

#### **C++ 工具链**
1. **MSVC v143 - VS 2022 C++ x64/x86 build tools**
2. **Windows 10 SDK（10.x.x.x）** 或更新版本：
   - 这是 IL2CPP 必需的工具链之一。
3. **C++ CMake tools for Windows**
4. **C++/CLI support**（可选，针对 .NET 与 C++ 交互的情况）。

#### **Unity 工具**
1. **Unity Hub**（可选，如果未安装）。
2. **Visual Studio Tools for Unity**：
   - 提供 Unity 与 Visual Studio 的集成，包括代码提示、调试和错误报告。

#### **调试工具**
1. **JavaScript diagnostics**（用于调试 WebGL 项目）。
2. **Graphics debugger and GPU profiler**（可选，用于调试渲染问题）。

---

### **其他推荐组件**
1. **Azure DevOps**（可选，用于版本控制）。
2. **MSBuild**（项目构建工具）。
3. **Live Share**（用于多人协作开发）。
4. **Performance profiler**（可选，性能分析工具）。

---

## **检查 Unity 项目所需的额外内容**
如果你的 Unity 项目需要构建到特定平台，请安装相关的 SDK 和工具：
- **Android**：需要安装 Android SDK 和 NDK，建议通过 Unity Hub 设置。
- **iOS**：需要 macOS 和 Xcode。
- **WebGL**：安装 Node.js 和 JavaScript 工具（Visual Studio 会自动提供支持）。
- **Windows**：确保安装了 **Windows 10 SDK** 和 **C++ 工具链**。

---

完成上述设置后，Visual Studio 应能够完整支持 Unity 的开发需求。如果遇到具体问题或提示缺少某个组件，可以根据报错信息查漏补缺，或随时向我提问！
