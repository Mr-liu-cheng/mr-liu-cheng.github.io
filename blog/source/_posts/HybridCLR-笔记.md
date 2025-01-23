---
title: HybridCLR 笔记
date: 2025-01-13 18:47:33
updated: 2025-01-13 18:47:33
tags:
categories:
keywords:
description:
---
## [hybridclr Package手册](https://hybridclr.doc.code-philosophy.com/docs/basic/com.code-philosophy.hybridclr)

## [最佳实践](https://hybridclr.doc.code-philosophy.com/docs/basic/bestpractice)
## [不支持特性](https://hybridclr.doc.code-philosophy.com/docs/basic/notsupportedfeatures)
## [AOT泛型](https://hybridclr.doc.code-philosophy.com/docs/basic/aotgeneric)

## 热更新程序集的 auto reference

>如果你们项目把Assembly-CSharp作为AOT程序集，强烈建议关闭热更新程序集的auto reference选项。因为Assembly-CSharp是最顶层assembly，开启此选项后会自动引用剩余所有assembly，包括热更新程序集，很容易就出现失误引用热更新程序集导致打包失败的情况。

这段话的核心是提醒开发者避免在 Unity 项目中意外地让 `Assembly-CSharp`（默认的主程序集）引用到热更新程序集，以防止打包或运行时出现问题。以下是详细解释：

---

### 1. 什么是 `auto reference` 选项？
- Unity 中的 `auto reference` 是一个程序集配置选项，控制是否让其他程序集（如 `Assembly-CSharp`）自动引用当前程序集。
- 默认情况下，这个选项是 **开启** 的，意味着该程序集会被自动引用，无需手动配置。

---

### **2. Assembly-CSharp 是什么？**
- `Assembly-CSharp` 是 Unity 项目的主程序集，包含了大部分代码逻辑，是一个 **AOT（Ahead-of-Time）程序集**。
- 因为 AOT 编译模式在构建时需要提前生成机器代码，所以不能直接加载和运行 JIT（Just-In-Time）模式的热更新程序集。

---

### **3. 热更新程序集是什么？**
- **热更新程序集**（如 `Hotfix.dll`）通常是为实现动态更新功能而编写的代码，采用 JIT 模式运行，支持在运行时加载。
- 它们是 Unity 中独立于 `Assembly-CSharp` 的额外程序集。

---

### **4. 问题的本质**
- `Assembly-CSharp` 自动引用热更新程序集的问题：
  - **错误引用**：如果 `Assembly-CSharp` 中的代码错误地依赖了热更新程序集的内容，那么 Unity 打包工具会尝试将热更新程序集内容一起打包到构建结果中。
  - **冲突**：由于热更新程序集需要在运行时加载，而不是在构建时被编译到应用中，错误的引用会导致 **打包失败** 或 **运行时错误**。

---

### 5. 为什么建议关闭热更新程序集的 `auto reference`？
- **关闭后效果**：
  - 防止 Unity 自动将热更新程序集添加为 `Assembly-CSharp` 的依赖项。
  - 强制开发者在代码中显式引用热更新程序集，避免误用。

- **示例问题**：
  - 假如你在 `Assembly-CSharp` 中调用了热更新程序集中的方法（例如 `Hotfix.SomeMethod()`），Unity 会尝试将 `Hotfix.dll` 包含到主程序集的依赖中。
  - 这种错误的引用可能导致：
    - 打包失败（热更新程序集不支持 AOT 编译）。
    - 热更新失效（运行时无法正确加载动态程序集）。

---

### 6. 如何关闭 `auto reference`？
在 Unity 项目的 `Assembly Definition File (.asmdef)` 中，关闭 `auto reference` 选项：
1. 找到热更新程序集的 `.asmdef` 文件。
2. 打开并编辑该文件。
3. 确保以下选项关闭：
   ```json
   "autoReferenced": false
   ```
4. 保存更改，重新编译项目。

---

### **7. 注意事项**
- **依赖管理**：
  - 关闭 `auto reference` 后，如果 `Assembly-CSharp` 需要访问热更新程序集中的代码，你需要手动在 `Assembly Definition References` 中显式引用。
  - 推荐将热更新逻辑和主逻辑隔离，避免 `Assembly-CSharp` 直接依赖热更新程序集。

- **模块化设计**：
  - 将热更新逻辑放在独立的命名空间和文件夹下，确保开发过程中不会意外引用。

- **打包验证**：
  - 在打包前，检查主程序集是否存在对热更新程序集的依赖，确保热更新功能可以正常运行。

---

### **总结**
这段建议的目的是防止主程序集 `Assembly-CSharp` 中误引用热更新程序集，避免因为编译模式冲突（AOT 和 JIT）导致打包失败或运行时问题。关闭热更新程序集的 `auto reference` 可以帮助你更好地控制依赖关系，避免无意的错误引用。

## Assembly-CSharp 程序集

**`Assembly-CSharp`** 是 Unity 项目的主程序集，通常是 Unity 的默认代码文件（例如 `Assets` 文件夹中的脚本）编译后生成的程序集。如果你的项目中仍然依赖它，**通常不能删除 `Assembly-CSharp`**，但可以通过以下方式避免直接使用它或完全移除它：

---

### **1. Assembly-CSharp 的作用**
- **默认代码程序集**：Unity 会将 `Assets` 文件夹中不属于任何自定义 Assembly Definition（`*.asmdef`）文件的代码编译到 `Assembly-CSharp` 中。
- **主逻辑存储**：如果你没有使用自定义 `asmdef` 文件，`Assembly-CSharp` 会包含你的大部分业务逻辑。

---

### **2. 什么时候可以删除 `Assembly-CSharp`？**
你可以通过以下步骤实现移除 `Assembly-CSharp`：

 **方法 1：全部使用 Assembly Definition**
1. **创建自定义程序集**：
   - 在项目中为所有代码文件创建 `*.asmdef` 文件，分离每个模块或子系统。
   - 每个 `*.asmdef` 文件会生成一个独立的程序集。

2. **移动脚本到自定义程序集**：
   - 将项目中的所有脚本文件移动到有 `*.asmdef` 文件的目录下。
   - 确保所有代码都属于自定义程序集。

3. **验证引用关系**：
   - 检查 `*.asmdef` 文件的依赖关系，确保模块之间的依赖正确配置。

4. **删除 Assembly-CSharp**：
   - 如果 `Assets` 根目录下没有脚本文件，Unity 将不会生成 `Assembly-CSharp`，从而实现移除。

---

### **3. 为什么通常不建议删除？**
 **性能影响**：
- **额外开销**：使用多个自定义程序集（`*.asmdef` 文件）可能增加编译时间，尤其是小型项目中，直接使用 `Assembly-CSharp` 会更简单且高效。

 **兼容性问题**：
- **第三方插件**：许多第三方插件默认使用 `Assembly-CSharp`，完全移除可能需要对这些插件做大量修改。

 **维护成本**：
- **依赖管理复杂**：多个 `*.asmdef` 文件增加了项目的复杂性，尤其是在多人协作时，可能会引入额外的依赖管理问题。

---

### **4. 推荐的实践**
 **小型项目**
- 保留 `Assembly-CSharp`，只需确保代码组织清晰即可。
- 如果需要动态加载或热更新，将热更新逻辑移到单独的程序集。

 **中大型项目**
- 使用 `*.asmdef` 文件分离模块：
  - 核心模块（例如网络、UI、热更新）使用独立程序集。
  - 非核心逻辑可以保留在 `Assembly-CSharp` 中，逐步迁移。
  
- 最终目标：移除 `Assembly-CSharp` 或只保留最基本的功能代码。

---

### **5. 总结**
- **可以删除**：只要你通过 `*.asmdef` 文件将所有脚本移动到自定义程序集，就可以完全移除 `Assembly-CSharp`。
- **不建议删除**：对于简单或中等规模的项目，保留 `Assembly-CSharp` 可以减少管理复杂性。
- **推荐方案**：逐步将核心模块从 `Assembly-CSharp` 中剥离，通过自定义程序集实现模块化管理，但无需过度追求完全移除。


## Scripting Backend -> IL2CPP
在使用 **HybridCLR** 进行热更新时，构建项目时将 **Scripting Backend** 切换为 **IL2CPP** 是出于以下原因：

---

### **1. IL2CPP 的作用**
- **IL2CPP（Intermediate Language To C++）** 是 Unity 提供的一种脚本编译方式，用于将 C# 脚本的 IL 代码转换为 C++ 代码，再通过平台的原生编译器（如 Clang）生成机器代码。
- **AOT（Ahead-Of-Time）编译** 是 IL2CPP 的核心特点，它会提前将代码编译为目标平台的二进制代码，而不是像 Mono 那样依赖 JIT（Just-In-Time）编译。

---

### **2. 为什么要使用 IL2CPP**
 **支持 AOT 和热更新并存**
HybridCLR 的核心是实现 AOT 和 JIT 的混合运行：
- **AOT 部分**：IL2CPP 编译器会提前将 Assembly-CSharp 等固定程序集编译为二进制代码（.so、.dll 等），确保性能和稳定性。
- **JIT 部分**：HybridCLR 允许运行时加载和执行动态热更新程序集（如 `Hotfix.dll`），这些代码在运行时解析并执行 IL 指令。

 **解决 Mono 的限制**
- Mono 支持 JIT，但在移动平台（如 Android 和 iOS）上只能运行 AOT 编译的代码，不支持动态加载新程序集。
- IL2CPP 提供更高效、更安全的运行时环境，同时通过 HybridCLR 增加了对 JIT 的支持，突破了 IL2CPP 默认不支持动态程序集的限制。

 **性能和安全性**
- IL2CPP 的运行效率比 Mono 更高，因为其生成的 C++ 代码经过了更优化的原生编译器处理。
- 更高的安全性：IL2CPP 将 C# 代码转换为本地机器码，反编译难度更高，适合发布对安全性要求高的项目（如手游）。

---

### **3. IL2CPP 与 HybridCLR 的协作**
HybridCLR 的热更新方案依赖 IL2CPP 的 AOT 特性，同时扩展了 IL2CPP 的功能：
1. **AOT 编译的主程序集**：
   - Unity 的默认程序集（如 `Assembly-CSharp`）和一些基础库通过 IL2CPP 编译为机器代码，保证核心功能的高性能和稳定性。
   
2. **JIT 执行的热更新程序集**：
   - HybridCLR 在运行时加载未编译的 IL 指令（如热更新 DLL），并在托管环境中解析和执行这些指令。
   - HybridCLR 会接管 IL2CPP 的一些功能（如 IL 解释器），实现动态程序集的加载和执行。

3. **自动生成桥接代码**：
   - HybridCLR 通过生成元数据和补丁，解决 AOT 和 JIT 混合模式下的调用问题，确保热更新逻辑可以无缝调用 AOT 编译的代码。

---

### **4. 总结**
将 **Scripting Backend** 切换为 **IL2CPP** 是 HybridCLR 的一个核心需求，原因包括：
1. **支持 AOT 模式**，提供高性能和跨平台兼容性。
2. **增强安全性**，通过机器代码降低反编译的可能性。
3. **兼容性要求**，Mono 不支持动态热更新程序集的加载，而 IL2CPP 在 HybridCLR 的扩展下支持这一功能。

因此，在 HybridCLR 构建过程中，切换到 **IL2CPP** 是实现热更新功能的必要步骤，同时也能保证项目的运行效率和安全性。

## Api Compatibility Level -> .NET Framework

在使用 **HybridCLR** 或实现热更新时，通常需要将 **Api Compatibility Level** 切换为 **.NET 4.x**（Unity 2019-2020）或 **.NET Framework**（Unity 2021+）。这是因为：

---

### **1. API Compatibility Level 的作用**
- **定义了 Unity 项目的运行时 API 集合版本**，控制了 C# 语言功能、类库功能以及第三方依赖支持的范围。
- Unity 提供两种主要的 API Compatibility Level：
  1. **.NET Standard 2.0**：一种跨平台的精简子集，支持最基本的 .NET API。
  2. **.NET 4.x（或 .NET Framework in Unity 2021+）**：包含更全面的 .NET API，支持更多高级特性和库。

---

### **2. 为什么要选择 .NET 4.x 或 .NET Framework**
 **更广泛的 API 支持**
- **.NET Standard 2.0 的限制**：精简版 API 会导致许多常用的 .NET 类库无法使用（例如部分反射功能、泛型类型扩展等）。
- **.NET 4.x 的优势**：提供完整的 .NET Framework 功能，如高级的反射机制、动态加载程序集、`System.IO` 等功能模块。
- HybridCLR 需要在运行时加载和执行热更新的 DLL，通常需要依赖 **完整反射功能** 和其他高级特性，因此需要更高版本的 API 支持。

 **兼容性与功能性**
- 热更新逻辑中，动态加载的 DLL 可能会依赖于完整的 .NET Framework API。
- HybridCLR 和许多第三方插件（如 Json.NET、各种 ORM 框架）也往往依赖于 .NET 4.x 的特性。

 **编译支持**
- .NET 4.x 可以更好地支持现代 C# 语言特性（如异步流、元组、多模式匹配等），使开发和维护更加便捷。
- 对于 Unity 项目中的热更新模块，切换到 .NET 4.x 可以减少潜在的兼容性问题。

---

### **3. Unity 版本的变化**
- **Unity 2019-2020**：仍然将 .NET 4.x 和 .NET Standard 2.0 并列提供。
- **Unity 2021+**：将 **.NET Framework**（等效于 .NET 4.x）替代了 .NET Standard 2.0，成为推荐选项。

> Unity 2021 起，Unity 逐步向 **.NET Core/.NET 5** 方向迁移，因此 API 层级有所变化。

---

### **4. 为什么不选择 .NET Standard 2.0？**
 **功能不足**
- **限制反射功能**：`System.Reflection.Emit` 等特性在 .NET Standard 2.0 中受到限制。
- **API 缺失**：许多成熟的类库（如高级的 LINQ 查询、数据操作库）需要 .NET 4.x 的支持。

 **第三方依赖问题**
- 许多第三方库没有完全支持 .NET Standard 2.0，而是为 .NET Framework 或更高版本设计。

 **不适合热更新**
- 热更新需要动态加载和解释运行程序集（DLL），这对反射、动态类型支持、程序集加载有较高要求，.NET Standard 2.0 无法满足。

---

### **5. 如何切换 API Compatibility Level**
 **Unity 2019-2020**
1. 打开 **Edit > Project Settings > Player > Other Settings**。
2. 找到 **Api Compatibility Level**。
3. 选择 **.NET 4.x**。

 **Unity 2021+**
1. 同样在 **Player > Other Settings**。
2. 将 **Api Compatibility Level** 切换为 **.NET Framework**。

---

### **6. 总结**
将 **Api Compatibility Level** 切换为 **.NET 4.x**（或 Unity 2021+ 中的 **.NET Framework**）的原因：
1. **支持更丰富的 .NET API**，如高级反射、动态加载等功能，满足热更新需求。
2. **提高兼容性**，使项目能够使用现代 C# 特性及第三方类库。
3. **解决热更新的技术需求**，尤其是在 HybridCLR 或其他动态加载框架中。

> 如果你的项目使用热更新，或者依赖于复杂的第三方库，这是必要的一步。

## C++ Compiler Configuration: Debug

**C++ Compiler Configuration: Debug** 是一个配置选项，通常出现在项目的编译环境设置中（如 Unity、Visual Studio 或其他开发工具）。它的作用是指定 **C++ 编译器的调试配置**，用于生成方便调试的二进制文件。以下是关于这个配置的详细解释：

---

### **1. Debug 配置的主要用途**
- **调试优化**：生成的二进制文件包含调试符号，允许你在调试器（如 Visual Studio 或 Unity Profiler）中查看变量值、调用栈和程序执行流。
- **更低的优化级别**：为了方便调试，编译器会降低或禁用某些代码优化，这使得生成的代码结构更接近源代码。
- **额外信息嵌入**：会嵌入调试信息，例如源文件的路径、行号和符号表，以便与调试器协同工作。

---

### **2. Debug 与 Release 的区别**
| 特性                  | Debug 配置                             | Release 配置                     |
|-----------------------|---------------------------------------|----------------------------------|
| **优化级别**         | 较低或无优化，保留完整源代码结构      | 高度优化，删除无用代码          |
| **调试符号**         | 包含完整调试符号                     | 通常不包含调试符号              |
| **运行时性能**       | 较低（因优化级别低）                  | 高效（因高度优化）              |
| **文件大小**         | 较大（包含调试信息和未优化代码）      | 较小                            |
| **适用场景**         | 开发和调试阶段                       | 产品发布阶段                   |

---

### **3. 在 Unity 中的应用**
在 Unity 项目中，使用 **C++ Compiler Configuration: Debug** 的场景通常与底层插件开发或 IL2CPP 编译有关。

 **IL2CPP 和 Debug 配置**
- **IL2CPP**（Intermediate Language to C++）：Unity 会将 C# 脚本转译为中间语言（IL），然后通过 IL2CPP 转换为 C++ 代码，最后编译为目标平台的二进制文件。
- 当你选择 Debug 配置时，Unity 会为生成的 C++ 代码启用调试符号，从而更容易在开发工具中调试底层代码。

---

### **4. 配置 Debug 的好处**
1. **调试能力增强**：
   - 能够设置断点、逐步执行代码，排查运行时问题。
   - 支持查看复杂数据结构、对象状态。
2. **快速发现问题**：
   - 错误信息更准确（例如指向具体的源代码行）。
   - 更容易重现和分析程序中的崩溃或异常。
3. **适合开发阶段**：
   - 调试配置允许开发人员专注于功能的正确性，而不必担心性能问题。

---

### **5. 配置 Debug 的缺点**
1. **性能较低**：由于禁用了某些优化，运行速度可能明显慢于 Release 配置。
2. **文件较大**：包含调试符号和未优化的代码，生成的文件体积较大。
3. **发布不可用**：Debug 配置的二进制文件通常不适合作为最终产品发布。

---

### **6. 如何切换到 Debug 配置**
 **在 Unity 中**
1. **编辑器设置**：
   - 打开 **Edit > Preferences > External Tools**。
   - 在 **C++ Compiler Configuration** 中选择 **Debug**。
2. **Build Settings**：
   - 在 Unity 的 **Build Settings** 中选择 **Development Build**，会启用调试模式。

 **在 Visual Studio 或其他工具中**
1. 在解决方案配置中，选择 **Debug** 配置。
2. 检查编译器选项，确保启用了调试符号（如 `/DEBUG` 标志）。

---

### **7. 适用场景**
- **开发和调试阶段**：需要验证逻辑、排查 Bug 或分析运行时问题。
- **测试复杂逻辑**：如自定义 Native 插件、复杂算法或与平台相关的代码。
- **集成第三方库**：调试与第三方库的交互问题。

---

### **8. 总结**
**C++ Compiler Configuration: Debug** 是为开发和调试阶段准备的编译配置，提供了强大的调试能力，但牺牲了一定的性能和文件体积。它适合在项目开发阶段使用，而最终发布阶段应该切换到 **Release 配置** 以获得最佳的性能和较小的文件体积。

## Use Incremental GC: true

**Use Incremental GC: true** 是 Unity 中的一项配置，用于启用 **增量垃圾回收（Incremental Garbage Collection）**，以改善游戏运行时的性能表现，特别是在内存管理方面。

---

### **1. 什么是垃圾回收（Garbage Collection, GC）？**
垃圾回收是 Unity（和许多其他运行时环境）用来自动管理内存的一种机制。它会回收那些不再被引用的对象所占用的内存，从而避免内存泄漏。然而，传统的垃圾回收机制可能会导致性能问题：

- **传统 GC** 是全暂停式的（Stop-the-World）：当垃圾回收运行时，游戏的所有逻辑都会暂停，直到回收完成。
- 如果内存分配量较大或对象复杂，可能会导致显著的帧率下降（卡顿）。

---

### **2. 增量垃圾回收（Incremental GC）**
增量垃圾回收是传统垃圾回收的优化版本，它将回收工作分为多个小的步骤，而不是一次性完成。这些步骤分散在多帧中执行，从而避免了长时间的暂停。

 **工作原理**：
- 将垃圾回收的工作拆分成更小的任务块。
- 在每一帧中执行一部分任务，而不是整个回收过程。
- 减少垃圾回收对帧率的影响，提高游戏的流畅性。

---

### **3. 启用 Use Incremental GC 的好处**
1. **减少卡顿**：
   - 垃圾回收不再集中发生，暂停时间减少，帧率更加稳定。
2. **适合大型项目**：
   - 对于使用大量动态对象或频繁分配内存的项目（如开放世界、模拟类游戏），增量垃圾回收更能提升用户体验。
3. **平滑性能**：
   - 提高低端设备上的性能表现，避免内存回收造成的长时间卡顿。

---

### **4. 使用场景**
- **大型游戏**：如开放世界游戏、大型多人在线游戏。
- **频繁内存分配的项目**：如实时生成内容的游戏、动态创建 UI 元素的应用。
- **目标平台是移动设备**：尤其是低端设备，对性能敏感时，启用增量垃圾回收可以改善运行表现。

---

### **5. 注意事项**
1. **增量垃圾回收不是万能的**：
   - 虽然它减少了暂停时间，但回收总时间可能会比传统 GC 更长（因为回收被分摊到了多帧中）。
2. **可能引入额外的性能开销**：
   - 如果项目本身对 GC 依赖较少，可能无法显著受益。
3. **需要配合优化内存分配**：
   - 减少大对象分配和频繁分配内存的操作，仍是优化性能的关键。
4. **与某些功能冲突**：
   - 某些 Unity 功能或插件可能对增量 GC 的行为不兼容，需测试。

---

### **6. 如何启用 Incremental GC**
 在 Unity 编辑器中：
1. 打开 **Edit > Project Settings > Player**。
2. 找到 **Other Settings**。
3. 勾选 **Use Incremental GC**。

 代码中检测增量 GC：
你可以在代码中检查或设置是否启用了增量垃圾回收：
```csharp
Debug.Log($"Incremental GC Enabled: {UnityEngine.Scripting.GarbageCollector.isIncremental}");
```

---

### **7. 总结**
启用 **Incremental GC** 是一种平衡性能和垃圾回收开销的解决方案，特别适用于复杂和内存密集型的游戏场景。它减少了游戏中因垃圾回收导致的明显卡顿，提升了玩家体验。不过，要确保你的项目确实需要它，并在启用后测试性能表现，以避免引入不必要的额外开销。


## [不支持的特性](https://hybridclr.doc.code-philosophy.com/docs/basic/notsupportedfeatures)

## 代码裁剪

>问题：
由于上一次的代码中完全没有用到例如GameObject，导致GameObject类型的部分函数在打包时被裁剪。（这只是个假设，目前GameObject是不会被裁剪掉的，但是其他非核心代码会存在这个问题）

>解决方案：
HybridCLR/Generate/All命令会重新扫描热更新程序集，生成link.xml以保留热更新代码中用到的类型。请运行完该命令后重新构建一次新包，否则运行下一步的热更新代码时会出现GameObject::.ctor函数找不到的错误。

### 问题背景

在 Unity 中，**代码裁剪** 是指通过 IL2CPP 或 Mono 的 `Managed Stripping Level` 设置，在构建过程中剔除未使用的代码和类型，以减小包体积。然而，这种优化可能会错误地移除在代码中未直接引用的类型或成员，但它们可能通过反射或其他动态调用方式在运行时需要使用。

你提到的问题是：

1. 未使用 `GameObject` 类的代码路径被裁剪：由于在热更新程序集（通常是指通过 HybridCLR 等热更新解决方案的管理代码）中没有显式引用 `GameObject` 类型及其构造函数，Unity 在打包过程中将其裁剪。
2. **热更新运行时报错**：当热更新逻辑试图动态创建 `GameObject`（例如调用 `new GameObject()`）时，会抛出 `GameObject::.ctor` 找不到的错误。

为了解决这个问题，HybridCLR 提供了一种方式来扫描热更新程序集并生成 `link.xml` 文件，该文件用于显式声明哪些类型或成员需要保留，防止被裁剪。

---

### 解决方法

以下是对 HybridCLR 解决方案以及相关步骤的详细讲解：

#### 1. **HybridCLR/Generate/All 命令**
此命令的作用是扫描你的热更新程序集，分析代码中动态使用的类型和成员，生成一个 `link.xml` 文件。  
`link.xml` 是 Unity 提供的一个配置文件，用于手动指定哪些类型或成员需要在裁剪过程中保留。

- **HybridCLR 特性**：它可以更智能地分析热更新程序集，自动添加需要的类型。
- **生成后的内容**：`link.xml` 会包含类似以下内容：
  ```xml
  <linker>
      <assembly fullname="UnityEngine">
          <type fullname="UnityEngine.GameObject" preserve="all" />
      </assembly>
  </linker>
  ```
  这表明 `GameObject` 类型及其所有成员都不会被裁剪。

#### 2. **重新构建包**
生成 `link.xml` 后，重新构建一次项目：
- 构建的过程会读取 `link.xml` 文件，确保裁剪器不会移除你在热更新代码中需要的类型和方法。
- 如果不重新构建，旧包中依然会存在被裁剪的问题。

#### 3. **动态调用的类型声明**
即使你的代码没有直接使用 `GameObject`，比如通过反射或字符串名称创建实例（`Activator.CreateInstance("GameObject")`），`link.xml` 也能确保这些动态调用所需的类型不会被移除。

---

### 运行步骤

1. 确保你的热更新代码中显式或隐式引用了需要保留的类型。例如：
   ```csharp
   var obj = new GameObject(); // 确保 GameObject 被显式使用
   ```
2. 运行 `HybridCLR/Generate/All`：
   - 打开 Unity 菜单：`HybridCLR` > `Generate` > `All`。
   - 等待生成完成。
3. 检查生成的 `link.xml` 文件：
   - 路径通常位于 `Assets/HybridCLR/Linker/link.xml`。
   - 确认文件中包含类似以下内容：
     ```xml
     <type fullname="UnityEngine.GameObject" preserve="all" />
     ```
4. 构建新包：
   - 通过 `File` > `Build Settings` > `Build` 或者运行构建脚本，生成新的包。

---

### 其他注意事项

1. **动态调用的预防措施**：
   如果你的热更新代码通过反射、字符串或其他方式调用 `GameObject`，需要确保这些类型明确添加到 `link.xml`，否则仍然可能被裁剪。

2. **测试热更新逻辑**：
   在构建包后，测试是否能正确运行热更新逻辑。建议在开发模式下运行热更新代码进行验证。

3. **裁剪级别设置**：
   如果你不希望裁剪器过于激进，可以降低 `Managed Stripping Level` 设置：
   - 路径：`Edit` > `Project Settings` > `Player` > `Other Settings` > `Managed Stripping Level`。
   - 设置为 `Low`，确保更多类型保留。

通过这些步骤，你可以有效避免热更新中 `GameObject` 类型丢失的问题。

### 代码裁剪相关问题


Unity使用了代码裁剪技术来帮助减少il2cpp backend的包体大小。如果未做防裁剪处理，由于AOT主工程里的代码一般不多，大量的C#类型和函数被 裁剪，导致热更新中调用这些被裁剪类或函数出现如下异常：
``` c#
    // 类型缺失错误
    Unity: TypeLoadException: Could not load type 'Xxx' from assembly 'yyy'

    // 函数缺失错误
    MissingMethodException: xxxx
```
解决办法:

>根据日志错误日志确定哪个类型或函数被裁减，在link.xml里保留这个类型或函数，或者在主工程里显式地加上对这些类或函数的调用。 如果不熟悉如何在link.xml保留这个类型或函数，请参阅代码裁剪。

但这种办法终究很麻烦，实际项目中有大量被裁剪的类型，你一遍遍地进行"打包-类型缺失-补充-打包"的操作， 浪费了太多时间。 com.code-philosophy.hybridclr 包提供了一个便捷的菜单命令HybridCLR/Generate/LinkXml， 能一键生成热更新工程里的所有AOT类型及函数引用。

警告:
>注意，如果你主工程中没有引用过某个程序集的任何代码，即使在link.xml中保留，该程序集也会被完全裁剪。因此对于每个要保留的AOT程序集， 请确保在主工程代码中显式引用过它的某个类或函数。

#### AOT类型及函数预留
com.code-philosophy.hybridclr的HybridCLR/Generate/LinkXml命令虽然可以智能地扫描出你当前引用的AOT类型，却不能预知你未来将来使用的 类型。因此你仍然需要有规划地提前在 Assets/link.xml(注意！不是自动生成的那个link.xml)预留你将来 可能用到的类型。切记不要疏漏，免得出现上线后某次更新使用的类型被裁剪的尴尬状况！



## [增量构建](https://docs.unity3d.com/2022.3/Documentation/Manual/incremental-build-pipeline.html)
支持版本
- 2021.3
- 2022.3
- Unity 6


## 将脚本挂载到热更新资源
由于Unity资源管理系统的限制，热更新脚本所挂载的资源（prefab、scene、ScriptableObject资源）必须打成assetbundle，从ab包中实例化资源，才能正确还原脚本。

>如果将热更新脚本挂载到Resources等随主包的资源上，会发生scripting missing的错误！但如果先打成assetbundle包，再放到Resources下，运行时加载该随包assetbundle则没有问题。

>挂载热更新脚本的资源（场景或prefab）必须打包成ab，在实例化资源前先加载热更新dll即可（这个要求是显然的！）。

## 热更代码中使用AOT中定义的泛型类或函数【方案】[（补充元数据）](https://hybridclr.doc.code-philosophy.com/docs/beginner/generic)

参考手册：[AOT 泛型](https://hybridclr.doc.code-philosophy.com/docs/basic/aotgeneric#%E4%BC%98%E5%8C%96%E8%A1%A5%E5%85%85%E5%85%83%E6%95%B0%E6%8D%AEdll%E5%A4%A7%E5%B0%8F)
>补充元数据技术的缺陷是增大了包体或者需要额外下载补充元数据dll，导致工作流复杂一些，另外还多占用了内存。

### 问题复现

**背景：** 如果AOT中没有实例化过某个AOT泛型类或者函数，泛型参数有可能是热更新类型，不可能在AOT中提前实例化。例如你在热更新代码中定义了 struct MyVector3 {int x, y, z;}，你不可能在AOT中提前实例化List<MyVector3>。

以下是一个示例，通过代码展示了在 **AOT 模式下**，如果未提前实例化泛型类或函数，当泛型参数为热更新代码定义的类型时会出现问题，以及如何通过 **HybridCLR** 解决这个问题。

**为什么泛型类在 AOT 中定义？**
>在 AOT 编译模式下，泛型类型的处理与普通类型不同。泛型类型（如 List<T> 或自定义的 MyVector3）是 参数化类型，它们的实际类型（例如 List<MyVector3>）需要在编译时确定。由于 AOT 编译 是提前进行的，因此在代码编译阶段，AOT 编译器需要知道所有泛型类型的完整定义。

**具体原因：**
- 泛型类型的元数据必须预先定义：AOT 编译的目标是生成机器代码，因此所有的类型和类型参数必须在编译时完全确定。由于泛型类型在运行时可能会有不同的类型参数（例如 List<MyVector3>），AOT 编译器必须提前知道每种类型的结构，以便生成正确的机器码。

- 热更新程序集中的泛型类型需要在 AOT 中补充元数据：假设你在热更新程序集中使用了 List<MyVector3> 和 MyVector3，虽然你在热更新程序集里声明了这些类型，但它们本身是 依赖于AOT编译时的泛型类型定义 的。为了保证在热更新过程中这些类型能够正确识别和操作，必须将它们的元数据（例如类型信息、泛型参数等）传递给 AOT 编译器，以便它能够为不同的类型生成代码和元数据。

---

### **示例问题描述**
假设我们在 **AOT 项目代码** 中未显式实例化泛型类 `List<T>`，而在热更新代码中定义了一个新类型 `MyVector3`，并尝试使用 `List<MyVector3>`。因为 **AOT 编译器**无法预测 `MyVector3` 的存在，运行时会报错或崩溃。

---

### **AOT 项目代码（主工程代码）**
```csharp
using System;
using System.Collections.Generic;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("Main Program Running");

        // 模拟加载热更新代码
        LoadHotfixCode();
    }

    private static void LoadHotfixCode()
    {
        // 假设这是热更新代码的入口，动态加载并执行热更新逻辑
        HotfixEntry.Execute();
    }
}
```



### **热更新代码（需要 HybridCLR 支持）**
```csharp
using System;
using System.Collections.Generic;

public struct MyVector3
{
    public int x, y, z;

    public MyVector3(int x, int y, int z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public override string ToString() => $"({x}, {y}, {z})";
}

public static class HotfixEntry
{
    public static void Execute()
    {
        Console.WriteLine("Hotfix Code Running");

        // 定义热更新类型 MyVector3
        List<MyVector3> myVectorList = new List<MyVector3>();

        // 尝试向 List<MyVector3> 中添加数据
        myVectorList.Add(new MyVector3(1, 2, 3));
        myVectorList.Add(new MyVector3(4, 5, 6));

        foreach (var vec in myVectorList)
        {
            Console.WriteLine($"Vector: {vec}");
        }
    }
}
```




**报错：**
>MissingMethodException: AOT generic method not instantiated in aot. assembly:mscorlib.dll, method:System.Void System.Collections.Generic.List`1[MyVector3]::Add(MyVector3)

`注意`:
**AOT 程序集通过反射加载过的类，AOT 会提前生成该类的泛型代码，故这种情况不受影响。**


## 配置热更新程序集

### `HybridCLR` 中的这三个程序集列表

1. **Hot Update Assembly Definitions**  
   这个列表通常是用于配置哪些 **程序集定义（Assembly Definitions）** 被标记为 **热更新程序集**。在 Unity 中，**程序集定义** 是用于组织和管理脚本程序集的资源。热更新程序集是指那些你希望通过 `HybridCLR` 框架进行动态加载和热更新的程序集。
   - **作用**：你可以在这里指定哪些程序集定义需要参与热更新。通常，你会在这些程序集定义中包含热更新代码（例如，游戏的业务逻辑代码）。

2. **Hot Update Assemblies**  
   这个列表用于列出需要通过 **热更新机制** 加载的实际 **程序集**。这些程序集会包含你游戏的更新代码，并且通过 `HybridCLR` 可以在运行时加载。你可能会使用这些程序集来改变游戏的行为、修复 bug 或新增功能，而不需要重新构建整个游戏。
   - **作用**：列出你所有的热更新程序集。你会将包含热更新代码的 DLL 文件添加到这个列表，以便在游戏运行时进行动态加载和更新。

3. **Preserve Hot Update Assemblies**  
   这个列表是用来列出那些 **需要保留的热更新程序集**。保留的热更新程序集通常是指那些需要在热更新过程中始终保留的程序集，可能包含关键的基础功能代码或在更新后不需要改变的部分。
   - **作用**：确保这些程序集在热更新过程中不被修改或删除。一般来说，这些程序集包含的是核心功能，确保它们不被意外删除或替换。

### 配置程序集
一般来说，必须将热更新代码独立为assembly，才能方便地进行热更新。

#### 程序集分类
1. Assembly Definition定义的程序集
这是Unity推荐的程序集方式。将一个大的Unity项目代码拆分为多个程序集模块，便于管理，缩短编译时间。

2. Assembly-CSharp 程序集

这是Unity的默认全局程序集。它可以像普通dll一样当作热更新程序集。

1. 普通的dll程序集
一些代码被提前编译成dll文件，再移到项目中。

#### 划分程序集

很显然，项目代码必须合理拆分为AOT（即编译到游戏主包内）程序集 和 热更新程序集，才能进行热更新。HybridCLR对于 怎么拆分程序集并无任何限制，甚至可以把第三方工程中的代码作为热更新程序集。一般来说，游戏刚启动时，至少需要一个AOT程序集来负责启动及热更新相关工作。

常见的拆分方式有几种：

- Assembly-CSharp作为AOT程序集。剩余代码自己拆分为N个AOT程序集和M个热更新程序集。
- Assembly-CSharp作为热更新程序集。剩余代码自己拆分为N个AOT程序集和M个热更新程序集。

无论哪种拆分方式，正确设置好程序集之间的引用关系即可。请不要在AOT程序集中引用热更新程序集，这会导致打包出错。如果 你们项目把Assembly-CSharp作为AOT程序集，强烈建议关闭热更新程序集的auto reference选项。因为Assembly-CSharp是最顶层assembly，它会自动引用剩余所有assembly，很容易就出现失误引用热更新程序集的情况。

### 配置
点击菜单 HybridCLR/Settings 打开配置界面。

- 如果是Assembly Definition(asmdef)方式定义的程序集，加入hotUpdateAssemblyDefinitions
- 如果是普通dll或者Assembly-CSharp.dll，则将程序集名字（不包含'.dll'后缀，如Main、Assembly-CSharp）加入hotUpdateAssemblies。
  
hotUpdateAssemblyDefinitions和hotUpdateAssemblies列表是等价的，不要重复添加，否则会报错。

## 关闭 **Automatic References 属性** 

在 **HybridCLR** 的环境中，**热更新程序集**（Hotfix Assembly）关闭 **`Automatic References` 属性** 主要是为了避免某些潜在的问题和确保热更新模块的正确性与独立性。这里的原因可以从多个角度来分析：

### 1. **避免不必要的程序集引用**
   - **热更新程序集** 本身是为了动态更新程序中的部分逻辑而设计的。其目的是提供灵活的修改和补充功能，而不是依赖于编辑时的静态程序集（例如 `Assembly-CSharp.dll`）。
   - 如果开启 `Automatic References`，热更新程序集可能会自动引入一些不必要的引用（例如 Unity 的核心引擎程序集或其他不需要的程序集），这会导致热更新代码与编辑时程序集产生依赖关系，从而影响热更新的独立性和模块化。

### 2. **防止与AOT代码的冲突**
   - **HybridCLR** 中的热更新代码通常是通过 IL2CPP 和 AOT（Ahead Of Time Compilation）编译的。在这种环境下，AOT 编译时要求所有热更新程序集（例如脚本中的类和方法）在编译时能够被解析和实例化。
   - 如果启用 `Automatic References`，热更新程序集可能会依赖于一些 AOT 编译的程序集（例如 `UnityEngine.dll`），这些程序集在编译时可能已经包含了大量的代码和类型信息，这会导致热更新程序集在运行时无法正确解析，甚至引发 `MissingMethodException` 或类型冲突。
   
### 3. **控制热更新程序集的引用**
   - 热更新程序集应该是一个相对独立的模块，只依赖于最基本的运行时环境和一些必要的外部程序集（例如 `mscorlib` 或者 Unity 的基本组件），而不是直接依赖于 Unity 编辑器中的程序集。
   - 关闭 `Automatic References` 可以帮助开发者更好地控制热更新程序集所依赖的内容，确保它只依赖于真正需要的程序集，而不会误引入不必要的依赖，保持热更新代码的轻量性和灵活性。

### 4. **解决程序集大小与热更新性能问题**
   - 通过关闭 `Automatic References`，可以避免自动引用一些不必要的程序集，这有助于减小热更新程序集的大小，提高热更新代码的加载和执行效率。
   - 如果 `Automatic References` 被启用，Unity 会尝试自动为热更新程序集添加大量的引用，可能会导致程序集膨胀，从而增加热更新时加载和反射的开销。

### 5. **避免热更新与编辑时环境的耦合**
   - 热更新程序集应该是可以独立于编辑时环境进行更新和运行的。启用 `Automatic References` 会使热更新程序集与 Unity 编辑器及其工具链产生耦合，使得它们在运行时也依赖于编辑时的程序集，这会限制热更新的灵活性和可移植性。
   - 关闭 `Automatic References` 可以保证热更新程序集的独立性，不会受到编辑时环境的影响，确保它在不同平台、不同构建环境下的兼容性。

### 6. **避免潜在的热更新类型与 AOT 类型冲突**
   - 由于热更新程序集中的类型可能会被编译为 AOT 类型，若这些类型与 `Automatic References` 自动引入的程序集中的类型存在冲突或重名，可能会导致运行时错误。
   - 通过关闭 `Automatic References`，开发者可以避免这类潜在冲突，确保热更新代码与 AOT 环境中的类型完全隔离。

### 总结
在 **HybridCLR** 环境中，关闭热更新程序集的 **`Automatic References`** 属性有助于：
1. **提高热更新代码的独立性**，避免与编辑时环境的程序集产生依赖关系。
2. **避免不必要的程序集引用**，减小热更新程序集的大小和加载开销。
3. **确保与 AOT 代码的兼容性**，避免因引用冲突或类型实例化问题导致的运行时错误。
4. **提升热更新的性能**，减少不必要的反射和程序集加载时间。

因此，关闭 `Automatic References` 是一种确保热更新模块在 **HybridCLR** 环境中能够正确、独立运行的做法，能够保证热更新系统的稳定性和灵活性。




## [加载更新assembly](https://hybridclr.doc.code-philosophy.com/docs/basic/runhotupdatecodes)
- 通过反射直接运行热更新函数
- 通过反射创造出Delegate后运行
- 通过反射创建出对象后，再调用接口函数
- 通过动态AddComponent运行脚本代码
- `推荐` 通过初始化从打包成assetbundle的prefab或者scene还原挂载的热更新脚本(这种方法不需要借助任何反射，而且跟原生的启动流程相同，推荐使用这种方式**初始化热更新入口代码**！)


## 打包工作流
由于热更新本身的要求以及Unity资源管理的一些限制，对打包工作流需要一些特殊处理，主要分为几部分：

- 设置UNITY_IL2CPP_PATH环境变量
- 打包时自动排除热更新assembly
- 打包时将热更新dll名添加到assembly列表
- 将打包过程中生成的裁剪后的aot dll拷贝出来，供补充元数据使用
- 编译热更新dll
- 生成一些打包需要的文件和代码
- iOS平台的特殊处理


### 打包流程
- 运行菜单 HybridCLR/Generate/All 一键执行必要的生成操作
- 将HybridCLRData/HotUpdateDlls下的热更新dll添加到项目的热更新资源管理系统
- 将HybridCLRData/AssembliesPostIl2CppStrip下的补充元数据 dll添加到项目的热更新资源管理系统
- 根据你项目原来的打包流程打包

## 安卓打包流程优化（耗时）
- 运行 HybridCLR/Generate/LinkXml
- 导出工程
- 运行 HybridCLR/Generate/Il2cppDef
- 运行 HybridCLR/Generate/MethodBridge生成桥接函数
- 运行 HybridCLR/Generate/PReverseInvokeWrapper。 不需要与lua之类交互的项目可跳过此步。
- 将 {proj}\HybridCLRData\LocalIl2CppData-{platform}\il2cpp\libil2cpp\hybridclr\generated目录 替换导出工程中的此目录。
- 在导出工程上执行build

[ios处理参考该链接](https://hybridclr.doc.code-philosophy.com/docs/basic/buildpipeline#ios%E5%B9%B3%E5%8F%B0%E7%9A%84%E7%89%B9%E6%AE%8A%E5%A4%84%E7%90%86)

[build webgl](https://hybridclr.doc.code-philosophy.com/docs/basic/buildwebgl)
### [脚本后端](https://docs.unity3d.com/Manual/scripting-backends.html)
 “后端” 并不是指服务器端，而是指 Unity 引擎中的编译和执行环境。在 Unity 中，尤其是在涉及到 IL2CPP 和 HybridCLR 的开发时，"后端" 是指你应用程序代码的 **编译方式** 和 **执行方式**。“后端” 指的其实是你选择的 C# 代码运行的环境。具体来说：

- IL2CPP（Intermediate Language to C++） 是 Unity 的一个脚本后端，它将 C# 脚本代码转换成 C++ 代码，再通过 C++ 编译器生成原生机器码。
- Mono 是另一种脚本后端，它直接通过 Mono 虚拟机运行 C# 代码。

### 1. **什么是“导出工程”？**

“导出工程”在这里指的是从 Unity 编辑器生成的项目文件（或者构建出的本地工程）的一部分。在 Unity 中使用 **HybridCLR** 时，尤其是在 IL2CPP 后端模式下，通常需要与 Unity 的原生代码交互，生成相应的工程文件，以便进行后续的构建和修改。

具体来说，**导出工程** 就是使用 **IL2CPP** 脚本后端编译时，Unity 会生成一份包含 C++ 代码和相关文件的工程，这个工程是你用来编译和生成最终的原生平台（如 iOS 或 Android）程序的基础。

### 2. **具体流程解释**

#### 2.1 **运行 `HybridCLR/Generate/LinkXml`**

`LinkXml` 生成的作用是 **生成 IL2CPP 的链接配置**，它用于指示 IL2CPP 编译器哪些类、方法和属性需要保留下来。在 IL2CPP 构建过程中，IL2CPP 会进行代码裁剪（linking），只保留实际使用到的代码。`LinkXml` 允许你保留特定的代码段（例如热更新相关的代码）。

- **目的**：确保热更新的代码（如热更新 DLL 中的类和方法）不会在 IL2CPP 编译时被裁剪掉。
- **输出**：生成一个 `link.xml` 文件，里面定义了需要保留的类和方法。

#### 2.2 **导出工程**

“导出工程”通常指的是从 Unity 项目中 **构建出一个原生的工程文件**，通常是 **C++ 工程**，用于 iOS 或 Android 等平台，依赖于 IL2CPP 编译后生成的代码。这个步骤通过 Unity 编辑器构建项目，生成适合平台的本地工程文件。

- **Unity 编辑器操作**：选择适合的平台（如 iOS、Android），然后执行 **Build** 或 **Export** 操作，生成一个本地平台的工程文件（如 iOS 的 Xcode 工程或 Android 的 CMake 工程）。

#### 2.3 **运行 `HybridCLR/Generate/Il2cppDef`**

`Il2cppDef` 主要的作用是生成与 IL2CPP 后端相关的代码定义文件。这些定义文件将帮助 HybridCLR 在 IL2CPP 编译的过程中与原生代码进行桥接。

- **目的**：生成一些 C++ 定义，确保 HybridCLR 可以通过 IL2CPP 后端正确地与 C# 热更新代码进行交互。
- **输出**：生成 C++ 文件和定义，可能会被包含在后续的构建工程中。

#### 2.4 **运行 `HybridCLR/Generate/MethodBridge`**

`MethodBridge` 会生成所谓的 **桥接函数**，这些桥接函数用于连接 IL2CPP 后端的 C++ 代码与 Unity 的 C# 代码。

- **目的**：生成桥接函数代码，确保 C# 代码与原生 C++ 代码之间可以通过 IL2CPP 后端进行正确的调用。特别是 HybridCLR 使用这些桥接函数来调用热更新程序集中的方法。
- **输出**：生成 C++ 桥接函数文件，通常包括函数声明和实现。

#### 2.5 **运行 `HybridCLR/Generate/PReverseInvokeWrapper`（如果需要）**

`PReverseInvokeWrapper` 是用于生成 **反向调用的包装函数**。如果你的项目需要与如 Lua 等脚本语言交互（例如 Lua 调用 C# 代码），你需要这一步生成的代码。如果项目中不需要与 Lua 等脚本引擎交互，可以跳过这一步。

- **目的**：生成允许脚本语言（如 Lua）调用 C# 热更新代码的包装函数。
- **输出**：生成 C++ 包装函数文件，这些文件通常会作为脚本语言与 C# 代码交互的中间桥梁。

#### 2.6 **替换生成的目录**

你需要将生成的文件替换到 **导出工程** 中的相应目录，这些文件是由 HybridCLR 的生成工具（如 `MethodBridge` 和 `PReverseInvokeWrapper`）生成的。具体步骤如下：

- 找到 `HybridCLRData/LocalIl2CppData-{platform}/il2cpp/libil2cpp/hybridclr/generated` 目录。
- 将该目录中的文件复制到导出工程中的相应目录中。

这一步的目的是确保 HybridCLR 生成的代码（如桥接函数、反向调用包装函数等）已经被包含在导出工程中，以便后续的编译和构建。

#### 2.7 **在导出工程上执行 build**

最后一步是 **在导出工程中进行构建**。你需要通过构建工具（如 Xcode 或 Android Studio）编译并生成最终的应用程序。这一步将会使用 HybridCLR 生成的代码与热更新 DLL 进行链接，构建出最终的原生应用。

- **构建操作**：使用 Xcode（对于 iOS）或 Android Studio（对于 Android）对导出的工程进行编译和构建，生成最终的 APK 或 IPA 文件。
- **输出**：最终的应用程序包（如 APK 文件或 IPA 文件），该文件包含了 IL2CPP 后端生成的本地代码和 HybridCLR 的热更新功能。

### 3. **总结**

整个流程大致上是为了支持在 IL2CPP 构建环境下的热更新功能，特别是在 Unity 使用 HybridCLR 进行热更新时，涉及到以下几个关键步骤：

1. **生成 IL2CPP 配置和定义文件**，确保热更新代码不被裁剪。
2. **导出本地工程**，生成适合目标平台的 C++ 工程。
3. **生成桥接函数和反向调用包装函数**，让 C# 热更新代码与原生代码正确交互。
4. **替换和整合生成的文件**，确保生成的代码被正确集成到导出的工程中。
5. **编译和构建**，生成最终的应用程序包，支持热更新功能。

“导出工程”是指生成适用于目标平台的 C++ 工程文件，这个文件在后续的构建和部署过程中起到至关重要的作用。


## [常见错误](https://hybridclr.doc.code-philosophy.com/docs/help/commonerrors)







## 在GameObject上Add热更新脚本或者在资源上直接挂载 热更新脚本
### Add 
AddComponent<T>()或者AddComponent(Type type)任何时候都是完美支持的。只需要提前通过Assembly.Load将热更新dll加载到运行时 内即可。

### 在资源上挂载热更新脚本
Unity资源管理系统在反序列化资源中的热更新脚本时，需要满足以下条件：

- 脚本所在的dll已经加载到运行时中
- 必须是使用AssetBundle打包的资源（addressable之类间接使用了ab的框架也可以）
- 你需要把项目中的热更新assembly添加到HybridCLRSettings配置的HotUpdateAssemblyDefinitions或HotUpdateAssemblies 字段中。


只限制了热更新资源以ab包形式打包，热更新dll打包方式没有限制。你可以按照项目需求自由选择热更新方式，可以将dll打包到ab中，或者裸数据 文件，或者加密压缩等等。只要能保证在加载热更新资源前使用Assembly.Load将其加载即可。

**危险**
>如果将热更新脚本挂载到Resources等随主包的资源上，会发生scripting missing的错误！但如果先打成assetbundle包，再放到Resources下，运行时加载该随包assetbundle则没有问题。


### 已知问题
#### 主线程AddComponent及其他资源加载线程加载包含热更新脚本的资源同时进行时偶发的崩溃问题

此问题来自issue报告。

在第一次使用某热更新类型时（主线程AddComponent或者资源线程加载含脚本的资源）会触发引擎创建MonoScript数据，然而此操作并非线程安全。由于未接入hybridclr时，所有脚本都在启动时已经初始化，因此不会有线程安全问题。当接入hybridclr后，在偶然情况下（尤其是加载包含大量脚本的资源）会触发这个问题。

>**解决办法如下：**

**执行时机：**

该解决方案应该在 热更新程序集加载之后 执行，确保所有热更新类型已经被加载到内存中，但还没有被主线程或资源线程使用。具体来说，它应该在以下几个时机执行：

- 热更新程序集加载完成之后，即热更新相关的脚本已经被加载到内存，但并没有立即被用于 AddComponent 或者其他操作。
- 加载包含热更新脚本的资源之前，以确保在加载资源时，所有的 MonoBehaviour 类型已经在主线程上完成初始化，避免在其他线程上并发调用这些脚本时发生崩溃。
加载完热更新程序集后，通过临时创建的GameObject,把所有热更新脚本都添加一遍，类似这样：
```c#
    var go = new GameObject();
    // 我们不希望挂载到这个GameObject上的脚本执行
    go.Active = false;
    foreach (var type in hotUpdateAss.GetTypes())
    {
        if (typeof(MonoBehaviour).IsAssignFrom(type))
        {
            go.AddComponent(type);
        }
    }
    GameObject.Destroy(go);
```

#### 建议打AB时不要禁用TypeTree
需要被挂到资源上的脚本所在dll名称上线后勿修改，因为assembly列表文件打包后无法修改。

建议打AB时不要禁用TypeTree，否则普通的AB加载方式会失败。（原因是对于禁用TypeTree的脚本，Unity为了防止二进制不匹配导致反序列化MonoBehaviour过程中进程Crash，会对脚本的签名进行校验，签名的内容是脚本FullName及TypeTree数据生成的Hash, 但由于我们的热更脚本信息不存在于打包后的安装包中，因此校验必定会失败）

如果必须要禁用TypeTree，一个变通的方法是禁止脚本的Hash校验, 此种情况下用户必须保证打包时代码与资源版本一致，否则可能会导致Crash，示例代码
```c#
    AssetBundleCreateRequest req = AssetBundle.LoadFromFileAsync(path);
    req.SetEnableCompatibilityChecks(false); // 非public，需要通过反射调用
```


禁用 `TypeTree` 的行为是一个比较敏感的操作，特别是在 Asset Bundle（AB）打包和热更新的场景中。`TypeTree` 是 Unity 用于确保反序列化过程中的类型匹配性和安全性的工具，而禁用它可能会导致一些潜在的反序列化错误或崩溃，尤其是在更新脚本时。因此，禁用 `TypeTree` 需要特别小心。

### 如何禁用 TypeTree

根据您的需求，禁用 `TypeTree` 的一个常见方法是通过 **AssetBundleCreateRequest** 的 `SetEnableCompatibilityChecks` 方法。这实际上是禁用 Unity 对于脚本的签名校验，从而跳过了 `TypeTree` 的检查。

#### 示例代码：通过反射禁用 TypeTree 校验

```csharp
using UnityEngine;
using System.Reflection;

public class DisableTypeTreeExample : MonoBehaviour
{
    void Start()
    {
        string path = "path/to/your/assetbundle"; // 你的AB包路径

        // 加载AB包
        AssetBundleCreateRequest req = AssetBundle.LoadFromFileAsync(path);

        // 使用反射禁用脚本的Hash校验
        MethodInfo setEnableCompatibilityChecks = typeof(AssetBundleCreateRequest).GetMethod("SetEnableCompatibilityChecks", BindingFlags.NonPublic | BindingFlags.Instance);
        if (setEnableCompatibilityChecks != null)
        {
            setEnableCompatibilityChecks.Invoke(req, new object[] { false });
        }
    }
}
```

在这个示例中，我们通过反射调用了 `AssetBundleCreateRequest.SetEnableCompatibilityChecks(false)` 来禁用 `TypeTree` 校验。这意味着您可以绕过类型校验和 `TypeTree` 校验，但这样做的风险在于如果后续资源和代码的版本不一致，可能会导致 **崩溃** 或 **错误加载**。

### 需要注意的地方
1. **热更新中的问题**：
   如果您使用热更新机制（比如 IL2CPP 编译的程序集），禁用 `TypeTree` 校验可能导致 Unity 在加载和反序列化脚本时无法匹配类型。这是因为禁用 `TypeTree` 后，Unity 无法验证加载的脚本的类型信息，从而可能会导致加载错误或进程崩溃。

2. **资源和脚本版本一致性**：
   禁用 `TypeTree` 校验后，必须确保您打包的资源与实际运行的脚本版本一致。否则，当脚本和资源版本不匹配时，Unity 会在加载时崩溃。特别是对于热更新项目，您需要手动确保脚本的版本与 AB 包中包含的资源一致。

3. **适用场景**：
   禁用 `TypeTree` 通常是在一些特殊情况下使用，比如当您无法确保资源和脚本版本一致时，但如果您的热更新脚本没有包含在 AB 包中，这会导致校验失败。除非有很强的需求，否则一般不推荐在生产环境中禁用 `TypeTree`。

### 如何查看 `TypeTree` 是否被禁用

Unity 并没有提供直接查看 `TypeTree` 是否被禁用的界面，您只能通过以下方式间接判断：

1. **日志检查**：
   如果禁用了 `TypeTree` 校验，并且存在版本不匹配的情况，Unity 会在加载 AB 包时抛出错误或者崩溃。因此，可以通过查看 Unity 的日志文件（`Editor.log` 或 `Player.log`）来确定是否发生了类型不匹配的错误。

2. **Asset Bundle 加载失败**：
   如果 `TypeTree` 校验被禁用，且脚本与资源版本不匹配，加载 AB 包时可能会导致反序列化错误。您可以通过在加载时检查 `AssetBundle` 是否加载成功来推测是否存在 `TypeTree` 校验问题。

### 总结

- **禁用 `TypeTree`**：通过调用 `AssetBundleCreateRequest.SetEnableCompatibilityChecks(false)` 来禁用校验，但这会导致脚本与资源版本不一致时可能崩溃，且通常不推荐在生产环境中使用。
- **风险**：禁用 `TypeTree` 校验会导致加载脚本时无法检查类型匹配，可能会引发反序列化错误。
- **使用场景**：一般仅在确保代码和资源版本完全一致的情况下使用，或在特定的热更新流程中使用。

如果您决定使用这种方式禁用 `TypeTree` 校验，请务必保证脚本和资源的版本严格同步，以避免加载失败或崩溃。




## Unity打包AB时禁用TypeTree的优缺点

**禁用TypeTree** 是 Unity 打包 AssetBundle 时一个常用的优化选项，它可以有效减小包体大小，提升加载速度。但同时也会带来一些限制和潜在问题。

### 优点：
* **减小包体大小：** TypeTree 存储了资源的类型信息，禁用它可以显著减小 AssetBundle 的体积，从而加快下载和加载速度。
* **提升加载速度：** 由于 TypeTree 信息的缺失，Unity 在加载 AssetBundle 时不需要解析 TypeTree，从而减少了 CPU 消耗，提高了加载速度。

### 缺点：
* **兼容性问题：**
  * **不同 Unity 版本：** 在不同版本的 Unity 中，TypeTree 的结构可能会有变化。如果禁用 TypeTree，高版本 Unity 可能无法正确加载低版本打包的 AssetBundle。
  * **自定义类型：** 如果项目中使用了自定义类型，禁用 TypeTree 后，这些自定义类型的序列化和反序列化可能会出现问题。
* **调试困难：** 在没有 TypeTree 的情况下，调试 AssetBundle 加载问题会变得更加困难。
* **无法热更新脚本：** 禁用 TypeTree 后，Unity 在加载 AssetBundle 时会对脚本进行签名校验，如果脚本内容发生变化，就无法热更新。
* **Editor 下使用受限：** 在 Editor 环境下，如果 AssetBundle 禁用了 TypeTree，有些功能可能无法正常工作，比如使用 AssetDatabase 加载 AssetBundle。

### 适用场景
* **移动端游戏：** 对于移动端游戏来说，包体大小和加载速度是至关重要的。如果项目对包体大小要求较高，并且不涉及频繁的热更新，可以考虑禁用 TypeTree。
* **静态资源：** 对于一些不会经常更新的静态资源，禁用 TypeTree 可以有效减小包体大小。

### 不适用场景
* **频繁热更新的项目：** 如果项目需要频繁地热更新脚本或资源，禁用 TypeTree 会带来很大的限制。
* **自定义类型较多的项目：** 如果项目中使用了大量的自定义类型，禁用 TypeTree 后可能会导致序列化和反序列化问题。
* **对调试要求较高的项目：** 如果项目需要频繁地调试 AssetBundle 加载问题，禁用 TypeTree 会增加调试难度。

### 总结
禁用 TypeTree 可以有效减小包体大小和提升加载速度，但同时也带来了一些限制和潜在问题。在决定是否禁用 TypeTree 时，需要综合考虑项目的具体情况，权衡优缺点。

**建议：**

* **谨慎使用：** 在正式发布之前，一定要对禁用 TypeTree 的 AssetBundle 进行充分的测试，确保其在目标平台上能够正常运行。
* **分包处理：** 可以将经常更新的资源和静态资源分开放到不同的 AssetBundle 中，对于经常更新的资源可以保留 TypeTree，而对于静态资源可以禁用 TypeTree。
* **考虑其他优化方式：** 除了禁用 TypeTree，还可以通过压缩纹理、优化模型、减少冗余资源等方式来减小包体大小。

**总结来说，禁用 TypeTree 是一项需要谨慎使用的优化手段，并不是适用于所有项目。**


## 桥接函数

`HybridCLR` 是一个为 Unity 提供的跨平台热更新框架，它允许在 Unity 中动态加载和执行 C# 代码。其核心目标是支持游戏在运行时进行热更新，而无需重新编译或重新启动游戏应用。在此框架中，桥接函数（Bridge Functions）扮演着非常关键的角色。

### 桥接函数的作用
在 HybridCLR 的上下文中，桥接函数主要用于以下目的：

1. **跨平台调用管理**：在 Unity 的不同平台（如 Android、iOS、Windows 等）之间进行桥接，确保可以在不同平台上调用并执行相同的代码。由于每个平台对底层操作系统的访问方式不同，桥接函数提供了一种通用接口，将平台特定的操作抽象化，从而使代码更具可移植性。

2. **C# 与原生代码的交互**：游戏中的部分原生功能（如底层的性能优化、平台特定的 API）需要调用 C++ 或其他原生代码，而桥接函数则充当了 C# 和原生代码之间的桥梁。这种桥接使得 C# 代码可以通过 `P/Invoke` 或其他类似的机制与 C++ 代码进行交互，避免了传统开发中可能出现的复杂性。

3. **热更新时的接口绑定**：当进行热更新时，Unity 项目中的 C# 代码会被动态加载和执行。为了使热更新后的代码能够正确与 Unity 引擎或其他底层系统交互，桥接函数负责在运行时动态绑定和调用接口，使得热更新代码能够在新的环境中顺利运行。

4. **优化性能**：桥接函数有助于将一些高频调用或资源密集型的操作迁移到更底层的原生代码中处理，而不是全部依赖于 C# 代码，从而提高性能。

### 解决的问题
通过桥接函数，HybridCLR 解决了以下几个问题：

1. **平台兼容性**：通过提供一个统一的桥接层，解决了不同平台之间因调用底层 API 的差异所带来的问题，使得热更新代码能够跨平台运行。

2. **C# 与底层代码的交互**：原生代码和 C# 代码之间的交互是 Unity 开发中的一个挑战。桥接函数简化了这部分操作，允许开发者在热更新中无缝调用底层系统。

3. **避免重新编译**：通过热更新机制，可以动态加载修改后的 C# 代码，而无需重新编译整个项目。桥接函数确保修改后的代码与底层系统仍然能够正常交互。

总之，桥接函数是 HybridCLR 提供的一个重要机制，它使得 Unity 开发者能够在热更新过程中保持对底层系统的访问，并且解决了平台差异和性能优化等问题。


`HybridCLR` 的桥接函数是实现 Unity 热更新的一个关键技术，能够使得 C# 代码和原生代码（如 C++）之间进行高效的交互。它的工作原理和流程涉及到一些复杂的技术，尤其是在动态加载、平台兼容性和性能优化方面。下面我会详细解释它是如何参与这些工作、背后的原理，以及整个工作流程。

### 工作原理

1. **C# 和原生代码之间的桥接**
   在 Unity 中，游戏项目通常使用 C# 编写业务逻辑，但有时需要与底层的原生代码（例如 C++ 或平台特定的原生库）进行交互。传统上，这种交互通过平台调用（P/Invoke）或 `DllImport` 来完成，但这在动态加载和热更新的场景中会变得非常复杂。`HybridCLR` 桥接函数通过以下方式来解决这一问题：
   
   - **原生函数封装**：HybridCLR 会将原生函数封装为统一的桥接接口。这样，无论是热更新时调用的 C# 代码，还是 Unity 本身的 C++ 引擎代码，都能通过这个桥接函数进行通信。
   - **动态链接**：当热更新代码被加载时，桥接函数会动态地加载和链接原生代码库，以确保 C# 代码能与原生代码进行正确的调用。

2. **运行时绑定与反射**
   - **动态绑定**：桥接函数通常通过反射机制在运行时绑定方法。比如，当某个热更新的 C# 代码尝试调用一个底层的原生函数时，`HybridCLR` 会查找相应的桥接函数并在运行时将它与原生代码的实现连接起来。这样就避免了在编译时必须静态绑定的问题。
   - **元数据生成**：在热更新过程中，HybridCLR 会生成一些元数据，用来描述 C# 代码和原生代码之间的映射关系。这个元数据在桥接过程中非常重要，它帮助系统动态地将 C# 方法与底层的原生方法进行映射。

3. **跨平台支持**
   - **统一接口**：HybridCLR 为不同的平台提供了统一的桥接接口。即使在不同平台上，底层代码可能会有所不同，但通过桥接函数，C# 代码始终可以通过相同的接口进行调用，`HybridCLR` 会根据目标平台的不同加载不同的底层实现。
   - **平台适配**：当热更新代码运行在不同的平台时，桥接函数能够根据平台的不同适配不同的原生接口或函数，确保跨平台兼容性。

4. **性能优化**
   - **原生调用**：有些性能要求高的操作可能需要通过原生代码来实现，这时桥接函数允许 C# 代码通过调用原生代码来实现性能优化。
   - **减少开销**：桥接函数在调用原生代码时会尽量减少开销。例如，减少不必要的参数传递，避免频繁的反射调用，或者将一些调用迁移到异步线程来避免阻塞主线程。

### 工作流程

1. **热更新代码加载**
   在热更新过程中，`HybridCLR` 会加载修改后的 C# 程序集，并将其加载到 Unity 引擎中。这些程序集可以是动态编译的，通常使用 `DLL` 文件的形式。当这些代码加载后，系统会扫描并生成相应的元数据和映射表。

2. **桥接函数注册**
   在加载过程中，`HybridCLR` 会注册所有需要桥接的函数。例如，C# 代码中的某个方法需要调用底层 C++ 函数，那么这个方法就会通过桥接函数与相应的原生方法进行关联。此时，`HybridCLR` 会为这些桥接函数建立一对一的映射。

3. **热更新中的方法调用**
   一旦热更新代码加载并注册了桥接函数，当 C# 代码执行时，如果需要调用原生方法，`HybridCLR` 会通过运行时反射和动态链接来调用相应的桥接函数。这些桥接函数会根据需要将请求转发给底层的原生实现，确保原生代码正确执行并返回结果。

4. **跨平台切换**
   如果你的游戏在多个平台上运行（如 Android、iOS、Windows 等），`HybridCLR` 会根据当前运行的平台选择适当的桥接实现。例如，Android 可能通过 JNI 调用 C++ 代码，而 iOS 可能通过 Objective-C 桥接与 C++ 交互。`HybridCLR` 会根据平台自动加载和切换这些不同的实现，确保跨平台兼容。

5. **性能监控与优化**
   `HybridCLR` 的桥接函数还可以参与性能监控。当系统检测到某些原生代码的调用耗时过长，或者需要进行性能优化时，桥接函数会在运行时进行优化，减少性能开销，确保热更新和底层代码交互时的高效性。

### 总结

`HybridCLR` 桥接函数的核心原理是通过动态链接、反射和跨平台适配技术，使得 C# 代码能够与底层原生代码高效、安全地交互。它提供了一个统一的接口来管理不同平台间的差异，使得热更新后的 C# 代码可以在各种设备上平稳运行，而无需进行复杂的编译和部署。桥接函数的动态绑定、元数据生成和性能优化策略使得 `HybridCLR` 成为一个强大的热更新工具。

## 资源更新判断

在游戏热更新过程中，判断客户端是否拥有最新代码和资源是关键的一步。通常会通过以下步骤实现版本检查和更新机制：

---

### **1. 使用版本号或版本文件进行比较**

#### **资源版本管理**
- 每次更新代码或资源时，生成一个 **版本号**（如 `v1.0`、`v1.1`）或 **版本文件**。
- 版本文件通常是一个 JSON 或 TXT 文件，记录当前资源的版本号或资源的文件校验信息，例如：
  
  **版本文件示例（`version.json`）：**
  ```json
  {
      "version": "1.1",
      "assetBundles": {
          "character_assets.ab": "f2a29d0c08f2c4a3d1d7ec5b6e8b8a34",
          "environment_assets.ab": "e1d4f7600c1f7b4a9e5f9e2b123f9a8d"
      }
  }
  ```

- **流程：**
  1. 客户端在启动时，向服务器请求最新的 `version.json`。
  2. 比较本地的版本号和服务器的版本号：
     - 如果版本号相同，则无需更新。
     - 如果版本号不同，则需要下载新的资源。
  3. 对于每个资源文件，可以通过文件名或校验值（如 MD5/SHA256）来确认文件是否需要更新。

---

### **2. 文件校验（哈希值校验）**
通过计算文件的校验值（如 MD5、SHA256），判断本地资源是否和服务器上的一致：

#### **服务器端**
- 每次打包后，计算每个资源文件的 MD5 哈希值，并将这些值记录到版本文件中：
  ```json
  {
      "character_assets.ab": "f2a29d0c08f2c4a3d1d7ec5b6e8b8a34",
      "environment_assets.ab": "e1d4f7600c1f7b4a9e5f9e2b123f9a8d"
  }
  ```

#### **客户端**
- 客户端计算本地资源文件的 MD5 值，与服务器的值进行对比：
  - 如果一致，则无需更新。
  - 如果不一致，则需要下载对应资源。

**C# 示例：计算文件的 MD5**
```csharp
using System.Security.Cryptography;
using System.IO;

public static string GetMD5Hash(string filePath)
{
    using (var md5 = MD5.Create())
    {
        using (var stream = File.OpenRead(filePath))
        {
            var hash = md5.ComputeHash(stream);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }
}
```

---

### **3. 热更新流程**
以下是一个完整的热更新流程设计：

#### **1. 检查版本文件**
- 客户端在启动时请求服务器的版本文件（如 `version.json`）。

#### **2. 比较版本号**
- 如果客户端的版本号小于服务器的版本号：
  - 下载新的资源列表文件或版本文件。

#### **3. 校验资源**
- 对每个需要更新的资源文件进行哈希值比较。
- 如果资源文件不一致，下载对应文件并替换本地版本。

#### **4. 下载资源**
- 客户端从服务器下载需要更新的资源（如 `.ab` 文件）。

#### **5. 替换资源**
- 将下载的资源存储到指定路径，覆盖旧版本文件。
- 更新本地的版本文件。

---

### **4. 示例代码**
以下是一个热更新版本检查的示例代码：

```csharp
using UnityEngine;
using System.Collections;
using UnityEngine.Networking;
using System.IO;

public class HotUpdateManager : MonoBehaviour
{
    private string serverVersionUrl = "https://example.com/version.json";
    private string localVersionPath = Application.persistentDataPath + "/version.json";
    private string serverAssetBaseUrl = "https://example.com/assets/";

    IEnumerator Start()
    {
        // Step 1: 获取服务器版本文件
        UnityWebRequest request = UnityWebRequest.Get(serverVersionUrl);
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to fetch version.json: " + request.error);
            yield break;
        }

        string serverVersionContent = request.downloadHandler.text;
        Debug.Log("Server Version: " + serverVersionContent);

        // Step 2: 检查本地版本文件
        if (!File.Exists(localVersionPath))
        {
            Debug.Log("Local version.json not found, downloading all assets...");
            StartCoroutine(DownloadAllAssets(serverVersionContent));
            yield break;
        }

        string localVersionContent = File.ReadAllText(localVersionPath);

        // Step 3: 比较版本号或文件哈希值
        if (serverVersionContent != localVersionContent)
        {
            Debug.Log("Version mismatch, updating assets...");
            StartCoroutine(DownloadAllAssets(serverVersionContent));
        }
        else
        {
            Debug.Log("Assets are up-to-date.");
        }
    }

    IEnumerator DownloadAllAssets(string serverVersionContent)
    {
        // 假设服务器版本文件包含资源列表
        var versionData = JsonUtility.FromJson<VersionData>(serverVersionContent);

        foreach (var asset in versionData.assetBundles)
        {
            string assetUrl = serverAssetBaseUrl + asset.Key;
            string localPath = Path.Combine(Application.persistentDataPath, asset.Key);

            UnityWebRequest assetRequest = UnityWebRequest.Get(assetUrl);
            yield return assetRequest.SendWebRequest();

            if (assetRequest.result == UnityWebRequest.Result.Success)
            {
                File.WriteAllBytes(localPath, assetRequest.downloadHandler.data);
                Debug.Log($"Downloaded: {asset.Key}");
            }
            else
            {
                Debug.LogError($"Failed to download: {asset.Key}, Error: {assetRequest.error}");
            }
        }

        // 保存最新版本文件到本地
        File.WriteAllText(localVersionPath, serverVersionContent);
        Debug.Log("Assets updated successfully.");
    }
}

[System.Serializable]
public class VersionData
{
    public string version;
    public System.Collections.Generic.Dictionary<string, string> assetBundles;
}
```

---

### **5. 注意事项**
1. **CDN 缓存问题**：
   - 如果资源托管在 CDN 上，确保启用强缓存控制（如 ETag 或版本号后缀）。

2. **断点续传**：
   - 对于大文件下载，可以实现断点续传功能，以防网络中断。

3. **资源替换时机**：
   - 确保在游戏加载完成或空闲时替换资源，避免资源被占用导致更新失败。

4. **安全性**：
   - 对下载的资源文件进行校验，防止中间人攻击或恶意篡改文件。

---

通过这种方式，可以高效地判断客户端是否需要热更新，并确保资源和代码是最新版本。