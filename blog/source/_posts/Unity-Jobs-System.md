---
title: Unity Jobs System
date: 2025-01-10 11:47:49
updated: 2025-01-10 11:47:49
tags: Unity
categories: Unity
keywords: Jobs
description:
---

# Unity Jobs

Unity **Jobs System** 是 Unity 提供的一种高效并行计算框架，用来帮助开发者更好地利用多核 CPU 的计算能力，提高性能。它是 Unity **Data-Oriented Technology Stack (DOTS)** 的核心组件之一，与 **Burst Compiler** 和 **Entity Component System (ECS)** 密切相关。

---

### **Unity Jobs 的功能与用途**
1. **并行任务处理**
   - Unity Jobs 允许你将复杂的计算任务拆分成多个小任务，并分配到多个 CPU 核心上同时运行。
   - 例如，可以用 Jobs System 处理路径寻路、物理模拟、动画运算、大规模 AI 行为、粒子系统等需要高计算量的任务。

2. **线程安全**
   - Unity Jobs 通过自动管理线程池，避免了开发者手动创建和管理线程带来的复杂性和错误风险。
   - 提供数据访问的约束机制（如 `NativeArray`），避免多线程访问冲突。

3. **性能优化**
   - Unity Jobs 和 **Burst Compiler** 配合，能大幅优化计算性能。Burst Compiler 会将 Jobs 转换为高效的原生代码，充分利用 CPU 的 SIMD 指令集。

---

### **Unity Jobs 的核心概念**
1. **Job**
   - Job 是一个独立的计算任务，通常是一个实现了 `IJob` 或 `IJobParallelFor` 接口的结构体。
   - 示例：
     ```csharp
     public struct MyJob : IJob {
         public NativeArray<int> numbers;

         public void Execute() {
             for (int i = 0; i < numbers.Length; i++) {
                 numbers[i] *= 2; // 每个数字乘以2
             }
         }
     }
     ```

2. **Job Scheduling**
   - 使用 `JobHandle` 调度 Jobs 时，Unity 会将其放入内部的工作队列，分配到可用线程中。
   - 示例：
     ```csharp
     MyJob job = new MyJob {
         numbers = new NativeArray<int>(10, Allocator.TempJob)
     };
     JobHandle handle = job.Schedule();
     handle.Complete();
     ```

3. **Native Containers**
   - Unity 提供了一些高性能的线程安全数据结构，如 `NativeArray`、`NativeList`、`NativeHashMap`，用于在 Jobs 中传递数据。
   - 它们的设计能有效防止数据竞争，并支持并行访问。

4. **Parallel Jobs**
   - 使用 `IJobParallelFor` 接口，可以将任务分解为多个并行执行的子任务。
   - 示例：
     ```csharp
     public struct MyParallelJob : IJobParallelFor {
         public NativeArray<int> numbers;

         public void Execute(int index) {
             numbers[index] *= 2;
         }
     }
     ```

5. **Burst Compiler**
   - Burst 是 Unity Jobs 的性能加速器，通过将代码编译为高度优化的原生代码，显著提升执行效率。

---

### **Unity Jobs 的优点**
1. **自动线程管理**
   - 不需要开发者手动创建线程或管理线程池，减少开发工作量和线程同步问题。
2. **优化 CPU 利用率**
   - 能够充分利用现代多核处理器的性能，特别适合计算密集型任务。
3. **安全性**
   - 通过 `NativeArray` 和 Job 调度机制，保证多线程操作的安全性。
4. **性能提升**
   - 和 Burst Compiler 配合，能极大提升运行时性能。

---

### **Unity Jobs 的典型应用场景**
1. **路径寻路**
   - 通过并行化 A* 算法或其他寻路算法处理大规模的寻路请求。
2. **AI 行为**
   - 对大规模 AI 单元的行为进行计算和决策。
3. **物理模拟**
   - 处理粒子系统、布料模拟、刚体碰撞等复杂物理运算。
4. **动画计算**
   - 并行计算动画骨骼的变换、插值等数据。
5. **数据处理**
   - 处理大规模数据的排序、过滤、转换等操作。

---

### **需要注意的限制**
1. **学习曲线**
   - Jobs System 的使用需要了解多线程编程的基本概念，以及 Unity 提供的 `NativeArray` 等工具。
2. **只适用于计算任务**
   - Jobs System 不直接用于渲染、UI 操作等与主线程相关的任务。
3. **调试困难**
   - 多线程编程的调试相对复杂，尤其是数据竞争和死锁问题。
4. **不支持所有类型**
   - Jobs 不能直接操作引用类型（如类），只能使用值类型（如结构体）。

---

### **Unity Jobs 和其他技术的关系**
1. **与 ECS 的关系**
   - ECS 是基于数据导向设计的架构，Jobs 是 ECS 的核心计算工具，用于加速 Entity 数据的处理。
2. **与 Burst Compiler 的关系**
   - Burst Compiler 是 Jobs 性能优化的关键，能将 Jobs 转化为极其高效的机器代码。
3. **与传统多线程的区别**
   - Jobs 是 Unity 提供的高层次封装，开发者无需直接管理线程，降低了使用多线程的复杂性。

---

### **总结**
Unity Jobs System 是一个高效的并行计算框架，专注于提高 CPU 密集型任务的执行效率。通过将任务拆分为多个 Job 并分配到多个核心上运行，开发者可以充分利用现代多核 CPU 的性能，显著提升游戏运行效率，同时保持线程安全性和开发简洁性。

# Unity Jobs System 的几种典型应用场景案例

以下是 Unity Jobs System 的几种典型应用场景，并结合案例代码说明其使用方法。

---

### 1. **路径寻路**
**场景描述：**
假设你有大量的 NPC 单位需要同时寻路。如果直接用单线程处理，会因寻路算法的高计算复杂度导致帧率下降。

**实现思路：**
使用 Jobs 将寻路任务分配给多个线程并行处理。

**案例代码：**
```csharp
using Unity.Collections;
using Unity.Jobs;
using UnityEngine;

public struct PathfindingJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<Vector2> startPositions;
    [ReadOnly] public NativeArray<Vector2> targetPositions;
    public NativeArray<float> pathCosts;

    public void Execute(int index)
    {
        Vector2 start = startPositions[index];
        Vector2 target = targetPositions[index];
        pathCosts[index] = Vector2.Distance(start, target); // 简化的路径代价计算
    }
}

public class PathfindingExample : MonoBehaviour
{
    void Start()
    {
        int npcCount = 1000;

        NativeArray<Vector2> startPositions = new NativeArray<Vector2>(npcCount, Allocator.TempJob);
        NativeArray<Vector2> targetPositions = new NativeArray<Vector2>(npcCount, Allocator.TempJob);
        NativeArray<float> pathCosts = new NativeArray<float>(npcCount, Allocator.TempJob);

        // 初始化数据
        for (int i = 0; i < npcCount; i++)
        {
            startPositions[i] = Random.insideUnitCircle * 10;
            targetPositions[i] = Random.insideUnitCircle * 10;
        }

        PathfindingJob job = new PathfindingJob
        {
            startPositions = startPositions,
            targetPositions = targetPositions,
            pathCosts = pathCosts
        };

        JobHandle handle = job.Schedule(npcCount, 64);
        handle.Complete();

        // 输出结果
        for (int i = 0; i < 10; i++)
        {
            Debug.Log($"NPC {i} Path Cost: {pathCosts[i]}");
        }

        // 释放资源
        startPositions.Dispose();
        targetPositions.Dispose();
        pathCosts.Dispose();
    }
}
```

**效果：**
通过并行计算，路径代价的计算分布到多个线程，显著减少计算时间。

---

### 2. **AI 行为**
**场景描述：**
多个 AI 单位需要根据状态和周围环境进行决策，比如寻找最近的敌人。

**实现思路：**
用 Jobs 并行处理每个 AI 的决策。

**案例代码：**
```csharp
public struct AIBehaviorJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<Vector3> aiPositions;
    [ReadOnly] public NativeArray<Vector3> enemyPositions;
    public NativeArray<int> closestEnemyIndex;

    public void Execute(int index)
    {
        Vector3 aiPosition = aiPositions[index];
        float minDistance = float.MaxValue;
        int nearestEnemy = -1;

        for (int i = 0; i < enemyPositions.Length; i++)
        {
            float distance = Vector3.Distance(aiPosition, enemyPositions[i]);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearestEnemy = i;
            }
        }

        closestEnemyIndex[index] = nearestEnemy;
    }
}

public class AIExample : MonoBehaviour
{
    void Start()
    {
        int aiCount = 500;
        int enemyCount = 50;

        NativeArray<Vector3> aiPositions = new NativeArray<Vector3>(aiCount, Allocator.TempJob);
        NativeArray<Vector3> enemyPositions = new NativeArray<Vector3>(enemyCount, Allocator.TempJob);
        NativeArray<int> closestEnemyIndex = new NativeArray<int>(aiCount, Allocator.TempJob);

        // 初始化数据
        for (int i = 0; i < aiCount; i++) aiPositions[i] = Random.insideUnitSphere * 50;
        for (int i = 0; i < enemyCount; i++) enemyPositions[i] = Random.insideUnitSphere * 50;

        AIBehaviorJob job = new AIBehaviorJob
        {
            aiPositions = aiPositions,
            enemyPositions = enemyPositions,
            closestEnemyIndex = closestEnemyIndex
        };

        JobHandle handle = job.Schedule(aiCount, 64);
        handle.Complete();

        // 输出结果
        for (int i = 0; i < 10; i++)
        {
            Debug.Log($"AI {i} Closest Enemy Index: {closestEnemyIndex[i]}");
        }

        // 释放资源
        aiPositions.Dispose();
        enemyPositions.Dispose();
        closestEnemyIndex.Dispose();
    }
}
```

**效果：**
每个 AI 并行计算最近敌人，计算效率显著提升。

---

### 3. **物理模拟**
**场景描述：**
大量粒子需要模拟，比如碰撞、加速或力场作用。

**实现思路：**
将每个粒子的物理计算用 Job 并行处理。

**案例代码：**
```csharp
public struct ParticleSimulationJob : IJobParallelFor
{
    public NativeArray<Vector3> positions;
    public NativeArray<Vector3> velocities;
    [ReadOnly] public float deltaTime;

    public void Execute(int index)
    {
        Vector3 velocity = velocities[index];
        positions[index] += velocity * deltaTime;
    }
}

public class ParticleExample : MonoBehaviour
{
    void Start()
    {
        int particleCount = 10000;

        NativeArray<Vector3> positions = new NativeArray<Vector3>(particleCount, Allocator.TempJob);
        NativeArray<Vector3> velocities = new NativeArray<Vector3>(particleCount, Allocator.TempJob);

        // 初始化粒子数据
        for (int i = 0; i < particleCount; i++)
        {
            positions[i] = Random.insideUnitSphere * 10;
            velocities[i] = Random.insideUnitSphere * 5;
        }

        ParticleSimulationJob job = new ParticleSimulationJob
        {
            positions = positions,
            velocities = velocities,
            deltaTime = Time.deltaTime
        };

        JobHandle handle = job.Schedule(particleCount, 64);
        handle.Complete();

        // 输出部分结果
        for (int i = 0; i < 10; i++)
        {
            Debug.Log($"Particle {i} Position: {positions[i]}");
        }

        // 释放资源
        positions.Dispose();
        velocities.Dispose();
    }
}
```

**效果：**
所有粒子的运动更新同时完成，适合模拟大量粒子的物理效果。

---

### 4. **数据处理**
**场景描述：**
对大量数据进行批量处理，比如排序或筛选。

**实现思路：**
使用 Jobs 加速数据的转换、筛选或操作。

**案例代码：**
```csharp
public struct DataProcessingJob : IJobParallelFor
{
    public NativeArray<int> inputData;
    public NativeArray<int> outputData;

    public void Execute(int index)
    {
        outputData[index] = inputData[index] * inputData[index]; // 简单平方运算
    }
}

public class DataProcessingExample : MonoBehaviour
{
    void Start()
    {
        int dataSize = 1000;

        NativeArray<int> inputData = new NativeArray<int>(dataSize, Allocator.TempJob);
        NativeArray<int> outputData = new NativeArray<int>(dataSize, Allocator.TempJob);

        for (int i = 0; i < dataSize; i++) inputData[i] = i;

        DataProcessingJob job = new DataProcessingJob
        {
            inputData = inputData,
            outputData = outputData
        };

        JobHandle handle = job.Schedule(dataSize, 64);
        handle.Complete();

        // 输出结果
        for (int i = 0; i < 10; i++)
        {
            Debug.Log($"Input: {inputData[i]}, Output: {outputData[i]}");
        }

        inputData.Dispose();
        outputData.Dispose();
    }
}
```

**效果：**
批量数据的处理速度大幅提升。

---

### **总结**
通过 Unity Jobs System，可以轻松实现大量计算任务的并行化，从而显著优化性能。上述场景只是冰山一角，你可以根据项目需求灵活运用 Jobs 系统提升游戏的执行效率。

# Execute 方法

在 Unity 的 **Jobs System** 中，`Execute` 方法是实现 `IJob` 或 `IJobParallelFor` 等接口时必须定义的核心方法。它是 Job 的**入口函数**，负责定义并执行每个任务的具体逻辑。

---

### **1. `Execute` 的作用**

- `IJob`: 当你实现一个普通的 Job（非并行），`Execute` 会被调用一次，用来执行你的任务逻辑。
- `IJobParallelFor`: 当你实现并行 Job 时，`Execute` 方法会被多次调用，每次处理任务队列中的一个分块或一个索引。

---

### **2. `Execute` 的签名**

- 对于 `IJob`：
  ```csharp
  public void Execute()
  ```
  - 没有参数，因为它处理的是一个整体任务。

- 对于 `IJobParallelFor`：
  ```csharp
  public void Execute(int index)
  ```
  - 接受一个 `index` 参数，表示当前任务的索引。
  - 通常用于访问数组、列表等数据结构的特定元素。

---

### **3. `Execute` 的运行机制**
当 Job 被调度时，Unity 的 Job System 会自动调用 `Execute` 方法，并在适当的时候将任务分发到多个线程中。对于并行 Job，`index` 参数帮助确定每次调用时应该处理的数据块。

---

### **4. 详细案例**

#### 单任务的 `IJob`
```csharp
using Unity.Jobs;
using UnityEngine;

public struct SimpleJob : IJob
{
    public void Execute()
    {
        Debug.Log("Hello from SimpleJob!");
    }
}

public class JobExample : MonoBehaviour
{
    void Start()
    {
        SimpleJob job = new SimpleJob();
        JobHandle handle = job.Schedule();
        handle.Complete(); // 等待任务完成
    }
}
```
**输出结果：**
```
Hello from SimpleJob!
```

---

#### 并行任务的 `IJobParallelFor`
```csharp
using Unity.Jobs;
using Unity.Collections;
using UnityEngine;

public struct ParallelJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<int> inputData;
    public NativeArray<int> resultData;

    public void Execute(int index)
    {
        // 计算平方
        resultData[index] = inputData[index] * inputData[index];
    }
}

public class ParallelJobExample : MonoBehaviour
{
    void Start()
    {
        int size = 10;
        NativeArray<int> inputData = new NativeArray<int>(size, Allocator.TempJob);
        NativeArray<int> resultData = new NativeArray<int>(size, Allocator.TempJob);

        // 初始化数据
        for (int i = 0; i < size; i++)
        {
            inputData[i] = i;
        }

        ParallelJob job = new ParallelJob
        {
            inputData = inputData,
            resultData = resultData
        };

        JobHandle handle = job.Schedule(size, 2); // 调度任务，批处理大小为2
        handle.Complete(); // 等待任务完成

        for (int i = 0; i < size; i++)
        {
            Debug.Log($"Index {i}: {resultData[i]}");
        }

        inputData.Dispose();
        resultData.Dispose();
    }
}
```

**输出结果：**
```
Index 0: 0
Index 1: 1
Index 2: 4
Index 3: 9
Index 4: 16
Index 5: 25
Index 6: 36
Index 7: 49
Index 8: 64
Index 9: 81
```

---

### **5. 调度和并行化的核心**
- Unity Job System 根据你提供的数据规模和分块大小（chunk size）自动管理对 `Execute` 的调用。
- **调度参数**：
  ```csharp
  JobHandle Schedule(int arrayLength, int batchSize)
  ```
  - `arrayLength`：任务总数（通常与数组长度相同）。
  - `batchSize`：每次分配给一个线程处理的任务数量。

---

### **6. 总结**
- `Execute` 是 Job 的核心执行逻辑，由 Unity 的 Job System 在适当的线程中调用。
- `IJob` 的 `Execute` 没有参数，用于处理整体任务。
- `IJobParallelFor` 的 `Execute` 接受一个 `index` 参数，用于处理特定的数据块或索引。
- 使用 Jobs System 时，`Execute` 是定义任务行为的关键入口点。