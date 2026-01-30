---
title: Unity Assetbundle
date: 2025-01-20 12:06:02
updated: 2025-01-20 12:06:02
tags: [Unity,AssetBundle]
categories: [Unity,AssetBundle]
keywords: [Unity,AssetBundle]
description:
---
## 了解什么是Assetbundle
严格来说，AssetBundle是Asset的一个集合，是个压缩包。相比直接使用Asset，它有如下几个好处:

| **特性**                  | **AssetBundle**                                      | **直接使用 Asset**                                |
|---------------------------|-----------------------------------------------------|--------------------------------------------------|
| **内存管理**              | 资源按需加载，支持加载和卸载，减少内存占用           | 所有资源在场景启动时加载，无法按需卸载，内存占用大   |
| **加载性能**              | 通过按需加载，可以加载所需资源，减少初次加载时间     | 所有资源在启动时一次性加载，可能导致加载延迟和卡顿   |
| **资源的依赖关系**        | 支持自动管理资源依赖，通过 Manifest 文件解决依赖关系 | 需要手动管理资源的依赖关系，容易导致丢失依赖         |
| **更新与热更新**          | 支持热更新，通过增量更新机制可以减少更新数据量       | 不支持热更新，更新时必须重新打包整个项目           |
| **包体大小**              | 可以对 Asset 进行压缩，减小包体大小                 | 资源不压缩，包体较大                             |
| **跨平台支持**            | 可以为不同平台打包不同的 AssetBundle               | 所有平台共享相同的资源，可能导致不必要的资源浪费     |
| **网络加载**              | 可以通过网络加载 AssetBundle，支持按需下载          | 只能通过本地文件访问，无法通过网络动态加载资源     |
| **调试与编辑**            | 加载后无法直接在编辑器中查看资源，调试较为复杂     | 直接通过 `Inspector` 视图可以查看和修改资源       |
| **文件管理**              | `AssetBundle` 文件可以单独管理，支持多版本和增量更新 | 所有资源文件都在 `Resources` 文件夹内，管理较为复杂 |
| **打包与构建**            | 需要额外的打包过程和配置，增加构建时间               | 无需额外的打包过程，直接将资源嵌入到应用中         |
| **使用场景**              | 适合资源量大、需要分阶段加载和更新的项目           | 适合小型项目或对资源需求不大的应用                 |
| **加载的灵活性**          | 加载的方式灵活，可以指定加载单个资源，减少不必要的加载 | 资源一旦加载就固定，无法动态调整                   |
| **依赖问题**              | 自动解决依赖关系，减少开发者手动管理的负担         | 依赖关系需要开发者手动管理，容易出错      


### 可以按需加载卸载

Unity 中的 按需加载和卸载 AssetBundle 的机制，结合了以下几个关键设计：

- 资源分离：头部和内容体分开，按需加载。
- 内存管理：通过 **PersistentManager** 管理资源生命周期，避免内存泄漏。PersistentManager 负责管理与 AssetBundle 相关的对象及其生命周期，包括跟踪哪些资源被加载到内存中，哪些需要被释放。
- 依赖关系：通过 Manifest 文件和链式加载/卸载管理资源依赖。
- 增量更新：通过哈希值或 CRC 检查资源的变化，避免不必要的更新。
- 异步加载：支持异步加载以减少卡顿，提高性能。
- 清理机制：通过 UnloadUnusedAssets 清理不再使用的资源。


**为什么场景的ab和资源的ab不能同时打包进同一个ab内?**
- 加载方式和生命周期管理不同，容易引发加载和卸载冲突。
- 场景的修改会导致整个 `AssetBundle` 重新打包，影响增量更新和资源优化。
- 场景和资源的内存管理不同，可能导致不必要的内存占用。

## AssetBundle的打包参数
当我们调用Unity的API去打AssetBundle的时候，实际上有很多的参数可以供我们选择。如果没有选择合适的参数，就可能会导致在包体，内存以及加载时间等方面造成很多的浪费。

- ChunkBasedCompression：这个参数是压缩AssetBundle的用的。前面提到Android的StreamingAssets是不压缩的。为了减小包体大小，可以使用该参数对AssetBundle进行压缩。它实际上是一个由Unity改良过的LZ4，使它的算法更符合Unity的使用方式。

- DisableWriteTypetree：这个其实是会被很多开发者忽略的一个参数，它非常有用，可以帮我们减小AssetBundle包体的大小，同时也可以减小内存，以及减少我们加载这个AssetBundle时的CPU时间。
  
### **Typetree为了给Unity跨版本之间做兼容性用的，确定使用同一个版本开发游戏的时候，可以关闭这个选项来增加打包速度和优化占用和加载性能**

#### **热更新场景下：**
- **如果热更新的资源是使用与线上版本相同的 Unity 版本打包的**，并且游戏 **没有进行过大版本的升级**，则可以通过关闭 `Typetree` 来减少包体和加载时的内存占用。
- **如果热更新的资源包含跨版本的更新，或者 Unity 版本发生变化**，就必须开启 `Typetree`，以确保不同版本的 Unity 可以正确加载这些资源，并且能够兼容较早版本的数据。

#### **整体项目升级 Unity 版本的影响：**
- 如果你 **整体升级了 Unity 版本**，并且整个项目迁移到了新的 Unity 版本，那么 `Typetree` 会有影响，具体表现为：
  - 如果开启了 `Typetree`，它会保证在不同版本的 Unity 下的兼容性，使得在新版本 Unity 中加载旧版本的资源时不会出错。
  - 如果 **关闭 `Typetree`**，在升级 Unity 版本后，可能会导致在加载旧版本打包的资源时出现兼容性问题，尤其是当类型定义发生变化时（比如类的字段顺序、类型名称等发生变化）。



为了避免影响 `Typetree`，在进行热更新时，以下是可以做和不能做的操作。

| **可以做的操作**  | **不能做的操作**  |
|-------------------|-------------------|
| 新增脚本类和资源  | 修改现有脚本类的字段名称、类型、顺序 |
| 新增 AssetBundle  | 删除字段、方法或资源 |
| 修改资源加载方式 | 修改资源的结构或依赖关系 |
| 增加新的字段或方法 | 修改现有资源的字段类型或顺序 |
| 修改 AssetBundle 的压缩格式（不改变资源结构） | 修改 AssetBundle 内部资源的组织方式或压缩方式 |

在进行热更新时，保持资源和脚本的兼容性非常重要，尤其是确保 **现有资源的结构和字段保持不变**，这样可以避免因不兼容导致的加载失败和数据丢失。如果需要进行大的修改，最好考虑全新的资源和模块，而不是修改已有的内容。

DisableLoadAssetByFileName，DisableLoadAssetByFileNameWithExtension：当我们加载好一个AssetBundle然后使用LoadAsset加载Asset的时候，需要传递Asset的路径名称。这个名称有三种写法，分别是Asset的文件名，Asset的文件名+扩展名，Asset的全路径，如下：
```C#
AssetBundle ab = AssetBundle.LoadFromFile(Path.Combine
(Application.streamingAssetsPath, "sphere"));
// 第一种和第二种比较慢的，因为它AssetBundle被加载成功后产生的
Instantiate(ab.LoadAsset("Sphere"));
Instantiate(ab.LoadAsset("Sphere.prefab"));
Instantiate(ab.LoadAsset("Assets/Sphere.prefab"));
```
当我们没有Disable打AssetBundle的时候，实际上是算了一个Hash进去的，当通过文件名去找Asset的时候，它会去生成这个文件名的原路径，然后去对比。 如果我们确定我们的加载Asset的方式是用全路径加载的话，那么就可以把它关闭掉

## 怎么实现增量更新

### **AssetBundle增量更新的实现原理**

在Unity中，增量更新的目的是使得用户在每次更新时只下载那些确实发生变化的资源，从而减少下载量和节省带宽。

增量更新的核心思想是对比当前版本和上一版本的AssetBundle内容，找出其中的差异，然后仅下载发生变化的部分。具体来说，增量更新通常依赖于以下几种方式来判断哪些资源发生了变化。

### **判断增量更新的依据**

#### 1. **文件的MD5值（哈希值）**
   - **原理**：通过计算两个版本的 `AssetBundle` 文件的MD5值（或其他哈希算法），如果值不同，则表示文件内容发生了变化。可以用这个方式来判断 `AssetBundle` 是否需要更新。
   - **适用场景**：适用于当 `AssetBundle` 中的资源内容发生了变化时，计算文件的哈希值可以直接比较两个版本的 `AssetBundle` 内容。
   - **问题**：如果AssetBundle中有细微变化（如小幅修改），但整体资源内容没变，MD5值依然会不同，这就导致每次修改都会进行完整的资源更新。

#### 2. **通过 `.manifest` 文件进行比对**
   - **原理**：在打包时，Unity会生成一个 `.manifest` 文件，该文件包含了 `AssetBundle` 文件的元数据（如文件的依赖关系、哈希值等）。通过比较新旧版本的 `.manifest` 文件，可以判断哪些资源发生了变化。
   - **适用场景**：通过计算 `.manifest` 中每个资源文件的哈希值或者CRC值，来判断资源是否发生变化。这种方式通常比较准确，可以追踪到哪些具体资源发生了变化。
   - **操作步骤**：
     1. 在热更新时，获取上一个版本的 `.manifest` 文件的内容。
     2. 比较新旧版本 `.manifest` 文件中的 `AssetFileHash` 字段，找出哪些文件发生变化。
     3. 对比新旧版本的资源，更新改变的部分。

#### 3. **资源的 `AssetFileHash`（文件哈希）**
   - **原理**：Unity的 `.manifest` 文件中记录了每个资源的 `AssetFileHash`。该字段是每个资源的内容的哈希值，可以用来判断资源本身是否发生了变化。
   - **适用场景**：特别适合跟踪资源文件的变化，如脚本、纹理、模型、音频等。
   - **操作步骤**：
     1. 每次打包时计算每个资源的哈希值，并记录在 `.manifest` 文件中。
     2. 在更新过程中，通过比较两次打包的 `AssetFileHash` 判断哪些资源内容发生了变化。
     3. 如果某个资源的哈希值发生变化，则表明该资源内容更新了，可以下载新的 `AssetBundle`。

#### 4. **资源的依赖关系**
   - **原理**：AssetBundle之间可能会有依赖关系。当某个资源或 `AssetBundle` 的内容发生变化时，可能会影响依赖该资源或 `AssetBundle` 的其他资源。通过检查这些依赖关系，可以判断哪些 `AssetBundle` 必须被更新。
   - **适用场景**：适用于有复杂依赖关系的场景，或者多个资源之间有链接依赖的情况（如材质、模型、动画等）。
   - **操作步骤**：
     1. 在 `.manifest` 文件中检查资源的依赖关系。
     2. 如果某个资源的依赖发生变化，则该资源及其依赖的 `AssetBundle` 都需要进行更新。
     3. 通过检查依赖链来找出需要更新的 `AssetBundle`。

### **实现增量更新的步骤**

1. **生成和保存 `AssetBundle` 的 `.manifest` 文件**
   每次打包时，Unity会生成一个 `.manifest` 文件，记录了打包资源的元数据。确保在热更新过程中可以访问和保存该文件，以便后续对比。

2. **比对 `.manifest` 文件**
   在新版本打包后，比较新旧版本 `.manifest` 文件中的资源 `AssetFileHash` 字段，判断哪些资源发生了变化。

3. **计算变化的资源**
   如果某个资源的 `AssetFileHash` 不同，说明该资源发生了变化。这些变化的资源会被打包成新的 `AssetBundle`。

4. **仅下载变化的资源**
   在客户端进行更新时，只下载发生变化的 `AssetBundle`。这样可以大大减小更新的下载量。

5. **管理依赖关系**
   如果某个资源的依赖发生了变化，需要更新依赖该资源的 `AssetBundle`。因此，依赖链的管理是增量更新的重要部分。

6. **应用新的 `AssetBundle`**
   客户端加载更新后的 `AssetBundle`，并加载其中的资源。

### 增量更新最佳方案

确保 **准确性** 和 **高效性**，并避免不必要的资源重新加载，**提高增量更新精度** 的最优方法是：

>**使用 `.manifest` 文件中的 `AssetFileHash` 和 `CRC` 字段来判断资源是否发生变化**

这个方法结合了 **准确性** 和 **高效性**，且避免了不必要的资源重新加载。

#### **为什么最优？**
1. **准确性**：
   - `.manifest` 文件中的 `AssetFileHash` 字段是直接用于标识资源内容是否发生变化的哈希值，它非常精确，能确保只有在资源的内容发生变化时才会被标记为更新。
   - 通过 `CRC` (Cyclic Redundancy Check) 字段，还可以进一步确保资源的完整性，避免因文件损坏或传输错误导致错误的更新。
   
2. **高效性**：
   - `.manifest` 文件相对较小，且它记录了所有资源的变化信息，因此与直接计算 `AssetBundle` 或 `.meta` 文件的哈希值相比，它的性能开销更低，能够快速判断资源变化。
   - 在增量更新时，基于 `.manifest` 文件的判断方式可以避免每次重新计算整个 `AssetBundle` 的哈希，从而减少了计算和网络传输的开销。

3. **避免不必要的资源重新加载**：
   - 通过 `AssetFileHash` 和 `CRC` 的对比，只在资源真正发生变化时才进行更新，这样避免了对未修改的资源进行重新加载和下载，节省了带宽和设备的资源。
   
#### **增量更新的流程：**

1. **首次发布时**：
   - 在初次构建 `AssetBundle` 时，生成 `AssetBundle` 的 `.manifest` 文件，记录每个资源的 `AssetFileHash` 和 `CRC` 信息。
   - 发布 `AssetBundle` 和 `.manifest` 文件，并确保客户端获取到这些文件。

2. **后续更新时**：
   - 在每次更新 `AssetBundle` 时，重新生成 `.manifest` 文件，并计算其中每个资源的 `AssetFileHash` 和 `CRC`。
   - 客户端通过下载新的 `.manifest` 文件，并与本地存储的 `.manifest` 进行对比。如果 `AssetFileHash` 或 `CRC` 值不同，说明该资源已发生变化，需要下载新的 `AssetBundle`。
   - 对于没有变化的资源，可以跳过下载和加载，避免不必要的资源重新加载。

3. **优势**：
   - 使用 `.manifest` 文件避免了每次都要遍历和检查整个 `AssetBundle`，大大减少了计算量。
   - 通过 `CRC` 和 `AssetFileHash` 判断文件变化，精确到资源级别，确保增量更新的精度。
   - 能有效控制资源加载的时机，只有需要更新的资源才会被重新加载，优化了内存和存储的使用。
---

 **总结：**
最优的增量更新方法是 **基于 `.manifest` 文件中的 `AssetFileHash` 和 `CRC` 字段判断资源变化**。它既能保证更新的精确性，又具备较高的效率，避免了不必要的资源重新加载和带宽浪费，适用于大多数的热更新场景。

---

### **增量更新的优缺点**

| 优点 | 缺点 |
|------|------|
| 节省带宽：只更新变化的部分，而不是整个 `AssetBundle`，可以大大减少下载的文件大小。 | 依赖性复杂：如果多个 `AssetBundle` 之间有复杂的依赖关系，增量更新可能会变得复杂。 |
| 加速下载：用户只需要下载新更新的资源，更新速度更快。 | 需要额外的逻辑：需要实现文件哈希比对、资源依赖关系的检查等。 |
| 减少内存占用：避免了不必要的资源加载和占用，提升了性能。 | 不适用于小变化：对于频繁的小变化，每次都更新可能会带来一定的性能开销。 |

---

 **总结**

增量更新的核心在于通过比对 `AssetBundle` 的哈希值、`manifest` 文件或资源的 `AssetFileHash` 来判断哪些资源发生了变化，然后只下载那些变化的资源。通过这种方式，减少了更新时的带宽占用和下载时间，同时提高了用户体验。不过，这要求开发者能够管理好资源之间的依赖关系，并能够处理增量更新中的各种逻辑细节。

## 增量更新实现逻辑

要实现增量更新的机制，使用 `.manifest` 文件中的 `AssetFileHash` 和 `CRC` 字段来判断资源变化，并确保只有变更的资源进行下载和更新，以下是一个基础的代码示例，展示了如何通过比对 `.manifest` 文件中的哈希值来判断哪些资源需要更新。

### 基本步骤
1. 获取服务器上的 `AssetBundle` 和 `.manifest` 文件。
2. 下载 `.manifest` 文件，解析出其中的 `AssetFileHash` 和 `CRC` 字段。
3. 与本地缓存的 `.manifest` 进行对比，检查哪些资源发生了变化。
4. 仅下载发生变化的 `AssetBundle` 文件，并更新本地缓存。

### 代码示例

```csharp
using UnityEngine;
using System.IO;
using System.Collections;
using UnityEngine.Networking;
using System.Linq;

public class AssetBundleUpdater : MonoBehaviour
{
    // 本地存储路径
    private string localAssetBundleFolder = "Assets/AssetBundles";
    private string localManifestFile = "Assets/AssetBundles/assetbundle.manifest";

    // 服务器资源的 URL
    private string remoteAssetBundleUrl = "https://example.com/assetbundles";
    private string remoteManifestUrl = "https://example.com/assetbundles/assetbundle.manifest";

    // 下载 AssetBundle 和 Manifest 文件
    private IEnumerator Start()
    {
        // Step 1: 下载远程的 manifest 文件
        UnityWebRequest manifestRequest = UnityWebRequest.Get(remoteManifestUrl);
        yield return manifestRequest.SendWebRequest();

        if (manifestRequest.isHttpError || manifestRequest.isNetworkError)
        {
            Debug.LogError("Failed to download manifest.");
            yield break;
        }

        // Step 2: 解析远程 manifest 文件
        AssetBundleManifest remoteManifest = ParseManifest(manifestRequest.downloadHandler.text);

        // Step 3: 加载本地 manifest 文件并与远程 manifest 文件对比
        if (File.Exists(localManifestFile))
        {
            string localManifestText = File.ReadAllText(localManifestFile);
            AssetBundleManifest localManifest = ParseManifest(localManifestText);

            // Step 4: 对比两个 manifest 文件，找出有变化的资源
            foreach (var remoteAsset in remoteManifest.GetAllAssetBundles())
            {
                string localHash = GetAssetHash(localManifest, remoteAsset);
                string remoteHash = remoteManifest.GetAssetFileHash(remoteAsset);

                if (localHash != remoteHash) // 如果文件的 hash 值不同，则需要下载更新
                {
                    Debug.Log($"AssetBundle {remoteAsset} has changed, updating...");
                    yield return StartCoroutine(DownloadAssetBundle(remoteAsset));
                }
            }
        }
        else
        {
            // 本地没有 manifest 文件，执行全量更新
            Debug.Log("No local manifest found, performing full update...");
            yield return StartCoroutine(DownloadAllAssetBundles(remoteManifest));
        }

        // 保存新的 manifest 文件到本地
        File.WriteAllText(localManifestFile, manifestRequest.downloadHandler.text);
    }

    // 解析 Manifest 文件，获取其中的 AssetFileHash 和 CRC 字段
    private AssetBundleManifest ParseManifest(string manifestText)
    {
        // 自定义解析方式，解析 AssetBundleManifest 文件
        // 假设 AssetBundleManifest 是 JSON 格式
        // 请根据实际情况替换为你们的解析方法
        return JsonUtility.FromJson<AssetBundleManifest>(manifestText);
    }

    // 获取资源的 Hash 值
    private string GetAssetHash(AssetBundleManifest manifest, string assetName)
    {
        // 返回本地 AssetBundle 的 hash 值
        return manifest.GetAssetFileHash(assetName);
    }

    // 下载更新的 AssetBundle 文件
    private IEnumerator DownloadAssetBundle(string assetName)
    {
        UnityWebRequest request = UnityWebRequest.Get($"{remoteAssetBundleUrl}/{assetName}");
        yield return request.SendWebRequest();

        if (request.isHttpError || request.isNetworkError)
        {
            Debug.LogError($"Failed to download asset bundle: {assetName}");
            yield break;
        }

        // 将更新后的 AssetBundle 保存到本地缓存中
        string localPath = Path.Combine(localAssetBundleFolder, assetName);
        File.WriteAllBytes(localPath, request.downloadHandler.data);

        Debug.Log($"Successfully downloaded and cached asset bundle: {assetName}");
    }

    // 下载所有的 AssetBundle 文件（全量更新）
    private IEnumerator DownloadAllAssetBundles(AssetBundleManifest manifest)
    {
        foreach (var assetBundleName in manifest.GetAllAssetBundles())
        {
            yield return StartCoroutine(DownloadAssetBundle(assetBundleName));
        }
    }
}

[System.Serializable]
public class AssetBundleManifest
{
    // 这里的结构体是根据你们实际的 manifest 文件格式进行调整的
    public string[] assetBundles;

    // 获取所有 AssetBundle 名称
    public string[] GetAllAssetBundles()
    {
        return assetBundles;
    }

    // 获取资源的 Hash
    public string GetAssetFileHash(string assetName)
    {
        // 需要从 .manifest 文件中读取文件的 Hash
        // 你需要根据实际的 manifest 文件结构来修改此方法
        return "somehash";
    }
}
```

### 说明：

1. **Manifest 文件解析**：
   - 代码示例中的 `AssetBundleManifest` 类是根据假设的 JSON 格式解析的，你需要根据你们实际的 `.manifest` 文件格式来修改这个部分。
   - 如果你们的 `.manifest` 文件是 XML 格式，或者有自定义结构，你可以使用 `XmlUtility` 或手动解析来获取资源的 `AssetFileHash` 和 `CRC`。

2. **增量更新逻辑**：
   - 首先下载远程的 `manifest` 文件，并解析它。
   - 然后读取本地的 `manifest` 文件，并对比两个文件中的资源哈希（`AssetFileHash`）。
   - 如果发现远程的资源文件哈希值与本地不一致（即资源发生了变化），就下载对应的 `AssetBundle`。
   - 如果本地没有 `manifest` 文件（例如首次更新或清理后的情况），则执行全量更新，下载所有的资源包。

3. **本地缓存与下载**：
   - 每次更新完成后，将新的 `AssetBundle` 保存到本地缓存中，这样可以避免重复下载相同的资源。
   - 更新完成后，将新的 `manifest` 文件保存到本地，以便下次更新时使用。

### 注意事项：
- `manifest` 文件通常会包含资源文件的所有信息，所以它的大小会比 `AssetBundle` 小很多。
- 增量更新的关键是根据哈希对比资源的变化，而不是直接对比文件内容，因为 `AssetBundle` 打包后每次可能会有轻微的不同。
- 使用这种方法时需要确保客户端和服务器的 `manifest` 文件结构一致。

 总结：
这种方法通过基于 `AssetBundleManifest` 文件中的 `AssetFileHash` 和 `CRC` 字段判断资源变化，只更新发生变化的资源，能显著提高增量更新的效率，减少不必要的资源重新加载。

## AssetBundle的加载到内存方式
在 Unity 中，`AssetBundle` 可以通过多种方式加载，具体的加载方式根据不同的需求（如从磁盘加载、从网络加载、从内存加载等）来选择。以下是所有常见的 `AssetBundle` 加载方式，包括同步和异步加载方式：

以下是删除了示例代码和卸载方式列后的 Unity AssetBundle 加载方法对比表：

| 加载方法                   | 说明                                     | 适用场景                                         | 特点                                    |
|----------------------------|------------------------------------------|------------------------------------------------|-----------------------------------------|
| **`AssetBundle.LoadFromFile`** | 从指定路径加载 AssetBundle 文件         | 加载本地存储的 AssetBundle 文件                | 适用于文件路径已知的本地资源加载。       |
| **`AssetBundle.LoadFromMemory`** | 从内存中加载 AssetBundle 数据           | 当 AssetBundle 数据已经加载到内存时使用        | 可以避免文件IO操作，适用于已有内存数据。 |
| **`AssetBundle.LoadFromStream`** | 从流式数据中加载 AssetBundle            | 当 AssetBundle 是通过流式数据传输时使用        | 可用于网络加载流数据。                  |
| **`AssetBundle.LoadAsset`**    | 加载 AssetBundle 中的指定资源           | 加载 AssetBundle 中单个资源                    | 加载特定资源，常用于内存中加载资源。    |
| **`AssetBundle.LoadAssetAsync`** | 异步加载 AssetBundle 中的指定资源       | 加载 AssetBundle 中资源时不阻塞主线程         | 异步操作，避免主线程卡顿。              |
| **`AssetBundle.LoadAllAssets`** | 加载 AssetBundle 中所有资源             | 加载整个 AssetBundle 内所有资源                | 适用于需要加载所有资源的情况。          |
| **`AssetBundle.LoadAllAssetsAsync`** | 异步加载 AssetBundle 中所有资源         | 加载整个 AssetBundle 内所有资源时不阻塞主线程  | 异步加载整个资源包。                    |
| **`AssetBundle.LoadAssetWithSubAssets`** | 加载主资源及其附带的资源               | 加载主资源及其附带的子资源                    | 加载一个资源以及其所有相关子资源。      |
| **`WWW`（已废弃）**            | 通过 WWW 类加载网络上的 AssetBundle     | 用于较老版本的 Unity 中加载网络资源            | 已废弃，推荐使用 `UnityWebRequest`。     |
| **`UnityWebRequestAssetBundle`** | 通过 `UnityWebRequest` 加载网络上的 AssetBundle | 用于加载远程服务器上的 AssetBundle            | 推荐使用网络请求加载资源，性能更好。    |


## CRC 校验
在 Unity 中，`CRC 校验` 是在加载 `AssetBundle` 的过程中进行的，用于确保加载的 `AssetBundle` 文件没有被篡改或损坏。具体来说，CRC 校验是在 **AssetBundle 文件加载的过程中**，由 Unity 在解析 `AssetBundle` 文件时自动进行的，通常不需要开发者手动干预。

### CRC 校验发生的阶段

CRC 校验是在 `AssetBundle` 加载过程中的文件解析阶段进行的。具体而言，CRC 校验会在以下几个步骤中进行：

1. **文件解析阶段**：
   当使用 `AssetBundle.LoadFromFile()` 或 `UnityWebRequestAssetBundle.GetAssetBundle()` 等加载方法时，Unity 会先读取并解析 `AssetBundle` 文件的头信息和内容。在这个阶段，Unity 会根据文件头信息中的 CRC 值与实际加载的内容进行比对。
   
2. **自动校验**：
   在解析完 `AssetBundle` 文件的头信息后，Unity 会自动计算并验证该文件的 CRC 值（CRC32）。如果该值与 `AssetBundle` 文件头中记录的 CRC 值匹配，则表示文件完整，否则会抛出错误，提示文件损坏或不匹配。

3. **加载资源阶段**：
   一旦 CRC 校验通过，Unity 会继续加载 `AssetBundle` 中的具体资源。在这个过程中，如果文件本身没有损坏，资源将被加载到内存中供后续使用。

### 使用 CRC 校验的函数

- **AssetBundle.LoadFromFile()**：加载文件时会进行 CRC 校验。
- **AssetBundle.LoadFromMemory()**：在内存加载时也会进行 CRC 校验，确保加载的内存数据与 `AssetBundle` 文件的校验值一致。
- **UnityWebRequestAssetBundle.GetAssetBundle()**：使用 `UnityWebRequest` 下载 `AssetBundle` 时，CRC 校验也会在文件下载并解析后进行。

### 代码示例

如果使用 `UnityWebRequestAssetBundle` 来下载并加载资源时，你可以传入一个 `CRC` 值来确保文件的完整性。

```csharp
using UnityEngine;
using UnityEngine.Networking;

public class AssetBundleLoader : MonoBehaviour
{
    IEnumerator Start()
    {
        string url = "https://example.com/assetbundle";
        
        // 下载 AssetBundle
        UnityWebRequest www = UnityWebRequestAssetBundle.GetAssetBundle(url, 0, 0);
        yield return www.SendWebRequest();

        if (www.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Error downloading AssetBundle: " + www.error);
        }
        else
        {
            // 加载成功，获取 AssetBundle
            AssetBundle bundle = DownloadHandlerAssetBundle.GetContent(www);
            if (bundle != null)
            {
                Debug.Log("AssetBundle loaded successfully");
            }
        }
    }
}
```

### 是否总是需要 CRC 校验？

CRC 校验是确保数据完整性的一种手段，通常会在以下场景下启用：

- **网络传输时**：下载的 `AssetBundle` 文件可能会被损坏，启用 CRC 校验可以验证文件是否在传输过程中发生了变化。
- **本地文件校验**：通过文件系统读取的 `AssetBundle` 也需要 CRC 校验，防止文件在磁盘上发生损坏或篡改。

### 结论

CRC 校验是由 Unity 在加载 `AssetBundle` 时自动进行的，通常发生在文件解析和资源加载阶段。CRC 校验确保文件在加载前是完整且未损坏的。
  
## AssetBundle.LoadAsset
>是用于从已经加载到内存中的 AssetBundle 中加载具体的资源（如材质、纹理、Prefab 等）。它不会重新加载整个 AssetBundle 文件，而是提取文件中的单个资源。

既然我们加载出来了AssetBundle，我们就会想和Resource.load那样去加载一个我们需要的资源出来实例化。

其实，AssetBundle加载资源和Resource.load的加载流程是一样的了，通过Instanceid找全局内是否有该资源的对象，如果没有就通过PresistManager去加载并保存改对象，只不过对于AssetBundle的话，PresistManager保存的对象的标识符是指向包含这个对象的AssetBundle的。

## AssetBundle的卸载

在 Unity 中，AssetBundle 是一种用于将游戏资源打包并按需加载的机制。随着游戏开发中的资源管理变得更加复杂，正确地卸载 AssetBundle 变得至关重要，因为它会直接影响到内存的使用效率和性能。

### 1. **AssetBundle 卸载方法**

Unity 提供了 `AssetBundle.Unload(bool)` 方法来卸载已经加载的 AssetBundle。该方法有一个布尔参数 `bool unloadAllLoadedObjects`，决定是否将与该 AssetBundle 关联的所有资源对象一并卸载。

```csharp
public void Unload(bool unloadAllLoadedObjects);
```

- **unloadAllLoadedObjects**:
  - **true**：表示卸载该 AssetBundle 以及所有与其关联的资源对象。
  - **false**：表示仅卸载 AssetBundle 文件的关联，而不卸载已经加载到内存中的资源对象。

### 2. **两种卸载模式的区别**

#### 2.1 **Unload(false)**

- **作用**：只会从 `PersistentManager` 中删除 AssetBundle 文件与内存中已加载的对象的关联，而不会删除这些资源对象本身。
- **影响**：该对象的内存不会释放，因此，如果你只使用 `Unload(false)` 卸载，内存中会残留这些对象，并且后续若再次加载 AssetBundle，这些对象会被重新加载，导致内存中的重复数据。

#### 2.2 **Unload(true)**

- **作用**：不仅删除与 AssetBundle 文件相关联的对象，还会释放内存中所有与该 AssetBundle 相关联的对象（即资源对象），如材质、纹理、模型等。
- **影响**：如果 AssetBundle 中的对象不再被其他部分引用，内存中会释放这些对象，帮助减少内存占用。

### 3. **卸载时的注意事项**

#### 3.1 **依赖关系**

在实际开发中，一个 AssetBundle 可能会依赖于另一个 AssetBundle。例如，A 包含了 B 包的资源。如果 A 被卸载，而 B 仍然被其他地方使用，`Unload(false)` 可能会导致 B 资源的内存泄漏。

因此，卸载 AssetBundle 时需要确保它与其他 AssetBundle 之间的依赖关系被正确处理。理想情况下，应该先卸载所有不再需要的 AssetBundle，并确保没有任何资源正在被引用。

#### 3.2 **引用计数**

Unity 使用引用计数机制来管理资源的生命周期。如果一个资源对象被多个 AssetBundle 引用，那么即使卸载了其中一个 AssetBundle，资源本身并不会立刻被卸载，直到所有引用该资源的 AssetBundle 都被卸载或没有其他对象再引用该资源。

#### 3.3 **资源的引用管理**

确保在卸载 AssetBundle 前，先销毁所有不再需要的引用。对于在场景中实例化的对象，应该显式销毁这些对象，否则它们可能会一直占用内存。

例如：
```csharp
Destroy(gameObject);  // 销毁实例化的对象
```

然后，你可以调用 `Resources.UnloadUnusedAssets()` 来卸载所有不再使用的资源，进一步减少内存占用。

### 4. **卸载与垃圾回收**

卸载 AssetBundle 并不会立即触发垃圾回收。卸载操作会清除 AssetBundle 文件与内存中的对象的关联，但实际的内存释放可能会推迟，直到 Unity 的垃圾回收机制触发时。如果你希望立即释放内存，可以通过调用 `Resources.UnloadUnusedAssets()` 来帮助清理内存。

```csharp
Resources.UnloadUnusedAssets();
```

该方法会强制清理不再使用的资源，并尝试减少内存占用，特别是在大量卸载资源后。

### 5. **常见的 AssetBundle 卸载误区**

- **误区 1**：只使用 `Unload(false)`，而不管理内存中的对象引用。会导致内存泄漏，虽然卸载了 AssetBundle，但内存中的资源对象仍然存在。
- **误区 2**：在卸载 AssetBundle 后继续访问其中的资源对象。由于对象已经卸载，访问这些对象会导致错误或崩溃。
- **误区 3**：频繁地加载和卸载 AssetBundle，而没有适当的资源管理策略。这样会导致不必要的内存占用和性能问题，应该避免频繁加载和卸载相同的资源。

### 6. **示例：正确使用 AssetBundle 卸载**

假设你在游戏中加载了一个 AssetBundle 并实例化了一些对象，接着需要卸载该 AssetBundle 以释放内存。

```csharp
// 加载 AssetBundle
AssetBundle bundle = AssetBundle.LoadFromFile("path/to/assetbundle");

// 加载并实例化资源
GameObject prefab = bundle.LoadAsset<GameObject>("MyPrefab");
GameObject obj = Instantiate(prefab);

// 卸载 AssetBundle
// 先销毁对象引用
Destroy(obj);

// 卸载 AssetBundle，并释放内存
bundle.Unload(true);

// 强制卸载不再使用的资源
Resources.UnloadUnusedAssets();
```
**总结**

- 使用 `AssetBundle.Unload(true)` 可以完全卸载 AssetBundle 和其关联的所有资源对象，释放内存。
- `AssetBundle.Unload(false)` 只会断开 AssetBundle 与内存中对象的关联，不会释放内存。
- 在卸载 AssetBundle 时，必须处理好资源的引用计数和依赖关系，避免内存泄漏。
- 为了确保内存的彻底释放，可以使用 `Resources.UnloadUnusedAssets()` 来进一步清理未使用的资源。
- request.dispose(): 对于 UnityWebRequestAssetBundle，使用 dispose() 来释放网络请求资源。

正确管理 AssetBundle 的加载和卸载，不仅能够提高游戏的性能，减少内存占用，还能避免不必要的资源重复加载，保持游戏的流畅体验。

