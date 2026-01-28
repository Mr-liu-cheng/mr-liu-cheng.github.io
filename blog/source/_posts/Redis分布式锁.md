---
title: Redis分布式锁
date: 2026-01-28 12:06:02
updated: 2026-01-28 12:06:02
tags: 分布式锁.,Redis
categories: 网络编程
keywords: 分布式锁.,Redis
description: 
---
# Redis 详解：从入门到精通

## 一、Redis 到底是什么？

**一句话定义**：Redis（Remote Dictionary Server）是一个**超高性能的内存数据库**，同时支持数据持久化。

**通俗比喻**：
- **传统数据库（MySQL）** = 图书馆（数据在硬盘，找书慢但容量大）
- **Redis** = 你的办公桌（数据在内存，随手就拿，但桌子大小有限）

---

## 二、Redis 的核心特点

### 1. **内存存储 - 极速读写**
```python
# 对比测试：Redis vs MySQL
MySQL读取: 5-10毫秒  # 需要磁盘I/O
Redis读取: 0.1毫秒    # 内存直接访问，快50-100倍！
```

### 2. **丰富的数据结构**
不只是简单的 key-value，还有：
- 字符串（String）
- 哈希表（Hash）
- 列表（List）
- 集合（Set）
- 有序集合（Sorted Set）
- 等等...

### 3. **持久化可选**
```
内存数据 → 定期保存到磁盘 → 重启后可以恢复
```

### 4. **单线程架构**
```
一个线程处理所有请求 → 无锁竞争 → 超高并发性能
（实际是多路复用，非多线程）
```

---

## 三、Redis 解决了什么问题？

### 场景1：网站首页加载慢
```sql
-- 传统方案：每次访问都要查数据库
SELECT * FROM products WHERE featured = 1;  -- 耗时50ms
SELECT * FROM articles ORDER BY create_time DESC LIMIT 10;  -- 耗时30ms
-- 总耗时：80ms，QPS=12（每秒处理12个请求）
```

```python
# Redis方案：缓存查询结果
import redis

r = redis.Redis(host='localhost', port=6379)

def get_homepage_data():
    # 先查Redis缓存（0.5ms）
    cached = r.get('homepage:data')
    if cached:
        return json.loads(cached)  # 缓存命中，直接返回
    
    # 缓存未命中，查数据库
    data = query_database()  # 耗时80ms
    # 存入缓存，下次直接用
    r.setex('homepage:data', 300, json.dumps(data))  # 缓存5分钟
    return data
# 结果：80ms → 0.5ms，性能提升160倍！
```

### 场景2：秒杀系统崩溃
```
传统架构：
10万人同时抢1000件商品 → 所有请求打到数据库 → 数据库连接池耗尽 → 系统崩溃
```

```
Redis架构：
1. 商品库存预加载到Redis：SET seckill:stock:1001 1000
2. 用户请求到达：
   DECR seckill:stock:1001  # Redis原子操作，线程安全
   # 返回结果：999（成功）或 -1（库存不足）
3. 异步同步到数据库
结果：支持10万QPS，系统稳定
```

---

## 四、Redis 的 7 大核心作用

### 1. **缓存系统（最主要用途）**
```python
# 多级缓存架构
┌─────────┐   ┌─────────┐   ┌─────────┐
│ 浏览器  │ → │ CDN缓存 │ → │ Nginx   │
│  缓存   │   │         │   │ 缓存    │
└─────────┘   └─────────┘   └─────────┘
                    ↓
              ┌─────────┐   ┌─────────┐
              │ Redis   │ → │ 数据库  │
              │ 缓存    │   │         │
              └─────────┘   └─────────┘

# 缓存策略示例
def get_user_profile(user_id):
    cache_key = f"user:profile:{user_id}"
    
    # 1. 先查Redis
    data = redis_client.get(cache_key)
    if data:
        return json.loads(data)
    
    # 2. Redis没有，查数据库
    data = db.query("SELECT * FROM users WHERE id = %s", user_id)
    
    # 3. 写入Redis（设置过期时间，避免缓存雪崩）
    redis_client.setex(cache_key, 3600, json.dumps(data))  # 缓存1小时
    
    return data
```

### 2. **会话存储（Session Store）**
```python
# 传统Session问题：单机存储，负载均衡后丢失
# Redis解决方案：集中式Session存储

from flask import Flask, session
from flask_session import RedisSessionInterface

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_REDIS'] = redis.Redis(host='redis-cluster')

# 用户登录
@app.route('/login')
def login():
    session['user_id'] = 123
    session['username'] = '张三'
    # 实际存储到Redis：SETEX session:abc123 3600 {...}
    return '登录成功'

# 任何服务器都能读取
@app.route('/profile')
def profile():
    user_id = session.get('user_id')  # 从Redis读取
    return f'用户ID: {user_id}'
```

### 3. **实时排行榜**
```redis
# 游戏积分排行榜
ZADD game:leaderboard 5000 "player:001"
ZADD game:leaderboard 4800 "player:002"
ZADD game:leaderboard 5200 "player:003"

# 获取前10名
ZREVRANGE game:leaderboard 0 9 WITHSCORES
# 结果：
# 1) "player:003"
# 2) "5200"
# 3) "player:001"
# 4) "5000"

# 获取玩家排名
ZREVRANK game:leaderboard "player:001"  # 返回：1（第二名）

# 实时更新分数
ZINCRBY game:leaderboard 100 "player:002"  # 增加100分
```

### 4. **消息队列**
```python
# 简单的发布订阅系统
import redis

r = redis.Redis()

# 发布者
def publish_order(order_data):
    r.publish('orders', json.dumps(order_data))

# 订阅者
def order_processor():
    pubsub = r.pubsub()
    pubsub.subscribe('orders')
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            order = json.loads(message['data'])
            process_order(order)

# 更专业的队列：使用List
# 生产者
r.lpush('task:queue', 'task_data')

# 消费者（阻塞获取）
while True:
    task = r.brpop('task:queue', timeout=30)  # 阻塞30秒
    if task:
        process_task(task[1])
```

### 5. **分布式锁**
```python
class RedisDistributedLock:
    def __init__(self, redis_client, lock_key, expire_time=30):
        self.redis = redis_client
        self.lock_key = lock_key
        self.expire_time = expire_time
        self.identifier = str(uuid.uuid4())  # 唯一标识
    
    def acquire(self):
        # SET key value NX EX timeout  （原子操作）
        result = self.redis.set(
            self.lock_key,
            self.identifier,
            ex=self.expire_time,
            nx=True  # 仅当key不存在时设置
        )
        return result is True
    
    def release(self):
        # Lua脚本保证原子性：只有锁的持有者才能释放
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        self.redis.eval(script, 1, self.lock_key, self.identifier)

# 使用示例
lock = RedisDistributedLock(redis_client, 'order:create:lock')
if lock.acquire():
    try:
        # 执行需要加锁的操作
        create_order()
    finally:
        lock.release()
```

### 6. **实时计数器**
```python
# 文章阅读量统计
def increment_read_count(article_id):
    # 原子操作，线程安全
    count = redis_client.incr(f'article:reads:{article_id}')
    
    # 每100次阅读同步到数据库
    if count % 100 == 0:
        db.execute(
            "UPDATE articles SET read_count = %s WHERE id = %s",
            count, article_id
        )
    
    return count

# 统计在线用户数
def user_online(user_id):
    # 用户上线
    redis_client.sadd('online:users', user_id)
    redis_client.setex(f'user:online:{user_id}', 300, '1')  # 5分钟超时
    
    # 统计在线人数
    online_count = redis_client.scard('online:users')
    return online_count
```

### 7. **地理空间索引**
```redis
# 存储外卖商家位置
GEOADD delivery:shops 116.397128 39.916527 "shop:001"
GEOADD delivery:shops 116.407526 39.904030 "shop:002"

# 查找附近3公里内的商家
GEORADIUS delivery:shops 116.400000 39.900000 3 km WITHDIST
# 结果：
# 1) 1) "shop:002"
#    2) "1.2345"  # 距离公里数
# 2) 1) "shop:001"
#    2) "2.5678"
```

---

## 五、Redis 数据结构深度解析

### 1. **String（字符串）**
```redis
# 不仅仅是字符串，还能存数字、二进制数据
SET user:1001:name "张三"
SET user:1001:age 25
INCR user:1001:age  # 原子递增 → 26

# 位图（Bitmap）应用：用户签到
SETBIT sign:2024:01 1001 1  # 用户1001在1月1日签到
SETBIT sign:2024:01 1002 1
BITCOUNT sign:2024:01  # 统计1月1日签到人数：2
```

### 2. **Hash（哈希表）**
```redis
# 存储对象
HSET user:1001 name "张三" age 25 city "北京"
HGET user:1001 name  # "张三"
HGETALL user:1001    # 获取所有字段
HINCRBY user:1001 age 1  # 年龄+1

# 对比：String vs Hash
# String方案：SET user:1001 '{"name":"张三","age":25}'（修改需要读取整个对象）
# Hash方案：HSET user:1001 age 26（只修改age字段，更高效）
```

### 3. **List（列表）**
```redis
# 实现消息队列、最新列表
LPUSH news:latest "新闻A"  # 左边插入
LPUSH news:latest "新闻B"
LRANGE news:latest 0 9  # 获取最新10条新闻

# 实现栈或队列
LPUSH task:queue "task1"  # 生产者
RPOP task:queue  # 消费者（队列）
# 或
LPOP task:queue  # 栈
```

### 4. **Set（集合）**
```redis
# 去重集合
SADD user:1001:follows 2001 2002 2003  # 关注列表
SADD user:1002:follows 2001 2003 2004

# 共同关注（交集）
SINTER user:1001:follows user:1002:follows
# 结果：2001, 2003

# 可能认识的人（差集）
SDIFF user:1002:follows user:1001:follows
# 结果：2004
```

### 5. **Sorted Set（有序集合）**
```redis
# 带权重的集合，自动排序
ZADD leaderboard 95 "Alice"
ZADD leaderboard 87 "Bob"
ZADD leaderboard 92 "Charlie"

# 获取排名
ZREVRANGE leaderboard 0 2 WITHSCORES
# 1) "Alice"  2) "95"
# 3) "Charlie" 4) "92"
# 5) "Bob"    6) "87"

# 范围查询：分数80-90的玩家
ZRANGEBYSCORE leaderboard 80 90
```

---

## 六、Redis 架构模式

### 1. **单机模式**
```bash
# 最简单的部署方式
redis-server redis.conf

# 适用场景：开发测试、小流量应用
# 优点：简单、无网络开销
# 缺点：单点故障、容量有限
```

### 2. **主从复制**
```
主节点（可读写） → 复制 → 从节点（只读）
       ↓                     ↓
   写操作                  读操作分流
```
```bash
# 从节点配置
slaveof 192.168.1.100 6379
# 优点：读写分离、数据备份
# 缺点：主节点单点故障
```

### 3. **哨兵模式（Sentinel）**
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Sentinel│     │ Sentinel│     │ Sentinel│
│   集群  │     │   集群  │     │   集群  │
└────┬────┘     └────┬────┘     └────┬────┘
     │监控和自动故障转移│
┌────▼───────────────▼───────────────▼────┐
│        Redis主从集群                   │
│   ┌─────┐          ┌─────┐          │
│   │Master│──复制──▶│Slave1│          │
│   └─────┘          └─────┘          │
│          ▲         ┌─────┐          │
│          └──复制──▶│Slave2│          │
│                   └─────┘          │
└─────────────────────────────────────┘
```

### 4. **集群模式（Cluster）**
```bash
# Redis集群：16384个槽位分散到多个节点
# 自动分片、高可用
redis-cli --cluster create \
  192.168.1.101:6379 \
  192.168.1.102:6379 \
  192.168.1.103:6379 \
  --cluster-replicas 1  # 每个主节点一个从节点

# 数据分布示例：
# 节点1：槽位 0-5460
# 节点2：槽位 5461-10922  
# 节点3：槽位 10923-16383
```

---

## 七、Redis 实战场景

### 场景1：电商商品详情页
```python
class ProductDetailCache:
    def __init__(self):
        self.redis = redis.Redis()
        self.db = Database()
    
    def get_product_detail(self, product_id):
        # 缓存键设计
        cache_key = f"product:detail:{product_id}"
        
        # 1. 查缓存
        data = self.redis.get(cache_key)
        if data:
            return json.loads(data)
        
        # 2. 缓存未命中，构建缓存数据
        product = self.db.get_product(product_id)
        skus = self.db.get_product_skus(product_id)
        comments = self.db.get_product_comments(product_id)
        
        # 组装数据
        detail_data = {
            'product': product,
            'skus': skus,
            'comments': comments
        }
        
        # 3. 异步写入缓存（防止缓存雪崩）
        # 过期时间添加随机值
        expire_time = 300 + random.randint(0, 60)  # 300-360秒
        self.redis.setex(cache_key, expire_time, json.dumps(detail_data))
        
        return detail_data
    
    def update_product_cache(self, product_id):
        # 商品更新时，删除缓存（缓存失效）
        cache_key = f"product:detail:{product_id}"
        self.redis.delete(cache_key)
        # 或更新缓存
        # self.redis.setex(cache_key, 300, new_data)
```

### 场景2：秒杀系统设计
```python
class SeckillSystem:
    def __init__(self):
        self.redis = redis.Redis()
        self.mq = MessageQueue()
    
    def init_seckill(self, seckill_id, stock):
        # 初始化秒杀库存
        stock_key = f"seckill:stock:{seckill_id}"
        self.redis.set(stock_key, stock)
        
        # 用户去重集合（防止重复购买）
        self.redis.delete(f"seckill:users:{seckill_id}")
    
    def seckill_request(self, user_id, seckill_id):
        # 1. 频率限制：1秒内只能请求1次
        rate_key = f"seckill:rate:{user_id}:{seckill_id}"
        if self.redis.exists(rate_key):
            return {"code": 429, "msg": "请求太频繁"}
        self.redis.setex(rate_key, 1, "1")
        
        # 2. 用户去重检查
        users_key = f"seckill:users:{seckill_id}"
        if self.redis.sismember(users_key, user_id):
            return {"code": 400, "msg": "已经参与过"}
        
        # 3. 扣减库存（原子操作）
        stock_key = f"seckill:stock:{seckill_id}"
        remaining = self.redis.decr(stock_key)
        
        if remaining < 0:
            # 库存不足，恢复库存
            self.redis.incr(stock_key)
            return {"code": 400, "msg": "库存不足"}
        
        # 4. 记录用户购买
        self.redis.sadd(users_key, user_id)
        
        # 5. 发送MQ消息，异步创建订单
        order_data = {
            "user_id": user_id,
            "seckill_id": seckill_id,
            "time": time.time()
        }
        self.mq.send("seckill_orders", order_data)
        
        return {"code": 200, "msg": "秒杀成功"}
```

### 场景3：实时在线人数统计
```python
class OnlineUserTracker:
    def __init__(self):
        self.redis = redis.Redis()
    
    def user_online(self, user_id):
        # 用户上线
        now = int(time.time())
        
        # 方法1：使用Sorted Set记录用户最后活跃时间
        self.redis.zadd('online:users', {user_id: now})
        
        # 方法2：使用Hash记录详细信息
        user_key = f'user:online:{user_id}'
        self.redis.hset(user_key, 'last_seen', now)
        self.redis.hset(user_key, 'ip', request_ip)
        self.redis.expire(user_key, 3600)  # 1小时过期
    
    def get_online_count(self):
        # 获取5分钟内在线的用户数
        five_min_ago = int(time.time()) - 300
        count = self.redis.zcount('online:users', five_min_ago, '+inf')
        return count
    
    def get_online_users(self):
        # 获取在线用户列表
        five_min_ago = int(time.time()) - 300
        users = self.redis.zrangebyscore('online:users', five_min_ago, '+inf')
        return users
    
    def cleanup_offline_users(self):
        # 清理24小时未活动的用户
        one_day_ago = int(time.time()) - 86400
        self.redis.zremrangebyscore('online:users', '-inf', one_day_ago)
```

---

## 八、Redis 常见问题与解决方案

### 1. **缓存穿透**
```
问题：查询不存在的数据 → 缓存不命中 → 一直查数据库
示例：恶意请求查询 user:999999（不存在）
```

**解决方案**：
```python
def get_user(user_id):
    cache_key = f"user:{user_id}"
    
    # 1. 布隆过滤器预先检查
    if not bloom_filter.exists(user_id):
        return None
    
    # 2. 缓存空值
    data = redis.get(cache_key)
    if data is not None:
        if data == "":  # 空值标记
            return None
        return json.loads(data)
    
    # 3. 查数据库
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    
    if user:
        redis.setex(cache_key, 300, json.dumps(user))
    else:
        # 缓存空值，避免下次再查数据库
        redis.setex(cache_key, 60, "")  # 较短过期时间
    
    return user
```

### 2. **缓存雪崩**
```
问题：大量缓存同时过期 → 所有请求打到数据库 → 数据库崩溃
```

**解决方案**：
```python
# 1. 设置不同的过期时间
def set_cache_with_random_ttl(key, value, base_ttl=300):
    random_ttl = base_ttl + random.randint(-60, 60)
    redis.setex(key, random_ttl, value)

# 2. 热点数据永不过期，后台刷新
def refresh_hot_cache():
    while True:
        data = get_data_from_db()
        redis.set('hot:data', json.dumps(data))
        time.sleep(60)  # 每分钟刷新一次

# 3. 加锁，防止大量并发重建缓存
def get_data_with_lock(key):
    data = redis.get(key)
    if not data:
        lock_key = f"lock:{key}"
        if redis.setnx(lock_key, "1"):  # 获取锁
            redis.expire(lock_key, 10)
            data = get_data_from_db()
            redis.setex(key, 300, data)
            redis.delete(lock_key)
        else:
            # 等待其他线程重建缓存
            time.sleep(0.1)
            return get_data_with_lock(key)  # 重试
    return data
```

### 3. **缓存击穿**
```
问题：热点key过期 → 大量并发请求同时重建缓存 → 数据库压力剧增
```

**解决方案**：
```python
def get_hot_data(key):
    # 1. 使用互斥锁
    lock_key = f"{key}:lock"
    
    while True:
        data = redis.get(key)
        if data:
            return data
        
        # 尝试获取锁
        if redis.setnx(lock_key, "1"):
            redis.expire(lock_key, 10)  # 锁10秒超时
            
            try:
                # 重建缓存
                data = query_database()
                redis.setex(key, 300, data)
                return data
            finally:
                redis.delete(lock_key)
        else:
            # 等待并重试
            time.sleep(0.01)
```

---

## 九、Redis 学习路径

### 初学者（1-2周）
1. **基础概念**：数据类型、基本命令
2. **单机部署**：安装、配置、基础操作
3. **客户端使用**：redis-cli、Python/Java客户端
4. **实战**：实现简单缓存

### 进阶（1-2个月）
1. **高级特性**：事务、Lua脚本、管道
2. **持久化**：RDB、AOF原理与配置
3. **主从复制**：配置与原理
4. **实战**：会话管理、排行榜、计数器

### 高级（3-6个月）
1. **集群架构**：哨兵、Cluster模式
2. **性能优化**：内存优化、持久化调优
3. **高可用设计**：故障转移、数据备份
4. **实战**：设计秒杀系统、消息队列

### 专家级（6个月以上）
1. **源码阅读**：理解Redis内部实现
2. **定制开发**：开发Redis模块
3. **大规模运维**：监控、告警、调优
4. **多语言客户端开发**：了解协议实现

---

## 十、Redis 适用与不适用场景

### ✅ **适合使用 Redis 的场景**：
1. **缓存系统**：热点数据、会话缓存
2. **实时统计**：计数器、排行榜、在线人数
3. **消息系统**：简单消息队列、发布订阅
4. **分布式锁**：跨进程/服务同步
5. **去重系统**：UV统计、用户签到
6. **地理信息**：附近的人、地点搜索

### ❌ **不适合 Redis 的场景**：
1. **海量数据存储**：数据量远超内存容量
2. **复杂查询**：需要多表关联、复杂条件查询
3. **强一致性要求**：Redis主从异步复制
4. **大数据分析**：不适合批量数据分析
5. **持久化为主**：数据安全要求极高，应以数据库为主

---

## 总结

**Redis 的核心价值**：
- ⚡ **性能**：内存操作，微秒级响应
- 🎯 **多样性**：丰富数据结构，解决各种问题
- 🔧 **灵活性**：缓存、队列、锁、统计等一应俱全
- 📈 **可扩展性**：集群模式支持水平扩展

**现代架构中的定位**：
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    应用层        │    │    缓存层        │    │    存储层        │
│   (业务逻辑)    │───▶│   (Redis)       │───▶│   (MySQL/等)   │
│                 │    │ 快速响应         │    │ 持久化存储       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**一句话记忆**：Redis 是**内存中的数据结构服务器**，用**空间换时间**，让应用飞起来！
