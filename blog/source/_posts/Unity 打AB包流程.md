---
title: Unity 打AB包流程
date: 2025-01-23 11:08:13
updated: 2025-01-23 11:08:13
tags: [Unity,AssetBundle]
categories: [Unity,AssetBundle]
keywords: Unity 打AB包
description:
---
下面是详细的打包流程、代码示例，以及生成版本文件的完整实现过程。此内容适用于 Unity 项目中使用 AssetBundles 打包并支持版本文件生成与热更新的场景。

---

### **1. 打包流程概述**
1. **配置资源文件**：
   - 将需要打包的资源组织到指定目录中。
   - 设置每个资源的 AssetBundle 名称。

2. **打包 AssetBundles**：
   - 使用 Unity 提供的 `BuildPipeline.BuildAssetBundles` 方法，将资源打包成 `.ab` 文件。

3. **生成版本文件**：
   - 记录所有打包生成的 `.ab` 文件及其校验值（MD5 或 SHA256）。
   - 生成一个 JSON 格式的版本文件，包含版本号、资源文件名及校验值。

4. **上传资源和版本文件**：
   - 将打包好的 `.ab` 文件和版本文件上传到服务器。

---

### **2. 实现步骤**

#### **Step 1: 配置资源文件**
在 Unity 中为资源设置 AssetBundle 名称：

1. 选中需要打包的资源（例如：Prefab、Texture）。
2. 在 **Inspector** 面板中，设置 `AssetBundle` 字段为指定的名称。例如：
   - `character_assets`
   - `environment_assets`

---

#### **Step 2: 编写打包脚本**
使用 Unity 提供的 API 打包资源。

**示例代码：打包 AssetBundles**
```csharp
using UnityEditor;
using UnityEngine;
using System.IO;
using System.Security.Cryptography;

public class AssetBundleBuilder
{
    [MenuItem("Tools/Build AssetBundles")]
    public static void BuildAllAssetBundles()
    {
        // 打包输出路径
        string outputPath = Path.Combine(Application.dataPath, "../AssetBundles");
        if (!Directory.Exists(outputPath))
            Directory.CreateDirectory(outputPath);

        // 打包所有 AssetBundle
        BuildPipeline.BuildAssetBundles(outputPath, BuildAssetBundleOptions.None, BuildTarget.StandaloneWindows);

        // 生成版本文件
        GenerateVersionFile(outputPath);
        Debug.Log("AssetBundles and version file generated successfully!");
    }

    private static void GenerateVersionFile(string assetBundlePath)
    {
        // 获取所有打包文件
        string[] files = Directory.GetFiles(assetBundlePath, "*", SearchOption.AllDirectories);
        var versionData = new VersionData();

        foreach (var file in files)
        {
            if (file.EndsWith(".manifest") || file.EndsWith(".meta")) continue; // 跳过无用文件

            string fileName = Path.GetFileName(file);
            string hash = CalculateMD5(file); // 计算 MD5

            versionData.assetBundles[fileName] = hash;
        }

        // 保存版本文件
        versionData.version = System.DateTime.Now.ToString("yyyyMMddHHmmss"); // 使用时间戳作为版本号
        string versionFilePath = Path.Combine(assetBundlePath, "version.json");
        File.WriteAllText(versionFilePath, JsonUtility.ToJson(versionData, true));
    }

    private static string CalculateMD5(string filePath)
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
}

[System.Serializable]
public class VersionData
{
    public string version;
    public System.Collections.Generic.Dictionary<string, string> assetBundles = new System.Collections.Generic.Dictionary<string, string>();
}
```

---

#### **Step 3: 上传资源到服务器**

将以下内容上传到服务器：
- 所有打包生成的 `.ab` 文件。
- `version.json` 文件。

**常见的上传方式：**
- 使用 FTP 工具（如 FileZilla）手动上传。
- 配合自动化脚本将文件上传到服务器或存储服务（如 AWS S3、GitHub Releases）。

---

### **3. 版本文件的结构和内容**

#### **版本文件（`version.json`）示例：**
```json
{
    "version": "20250123090000",
    "assetBundles": {
        "character_assets": "f2a29d0c08f2c4a3d1d7ec5b6e8b8a34",
        "environment_assets": "e1d4f7600c1f7b4a9e5f9e2b123f9a8d"
    }
}
```

**说明：**
- `version` 表示版本号，用时间戳生成（如 `yyyyMMddHHmmss` 格式）。
- `assetBundles` 是一个字典，存储每个资源文件名及其对应的 MD5 校验值。

---

### **4. 客户端检查版本和热更新流程**

在客户端，以下是资源检查和下载的基本逻辑：

1. **获取版本文件**：
   - 客户端启动时，下载服务器的 `version.json`。
   - 如果客户端不存在本地版本文件，则直接下载所有资源。

2. **比较版本号**：
   - 如果服务器版本号高于本地版本号，开始检查资源文件。

3. **校验资源文件**：
   - 根据服务器的版本文件中的校验值，逐一检查本地资源文件是否完整。
   - 如果文件丢失或校验值不匹配，则下载该文件。

4. **下载更新资源**：
   - 将需要更新的 `.ab` 文件从服务器下载到本地。
   - 更新本地的版本文件。

---

### **5. 示例代码：客户端版本检查与更新**

```csharp
using UnityEngine;
using System.Collections;
using System.IO;
using UnityEngine.Networking;

public class HotUpdateManager : MonoBehaviour
{
    private string serverVersionUrl = "https://example.com/version.json"; // 服务器版本文件 URL
    private string localVersionPath = Application.persistentDataPath + "/version.json";
    private string serverAssetBaseUrl = "https://example.com/"; // 资源下载根目录

    void Start()
    {
        StartCoroutine(CheckForUpdates());
    }

    IEnumerator CheckForUpdates()
    {
        // 获取服务器版本文件
        UnityWebRequest versionRequest = UnityWebRequest.Get(serverVersionUrl);
        yield return versionRequest.SendWebRequest();

        if (versionRequest.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to fetch version.json: " + versionRequest.error);
            yield break;
        }

        string serverVersionContent = versionRequest.downloadHandler.text;
        var serverVersionData = JsonUtility.FromJson<VersionData>(serverVersionContent);

        // 检查本地版本文件
        VersionData localVersionData = null;
        if (File.Exists(localVersionPath))
        {
            string localVersionContent = File.ReadAllText(localVersionPath);
            localVersionData = JsonUtility.FromJson<VersionData>(localVersionContent);
        }

        // 检查版本号和资源
        if (localVersionData == null || serverVersionData.version != localVersionData.version)
        {
            Debug.Log("New version detected, updating assets...");
            foreach (var asset in serverVersionData.assetBundles)
            {
                string localFilePath = Path.Combine(Application.persistentDataPath, asset.Key);
                if (!File.Exists(localFilePath) || GetMD5(localFilePath) != asset.Value)
                {
                    yield return StartCoroutine(DownloadAsset(asset.Key));
                }
            }

            // 更新本地版本文件
            File.WriteAllText(localVersionPath, serverVersionContent);
            Debug.Log("Assets updated successfully!");
        }
        else
        {
            Debug.Log("Assets are up-to-date.");
        }
    }

    IEnumerator DownloadAsset(string assetName)
    {
        string url = serverAssetBaseUrl + assetName;
        UnityWebRequest request = UnityWebRequest.Get(url);
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            string localPath = Path.Combine(Application.persistentDataPath, assetName);
            File.WriteAllBytes(localPath, request.downloadHandler.data);
            Debug.Log($"Downloaded: {assetName}");
        }
        else
        {
            Debug.LogError($"Failed to download {assetName}: {request.error}");
        }
    }

    private string GetMD5(string filePath)
    {
        using (var md5 = System.Security.Cryptography.MD5.Create())
        using (var stream = File.OpenRead(filePath))
        {
            var hash = md5.ComputeHash(stream);
            return System.BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }
}
```

---

通过以上流程，你可以实现完整的热更新功能，包括打包资源、生成版本文件、检查和下载更新资源。



## HybridCLR 程序集打包成ab并加载

### **Unity HybridCLR 热更新程序集打包与加载流程**

HybridCLR 是 Unity 的一种轻量级跨平台解决方案，支持加载 AOT（Ahead Of Time）和解释执行的程序集，适用于游戏热更新。以下是完整的 **打包流程** 和 **加载流程**。

---

## **1. 热更新程序集打包流程**

### **1.1 配置热更新程序集工程**
#### **步骤 1: 创建独立的热更新工程**
- 在 Unity 项目中，创建一个独立的 C# 项目用于存放热更新代码。
- 确保该工程编译为 `.dll` 文件（Class Library 项目）。
- 使用 `.NET Framework 4.x` 或 `.NET Standard 2.1`（与 Unity 项目一致）。

#### **步骤 2: 添加必要引用**
- 引用 Unity 的程序集文件：
  - `UnityEngine.dll`
  - `UnityEngine.CoreModule.dll`
  - 这些文件可在 Unity 安装目录的 `Editor/Data/Managed` 或 `Library/ScriptAssemblies` 下找到。

#### **步骤 3: 编写热更新代码**
- 将需要动态更新的逻辑代码放入热更新工程。
- 避免引用 UnityEditor 命名空间。
- **特别注意**：在 HybridCLR 中，一部分代码会运行在 AOT 模式，因此需要合理规划哪些代码进入热更新工程，哪些留在主工程中。

---

### **1.2 编译与输出程序集**
#### **步骤 1: 编译热更新程序集**
- 使用 Visual Studio 或 Rider 将热更新工程编译为 `.dll` 文件。
- 输出文件如：
  - `HotUpdate.dll`（主程序集）
  - `HotUpdate.pdb`（符号文件，用于调试）。

#### **步骤 2: 标记为热更新程序集**
- 在 Unity 的主工程中，创建一个文件夹（如 `Assets/HotUpdateAssemblies`），将编译好的 `.dll` 文件放入该目录。

#### **步骤 3: 使用 AssetBundle 打包**
- 在 Unity 中创建一个脚本，用于将这些 `.dll` 文件打包成 AssetBundle：
  ```csharp
  using UnityEditor;
  using UnityEngine;

  public class AssetBundleBuilder
  {
      [MenuItem("Tools/Build AssetBundles")]
      public static void BuildHotUpdateAssemblies()
      {
          string outputPath = "Assets/StreamingAssets/HotUpdateBundles";
          if (!System.IO.Directory.Exists(outputPath))
              System.IO.Directory.CreateDirectory(outputPath);

          AssetBundleBuild[] buildMap = new AssetBundleBuild[1];
          buildMap[0] = new AssetBundleBuild
          {
              assetBundleName = "hotupdateassemblies",
              assetNames = new[] { "Assets/HotUpdateAssemblies/HotUpdate.dll" }
          };

          BuildPipeline.BuildAssetBundles(outputPath, buildMap, BuildAssetBundleOptions.None, BuildTarget.StandaloneWindows64);
          Debug.Log("Hot update AssetBundle built successfully!");
      }
  }
  ```
- 这会将 `HotUpdate.dll` 打包到一个名为 `hotupdateassemblies` 的 AssetBundle 中。

#### **步骤 4: 上传到资源服务器**
- 将打包生成的 AssetBundle（如 `hotupdateassemblies`) 上传到远程服务器（如 GitHub Releases、CDN、阿里云 OSS 等），以便运行时下载。

---

## **2. 热更新程序集加载流程**

### **2.1 配置 HybridCLR**
#### **步骤 1: 安装 HybridCLR**
- 在 Unity 项目中，按照 HybridCLR 的官方文档安装 HybridCLR 插件。
- 安装后会生成以下文件和配置：
  - `HybridCLR/HotUpdateAssemblies` 文件夹（存放热更新程序集）。
  - `HybridCLR` 配置文件（设置热更新相关参数）。

#### **步骤 2: 配置 AOT 元数据**
- AOT 模式需要将部分元数据文件（`.dll`）打包到游戏中。
- 在 `HybridCLR/HotUpdateAssemblies` 文件夹中，放入所有热更新相关的 `.dll` 文件。

---

### **2.2 加载热更新程序集**

#### **步骤 1: 下载 AssetBundle**
- 游戏启动时，从远程服务器下载最新的 AssetBundle 文件。

```csharp
using System.Collections;
using UnityEngine;

public class HotUpdateManager : MonoBehaviour
{
    private const string AssetBundleURL = "https://your-server.com/hotupdateassemblies";

    IEnumerator Start()
    {
        // 下载 AssetBundle
        using var www = UnityEngine.Networking.UnityWebRequestAssetBundle.GetAssetBundle(AssetBundleURL);
        yield return www.SendWebRequest();

        if (www.result != UnityEngine.Networking.UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to download AssetBundle: " + www.error);
            yield break;
        }

        // 加载 AssetBundle
        var assetBundle = UnityEngine.Networking.DownloadHandlerAssetBundle.GetContent(www);
        if (assetBundle == null)
        {
            Debug.LogError("Failed to load AssetBundle.");
            yield break;
        }

        // 提取 .dll 文件
        TextAsset dllAsset = assetBundle.LoadAsset<TextAsset>("HotUpdate.dll");
        if (dllAsset == null)
        {
            Debug.LogError("Failed to load HotUpdate.dll from AssetBundle.");
            yield break;
        }

        LoadHotUpdateAssembly(dllAsset.bytes);
    }

    private void LoadHotUpdateAssembly(byte[] dllBytes)
    {
        var assembly = System.Reflection.Assembly.Load(dllBytes);
        var type = assembly.GetType("HotUpdate.Program");
        var method = type.GetMethod("Main");
        method?.Invoke(null, null);
    }
}
```

#### **步骤 2: 加载热更新程序集**
- 使用 `System.Reflection.Assembly.Load` 加载 `HotUpdate.dll`，并调用其中的入口方法（如 `Main()`）。

#### **步骤 3: 切换逻辑到热更新代码**
- 在热更新程序集（如 `HotUpdate.dll`）中，处理游戏的逻辑更新。例如：
  ```csharp
  namespace HotUpdate
  {
      public class Program
      {
          public static void Main()
          {
              Debug.Log("HotUpdate assembly loaded successfully!");
              // 热更新逻辑处理...
          }
      }
  }
  ```

---

## **3. 总结**

### **打包流程**
1. 在独立的 C# 项目中编写热更新代码，编译为 `.dll` 文件。
2. 将 `.dll` 文件放入 Unity 项目中并打包为 AssetBundle。
3. 将打包的 AssetBundle 上传到远程服务器。

### **加载流程**
1. 游戏启动时，下载远程的 AssetBundle 文件。
2. 解压并加载 `.dll` 文件到内存。
3. 使用 `Assembly.Load` 加载程序集，并调用热更新代码入口（如 `Main()` 方法）。
4. 切换游戏逻辑到热更新代码。

通过 HybridCLR，这种热更新流程实现了代码与资源的分离更新，提升了项目的维护性和灵活性。

## 热更程序集打包成
