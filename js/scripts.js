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

// // 提問按鈕
// document.addEventListener('DOMContentLoaded', function() {
//     const questionButton = document.getElementById('question-icon-button');
//     const questionModal = document.getElementById('question-modal');
//     const closeButton = document.querySelector('#question-modal .close-button');
//     const sendButton = document.getElementById('send-question-button');
//     const questionTextarea = document.getElementById('question-textarea');
//     const questionResponse = document.getElementById('question-response');
//     const responseText = document.getElementById('response-text');
//     const navLinks = document.querySelectorAll('.navbar-nav .nav-link'); // 選擇所有導覽列連結
//     const loginButton = document.querySelector('.navbar-nav .btn-outline-light'); // 選擇登入按鈕
//
//     questionButton.addEventListener('click', function() {
//         if (questionModal.classList.contains('hidden')) {
//             // 如果視窗是隱藏的，則打開
//             questionModal.classList.remove('hidden');
//             responseText.textContent = '';
//             questionResponse.classList.add('hidden');
//         } else {
//             // 如果視窗是顯示的，則關閉
//             questionModal.classList.add('hidden');
//             responseText.textContent = '';
//             questionResponse.classList.add('hidden');
//         }
//     });
//
//     closeButton.addEventListener('click', function() {
//         questionModal.classList.add('hidden');
//         responseText.textContent = '';
//         questionResponse.classList.add('hidden');
//     });
//
//     // 點擊視窗外部也關閉彈出視窗
//     window.addEventListener('click', function(event) {
//         if (event.target === questionModal) {
//             questionModal.classList.add('hidden');
//             responseText.textContent = '';
//             questionResponse.classList.add('hidden');
//         }
//     });
//
//     // 監聽導覽列連結的點擊事件
//     navLinks.forEach(link => {
//         link.addEventListener('click', function() {
//             if (!questionModal.classList.contains('hidden')) {
//                 questionModal.classList.add('hidden');
//                 responseText.textContent = '';
//                 questionResponse.classList.add('hidden');
//             }
//         });
//     });
//
//     // 監聽登入按鈕的點擊事件（如果存在）
//     if (loginButton) {
//         loginButton.addEventListener('click', function() {
//             if (!questionModal.classList.contains('hidden')) {
//                 questionModal.classList.add('hidden');
//                 responseText.textContent = '';
//                 questionResponse.classList.add('hidden');
//             }
//         });
//     }
//
//     sendButton.addEventListener('click', function() {
//         const question = questionTextarea.value.trim();
//         if (question) {
//             console.log('發送問題:', question);
//             responseText.textContent = '您好，您的問題已收到，我們會盡快回覆。';
//             questionResponse.classList.remove('hidden');
//             questionTextarea.value = '';
//         } else {
//             alert('請輸入您的問題。');
//         }
//     });
// });

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
    let replyCounter = 0; // 初始化主要回覆計數器
    let nestedReplyCounter = 0; // 初始化子回覆計數器

    if (postButton && board) {
        postButton.addEventListener('click', function () {
            const title = document.getElementById('new-title').value.trim();
            const content = document.getElementById('new-content').value.trim();
            if (!title || !content) return;

            const today = new Date();
            const dateStr = getCurrentDate();
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
                    <button class="btn btn-outline-primary reply-btn" data-reply-thread="${uniqueId}">回覆</button>
                    <a href="#" class="view-replies-link" data-target-replies="#allReplies-${uniqueId}">查看回覆</a>
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

            // 為新添加的主要回覆添加事件監聽器
            const newReplyButton = thread.querySelector('.reply-btn');
            if (newReplyButton) {
                newReplyButton.addEventListener('click', function () {
                    const threadId = this.dataset.replyThread;
                    const replyForm = thread.querySelector(`#reply-form-${threadId}`);
                    if (replyForm) {
                        const bsCollapse = new bootstrap.Collapse(replyForm);
                        bsCollapse.toggle();
                    }
                });
            }

            const newViewRepliesLink = thread.querySelector('.view-replies-link');
            if (newViewRepliesLink) {
                newViewRepliesLink.addEventListener('click', toggleReplies);
            }

            const newSendReplyButton = thread.querySelector('.send-reply-btn');
            if (newSendReplyButton) {
                newSendReplyButton.addEventListener('click', function () {
                    const parentThreadId = this.dataset.parentThreadId;
                    const replyTextarea = thread.querySelector(`#reply-form-${parentThreadId} textarea`);
                    const replyContent = replyTextarea.value.trim();
                    if (replyContent) {
                        replyCounter++;
                        const repliesContainer = thread.querySelector(`#allReplies-${parentThreadId}`);
                        const newReplyDiv = document.createElement('div');
                        newReplyDiv.className = 'reply';
                        newReplyDiv.innerHTML = `<small>U${replyCounter} (${getCurrentDate()})</small><p>${replyContent}</p><div class="reply-actions"><button class="btn btn-sm btn-outline-primary reply-to-reply-btn" data-reply-id="reply-${parentThreadId}-${replyCounter}">回覆</button><a href="#" class="view-nested-replies-link" data-target-nested-replies="nested-replies-${parentThreadId}-${replyCounter}">查看回覆</a></div><div id="nested-replies-${parentThreadId}-${replyCounter}" class="nested-replies-container"></div><div id="reply-form-reply-${parentThreadId}-${replyCounter}" class="collapse mt-2"><textarea class="form-control form-control-sm" rows="2" placeholder="回覆此留言..."></textarea><button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="reply-${parentThreadId}-${replyCounter}">發送</button></div>`;
                        repliesContainer.appendChild(newReplyDiv);
                        replyTextarea.value = '';
                        const bsCollapseForm = bootstrap.Collapse.getInstance(thread.querySelector(`#reply-form-${parentThreadId}`));
                        bsCollapseForm.hide();

                        attachReplyEventListeners(newReplyDiv);
                    } else {
                        alert('請輸入您的回覆內容。');
                    }
                });
            }

            document.getElementById('new-title').value = '';
            document.getElementById('new-content').value = '';
        });
    }

    function attachReplyEventListeners(replyElement) {
        const replyToReplyButton = replyElement.querySelector('.reply-to-reply-btn');
        if (replyToReplyButton) {
            replyToReplyButton.addEventListener('click', function () {
                const replyId = this.dataset.replyId;
                let replyForm = replyElement.querySelector(`.nested-reply-form-${replyId}`);

                if (!replyForm) {
                    replyForm = document.createElement('div');
                    replyForm.className = `nested-reply-form-${replyId} mt-2`;
                    replyForm.innerHTML = `
                        <textarea class="form-control form-control-sm" rows="2" placeholder="請輸入您的回覆..."></textarea>
                        <button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="${replyId}">發送回覆</button>
                    `;
                    this.parentNode.insertAdjacentElement('afterend', replyForm);

                    const sendButton = replyForm.querySelector('.send-nested-reply-btn');
                    if (sendButton) {
                        sendButton.addEventListener('click', function () {
                            const parentReplyId = this.dataset.parentReplyId;
                            const replyTextarea = this.previousElementSibling;
                            const replyContent = replyTextarea.value.trim();
                            if (replyContent) {
                                nestedReplyCounter++;
                                const nestedRepliesContainer = replyElement.querySelector('.nested-replies-container');
                                const newNestedReplyDiv = document.createElement('div');
                                newNestedReplyDiv.className = 'reply nested-reply';
                                newNestedReplyDiv.innerHTML = `<small>U${nestedReplyCounter} (${getCurrentDate()})</small><p>${replyContent}</p><div class="reply-actions"><button class="btn btn-sm btn-outline-primary reply-to-reply-btn" data-reply-id="nested-reply-${parentReplyId}-${nestedReplyCounter}">回覆</button><a href="#" class="view-nested-replies-link" data-target-nested-replies="nested-replies-nested-reply-${parentReplyId}-${nestedReplyCounter}">查看回覆</a></div><div id="nested-replies-nested-reply-${parentReplyId}-${nestedReplyCounter}" class="nested-replies-container"></div><div id="reply-form-nested-reply-${parentReplyId}-${nestedReplyCounter}" class="collapse mt-2"><textarea class="form-control form-control-sm" rows="2" placeholder="回覆此留言..."></textarea><button class="btn btn-sm btn-primary mt-1 send-nested-reply-btn" data-parent-reply-id="nested-reply-${parentReplyId}-${nestedReplyCounter}">發送</button></div>`;
                                nestedRepliesContainer.appendChild(newNestedReplyDiv);
                                replyTextarea.value = '';
                                replyForm.remove();
                                attachReplyEventListeners(newNestedReplyDiv);
                            } else {
                                alert('請輸入您的回覆內容。');
                            }
                        });
                    }
                } else {
                    replyForm.remove();
                }
            });
        }

        const viewNestedRepliesLink = replyElement.querySelector('.view-nested-replies-link');
        if (viewNestedRepliesLink) {
            viewNestedRepliesLink.addEventListener('click', function (event) {
                event.preventDefault();
                const targetId = this.dataset.targetNestedReplies;
                const nestedRepliesContainer = document.getElementById(targetId);
                if (nestedRepliesContainer) {
                    const bsCollapse = new bootstrap.Collapse(nestedRepliesContainer);
                    bsCollapse.toggle();
                    this.textContent = nestedRepliesContainer.classList.contains('show') ? '收起回覆' : '查看回覆';
                }
            });
        }
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

    // 為初始載入的回覆綁定事件監聽器
    const initialReplies = document.querySelectorAll('.replies-container .reply');
    initialReplies.forEach(reply => attachReplyEventListeners(reply));

});


