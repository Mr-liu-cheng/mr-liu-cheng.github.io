---
title: PSD2UGUI
date: 2026-02-11 10:28:46
updated: 2026-02-11 10:28:46
tags: [Unity]
categories: Unity
keywords:  [PSD2UGUI]
description:
---
设计一个PSD到UGUI的转换工具需要综合考虑**易用性、准确性、扩展性和性能**。下面是一个详细的设计方案：

---

## 一、核心功能设计

### 1. **PSD解析模块**
- **图层识别**：解析PSD图层结构、命名、可见性、锁定状态
- **样式提取**：
  - 文字属性（字体、大小、颜色、对齐方式）
  - 形状/矢量图层（路径、填充、描边）
  - 图层效果（阴影、内发光、外发光、描边等）
  - 图层混合模式和不透明度
- **切片支持**：识别标记为切片的图层（如 `btn_start@2x`）

### 2. **UGUI生成模块**
- **智能转换策略**：
  - 文本图层 → `TextMeshPro` 或 `Text` 组件
  - 形状图层 → `Image` 组件（生成Sprite）或 `Mask` 组件
  - 图层组 → `Canvas` 或 `RectTransform` 容器
  - 按钮状态：通过命名规则自动生成多态（如 `btn_normal`, `btn_pressed`）
- **九宫格识别**：根据图层命名或标记自动设置 `Image` 的 `SpriteDrawMode`

### 3. **资源管理**
- **纹理生成**：将图层或图层组合并导出为Sprite（支持多分辨率）
- **字体处理**：自动匹配或替换字体（PS字体 → Unity可用字体）
- **图集打包**：可选自动打包图集功能

---

## 二、工具架构设计

```
PSD2UGUI Tool
├── PSD Parser（Photoshop文件解析）
│   ├── Layer Extractor（图层提取）
│   ├── Style Analyzer（样式分析）
│   └── Hierarchy Builder（层级构建）
├── Conversion Engine（转换引擎）
│   ├── Rule-Based Converter（基于规则的转换）
│   ├── Component Generator（组件生成）
│   └── Layout Calculator（布局计算）
├── Resource Manager（资源管理器）
│   ├── Texture Exporter（纹理导出）
│   ├── Asset Organizer（资源组织）
│   └── Atlas Packer（图集打包）
└── Unity Integration（Unity集成）
    ├── Editor Window（编辑器窗口）
    ├── Prefab Builder（预制体生成）
    └── Undo/Redo Support（撤销重做）
```

---

## 三、关键实现细节

### 1. **命名约定系统**
```csharp
// 示例命名规则检测
enum LayerType {
    Button,
    Image,
    Text,
    Slider,
    Toggle,
    Container
}

// 通过后缀识别
static Dictionary<string, LayerType> SuffixRules = new() {
    { "_btn", LayerType.Button },
    { "_txt", LayerType.Text },
    { "_img", LayerType.Image },
    { "_mask", LayerType.Mask }
};
```

### 2. **布局转换策略**
- **锚点自动计算**：根据图层在画布中的位置推断锚点
- **响应式适配**：生成支持多种屏幕分辨率的布局
- **像素完美对齐**：保持PSD中的精确像素位置

### 3. **组件映射表**
| PSD元素 | UGUI组件 | 特殊处理 |
|---------|----------|----------|
| 文字图层 | TextMeshPro | 字体匹配，富文本支持 |
| 形状图层 | Image + Sprite | 可点击区域优化 |
| 图层效果 | Shadow/Outline组件 | 性能优化选项 |
| 图层组 | ScrollRect/GridLayout | 滚动区域识别 |

---

## 四、用户交互设计

### 1. **Unity Editor界面**
```csharp
[CustomEditor(typeof(PSDImporter))]
public class PSDImporterWindow : EditorWindow {
    // 主要功能区
    enum Tab { Import, Settings, Advanced }
    
    // 可视化配置
    SerializedProperty importSettings;
    
    void OnGUI() {
        // 1. PSD文件选择区域
        // 2. 转换选项（生成Prefab、生成图集等）
        // 3. 图层映射预览
        // 4. 批量处理支持
    }
}
```

### 2. **转换配置选项**
- **纹理设置**：导出格式（PNG/JPG）、压缩质量
- **生成选项**：是否生成动画控制器、是否自动命名
- **优化选项**：合并相似图层、移除隐藏图层

---



## 五、推荐技术栈

1. **PSD解析库**：
   - 官方：Adobe Photoshop SDK（功能最全）
   - 开源：`PsdPlugin`（.NET）或 `psd.js`（通过Node.js后端）

2. **Unity开发**：
   - Editor扩展：`UnityEditor`命名空间
   - UI生成：`UGUI` + `TextMeshPro`
   - 序列化：`ScriptableObject`存储配置

3. **辅助工具**：
   - 图像处理：`UnityEngine.Experimental.Rendering`
   - 文件监控：`FileSystemWatcher`实现自动重载

---

## 六、实施路线图

1. **Phase 1**：基础PSD解析和简单UI生成
2. **Phase 2**：完整组件支持（按钮、滑动条等）
3. **Phase 3**：性能优化和团队协作功能

这样的工具可以显著提升UI制作效率，建议先实现核心的图层到UGUI组件转换，再逐步添加高级功能。


## 七、jsx脚本

``` js
// **************************************************
// Optimized version of "Export PSDUI.jsx"
// - Faster export by duplicating only the target layer into a temp document
// - Avoids per-layer: rasterizeAll + mergeVisibleLayers on full PSD + history rollback
// - Builds XML via array join (faster than repeated string concatenation)
//
// Usage:
// 1) Put this file into Photoshop Scripts folder, or run via File > Scripts > Browse...
// 2) Open a PSD, run the script, choose destination folder.
// **************************************************
//
// enable double clicking from the Macintosh Finder or the Windows Explorer
// #target photoshop
//

var sceneData;
var sceneDataParts;
var duppedPsd;
var tmpDoc;
var tmpDocBaseState;
var destinationFolder;
var uuid;
var sourcePsdName;
var layerCount = 0; // 当前文档的图层数
var layerSetsCount = 0; // 当前文档的图层组数
var getLayerRec1Count = 0;
var dirpath;
var pngSaveOptions;
var pngSaveAsOptions;

// 导出速度/质量开关
// - true: 更快更小（PNG-8，适合 UI 图标/纯色/少色）
// - false: PNG-24（颜色更全，通常稍慢）
var FAST_PNG8 = true;
// 导出引擎开关
// - false: 优先用 saveAs(PNG)（通常比 Save for Web 快）
// - true: 使用 Save for Web（兼容性高，但常见更慢）
var USE_SAVE_FOR_WEB = false;
// 简易性能统计（会在结束弹窗里显示各阶段耗时）
var ENABLE_PROFILING = true;
var prof = {
    dup_ms: 0,
    switch_ms: 0,
    raster_ms: 0,
    crop_ms: 0,
    export_ms: 0
};

// 默认不栅格化（很多图层直接导出就足够；栅格化常常很耗时）
// 如果你发现导出的 PNG 和 PS 里看到的不一致（矢量/智能对象/样式），再改成 true
var RASTERIZE_BEFORE_EXPORT = false;

main();

function main() {
    try {
        if (app.documents.length <= 0) {
            if (app.playbackDisplayDialogs != DialogModes.NO) {
                alert("You must have a document open to export!");
            }
            return 'cancel';
        }

        destinationFolder = Folder.selectDialog("Choose the destination for export.");
        if (!destinationFolder) return;

        uuid = 1;
        sourcePsdName = app.activeDocument.name;
        var layerCount1 = app.documents[sourcePsdName].layers.length;
        var layerSetsCount1 = app.documents[sourcePsdName].layerSets.length;
        if ((layerCount1 <= 1) && (layerSetsCount1 <= 0)) {
            if (app.playbackDisplayDialogs != DialogModes.NO) {
                alert("You need a document with multiple layers to export!");
                return 'cancel';
            }
        }

        var startTime = new Date();

        var savedRulerUnits = app.preferences.rulerUnits;
        var savedTypeUnits = app.preferences.typeUnits;
        app.preferences.rulerUnits = Units.PIXELS;
        app.preferences.typeUnits = TypeUnits.PIXELS;

        duppedPsd = app.activeDocument.duplicate();
        duppedPsd.activeLayer = duppedPsd.layers[duppedPsd.layers.length - 1];

        // 复用临时文档，避免每个图层都新建/关闭文档
        tmpDoc = app.documents.add(duppedPsd.width, duppedPsd.height, duppedPsd.resolution, "tmp_export_psdui", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        tmpDocBaseState = tmpDoc.activeHistoryState;

        // 复用导出选项对象，避免每张图都 new 一次
        pngSaveOptions = new ExportOptionsSaveForWeb();
        pngSaveOptions.format = SaveDocumentType.PNG;
        pngSaveOptions.PNG8 = FAST_PNG8;
        pngSaveOptions.transparency = true;
        pngSaveOptions.interlaced = false;
        try { pngSaveOptions.includeProfile = false; } catch (ignoredProfile) { }

        pngSaveAsOptions = new PNGSaveOptions();
        pngSaveAsOptions.interlaced = false;

        sceneDataParts = [];
        sceneDataParts.push("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
        sceneDataParts.push("<PSDUI>");
        sceneDataParts.push("<psdSize>");
        sceneDataParts.push("<width>" + duppedPsd.width.value + "</width>");
        sceneDataParts.push("<height>" + duppedPsd.height.value + "</height>");
        sceneDataParts.push("</psdSize>");

        // 注意：后续会从 duppedPsd 复制图层到临时文档导出
        exportLayerSet(duppedPsd);

        sceneDataParts.push("</PSDUI>");
        sceneData = sceneDataParts.join("");

        SumObj(duppedPsd);
        try { tmpDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (ignoredClose) { }
        duppedPsd.close(SaveOptions.DONOTSAVECHANGES);

        var sceneFile = new File(destinationFolder + "/" + destinationFolder.name + ".xml");
        sceneFile.open('w');
        sceneFile.writeln(sceneData);
        sceneFile.close();

        app.preferences.rulerUnits = savedRulerUnits;
        app.preferences.typeUnits = savedTypeUnits;

        var totalTime = (new Date() - startTime) / 1000;
        var minutes = Math.floor(totalTime / 60);
        var seconds = Math.floor(totalTime % 60);

        var cnt = "总图层：" + layerCount + "   总图层组：" + layerSetsCount + "   耗时: " + minutes + " 分 " + seconds +
            " 秒" + "   计算大小的次数:" + getLayerRec1Count;
        if (ENABLE_PROFILING) {
            cnt += "\n复制图层: " + Math.round(prof.dup_ms) + "ms"
                + "  切换文档: " + Math.round(prof.switch_ms) + "ms"
                + "  栅格化: " + Math.round(prof.raster_ms) + "ms"
                + "  裁切: " + Math.round(prof.crop_ms) + "ms"
                + "  导出写盘: " + Math.round(prof.export_ms) + "ms";
        }
        $.writeln(cnt);
        
        alert(cnt);
    } finally {
        // no-op
    }
}

function exportLayerSet(obj) {
    if (obj.name.search("#") >= 0) return;

    sceneDataParts.push("<layers>");
    for (var i = obj.layers.length - 1; 0 <= i; i--) {
        if (obj.layers[i].typename == "LayerSet") {
            sceneDataParts.push("<Layer>");
            sceneDataParts.push("<type>Normal</type>");
            sceneDataParts.push("<name>" + obj.layers[i].name + "</name>");
            exportLayerSet(obj.layers[i]);
            sceneDataParts.push("<images>");
            for (var j = obj.layers[i].artLayers.length - 1; 0 <= j; j--) {
                exportArtLayer(obj.layers[i].artLayers[j]);
            }
            sceneDataParts.push("</images>");
            sceneDataParts.push("</Layer>");
        }
    }
    sceneDataParts.push("</layers>");
}

function SumObj(obj) {
    sunLayerCount(obj);
}

function sunLayerCount(obj) {
    for (var i = obj.layers.length - 1; 0 <= i; i--) {
        if (obj.layers[i].typename == "LayerSet") {
            layerSetsCount++;
            sunLayerCount(obj.layers[i]);
        } else {
            layerCount++;
        }
    }
}

function exportArtLayer(obj) {
    if (obj.name.search("#") >= 0) return;

    sceneDataParts.push("<Image>\n");
    if (LayerKind.TEXT == obj.kind) {
        exportLabel(obj);
    } else {
        exportImage(obj);
    }
    sceneDataParts.push("</Image>\n");
}

function exportLabel(obj) {
    sceneDataParts.push("<imageType>Label</imageType>\n");
    var validFileName = makeValidFileName(obj.name);
    sceneDataParts.push("<name>" + validFileName + "</name>\n");

    // 文本也需要位置与尺寸；默认不落盘 png（保持原脚本行为）
    saveSingleLayerPng(obj, validFileName, false);

    sceneDataParts.push("<arguments>");
    sceneDataParts.push("<string>" + obj.textItem.color.rgb.hexValue + "</string>");
    sceneDataParts.push("<string>" + obj.textItem.font + "</string>");
    sceneDataParts.push("<string>" + obj.textItem.size.value + "</string>");
    sceneDataParts.push("<string>" + obj.textItem.contents + "</string>");
    sceneDataParts.push("</arguments>");
}

function exportImage(obj) {
    var validFileName = makeValidFileName(obj.name);
    sceneDataParts.push("<name>" + validFileName + "</name>\n");

    if (obj.name.search("Common") >= 0) {
        sceneDataParts.push("<imageSource>Common</imageSource>\n");
        saveSingleLayerPng(obj, validFileName, false);
    } else {
        sceneDataParts.push("<imageSource>Custom</imageSource>\n");
        saveSingleLayerPng(obj, validFileName, true);
    }

    if (obj.name.search("9Slice") >= 0) {
        sceneDataParts.push("<imageType>SliceImage</imageType>\n");
    } else {
        sceneDataParts.push("<imageType>Image</imageType>\n");
    }
}

// 只复制当前图层到临时文档导出：避免对整份 PSD 反复 rasterizeAll/merge/trim/history
function saveSingleLayerPng(layer, fileName, writeToDisk) {
    getLayerRec1Count++;

    // 用 bounds 直接算尺寸与中心点（避免 trim）
    // bounds 单位为当前 rulerUnits（main 中已切到 px）
    var b = layer.bounds; // [left, top, right, bottom]
    var l = b[0].value, t = b[1].value, r = b[2].value, bt = b[3].value;
    var width = Math.max(0, r - l);
    var height = Math.max(0, bt - t);

    // 空层直接输出 0 尺寸（也避免后续导出）
    if (width === 0 || height === 0) {
        sceneDataParts.push("<position><x>0</x><y>0</y></position>");
        sceneDataParts.push("<size><width>0</width><height>0</height></size>");
        return;
    }

    var docW = duppedPsd.width.value;
    var docH = duppedPsd.height.value;
    var centerX = (l + r) / 2;
    var centerY = (t + bt) / 2;
    var x = centerX - (docW / 2);
    var y = -(centerY - (docH / 2));

    if (writeToDisk) {
        // 在复用的临时文档里复制图层，然后 crop 到 bounds 导出
        var ts = ENABLE_PROFILING ? new Date().getTime() : 0;
        app.activeDocument = tmpDoc;
        tmpDoc.activeHistoryState = tmpDocBaseState;
        if (ENABLE_PROFILING) prof.switch_ms += (new Date().getTime() - ts);

        // Photoshop 限制：复制源图层前，源文档必须是活动文档
        ts = ENABLE_PROFILING ? new Date().getTime() : 0;
        app.activeDocument = duppedPsd;
        if (ENABLE_PROFILING) prof.switch_ms += (new Date().getTime() - ts);

        var t0 = ENABLE_PROFILING ? new Date().getTime() : 0;
        layer.duplicate(tmpDoc, ElementPlacement.PLACEATBEGINNING);
        if (ENABLE_PROFILING) prof.dup_ms += (new Date().getTime() - t0);

        ts = ENABLE_PROFILING ? new Date().getTime() : 0;
        app.activeDocument = tmpDoc;
        if (ENABLE_PROFILING) prof.switch_ms += (new Date().getTime() - ts);
        tmpDoc.activeLayer = tmpDoc.layers[0];

        // 有些图层（文字/形状/智能对象）不栅格化导出会更慢或不一致，尽量栅格化当前层
        if (RASTERIZE_BEFORE_EXPORT) {
            var tr = ENABLE_PROFILING ? new Date().getTime() : 0;
            try { tmpDoc.activeLayer.rasterize(RasterizeType.ENTIRELAYER); } catch (ignoredRaster) { }
            if (ENABLE_PROFILING) prof.raster_ms += (new Date().getTime() - tr);
        }

        // crop 需要 UnitValue
        var t1 = ENABLE_PROFILING ? new Date().getTime() : 0;
        tmpDoc.crop([UnitValue(l, "px"), UnitValue(t, "px"), UnitValue(r, "px"), UnitValue(bt, "px")]);
        if (ENABLE_PROFILING) prof.crop_ms += (new Date().getTime() - t1);

        var pngFile = new File(destinationFolder + "/" + fileName + ".png");
        var t2 = ENABLE_PROFILING ? new Date().getTime() : 0;
        if (USE_SAVE_FOR_WEB) {
            tmpDoc.exportDocument(pngFile, ExportType.SAVEFORWEB, pngSaveOptions);
        } else {
            // saveAs 通常更快；asCopy=true 避免污染 tmpDoc 名称/路径
            tmpDoc.saveAs(pngFile, pngSaveAsOptions, true, Extension.LOWERCASE);
        }
        if (ENABLE_PROFILING) prof.export_ms += (new Date().getTime() - t2);
    }

    sceneDataParts.push("<position>");
    sceneDataParts.push("<x>" + x + "</x>");
    sceneDataParts.push("<y>" + y + "</y>");
    sceneDataParts.push("</position>");

    sceneDataParts.push("<size>");
    sceneDataParts.push("<width>" + width + "</width>");
    sceneDataParts.push("<height>" + height + "</height>");
    sceneDataParts.push("</size>");
}

function makeValidFileName(fileName) {
    var validName = fileName.replace(/^\s+|\s+$/gm, ''); // trim spaces
    validName = validName.replace(/[\\\*\/\?:"\|<>]/g, ''); // remove characters not allowed in a file name
    validName = validName.replace(/[ ]/g, '_'); // replace spaces with underscores

    if (validName.match("Common")) {
        validName = validName.substring(validName.lastIndexOf("@") + 1);
    } else if (!sourcePsdName.match("Common")) {
        validName += "_" + uuid++;
    }

    // 大量图层时 $.writeln 会拖慢速度，如需调试再打开
    // $.writeln(validName);
    return validName;
}


```
