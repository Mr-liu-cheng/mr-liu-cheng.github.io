## 概述

`ClearPrefabTextContent` 是一个 Unity 编辑器工具，主要用于查询和清理预制体(Prefab)中的文本内容。该工具可以处理三种类型的文本组件：
1. 标准 Unity UI Text
2. RichText (富文本)
3. TextMeshPro (TMP_Text)

## 功能说明

### 1. 查询非空文本控件

**菜单路径**: Tools/查询非空文本控件

**功能**:
- 遍历指定文件夹及其子文件夹中的所有预制体
- 查找所有包含非空文本的 UI 组件
- 将查询结果保存到桌面上的"非空文本查询结果.txt"文件中
- 自动打开保存结果的文件所在位置

**输出格式**:
```
1预制体：PrefabName 
    1文本路径：ParentName/TextComponentName  文本内容：Sample Text
    2文本路径：ParentName/TextComponentName2  文本内容：Another Text
2预制体：AnotherPrefab
    3文本路径：Parent/Text  文本内容：More Text
```

### 2. 清空文本控件

**菜单路径**: Tools/清空文本控件

**功能**:
- 遍历指定文件夹及其子文件夹中的所有预制体
- 查找所有文本组件并将其内容清空
- 记录被清空的文本内容到 Unity 控制台
- 自动保存修改后的预制体

## 使用说明

1. **关闭预制体编辑界面**：在使用此工具前，请确保关闭所有预制体编辑窗口
2. **选择操作目录**：工具会提示选择要操作的文件夹，默认路径为 `D:/Project/malaysiaMinorPackage2/malaysiaMinor2/Assets/_GameCenter/_Resources/prefab`
3. **注意事项**：
   - 只能操作位于 Unity 项目 Assets 目录下的文件夹
   - 操作前建议备份项目或使用版本控制
   - 清空操作不可逆，请谨慎使用

## 技术细节

- **支持的文本组件类型**:
  - `UnityEngine.UI.Text`
  - `RichText` (自定义富文本组件)
  - `TMPro.TMP_Text` (TextMeshPro 文本)

- **进度显示**：长时间操作会显示进度条，避免编辑器无响应

- **错误处理**：
  - 检测所选文件夹是否在 Assets 目录下
  - 处理空文本情况

## 使用示例

1. **查询非空文本**:
   - 点击菜单 "Tools/查询非空文本控件"
   - 选择包含预制体的文件夹
   - 等待操作完成，查看桌面生成的文本文件

2. **清空文本**:
   - 点击菜单 "Tools/清空文本控件"
   - 选择包含预制体的文件夹
   - 等待操作完成，查看 Unity 控制台中的清理记录

## 注意事项

- 此工具会直接修改预制体资源，操作前请确保已备份重要数据
- 对于大型项目，操作可能需要较长时间
- 工具默认路径可能需要根据项目实际情况修改


```
using System.Collections.Generic;
using System.IO;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using System.Linq;
using System;

/*
 ClearPrefabTextContent 是一个 Unity 编辑器工具，主要用于查询和清理预制体(Prefab)中的文本内容。该工具可以处理三种类型的文本组件：
    1标准 Unity UI Text
    2RichText (富文本)
    3TextMeshPro (TMP_Text)

>> 查询非空文本控件:
    功能:
        遍历指定文件夹及其子文件夹中的所有预制体
        查找所有包含非空文本的 UI 组件
        将查询结果保存到桌面上的"非空文本查询结果.txt"文件中
        自动打开保存结果的文件所在位置

>> 清空文本控件:
    功能:
        遍历指定文件夹及其子文件夹中的所有预制体
        查找所有文本组件并将其内容清空
        记录被清空的文本内容到 Unity 控制台
        自动保存修改后的预制
    注意：
        关闭预制体编辑界面：在使用此工具前，请确保关闭所有预制体编辑窗口
        清空操作不可逆，请谨慎使用，操作前建议备份项目或使用版本控制
*/

public class ClearPrefabTextContent : EditorWindow
{
    private static List<KeyValuePair<string, string>> textDict;
    private Vector2 scrollPosition;
    private static string folderPath, defaultPath = "Assets/_GameCenter/_Resources/prefab";
    private static string cnt = "";

    [MenuItem("Tools/文本组件管理")]
    private static void TextComponentManager()
    {
        ShowWindow();
    }

    public static void ShowWindow()
    {
        GetWindow<ClearPrefabTextContent>("Prefab Text Content Manager");
    }

    private void OnGUI()
    {
        GUILayout.Label("Prefab Text Content Manager Tool", EditorStyles.boldLabel);
        EditorGUILayout.Space();
        folderPath = string.IsNullOrEmpty(folderPath) ? defaultPath : folderPath;
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("Prefab Folder Path:", folderPath); //
        if (GUILayout.Button("...", GUILayout.Width(30)))
        {
            var path = EditorUtility.OpenFolderPanel("Select Prefab Folder", defaultPath, "");
            if (string.IsNullOrEmpty(path)) return;
            // 转换为相对于Assets的路径
            if (path.StartsWith(Application.dataPath))
                folderPath = path.Substring(path.IndexOf("Assets"));
        }
        EditorGUILayout.EndHorizontal();
        EditorGUILayout.Space();
        if (GUILayout.Button("查询非空文本控件"))
        {
            cnt = "";
            if (string.IsNullOrEmpty(folderPath) || !Directory.Exists(folderPath))
                cnt += "Please select a valid folder path first!";
            else
                FindNotEmptyText();
        }
        EditorGUILayout.Space();
        if (GUILayout.Button("清空文本控件"))
        {
            cnt = "";
            if (string.IsNullOrEmpty(folderPath) || !Directory.Exists(folderPath))
                cnt += "Please select a valid folder path first!";
            else
                ClearText();
        }
        EditorGUILayout.Space();
        GUILayout.Label("查询结果：", EditorStyles.boldLabel);
        scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition, GUILayout.ExpandHeight(true));
        EditorGUILayout.TextArea(cnt, GUILayout.ExpandHeight(true));
        EditorGUILayout.EndScrollView();
    }

    private static void FindNotEmptyText()
    {
        textDict = new List<KeyValuePair<string, string>>();
        var path = folderPath;
        cnt += string.Format("开始查询 {0} 下所有的预制体\n", path);
        if (!path.Contains("Assets"))
        {
            cnt += "所选文件夹不在 Assets 目录下，无法处理！";
            return;
        }
        path = path.Substring(path.IndexOf("Assets"));
        var guids = AssetDatabase.FindAssets("t:Prefab", new string[] { path });
        var prefabCount = 0;
        var textCount = 0;
        if (guids != null && guids.Length > 0)
        {
            EditorUtility.DisplayProgressBar("Finding...", "Start", 0);
            var progress = 0;
            var lastPrefab = "";
            foreach (var guid in guids)
            {
                progress++;
                var assetsPath = AssetDatabase.GUIDToAssetPath(guid);
                EditorUtility.DisplayProgressBar("Checking....", assetsPath, (float)progress / guids.Length);
                var obj = AssetDatabase.LoadAssetAtPath(assetsPath, typeof(GameObject)) as GameObject;
                var lblist1 = obj.GetComponentsInChildren<Text>(true);
                var lblist2 = obj.GetComponentsInChildren<RichText>(true);
                var lblist3 = obj.GetComponentsInChildren<TMP_Text>(true);
                var allTextComponents = new List<Component>()
                    .Concat(lblist1)
                    .Concat(lblist2)
                    .Concat(lblist3)
                    .ToList();
                foreach (var item in allTextComponents)
                {
                    var text = "";
                    if (item is Text uguiText)
                        text = uguiText.text;
                    else if (item is RichText richText)
                        text = richText.text;
                    //  cnt += (string.Format("\nRichText：{0}预制体：{1} ", prefabCount, obj.name));
                    else if (item is TMP_Text tmpText)
                        text = tmpText.text;
                    if (lastPrefab != guid && text != "")
                    {
                        prefabCount++;
                        cnt += string.Format("\n{0}预制体：{1} ", prefabCount, obj.name);
                        lastPrefab = guid;
                    }
                    if (text != "")
                    {
                        textCount++;
                        cnt += string.Format("\n    {2}文本路径：{3}/{0}  文本内容：{1}", item.name, text, textCount,
                            item.transform.parent.name);
                        textDict.Add(new KeyValuePair<string, string>(assetsPath, text));
                    }
                }
            }
            AssetDatabase.SaveAssets();
            EditorUtility.ClearProgressBar();
        }
        cnt += "\n\n查询完成";
    }

    private static void ClearText()
    {
        var folder = folderPath;
        cnt += string.Format("开始查询 {0} 下所有的预制体\n", folder);
        if (!folder.Contains("Assets"))
        {
            cnt += "所选文件夹不在 Assets 目录下，无法处理！";
            return;
        }
        folder = folder.Substring(folder.IndexOf("Assets"));
        var guids = AssetDatabase.FindAssets("t:Prefab", new string[] { folder });
        if (guids != null && guids.Length > 0)
        {
            EditorUtility.DisplayProgressBar("Clean...", "Start", 0);
            var progress = 0;
            foreach (var guid in guids)
            {
                progress++;
                var path = AssetDatabase.GUIDToAssetPath(guid);
                EditorUtility.DisplayProgressBar("Replace....", path, (float)progress / guids.Length);
                var prefab = PrefabUtility.LoadPrefabContents(path);
                var textComponentsDict = new Dictionary<Type, IEnumerable<Component>>
                {
                    { typeof(Text), prefab.GetComponentsInChildren<Text>(true) },
                    { typeof(RichText), prefab.GetComponentsInChildren<RichText>(true) },
                    { typeof(TMP_Text), prefab.GetComponentsInChildren<TMP_Text>(true) }
                };
                foreach (var kvp in textComponentsDict)
                {
                    foreach (var item in kvp.Value)
                    {
                        if (kvp.Key == typeof(Text))
                            Clean<Text>(item, path, prefab);
                        else if (kvp.Key == typeof(RichText))
                            Clean<RichText>(item, path, prefab);
                        else if (kvp.Key == typeof(TMP_Text))
                            Clean<TMP_Text>(item, path, prefab);
                    }
                }
                PrefabUtility.UnloadPrefabContents(prefab);
            }
            AssetDatabase.SaveAssets();
            EditorUtility.ClearProgressBar();
        }
        cnt += "\n\n清理完成";
    }

    private static void Clean<T>(Component item, string path, GameObject prefab)
    {
        var textProperty = typeof(T).GetProperty("text");
        if (textProperty != null)
        {
            var text = (string)textProperty.GetValue(item);
            if (!string.IsNullOrEmpty(text))
            {
                cnt += $"\n预制体：{path} 文本路径：{item.transform.parent.name}/{item.name} 文本:{text}";
                textProperty.SetValue(item, "");
                PrefabUtility.SaveAsPrefabAsset(prefab, path);
            }
        }
    }
}
```
