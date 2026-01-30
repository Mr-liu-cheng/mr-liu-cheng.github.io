---
title: 日历【FullCalendar+Lunar+RRule+Popper】
date: 2025-01-02 04:22:41
updated: 2025-01-02 04:22:41
tags: [FullCalendar,Lunar,RRule,Popper]
categories: [Hexo,Beautify,FullCalendar]
keywords: [FullCalendar,Lunar,RRule,Popper,日历]
description:
---
**先看官方文档，不懂的再chatgpt，最后谷歌百度搜问题**

# FullCalendar

- 视图
- 单元格渲染
- 单元格大小适配

确保计算和数据加载完毕，延迟100ms渲染。
``` js
datesSet:
    function (dateInfo) {//处理默认空事件留白
        console.log('Dates set:', dateInfo);  // 打印日期范围
        // 延迟执行，以确保日历完全渲染
        setTimeout(function () {
            var dayCells = document.querySelectorAll('.fc-daygrid-day');  // 获取所有日期格子
            dayCells.forEach(function (dayCell) {
                var eventsContainer = dayCell.querySelector('.fc-daygrid-day-events');
                if (eventsContainer) {
                    eventsContainer.style.margin = 0;  // 隐藏没有事件的容器
                    // 如果该日期格子没有事件，隐藏事件容器
                    if (!dayCell.querySelector('.fc-event')) {
                        eventsContainer.style.display = 'none';  // 隐藏没有事件的容器
                    }
                }
            });
        }, 100);  // 延迟100ms执行
    },
```

# Lunar
- 法定节假日
- 节气
- 农历日期
- 宜忌
- 生日

# RRule

- 命名空间
``` js
const rruleOccurrences = new RRule(rruleEvent.rrule).all(); 
//无法识别 RRule，提示未定义，我们引入了rrule库就要引入命名空间 rrule
var RRule = rrule.RRule;
```
- 格式与FullCalendar插件语法不同：
  - **FullCalendar语法**
``` js
  var calendar2 = new FullCalendar.Calendar(calendarEl, {
        events: [
            {
                title: 'my recurring event',
                rrule: {
                    freq: 'weekly',
                    interval: 1,
                    byweekday: ['mo', 'fr'],
                    dtstart: '2024-02-01T10:30:00', // will also accept '20120201T103000'
                    until: '2025-06-01' // will also accept '20120201'
                }
            }
        ]
    });
```
  - **RRule 语法**
``` js
var RRule = rrule.RRule;
var rruleEvent =
{
    title: 'rrule event',
    rrule: {
        freq: RRule.WEEKLY,
        interval: 5,
        byweekday: [RRule.MO, RRule.FR],
        dtstart: new Date(2024, 2, 1, 10, 30),
        until: new Date(2025, 12, 31)
    },
    duration: '02:00',
};

// 使用 rrule.js 解析 RRule
console.log(typeof RRule); // 应该输出 "function"
const rruleOccurrences = new RRule(rruleEvent.rrule).all(); // 获取所有日期实例

// 转换为 FullCalendar 可用事件格式
const rruleEvents = rruleOccurrences.map(date => ({
    title: rruleEvent.title,
    start: date,
}));
```


- 单个对象声明
在还没有做好重复事件配置处理时，保持按照单个声明，这个和其他event配置不同。因为一个重复事件肯能涉及好多时间段，相当于多个事件的集合。
- events 属性和 evens 函数不可兼得
evens 函数:更灵活，配置变量,但是重复事件要自己转换
events 属性:死板，但是支持重复事件，根据FullCalendar语法来
``` js

events:  [...birthdayEvents, ...myEvents, ...InternationalFestivals, ...rruleEvents],
or
events: function (info, successCallback, failureCallback) {
            // 获取当前视图的起始日期
            const viewStart = new Date(info.start);
            const curMonthIndex = (viewStart.getDate() !== 1) ? viewStart.getMonth() + 1 : viewStart.getMonth();//月份下标  0-11  12是下一年1月
            currentYear = (viewStart.getMonth() === 11 && curMonthIndex === 12) ? viewStart.getFullYear() + 1 : viewStart.getFullYear();
            var curMonth = curMonthIndex == 12 ? 1 : curMonthIndex + 1;
            const solar = Solar.fromYmd(currentYear, curMonth, 1); // 构造阳历日期
            const lunar = solar.getLunar(); // 转为农历日期
            var curYearLunar = lunar.getYear();
            console.log('当前显示的主月份年份是:', currentYear, ' ', curMonth, ' ', lunar.toString(), ' ', solar.toString());

            defineBirthday(curYearLunar);
            AddAnniversaryDate();
            defineMyEvent();
            defineInternationalFestivals();
            // 合并所有事件数组
            const allEvents = [...birthdayEvents, ...myEvents, ...InternationalFestivals, ...rruleEvents];

            // 过滤出在当前视图范围内的事件
            const filteredEvents = allEvents.filter(event => {
                const eventStart = new Date(event.start).getTime();
                const eventEnd = event.end ? new Date(event.end).getTime() : eventStart;

                // 判断事件是否与视图范围有重叠
                return eventEnd >= new Date(info.start).getTime() && eventStart <= new Date(info.end).getTime();
            });

            // 返回过滤后的事件
            successCallback(filteredEvents);
        },
```
# Popper
鼠标进入时事件详情弹窗
``` js
eventDidMount: function (info) {
            const eventElement = info.el;
            const title = info.event.title;  // 获取事件标题
            const description = info.event.extendedProps.description || '';  // 获取事件描述，如果没有描述则为空字符串  自定义属性
            // 创建 Tooltip 元素
            const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            // 设置 Tooltip 内容：标题在第一行，描述在第二行（如果有描述）
            tooltip.innerHTML = `<strong>标题:${title}</strong><br>描述：${description ? description : 'null'}`;

            // 设置 Tooltip 样式
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'black';  // 黑色背景
            tooltip.style.color = 'white';  // 白色字体
            tooltip.style.border = '1px solid white';  // 白色边框
            tooltip.style.padding = '5px 10px';  // 内边距
            tooltip.style.borderRadius = '4px';  // 边角圆润
            tooltip.style.fontSize = '12px';  // 字体大小

            tooltip.style.maxWidth = '500px';  // 设置最大宽度
            tooltip.style.width = 'auto';      // 宽度自适应内容
            tooltip.style.whiteSpace = 'normal';  // 允许文本换行
            tooltip.style.wordBreak = 'break-word'; // 防止文本溢出

            // 确保 Tooltip 在内容过长时能够滚动显示
            //  tooltip.style.maxWidth = '1000px';
            // tooltip.style.overflow = 'auto'; 

            document.body.appendChild(tooltip);  // 将 tooltip 移动到 body 里 calendarEl
            // 使用 Popper.js 来定位 Tooltip
            const popperInstance = Popper.createPopper(eventElement, tooltip, {
                placement: 'top',  // Tooltip 显示在事件上方
            });

            // Tooltip 初始为不可见，鼠标悬停时显示
            tooltip.style.visibility = 'hidden';
            eventElement.addEventListener('mouseenter', function () {
                tooltip.style.visibility = 'visible';  // 鼠标悬停时显示
                tooltip.style.zIndex = 9999;  // 显示时将 z-index 提升 ,至于最顶层，防止被遮挡
                popperInstance.update();  // 强制更新位置
            });
            eventElement.addEventListener('mouseleave', function () {
                tooltip.style.visibility = 'hidden';  // 鼠标离开时隐藏
            });

            // 使用 MutationObserver 监听弹窗的显示
            //由于 FullCalendar 的弹窗是通过动态加载的，你可能需要监听弹窗的显示事件，然后再修改其样式。你可以使用 MutationObserver 来监听 DOM 变动，确保弹窗被渲染出来后再进行修改。
            const observer = new MutationObserver(function (mutationsList, observer) {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const popover = document.querySelector('.fc-popover');
                        if (popover) {
                            popover.style.backgroundColor = '#d3d3d3';
                            popover.style.color = '#333';
                            popover.style.borderRadius = '8px';
                            popover.style.maxWidth = '500px';
                        }
                        const popoverBody = document.querySelector('.fc-popover-body');
                        if (popoverBody) {
                            popoverBody.style.padding = '0px 10px 10px 10px'; // 设置新的 padding 值
                        }

                        document.querySelectorAll('.fc-more-popover-misc br').forEach((br) => {
                            br.remove(); // 移除多余的换行符
                        });

                        // 获取 fc-popover-header  元素
                        var morePopover = document.querySelector('.fc-popover-header');
                        // 检查元素是否存在
                        if (morePopover) {
                            // 设置高度和溢出属性
                            morePopover.style.height = '28px'; // 你可以根据需要调整高度
                        }

                        observer.disconnect();  // 一旦修改了样式，停止监听
                    }
                }
            });
            // 配置观察选项
            observer.observe(document.body, { childList: true, subtree: true });
        },
```
