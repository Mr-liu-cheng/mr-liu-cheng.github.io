---
title: Unity ScriptableObject
date: 2025-01-16 17:26:16
updated: 2025-01-16 17:26:16
tags: Unity
categories: Unity
keywords: Unity ScriptableObject
description:
---
[官方文档](https://docs.unity3d.com/2022.3/Documentation/Manual/class-ScriptableObject.html)

在 Unity 中，`ScriptableObject` 是一种特殊的对象，它允许你在 Unity 编辑器中创建 **可序列化** 的 **自定义数据容器**，并且能够在多个场景、多个游戏对象之间共享数据。`ScriptableObject` 是继承自 `UnityEngine.ScriptableObject` 类的一种对象，通常用于存储数据，而不是存储行为（功能）。它是为了减少对 `MonoBehaviour` 的依赖，提升项目的灵活性和性能。

### 1. **基本概念**

`ScriptableObject` 并不像普通的 **MonoBehaviour** 那样附加到 GameObject 上，而是独立的、非场景物体的对象。它可以在项目中作为资产（Asset）保存，并且多个实例之间可以共享同一份数据，避免了重复存储。

- **普通对象**（如 `MonoBehaviour`）通常与场景中的对象（GameObject）绑定，每个 GameObject 上可以有多个组件（Component）。
- **ScriptableObject** 是独立的、与场景无关的对象，它可以作为一个单独的资源在项目中保存和使用。

### 2. **用途与优势**

- **数据管理**：`ScriptableObject` 非常适合存储各种类型的 **配置数据**、**游戏状态数据**、**角色属性**、**道具配置** 等。这些数据可以在多个场景和多个对象间共享，不需要在每个对象中都存储一份数据。
  
- **性能优化**：通过减少在 `MonoBehaviour` 中重复存储相同数据，`ScriptableObject` 有助于节省内存和存储空间。此外，`ScriptableObject` 数据通常会被序列化成资源（Asset），并且在运行时只会读取一次，而不是每次运行时都重新创建。

- **可重用性**：由于 `ScriptableObject` 是一个资产资源，可以在多个场景或多个对象之间共享，提升了代码和数据的 **可重用性**。例如，你可以为多个角色创建同一个 `ScriptableObject` 配置，而不需要每个角色都拥有一份独立的数据。

- **易于调试与编辑**：`ScriptableObject` 可以在 Unity 编辑器中查看和编辑，因此对数据的修改更加直观，并且能通过 Inspector 窗口直接进行。

### 3. **创建和使用 ScriptableObject**

创建 `ScriptableObject` 并使用它非常简单。以下是一个创建和使用 `ScriptableObject` 的基本流程。

#### 步骤 1: 创建 ScriptableObject 类

你需要创建一个继承自 `ScriptableObject` 的类来定义数据结构。您可以使用`CreateAssetMenu`属性使用您的类创建自定义资产。例如，定义一个表示角色属性的 `CharacterData` 类：

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "New Character", menuName = "Game/Character Data")]
public class CharacterData : ScriptableObject
{
    public string characterName;
    public int health;
    public int attack;
}
```

在这个例子中，`CharacterData` 类继承自 `ScriptableObject`，并包含了角色的基本属性（如名字、生命值、攻击力）。

- `CreateAssetMenu` 特性会让你在 Unity 编辑器的右键菜单中创建该类型的 `ScriptableObject` 实例。
- 注意：脚本文件必须与类同名。

#### 步骤 2: 创建 ScriptableObject 实例
根据CreateAssetMenu代码中的路径来创建资源：
`Assets > Create > xxx > 并选择xxxx`。

在 Unity 编辑器中，右键单击 **项目视图**，然后选择 `Create > Game > Character Data`（这取决于你在 `CreateAssetMenu` 特性中设置的路径）。这会生成一个新的 `CharacterData` 资源，你可以为其指定值，例如：

- `characterName` 设置为 "Hero"。
- `health` 设置为 100。
- `attack` 设置为 30。

你可以创建多个不同的 `CharacterData` 资源，例如一个 `Warrior` 和一个 `Mage`，并将其用于不同的角色。

#### 步骤 3: 使用 ScriptableObject 实例

然后，在其他脚本中，你可以引用并使用这个 `ScriptableObject` 数据。例如，创建一个 `Character` 类来使用 `CharacterData`：

```csharp
using UnityEngine;

public class Character : MonoBehaviour
{
    public CharacterData characterData;

    void Start()
    {
        Debug.Log("Character Name: " + characterData.characterName);
        Debug.Log("Health: " + characterData.health);
        Debug.Log("Attack: " + characterData.attack);
    }
}
```

在 `Character` 脚本中，你通过 `public` 变量将 `CharacterData` 资源分配给角色对象。然后，你可以在运行时访问和使用这个数据。

### 4. **ScriptableObject 的应用场景**

`ScriptableObject` 可以用于多种场景，以下是一些典型的应用案例：

#### (1) **游戏数据配置**
许多游戏使用 `ScriptableObject` 来存储 **配置数据**，如角色属性、物品描述、武器信息等。这些数据通常在多个场景或多个对象中被共享，因此使用 `ScriptableObject` 可以减少冗余数据存储。

#### (2) **状态机或事件系统**
在状态机或事件系统中，`ScriptableObject` 可以作为 **事件数据** 或 **状态数据** 的容器，方便管理和修改。例如，在设计一个 **对话系统** 时，每个对话框可以是一个 `ScriptableObject`，并包含其显示的文本、触发的事件等。

#### (3) **可视化脚本**
如果你正在做可视化脚本（如 **行为树**、**任务系统** 等），`ScriptableObject` 可以用来存储不同任务或行为的定义，使得设计者可以在编辑器中直接创建和修改这些数据，而不需要编写复杂的代码。

#### (4) **音频和动画管理**
音频管理、动画控制等系统中，`ScriptableObject` 常用来存储不同的 **音效配置** 或 **动画控制器配置**，这样可以方便地在多个地方共享这些配置。

### 5. **ScriptableObject 与 MonoBehaviour 的区别**

| 特性              | `ScriptableObject`                               | `MonoBehaviour`                        |
|-------------------|--------------------------------------------------|----------------------------------------|
| **附加到物体**        | 不附加到 GameObject，独立作为资源存在            | 附加到 GameObject 上作为组件          |
| **序列化**            | 作为资产（Asset）保存，可直接在编辑器中编辑      | 作为场景中的一部分，编辑时通过组件修改 |
| **内存管理**          | 只要引用它的地方需要它，内存才会存在             | 在场景中存在，通常与对象生命周期绑定   |
| **共享数据**          | 可以跨多个对象和场景共享同一个 ScriptableObject 实例 | 每个 `MonoBehaviour` 实例数据独立     |
| **生命周期**     | 不绑定到 `GameObject`，没有生命周期函数，通常用于存储数据 | 绑定到 `GameObject`，有生命周期函数（如 `Start()`、`Update()`）|
| **内存管理**     | 作为资源存储，手动创建和销毁，不会随场景卸载而销毁      | 和 `GameObject` 一起管理，销毁时自动销毁               |
| **用途**         | 用于数据存储、配置、常量，多个场景或对象共享数据      | 适用于场景中的行为控制、物理计算、UI 控制等          |
| **交互方式**     | 通过资源管理系统（如 Inspector）直接引用               | 附加到 `GameObject`，每个 `GameObject` 可以有多个 `MonoBehaviour`|
| **应用场景**     | 配置数据、全局状态、事件系统、数据驱动设计              | 角色控制、AI、UI 更新、物理计算等                     |



### 6. **总结**

`ScriptableObject` 是 Unity 中非常强大的工具，它允许你创建独立于场景的自定义数据容器，并在多个游戏对象、场景间共享这些数据。相比于传统的 `MonoBehaviour`，`ScriptableObject` 更适合用于存储游戏的配置、状态数据等，因为它能够减少冗余，提升内存利用率，并且方便在编辑器中进行管理。
