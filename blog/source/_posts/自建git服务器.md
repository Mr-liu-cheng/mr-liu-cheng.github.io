---
title: 自建git服务器
date: 2025-01-08 16:14:15
updated: 2025-01-08 16:14:15
tags: git
categories: git
keywords:
description: 自建 Git 服务器是一种很好的方式，可以控制代码托管、提升安全性，并满足定制化需求。以下是详细的自建服务器步骤，包括两种常用方法：使用专业 Git 管理平台（如 GitLab/Gitea）和简单搭建裸仓库。
---

自建 Git 服务器是一种很好的方式，可以控制代码托管、提升安全性，并满足定制化需求。以下是详细的自建服务器步骤，包括两种常用方法：使用专业 Git 管理平台（如 GitLab/Gitea）和简单搭建裸仓库。

>为什么使用自建服务器

1. 安全性和隐私

   - 代码存储在公司或组织内部，不会暴露到公网上。

2. 成本考虑

   - 自建服务器无需支付第三方托管平台（如 GitHub、GitLab.com）的订阅费用。

3. 定制化需求

   - 可以根据团队需要调整服务配置，例如自定义权限、专属插件等。

4. 局域网环境

   - 如果服务器部署在内网，访问速度更快，适合没有外网需求的项目。
------------------------------------------------------------

## **方案 1：使用 GitLab/Gitea 搭建服务器**

### **1. 环境准备**

1. **硬件要求**
   
   - 一台服务器（物理机或云服务器），推荐配置：
     - **GitLab**：
       - CPU：双核及以上。
       - 内存：4GB 及以上。
       - 磁盘：100GB（视代码量增加）。
     - **Gitea**：
       - CPU：单核即可。
       - 内存：512MB~1GB。
       - 磁盘：10GB（小型项目）。
   - **操作系统**：Ubuntu、CentOS、Debian 或 Windows Server。
2. **网络环境**
   
   - 固定的局域网或公网 IP 地址。
   - 开放必要的端口（如 HTTP 的 `80` 或 `8989`）。

---

### **2. 搭建 GitLab**

1. **安装依赖**
   
   - 以 Ubuntu 为例：
     ```bash
     sudo apt update
     sudo apt install -y curl openssh-server ca-certificates
     sudo apt install -y tzdata
     ```
2. **下载 GitLab 安装包**
   
   - 添加 GitLab 仓库：
     ```bash
     curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | sudo bash
     ```
   - 安装 GitLab 社区版（免费）：
     ```bash
     sudo EXTERNAL_URL="http://<your_server_ip>" apt install gitlab-ee
     ```
3. **配置 GitLab**
   
   - 修改配置文件 `/etc/gitlab/gitlab.rb`：
     ```plaintext
     external_url 'http://<your_server_ip>:8989'
     ```
   - 重新加载配置：
     ```bash
     sudo gitlab-ctl reconfigure
     ```
4. **访问 GitLab**
   
   - 打开浏览器访问 `http://<your_server_ip>:8989`，完成初始化设置。

---

### **3. 搭建 Gitea**

1. **安装依赖**
   
   - Ubuntu 为例：
     ```bash
     sudo apt update
     sudo apt install -y git sqlite3
     ```
2. **下载并运行 Gitea**
   
   - 下载 Gitea：
     ```bash
     wget -O gitea https://dl.gitea.io/gitea/1.20.3/gitea-1.20.3-linux-amd64
     chmod +x gitea
     ```
   - 创建运行目录：
     ```bash
     sudo mkdir -p /var/lib/gitea/{custom,data,log}
     sudo chown -R git:git /var/lib/gitea
     sudo chmod -R 750 /var/lib/gitea
     ```
   - 启动 Gitea：
     ```bash
     ./gitea web
     ```
3. **访问 Gitea**
   
   - 打开浏览器访问 `http://<your_server_ip>:3000`，进行初始设置。

---

### **4. 配置用户和权限**

- 添加团队成员账号。
- 配置项目组和分支权限。
- 使用 HTTPS 或 SSH 进行安全访问。

---

## **方案 2：搭建裸仓库（适合小型团队）**

### **1. 创建裸仓库**

- 在服务器上初始化一个裸仓库（无工作区，专供远程管理）。
  ```bash
  mkdir -p /srv/git/myproject.git
  cd /srv/git/myproject.git
  git init --bare
  ```

### **2. 配置访问权限**

- 添加用户账号（如 `git` 用户）：
  ```bash
  sudo adduser git
  ```
- 修改仓库权限：
  ```bash
  sudo chown -R git:git /srv/git/myproject.git
  chmod -R 755 /srv/git/myproject.git
  ```

### **3. 提供远程访问**

1. **通过 SSH 访问**
   
   - 用户需要将 SSH 公钥上传到服务器。
   - 示例克隆命令：
     ```bash
     git clone git@<your_server_ip>:/srv/git/myproject.git
     ```
2. **通过 HTTP/HTTPS 访问**
   
   - 配置 Apache/Nginx 提供 HTTP 访问：
     - Nginx 示例：
       ```nginx
       server {
           listen 80;
           server_name <your_server_ip>;
       
           location /myproject.git {
               root /srv/git;
               git_http_backend;
           }
       }
       ```
   - 克隆示例：
     ```bash
     git clone http://<your_server_ip>/myproject.git
     ```

---

## **如何选择方案**

| 特点               | GitLab                      | Gitea                       | 裸仓库                |
|--------------------|-----------------------------|-----------------------------|-----------------------|
| **功能**           | 全功能：代码审查、CI/CD     | 轻量：代码管理为主          | 基本：代码托管         |
| **部署难度**       | 较高                        | 低                          | 非常低                |
| **团队规模**       | 大型团队                    | 中小型团队                  | 小型团队或个人         |
| **性能需求**       | 高                          | 低                          | 极低                  |
| **自定义能力**     | 高                          | 中                          | 低                    |

---

## **后续管理与优化**

1. **备份**
   
   - 定期备份 Git 数据库（GitLab 提供工具，裸仓库可用 `rsync`）。
2. **安全**
   
   - 配置防火墙（如 `ufw`）和 SSH 密钥登录。
   - 如果需要外网访问，配置 HTTPS。
3. **扩展功能**
   
   - 在 GitLab/Gitea 中启用 Webhooks，集成自动化流程（如代码测试、部署）。

---

如果你不确定如何选择或具体操作细节，可以告诉我你的团队规模和需求，我可以给出更适合的建议！

