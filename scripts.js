document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('showMoreBtn');
    const more = document.getElementById('morePapers');
    if (btn && more) {
        btn.addEventListener('click', function () {
            more.classList.remove('hidden');
            this.style.display = 'none';
        });
    }
});

// 提問按鈕
document.addEventListener('DOMContentLoaded', function() {
    const questionButton = document.getElementById('question-icon-button');
    const questionModal = document.getElementById('question-modal');
    const closeButton = document.querySelector('#question-modal .close-button');
    const sendButton = document.getElementById('send-question-button');
    const questionTextarea = document.getElementById('question-textarea');
    const questionResponse = document.getElementById('question-response');
    const responseText = document.getElementById('response-text');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link'); // 選擇所有導覽列連結
    const loginButton = document.querySelector('.navbar-nav .btn-outline-light'); // 選擇登入按鈕

    questionButton.addEventListener('click', function() {
        if (questionModal.classList.contains('hidden')) {
            // 如果視窗是隱藏的，則打開
            questionModal.classList.remove('hidden');
            responseText.textContent = '';
            questionResponse.classList.add('hidden');
        } else {
            // 如果視窗是顯示的，則關閉
            questionModal.classList.add('hidden');
            responseText.textContent = '';
            questionResponse.classList.add('hidden');
        }
    });

    closeButton.addEventListener('click', function() {
        questionModal.classList.add('hidden');
        responseText.textContent = '';
        questionResponse.classList.add('hidden');
    });

    // 點擊視窗外部也關閉彈出視窗
    window.addEventListener('click', function(event) {
        if (event.target === questionModal) {
            questionModal.classList.add('hidden');
            responseText.textContent = '';
            questionResponse.classList.add('hidden');
        }
    });

    // 監聽導覽列連結的點擊事件
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (!questionModal.classList.contains('hidden')) {
                questionModal.classList.add('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            }
        });
    });

    // 監聽登入按鈕的點擊事件（如果存在）
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            if (!questionModal.classList.contains('hidden')) {
                questionModal.classList.add('hidden');
                responseText.textContent = '';
                questionResponse.classList.add('hidden');
            }
        });
    }

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
    let replyCounter = 0; // 初始化回覆計數器

    if (postButton && board) {
        postButton.addEventListener('click', function () {
            const title = document.getElementById('new-title').value.trim();
            const content = document.getElementById('new-content').value.trim();
            if (!title || !content) return;

            const today = new Date();
            const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
            const uniqueId = Date.now();

            const thread = document.createElement('div');
            thread.className = 'discussion-thread';
            thread.innerHTML = `
                <div class="thread-header d-flex justify-content-between">
                    <h4>${title}</h4>
                    <small>${dateStr} | U</small>
                </div>
                <div class="thread-body">
                    <p>${content}</p>
                    <button class="btn btn-outline-primary" data-bs-toggle="collapse" data-bs-target="#reply-new-${uniqueId}">回覆</button>
                    <a href="#" class="view-replies-link" data-target-replies="#allReplies-new-${uniqueId}">查看所有回覆</a>
                    <div id="reply-new-${uniqueId}" class="collapse mt-2">
                        <textarea class="form-control" rows="3" placeholder="請輸入您的回覆..."></textarea>
                        <button class="btn btn-primary mt-2" data-reply-thread="${uniqueId}">發送回覆</button>
                    </div>
                    <div id="allReplies-new-${uniqueId}" class="replies-container collapse mt-2">
                        </div>
                </div>
                <hr>
            `;

            board.insertBefore(thread, board.firstChild); // 插到最上面
            document.getElementById('new-title').value = '';
            document.getElementById('new-content').value = '';

            // 為新添加的 "查看所有回覆" 連結添加事件監聽器
            const newViewRepliesLink = thread.querySelector('.view-replies-link');
            newViewRepliesLink.addEventListener('click', toggleReplies);

            // 為新添加的 "發送回覆" 按鈕添加事件監聽器
            const newReplyButton = thread.querySelector('.thread-body .btn-primary[data-reply-thread]');
            if (newReplyButton) {
                newReplyButton.addEventListener('click', function() {
                    const threadId = this.dataset.replyThread;
                    const replyTextarea = document.querySelector(`#reply-new-${threadId} textarea`);
                    const replyContent = replyTextarea.value.trim();
                    if (replyContent) {
                        replyCounter++; // 遞增回覆計數器
                        const repliesContainer = document.querySelector(`#allReplies-new-${threadId}`);
                        const replyDiv = document.createElement('div');
                        replyDiv.className = 'reply';
                        replyDiv.innerHTML = `<small>U${replyCounter} (${getCurrentDate()})</small><p>${replyContent}</p>`;
                        repliesContainer.appendChild(replyDiv);
                        replyTextarea.value = ''; // 清空回覆輸入框
                        const bsCollapseReply = bootstrap.Collapse.getInstance(document.querySelector(`#reply-new-${threadId}`));
                        bsCollapseReply.hide(); // 收起回覆輸入框
                    } else {
                        alert('請輸入您的回覆內容。');
                    }
                });
            }
        });
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
            if (repliesContainer.classList.contains('show')) {
                bsCollapse.hide();
                this.textContent = '查看所有回覆';
            } else {
                bsCollapse.show();
                this.textContent = '收起回覆';
            }
        }
    }

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

});