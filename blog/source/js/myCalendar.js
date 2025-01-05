function Show(pageIdentifier) {
    console.log('Calendar start');
    var birthdayEvents, myEvents, InternationalFestivals;
    var currentYear;
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


    function defineBirthday(curYearLunar) {
        var lunarBirth = [
            { name: "刘老大", month: 12, day: 13, year: 1966 },
            { name: "贾老二", month: 9, day: 3, year: 1966 },
            { name: "燕子", month: 7, day: 18, year: 1990 },
            { name: "刘程", month: 6, day: 14, year: 1996 },
            { name: "兰兰", month: 3, day: 26, year: 1998 },
        ];
        // 将农历生日转换为阳历事件

        birthdayEvents = lunarBirth.map(birthday => {
            const solar = Lunar.fromYmd(curYearLunar, birthday.month, birthday.day).getSolar();
            // console.log('birthday.name:', birthday.name, ' ', currentYear, " ", birthday.year, ' ', solar.toYmd());
            return {
                title: `🎂 ${birthday.name}${curYearLunar - birthday.year}生日`, // 事件标题
                start: solar.toYmd(),             // 事件日期 (阳历)
                color: 'purple',                  // 事件颜色
                allDay: true                      // 全天事件
            };
        });
    }

    function AddAnniversaryDate() {
        // 假设你有一个纪念日的对象，包含纪念日的年月日
        const anniversaryDate = { year: 2023, month: 3, day: 26 }; // 纪念日日期 
        // 计算纪念年的周年数
        const currentAnniversary = currentYear - anniversaryDate.year;
        const month = (anniversaryDate.month).toString().padStart(2, '0');  // 保证月份为两位数
        const day = (anniversaryDate.day).toString().padStart(2, '0');      // 保证日期为两位数

        // 创建纪念日事件
        const anniversaryEvent = { title: currentAnniversary === 0 ? "我们在一起了" : `🎉 第${currentAnniversary}周年纪念`, start: `${currentYear}-${month}-${day}`, color: 'red', allDay: true };
        // 将纪念日事件添加到生日事件列表中
        birthdayEvents.push(anniversaryEvent);
    }

    function defineMyEvent() {
        // 其他事件列表（自定义事件）
        myEvents = [
            { title: "项目截止日", start: `${currentYear}-12-15`, color: 'red' },
            { title: "团队会议", start: `${currentYear}-12-20T10:00:00`, color: 'blue', description: 'Thisisaverylongwordthatexceedscontainerwidthjjjkajndqjnjncjahsdbhefbhqioiwiqwjdkssjkahdwlaahwajjjjhkdnqjwnqjwdkqjnrwlqkrqknr', },
            { title: "给幺爸买火车票", start: `2025-01-06`, allDay: true, color: 'green' },
            { title: "masndlk出差卡拉胶速度sdfwecv快垃圾考虑到实际阿拉抗打击了哇较大拉卡鲸打卡溜达鸡啊卡罗卡经纬度考拉几万块拉法基阿瓦会计法垃圾福娃卡拉季开发啦", start: `${currentYear}-12-26`, end: `${currentYear}-11-25`, color: 'green', url: 'https://google.com/' },
            { title: "google", start: `${currentYear}-12-22`, end: `${currentYear}-11-25`, color: 'green', url: 'https://google.com/' },
            { title: "google", start: `${currentYear}-12-22`, end: `${currentYear}-11-25`, color: 'green', url: 'https://google.com/' },
            { title: "google", start: `${currentYear}-12-22`, end: `${currentYear}-11-25`, color: 'green', url: 'https://google.com/' },
            { title: "google", start: `${currentYear}-12-22`, end: `${currentYear}-11-25`, color: 'green', url: 'https://google.com/' },
        ];
    }

    // 获取指定年份中某月的第N个星期几的日期
    function getNthWeekdayOfMonth(year, month, weekday, nth) {
        const firstDay = new Date(year, month - 1, 1); // 当月第一天
        const firstWeekday = (firstDay.getDay() + 6) % 7; // 调整星期天为7，星期一为0，其他不变

        // 计算第一个目标星期几的日期
        const daysToFirstTarget = (7 + weekday - firstWeekday) % 7;
        const firstTargetDate = 1 + daysToFirstTarget;

        // 计算第 nth 个目标星期几的日期
        const nthTargetDate = firstTargetDate + (nth - 1) * 7;

        return new Date(year, month - 1, nthTargetDate); // 返回正确的日期对象
    }

    function defineInternationalFestivals() {
        // 动态计算每年节日日期
        const mothersDay = getNthWeekdayOfMonth(currentYear, 5, 0, 2); // 每年5月第二个星期日
        const fathersDay = getNthWeekdayOfMonth(currentYear, 6, 0, 3); // 每年6月第三个星期日
        const thanksgiving = getNthWeekdayOfMonth(currentYear, 11, 4, 4); // 每年11月第四个星期四

        InternationalFestivals = [
            { title: "情人节", start: `${currentYear}-02-14`, color: "pink" },
            { title: "愚人节", start: `${currentYear}-04-01`, color: "orange" },
            { title: "母亲节", start: mothersDay.toISOString().split('T')[0], color: "red" },   // 动态计算的日期
            { title: "父亲节", start: fathersDay.toISOString().split('T')[0], color: "blue" },  // 动态计算的日期
            { title: "618购物节", start: `${currentYear}-06-18`, color: "red" },
            { title: "感恩节", start: thanksgiving.toISOString().split('T')[0], color: "brown" },  // 动态计算的日期
            { title: "黑色星期五", start: `${currentYear}-11-29`, color: "black" },
            { title: "双十一购物节", start: `${currentYear}-11-11`, color: "purple" },
            { title: "万圣节", start: `${currentYear}-10-31`, color: "darkorange" },
            { title: "双十二购物节", start: `${currentYear}-12-12`, color: "green" },
            { title: "圣诞节", start: `${currentYear}-12-25`, color: "green" },
            { title: "跨年夜", start: `${currentYear}-12-31`, color: "blue" },
        ];

    }

    commonHandler();
    function commonHandler() {
        // 使用 rrule.js 解析 RRule
        const rruleOccurrences = new RRule(rruleEvent.rrule).all(); // 获取所有日期实例
        // 转换为 FullCalendar 可用事件格式
        const rruleEvents = rruleOccurrences.map(date => ({
            title: rruleEvent.title,
            start: date,
        }));

        const isCalendarPage = pageIdentifier === "calendar";
        console.log("页面：", pageIdentifier);
        const calendarEl = document.getElementById(pageIdentifier);
        //创建FullCalendar实例  
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: isCalendarPage ? 'dayGridMonth' : "listDay",
            locale: 'zh-cn',
            firstDay: 1,
            dayMaxEvents: 3, //true
            dateClick: function (info) {
                const clickedDate = new Date(info.dateStr);
                updateLunarInfo(clickedDate); // 点击日期时更新底部信息
            },
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
                    }, 0);  // 延迟100ms执行
                },
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
            eventMouseEnter: function (info) { info.el.style.borderColor = 'red'; },
            eventMouseLeave: function (info) { info.el.style.borderColor = 'transparent'; },
            height: 'auto',                       // 设置总高度为600px
            contentHeight: 'auto',             // 内容区域高度自动调整
            aspectRatio: 1.5,                 // 设置宽高比为1.5
            rerenderDelay: 300,  // 设定300毫秒的延迟时间
            windowResizeDelay: 200,           // 设置500毫秒的延迟时间，避免频繁渲染
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
            headerToolbar: isCalendarPage ? {
                center: 'dayGridMonth,next10' // buttons for switching between views
            } : '',
            // footerToolbar: isCalendarPage ? {
            //     center: '' // buttons for switching between views
            // } : '',
            views: {
                dayGridMonth: {
                    dayCellContent(item) {
                        // 转换阳历为农历
                        const solarDate = new Date(item.date);
                        const lunarDate = Lunar.fromDate(solarDate); // 使用 Lunar.js 获取农历信息
                        const lunarDay = lunarDate.getDayInChinese(); // 农历日
                        const lunarMonth = lunarDate.getMonthInChinese(); // 农历月
                        const solar = Solar.fromDate(solarDate);
                        //节假日 节气
                        const holiday = HolidayUtil.getHoliday(solar.toYmd());
                        const jieQi = lunarDate.getJieQi();//节气
                        //传统节日
                        var festivalstr;
                        var festivals = lunarDate.getFestivals();
                        if (festivals.length > 1) {
                            festivalstr = festivals.join('、');
                        } else {
                            festivalstr = festivals.toString();
                        }
                        // 返回单元格内容
                        return {
                            html: `
              <div>
                ${item.dayNumberText}<br>
                <span style="color: gray; font-size: 10px;">${lunarMonth}月${lunarDay}</span>
                ${holiday && !holiday.isWork() && holiday.getTarget() == holiday.getDay() ? `<br><span style="color: red; font-size: 10px;">${holiday.getName()}</span>` : ''}
                ${holiday && !holiday.isWork() && holiday.getTarget() != holiday.getDay() ? `<br><span style="color: red; font-size: 10px;">休</span>` : ''}
                ${holiday && holiday.isWork() ? `<br><span style="color: cyan; font-size: 10px;">补</span>` : ''}
                ${jieQi ? `<br><span style="color: yellow; font-size: 10px;">${jieQi}</span>` : ''}
                ${festivals != holiday?.getName() ? `<br><span style="color: orange; font-size: 10px;">${festivalstr}</span>` : ''}
              </div>
            `
                        };
                    }
                },
                next10: {
                    type: 'listWeek',
                    duration: { days: 10 },
                    buttonText: 'next10'
                },
                listDay: {
                    type: 'listDay',
                    buttonText: 'listDay'
                },
            }
        });

        // 获取当前日期信息
        const today = new Date();
        const dayOfYear = SolarUtil.getDaysInYear(today.getYear(), today.getMonth() + 1, today.getDate()); // 当前日期在今年的第几天
        const springFestivalSolar = Lunar.fromYmd(Lunar.fromDate(today).getYear() + 1, 1, 1).getSolar();
        const dayDiff = springFestivalSolar.subtract(Solar.fromDate(today)) - 1;//中间间隔日 （不包含当天和除夕）
        updateLunarInfo(today); // 初始化显示今天的信息
        function updateLunarInfo(date) {
            if (!isCalendarPage) return;
            const lunarDate = Lunar.fromDate(date);
            const yearZodiac = lunarDate.getYearShengXiao(); // 当前年份的生肖
            // 获取宜忌信息
            const yi = lunarDate.getDayYi().join('、'); // 宜
            const ji = lunarDate.getDayJi().join('、'); // 忌
            // 更新底部信息
            document.getElementById('day-info').innerHTML = `宜：<span style="color:green">${yi || '无'}</span> <br> 忌：<span style="color:red">${ji || '无'}</span>`;
            document.getElementById('zodiac-info').innerHTML = `${date.toLocaleDateString('zh-CN')} - ${lunarDate}  <strong>${yearZodiac}</strong>年`;
        }
        if (isCalendarPage)
            document.getElementById('day-of-year-info').innerHTML = `今年剩余 <strong>${SolarUtil.getDaysOfYear(today.getYear()) - dayOfYear}</strong> 天，距离过年(除夕)还有<strong> ${dayDiff - 1}</strong>   天`;
        setTimeout(function () { calendar.render(); }, 200); // 延迟渲染，确保布局已完成
        console.log('Calendar rendered with Lunar and holidays', SolarUtil.getDaysOfYear(today.getYear()), ' ', dayOfYear, ' springFestivalSolar:', springFestivalSolar.toYmd(), ' ', Solar.fromDate(today).toYmd(), ' ', today.getDate());
    }
}