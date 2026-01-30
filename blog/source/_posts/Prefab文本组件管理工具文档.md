---
title: Prefab文本组件管理工具文档
date: 2025-07-09 14:16:02
updated: 2025-07-09 14:16:02
tags: Unity
categories: [Unity,Tools]
keywords: Prefab文本组件
description:
---
# Prefab文本组件管理工具文档

## 工具概述
Prefab文本组件管理工具是一个Unity编辑器扩展工具，专门用于批量管理和清理预制体(Prefab)中的文本组件内容。该工具能够扫描指定目录下的所有预制体，查找并管理UGUI Text、RichText和TextMeshPro(TMP)文本组件，支持查询非空文本组件和批量清空文本内容。

## 功能特性
- **批量扫描**：递归查找指定目录下的所有预制体文件
- **多类型支持**：同时支持UGUI Text、RichText和TextMeshPro(TMP)组件
- **文本查询**：查找并列出所有包含非空文本的组件
- **批量清理**：一键清空所有文本组件内容
- **详细报告**：提供操作过程和结果的详细输出
- **进度显示**：可视化进度条显示处理进度

## 使用说明

### 安装与启动
1. 将脚本放置在Unity项目的Editor文件夹下
2. 在Unity编辑器中，通过菜单栏选择 `Tools/文本组件管理` 打开工具窗口

### 界面说明
工具窗口包含以下主要部分：
- **路径选择**：显示和修改预制体所在目录（默认为`Assets/_GameCenter/_Resources/prefab`）
- **功能按钮**：
  - "查询非空文本控件"：查找并显示所有非空文本组件
  - "清空文本控件"：清空所有文本组件内容
- **结果展示区域**：显示操作过程和结果的详细信息

### 操作步骤
1. **查询非空文本**：
   - 确认或修改预制体目录路径
   - 点击"查询非空文本控件"按钮
   - 查看结果区域中的非空文本列表

2. **清空文本内容**：
   - 确认或修改预制体目录路径
   - 点击"清空文本控件"按钮
   - 查看结果区域中的清理报告

### 输出结果解读
- **查询结果**：
  ```
  预制体序号 预制体名称
    文本序号 文本路径：父对象/组件名 文本内容：实际文本
  ```
- **清理结果**：
  ```
  预制体：路径 文本路径：父对象/组件名 文本:被清理的文本内容
  ```

## 技术实现
### 核心逻辑
1. **预制体扫描**：使用AssetDatabase查找指定目录下的所有预制体
2. **组件获取**：递归获取预制体中的所有文本组件
3. **内容处理**：
   - 查询模式：收集并显示非空文本信息
   - 清理模式：将文本内容设置为空字符串
4. **资源保存**：修改后保存预制体变更

### 关键方法
- `FindNotEmptyText`：查询非空文本组件
- `ClearText`：清空文本组件内容
- `Clean<T>`：通用清理方法，处理具体文本类型

## 注意事项
1. 工具会直接修改预制体文件，建议操作前备份项目
2. 仅处理指定目录下的预制体，不处理场景中的对象
3. 清理操作不可逆，请谨慎使用
4. 处理大量预制体时可能需要较长时间
5. 需要确保路径在Assets目录下

``` C#
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
