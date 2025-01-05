---
title: 
date: 2024-12-17 09:14:26
---
<!DOCTYPE html>
<html lang="zh-cn">

<head>
    <meta charset="UTF-8">
    <title>FullCalendar 农历和调休示例</title>
    <script src='https://cdn.jsdelivr.net/npm/rrule@2.6.4/dist/es5/rrule.min.js'></script>
    <link href="https://cdn.jsdelivr.net/npm/fullcalendar@latest/main.min.css" rel="stylesheet" />
</head>
<body>
    <!-- 日历容器 -->
    <div id="calendar"></div>
    <!-- 底部信息容器 -->
    <div id="lunar-info" style="margin-top: 0px; padding: 0px 10px;  border: 1px solid #ddd;">
        <p id="day-info">宜忌信息：加载中...</p>
        <p id="zodiac-info">生肖年：加载中...</p>
        <p id="day-of-year-info">当前是今年的第 N 天：加载中...</p>
    </div>
    <!-- FullCalendar JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@latest/main.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.11.6/umd/popper.min.js"></script>
    <!-- 引入农历库 -->
    <script src="https://cdn.jsdelivr.net/npm/lunar-javascript@latest/lunar.min.js"></script>
    <!-- 本地脚本加载路径需要添加根目录节点-->
    <script src="/js/myCalendar.js"></script>
    <script>
        Show("calendar");
    </script>
</body>

</html>

[老黄历](https://6tail.cn/calendar/api.html#demo.huangli.html)

[Fullcalendar 官方文档](https://fullcalendar.io/docs)
[Fullcalendar技术文档](https://keenwon.com/143/)
[Fullcalendar一览表](https://blog.csdn.net/ymnets/article/details/78661247)
[Fullcalendar css样式](https://fullcalendar.io/docs/css-customization)
[Fullcalendar v3文档](https://fullcalendar.io/docs/v3)
[Fullcalendar 事件](https://blog.csdn.net/seawaving/article/details/140527841)
[Fullcalendar 插件](https://fullcalendar.io/docs/plugin-index)
实现方法：[Lunar](https://6tail.cn/calendar/api.html#solar.new.html) + Fullcalendar

# 升级 FullCalendar v3 到 v5 的一些改动

主要的变更点：

1. 模块化架构：

v3 是一个较为单一的打包文件，所有功能都捆绑在一起（包括各种视图、事件处理等）。
v4/v5 则采用了 模块化设计，你需要显式引入所需的插件，比如 @fullcalendar/core、@fullcalendar/daygrid、@fullcalendar/multimonth 等。

2. 事件处理：

在 v3 中，事件处理通常通过直接的回调函数（例如 eventClick）来实现。
在 v4/v5 中，事件处理和配置的方式有些变化，主要是 API 变动和事件绑定方式的不同。

3. 视图配置变化：

v3 的视图配置项和 v5 的配置项有一些差异，尤其是在视图定义和布局方面。
v5 引入了新的视图类型和插件（如 multiMonth），并且视图的切换和配置方式也发生了一些变化。

4. 时间和日期处理：

FullCalendar v4/v5 对时间和日期处理进行了优化，采用了更标准的 luxon 或 moment（v3中）来处理日期时间格式。虽然 moment.js 仍然在 v4/v5 中可用，但默认不再强制引入。

5. 外观和样式：

FullCalendar 在 v4 和 v5 中对 UI 和样式做了一些改进和调整。如果你之前自定义过样式，可能需要进行适配。


# 视图

月视图 ---- 日历
时间网格视图  ---- 课程表、作息表
列表视图  ---- 事件清单
DayGrid视图  ---- 备忘录，周计划