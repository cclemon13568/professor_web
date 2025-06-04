document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById('login-btn');
    function updateLoginButton() {
        if (!loginBtn) return;
        if (localStorage.getItem('isLoggedIn') === 'true') {
            loginBtn.textContent = '登出(李榮三教授)';
            loginBtn.classList.remove('btn-outline-light');
            loginBtn.classList.add('btn-warning');
            loginBtn.href = "#";
        } else {
            loginBtn.textContent = '登入';
            loginBtn.classList.remove('btn-warning');
            loginBtn.classList.add('btn-outline-light');
            loginBtn.href = "login.html";
        }
    }
    updateLoginButton();
    if (loginBtn) {
        loginBtn.addEventListener('click', function (e) {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                e.preventDefault();
                if (confirm('確定要登出嗎?')) {
                    localStorage.removeItem('isLoggedIn');
                    updateLoginButton();
                    window.location.href = 'index.html';
                }
            }
        });
    }
});