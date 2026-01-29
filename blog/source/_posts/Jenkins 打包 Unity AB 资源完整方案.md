---
title: Jenkins 打包 Unity AB 资源完整方案
date: 2026-01-29 12:06:02
updated: 2026-01-29 12:06:02
tags: Jenkins,自动化,打包
categories: Jenkins
keywords: Jenkins,自动化,打包
description: 
---

# Jenkins 打包 Unity AB 资源完整方案

## 一、Jenkins + Unity 自动化构建架构

### 1. 核心架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Jenkins 主服务器                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Jenkins Pipeline                    │   │
│  │  ┌─────────────┬─────────────┬──────────────┐      │   │
│  │  │  拉取代码    │  构建AB包    │  部署分发     │      │   │
│  │  │  Git Clone │ Unity Build │ Distribution │      │   │
│  │  └─────────────┴─────────────┴──────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Jenkins Agent                     │   │
│  │  (Windows/Mac with Unity & Unity Build Tools)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────┬───────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
            ▼                             ▼                             ▼
    ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
    │   Git仓库      │             │   Unity工程    │             │   AB包存储     │
    │  (代码管理)    │             │  (资源+脚本)   │             │   (产出物)     │
    └───────────────┘             └───────────────┘             └───────────────┘
```

### 2. 环境准备清单

#### **硬件环境**
- Jenkins 主服务器 (Linux/Windows)
- Unity 构建节点 (Windows/macOS，安装 Unity)
- 存储服务器 (存放生成的 AB 包)

#### **软件环境**
```
必备软件栈：
1. Jenkins + Pipeline 插件
2. Git (源码管理)
3. Unity (指定版本，如 2021.3.x)
4. Unity Build Tools (命令行构建工具)
5. 7-Zip/WinRAR (压缩工具)
6. Python/Batch/Shell 脚本工具
```

---

## 二、Jenkins Pipeline 配置方案

### 方案1：Jenkinsfile Pipeline (推荐)

```groovy
// Jenkinsfile - 放在 Unity 项目根目录
pipeline {
    agent any
    
    parameters {
        choice(
            name: 'BUILD_PLATFORM',
            choices: ['StandaloneWindows64', 'Android', 'iOS', 'WebGL'],
            description: '选择构建平台'
        )
        choice(
            name: 'AB_BUILD_TYPE',
            choices: ['Full', 'Incremental', 'Clean'],
            description: 'AB包构建类型'
        )
        string(
            name: 'AB_VERSION',
            defaultValue: '1.0.${BUILD_NUMBER}',
            description: 'AB包版本号'
        )
        booleanParam(
            name: 'UPLOAD_TO_CDN',
            defaultValue: true,
            description: '是否上传到CDN'
        )
    }
    
    environment {
        // Unity 安装路径 (Windows示例)
        UNITY_PATH = 'C:\\Program Files\\Unity\\Hub\\Editor\\2021.3.21f1\\Editor\\Unity.exe'
        
        // 项目路径
        PROJECT_PATH = 'D:\\Jenkins\\workspace\\${JOB_NAME}'
        
        // 输出路径
        OUTPUT_PATH = 'D:\\AB_Output\\${BUILD_NUMBER}'
        
        // Python 脚本路径
        PYTHON_SCRIPT = '${WORKSPACE}\\BuildScripts\\build_ab.py'
    }
    
    stages {
        stage('清理工作空间') {
            steps {
                cleanWs()
            }
        }
        
        stage('拉取代码') {
            steps {
                git branch: '${GIT_BRANCH}',
                    url: 'git@github.com:your-company/unity-game.git',
                    credentialsId: 'git-credentials'
            }
        }
        
        stage('准备构建环境') {
            steps {
                script {
                    // 创建输出目录
                    bat "mkdir ${OUTPUT_PATH}"
                    
                    // 备份上一版本的 AB 包 (用于增量构建)
                    if (params.AB_BUILD_TYPE == 'Incremental') {
                        bat "xcopy D:\\AB_Output\\latest\\*.* ${OUTPUT_PATH}\\previous\\ /E /Y"
                    }
                }
            }
        }
        
        stage('构建 AssetBundle') {
            steps {
                script {
                    // 方法1: 使用 Unity 命令行构建
                    bat """
                        "${UNITY_PATH}" \\
                        -batchmode \\
                        -nographics \\
                        -silent-crashes \\
                        -projectPath "${PROJECT_PATH}" \\
                        -executeMethod AssetBundleBuilder.BuildAll \\
                        -buildTarget ${params.BUILD_PLATFORM} \\
                        -buildType ${params.AB_BUILD_TYPE} \\
                        -outputPath "${OUTPUT_PATH}" \\
                        -logFile "${OUTPUT_PATH}\\build.log" \\
                        -quit
                    """
                    
                    // 方法2: 使用 Python 脚本构建 (更灵活)
                    // bat "python ${PYTHON_SCRIPT} --platform ${params.BUILD_PLATFORM} --type ${params.AB_BUILD_TYPE}"
                }
            }
        }
        
        stage('生成版本文件') {
            steps {
                script {
                    // 生成 manifest 文件
                    writeFile file: "${OUTPUT_PATH}/version.json", text: """
                    {
                        "version": "${params.AB_VERSION}",
                        "build_number": "${BUILD_NUMBER}",
                        "platform": "${params.BUILD_PLATFORM}",
                        "build_time": "${new Date().format('yyyy-MM-dd HH:mm:ss')}",
                        "files": [
                            {
                                "name": "manifest",
                                "md5": "${md5(file: '${OUTPUT_PATH}/manifest')}",
                                "size": "${fileSize('${OUTPUT_PATH}/manifest')}"
                            }
                        ]
                    }
                    """
                    
                    // 计算所有文件的 MD5
                    bat """
                        cd "${OUTPUT_PATH}"
                        dir /b /s *.* > filelist.txt
                        python ${WORKSPACE}/BuildScripts/calc_md5.py filelist.txt files_md5.json
                    """
                }
            }
        }
        
        stage('压缩打包') {
            steps {
                script {
                    // 使用 7-Zip 压缩
                    bat """
                        7z a -tzip "${OUTPUT_PATH}/ab_package_${BUILD_NUMBER}.zip" "${OUTPUT_PATH}\\*" -x!*.log
                    """
                    
                    // 记录压缩包信息
                    archiveArtifacts artifacts: "${OUTPUT_PATH}/ab_package_${BUILD_NUMBER}.zip", fingerprint: true
                }
            }
        }
        
        stage('上传到 CDN') {
            when {
                expression { params.UPLOAD_TO_CDN == true }
            }
            steps {
                script {
                    // 上传到阿里云 OSS
                    bat """
                        python ${WORKSPACE}/BuildScripts/upload_to_oss.py \\
                        --file "${OUTPUT_PATH}/ab_package_${BUILD_NUMBER}.zip" \\
                        --bucket game-ab-bucket \\
                        --path "v${params.AB_VERSION}/"
                    """
                    
                    // 更新最新版本链接
                    bat """
                        echo "https://cdn.yourgame.com/ab/v${params.AB_VERSION}/" > ${OUTPUT_PATH}/cdn_url.txt
                    """
                }
            }
        }
        
        stage('测试验证') {
            steps {
                script {
                    // 1. 检查文件完整性
                    bat """
                        python ${WORKSPACE}/BuildScripts/check_ab_integrity.py \\
                        --path "${OUTPUT_PATH}" \\
                        --platform ${params.BUILD_PLATFORM}
                    """
                    
                    // 2. 生成测试报告
                    junit '**/test-results/*.xml'
                }
            }
        }
        
        stage('通知与清理') {
            steps {
                script {
                    // 发送构建成功通知
                    emailext (
                        subject: "✅ Unity AB包构建成功 - #${BUILD_NUMBER}",
                        body: """
                        <h2>Unity AssetBundle 构建完成</h2>
                        <p><b>项目:</b> ${JOB_NAME}</p>
                        <p><b>构建号:</b> #${BUILD_NUMBER}</p>
                        <p><b>平台:</b> ${params.BUILD_PLATFORM}</p>
                        <p><b>版本:</b> ${params.AB_VERSION}</p>
                        <p><b>构建时间:</b> ${new Date().format('yyyy-MM-dd HH:mm:ss')}</p>
                        <p><b>输出路径:</b> ${OUTPUT_PATH}</p>
                        <p><b>CDN地址:</b> https://cdn.yourgame.com/ab/v${params.AB_VERSION}/</p>
                        <p><a href="${BUILD_URL}">查看构建详情</a></p>
                        """,
                        to: 'dev-team@yourcompany.com',
                        attachLog: true
                    )
                    
                    // 清理旧的构建 (保留最近10个)
                    bat """
                        forfiles /p "D:\\AB_Output" /d -10 /c "cmd /c if @isdir==TRUE rmdir /s /q @path"
                    """
                }
            }
        }
    }
    
    post {
        always {
            // 总是执行的清理操作
            echo '构建流程结束'
        }
        success {
            // 构建成功时执行
            echo '✅ AB包构建成功！'
        }
        failure {
            // 构建失败时执行
            echo '❌ AB包构建失败！'
            
            // 发送失败通知
            emailext (
                subject: "❌ Unity AB包构建失败 - #${BUILD_NUMBER}",
                body: "构建失败，请查看日志: ${BUILD_URL}",
                to: 'dev-team@yourcompany.com',
                attachLog: true
            )
        }
    }
}
```

### 方案2：Freestyle Job 配置

**配置步骤：**
1. **新建 Item** → 选择 Freestyle project
2. **源码管理** → Git → 填写仓库地址
3. **构建触发器**：
   - 定时构建：`H 2 * * *` (每天凌晨2点)
   - Git Hook：GitLab/GitHub webhook
   - 手动构建
4. **构建环境**：
   - Delete workspace before build starts
   - Provide Node & npm bin/ folder to PATH
5. **构建步骤**：
   - Execute Windows batch command
   - Execute Python script
   - Invoke Unity from command line

---

## 三、Unity 侧构建脚本

### 1. Unity C# 构建脚本示例

```csharp
// Assets/Editor/AssetBundleBuilder.cs
using UnityEditor;
using System.IO;
using System.Collections.Generic;

public class AssetBundleBuilder
{
    // Jenkins 调用的入口方法
    public static void BuildAll()
    {
        // 从命令行参数获取配置
        string buildTargetStr = GetCommandLineArg("-buildTarget");
        string buildType = GetCommandLineArg("-buildType");
        string outputPath = GetCommandLineArg("-outputPath");
        
        BuildTarget buildTarget = ParseBuildTarget(buildTargetStr);
        
        // 设置 AB 包输出目录
        string abOutputPath = Path.Combine(outputPath, buildTargetStr);
        
        // 清理旧的 Manifest
        CleanOldManifests(abOutputPath);
        
        // 设置 AB 包名称规则
        SetAssetBundleNames();
        
        // 构建 AB 包
        BuildPipeline.BuildAssetBundles(
            abOutputPath,
            BuildAssetBundleOptions.ChunkBasedCompression | 
            BuildAssetBundleOptions.DeterministicAssetBundle,
            buildTarget
        );
        
        // 生成版本信息
        GenerateVersionInfo(abOutputPath, buildTargetStr);
        
        // 验证构建结果
        ValidateBuildResult(abOutputPath);
        
        EditorApplication.Exit(0);
    }
    
    private static void SetAssetBundleNames()
    {
        // 规则1: 按目录设置 AB 包名
        SetBundleNameByDirectory("Assets/Resources/UI", "ui");
        SetBundleNameByDirectory("Assets/Resources/Characters", "characters");
        SetBundleNameByDirectory("Assets/Resources/Scenes", "scenes");
        SetBundleNameByDirectory("Assets/Resources/Sounds", "sounds");
        
        // 规则2: 按资源类型设置
        SetBundleNameByExtension("Assets/Resources/Prefabs", ".prefab", "prefabs");
        SetBundleNameByExtension("Assets/Resources/Materials", ".mat", "materials");
        
        // 规则3: 大资源单独打包
        SetSingleAssetBundle("Assets/Resources/BigTextures/bg_texture.png", "big_textures");
    }
    
    private static void CleanOldManifests(string outputPath)
    {
        if (Directory.Exists(outputPath))
        {
            string[] files = Directory.GetFiles(outputPath, "*.*", SearchOption.AllDirectories);
            foreach (string file in files)
            {
                if (file.EndsWith(".manifest") || file.EndsWith(".meta"))
                {
                    File.Delete(file);
                }
            }
        }
    }
    
    private static void GenerateVersionInfo(string outputPath, string platform)
    {
        // 收集所有 AB 包信息
        Dictionary<string, ABFileInfo> fileInfos = new Dictionary<string, ABFileInfo>();
        
        string[] abFiles = Directory.GetFiles(outputPath, "*.ab", SearchOption.AllDirectories);
        foreach (string file in abFiles)
        {
            FileInfo fi = new FileInfo(file);
            string relativePath = file.Replace(outputPath + "\\", "");
            string md5 = CalculateMD5(file);
            
            fileInfos[relativePath] = new ABFileInfo
            {
                name = Path.GetFileNameWithoutExtension(file),
                size = fi.Length,
                md5 = md5,
                dependencies = GetDependencies(file)
            };
        }
        
        // 写入 JSON 文件
        string json = JsonUtility.ToJson(new ABManifest
        {
            version = Application.version,
            buildTime = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            platform = platform,
            files = fileInfos
        }, true);
        
        File.WriteAllText(Path.Combine(outputPath, "ab_manifest.json"), json);
    }
    
    private static string[] GetDependencies(string abPath)
    {
        // 获取 AB 包依赖关系
        // 实际实现需要读取 AssetBundleManifest
        return new string[0];
    }
}
```

### 2. Unity 命令行参数解析

```csharp
// 命令行参数解析工具
public class CommandLineArgs
{
    private static Dictionary<string, string> _args;
    
    static CommandLineArgs()
    {
        _args = new Dictionary<string, string>();
        string[] args = System.Environment.GetCommandLineArgs();
        
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i].StartsWith("-"))
            {
                string key = args[i];
                string value = (i + 1 < args.Length && !args[i + 1].StartsWith("-")) 
                    ? args[i + 1] 
                    : "";
                _args[key] = value;
            }
        }
    }
    
    public static string GetArg(string key, string defaultValue = "")
    {
        return _args.ContainsKey(key) ? _args[key] : defaultValue;
    }
}
```

---

## 四、辅助工具脚本

### 1. Python 构建控制脚本

```python
# BuildScripts/build_ab.py
import argparse
import subprocess
import os
import json
import hashlib
from datetime import datetime

class UnityABBuilder:
    def __init__(self, config):
        self.config = config
        self.unity_path = config.get('unity_path', '')
        self.project_path = config.get('project_path', '')
        self.output_path = config.get('output_path', '')
        
    def build(self):
        """执行 Unity 构建"""
        cmd = [
            self.unity_path,
            '-batchmode',
            '-nographics',
            '-silent-crashes',
            '-projectPath', self.project_path,
            '-executeMethod', 'AssetBundleBuilder.BuildAll',
            '-buildTarget', self.config['platform'],
            '-buildType', self.config['build_type'],
            '-outputPath', self.output_path,
            '-logFile', os.path.join(self.output_path, 'unity_build.log'),
            '-quit'
        ]
        
        print(f"执行命令: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Unity 构建失败: {result.stderr}")
        
        return True
    
    def generate_manifest(self):
        """生成资源清单文件"""
        manifest = {
            "version": self.config['version'],
            "build_number": self.config['build_number'],
            "platform": self.config['platform'],
            "build_time": datetime.now().isoformat(),
            "total_size": 0,
            "files": []
        }
        
        # 遍历输出目录，收集文件信息
        for root, dirs, files in os.walk(self.output_path):
            for file in files:
                if file.endswith('.ab') or file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, self.output_path)
                    
                    file_info = self.get_file_info(file_path, relative_path)
                    manifest['files'].append(file_info)
                    manifest['total_size'] += file_info['size']
        
        # 写入 manifest 文件
        manifest_path = os.path.join(self.output_path, 'resource_manifest.json')
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        return manifest
    
    def get_file_info(self, file_path, relative_path):
        """获取文件详细信息"""
        stat = os.stat(file_path)
        
        return {
            "name": relative_path.replace('\\', '/'),
            "size": stat.st_size,
            "md5": self.calculate_md5(file_path),
            "mtime": stat.st_mtime
        }
    
    def calculate_md5(self, file_path):
        """计算文件 MD5"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

def main():
    parser = argparse.ArgumentParser(description='Unity AssetBundle 构建工具')
    parser.add_argument('--platform', required=True, 
                       choices=['StandaloneWindows64', 'Android', 'iOS', 'WebGL'],
                       help='目标平台')
    parser.add_argument('--type', default='Full',
                       choices=['Full', 'Incremental', 'Clean'],
                       help='构建类型')
    parser.add_argument('--version', default='1.0.0',
                       help='版本号')
    
    args = parser.parse_args()
    
    # 配置文件
    config = {
        'unity_path': 'C:\\Program Files\\Unity\\Hub\\Editor\\2021.3.21f1\\Editor\\Unity.exe',
        'project_path': os.getcwd(),
        'output_path': f'D:\\AB_Output\\build_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'platform': args.platform,
        'build_type': args.type,
        'version': args.version,
        'build_number': os.environ.get('BUILD_NUMBER', '0')
    }
    
    # 创建构建器并执行
    builder = UnityABBuilder(config)
    
    try:
        print("开始构建 AssetBundle...")
        builder.build()
        
        print("生成资源清单...")
        manifest = builder.generate_manifest()
        
        print(f"构建完成！总计 {len(manifest['files'])} 个文件，大小: {manifest['total_size'] / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"构建失败: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
```

### 2. 文件校验脚本

```python
# BuildScripts/check_ab_integrity.py
import json
import hashlib
import os

def verify_assetbundles(manifest_path):
    """验证 AB 包完整性"""
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    base_dir = os.path.dirname(manifest_path)
    errors = []
    
    for file_info in manifest['files']:
        file_path = os.path.join(base_dir, file_info['name'])
        
        if not os.path.exists(file_path):
            errors.append(f"文件不存在: {file_info['name']}")
            continue
        
        # 检查文件大小
        actual_size = os.path.getsize(file_path)
        if actual_size != file_info['size']:
            errors.append(f"文件大小不匹配: {file_info['name']} "
                         f"(预期: {file_info['size']}, 实际: {actual_size})")
            continue
        
        # 检查 MD5
        actual_md5 = calculate_md5(file_path)
        if actual_md5 != file_info['md5']:
            errors.append(f"MD5 不匹配: {file_info['name']}")
    
    return errors

def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()
```

---

## 五、Jenkins 高级配置

### 1. Agent 节点配置

**Windows Agent 配置步骤：**
1. 安装 Java JDK
2. 下载 Jenkins agent.jar
3. 创建服务启动脚本
4. 在 Jenkins Master 添加节点

```xml
<!-- Windows Agent 服务配置示例 -->
<service>
    <id>jenkins-agent</id>
    <name>Jenkins Agent</name>
    <description>Jenkins Build Agent for Unity</description>
    <executable>java</executable>
    <arguments>-jar agent.jar -jnlpUrl http://jenkins-server:8080/computer/Unity-Windows/slave-agent.jnlp -secret YOUR_SECRET -workDir "D:\Jenkins\workspace"</arguments>
    <logmode>rotate</logmode>
    <onfailure action="restart" />
</service>
```

### 2. 构建触发器配置

```groovy
// 多种触发方式
triggers {
    // 1. 定时构建
    cron('H 2 * * *')  // 每天凌晨2点
    
    // 2. Git 推送触发
    pollSCM('H/5 * * * *')  // 每5分钟检查一次
    
    // 3. 其他Job完成后触发
    upstream(upstreamProjects: 'unity-code-build', threshold: hudson.model.Result.SUCCESS)
    
    // 4. 参数化构建触发
    parameters {
        string(name: 'BRANCH', defaultValue: 'master')
    }
}
```

### 3. 并发构建控制

```groovy
options {
    // 禁止并发构建
    disableConcurrentBuilds()
    
    // 或限制并发数
    throttleConcurrentBuilds(
        throttleOption: 'project',
        maxTotal: 2,
        maxPerNode: 1
    )
    
    // 设置超时时间
    timeout(time: 60, unit: 'MINUTES')
    
    // 保留构建记录策略
    buildDiscarder(logRotator(
        numToKeepStr: '20',
        artifactNumToKeepStr: '5'
    ))
}
```

---

## 六、优化与最佳实践

### 1. 性能优化策略

**构建速度优化：**
```
1. 增量构建
   - 只构建有变化的资源
   - 缓存中间结果

2. 并行构建
   - 不同平台同时构建
   - 分包并行构建

3. 缓存策略
   - 保留依赖库
   - 预编译脚本
```

**存储优化：**
```
1. 分层存储
   - 热资源放 SSD
   - 冷资源放 HDD

2. 压缩策略
   - 使用 LZ4/LZMA 压缩
   - 分块压缩大文件

3. 去重策略
   - 相同资源只打包一次
   - 使用符号链接
```

### 2. 错误处理机制

```groovy
// Jenkins Pipeline 错误处理
stage('错误处理与重试') {
    steps {
        retry(3) {
            script {
                try {
                    // 构建操作
                    buildAssetBundles()
                } catch (Exception e) {
                    // 记录错误
                    currentBuild.result = 'FAILURE'
                    
                    // 发送告警
                    sendAlert(e.message)
                    
                    // 清理临时文件
                    cleanTempFiles()
                    
                    throw e
                }
            }
        }
        
        // 如果重试后仍失败，执行降级方案
        script {
            if (currentBuild.result == 'FAILURE') {
                echo "构建失败，使用上一次成功的构建..."
                useLastSuccessfulBuild()
            }
        }
    }
}
```

### 3. 安全最佳实践

**安全配置清单：**
1. **凭据管理**
   - 使用 Jenkins Credentials 存储密码
   - 限制凭据访问权限
   - 定期轮换凭据

2. **访问控制**
   - 设置构建节点白名单
   - 限制脚本执行权限
   - 审核构建日志

3. **代码安全**
   - 扫描构建脚本中的敏感信息
   - 验证第三方依赖
   - 签名验证构建产物

---

## 七、监控与告警

### 1. Jenkins 构建监控

**关键监控指标：**
- 构建成功率
- 构建持续时间
- 资源使用率
- 队列等待时间

```groovy
// 构建指标收集
post {
    always {
        script {
            // 收集构建指标
            def metrics = [
                'build_duration': currentBuild.duration,
                'build_result': currentBuild.result,
                'queue_time': currentBuild.queueTime,
                'artifacts_size': getArtifactsSize(),
                'ab_count': countAssetBundles()
            ]
            
            // 发送到监控系统
            sendToPrometheus(metrics)
            
            // 写入数据库
            writeBuildMetrics(metrics)
        }
    }
}
```

### 2. 告警规则配置

**告警触发条件：**
1. 连续 3 次构建失败
2. 构建时间超过 30 分钟
3. AB 包数量异常减少
4. 文件大小异常增长

```groovy
// 智能告警
def checkBuildHealth() {
    def recentBuilds = Jenkins.instance.getItemByFullName(env.JOB_NAME)
        .getBuilds()
        .limit(5)
    
    def failureCount = recentBuilds.count { it.result == 'FAILURE' }
    
    if (failureCount >= 3) {
        sendAlert("连续 ${failureCount} 次构建失败！")
    }
}
```

---

## 八、扩展功能

### 1. 多环境部署

```groovy
// 多环境配置
def environments = [
    'dev': [
        cdn_url: 'https://dev-cdn.yourgame.com',
        bucket: 'game-ab-dev'
    ],
    'test': [
        cdn_url: 'https://test-cdn.yourgame.com',
        bucket: 'game-ab-test'
    ],
    'prod': [
        cdn_url: 'https://cdn.yourgame.com',
        bucket: 'game-ab-prod'
    ]
]

stage('选择部署环境') {
    steps {
        script {
            envConfig = environments[params.DEPLOY_ENV]
            echo "部署到 ${params.DEPLOY_ENV} 环境"
            echo "CDN地址: ${envConfig.cdn_url}"
        }
    }
}
```

### 2. 自动化测试集成

```groovy
stage('AB包功能测试') {
    steps {
        script {
            // 1. 完整性测试
            runIntegrityTest()
            
            // 2. 加载测试
            runLoadTest()
            
            // 3. 兼容性测试
            runCompatibilityTest()
            
            // 4. 性能测试
            runPerformanceTest()
        }
        
        // 测试报告
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: false,
            keepAll: true,
            reportDir: 'test-results',
            reportFiles: 'index.html',
            reportName: 'AB包测试报告'
        ])
    }
}
```

### 3. 版本管理与回滚

```groovy
stage('版本管理') {
    steps {
        script {
            // 记录版本信息
            def versionInfo = [
                build_number: env.BUILD_NUMBER,
                version: params.AB_VERSION,
                commit_hash: env.GIT_COMMIT,
                build_time: new Date().format('yyyy-MM-dd HH:mm:ss'),
                platform: params.BUILD_PLATFORM,
                artifacts: [
                    'ab_package': "${env.OUTPUT_PATH}/ab_package_${env.BUILD_NUMBER}.zip",
                    'manifest': "${env.OUTPUT_PATH}/resource_manifest.json"
                ]
            ]
            
            // 保存到版本数据库
            saveVersionInfo(versionInfo)
            
            // 打标签
            if (params.DEPLOY_ENV == 'prod') {
                sh "git tag v${params.AB_VERSION}"
                sh "git push origin v${params.AB_VERSION}"
            }
        }
    }
}

stage('回滚机制') {
    steps {
        script {
            input message: '是否需要回滚?', ok: '确认回滚'
            
            def rollbackVersion = input(
                message: '选择回滚到的版本',
                parameters: [
                    choice(name: 'VERSION', choices: getAvailableVersions())
                ]
            )
            
            // 执行回滚
            rollbackToVersion(rollbackVersion)
        }
    }
}
```

---

## 九、故障排查指南

### 常见问题及解决方案

| 问题现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| **Unity 命令行构建失败** | Unity 版本不匹配 | 检查 Unity 安装路径和版本 |
| **AB 包生成不全** | 资源引用问题 | 检查 AssetBundle 命名设置 |
| **构建超时** | 资源过多或配置问题 | 增加超时时间，优化资源 |
| **内存不足** | 大资源打包 | 增加 JVM 内存，分批次构建 |
| **网络上传失败** | 网络问题或权限不足 | 检查网络连接和权限配置 |
| **版本冲突** | 多版本并存问题 | 清理旧版本，使用唯一版本号 |

### 调试技巧
```groovy
// 1. 启用详细日志
bat """
    "${UNITY_PATH}" -batchmode -logFile "${OUTPUT_PATH}/detailed.log" -projectPath "${PROJECT_PATH}" ...
"""

// 2. 分步调试
stage('调试模式') {
    steps {
        script {
            // 逐步执行，检查每步结果
            echo "当前目录: ${pwd()}"
            echo "Unity路径: ${UNITY_PATH}"
            
            // 手动执行命令测试
            if (params.DEBUG_MODE) {
                input message: '暂停检查，按继续执行', ok: '继续'
            }
        }
    }
}

// 3. 资源检查
def checkResources() {
    echo "检查资源文件..."
    sh "find . -name \"*.prefab\" | wc -l"
    sh "find . -name \"*.png\" | wc -l"
    sh "du -sh Assets/Resources/"
}
```

---

## 十、完整工作流示例

### 典型工作流时间线
```
时间线（总时长约 15-30 分钟）：
[00:00] 触发构建 (Git Push/定时/手动)
[00:01] 拉取最新代码
[00:02] 准备构建环境
[00:03] Unity 构建 AssetBundle
[10:00] 生成版本文件和清单
[10:01] 压缩打包
[10:02] 上传到 CDN
[10:03] 自动化测试验证
[10:10] 发送构建通知
[10:15] 清理临时文件
```

### 团队协作流程
```
开发人员 → 提交代码到 Git → 触发 Jenkins 构建 → 自动打包 AB 包 → 
          ↓                                          ↓
    本地验证 ←─── 下载测试包 ←─── 上传到测试环境 ←─── 测试通过
          ↓                                          ↓
    修复问题                                        生产发布
```

通过这个完整的 Jenkins + Unity AB 打包方案，你可以实现：
1. **自动化构建** - 无需人工干预
2. **版本管理** - 清晰的版本追踪
3. **质量控制** - 自动化测试验证
4. **高效分发** - 快速部署到 CDN
5. **团队协作** - 统一的构建流程
