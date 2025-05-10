### **Jenkins 游戏打包部署流程（以 Unity 游戏为例）**
以下是使用 Jenkins 自动化构建和部署 Unity 游戏的完整流程，涵盖 **代码拉取、Unity 打包、测试、部署到服务器** 等关键步骤。

---

## **1. 环境准备**
| 工具/环境 | 说明 |
|-----------|------|
| **Jenkins** | 主 CI/CD 服务器 |
| **Unity** | 安装 Unity Hub 和指定版本 Unity Editor |
| **Git** | 版本控制（GitHub/GitLab） |
| **构建节点** | Windows/Linux 代理机（用于 Unity 打包） |
| **部署目标** | FTP/SSH/云存储（如阿里云 OSS） |

---

## **2. Jenkins 配置**
### **(1) 安装必要插件**
- **Git Plugin**（拉取代码）
- **Unity3d Plugin**（Unity 构建支持）
- **Pipeline**（定义 CI/CD 流程）
- **Publish Over SSH**（远程部署）
- **Email Extension**（构建通知）

### **(2) 配置 Unity 环境**
1. **在 Jenkins 全局工具中配置 Unity**：
   - **Manage Jenkins → Global Tool Configuration**  
   - 指定 Unity 安装路径（如 `C:\Program Files\Unity\Hub\Editor\2021.3.0f1\Editor\Unity.exe`）

2. **添加 Unity License**：
   - 在构建节点上提前激活 Unity 许可证（命令行或手动激活）。

---

## **3. 创建 Jenkins Pipeline**
在项目根目录创建 **`Jenkinsfile`**，定义构建流程：

```groovy
pipeline {
    agent any

    environment {
        UNITY_PATH = "C:/Program Files/Unity/Hub/Editor/2021.3.0f1/Editor/Unity.exe" // Windows
        // UNITY_PATH = "/Applications/Unity/Hub/Editor/2021.3.0f1/Unity.app/Contents/MacOS/Unity" // macOS
        BUILD_TARGET = "Win64" // 可选：Win64、Android、iOS、WebGL
        OUTPUT_DIR = "build/${BUILD_TARGET}"
    }

    stages {
        // 阶段 1：拉取代码
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-game-repo.git'
            }
        }

        // 阶段 2：Unity 打包
        stage('Build') {
            steps {
                script {
                    // 清理旧构建
                    bat "rmdir /s /q ${OUTPUT_DIR}"  // Windows
                    // sh "rm -rf ${OUTPUT_DIR}"    // Linux/macOS

                    // 执行 Unity 打包命令
                    bat """
                        "${UNITY_PATH}" \
                        -batchmode \
                        -nographics \
                        -silent-crashes \
                        -logFile "unity-build.log" \
                        -projectPath "." \
                        -buildTarget ${BUILD_TARGET} \
                        -executeMethod BuildScript.PerformBuild \
                        -quit
                    """
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: "${OUTPUT_DIR}/**/*"
                }
                failure {
                    emailext body: 'Unity 构建失败，请检查日志！', subject: 'Jenkins 构建失败', to: 'team@example.com'
                }
            }
        }

        // 阶段 3：测试（可选）
        stage('Test') {
            steps {
                // 运行单元测试或自动化测试
                bat "nunit-console Tests/bin/Debug/Tests.dll"
            }
        }

        // 阶段 4：部署到服务器
        stage('Deploy') {
            steps {
                script {
                    // 方式 1：通过 SSH 上传到游戏服务器
                    sshPublisher(
                        publishers: [
                            sshPublisherDesc(
                                configName: 'game-server',
                                transfers: [
                                    sshTransfer(
                                        sourceFiles: "${OUTPUT_DIR}/**",
                                        remoteDirectory: "/var/www/game",
                                        execCommand: "chmod -R 755 /var/www/game"
                                    )
                                ]
                            )
                        ]
                    )

                    // 方式 2：上传到云存储（如阿里云 OSS）
                    withCredentials([usernamePassword(credentialsId: 'oss-credentials', usernameVariable: 'OSS_KEY', passwordVariable: 'OSS_SECRET')]) {
                        sh """
                            aliyun oss cp ${OUTPUT_DIR} oss://your-bucket/game/ --recursive \
                            --access-key-id ${OSS_KEY} \
                            --access-key-secret ${OSS_SECRET}
                        """
                    }
                }
            }
        }
    }
}
```

---

## **4. Unity 构建脚本**
在 Unity 项目中创建 **`BuildScript.cs`**（放在 `Assets/Editor/` 目录下）：
```csharp
using UnityEditor;
using System.IO;

public static class BuildScript
{
    public static void PerformBuild()
    {
        string outputDir = Path.Combine(Directory.GetCurrentDirectory(), "build/" + EditorUserBuildSettings.activeBuildTarget);
        if (!Directory.Exists(outputDir))
            Directory.CreateDirectory(outputDir);

        BuildPipeline.BuildPlayer(
            scenes: EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray(),
            locationPathName: Path.Combine(outputDir, "Game.exe"),  // Windows
            target: EditorUserBuildSettings.activeBuildTarget,
            options: BuildOptions.None
        );
    }
}
```

---

## **5. 触发构建**
### **(1) 手动触发**
- 在 Jenkins 界面点击 **Build Now**。

### **(2) 自动触发（Git Webhook）**
1. **在 GitHub/GitLab 设置 Webhook**：
   - Payload URL: `http://<JENKINS_IP>/github-webhook/`
2. **在 Jenkins 配置触发器**：
   - **Build Triggers → GitHub hook trigger for GITScm polling**。

---

## **6. 常见问题**
| 问题 | 解决方案 |
|------|----------|
| **Unity 打包失败** | 检查 `unity-build.log`，确保 License 已激活 |
| **构建节点无 Unity** | 在 Agent 节点安装 Unity Editor |
| **SSH 部署失败** | 检查 Jenkins 的 Publish Over SSH 插件配置 |
| **Android/iOS 打包问题** | 配置 JDK/NDK/Xcode 环境 |

---

## **7. 优化建议**
1. **使用 Docker 镜像**：
   - 预装 Unity 的 Docker 镜像（如 `unityci/editor`）可避免环境问题。
   ```groovy
   agent {
       docker {
           image 'unityci/editor:2021.3.0f1-android-1.0.0'
           args '-v /tmp:/tmp'
       }
   }
   ```
2. **并行构建多平台**：
   - 使用 `parallel` 阶段同时构建 Win/Android/iOS。
3. **存档 APK/IPA**：
   - 使用 `archiveArtifacts` 保存构建产物。

---

## **8. 最终效果**
- **代码提交 → 自动触发 Jenkins → Unity 打包 → 测试 → 部署到服务器**  
- **团队收到构建成功/失败邮件通知**  

如果有具体需求（如 Android 签名、iOS 证书配置），可以进一步调整流程！ 🎮
