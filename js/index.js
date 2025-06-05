document.addEventListener('DOMContentLoaded', function () {
    fetch('api/course_info.php')
        .then(res => {
            // 檢查 HTTP 狀態碼，如果不是 2xx，拋出錯誤
            if (!res.ok) {
                // 嘗試解析錯誤訊息（如果 API 有返回）
                return res.json().then(errData => {
                    throw new Error(`HTTP 錯誤! 狀態碼: ${res.status}, 訊息: ${errData.message || res.statusText}`);
                }).catch(() => {
                    // 如果無法解析 JSON 錯誤訊息，就用基本的錯誤訊息
                    throw new Error(`HTTP 錯誤! 狀態碼: ${res.status}, 訊息: ${res.statusText}`);
                });
            }
            return res.json();
        })
        .then(result => {
            console.log('API 回傳:', result); // 除錯用

            // 確保 result.success 為 true 且 result.data 存在
            if (!result || !result.success || !result.data) {
                console.error('API 回傳資料格式不正確或操作失敗:', result);
                // 這裡可以顯示更友善的錯誤訊息給使用者
                alert('載入課程資料失敗，請檢查伺服器回應。');
                return;
            }

            const courses = result.data;

            // 再次檢查 courses 是否為陣列，以防 PHP 返回非預期的格式
            if (!Array.isArray(courses)) {
                console.error('API 回傳的 data 不是陣列:', courses);
                alert('課程資料格式錯誤，無法顯示。');
                return;
            }

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
            if (!table) {
                console.error('找不到 .schedule-table tbody 元素');
                return;
            }

            const cells = {};
            Array.from(table.rows).forEach((row, periodIdx) => {
                cells[periodIdx + 1] = {};
                Array.from(row.cells).forEach((cell, cellIdx) => {
                    if (cellIdx > 0) { // 跳過第一欄 (時間/節次欄)
                        cells[periodIdx + 1][cellIdx] = cell;
                    }
                });
            });

            courses.forEach(course => {
                // 檢查 course.course_time 是否存在且為字串
                if (!course.course_time || typeof course.course_time !== 'string') {
                    console.warn('課程缺少時間資訊或時間格式不正確:', course);
                    return;
                }

                let timeStr = course.course_time.trim();
                const dayMatches = [];
                const dayPart = timeStr.split(' ')[0];

                // 支援「星期二、三」或「星期二」或「星期二、星期三」
                dayPart.replace(/星期([一二三四五六日])/g, (m, d) => {
                    dayMatches.push('星期' + d);
                });
                dayPart.replace(/、([一二三四五六日])/g, (m, d) => {
                    // 為了避免重複添加，這裡可以加一個簡單的檢查，但對於預期的格式通常沒問題
                    if (!dayMatches.includes('星期' + d)) {
                        dayMatches.push('星期' + d);
                    }
                });

                const timeMatch = timeStr.match(/(\d{2}:\d{2})~(\d{2}:\d{2})/);

                if (!dayMatches.length || !timeMatch) {
                    console.warn('課程時間格式不符，跳過:', course.course_time);
                    return;
                }

                const startTime = timeMatch[1];
                const endTime = timeMatch[2];

                const startPeriod = timeToPeriod[startTime];
                const endPeriod = timeToPeriod[endTime];

                if (!startPeriod || !endPeriod) {
                    console.warn('找不到對應節次範圍，跳過:', startTime, endTime);
                    return;
                }

                dayMatches.forEach(day => {
                    const weekday = weekMap[day]; // 得到數字型的星期 (1-7)
                    if (!weekday) {
                        console.warn('無效的星期:', day);
                        return;
                    }

                    for (let p = startPeriod; p <= endPeriod; p++) {
                        // 確保 cells[p] 和 cells[p][weekday] 都存在
                        if (cells[p] && cells[p][weekday]) {
                            const targetCell = cells[p][weekday];
                            // 檢查單元格內容是否為初始的 '-' 或空，以決定是覆蓋還是追加
                            if (targetCell.innerHTML.trim() === '-' || targetCell.innerHTML.trim() === '') {
                                targetCell.innerHTML = course.course_name;
                            } else {
                                targetCell.innerHTML += '<br>' + course.course_name;
                            }
                        } else {
                            console.warn(`找不到對應的單元格: 節次 ${p}, 星期 ${weekday}`);
                        }
                    }
                });
            });
        })
        .catch(err => {
            console.error('課表資料載入失敗 (Fetch 或 JSON 解析錯誤):', err);
            alert('載入課表資料時發生錯誤，請檢查網路連線或稍後再試。');
        });
});