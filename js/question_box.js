document.addEventListener('DOMContentLoaded', function() {
    const questionButton = document.getElementById('question-icon-button');
    const questionModal = document.getElementById('question-modal');
    const closeButton = document.querySelector('#question-modal .close-button');
    const sendButton = document.getElementById('send-question-button');
    const nameInput = document.getElementById('question-name');
    const deptInput = document.getElementById('question-dept');
    const titleInput = document.getElementById('question-title');
    const contentTextarea = document.getElementById('question-content');
    const questionResponse = document.getElementById('question-response');
    const responseText = document.getElementById('response-text');

    // 開關浮框
    questionButton.addEventListener('click', function() {
        questionModal.classList.toggle('hidden');
        responseText.textContent = '';
        questionResponse.classList.add('hidden');
    });
    closeButton.addEventListener('click', function() {
        questionModal.classList.add('hidden');
        responseText.textContent = '';
        questionResponse.classList.add('hidden');
    });
    window.addEventListener('click', function(event) {
        if (event.target === questionModal) {
            questionModal.classList.add('hidden');
            responseText.textContent = '';
            questionResponse.classList.add('hidden');
        }
    });

    // 發送問題
    sendButton.addEventListener('click', async function() {
        const name = nameInput.value.trim();
        const dept = deptInput.value.trim();
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        if (!name || !dept || !title || !content) {
            alert('請完整填寫所有欄位');
            return;
        }
        try {
            const res = await fetch('api/message_board.php', {
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
                responseText.textContent = '您的問題已送出！';
                questionResponse.classList.remove('hidden');
                nameInput.value = '';
                deptInput.value = '';
                titleInput.value = '';
                contentTextarea.value = '';
            } else {
                responseText.textContent = result.message || '發送失敗';
                questionResponse.classList.remove('hidden');
            }
        } catch (e) {
            responseText.textContent = '發送失敗，請稍後再試';
            questionResponse.classList.remove('hidden');
        }
    });
});