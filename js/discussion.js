document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('showMoreBtn');
    const more = document.getElementById('morePapers');
    if (btn && more) {
        btn.addEventListener('click', function () {
            more.classList.remove('hidden');
            this.style.display = 'none';
        });
    }

    // 提問按鈕 (保持不變，但請確認 #question-icon-button 元素是否存在於您的 HTML 中)
    const questionButton = document.getElementById('question-icon-button');
    const questionModal = document.getElementById('question-modal');
    const closeButton = document.querySelector('#question-modal .close-button');
    const sendButton = document.getElementById('send-question-button');
    const questionTextarea = document.getElementById('question-textarea');
    const questionResponse = document.getElementById('question-response');
    const responseText = document.getElementById('response-text');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const loginButton = document.querySelector('.navbar-nav .btn-outline-light');

    if (questionButton) {
        questionButton.addEventListener('click', function() {
            if (questionModal && questionModal.classList.contains('hidden')) {
                questionModal.classList.remove('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            } else if (questionModal) {
                questionModal.classList.add('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            }
        });
    } else {
        console.warn("Element with ID 'question-icon-button' not found. Question modal functionality might be affected.");
    }

    if (closeButton) {
        closeButton.addEventListener('click', function() {
            if (questionModal) questionModal.classList.add('hidden');
            responseText.textContent = '';
            if (questionResponse) questionResponse.classList.add('hidden');
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === questionModal) {
            if (questionModal) questionModal.classList.add('hidden');
            responseText.textContent = '';
            if (questionResponse) questionResponse.classList.add('hidden');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (questionModal && !questionModal.classList.contains('hidden')) {
                questionModal.classList.add('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            }
        });
    });

    if (loginButton) {
        loginButton.addEventListener('click', function() {
            if (questionModal && !questionModal.classList.contains('hidden')) {
                questionModal.classList.add('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', function() {
            const question = questionTextarea.value.trim();
            if (question) {
                console.log('發送問題:', question);
                responseText.textContent = '您好，您的問題已收到，我們會盡快回覆。';
                questionResponse.classList.remove('hidden');
                questionTextarea.value = '';
            } else {
                alert('請輸入您的問題。');
            }
        });
    }
});

//瀏覽列互動效果
document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const currentPage = window.location.pathname.split("/").pop(); // e.g. 'course.html'

    navLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (linkHref === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});


/*討論區問題發表與查看回覆*/
document.addEventListener('DOMContentLoaded', function () {
    const postButton = document.getElementById('post-button');
    const board = document.querySelector('.discussion-board');

    // ** 模擬教授登入狀態的變數 **
    let isProfessorLoggedIn = false;
    const PROFESSOR_NAME = '李榮三教授'; // 教授的顯示名稱

    // 獲取所有教授專屬的元素
    const professorActionElements = document.querySelectorAll('.professor-action');
    const loginToggleButton = document.getElementById('login-toggle-btn');

    // *** 新增：切換教授登入狀態的函數 ***
    function toggleProfessorMode() {
        isProfessorLoggedIn = !isProfessorLoggedIn; // 切換狀態

        professorActionElements.forEach(el => {
            if (isProfessorLoggedIn) {
                el.classList.remove('d-none'); // 顯示教授功能
            } else {
                el.classList.add('d-none'); // 隱藏教授功能
            }
        });

        // 更新登入按鈕的文字
        if (isProfessorLoggedIn) {
            loginToggleButton.textContent = '登出 (模擬教授)';
            loginToggleButton.classList.add('btn-warning'); // 教授動作按鈕變黃色
            loginToggleButton.classList.remove('btn-outline-light');
        } else {
            loginToggleButton.textContent = '登入 (模擬教授)';
            loginToggleButton.classList.remove('btn-warning');
            loginToggleButton.classList.add('btn-outline-light');
        }

        console.log('教授模式:', isProfessorLoggedIn ? '開啟' : '關閉');
    }

    // 為模擬登入按鈕綁定事件
    if (loginToggleButton) {
        loginToggleButton.addEventListener('click', function(event) {
            event.preventDefault(); // 阻止頁面跳轉
            toggleProfessorMode();
        });
    }

    // *** 初始載入時，預設為未登入狀態，隱藏教授功能 (可選，如果您希望預設是教授狀態，可以將此行移除) ***
    toggleProfessorMode(); // 初始調用一次，確保介面正確

    // *** 結束新增 ***

    if (postButton && board) {
        postButton.addEventListener('click', function () {
            const title = document.getElementById('new-title').value.trim();
            const content = document.getElementById('new-content').value.trim();
            if (!title || !content) {
                alert('請輸入標題和內容。');
                return;
            }

            const uniqueId = `thread-${Date.now()}`; // 使用時間戳作為簡單的唯一ID

            const thread = document.createElement('div');
            thread.className = 'discussion-thread';
            thread.setAttribute('data-thread-id', uniqueId);
            thread.innerHTML = `
                <div class="thread-header d-flex justify-content-between">
                    <h4>${title}</h4>
                    <small>${getCurrentDate()} | <span class="user-name" data-original-name="${isProfessorLoggedIn ? PROFESSOR_NAME : '新使用者'}">${isProfessorLoggedIn ? PROFESSOR_NAME : '新使用者'}</span></small>
                    <button class="btn btn-warning btn-sm professor-action ${isProfessorLoggedIn ? '' : 'd-none'} delete-thread-btn" data-thread-id="${uniqueId}">刪除問題</button>
                </div>
                <div class="thread-body">
                    <p>${content}</p>
                    <button class="btn btn-outline-primary reply-btn" data-bs-toggle="collapse" data-bs-target="#reply-form-${uniqueId}">回覆</button>
                    <a href="#" class="view-replies-link" data-target-replies="#allReplies-${uniqueId}">查看所有回覆</a>
                    <div id="allReplies-${uniqueId}" class="replies-container collapse mt-2">
                        </div>
                    <div id="reply-form-${uniqueId}" class="collapse mt-2">
                        <textarea class="form-control form-control-sm" rows="2" placeholder="回覆此問題..."></textarea>
                        <button class="btn btn-sm btn-primary mt-1 send-reply-btn" data-parent-thread-id="${uniqueId}">發送</button>
                    </div>
                </div>
                <hr>
            `;

            board.insertBefore(thread, board.firstChild);

            attachThreadEventListeners(thread); // 為新添加的討論串及其內部的回覆相關元素綁定事件監聽器

            document.getElementById('new-title').value = '';
            document.getElementById('new-content').value = '';
        });
    }

    function attachThreadEventListeners(threadElement) {
        const replyButton = threadElement.querySelector('.reply-btn');
        if (replyButton) {
            replyButton.addEventListener('click', function () {
                const threadId = this.dataset.bsTarget.replace('#reply-form-', '');
                const replyForm = threadElement.querySelector(`#reply-form-${threadId}`);
                if (replyForm) {
                    const bsCollapse = new bootstrap.Collapse(replyForm);
                    bsCollapse.toggle();
                }
            });
        }

        const viewRepliesLink = threadElement.querySelector('.view-replies-link');
        if (viewRepliesLink) {
            viewRepliesLink.addEventListener('click', toggleReplies);
        }

        const sendReplyButton = threadElement.querySelector('.send-reply-btn');
        if (sendReplyButton) {
            sendReplyButton.addEventListener('click', function () {
                const parentThreadId = this.dataset.parentThreadId;
                const replyTextarea = threadElement.querySelector(`#reply-form-${parentThreadId} textarea`);
                const replyContent = replyTextarea.value.trim();
                if (replyContent) {
                    // 使用當前時間戳和父ID生成唯一ID
                    const newReplyId = `${parentThreadId}-${Date.now()}`;

                    const repliesContainer = threadElement.querySelector(`#allReplies-${parentThreadId}`);
                    const newReplyDiv = document.createElement('div');
                    newReplyDiv.className = 'reply';
                    newReplyDiv.setAttribute('data-reply-id', newReplyId);
                    newReplyDiv.innerHTML = `
                        <small class="d-flex align-items-center">
                            <button class="btn btn-link btn-sm text-warning professor-action ${isProfessorLoggedIn ? '' : 'd-none'} delete-reply-btn me-2" data-reply-id="${newReplyId}">
                                <i class="fas fa-trash-alt"></i>
                                <span class="d-none d-md-inline">刪除</span>
                            </button>
                            <span class="user-name" data-original-name="${isProfessorLoggedIn ? PROFESSOR_NAME : '新回覆者'}">${isProfessorLoggedIn ? PROFESSOR_NAME : '新回覆者'}</span> (${getCurrentDate()})
                        </small>
                        <p>${replyContent}</p>
                        <div class="reply-actions">
                            <button class="btn btn-sm btn-outline-primary reply-to-reply-btn" data-reply-id="${newReplyId}">回覆</button>
                            <a href="#" class="view-nested-replies-link" data-target-nested-replies="#nested-replies-${newReplyId}">查看回覆</a>
                        </div>
                        <div id="nested-replies-${newReplyId}" class="nested-replies-container"></div>
                        <div id="reply-form-${newReplyId}" class="collapse mt-2">
                            <textarea class="form-control form-control-sm" rows="2" placeholder="回覆此留言..."></textarea>
                            <button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="${newReplyId}">發送</button>
                        </div>
                    `;
                    repliesContainer.appendChild(newReplyDiv);
                    replyTextarea.value = '';
                    const bsCollapseForm = bootstrap.Collapse.getInstance(threadElement.querySelector(`#reply-form-${parentThreadId}`));
                    bsCollapseForm.hide();

                    attachReplyEventListeners(newReplyDiv); // 為新回覆綁定事件
                } else {
                    alert('請輸入您的回覆內容。');
                }
            });
        }

        // 為所有討論串內的刪除按鈕綁定事件
        const deleteThreadButtons = threadElement.querySelectorAll('.delete-thread-btn');
        deleteThreadButtons.forEach(button => {
            button.removeEventListener('click', handleDeleteThread); // 避免重複綁定
            button.addEventListener('click', handleDeleteThread);
        });
    }


    function attachReplyEventListeners(replyElement) {
        const replyToReplyButton = replyElement.querySelector('.reply-to-reply-btn');
        if (replyToReplyButton) {
            replyToReplyButton.addEventListener('click', function () {
                const replyId = this.dataset.replyId;
                let replyForm = replyElement.querySelector(`#reply-form-${replyId}`);

                if (!replyForm) {
                    // 如果表單不存在，則創建它
                    replyForm = document.createElement('div');
                    replyForm.id = `reply-form-${replyId}`;
                    replyForm.className = `collapse mt-2`;
                    replyForm.innerHTML = `
                        <textarea class="form-control form-control-sm" rows="2" placeholder="請輸入您的回覆..."></textarea>
                        <button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="${replyId}">發送回覆</button>
                    `;
                    this.parentNode.insertAdjacentElement('afterend', replyForm);
                    new bootstrap.Collapse(replyForm, { toggle: false }).show();
                } else {
                    const bsCollapse = bootstrap.Collapse.getInstance(replyForm);
                    if (bsCollapse) {
                        bsCollapse.toggle();
                    } else {
                        new bootstrap.Collapse(replyForm, { toggle: false }).toggle();
                    }
                }

                const sendButton = replyForm.querySelector('.send-nested-reply-btn');
                if (sendButton) {
                    sendButton.removeEventListener('click', handleSendNestedReply); // 避免重複綁定
                    sendButton.addEventListener('click', handleSendNestedReply);
                }
            });
        }

        const viewNestedRepliesLink = replyElement.querySelector('.view-nested-replies-link');
        if (viewNestedRepliesLink) {
            viewNestedRepliesLink.addEventListener('click', function (event) {
                event.preventDefault();
                const targetId = this.dataset.targetNestedReplies;
                const nestedRepliesContainer = document.querySelector(targetId);
                if (nestedRepliesContainer) {
                    const bsCollapse = new bootstrap.Collapse(nestedRepliesContainer);
                    bsCollapse.toggle();
                    this.textContent = nestedRepliesContainer.classList.contains('show') ? '收起回覆' : '查看回覆';
                }
            });
        }

        // 為所有回覆內的刪除按鈕綁定事件
        const deleteReplyButtons = replyElement.querySelectorAll('.delete-reply-btn');
        deleteReplyButtons.forEach(button => {
            button.removeEventListener('click', handleDeleteReply); // 避免重複綁定
            button.addEventListener('click', handleDeleteReply);
        });
    }

    function handleSendNestedReply() {
        const parentReplyId = this.dataset.parentReplyId;
        const replyTextarea = this.previousElementSibling;
        const replyContent = replyTextarea.value.trim();
        if (replyContent) {
            const currentReplyElement = this.closest('.reply');
            const nestedRepliesContainer = currentReplyElement.querySelector('.nested-replies-container');
            const newNestedReplyId = `${parentReplyId}-${Date.now()}`; // 巢狀回覆的唯一 ID

            const newNestedReplyDiv = document.createElement('div');
            newNestedReplyDiv.className = 'reply nested-reply';
            newNestedReplyDiv.setAttribute('data-reply-id', newNestedReplyId);
            newNestedReplyDiv.innerHTML = `
                <small class="d-flex align-items-center">
                    <button class="btn btn-link btn-sm text-warning professor-action ${isProfessorLoggedIn ? '' : 'd-none'} delete-reply-btn me-2" data-reply-id="${newNestedReplyId}">
                        <i class="fas fa-trash-alt"></i>
                        <span class="d-none d-md-inline">刪除</span>
                    </button>
                    <span class="user-name" data-original-name="${isProfessorLoggedIn ? PROFESSOR_NAME : '新回覆者'}">${isProfessorLoggedIn ? PROFESSOR_NAME : '新回覆者'}</span> (${getCurrentDate()})
                </small>
                <p>${replyContent}</p>
                <div class="reply-actions">
                    <button class="btn btn-sm btn-outline-primary reply-to-reply-btn" data-reply-id="${newNestedReplyId}">回覆</button>
                    <a href="#" class="view-nested-replies-link" data-target-nested-replies="#nested-replies-${newNestedReplyId}">查看回覆</a>
                </div>
                <div id="nested-replies-${newNestedReplyId}" class="nested-replies-container"></div>
                <div id="reply-form-${newNestedReplyId}" class="collapse mt-2">
                    <textarea class="form-control form-control-sm" rows="2" placeholder="請輸入您的回覆..."></textarea>
                    <button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="${newNestedReplyId}">發送</button>
                </div>
            `;
            nestedRepliesContainer.appendChild(newNestedReplyDiv);
            replyTextarea.value = '';
            this.closest('.collapse').remove(); // 移除回覆表單
            attachReplyEventListeners(newNestedReplyDiv); // 為新巢狀回覆綁定事件
        } else {
            alert('請輸入您的回覆內容。');
        }
    }


    // *** 新增：刪除問題的事件處理函數 ***
    function handleDeleteThread(event) {
        if (!confirm('確定要刪除這個問題及其所有回覆嗎？')) {
            return;
        }
        const threadId = this.dataset.threadId;
        console.log(`模擬刪除問題: ${threadId}`);
        // 模擬從 DOM 中移除元素
        this.closest('.discussion-thread').remove();
        alert('問題已刪除！(此為前端模擬，無實際資料庫操作)');
    }

    // *** 新增：刪除回覆的事件處理函數 ***
    function handleDeleteReply(event) {
        if (!confirm('確定要刪除這個回覆嗎？')) {
            return;
        }
        const replyId = this.dataset.replyId;
        console.log(`模擬刪除回覆: ${replyId}`);
        // 模擬從 DOM 中移除元素
        this.closest('.reply').remove();
        alert('回覆已刪除！(此為前端模擬，無實際資料庫操作)');
    }


    const viewRepliesLinks = document.querySelectorAll('.view-replies-link');
    viewRepliesLinks.forEach(link => {
        link.addEventListener('click', toggleReplies);
    });

    function toggleReplies(event) {
        event.preventDefault();
        const targetId = this.dataset.targetReplies;
        const repliesContainer = document.querySelector(targetId);
        if (repliesContainer) {
            const bsCollapse = new bootstrap.Collapse(repliesContainer);
            bsCollapse.toggle();
            this.textContent = repliesContainer.classList.contains('show') ? '收起回覆' : '查看回覆';
        }
    }

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    // 為初始載入的所有討論串和回覆綁定事件監聽器
    document.querySelectorAll('.discussion-thread').forEach(thread => {
        attachThreadEventListeners(thread);
        thread.querySelectorAll('.reply').forEach(reply => attachReplyEventListeners(reply));
    });

    // 初始化已存在回覆的 ID (用於模擬)
    document.querySelectorAll('.discussion-thread').forEach((thread, threadIndex) => {
        const threadId = `thread-${threadIndex + 1}`;
        thread.setAttribute('data-thread-id', threadId);

        thread.querySelectorAll('.reply').forEach((reply, replyIndex) => {
            const replyId = `${threadId}-${replyIndex + 1}`;
            reply.setAttribute('data-reply-id', replyId);
            // 確保回覆內的按鈕的 data-reply-id 是正確的
            const replyToReplyBtn = reply.querySelector('.reply-to-reply-btn');
            if (replyToReplyBtn) replyToReplyBtn.setAttribute('data-reply-id', replyId);
            const deleteReplyBtn = reply.querySelector('.delete-reply-btn');
            if (deleteReplyBtn) deleteReplyBtn.setAttribute('data-reply-id', replyId);

            // 處理巢狀回覆
            reply.querySelectorAll('.nested-replies-container .reply').forEach((nestedReply, nestedReplyIndex) => {
                const nestedReplyId = `${replyId}-${nestedReplyIndex + 1}`;
                nestedReply.setAttribute('data-reply-id', nestedReplyId);
                const nestedReplyToReplyBtn = nestedReply.querySelector('.reply-to-reply-btn');
                if (nestedReplyToReplyBtn) nestedReplyToReplyBtn.setAttribute('data-reply-id', nestedReplyId);
                const nestedDeleteReplyBtn = nestedReply.querySelector('.delete-reply-btn');
                if (nestedDeleteReplyBtn) nestedDeleteReplyBtn.setAttribute('data-reply-id', nestedReplyId);
            });
        });
    });

});