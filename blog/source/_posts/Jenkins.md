### **Jenkins 简介**
Jenkins 是一个开源的 **持续集成和持续交付 (CI/CD)** 工具，用于自动化构建、测试和部署软件项目。它支持多种编程语言、版本控制系统（如 Git、SVN）和构建工具（如 Maven、Gradle）。

---

## **1. Jenkins 安装**
### **(1) Windows 安装**
1. **下载 Jenkins**：
   - 官网下载地址：[https://www.jenkins.io/download/](https://www.jenkins.io/download/)
   - 选择 **Windows 版本（.msi 安装包）**。

2. **运行安装程序**：
   - 双击 `.msi` 文件，按向导安装。
   - 默认端口：`8080`（可修改）。

3. **启动 Jenkins**：
   - 安装完成后，访问 `http://localhost:8080`。
   - 首次启动需要输入 **初始管理员密码**（在日志或 `C:\Program Files\Jenkins\secrets\initialAdminPassword` 中查找）。

4. **安装推荐插件**：
   - 选择 **"Install suggested plugins"**（推荐）。
   - 等待插件安装完成。

5. **创建管理员账户**：
   - 设置用户名、密码和邮箱。

---

### **(2) Linux/macOS 安装**
#### **方法 1：使用 Docker（推荐）**
```bash
docker run -d -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```
访问 `http://localhost:8080` 进行初始化。

#### **方法 2：直接安装（Ubuntu/Debian）**
```bash
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins
sudo systemctl start jenkins
```
访问 `http://localhost:8080`。

---

## **2. Jenkins 基本配置**
### **(1) 管理插件**
1. **进入插件管理**：
   - **Dashboard → Manage Jenkins → Manage Plugins**。
2. **安装常用插件**：
   - **Git**（用于代码拉取）
   - **Pipeline**（定义 CI/CD 流程）
   - **Docker**（用于容器化构建）
   - **Blue Ocean**（可视化流水线）

### **(2) 配置全局工具**
1. **进入全局工具配置**：
   - **Dashboard → Manage Jenkins → Global Tool Configuration**。
2. **配置 JDK、Maven、Git**：
   - 指定路径或自动安装。

---

## **3. Jenkins 创建第一个 Job**
### **(1) 自由风格项目（Freestyle Project）**
1. **新建 Job**：
   - **Dashboard → New Item → Freestyle project**。
2. **配置 Git 仓库**：
   - **Source Code Management → Git**，输入仓库 URL。
3. **设置构建触发器**：
   - **Poll SCM**（定时检查代码更新）。
   - **GitHub Webhook**（代码提交后自动触发）。
4. **添加构建步骤**：
   - **Execute shell**（Linux）或 **Execute Windows batch command**（Windows）：
     ```bash
     echo "Building..."
     mvn clean package
     ```
5. **保存并运行**：
   - 点击 **Build Now** 手动触发构建。

### **(2) 使用 Pipeline（推荐）**
1. **新建 Pipeline Job**：
   - **New Item → Pipeline**。
2. **编写 Jenkinsfile**（示例）：
   ```groovy
   pipeline {
       agent any
       stages {
           stage('Build') {
               steps {
                   sh 'mvn clean package'
               }
           }
           stage('Test') {
               steps {
                   sh 'mvn test'
               }
           }
           stage('Deploy') {
               steps {
                   sh 'scp target/*.jar user@server:/path/'
               }
           }
       }
   }
   ```
3. **保存并运行**：
   - 代码提交后自动触发 Pipeline。

---

## **4. Jenkins 集成 GitHub/GitLab**
### **(1) GitHub Webhook 自动触发**
1. **在 GitHub 仓库设置 Webhook**：
   - **Settings → Webhooks → Add webhook**。
   - Payload URL: `http://<你的Jenkins服务器>/github-webhook/`。
2. **在 Jenkins 配置 GitHub 插件**：
   - **Manage Jenkins → Configure System → GitHub Server**。
   - 添加 GitHub 凭据（Personal Access Token）。

### **(2) GitLab CI/CD 集成**
1. **安装 GitLab 插件**：
   - **Manage Plugins → 搜索 "GitLab"**。
2. **配置 GitLab 连接**：
   - **Manage Jenkins → Configure System → GitLab**。
   - 输入 GitLab URL 和 API Token。

---

## **5. Jenkins 常见问题**
### **(1) Jenkins 启动失败**
- **检查端口冲突**：
  ```bash
  netstat -ano | findstr 8080  # Windows
  sudo lsof -i :8080           # Linux/macOS
  ```
- **修改端口**：
  ```bash
  sudo nano /etc/default/jenkins  # 修改 HTTP_PORT
  sudo systemctl restart jenkins
  ```

### **(2) 插件安装失败**
- **更换镜像源**：
  - **Manage Jenkins → Manage Plugins → Advanced**。
  - 修改 Update Site 为：
    ```
    https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json
    ```

### **(3) 构建失败排查**
- **查看控制台日志**：
  - 进入构建详情 → **Console Output**。
- **检查环境变量**：
  - `echo $PATH`（Linux）或 `echo %PATH%`（Windows）。

---

## **6. Jenkins 进阶功能**
| 功能 | 说明 |
|------|------|
| **分布式构建** | 使用 Agent 节点分担主节点压力 |
| **Blue Ocean** | 可视化 Pipeline 编辑 |
| **Docker 集成** | 在容器中运行构建 |
| **Kubernetes 插件** | 动态创建 Pod 运行 Job |

---

## **7. 学习资源**
- **官方文档**：[https://www.jenkins.io/doc/](https://www.jenkins.io/doc/)
- **中文社区**：[https://jenkins-zh.cn/](https://jenkins-zh.cn/)
- **实战课程**：
  - Udemy: [Jenkins CI/CD Pipeline](https://www.udemy.com/course/jenkins-from-zero-to-hero/)
  - B站：搜索 "Jenkins 教程"

---

### **总结**
- Jenkins 是强大的 CI/CD 工具，支持自动化构建、测试和部署。
- 推荐使用 **Pipeline + Docker** 实现现代化 DevOps 流程。
- 遇到问题可查看 **日志** 或 **社区** 寻求帮助。

如果有具体问题（如 Jenkinsfile 编写、插件配置），可以进一步讨论！ 🚀
