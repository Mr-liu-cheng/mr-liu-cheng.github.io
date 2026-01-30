---
title: 游戏微服务的部署与Docker化实践
date: 2026-01-30 10:28:46
updated: 2026-01-30 10:28:46
tags: [微服务,Docker]
categories: [网络编程,微服务,Docker]
keywords: 分布式
description:
---

# 游戏微服务的部署与Docker化实践

我将详细讲解如何将游戏微服务进行Docker化，并使用编排工具进行部署管理。

## 一、Docker化基础

### 1. 为什么需要Docker化？

对于游戏微服务架构，Docker提供了：

- **环境一致性**：开发、测试、生产环境完全一致
- **快速部署**：秒级启动，分钟级全集群部署
- **资源隔离**：CPU、内存、网络、磁盘隔离
- **弹性伸缩**：根据负载快速扩缩容
- **版本管理**：镜像版本控制，轻松回滚

### 2. 游戏服务Docker化的挑战

```
挑战：
1. 网络延迟敏感（特别是战斗服务）
2. 长连接管理（网关服务）
3. 状态服务（需要持久化数据）
4. 高性能要求（需要接近裸机性能）
```

## 二、Dockerfile最佳实践

### 1. 多阶段构建示例

```dockerfile
# Dockerfile.activity
# 第一阶段：构建阶段
FROM golang:1.21-alpine AS builder

# 设置编译环境
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -o activity-service \
    ./cmd/server

# 第二阶段：运行阶段
FROM alpine:3.18

# 安装必要的运行时依赖
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    curl \
    && update-ca-certificates

# 创建非root用户
RUN addgroup -g 1001 -S gamesvr && \
    adduser -u 1001 -S gamesvr -G gamesvr

# 设置工作目录
WORKDIR /app

# 从构建阶段复制可执行文件
COPY --from=builder --chown=gamesvr:gamesvr /app/activity-service .
COPY --from=builder --chown=gamesvr:gamesvr /app/configs ./configs
COPY --from=builder --chown=gamesvr:gamesvr /app/scripts/entrypoint.sh .

# 设置权限
RUN chmod +x activity-service entrypoint.sh

# 切换到非root用户
USER gamesvr

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 暴露端口
EXPOSE 8080 50051

# 启动命令
ENTRYPOINT ["./entrypoint.sh"]
```

### 2. 不同类型服务的Dockerfile差异

```dockerfile
# 网关服务（需要优化网络性能）
FROM golang:1.21-alpine AS builder
# 网关需要CGO支持epoll等系统调用
RUN apk add --no-cache gcc musl-dev linux-headers
ENV CGO_ENABLED=1
...
```

### 3. 基础镜像优化

```dockerfile
# 使用distroless镜像（更安全、更小）
FROM gcr.io/distroless/static-debian11

# 或者使用scratch镜像（最小化）
FROM scratch
COPY --from=builder /app/activity-service /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
```

## 三、Docker Compose本地开发环境

### 1. 完整的游戏开发环境编排

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 基础设施服务
  zookeeper:
    image: zookeeper:3.8
    container_name: game-zookeeper
    restart: unless-stopped
    ports:
      - "2181:2181"
    environment:
      ZOO_MY_ID: 1
    volumes:
      - zookeeper_data:/data
      - zookeeper_datalog:/datalog
    networks:
      - game-network

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: game-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    networks:
      - game-network

  redis-cluster:
    image: bitnami/redis-cluster:7.0
    container_name: game-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
      - "16379:16379"
    environment:
      - REDIS_PASSWORD=game_redis_pass
      - REDIS_NODES=redis-cluster
      - REDIS_CLUSTER_REPLICAS=1
    volumes:
      - redis_data:/bitnami/redis/data
    networks:
      - game-network
    command: >
      /opt/bitnami/scripts/redis-cluster/entrypoint.sh
      /opt/bitnami/scripts/redis-cluster/run.sh

  mysql:
    image: mysql:8.0
    container_name: game-mysql
    restart: unless-stopped
    command: 
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: game_root_pass
      MYSQL_DATABASE: game_platform
      MYSQL_USER: game_user
      MYSQL_PASSWORD: game_user_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - game-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  nacos:
    image: nacos/nacos-server:v2.2.3
    container_name: game-nacos
    restart: unless-stopped
    environment:
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=mysql
      - MYSQL_SERVICE_HOST=mysql
      - MYSQL_SERVICE_DB_NAME=nacos_config
      - MYSQL_SERVICE_PORT=3306
      - MYSQL_SERVICE_USER=game_user
      - MYSQL_SERVICE_PASSWORD=game_user_pass
      - NACOS_AUTH_ENABLE=true
      - NACOS_AUTH_USERNAME=nacos
      - NACOS_AUTH_PASSWORD=nacos
    ports:
      - "8848:8848"
      - "9848:9848"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - nacos_data:/home/nacos/data
    networks:
      - game-network

  # 游戏业务服务
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile.dev
    container_name: game-gateway
    restart: unless-stopped
    ports:
      - "8000:8000"    # WebSocket端口
      - "8001:8001"    # HTTP端口
      - "9000:9000"    # 管理端口
    environment:
      - APP_PROFILE=dev
      - NACOS_HOST=nacos
      - NACOS_PORT=8848
      - REDIS_HOST=redis-cluster
      - REDIS_PORT=6379
    volumes:
      - ./gateway:/app
      - /app/node_modules
    depends_on:
      - nacos
      - redis-cluster
    networks:
      - game-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  activity-service:
    build:
      context: ./activity-service
      dockerfile: Dockerfile.dev
    container_name: game-activity
    restart: unless-stopped
    ports:
      - "50051:50051"
      - "8081:8080"
    environment:
      - APP_PROFILE=dev
      - NACOS_HOST=nacos
      - NACOS_PORT=8848
      - DB_HOST=mysql
      - DB_PORT=3306
      - REDIS_HOST=redis-cluster
      - KAFKA_HOST=kafka
    volumes:
      - ./activity-service:/app
    depends_on:
      - nacos
      - mysql
      - redis-cluster
      - kafka
    networks:
      - game-network

  matching-service:
    build:
      context: ./matching-service
      dockerfile: Dockerfile.dev
    container_name: game-matching
    restart: unless-stopped
    environment:
      - APP_PROFILE=dev
      - NACOS_HOST=nacos
    depends_on:
      - nacos
    networks:
      - game-network

  # 监控与日志
  prometheus:
    image: prom/prometheus:latest
    container_name: game-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - game-network

  grafana:
    image: grafana/grafana:latest
    container_name: game-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    networks:
      - game-network

  loki:
    image: grafana/loki:2.8.0
    container_name: game-loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki
      - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml
    networks:
      - game-network

  promtail:
    image: grafana/promtail:2.8.0
    container_name: game-promtail
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./monitoring/promtail-config.yaml:/etc/promtail/config.yaml
      - ./activity-service/logs:/var/log/activity-service
      - ./gateway/logs:/var/log/gateway
    command:
      - -config.file=/etc/promtail/config.yaml
    depends_on:
      - loki
    networks:
      - game-network

networks:
  game-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1

volumes:
  zookeeper_data:
  zookeeper_datalog:
  kafka_data:
  redis_data:
  mysql_data:
  nacos_data:
  prometheus_data:
  grafana_data:
  loki_data:
```

### 2. 开发环境启动脚本

```bash
#!/bin/bash
# start-dev.sh

set -e

echo "🚀 启动游戏开发环境..."

# 1. 检查环境
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 请先安装Docker Compose"
    exit 1
fi

# 2. 创建必要的目录
mkdir -p logs/{gateway,activity,matching}
mkdir -p data/{mysql,redis,kafka}

# 3. 设置环境变量
export COMPOSE_PROJECT_NAME=game_dev
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

# 4. 构建并启动服务
echo "📦 构建Docker镜像..."
docker-compose build --parallel --compress

echo "🚢 启动服务..."
docker-compose up -d

# 5. 等待服务启动
echo "⏳ 等待服务就绪..."
sleep 10

# 6. 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 7. 输出访问信息
echo ""
echo "✅ 开发环境启动完成！"
echo "========================"
echo "🌐 访问地址："
echo "网关服务：      ws://localhost:8000"
echo "Nacos配置中心： http://localhost:8848/nacos (账号: nacos/nacos)"
echo "Grafana监控：   http://localhost:3000 (账号: admin/admin)"
echo "Prometheus：    http://localhost:9090"
echo ""
echo "📝 常用命令："
echo "查看日志：      docker-compose logs -f [服务名]"
echo "重启服务：      docker-compose restart [服务名]"
echo "停止环境：      docker-compose down"
echo "重建服务：      docker-compose up -d --build [服务名]"
```

## 四、生产环境Kubernetes部署

### 1. Kubernetes部署文件结构

```
k8s/
├── base/                    # 基础配置
│   ├── namespace.yaml
│   ├── configmap-base.yaml
│   └── secrets-base.yaml
├── overlays/               # 环境配置
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── configmap-env.yaml
│   │   └── deployment-patch.yaml
│   ├── staging/
│   └── prod/
├── services/              # 服务定义
│   ├── activity/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── pdb.yaml
│   ├── gateway/
│   └── matching/
├── infrastructure/        # 基础设施
│   ├── redis-cluster/
│   ├── mysql/
│   └── kafka/
└── monitoring/           # 监控
    ├── prometheus/
    └── grafana/
```

### 2. 生产环境部署配置

```yaml
# k8s/services/activity/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: activity-service
  namespace: game-prod
  labels:
    app: activity-service
    component: game-backend
    tier: business
spec:
  replicas: 3
  revisionHistoryLimit: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: activity-service
  template:
    metadata:
      labels:
        app: activity-service
        version: v1.2.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      # 亲和性配置 - 打散部署
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - activity-service
              topologyKey: kubernetes.io/hostname
      
      # 节点选择器 - 选择高性能节点
      nodeSelector:
        node-type: game-server
      
      # 优先级
      priorityClassName: high-priority
      
      containers:
      - name: activity-service
        image: registry.game.com/activity-service:v1.2.0
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: grpc
          containerPort: 50051
          protocol: TCP
        
        # 资源限制
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        
        # 环境变量
        env:
        - name: APP_PROFILE
          value: "prod"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        
        # 配置通过ConfigMap挂载
        envFrom:
        - configMapRef:
            name: game-activity-config
        - secretRef:
            name: game-db-secret
        
        # 配置文件挂载
        volumeMounts:
        - name: config-volume
          mountPath: /app/configs
          readOnly: true
        - name: logs-volume
          mountPath: /app/logs
        
        # 健康检查
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        
        # 生命周期钩子
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 30"]
        
        # 安全上下文
        securityContext:
          runAsUser: 1001
          runAsGroup: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        
        # 日志收集
        args:
        - "--log.format=json"
        - "--log.level=info"
      
      # 初始化容器
      initContainers:
      - name: init-config
        image: busybox:1.28
        command: ['sh', '-c', 'cp /app/config-templates/* /app/configs/']
        volumeMounts:
        - name: config-template-volume
          mountPath: /app/config-templates
        - name: config-volume
          mountPath: /app/configs
      
      # 卷定义
      volumes:
      - name: config-template-volume
        configMap:
          name: activity-config-template
      - name: config-volume
        emptyDir: {}
      - name: logs-volume
        emptyDir: {}
      
      # 服务账户
      serviceAccountName: game-service-account
      
      # DNS配置
      dnsConfig:
        options:
        - name: ndots
          value: "2"
        - name: single-request-reopen
```

```yaml
# k8s/services/activity/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: activity-service
  namespace: game-prod
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
    prometheus.io/scrape: "true"
spec:
  selector:
    app: activity-service
  ports:
  - name: http
    port: 8080
    targetPort: 8080
    protocol: TCP
  - name: grpc
    port: 50051
    targetPort: 50051
    protocol: TCP
  - name: metrics
    port: 9100
    targetPort: 9100
    protocol: TCP
  type: ClusterIP
  sessionAffinity: None
```

```yaml
# k8s/services/activity/hpa.yaml - 水平自动扩缩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: activity-service-hpa
  namespace: game-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: activity-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: active_connections
      target:
        type: AverageValue
        averageValue: 5000
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
```

### 3. 游戏专用优化配置

```yaml
# k8s/optimizations/game-optimization.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: game-kernel-params
  namespace: kube-system
data:
  99-game-optimizations.conf: |
    # 网络优化
    net.core.rmem_max = 134217728
    net.core.wmem_max = 134217728
    net.ipv4.tcp_rmem = 4096 87380 134217728
    net.ipv4.tcp_wmem = 4096 65536 134217728
    net.ipv4.tcp_congestion_control = bbr
    net.ipv4.tcp_tw_reuse = 1
    net.ipv4.tcp_fin_timeout = 30
    
    # 文件描述符
    fs.file-max = 1000000
    fs.nr_open = 1000000
    
    # 连接跟踪
    net.netfilter.nf_conntrack_max = 1048576
    net.nf_conntrack_max = 1048576
---
apiVersion: v1
kind: DaemonSet
metadata:
  name: game-optimizer
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: game-optimizer
  template:
    metadata:
      labels:
        name: game-optimizer
    spec:
      hostNetwork: true
      containers:
      - name: optimizer
        image: busybox:1.28
        command: ["/bin/sh", "-c"]
        args:
          - |
            # 应用内核参数
            sysctl -p /etc/sysctl.d/99-game-optimizations.conf
            # 持续运行
            tail -f /dev/null
        volumeMounts:
        - name: sysctl-conf
          mountPath: /etc/sysctl.d
        securityContext:
          privileged: true
      volumes:
      - name: sysctl-conf
        configMap:
          name: game-kernel-params
      tolerations:
      - operator: Exists
```

## 五、CI/CD流水线配置

### 1. GitLab CI/CD示例

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - scan
  - deploy-dev
  - deploy-staging
  - deploy-prod

variables:
  DOCKER_HOST: tcp://docker:2375
  DOCKER_TLS_CERTDIR: ""
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

# 服务特定配置
.activity-service: &activity-service
  variables:
    SERVICE_NAME: activity-service
    DOCKERFILE_PATH: Dockerfile
  before_script:
    - echo "Building $SERVICE_NAME"
  after_script:
    - echo "Cleanup..."

# 1. 单元测试
unit-test:
  stage: test
  script:
    - go test ./... -v -coverprofile=coverage.out
    - go tool cover -func=coverage.out
  artifacts:
    paths:
      - coverage.out
    reports:
      cobertura: coverage.xml
  only:
    - merge_requests
    - main
    - develop

# 2. 代码扫描
code-quality:
  stage: scan
  image: sonarsource/sonar-scanner-cli:latest
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: "0"
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  allow_failure: true

# 3. 构建Docker镜像
build-activity-service:
  <<: *activity-service
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    # 登录镜像仓库
    - echo "$CI_REGISTRY_PASSWORD" | docker login $CI_REGISTRY -u $CI_REGISTRY_USER --password-stdin
    
    # 构建镜像
    - docker build \
        --build-arg VERSION=$CI_COMMIT_SHORT_SHA \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        -t $IMAGE_TAG \
        -f $DOCKERFILE_PATH .
    
    # 安全扫描
    - docker scan --accept-license --exclude-base $IMAGE_TAG || true
    
    # 推送镜像
    - docker push $IMAGE_TAG
    
    # 标记为latest（仅main分支）
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        docker tag $IMAGE_TAG $CI_REGISTRY_IMAGE:latest
        docker push $CI_REGISTRY_IMAGE:latest
      fi
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json

# 4. 部署到开发环境
deploy-dev:
  stage: deploy-dev
  image: bitnami/kubectl:latest
  environment:
    name: development
    url: https://dev.game.com
  script:
    - |
      kubectl config use-context dev-cluster
      kubectl set image deployment/activity-service \
        activity-service=$IMAGE_TAG \
        -n game-dev
      kubectl rollout status deployment/activity-service -n game-dev
  only:
    - develop

# 5. 部署到生产环境
deploy-prod:
  stage: deploy-prod
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://game.com
  script:
    - |
      # 使用Kustomize部署
      kubectl config use-context prod-cluster
      cd k8s/overlays/prod
      kustomize edit set image activity-service=$IMAGE_TAG
      kubectl apply -k .
      
      # 蓝绿部署验证
      kubectl rollout status deployment/activity-service -n game-prod --timeout=300s
      
      # 健康检查
      ./scripts/health-check.sh
  only:
    - main
  when: manual
  dependencies:
    - build-activity-service
```

### 2. 部署验证脚本

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

SERVICE_NAME="activity-service"
NAMESPACE="game-prod"
TIMEOUT=300
INTERVAL=10

echo "🔍 开始健康检查 $SERVICE_NAME..."

# 1. 检查Pod状态
echo "检查Pod状态..."
end=$((SECONDS+TIMEOUT))
while [ $SECONDS -lt $end ]; do
    READY=$(kubectl get deployment $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
    DESIRED=$(kubectl get deployment $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.status.replicas}')
    
    if [ "$READY" == "$DESIRED" ] && [ "$READY" != "0" ]; then
        echo "✅ Pod全部就绪 ($READY/$DESIRED)"
        break
    fi
    
    echo "等待Pod就绪 ($READY/$DESIRED)..."
    sleep $INTERVAL
done

if [ "$READY" != "$DESIRED" ]; then
    echo "❌ Pod未在规定时间内就绪"
    exit 1
fi

# 2. 获取服务端点
ENDPOINT=$(kubectl get svc $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
HTTP_PORT=$(kubectl get svc $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="http")].port}')

# 3. 检查HTTP健康端点
echo "检查HTTP健康端点..."
if curl -f http://$ENDPOINT:$HTTP_PORT/health; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    exit 1
fi

# 4. 检查gRPC健康状态
echo "检查gRPC健康状态..."
GRPC_PORT=$(kubectl get svc $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="grpc")].port}')

# 使用grpc_health_probe
if ./bin/grpc_health_probe -addr=$ENDPOINT:$GRPC_PORT; then
    echo "✅ gRPC健康检查通过"
else
    echo "❌ gRPC健康检查失败"
    exit 1
fi

# 5. 性能基准测试
echo "运行性能基准测试..."
ab -n 1000 -c 100 http://$ENDPOINT:$HTTP_PORT/metrics > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 性能基准测试通过"
else
    echo "⚠️  性能基准测试警告"
fi

echo "🎉 $SERVICE_NAME 部署验证完成"
```

## 六、监控与日志收集

### 1. Docker日志配置

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3",
    "labels": "service_name,environment",
    "tag": "{{.ImageName}}|{{.Name}}|{{.ID}}"
  }
}
```

### 2. 结构化日志输出

```go
// 在Go服务中使用结构化日志
import "github.com/sirupsen/logrus"

func initLogger() *logrus.Logger {
    logger := logrus.New()
    
    if env.IsProduction() {
        logger.SetFormatter(&logrus.JSONFormatter{
            TimestampFormat: "2006-01-02T15:04:05.999Z07:00",
            FieldMap: logrus.FieldMap{
                logrus.FieldKeyTime:  "@timestamp",
                logrus.FieldKeyLevel: "level",
                logrus.FieldKeyMsg:   "message",
                logrus.FieldKeyFunc:  "function",
            },
        })
    }
    
    return logger
}

// 使用示例
logger.WithFields(logrus.Fields{
    "service":    "activity-service",
    "user_id":     userID,
    "activity_id": activityID,
    "duration_ms": duration.Milliseconds(),
    "trace_id":    traceID,
}).Info("User joined activity")
```

## 七、最佳实践总结

### 1. 镜像优化
- 使用多阶段构建减小镜像大小
- 使用Alpine或distroless基础镜像
- 移除调试工具和包管理器

### 2. 安全强化
- 使用非root用户运行容器
- 设置只读根文件系统
- 移除不必要的Linux capabilities
- 扫描镜像中的安全漏洞

### 3. 性能优化
- 设置合理的CPU和内存限制
- 使用本地SSD存储关键数据
- 优化网络配置（TCP参数调整）
- 合理设置健康检查间隔

### 4. 可观测性
- 所有服务暴露/metrics端点
- 结构化日志输出JSON格式
- 分布式追踪集成
- 业务指标埋点

### 5. 游戏服务特殊考虑
- 长连接服务的优雅终止
- 状态服务的持久化存储
- 战斗服务的低延迟要求
- 网关服务的连接管理

通过以上Docker化和部署实践，可以构建一个稳定、可扩展、易维护的游戏微服务架构。
