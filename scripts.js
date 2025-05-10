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
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // 檢查當前鏈接是否匹配當前路徑
        if (link.getAttribute("href") === currentPath || link.getAttribute("href") === currentPath + window.location.hash) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }

        // 點擊時更新 active 類名
        link.addEventListener("click", function () {
            navLinks.forEach(nav => nav.classList.remove("active"));
            this.classList.add("active");
        });
    });
});