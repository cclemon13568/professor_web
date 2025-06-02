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

    // 登入表單 AJAX 串接
    const loginForm = document.querySelector('form[action="process_login.php"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(loginForm);
            const data = {
                professor_accountnumber: formData.get('username'),
                professor_password: formData.get('password')
            };

            fetch('api/login_info.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    alert('登入成功！');
                    window.location.href = 'index.html';
                } else {
                    alert(result.message || '登入失敗');
                }
            })
            .catch(err => {
                alert('伺服器錯誤，請稍後再試');
            });
        });
    }
});