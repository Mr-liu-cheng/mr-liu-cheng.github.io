---
title: Harbor-企业级容器镜像仓库
date: 2026-01-29 12:06:02
updated: 2026-01-29 12:06:02
tags: [Harbor,镜像]
categories: Harbor
keywords: Harbor,镜像仓库
description: 
---

# Harbor 详解：企业级容器镜像仓库

## 一、Harbor 是什么？

### 1. **官方定义 vs 通俗理解**

**官方定义：**
> Harbor 是一个**企业级的容器镜像仓库**，提供镜像的存储、分发、安全扫描、漏洞分析、签名验证、复制和管理功能。

**通俗比喻：**

| 概念 | 类比 | 说明 |
|------|------|------|
| **GitHub** | **代码图书馆** | 存放源代码的地方 |
| **Docker Hub** | **公共应用商店** | 所有人都能下载的免费软件 |
| **Harbor** | **企业私有仓库** | 公司内部的私有软件仓库 |
| **镜像** | **软件安装包** | 包含完整运行环境的软件包 |

**更形象的比喻：**
```
你的公司需要管理各种软件：
- 公共软件（如 Office、Chrome）→ Docker Hub（公共镜像）
- 公司内部软件（自研系统、内部工具）→ Harbor（私有镜像）
- 带敏感信息的软件（数据库、财务系统）→ Harbor + 安全控制
```

### 2. **Harbor 的核心定位**

```
Harbor = Docker Registry 增强版 + 企业级功能
        （基础镜像存储）   （安全+管理+高可用）
```

---

## 二、为什么需要 Harbor？Docker Hub 不够用吗？

### 对比表：Docker Hub vs Harbor

| 特性 | Docker Hub（公共） | Harbor（私有） | 企业需求 |
|------|-------------------|---------------|---------|
| **隐私性** | ❌ 公共或有限私有 | ✅ 完全私有 | 保护商业机密 |
| **安全性** | ⭐ 基础扫描 | ⭐⭐⭐ 深度扫描+策略 | 安全合规 |
| **控制权** | ⭐ 有限控制 | ⭐⭐⭐ 完全控制 | 自主管理 |
| **网络速度** | ⭐ 依赖外网 | ⭐⭐⭐ 内网高速 | 快速部署 |
| **成本** | 💰 免费+付费套餐 | 🆓 开源免费 | 成本控制 |
| **高可用** | ✅ 但不可控 | ✅ 自主部署 | 业务连续性 |
| **定制化** | ❌ 不可定制 | ✅ 完全定制 | 符合企业流程 |
| **数据主权** | ❌ 数据在国外 | ✅ 数据在企业内部 | 数据合规 |

### 实际场景对比

```bash
# 场景1：使用 Docker Hub（问题示例）
docker pull mysql:8.0              # ✅ 可以，但：
1. 从国外下载，速度慢
2. 无法控制版本更新
3. 可能有安全漏洞
4. 公司审计无法追踪

# 场景2：使用 Harbor（解决方案）
docker pull harbor.mycompany.com/library/mysql:8.0
# ✅ 好处：
# 1. 内网下载，秒级完成
# 2. 经过安全扫描的版本
# 3. 版本更新受控
# 4. 完整的操作日志
```

---

## 三、Harbor 的核心功能架构

### 1. **整体架构图**

```
┌─────────────────────────────────────────────────────────┐
│                     Harbor 服务集群                        │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  Core   │  │ Registry│  │ Job     │  │ Portal  │  │
│  │ 服务     │  │ 服务     │  │ 服务     │  │ Web界面  │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                 存储后端                          │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │  │
│  │  │ 文件│  │ S3  │  │ GCS │  │ Swift│            │  │
│  │  │系统 │  │     │  │     │  │      │            │  │
│  │  └─────┘  └─────┘  └─────┘  └─────┘            │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. **八大核心功能模块**

#### **功能1：镜像存储与分发（基础）**
```
作用：安全地存储和管理 Docker 镜像
场景：
- 开发者 push 新版本的镜像
- 测试环境 pull 镜像进行测试
- 生产环境部署时快速拉取
```

#### **功能2：镜像安全扫描（核心）**
```
扫描引擎：Trivy、Clair、Anchore
扫描内容：
1. OS 包漏洞（CVE 数据库）
2. 应用依赖漏洞（npm, pip, maven）
3. 配置安全问题
4. 许可证合规检查

示例：推送镜像后的自动扫描
```
```bash
# 推送镜像到 Harbor
docker push harbor.mycompany.com/myapp:v1.0

# Harbor 自动执行：
1. 下载最新 CVE 数据库
2. 扫描镜像每一层
3. 生成漏洞报告
4. 根据策略决定是否阻止部署
```

#### **功能3：镜像签名与验证**
```
作用：确保镜像来源可信，防止篡改
流程：
开发者 → 签名镜像 → 推送到 Harbor → 验证签名 → 部署

实现：Notary 服务（TUF 框架）
```

#### **功能4：多租户与权限控制**
```
企业组织结构：
公司（Organization）
├── 研发部（Projects）
│   ├── 前端组（frontend-team）→ 读写权限
│   ├── 后端组（backend-team）→ 读写权限
│   └── 测试组（qa-team）→ 只读权限
├── 运维部（Projects）
│   └── 基础设施组（infra-team）→ 管理员权限
└── 外部合作伙伴（Projects）
    └── 供应商（vendor）→ 受限访问权限
```

#### **功能5：镜像复制与同步**
```
场景：多数据中心、混合云部署

北京数据中心 ←─镜像复制─→ 上海数据中心
      ↓                          ↓
  生产环境                     灾备环境

配置方式：
1. 基于策略的复制（定时/实时）
2. 过滤规则（只复制特定标签）
3. 带宽控制
```

#### **功能6：垃圾回收**
```
问题：镜像被删除后，底层数据仍占用空间
解决：Harbor 自动清理未被引用的数据层

示例：镜像 myapp:v1.0 和 myapp:v2.0 共享基础层
删除 v1.0 → 只删除独有层，共享层保留
```

#### **功能7：Webhook 与集成**
```
触发事件：镜像推送、扫描完成、复制完成
目标系统：Jenkins、K8s、监控系统、通知系统

示例流程：
1. 镜像推送到 Harbor
2. Harbor 触发 Webhook
3. Jenkins 收到通知，开始部署
4. 发送部署结果到 Slack
```

#### **功能8：审计日志**
```
记录所有操作：
- 谁（用户/机器人）
- 什么时候（时间戳）
- 做了什么（操作类型）
- 对什么资源（镜像/项目）

合规要求：满足 SOC2、ISO27001 等审计要求
```

---

## 四、企业使用 Harbor 的完整工作流

### 场景：电商公司的容器化部署流程

```mermaid
graph TD
    A[开发完成代码] --> B[Git提交触发CI]
    B --> C[Jenkins构建镜像]
    C --> D[推送到Harbor]
    D --> E[Harbor自动安全扫描]
    E --> F{扫描通过?}
    F -->|是| G[标记为可部署]
    F -->|否| H[通知开发修复]
    G --> I[同步到生产Harbor]
    I --> J[K8s拉取镜像部署]
    J --> K[监控运行状态]
```

### 详细步骤说明：

#### **步骤1：开发与构建**
```bash
# Jenkins Pipeline 片段
stage('Build and Push to Harbor') {
    steps {
        script {
            // 1. 构建镜像
            docker.build("myapp:${BUILD_NUMBER}")
            
            // 2. 打上 Harbor 标签
            docker.tag(
                "myapp:${BUILD_NUMBER}", 
                "harbor.mycompany.com/dev/myapp:${BUILD_NUMBER}"
            )
            
            // 3. 登录 Harbor
            withCredentials([usernamePassword(
                credentialsId: 'harbor-dev',
                usernameVariable: 'HARBOR_USER',
                passwordVariable: 'HARBOR_PASS'
            )]) {
                sh """
                    docker login harbor.mycompany.com \
                    -u ${HARBOR_USER} \
                    -p ${HARBOR_PASS}
                """
            }
            
            // 4. 推送到 Harbor
            docker.push("harbor.mycompany.com/dev/myapp:${BUILD_NUMBER}")
        }
    }
}
```

#### **步骤2：安全扫描与审批**
```
Harbor Web 界面显示：
=================================
镜像：harbor.mycompany.com/dev/myapp:123
安全状态：⚠️ 有风险
漏洞统计：
- 高危：2个
- 中危：5个
- 低危：12个

详细漏洞：
1. CVE-2023-1234（高危）
   - 影响：openssl 版本 < 1.1.1t
   - 修复：升级到 openssl 1.1.1u
   - 所在层：base layer

2. CVE-2023-5678（中危）
   - 影响：python 3.9 漏洞
   - 修复：升级到 python 3.9.16
   - 所在层：dependency layer
=================================

操作：❌ 阻止推送到生产环境
```

#### **步骤3：镜像晋级流程**
```yaml
# Harbor 镜像晋级策略配置
version: 1.0
rules:
  - name: "开发到测试晋级"
    source_project: "dev"
    target_project: "test"
    conditions:
      - type: "vulnerability"
        severity: "high"
        max_count: 0      # 不允许有高危漏洞
      - type: "vulnerability"  
        severity: "medium"
        max_count: 3      # 中危漏洞不超过3个
      - type: "signature"
        required: true    # 必须签名
    actions:
      - type: "replication"
        trigger: "manual" # 手动触发
        override: true    # 覆盖目标镜像
  
  - name: "测试到生产晋级"
    source_project: "test"
    target_project: "prod"
    conditions:
      - type: "vulnerability"
        severity: "high,medium"
        max_count: 0      # 不允许有高中危漏洞
      - type: "approval"
        required: true    # 需要人工审批
      - type: "test_result"
        required: true    # 需要测试报告
```

#### **步骤4：生产环境部署**
```bash
# K8s 部署配置使用 Harbor 镜像
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      imagePullSecrets:
      - name: harbor-pull-secret  # Harbor 访问凭证
      containers:
      - name: myapp
        image: harbor.mycompany.com/prod/myapp:v1.2.3  # Harbor 镜像
        ports:
        - containerPort: 8080
```

---

## 五、Harbor 在企业中的实际应用场景

### 场景1：金融行业 - 安全合规

**需求特点：**
- 严格的监管要求（银保监会、证监会）
- 敏感数据不能出境
- 完整的审计追溯
- 强制安全扫描

**Harbor 配置：**
```yaml
# Harbor 安全策略配置
security:
  # 1. 漏洞扫描策略
  scan_on_push: true  # 推送时自动扫描
  severity_threshold: medium  # 中危及以上阻止
  
  # 2. 镜像签名策略
  require_signature: true  # 必须签名
  
  # 3. 内容信任策略
  enable_content_trust: true
  
  # 4. 访问控制
  project_creation_restriction: adminonly  # 只有管理员能创建项目
  
  # 5. 保留策略
  tag_immutability: true  # 生产镜像标签不可变
```

### 场景2：游戏公司 - 全球分发

**需求特点：**
- 全球多个数据中心
- 大镜像文件（游戏客户端）
- 快速部署更新
- 版本灰度发布

**Harbor 配置：**
```yaml
# 多中心复制配置
replication:
  endpoints:
    - name: "beijing-dc"
      url: "https://harbor-bj.mycompany.com"
      credential:
        access_key: "..."
        access_secret: "..."
    
    - name: "shanghai-dc" 
      url: "https://harbor-sh.mycompany.com"
      credential:
        access_key: "..."
        access_secret: "..."
    
    - name: "frankfurt-dc"
      url: "https://harbor-de.mycompany.com"
      credential:
        access_key: "..."
        access_secret: "..."

  policies:
    - name: "prod-replication"
      description: "生产镜像全球同步"
      src_registry: "beijing-dc"
      dest_registry: ["shanghai-dc", "frankfurt-dc"]
      filters:
        - kind: "name"
          value: "prod/.*"  # 只复制生产环境的镜像
        - kind: "tag"
          value: "v[0-9]+.*"  # 只复制版本标签
      trigger:
        type: "event_based"  # 事件触发
        trigger_settings:
          cron: ""  # 不设置定时，实时复制
      deletion: false  # 不删除目标镜像
      override: true  # 覆盖目标镜像
      enabled: true
```

### 场景3：制造业 - 边缘计算

**需求特点：**
- 工厂环境网络不稳定
- 设备资源有限
- 离线部署需求
- 版本一致性要求

**解决方案：**
```
中心 Harbor（总部）
    ↓ 镜像同步
边缘 Harbor（工厂1）  边缘 Harbor（工厂2）  边缘 Harbor（工厂3）
    ↓                    ↓                    ↓
生产线设备          生产线设备          生产线设备

特点：
1. 中心统一管理所有镜像
2. 边缘缓存常用镜像
3. 网络断开时仍可部署
4. 统一的版本控制
```

---

## 六、Harbor 部署架构

### 1. **单机部署（小型企业）**
```
单台服务器：
┌─────────────────────────────────┐
│         Harbor 单节点             │
│  ┌─────────────────────────┐   │
│  │  Nginx（反向代理）        │   │
│  ├─────────────────────────┤   │
│  │  Harbor Core           │   │
│  ├─────────────────────────┤   │
│  │  Registry              │   │
│  ├─────────────────────────┤   │
│  │  PostgreSQL（数据库）    │   │
│  ├─────────────────────────┤   │
│  │  Redis（缓存）          │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 2. **高可用部署（中大型企业）**
```
多节点集群：
┌─────────────────────────────────────────────────┐
│                负载均衡器（HAProxy/Nginx）         │
├──────────────┬──────────────┬──────────────┤
│  Harbor节点1  │  Harbor节点2  │  Harbor节点3  │
│              │              │              │
├──────────────┼──────────────┼──────────────┤
│  共享存储      │  共享存储      │  共享存储      │
│ （Ceph/S3）   │ （Ceph/S3）   │ （Ceph/S3）   │
└──────────────┴──────────────┴──────────────┘
              │
        ┌─────┴─────┐
        │  外部数据库 │
        │  PostgreSQL│
        │  集群      │
        └───────────┘
```

### 3. **部署配置示例**

```yaml
# harbor.yml - Harbor 配置文件
hostname: harbor.mycompany.com

# HTTP 配置
http:
  port: 80

# HTTPS 配置（生产环境必须）
https:
  port: 443
  certificate: /data/cert/server.crt
  private_key: /data/cert/server.key

# 数据库配置
database:
  password: "root123"
  max_idle_conns: 50
  max_open_conns: 100

# 数据存储配置
data_volume: /data

# 存储后端（支持多种）
storage_service:
  # 文件系统存储（默认）
  filesystem:
    rootdirectory: /data/registry
  
  # S3 兼容存储
  s3:
    region: us-east-1
    bucket: my-harbor-bucket
    accesskey: AKIAIOSFODNN7EXAMPLE
    secretkey: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    secure: true
    v4auth: true
    chunksize: 5242880
    rootdirectory: /harbor

# 复制配置
replication:
  # 启用复制功能
  enabled: true
  
# 漏洞扫描
trivy:
  # 使用 Trivy 作为扫描器
  enabled: true
  ignore_unfixed: false
  severity: high,medium,low
  skip_update: false
  offline_scan: false

# 通知配置
notification:
  webhook_job_max_retry: 3
  
# 日志配置
log:
  level: info
  rotate_count: 50
  rotate_size: 200M
  location: /var/log/harbor
```

---

## 七、Harbor 与其他工具集成

### 1. **与 Kubernetes 集成**

```bash
# 在 K8s 中创建 Harbor 访问凭证
kubectl create secret docker-registry harbor-secret \
  --docker-server=harbor.mycompany.com \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --docker-email=admin@mycompany.com \
  -n production

# K8s 部署配置中使用
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      imagePullSecrets:
      - name: harbor-secret
      containers:
      - name: app
        image: harbor.mycompany.com/prod/myapp:v1.0
```

### 2. **与 Jenkins 集成**

```groovy
// Jenkinsfile 中使用 Harbor
pipeline {
    environment {
        HARBOR_URL = 'harbor.mycompany.com'
        HARBOR_PROJECT = 'dev'
    }
    
    stages {
        stage('Build and Push') {
            steps {
                script {
                    // 构建镜像
                    docker.build("${HARBOR_URL}/${HARBOR_PROJECT}/myapp:${BUILD_NUMBER}")
                    
                    // 使用 Jenkins Credentials 登录 Harbor
                    withCredentials([usernamePassword(
                        credentialsId: 'harbor-credentials',
                        usernameVariable: 'HARBOR_USER',
                        passwordVariable: 'HARBOR_PASS'
                    )]) {
                        sh """
                            docker login ${HARBOR_URL} \
                                -u ${HARBOR_USER} \
                                -p ${HARBOR_PASS}
                        """
                    }
                    
                    // 推送镜像
                    docker.push("${HARBOR_URL}/${HARBOR_PROJECT}/myapp:${BUILD_NUMBER}")
                }
            }
        }
        
        stage('Wait for Security Scan') {
            steps {
                // 等待 Harbor 安全扫描完成
                script {
                    def scanResult = waitForHarborScan(
                        image: "${HARBOR_URL}/${HARBOR_PROJECT}/myapp:${BUILD_NUMBER}",
                        timeout: 300  // 5分钟超时
                    )
                    
                    if (scanResult.vulnerabilities.critical > 0) {
                        error('镜像存在严重漏洞，部署被阻止')
                    }
                }
            }
        }
    }
}
```

### 3. **与 GitLab 集成**

```yaml
# .gitlab-ci.yml
variables:
  HARBOR_URL: "harbor.mycompany.com"
  HARBOR_PROJECT: "ci"

stages:
  - build
  - test
  - push

build-image:
  stage: build
  script:
    - docker build -t ${HARBOR_URL}/${HARBOR_PROJECT}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA} .
    
push-to-harbor:
  stage: push
  script:
    - echo $HARBOR_PASSWORD | docker login ${HARBOR_URL} -u ${HARBOR_USERNAME} --password-stdin
    - docker push ${HARBOR_URL}/${HARBOR_PROJECT}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA}
  only:
    - main
```

---

## 八、Harbor 运维管理

### 1. **监控指标**

**关键监控项：**
```bash
# 1. 存储使用情况
harbor_storage_used_bytes
harbor_storage_available_bytes

# 2. 镜像统计
harbor_project_count
harbor_repository_count
harbor_artifact_count

# 3. 请求性能
harbor_http_request_duration_seconds
harbor_http_requests_total

# 4. 扫描状态
harbor_scan_completed_total
harbor_scan_failed_total
harbor_vulnerability_count

# 5. 复制状态
harbor_replication_tasks_total
harbor_replication_success_total
harbor_replication_failed_total
```

### 2. **备份与恢复**

```bash
# Harbor 备份脚本
#!/bin/bash
BACKUP_DIR="/backup/harbor-$(date +%Y%m%d)"

# 1. 停止 Harbor 服务
docker-compose -f /opt/harbor/docker-compose.yml down

# 2. 备份数据库
pg_dump -h localhost -U postgres registry > ${BACKUP_DIR}/registry.sql
pg_dump -h localhost -U postgres notaryserver > ${BACKUP_DIR}/notaryserver.sql
pg_dump -h localhost -U postgres notarysigner > ${BACKUP_DIR}/notarysigner.sql

# 3. 备份配置文件
cp -r /opt/harbor/harbor.yml ${BACKUP_DIR}/
cp -r /data/secret ${BACKUP_DIR}/

# 4. 备份镜像数据
# 如果使用文件系统存储
cp -r /data/registry ${BACKUP_DIR}/

# 5. 启动 Harbor 服务
docker-compose -f /opt/harbor/docker-compose.yml up -d

# 6. 压缩备份
tar -czf ${BACKUP_DIR}.tar.gz ${BACKUP_DIR}
```

### 3. **性能优化**

```yaml
# Harbor 性能调优配置
# 1. 数据库连接池优化
database:
  max_idle_conns: 100    # 增加空闲连接
  max_open_conns: 200    # 增加最大连接数
  conn_max_lifetime: 300 # 连接最大生命周期（秒）

# 2. Redis 缓存优化
redis:
  # 使用更快的序列化方式
  pool:
    max_active: 200
    max_idle: 50
    idle_timeout: 300

# 3. 调整工作线程数
core:
  workers: 10  # 根据 CPU 核心数调整

# 4. 启用镜像层缓存
proxy:
  cache:
    enabled: true
    expire_hours: 24
```

---

## 九、Harbor vs 其他镜像仓库

### 功能对比表

| 特性 | Harbor | Docker Registry | Nexus | GitLab Registry | JFrog Artifactory |
|------|--------|-----------------|-------|-----------------|-------------------|
| **开源免费** | ✅ | ✅ | ✅ | ✅（内置） | ❌ 商业 |
| **企业级功能** | ✅⭐⭐ | ❌ | ✅⭐ | ✅⭐ | ✅⭐⭐⭐ |
| **安全扫描** | ✅ 内置 | ❌ | ✅ 插件 | ✅ 集成 | ✅ 高级 |
| **镜像签名** | ✅ Notary | ❌ | ❌ | ❌ | ✅ |
| **多租户** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **复制同步** | ✅ | ❌ | ✅ 有限 | ✅ 有限 | ✅ |
| **Web UI** | ✅ 优秀 | ❌ | ✅ | ✅ | ✅ |
| **RBAC** | ✅ 精细 | ❌ | ✅ | ✅ | ✅ |
| **Helm 支持** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **部署复杂度** | 中等 | 简单 | 中等 | 简单 | 复杂 |

### 选型建议

```
选择 Harbor 当：
1. 需要完全开源的解决方案
2. 有严格的安全合规要求
3. 需要多数据中心复制
4. 预算有限但需要企业功能
5. 团队熟悉 Docker 生态

选择其他方案当：
1. 只需要基础镜像存储 → Docker Registry
2. 已经有 GitLab → GitLab Registry
3. 需要全语言包管理 → Nexus/Artifactory
4. 企业级商业支持 → JFrog Artifactory
```

---

## 十、实际案例：大型互联网公司的 Harbor 实践

### 案例背景
- 公司规模：5000+ 员工，200+ 开发团队
- 镜像数量：50,000+ 个镜像
- 日均推送：3000+ 次
- 存储量：50TB+
- 全球部署：5个数据中心

### Harbor 集群架构
```
全局 Harbor 集群：
┌─────────────────────────────────────────────────┐
│               全局管理 Harbor（北京）               │
│                   （只管理元数据）                  │
└─────────────────────────────────────────────────┘
                ↓ 配置同步
┌──────────┬──────────┬──────────┬──────────┐
│ 区域Harbor│ 区域Harbor│ 区域Harbor│ 区域Harbor│
│  北京     │  上海     │  深圳     │  美国     │
└──────────┴──────────┴──────────┴──────────┘
    ↓          ↓          ↓          ↓
  华北业务    华东业务    华南业务    海外业务
```

### 实施效果

**实施前：**
```bash
# 问题清单：
1. 镜像存储在各自团队的服务器上
2. 安全漏洞无法统一管理
3. 镜像版本混乱，回滚困难
4. 跨国部署速度极慢
5. 审计日志不完整
```

**实施后：**
```
✅ 统一管理：所有镜像集中存储
✅ 安全可控：每个镜像都经过安全扫描
✅ 快速部署：区域缓存，秒级拉取
✅ 版本清晰：完整的版本历史和晋级流程
✅ 合规审计：满足各种监管要求
✅ 成本节约：减少重复存储，优化带宽
```

### 关键配置
```yaml
# 大型企业 Harbor 配置要点
deployment:
  mode: cluster  # 集群模式
  replicas: 3    # 每个服务3副本

storage:
  type: s3       # 使用对象存储
  s3:
    endpoint: https://s3.mycompany.com
    bucket: harbor-prod
    encryption: true  # 启用加密

cache:
  redis:
    cluster: true  # Redis 集群模式
    nodes:
      - redis-1:6379
      - redis-2:6379
      - redis-3:6379

scanning:
  concurrency: 10  # 并行扫描数量
  offline_update: true  # 离线更新漏洞库

replication:
  max_concurrency: 5  # 最大并发复制数
```

---

## 总结：Harbor 的核心价值

### 一句话总结
**Harbor 是企业级私有容器镜像仓库，提供安全、可靠、高效的镜像全生命周期管理。**

### 三大核心价值

#### 1. **安全合规价值**
```
输入：不可信的镜像
处理：安全扫描 + 签名验证 + 访问控制
输出：可信的、安全的镜像
结果：降低安全风险，满足合规要求
```

#### 2. **运维管理价值**
```
问题：镜像分散、版本混乱、部署缓慢
方案：集中存储 + 版本管理 + 智能复制
结果：标准化流程，提升部署效率
```

#### 3. **成本控制价值**
```
节省：重复存储、跨境带宽、人工管理
实现：存储优化、区域缓存、自动化流程
效果：降低IT成本，提升资源利用率
```

### 适用场景判断

**应该使用 Harbor 当：**
- ✅ 公司有超过 20 个微服务
- ✅ 需要满足安全合规要求
- ✅ 有多个环境（开发、测试、生产）
- ✅ 团队分布在多个地理位置
- ✅ 需要完整的审计追溯

**可以不用 Harbor 当：**
- ❌ 个人学习或小型项目
- ❌ 只有几个简单的容器应用
- ❌ 不需要安全扫描和签名
- ❌ 所有服务都在单地域部署

**Harbor 不是：**
- ❌ 不是代码仓库（那是 Git）
- ❌ 不是 CI/CD 工具（那是 Jenkins/GitLab CI）
- ❌ 不是容器编排平台（那是 Kubernetes）
- ❌ 不是监控系统（那是 Prometheus）

**Harbor 是：**
- ✅ 容器镜像的"保险库" + "质检中心" + "分发中心"
- ✅ 连接开发（构建）和运维（部署）的关键桥梁
- ✅ 企业容器化转型的基础设施

通过 Harbor，企业可以实现从"能用容器"到"用好容器"的跨越，真正发挥容器技术的全部潜力。
