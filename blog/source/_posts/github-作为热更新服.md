---
title: github 作为热更新服
date: 2025-01-22 16:50:36
updated: 2025-01-22 16:50:36
tags:
categories:
keywords:
description:
---
要使用 **GitHub** 作为 Unity 项目的热更新资源服务器，你可以通过 GitHub 的 **Releases** 功能来托管和管理资源（如 AssetBundles）。这样，你可以通过 Unity 在运行时动态下载这些资源，而无需每次更新游戏客户端。下面是如何使用 GitHub 来托管 Unity 热更新资源的详细步骤：

### 1. **准备资源（例如 AssetBundles）**
首先，你需要将 Unity 项目的资源打包成 **AssetBundles**。这是 Unity 热更新的常见方式。通过 AssetBundles，你可以在游戏运行时动态加载资源，而不需要重新发布整个游戏。

#### 创建 AssetBundles：
1. 在 Unity 中创建 AssetBundle：
   - 选择你想要打包的资源（例如场景、模型、纹理等）。
   - 在 Inspector 面板中，给它们指定一个 **AssetBundle 名称**。例如，将所有角色模型的 AssetBundle 命名为 `character_assets`。
   
2. 打包 AssetBundles：
   - 通过 `BuildPipeline.BuildAssetBundles` 方法将这些资源导出为 AssetBundles 文件。

```csharp
using UnityEditor;
using UnityEngine;

public class AssetBundleBuilder
{
    [MenuItem("Assets/Build AssetBundles")]
    static void BuildAllAssetBundles()
    {
        BuildPipeline.BuildAssetBundles("Assets/AssetBundles", BuildAssetBundleOptions.None, BuildTarget.StandaloneWindows);
    }
}
```

执行该方法后，你的 AssetBundles 将被打包并存储到 `Assets/AssetBundles` 目录中。

### 2. **将 AssetBundles 上传到 GitHub**
将打包好的 AssetBundles 上传到 GitHub 的 **Release 页面**，使它们成为可公开访问的资源。

#### 创建 GitHub 仓库并上传资源：
1. 在 GitHub 上创建一个新仓库（如果还没有的话）。
2. 将打包好的 AssetBundles 文件（例如 `.ab` 文件）上传到 GitHub 仓库的 **Releases** 页面。你可以创建一个新的版本（tag）并上传相关的资源文件。

   - 进入你的 GitHub 仓库页面，点击 **Releases** 标签。
   - 创建一个新版本，并上传你打包的 AssetBundles 文件。每个版本的资源将对应一个特定的版本号，便于管理更新。

3. 你会得到一个资源下载的 URL，类似于：
   - `https://github.com/your-username/your-repo/releases/download/v1.0/character_assets.ab`

### 3. **在 Unity 中动态下载资源**
在游戏运行时，你可以通过 HTTP 请求从 GitHub 下载 AssetBundles 并加载它们。你需要使用 Unity 的 **UnityWebRequest** 来进行下载，并使用 AssetBundle API 来加载和使用资源。

#### 示例代码：从 GitHub 下载 AssetBundle 并加载

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

public class AssetBundleManager : MonoBehaviour
{
    private string assetBundleURL = "https://github.com/your-username/your-repo/releases/download/v1.0/character_assets.ab";
    private AssetBundle loadedAssetBundle;

    IEnumerator Start()
    {
        // 下载 AssetBundle
        UnityWebRequest request = UnityWebRequest.Get(assetBundleURL);
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            // 下载成功，加载 AssetBundle
            loadedAssetBundle = AssetBundle.LoadFromMemory(request.downloadHandler.data);
            if (loadedAssetBundle != null)
            {
                Debug.Log("AssetBundle loaded successfully.");
                // 从 AssetBundle 中加载资源
                var asset = loadedAssetBundle.LoadAsset("CharacterPrefab");
                Instantiate(asset);
            }
            else
            {
                Debug.LogError("Failed to load AssetBundle.");
            }
        }
        else
        {
            Debug.LogError("Failed to download AssetBundle: " + request.error);
        }
    }
}
```

### 4. **版本控制与更新**
为了支持热更新，你需要管理不同版本的 AssetBundles。每次有新的资源更新时，按照以下步骤操作：

1. **更新资源**：每次修改或添加资源时，重新打包 AssetBundles，并在 GitHub 上创建新的 Release。
2. **版本管理**：确保每次更新都更新版本号，方便你的游戏检测和下载新的版本。
3. **检查更新**：在游戏启动时，可以通过比较本地和远程版本，来决定是否需要下载最新的资源。例如，你可以将版本号存储在远程的一个 JSON 文件中，游戏启动时检查并决定是否下载新的 AssetBundle。

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

public class VersionManager : MonoBehaviour
{
    private string versionURL = "https://github.com/your-username/your-repo/releases/latest/download/version.json";

    IEnumerator Start()
    {
        // 下载版本信息
        UnityWebRequest versionRequest = UnityWebRequest.Get(versionURL);
        yield return versionRequest.SendWebRequest();

        if (versionRequest.result == UnityWebRequest.Result.Success)
        {
            string json = versionRequest.downloadHandler.text;
            VersionData versionData = JsonUtility.FromJson<VersionData>(json);

            // 检查本地版本和远程版本
            if (versionData.version > PlayerPrefs.GetInt("Version", 0))
            {
                Debug.Log("New version available, updating...");
                // 下载新的 AssetBundle
                StartCoroutine(DownloadAssetBundle(versionData.assetBundleURL));
            }
        }
        else
        {
            Debug.LogError("Failed to download version info.");
        }
    }

    IEnumerator DownloadAssetBundle(string assetBundleURL)
    {
        UnityWebRequest request = UnityWebRequest.Get(assetBundleURL);
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            AssetBundle loadedAssetBundle = AssetBundle.LoadFromMemory(request.downloadHandler.data);
            if (loadedAssetBundle != null)
            {
                Debug.Log("AssetBundle updated.");
                PlayerPrefs.SetInt("Version", versionData.version); // 保存新版本号
            }
            else
            {
                Debug.LogError("Failed to load AssetBundle.");
            }
        }
    }

    [System.Serializable]
    public class VersionData
    {
        public int version;
        public string assetBundleURL;
    }
}
```

### 5. **优点与挑战**
#### 优点：
- **简单易用**：GitHub 为你提供了免费的文件托管服务，你只需要通过 GitHub Releases 上传 AssetBundles 即可。
- **版本控制**：通过 GitHub 的 Release 标签，你可以很方便地管理和发布不同版本的资源。
- **公开访问**：GitHub 的资源链接是公开的，玩家可以在游戏运行时直接从这些 URL 下载最新的资源。

#### 挑战：
- **访问速度与带宽限制**：GitHub 的带宽和下载速度可能会受到限制，尤其是当下载量增多时，可能会影响资源的加载速度。
- **资源存储限制**：虽然 GitHub 免费账户有一定的存储空间限制，但对于小型项目和低频更新，GitHub 是一个可行的选择。大规模项目可能需要其他更高效的 CDN 服务。
- **安全性**：公开的资源如果不进行加密或版本管理，可能会被非授权的用户获取和篡改。

### 总结：
使用 **GitHub** 作为热更新资源服务器对于小型游戏或独立开发者来说是一个实用且免费的选择。你只需上传 AssetBundles 到 GitHub 的 Releases 页面，并通过 Unity 的 `UnityWebRequest` 下载并加载资源。不过，需要注意带宽、存储限制以及合理管理版本更新，确保游戏能够正确地下载并加载最新资源。
