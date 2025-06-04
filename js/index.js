document.addEventListener('DOMContentLoaded', function () {
    fetch('api/course_info.php')
        .then(res => res.json())
        .then(courses => {
            const weekMap = {
                '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
                '星期五': 5, '星期六': 6, '星期日': 7
            };

            const timeToPeriod = {
                '08:10': 1, '09:00': 1,
                '09:10': 2, '10:00': 2,
                '10:10': 3, '11:00': 3,
                '11:10': 4, '12:00': 4,
                '12:10': 5, '13:00': 5,
                '13:10': 6, '14:00': 6,
                '14:10': 7, '15:00': 7,
                '15:10': 8, '16:00': 8,
                '16:10': 9, '17:00': 9,
                '17:10': 10, '18:00': 10,
                '18:10': 11, '19:00': 11,
                '19:10': 12, '20:00': 12,
                '20:10': 13, '21:00': 13,
                '21:10': 14, '22:00': 14

            };

            const table = document.querySelector('.schedule-table tbody');
            if (!table) return;

            const cells = {};
            Array.from(table.rows).forEach((row, periodIdx) => {
                cells[periodIdx + 1] = {};
                Array.from(row.cells).forEach((cell, cellIdx) => {
                    if (cellIdx > 0) {
                        cells[periodIdx + 1][cellIdx] = cell;
                    }
                });
            });

            courses.forEach(course => {
                let timeStr = course.course_time.trim();
                // 拆出所有星期幾 (可能多個)
                const dayMatches = [];
                const dayMatch = timeStr.match(/星期([一二三四五六日](?:、[一二三四五六日])*)/);
                if (dayMatch) {
                    // 例如 dayMatch[1] 會是 "二、三"
                    dayMatch[1].split('、').forEach(d => {
                        dayMatches.push('星期' + d);
                    });
                }                // 拆出時間段，如 09:10~12:00
                const timeMatch = timeStr.match(/(\d{2}:\d{2})~(\d{2}:\d{2})/);

                if (!dayMatches || !timeMatch) return;

                const startTime = timeMatch[1];
                const endTime = timeMatch[2];

                const startPeriod = timeToPeriod[startTime];
                const endPeriod = timeToPeriod[endTime];

                if (!startPeriod || !endPeriod) return;

                dayMatches.forEach(day => {
                    const weekday = weekMap[day];
                    for (let p = startPeriod; p <= endPeriod; p++) {
                        if (cells[p] && cells[p][weekday]) {
                            if (cells[p][weekday].innerHTML.trim() !== '-' && cells[p][weekday].innerHTML.trim() !== '') {
                                cells[p][weekday].innerHTML += '<br>' + course.course_name;
                            } else {
                                cells[p][weekday].innerHTML = course.course_name;
                            }
                        }
                    }
                });
            });
        });
});
