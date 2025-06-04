document.addEventListener("DOMContentLoaded", () => {
    // 瀏覽列互動效果
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

    // 登入表單動態處理
    const form = document.querySelector('form');
    if (!form) return;

    // 動態插入驗證碼欄位（初始隱藏）
    let codeGroup = document.createElement('div');
    codeGroup.className = "mb-3";
    codeGroup.id = "verification_code_group";
    codeGroup.style.display = "none";
    codeGroup.innerHTML = `
        <label for="verification_code" class="form-label">驗證碼：</label>
        <input type="text" id="verification_code" name="verification_code" class="form-control">
    `;
    form.insertBefore(codeGroup, form.querySelector('button[type="submit"]'));

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 取得欄位值
        const account = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const codeInput = document.getElementById('verification_code');
        const code = codeInput ? codeInput.value : '';

        fetch('api/process_login pro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                professor_accountnumber: account,
                professor_password: password,
                verification_code: code
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.step === 'code_sent') {
                    alert(data.message); // 驗證碼已寄出
                    document.getElementById('verification_code_group').style.display = 'block';
                } else if (data.redirect_url) {
                    localStorage.setItem('isLoggedIn', 'true'); // 登入成功，設置狀態
                    window.location.href = data.redirect_url;
                } else {
                    alert(data.message);
                }
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            alert('登入失敗，請稍後再試');
            console.error(err);
        });
    });
});