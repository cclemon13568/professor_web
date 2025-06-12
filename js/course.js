document.addEventListener('DOMContentLoaded', function () {

    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const currentPage = window.location.pathname.split("/").pop();
    navLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (linkHref === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    const courseList = document.getElementById('course-list');
    const teacherId = 'T002'; // 可依需求調整

    // 取得課程資料
    fetch(`api/course_info.php?teacher_ID=${encodeURIComponent(teacherId)}`)
        .then(res => res.json())
        .then(result => {
            courseList.innerHTML = '';
            const courses = result.data;
            if (!Array.isArray(courses) || courses.length === 0) {
                courseList.innerHTML = '<div class="text-muted">查無課程資料</div>';
                return;
            }
            courses.forEach(course => {
                if (course.course_ID === 'CS000') return; // 跳過 CS000
//新增功能
                const card = document.createElement('div');
                card.className = 'card mb-4';
                card.dataset.courseId = course.course_ID;

                card.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${course.course_name || ''}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">
                            教室：${course.classroom || ''} ｜ 時間：${course.course_time || ''} ｜ 課程代碼:${course.course_ID}
                        </h6>
                        <p class="card-text">${course.course_outline || ''}</p>
                        <div class="evaluation-list border rounded p-3 mb-2 bg-light"></div>
                        <form class="evaluation-form">
                            <div class="mb-2">
                                <input type="text" class="form-control mb-2" name="student_ID" placeholder="學生ID (如：S001)" required>
                                <input type="text" class="form-control mb-2" name="course_period" placeholder="修課期間 (如：112-1)" required>
                                <textarea class="form-control" rows="2" placeholder="留下你的評價..." required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-sm">送出評價</button>
                        </form>
                    </div>
                `;
                courseList.appendChild(card);

                // 載入評價
                loadEvaluations(card, course.course_ID);
            });
        });

    // --- 新增的學期驗證邏輯 ---
    function isValidCoursePeriod(periodString) {
        const regex = /^(\d{2,3})-(\d)$/; // 匹配 "數字-1" 或 "數字-2"
        const match = periodString.match(regex);

        if (!match) {
            return false; // 格式不符
        }

        const inputYear = parseInt(match[1], 10);
        const inputSemester = parseInt(match[2], 10);

        // 學期只能是 1 或 2
        if (inputSemester !== 1 && inputSemester !== 2) {
            return false;
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() 回傳 0-11

        let currentValidROCYear;
        let currentValidSemester;

        // 根據「今年8月才是114-1學期」的規則判斷當前學期
        // 2月到7月：當前西元年減1911後的民國年，為第二學期 (例如 2025/6 -> 113-2)
        if (currentMonth >= 2 && currentMonth <= 7) {
            currentValidROCYear = currentYear - 1912;
            currentValidSemester = 2;
        }
            // 8月到隔年1月：當前西元年減1911後的民國年，為第一學期 (例如 2025/8 -> 114-1)
        // 特別處理 1 月份，它屬於前一個學年度的第一學期 (例如 2026/1 -> 114-1)
        else {
            currentValidROCYear = (currentMonth === 1) ? (currentYear - 1911 - 1) : (currentYear - 1911);
            currentValidSemester = 1;
        }

        // 檢查輸入的學年和學期是否合法（不能超過當前學期）
        if (inputYear > currentValidROCYear) {
            return false; // 學年超過當前學年
        } else if (inputYear === currentValidROCYear) {
            if (inputSemester > currentValidSemester) {
                return false; // 同學年但學期超過當前學期
            }
        }
        // 如果輸入的學期是 1 或 2，且沒有超過當前學期，則合法
        return true;
    }
    // --- 學期驗證邏輯結束 ---

    // 載入評價並處理送出
    function loadEvaluations(card, courseId) {
        const evalList = card.querySelector('.evaluation-list');
        const evalForm = card.querySelector('.evaluation-form');
        const textarea = evalForm.querySelector('textarea');
        let comments = [];

        // 取得該課程所有評價
        fetch(`api/evaluation.php?course_ID=${encodeURIComponent(courseId)}`)
            .then(res => res.json())
            .then(data => {
                comments = Array.isArray(data.data) ? data.data.reverse() : [];
                renderComments();
            });

        // 渲染評價
        function renderComments(expanded = false) {
            evalList.innerHTML = '';
            const showCount = 2;
            comments.forEach((c, idx) => {
                const div = document.createElement('div');
                div.className = 'mb-2 p-2 border-bottom';

                let timeStr = '';
                if (c.created_at) {
                    const d = new Date(c.created_at.replace(/-/g, '/')); // Safari 相容
                    const rocYear = d.getFullYear() - 1911;
                    timeStr = `（${rocYear}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}）`;
                }

                div.innerHTML = `
                <div>
                    <strong>#${c.evaluate_ID}</strong> (課程代碼:${courseId}) [修課期間：${c.course_period || ''}]：${c.evaluate}
                </div>
                <span class="eval-time text-muted">${timeStr}</span>
                `;
                if (!expanded && idx >= showCount) {
                    div.classList.add('eval-hidden');
                    div.style.display = 'none';
                }
                evalList.appendChild(div);
            });

            // 展開/收起按鈕
            let btn = card.querySelector('.show-more-btn');
            if (btn) btn.remove();
            if (comments.length > showCount) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'show-more-btn';
                btn.textContent = expanded ? '收起' : '展開更多';
                btn.setAttribute('data-expanded', expanded ? 'true' : 'false');
                btn.onclick = function () {
                    renderComments(!expanded);
                    if (!expanded) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                };
                evalList.appendChild(btn);
            }
        }

        // 評價送出
        evalForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const studentInput = evalForm.querySelector('input[name="student_ID"]');
            const periodInput = evalForm.querySelector('input[name="course_period"]');
            const textarea = evalForm.querySelector('textarea');
            const studentID = studentInput.value.trim();
            const coursePeriod = periodInput.value.trim();
            const content = textarea.value.trim();

            if (!studentID || !coursePeriod || !content) {
                alert('請完整填寫所有欄位'); // 增加提示
                return;
            }

            // --- 呼叫新的驗證函數 ---
            if (!isValidCoursePeriod(coursePeriod)) {
                alert('修課期間格式錯誤，請輸入例如 "113-2" 的格式，學期必須是 "1" 或 "2"，且不能超過當前學期。');
                return;
            }
            // --- 驗證結束 ---

            // 送出到 API
            fetch('api/evaluation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_ID: studentID,
                    course_period: coursePeriod,
                    evaluate: content,
                    course_ID: courseId
                })
            })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        // 成功後重新載入評價並清空表單
                        fetch(`api/evaluation.php?course_ID=${encodeURIComponent(courseId)}`)
                            .then(res => res.json())
                            .then(data => {
                                comments = Array.isArray(data.data) ? data.data.reverse() : [];
                                renderComments(false); // 重新渲染並收起評論
                            });
                        textarea.value = '';
                        periodInput.value = '';
                        studentInput.value = '';
                    } else {
                        alert(result.message || '送出失敗');
                    }
                })
                .catch(error => { // 增加錯誤捕捉
                    console.error('送出評價時發生錯誤:', error);
                    alert('送出評價失敗，請稍後再試。');
                });
        });
    }

});