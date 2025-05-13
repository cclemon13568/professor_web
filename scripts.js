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


/*討論區問題發表*/
document.getElementById('post-button').addEventListener('click', function () {
    const title = document.getElementById('new-title').value.trim();
    const content = document.getElementById('new-content').value.trim();
    if (!title || !content) return;

    const today = new Date();
    const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

    const thread = document.createElement('div');
    thread.className = 'discussion-thread';
    thread.innerHTML = `
        <div class="thread-header d-flex justify-content-between">
            <h4>${title}</h4>
            <small>${dateStr} | 使用者</small>
        </div>
        <div class="thread-body">
            <p>${content}</p>
            <button class="btn btn-outline-primary" data-bs-toggle="collapse" data-bs-target="#reply-new-${Date.now()}">回覆</button>
            <div id="reply-new-${Date.now()}" class="collapse mt-2">
                <textarea class="form-control" rows="3" placeholder="請輸入您的回覆..."></textarea>
                <button class="btn btn-primary mt-2">發送回覆</button>
            </div>
        </div>
        <hr>
    `;

    const board = document.querySelector('.discussion-board');
    board.insertBefore(thread, board.firstChild); // 插到最上面
    document.getElementById('new-title').value = '';
    document.getElementById('new-content').value = '';
});document.addEventListener("DOMContentLoaded", () => {
    const postButton = document.getElementById("post-button");
    const titleInput = document.getElementById("new-title");
    const contentInput = document.getElementById("new-content");
    const board = document.querySelector(".discussion-board");

    postButton.addEventListener("click", () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert("請輸入標題和內容！");
            return;
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

        const newThread = document.createElement("div");
        newThread.classList.add("discussion-thread");
        newThread.innerHTML = `
            <div class="thread-header d-flex justify-content-between">
                <h4>${title}</h4>
                <small>${dateStr} | 匿名使用者</small>
            </div>
            <div class="thread-body">
                <p>${content}</p>
                <button class="btn btn-outline-primary" data-bs-toggle="collapse" data-bs-target="#reply-new${Date.now()}">回覆</button>
                <div id="reply-new${Date.now()}" class="collapse mt-2">
                    <textarea class="form-control" rows="3" placeholder="請輸入您的回覆..."></textarea>
                    <button class="btn btn-primary mt-2">發送回覆</button>
                </div>
            </div>
            <hr>
        `;

        board.prepend(newThread); // 將新問題加到最上面

        titleInput.value = "";
        contentInput.value = "";
    });
});
