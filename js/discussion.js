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

    const API_BASE_URL = 'api';
    const board = document.querySelector('.discussion-board');
    const postButton = document.getElementById('post-button');

    // 取得所有留言
    async function fetchThreads() {
        board.innerHTML = '<div class="text-secondary">載入中...</div>';
        try {
            const res = await fetch(`${API_BASE_URL}/message_board.php`);
            const result = await res.json();
            board.innerHTML = '';
            if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
                board.innerHTML = '<div class="text-muted">目前尚無留言。</div>';
                return;
            }
            // 依 question_ID 倒序顯示
            result.data.sort((a, b) => b.question_ID.localeCompare(a.question_ID));
            for (const thread of result.data) {
                const threadDiv = await createThreadElement(thread);
                board.appendChild(threadDiv);
            }
        } catch (e) {
            board.innerHTML = '<div class="text-danger">留言載入失敗</div>';
        }
    }

    // 建立留言元素（含回覆）
    async function createThreadElement(thread) {
        const div = document.createElement('div');
        div.className = 'discussion-thread border rounded p-3 mb-4 bg-white shadow-sm';

        // 主留言內容
        div.innerHTML = `
            <div class="thread-header d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span class="thread-title fw-bold fs-4">${escapeHTML(thread.question_title)}</span>
                    <div class="text-muted small mt-1">${escapeHTML(thread.question_department)} | ${escapeHTML(thread.question_name)}</div>
                </div>
                <div>
                    <span class="badge bg-secondary">${thread.question_ID}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2 toggle-replies-btn">收起回覆</button>
                </div>
            </div>
            <div class="thread-body mt-2">
                <p class="thread-content fs-5">${escapeHTML(thread.question_content)}</p>
            </div>
            <div class="responds-list"></div>
            <div class="respond-form mt-2"></div>
        `;

        // 取得回覆
        const respondsListDiv = div.querySelector('.responds-list');
        const respondFormDiv = div.querySelector('.respond-form');
        let responds = [];
        try {
            const res = await fetch(`${API_BASE_URL}/responds.php?question_ID=${encodeURIComponent(thread.question_ID)}`);
            const threadDetail = await res.json();
            responds = (threadDetail.success && threadDetail.data && Array.isArray(threadDetail.data.responds))
                ? threadDetail.data.responds : [];
        } catch (e) {
            respondsListDiv.innerHTML = '<div class="text-danger">回覆載入失敗</div>';
        }

        // 顯示所有回覆（巢狀）
        respondsListDiv.appendChild(renderResponds(responds));

        // 回覆表單（登入或登出都顯示）
        respondFormDiv.appendChild(createRespondForm(thread.question_ID, null, () => fetchThreads()));

        // 收起/展開主留言回覆
        const toggleBtn = div.querySelector('.toggle-replies-btn');
        toggleBtn.addEventListener('click', function () {
            if (respondsListDiv.style.display === 'none') {
                respondsListDiv.style.display = '';
                toggleBtn.textContent = '收起回覆';
            } else {
                respondsListDiv.style.display = 'none';
                toggleBtn.textContent = '展開回覆';
            }
        });

        return div;
    }

    // 遞迴渲染回覆（巢狀）
    function renderResponds(responds) {
        const ul = document.createElement('ul');
        ul.className = 'list-unstyled ms-2';
        responds.forEach(respond => {
            const li = document.createElement('li');
            li.className = 'mb-3';

            // 教師/一般回覆樣式
            let respondClass = respond.is_teacher_response == 1
                ? 'respond-card teacher-respond p-3 rounded mb-2'
                : 'respond-card user-respond p-3 rounded mb-2';


            let timeStr = '';
            if (respond.created_at) {
                const d = new Date(respond.created_at.replace(/-/g, '/'));
                if (!isNaN(d)) {
                    const rocYear = d.getFullYear() - 1911;
                    timeStr = `（${rocYear}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}）`;
                }
            }


            li.innerHTML = `
                <div class="${respondClass}">
                    <div class="d-flex align-items-center mb-1">
                        <span class="respond-content flex-grow-1">${escapeHTML(respond.respond_content)}</span>
                        ${respond.is_teacher_response == 1
                            ? '<span class="badge bg-warning text-dark ms-2">教師</span>'
                            : '<span class="badge bg-light text-dark ms-2">一般</span>'
                        }
                        <button class="btn btn-sm btn-link text-primary ms-2 reply-btn" data-respond-id="${respond.respond_ID}" data-question-id="${respond.question_ID}">回覆</button>
                        <button class="btn btn-sm btn-outline-secondary ms-2 toggle-children-btn">收起</button>
                    </div>
                    <span class="respond-time text-muted" style="display:block;text-align:right;font-size:0.95em;margin-top:2px;">${timeStr}</span>
                </div>
            `;
            // 子回覆
            if (respond.children && respond.children.length > 0) {
                const childUl = renderResponds(respond.children);
                childUl.classList.add('nested-replies-container');
                li.appendChild(childUl);

                // 收起/展開子回覆
                const toggleBtn = li.querySelector('.toggle-children-btn');
                toggleBtn.addEventListener('click', function () {
                    if (childUl.style.display === 'none') {
                        childUl.style.display = '';
                        toggleBtn.textContent = '收起';
                    } else {
                        childUl.style.display = 'none';
                        toggleBtn.textContent = '展開';
                    }
                });
            } else {
                // 沒有子回覆時隱藏收起按鈕
                li.querySelector('.toggle-children-btn').style.display = 'none';
            }
            // 回覆表單區塊（不論登入或登出都建立）
            const replyFormDiv = document.createElement('div');
            replyFormDiv.className = 'reply-form mt-1';
            li.appendChild(replyFormDiv);

            ul.appendChild(li);
        });
        return ul;
    }

    // 建立回覆表單
    function createRespondForm(question_ID, parent_respond_ID, onSuccess) {
        const form = document.createElement('form');
        form.className = 'd-flex align-items-center gap-2';
        form.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="輸入回覆內容" maxlength="200" required>
            <button type="submit" class="btn btn-sm btn-success">送出</button>
        `;
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const content = form.querySelector('input').value.trim();
            if (!content) {
                alert('請輸入回覆內容');
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/responds.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question_ID,
                        respond_content: content,
                        parent_respond_ID: parent_respond_ID,
                        is_teacher_response: isLoggedIn() ? 1 : 0
                    })
                });
                const result = await res.json();
                if (result.success) {
                    if (typeof onSuccess === 'function') onSuccess();
                } else {
                    alert(result.message || '回覆失敗');
                }
            } catch (e) {
                alert('回覆失敗，請稍後再試');
            }
        });
        return form;
    }

    // 判斷登入狀態
    function isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    // 處理回覆按鈕點擊（事件委派）
    board.addEventListener('click', function (e) {
        if (e.target.classList.contains('reply-btn')) {
            const respondID = e.target.getAttribute('data-respond-id');
            const questionID = e.target.getAttribute('data-question-id');
            // 找到對應的 reply-form
            const li = e.target.closest('li');
            const replyFormDiv = li.querySelector('.reply-form');
            // 避免重複插入
            if (replyFormDiv.childElementCount === 0) {
                replyFormDiv.appendChild(createRespondForm(questionID, respondID, () => fetchThreads()));
            }
        }
    });

    // 防止 XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[<>&"]/g, c => ({
            '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
        }[c]));
    }

    // 發表新留言
    if (postButton) {
        postButton.addEventListener('click', async function () {
            const name = document.getElementById('new-name').value.trim();
            const dept = document.getElementById('new-dept').value.trim();
            const title = document.getElementById('new-title').value.trim();
            const content = document.getElementById('new-content').value.trim();
            if (!name || !dept || !title || !content) {
                alert('請完整填寫所有欄位');
                return;
            }
            if (isLoggedIn()) {
                alert('登入狀態下無法發表問題，請先登出！');
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/message_board.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question_name: name,
                        question_department: dept,
                        question_title: title,
                        question_content: content,
                        popular_question: '0'
                    })
                });
                const result = await res.json();
                if (result.success) {
                    alert('留言已發布！');
                    document.getElementById('new-name').value = '';
                    document.getElementById('new-dept').value = '';
                    document.getElementById('new-title').value = '';
                    document.getElementById('new-content').value = '';
                    fetchThreads();
                } else {
                    alert(result.message || '留言失敗');
                }
            } catch (e) {
                alert('留言失敗，請稍後再試');
            }
        });
    }

    fetchThreads();
});