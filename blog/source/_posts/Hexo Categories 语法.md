---
title: Hexo Categories 语法
date: 2025-05-08 14:16:02
updated: 2025-01-08 14:16:02
tags: Hexo
categories: 
  - [Hexo,Categories]
keywords: Hexo,Categories
description:
---
你提到的困惑很常见，Hexo 的分类嵌套和并列写法在语法上相似，但实际效果完全不同。下面我用具体例子对比说明它们的区别：

---

### **1. 分类层级嵌套（父子关系）**
#### 写法：
```yaml
categories:
  - [GitHub, Actions]  # 方括号表示嵌套
```
#### 效果：
生成 **层级分类**，结构为：  
`GitHub` → `Actions`（即 "GitHub 是父分类，Actions 是子分类"）  
文章会归到 `GitHub/Actions` 下，且自动继承父分类 `GitHub`。

#### 验证方法：
- 在生成的网页中，分类会显示为层级路径（如 `GitHub > Actions`）。
- 访问 `/categories/GitHub/Actions/` 能看到该文章。

---

### **2. 多分类并列（独立关系）**
#### 写法：
```yaml
categories:
  - GitHub   # 无方括号，独立分类
  - Actions  # 无方括号，独立分类
```
#### 效果：
生成 **两个独立分类**：  
- `GitHub`（文章属于此分类）
- `Actions`（文章也属于此分类）  
二者无任何层级关联。

#### 验证方法：
- 网页中会显示两个平级分类标签（如 `GitHub` 和 `Actions`）。
- 访问 `/categories/GitHub/` 和 `/categories/Actions/` 都能看到该文章。

---
核心区别：方括号 `[] 的作用
Hexo 中分类的层级关系完全由 方括号 [] 决定：

带方括号 → 嵌套层级（父子分类）
- [A, B] = 生成 A 为父分类，B 为子分类，路径为 A/B。

不带方括号 → 独立并列分类
- A + - B = 生成两个独立分类 A 和 B，无层级关系。

### **关键区别总结**
| 特性                | 层级嵌套 `[A, B]`       | 多分类并列 `- A` + `- B` |
|---------------------|------------------------|--------------------------|
| **分类结构**         | 父子层级（`A/B`）       | 独立平级                  |
| **文章归属路径**     | 只出现在 `A/B` 下       | 同时出现在 `A` 和 `B` 下  |
| **语法标志**         | 方括号 `[]`             | 无方括号，多行 `-`        |
| **典型用途**         | 组织细分内容（如技术栈） | 文章跨多个主题            |

---

### **你的案例解析**
你原文中的混合写法：
```yaml
categories: 
  - Hexo               # 独立分类
  - [GitHub, Actions]  # 嵌套分类（GitHub/Actions）
  - GitHub             # 独立分类（与嵌套的 GitHub 冲突）
    - Actions          # 语法错误，Hexo 会忽略
```
导致了：
1. 独立分类 `Hexo`。
2. 嵌套分类 `GitHub/Actions`。
3. 重复的独立分类 `GitHub`（与嵌套的父分类冲突）。
4. `- Actions` 因语法错误被忽略。

---

### **正确写法选择**
根据你的需求：
- 如果想将文章归到 `Hexo` 和 `GitHub/Actions` 两个分类下：
  ```yaml
  categories:
    - Hexo
    - [GitHub, Actions]  # 明确层级
  ```
- 如果想归到三个独立分类（不推荐，易混乱）：
  ```yaml
  categories:
    - Hexo
    - GitHub
    - Actions
  ```
