---
title: lua 应用
date: 2025-02-19 11:20:13
updated: 2025-02-19 11:20:13
tags:
categories:
keywords:
description:
---
文档：
- [Luatos](https://wiki.luatos.com/index.html)
- [参考手册](https://wiki.luatos.com/_static/lua53doc/contents.html)

在 Unity 开发中，使用 Lua 进行代码热更新和补丁的方式主要有以下两种：  

### **方式 1：使用 Lua 修复 C# 代码中的 Bug**
这种方式的核心思想是：**让 C# 代码调用 Lua 代码，在 Lua 层修复 Bug，而不需要重新打包整个应用**。

#### **实现流程**
1. **在 C# 代码中预留 Lua 调用入口**
   - 通过 `xlua` 或 `tolua` 框架，在 C# 中加载并执行 Lua 脚本。

2. **在 Lua 中定义修复逻辑**
   - 通过 `xlua.hotfix` 或 `xlua.override` 直接修改 C# 类中的方法（xlua 方式）。
   - 或者让 C# 调用 Lua 中新的修复逻辑，替换原有逻辑（tolua 方式）。

3. **通过服务器下发新的 Lua 脚本**
   - 服务器发布新的修复脚本，并在客户端下载后替换老的 Lua 代码。

4. **应用补丁**
   - 重新加载 Lua 代码，让修复逻辑生效，无需重新编译 C# 代码。

#### **示例代码**
**C# 代码（原始代码存在 Bug）**
```csharp
public class Player
{
    public int GetDamage(int baseDamage)
    {
        // 这里的 Bug 是没有乘以攻击力系数
        return baseDamage;
    }
}
```

**Lua 代码（修复 Bug，使用 xlua.hotfix）**
```lua
xlua.hotfix(CS.Player, "GetDamage", function(self, baseDamage)
    local attackMultiplier = 1.5  -- 假设攻击力系数是 1.5
    return baseDamage * attackMultiplier
end)
```
这样，当 `Player:GetDamage(100)` 被调用时，它会返回 `150` 而不是 `100`。

---

### **方式 2：直接使用 Lua 编写业务逻辑**
这种方式的核心思想是：**游戏的核心逻辑使用 Lua 编写，而 C# 仅作为底层封装，处理 Unity API 调用**。

#### **实现流程**
1. **C# 代码提供 Lua 执行环境**
   - 使用 `xlua` 或 `tolua` 加载 Lua 代码。
   - C# 提供 Lua 需要调用的 API，比如物理、渲染、UI 操作等。

2. **Lua 代码编写业务逻辑**
   - 主要编写游戏核心逻辑，比如角色行为、战斗计算、剧情脚本等。

3. **通过服务器下发 Lua 更新**
   - 服务器发布新的 Lua 逻辑，客户端下载后直接执行。

4. **热更新逻辑**
   - 通过重新加载 Lua 代码，动态修改游戏行为。

#### **示例代码**
**C# 代码（加载 Lua 脚本）**
```csharp
using XLua;
using System.Collections;
using UnityEngine;

public class LuaManager : MonoBehaviour
{
    private LuaEnv luaEnv = new LuaEnv();

    void Start()
    {
        luaEnv.DoString("require 'GameLogic'"); // 加载 Lua 业务逻辑
    }

    void OnDestroy()
    {
        luaEnv.Dispose();
    }
}
```

**Lua 代码（完整的业务逻辑）**
```lua
-- GameLogic.lua
Player = {}

function Player:new(o, name, hp)
    o = o or {}
    setmetatable(o, self)
    self.__index = self
    self.name = name or "Hero"
    self.hp = hp or 100
    return o
end

function Player:TakeDamage(damage)
    self.hp = self.hp - damage
    print(self.name .. " takes " .. damage .. " damage, HP: " .. self.hp)
end

-- 创建角色
hero = Player:new(nil, "Knight", 200)
hero:TakeDamage(30) -- "Knight takes 30 damage, HP: 170"
```

这样，如果后续需要修改 `TakeDamage` 计算规则，只需要热更新 `GameLogic.lua` 文件。

---

### **方式 1 和 方式 2 的区别分析**
|  | **方式 1（修复 C# Bug）** | **方式 2（Lua 业务逻辑）** |
|---|---|---|
| **用途** | 修复 C# 代码中的 Bug | 直接用 Lua 编写游戏逻辑 |
| **修改的灵活性** | 只能修改已有 C# 代码中的 Bug | 可以随时修改游戏玩法 |
| **对 C# 依赖** | 依赖原有 C# 代码 | 业务逻辑完全用 Lua 实现 |
| **性能** | 影响较小，只修复 Bug | 可能影响性能，Lua 运行比 C# 慢 |
| **适用场景** | 小规模 Hotfix，不影响架构 | 需要长期维护、频繁调整的游戏逻辑 |
| **难度** | 简单，使用 `xlua.hotfix` 直接替换 | 复杂，需要设计 Lua 和 C# 交互机制 |

### **优劣分析**
- **方式 1（修复 C# Bug）**
  - ✅ **优点**：改动小，不影响现有架构，热修复成本低。
  - ❌ **缺点**：只能修补 C# 代码，不能改变大的业务逻辑。

- **方式 2（Lua 业务逻辑）**
  - ✅ **优点**：更新灵活，逻辑改动无需重新编译 C#，适合长周期运营的游戏。
  - ❌ **缺点**：Lua 运行效率低于 C#，涉及大量 C# API 时可能有性能问题。

---

### **总结**
- 如果游戏已经完成开发，只是想修复 Bug，而不影响架构，**方式 1（修复 C# Bug）** 是更好的选择。
- 如果游戏逻辑需要频繁调整，比如策划希望快速修改数值、技能逻辑、关卡规则等，**方式 2（Lua 业务逻辑）** 更合适。
- 一些成熟的游戏通常**结合使用**：
  - **C# 处理底层、性能关键的逻辑**。
  - **Lua 负责高层业务逻辑和热更新**。

你更倾向于哪种方式，或者你当前的项目有什么具体需求？




### **如何在 Lua 中调用 Unity API**  
在 Unity 中，Lua 不能直接调用 Unity API，而是需要 C# 提供桥接代码，把 Unity 提供的功能注册到 Lua 环境中。常见的方法有：  

1. **直接映射 C# 类到 Lua（使用 `XLua` 或 `ToLua`）**
2. **通过 C# 提供 Lua 可调用的封装 API**
3. **Lua 调用 C# 事件、协程等功能**

---

## **方法 1：直接映射 C# 类到 Lua**
`XLua` 和 `ToLua` 允许 Lua 直接调用 C# 类，无需手动绑定。例如：  

### **示例：在 Lua 中使用 Unity API 控制 GameObject**
**C# 代码（初始化 Lua 环境）**
```csharp
using UnityEngine;
using XLua;

public class LuaScriptRunner : MonoBehaviour
{
    private LuaEnv luaEnv = new LuaEnv();

    void Start()
    {
        luaEnv.DoString(@"
            local obj = CS.UnityEngine.GameObject('LuaCreatedObject')
            obj.transform.position = CS.UnityEngine.Vector3(1, 2, 3)
            print('GameObject created at:', obj.transform.position)
        ");
    }

    void OnDestroy()
    {
        luaEnv.Dispose();
    }
}
```
**Lua 代码（直接调用 Unity API）**
```lua
local obj = CS.UnityEngine.GameObject("MyObject")
obj.transform.position = CS.UnityEngine.Vector3(1, 2, 3)
```
✅ 这里 `CS.UnityEngine.GameObject` 让 Lua 直接访问 Unity 的 `GameObject` API。

---

## **方法 2：通过 C# 提供 Lua 可调用的封装 API**
有时，我们不想让 Lua 直接访问 Unity API，而是通过 C# 提供更安全的接口。例如：

### **示例：Lua 控制角色移动**
**C# 代码（提供 Lua 可调用的 API）**
```csharp
using UnityEngine;
using XLua;

[LuaCallCSharp]
public class PlayerController : MonoBehaviour
{
    public void Move(Vector3 direction)
    {
        transform.position += direction;
    }
}
```
**Lua 代码（通过封装 API 控制角色）**
```lua
local player = CS.UnityEngine.GameObject.Find("Player"):GetComponent("PlayerController")
player:Move(CS.UnityEngine.Vector3(0, 1, 0)) -- 让角色向上移动 1 单位
```
✅ 这样可以控制哪些 Unity 功能暴露给 Lua，增强安全性。

---

## **方法 3：Lua 调用 C# 事件、协程等**
**示例：在 Lua 中等待 2 秒后执行代码**
**C# 代码（封装协程供 Lua 使用）**
```csharp
using UnityEngine;
using XLua;
using System.Collections;

[LuaCallCSharp]
public class CoroutineHelper : MonoBehaviour
{
    public void StartLuaCoroutine(LuaFunction luaFunc)
    {
        StartCoroutine(RunLuaCoroutine(luaFunc));
    }

    private IEnumerator RunLuaCoroutine(LuaFunction luaFunc)
    {
        yield return new WaitForSeconds(2);
        luaFunc.Call();
    }
}
```
**Lua 代码（使用 C# 协程等待 2 秒）**
```lua
local coroutineHelper = CS.UnityEngine.GameObject.Find("CoroutineHelper"):GetComponent("CoroutineHelper")

coroutineHelper:StartLuaCoroutine(function()
    print("Waited 2 seconds!")
end)
```
✅ 让 Lua 使用 Unity 的协程系统，避免性能问题。

---

## **Lua 在 Unity 中的应用场景**
### 1. **游戏逻辑热更新**
   - 业务逻辑（如技能计算、AI 逻辑）用 Lua 编写，随时热更新，无需重新打包。
   - C# 提供 Lua 执行环境，保障性能关键部分运行稳定。

### 2. **策划配置驱动**
   - 策划用 Lua 编写关卡、技能、任务逻辑。
   - 例如，`QuestSystem.lua` 定义任务逻辑，修改 Lua 文件即可调整任务规则。

### 3. **UI 逻辑**
   - C# 处理 UI 渲染，Lua 负责 UI 交互逻辑。
   - 例如：
     ```lua
     local button = CS.UnityEngine.GameObject.Find("StartButton"):GetComponent("Button")
     button.onClick:AddListener(function() print("Game Start!") end)
     ```

### 4. **AI 行为树**
   - Lua 负责 AI 逻辑，C# 提供行为接口。
   - 例如：
     ```lua
     function Enemy:Update()
         if self.hp < 50 then
             self:Retreat()
         else
             self:Attack()
         end
     end
     ```

### 5. **战斗系统**
   - 服务器下发新的 Lua 脚本，实现技能调整，而不用修改 C# 代码。




# 学习笔记- **点号 (`.`) 和冒号 (`:`)** 的主要区别

在 Lua 里，**点号 (`.`) 和冒号 (`:`)** 的主要区别在于**方法调用时是否隐式传递 `self`**。它们的使用方式如下：

---

## **1. `.`（点号）—— 直接访问表中的字段或函数**
- 适用于**普通函数**，调用时需要**手动传递 `self`（如果需要）**
- 直接访问表中的属性或函数，不自动传递 `self`

### **示例**
```lua
local MyClass = {}

-- 定义一个方法
function MyClass.sayHello(self)
    print("Hello, " .. self.name)
end

-- 创建对象
local obj = { name = "Lua" }
setmetatable(obj, { __index = MyClass })

-- 使用 `.` 访问方法时，需要手动传递 `self`
MyClass.sayHello(obj)  -- ✅ 输出: Hello, Lua
```
**分析**
- `MyClass.sayHello(obj)` 需要**手动传递 `obj`** 作为 `self`。

---

## **2. `:`（冒号）—— 语法糖，自动传递 `self`**
- **方法调用**专用
- `obj:method(...)` 等价于 `obj.method(obj, ...)`
- **自动传递 `self` 参数**

### **示例**
```lua
local MyClass = {}

-- 定义一个方法
function MyClass:sayHello()
    print("Hello, " .. self.name)
end

-- 创建对象
local obj = { name = "Lua" }
setmetatable(obj, { __index = MyClass })

-- 使用 `:` 访问方法，会自动传递 `self`
obj:sayHello()  -- ✅ 输出: Hello, Lua
```
**等价于**
```lua
obj.sayHello(obj)
```
**分析**
- `obj:sayHello()` 自动将 `obj` 作为 `self` 传入，无需手动传递。

---

## **3. 点号 `.` vs. 冒号 `:` 的区别总结**
|  | **点号 `.`** | **冒号 `:`** |
|---|---|---|
| **作用** | 访问表的字段或函数 | 调用方法，并自动传 `self` |
| **是否传 `self`** | 需要手动传递 | 自动传递 |
| **常见错误** | 忘记传 `self`，导致 `nil` 错误 | 不适用于非方法的情况 |
| **示例** | `obj.func(obj, ...)` | `obj:func(...)` (等价于 `obj.func(obj, ...)`) |

---

## **4. 常见错误**
### **❌ 使用 `.` 调用方法但忘记 `self`**
```lua
obj.sayHello()  -- ❌ 报错: attempt to concatenate a nil value
```
**正确做法**
```lua
obj.sayHello(obj)  -- ✅ 手动传递 self
obj:sayHello()  -- ✅ 推荐：用 `:` 语法糖
```

### **❌ 使用 `:` 调用普通函数**
```lua
function greet(name)
    print("Hello, " .. name)
end

greet:("Lua")  -- ❌ 报错: attempt to index a function value
```
**正确做法**
```lua
greet("Lua")  -- ✅
```

---

## **5. 结论**
- **点号 `.`** 用于**普通函数调用**，需要手动传 `self`
- **冒号 `:`** 用于**方法调用**，会自动传 `self`，推荐使用
- **推荐：方法定义时使用 `:`，调用时也使用 `:`，避免 `self` 传递错误**

**✅ 推荐写法**
```lua
function MyClass:sayHello()
    print("Hello, " .. self.name)
end
obj:sayHello()  -- 自动传递 self
```

希望这个解释清楚了 `.` 和 `:` 的区别！😃

# lua 与 C#差异

Lua 和 C# 在语法上的主要区别体现在**变量声明、数据类型、控制流、函数定义、面向对象编程（OOP）、错误处理**等方面。以下是它们的主要差异分析：

---

## **1. 变量与数据类型**
### **Lua**
- **动态类型**（变量的类型由赋值决定）
- **变量不需要声明类型**
- **`nil` 代表未初始化的变量**

```lua
x = 10        -- 自动推断为 number
y = "hello"   -- 自动推断为 string
z = nil       -- nil 表示变量未赋值

print(type(x))  -- 输出: number
print(type(y))  -- 输出: string
print(type(z))  -- 输出: nil
```

### **C#**
- **静态类型**（变量类型必须明确）
- **变量必须声明类型**
- **`null` 代表引用类型未初始化**

```csharp
int x = 10;         // 明确类型
string y = "hello"; // 明确类型
object z = null;    // null 表示引用为空

Console.WriteLine(x.GetType());  // 输出: System.Int32
Console.WriteLine(y.GetType());  // 输出: System.String
Console.WriteLine(z == null);    // 输出: True
```

✅ **区别**：
- Lua **不需要声明变量类型**，C# 需要。
- Lua **变量默认是全局的**（除非加 `local`），C# 变量有作用域控制。

---

## **2. 变量作用域**
### **Lua**
- 默认变量是**全局变量**
- **局部变量**需要 `local` 关键字

```lua
x = 10      -- 全局变量
local y = 20  -- 局部变量

function test()
    local z = 30  -- 局部变量
end
```

### **C#**
- 变量**默认是局部变量**
- 作用域由 `{}` 控制
- `public`、`private` 控制访问权限

```csharp
int x = 10;  // 局部变量

class Example {
    private int y = 20;  // 类的私有变量
}
```

✅ **区别**：
- Lua 默认是**全局变量**，C# 默认是**局部变量**。
- Lua 需要 `local` 声明局部变量，而 C# 直接在方法/类内定义即可。

---

## **3. 控制流**
### **Lua**
- `if` 语句中**必须显式写 `then` 和 `end`**
- `elseif` **是一个单词**
- `for` 语句有**数值 `for` 和泛型 `for`**
- `repeat...until` 类似 `do...while`

```lua
x = 10

if x > 5 then
    print("x 大于 5")
elseif x == 5 then
    print("x 等于 5")
else
    print("x 小于 5")
end
```

### **C#**
- `if` 语句**不需要 `then` 和 `end`**
- `else if` 是**两个单词**
- `for` 语句只能使用索引计数或 `foreach`
- `do...while` 语法与 `while` 类似

```csharp
int x = 10;

if (x > 5) {
    Console.WriteLine("x 大于 5");
} else if (x == 5) {
    Console.WriteLine("x 等于 5");
} else {
    Console.WriteLine("x 小于 5");
}
```

✅ **区别**：
- Lua 需要 `then` 和 `end`，C# 需要 `{}`。
- Lua 用 `elseif`，C# 用 `else if`。

---

## **4. 循环**
### **Lua**
```lua
for i = 1, 5 do
    print(i)
end

-- 泛型 for 遍历表
t = { "A", "B", "C" }
for k, v in ipairs(t) do
    print(k, v)
end
```

### **C#**
```csharp
for (int i = 1; i <= 5; i++) {
    Console.WriteLine(i);
}

// 遍历数组
string[] t = { "A", "B", "C" };
foreach (var item in t) {
    Console.WriteLine(item);
}
```

✅ **区别**：
- Lua `for` 语句用 `do...end`，C# 用 `{}`。
- Lua `for` 可以直接遍历表，C# 使用 `foreach`。

---

## **5. 函数**
### **Lua**
```lua
function add(a, b)
    return a + b
end

print(add(3, 5))  -- 输出: 8
```

### **C#**
```csharp
int Add(int a, int b) {
    return a + b;
}

Console.WriteLine(Add(3, 5));  // 输出: 8
```

✅ **区别**：
- Lua **不需要声明返回值类型**，C# 需要。
- C# **必须写 `return` 类型**，Lua 没有强制要求。

---

## **6. 面向对象**
### **Lua**
- 没有类和对象的原生概念，但可以用 `table` + `metatable` 实现
```lua
Person = {}
Person.__index = Person

function Person:new(name)
    local obj = setmetatable({}, self)
    obj.name = name
    return obj
end

function Person:sayHello()
    print("Hello, my name is " .. self.name)
end

local p = Person:new("Alice")
p:sayHello()  -- 输出: Hello, my name is Alice
```

### **C#**
- 直接支持类和对象
```csharp
class Person {
    public string Name;

    public Person(string name) {
        Name = name;
    }

    public void SayHello() {
        Console.WriteLine("Hello, my name is " + Name);
    }
}

Person p = new Person("Alice");
p.SayHello();  // 输出: Hello, my name is Alice
```

✅ **区别**：
- Lua **没有类**，但可以用 `table` + `metatable` 实现。
- C# 直接支持类，语法更清晰。

---

## **7. 错误处理**
### **Lua**
- 使用 `pcall` 或 `xpcall` 捕获错误
```lua
function errorFunc()
    error("发生错误！")
end

local status, err = pcall(errorFunc)
if not status then
    print("捕获错误：" .. err)
end
```

### **C#**
- 使用 `try-catch` 处理异常
```csharp
try {
    throw new Exception("发生错误！");
} catch (Exception ex) {
    Console.WriteLine("捕获错误：" + ex.Message);
}
```

✅ **区别**：
- Lua 用 `pcall` 进行错误捕获，C# 用 `try-catch`。
- C# 的异常系统更强大，支持不同类型的异常。

---

## **总结**
| **特性** | **Lua** | **C#** |
|---|---|---|
| **类型** | 动态类型 | 静态类型 |
| **变量作用域** | 默认全局，需 `local` | 默认局部 |
| **控制流** | `then...end` 语法 | `{}` 语法 |
| **循环** | `for i = 1, 10 do` | `for (int i = 1; i <= 10; i++)` |
| **函数** | `function f()` | `int Func()` |
| **OOP** | `table` + `metatable` | 直接支持 `class` |
| **错误处理** | `pcall(x)` | `try-catch` |

总的来说，**Lua 更轻量、灵活，C# 更强大、结构化**。


# 正则表达式

Lua 使用 `string.gsub`、`string.find`、`string.match` 等函数支持**模式匹配（Pattern Matching）**，这类似于正则表达式，但 Lua 使用的是**独特的模式匹配规则**，并不完全兼容标准正则表达式。  

---

## **1. 基本字符匹配规则**
Lua 的模式匹配支持以下特殊字符：
| 符号 | 作用 |
|------|------|
| `.`  | 匹配任意单个字符（换行符 `\n` 除外） |
| `%a` | 匹配任意字母（A-Z, a-z） |
| `%d` | 匹配任意数字（0-9） |
| `%l` | 匹配小写字母（a-z） |
| `%u` | 匹配大写字母（A-Z） |
| `%s` | 匹配空白字符（空格、制表符、换行） |
| `%w` | 匹配字母+数字（A-Z, a-z, 0-9） |
| `%x` | 匹配十六进制字符（0-9, A-F, a-f） |
| `%c` | 匹配控制字符（如 `\n`、`\t`） |
| `%p` | 匹配标点符号（如 `.,!?`） |
| `%z` | 匹配 `\0`（null 字符） |
| `%f[set]` | 匹配 `set` 定义的**边界** |

**示例**
```lua
print(string.match("hello 123", "%a+"))  --> hello
print(string.match("hello 123", "%d+"))  --> 123
```

---

## **2. 转义特殊字符**
Lua 使用 `%` 作为转义符，而不是 `\`：
| 符号 | 作用 |
|------|------|
| `%.` | 匹配 `.` |
| `%+` | 匹配 `+` |
| `%*` | 匹配 `*` |
| `%?` | 匹配 `?` |
| `%(`, `%)` | 匹配 `()` |
| `%[` , `%]` | 匹配 `[]` |
| `%^` | 匹配 `^` |
| `%$` | 匹配 `$` |

**示例**
```lua
print(string.match("3+2=5", "%d+%+%d+"))  --> 3+2
```

---

## **3. 量词匹配**
| 量词 | 作用 |
|------|------|
| `+` | **匹配 1 次或多次** |
| `*` | **匹配 0 次或多次** |
| `?` | **匹配 0 次或 1 次** |
| `{n,m}` | **匹配 n 到 m 次（Lua 不支持）** |

**示例**
```lua
print(string.match("abc123xyz", "%a+"))  --> abc
print(string.match("abc123xyz", "%d*"))  --> （空字符串）
print(string.match("abc123xyz", "%d+"))  --> 123
```

---

## **4. 定义字符集**
| 符号 | 作用 |
|------|------|
| `[xyz]` | 匹配 `x`、`y` 或 `z` |
| `[^xyz]` | **匹配非** `x`、`y`、`z` 的字符 |
| `[a-z]` | **匹配 a-z 之间的字符** |
| `[A-Z0-9]` | **匹配大写字母或数字** |

**示例**
```lua
print(string.match("Lua 5.4", "[0-9]+"))  --> 5
print(string.match("Hello!", "[^aeiou]+"))  --> H
```

---

## **5. 捕获（提取匹配部分）**
| 规则 | 作用 |
|------|------|
| `(pattern)` | **捕获**匹配的内容 |

**示例**
```lua
local word, number = string.match("abc123", "(%a+)(%d+)")
print(word, number)  --> abc 123
```

---

## **6. 搜索与替换**
Lua 提供 `string.gsub` 进行替换：
```lua
local s = "Hello 123 Lua 456"
print(string.gsub(s, "%d+", "#"))  --> Hello # Lua #
```

---

## **7. 锚点匹配**
| 符号 | 作用 |
|------|------|
| `^` | **匹配字符串开头** |
| `$` | **匹配字符串结尾** |

**示例**
```lua
print(string.match("Hello World", "^Hello"))  --> Hello
print(string.match("Hello World", "World$"))  --> World
```

---

## **8. `string.find`、`string.match`、`string.gsub` 区别**
| 方法 | 作用 |
|------|------|
| `string.find(s, pattern)` | **查找匹配的位置** |
| `string.match(s, pattern)` | **提取第一个匹配** |
| `string.gsub(s, pattern, replace)` | **替换** |

**示例**
```lua
local s = "Hello Lua 123"

print(string.find(s, "%a+"))  --> 1 5 （返回匹配位置）
print(string.match(s, "%a+"))  --> Hello （返回匹配文本）
print(string.gsub(s, "%a+", "#"))  --> # # 123
```

---

## **总结**
- **Lua 的模式匹配类似正则表达式，但不是标准正则**，常用于字符串查找、替换等操作。
- **不支持 `{n,m}` 这样的精确匹配**，但可以用 `string.rep` 变通实现。
- **使用 `()` 进行捕获，用 `string.gsub` 进行替换**，效率较高。
- **不支持 `\d` 这样的正则格式，而是 `%d` 代替**。

如果需要更强的正则功能，可以结合 **PCRE（Lua 正则库）** 进行扩展。

# 笔记

- 默认变量是全局变量
  - local 本地变量
- 未赋值的为 **nil**
- 可以同时赋值a,v=1,2
- 只有一种类型number：支持16进制、科学计数法2e10、次方
- 单引号 (') 和双引号 (") 本质上是等价的，都用于表示字符串。
- 可以同时打印多个变量
- 多行文本[[   ]]
- 单行注释--
  - 多行注释推荐使用 --[=[注释内容]=]，这样可以避免遇到table[table[idx]]时就将多行注释结束了。
  - 多行注释加 - 取消注释中间代码可以继续运行，单行注释没有此功能。

    ---[[
    print('取消多行注释')
    --]]
  - 多行  
  --[[
 多行注释
 多行注释
 --]]

- 字符串连接符..
  - 如果有大量字符串拼接，建议使用 table.concat，性能更优：
    
    local words = { "Hello", " ", "World", "!" }

    local result = table.concat(words)
- Lua 函数不需要声明返回值类型和参数类型
- 没有类和对象的原生概念，但可以用 table + metatable 实现
- 最好不要使用下划线加大写字母的标识符，因为Lua的保留字也是这样的。
- 表：标识符可以使用` . `或` [""] `访问，如果标识符包含特殊字符（如空格），必须用 `[""]` 访问。整数作为下标、字符串作为下标
  
    local person = {
        name = "Alice",
        age as = 25
    }

    print(person.name)  -- Alice

    print(person["age as"])  -- 25
- 在面向对象（OOP）编程时，self 代表当前对象。
- 标识符：
  - and or not	逻辑运算
  - if elseif else then end	条件判断
  - for while repeat until	循环结构
  - function return	定义函数、返回值
  - local	变量作用域  用于代码块中
  - nil true false	变量值
  - do end	代码块
  - goto	代码跳转
- 数组
  1. nil会中断数组下标和长度吗？
  2. for循环不能遍历小于等于零的索引
  3. 不能遍历到不连续索引
  4. 数组下标开始值为1
  5. #获取数组长度
- for循环中 index值不能修改
  
    for i=10,1,-1 do 

    print(i)

    end
- _G全局表：存放全局变量
- 0为ture
- 只有nil 和false 为假
- 不支持自增自减操作

- 不等于：~=     等于：==
- 交换  a,b=b,a
- 函数：
  1. 不支持重载,支持重写
  2. 函数变长参数…需要内部用表接收｛…｝才能使用
  3. 闭包 函数嵌套 外层函数的参数被嵌套的函数使用时,延长生命周期
    ``` lua
    a=function ()
    print("hello")
    end
    --等价
    function Showa()
    print("hello")
    end
    ```
- return  可以返回多个值用逗号隔开
- Lua 中有 8 个基本类型分别为：nil、boolean、number、string、userdata、function、thread 和 table。
  - userdata	表示任意存储在变量中的C数据结构
  - number	表示双精度类型的实浮点数
- 文件调用：require("路径.文件名")
  - 不带拓展名  
  - 只会调用一次，**即使多次调用都是返回的第一次调用的值**
  - 从package.path中查找，我们可以提前使用字符串拼接，将新路径加载到该字段中，调用时就不用指定路径了
  - Package.loaded(xx)判断require加载的文件是否被夹在.  Package.loaded(xx)=nil卸载资源
- loadstring / load 只是编译代码，不会立即执行。**需要显式调用返回的函数才能执行代码**。
  - 每次调用 load，都会创建新的函数对象，**即便代码相同，返回的函数也是不同的**。
- dofile 直接加载并执行一个 Lua 文件，**相当于 loadfile + 调用**。
  - 代码运行在全局作用域，所以 dofile 执行的脚本可以定义全局变量和函数。
  - dofile 每次都会执行文件，不会缓存结果。
  - **如果 执行的 Lua 文件定义了全局变量参与计算返回值，会影响后续 dofile 调用返回值**。

- 字符串
  - 第一个从1开始，倒数 第一个是-1
  - 语法糖调用方法： 可以是用字符串变量：字符串函数（）
- 正则表达式
  - Lua 使用 % 作为转义符，而不是 \
  -  **+**	匹配 1 次或多次
  -  `*`	匹配 0 次或多次
  -  ?	匹配 0 次或 1 次
  -  {n,m}	匹配 n 到 m 次（Lua 不支持）
    - .	匹配任意单个字符（换行符 \n 除外）
    - %a	匹配任意字母（A-Z, a-z）
    - %d	匹配任意数字（0-9）
    - %l	匹配小写字母（a-z）
    - %u	匹配大写字母（A-Z）
    - %s	匹配空白字符（空格、制表符、换行）
    - %w	匹配字母+数字（A-Z, a-z, 0-9）
    - %x	匹配十六进制字符（0-9, A-F, a-f）
    - %c	匹配控制字符（如 \n、\t）
    - %p	匹配标点符号（如 .,!?）
    - %z	匹配 \0（null 字符）
    - %f[set]	匹配 set 定义的边界
    - (pattern)	捕获匹配的内容
    - ^	匹配字符串开头
    - $	匹配字符串结尾

- 元表（表的爸爸）   当我们子表中进行一些`特定操作`时会执行元表中的内容
  ``` lua
    meta={}
    myTable={}
    setmetatable(myTable,meta)  第一个参数：子表   第二个参数：原表（爸爸）
  ```
  - 表默认没有继承、没有元行为，但可以使用**元表（metatable）**扩展它的功能。
  - 元表本身也是一个普通的表，但它的作用是“控制”另一个表的行为。
  - 通过 setmetatable(t, mt) 将元表 mt 绑定到表 t 上。
  - 元表可以定义特殊的元方法（metamethod），比如 __index、__newindex、__add、__tostring 等。
  - `特定操作`
    - __call 让表可以被当作函数调用。当子表被当做一个函数来使用时 会默认调用这个 ca11中的内容，当希望传参数时 一定要记住 默认第一个参数 是调用者自己
    - __index 允许一个表在访问不存在的字段时，从元表中查找。
      - _Index存在于？
		1. 作为函数，传递的索引经过函数筛选判断返回一个值
		2. 作为表，返回表种元素
    - __newindex 控制给表中不存在的字段赋值时的行为。
    - __tostring 子表要被当做字符串使用时 会默认调用这个元表中的tostring方法
  - 
  - 面向对象
    -  使用 table 作为对象，函数 作为方法，并通过 self 访问成员变量。
    -  有构造函数
    -  继承机制
    -  没有 override 关键字，但可以手动重写方法实现多态
    -  类
		1. 用表来实现，获取方式更像是c#中的静态类
		2. 可以在表内声明和表外声明成员
		3. 函数在表 外部声明
			1. class.fucname = function ()
			2. function class.fucname ()
		4. 在表内部函数中调用表本身属性或方法
			1. 前缀一定要指明是谁的属性或方法，指定拥有者，不能直接写变量名，直接写的变量名代表的是全局变量与表中的变量是没有任何关系的
			2. 在函数内部调用自己属性或者方法，需要把自己作为一个参数传进来在内部访问，lua 没有参数类型,所以可以看成是范型
				1. class.fucname(class)
				2. class:fucname() ：调用方法会默认把调用者作为第一个参数传入方法中
		5. :使用
			1. 函数外部调用，表示默认传入一个参数是自己
			2. 函数外部声明，表示默认有一个参数是自己，函数内部获取这个参数需要用self表示默认传入的第一个参数


1. 垃圾回收(置空nil)-主动回收释放内存-切换场景/内存达到瓶颈
	1. collectgarbage(“count”)lua 占用内存
	2. collectgarbage(“collect”)回收垃圾
2. os.time()时间s 系统时间
	1. os.date()获取时间的表，年月日时分秒
3. math.abs()
	1.math.randomseed(os.time)
	math.random

	
4. 迭代器
	1.  小于等于零的所有找不到
	2. pairs比impairs强大，可以遍历所有成员包括小于等于零的索引(不规则的表)
	3. 可以只遍历key
	4. ipairs 数字下标不连续会中断，pairs 所有通用（使用next函数实现）
	5. next函数可以用于判断表是否为空
5. 字典
	1. 访问方式a[“key”]or a.key 
	2. 遍历好像字典一定要用pairs

6. 表
	- Insert 
	- Remove 
	- Sort 
	- Concat
7. 短路运算 
	1. and有真则真 
	2. or有假则假
	3. 可以使用 and or  构成三元运算符，返回结果对应的值或者bool值，短路求值：
        - and 在 第一个值为 false 或 nil 时，直接返回第一个值；否则，返回第二个值。
        - or 在 第一个值为 false 或 nil 时，返回第二个值；否则，直接返回第一个值。
  
                print(10>11 and "yes" or "no")

8. 协程 coroutine
   1. 创建
      1. co=coroutine.create(fuc) 返回的是协程（线程）
         1. 调用：coroutine.resume(co)   该函数返回值第一个为协程执行成功的与否
      2. cor=coroutine.wrap(fuc)  返回的是函数
         1. 调用：cor()
   2. 挂起 coroutine.yield()  每次调用执行都会继续协程  ，yield(yieldReturn)，coroutine.resume的第二个返回值就是它  `isSucc ，yieldReturn = coroutine.wrap(fuc)`
   3. 状态 coroutine.status
      1. dead  没有挂起的协程
      2. suspended 暂停  挂起的协程
      3. running   只能在协程内获取该状态    coroutine.running()可以得到当前正在运行的协程的编号
9.  Person.sayHello() ≈ 静态函数   p1:sayHello() ≈ 成员函数