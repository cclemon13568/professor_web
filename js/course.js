

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
        .then(courses => {
            courseList.innerHTML = '';
            if (!Array.isArray(courses) || courses.length === 0) {
                courseList.innerHTML = '<div class="text-muted">查無課程資料</div>';
                return;
            }
            courses.forEach(course => {
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
                comments = Array.isArray(data) ? data.reverse() : [];
                renderComments();
            });

        // 渲染評價
        function renderComments(expanded = false) {
            evalList.innerHTML = '';
            const showCount = 2;
            comments.forEach((c, idx) => {
                const div = document.createElement('div');
                div.className = 'mb-2 p-2 border-bottom';
                div.innerHTML = `<strong>#${c.evaluate_ID}</strong> (課程代碼:${courseId}) [修課期間：${c.course_period || ''}]：${c.evaluate}`;
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
            if (!studentID || !coursePeriod || !content) return;
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
                    fetch(`api/evaluation.php?course_ID=${encodeURIComponent(courseId)}`)
                        .then(res => res.json())
                        .then(data => {
                            comments = Array.isArray(data) ? data.reverse() : [];
                            renderComments(false);
                        });
                    textarea.value = '';
                    periodInput.value = '';
                    studentInput.value = '';
                } else {
                    alert(result.message || '送出失敗');
                }
            });
        });
    }


});