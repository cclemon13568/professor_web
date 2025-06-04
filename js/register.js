document.addEventListener('DOMContentLoaded', function () {
    const teacherIdInput = document.getElementById('teacherId'); // 教師ID，僅用於註冊時
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const verificationCodeInput = document.getElementById('verification_code');

    const registerBtn = document.getElementById('registerBtn'); // 註冊按鈕
    const verifyBtn = document.getElementById('verifyBtn'); // 送出驗證碼按鈕

    const verificationCodeGroup = document.getElementById('verification_code_group'); // 驗證碼輸入框的容器
    // 假設你新增了 <div id="initialInputsGroup"> 來包裝教師ID、帳號、密碼輸入框和註冊按鈕
    const initialInputsGroup = document.getElementById('initialInputsGroup'); 

    // 從 sessionStorage 讀取暫存的帳號和密碼
    let storedUsername = sessionStorage.getItem('pendingVerificationUsername');
    let storedPassword = sessionStorage.getItem('pendingVerificationPassword');

    // 頁面載入時的 UI 狀態判斷
    if (storedUsername && storedPassword) {
        // 如果 sessionStorage 中有暫存的帳號密碼，說明用戶可能已經完成了第一步，正在等待輸入驗證碼
        // 顯示驗證碼輸入框
        if (verificationCodeGroup) {
            verificationCodeGroup.style.display = 'block';
        }
        if (verifyBtn) {
            verifyBtn.style.display = 'block';
        }

        // 預填充帳號和密碼，並禁用原始輸入框和註冊按鈕
        usernameInput.value = storedUsername;
        passwordInput.value = storedPassword;
        teacherIdInput.disabled = true; // 教師ID也禁用，因為註冊已完成
        usernameInput.disabled = true;
        passwordInput.disabled = true;

        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.style.opacity = '0.5';
            registerBtn.style.cursor = 'not-allowed';
        }
    } else {
        // 預設狀態：隱藏驗證碼輸入框和驗證按鈕
        if (verificationCodeGroup) {
            verificationCodeGroup.style.display = 'none';
        }
        if (verifyBtn) {
            verifyBtn.style.display = 'none';
        }
    }

    // --- 註冊按鈕點擊事件 (第一階段：發送帳密給後端以獲取驗證碼) ---
    if (registerBtn) {
        registerBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const teacherId = teacherIdInput.value.trim();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            let message = '';
            if (!teacherId) message += '請輸入教師ID。\n';
            if (!username) message += '請輸入帳號。\n';
            if (!password) message += '請輸入密碼。\n';
            if (password.length > 0 && password.length < 6) message += '密碼長度至少6個字元。\n';

            if (message) {
                alert(message);
                return;
            }

            try {
                // 發送請求到註冊 API (api/register_info.php) 處理註冊和發送郵件
                const registerResponse = await fetch('api/login_info.php', { // <-- 呼叫註冊 API
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacher_ID: teacherId,
                        professor_accountnumber: username,
                        professor_password: password
                    })
                });

                const registerData = await registerResponse.json();

                if (registerData.success) {
                    alert(registerData.message); // 顯示「註冊成功，已發送驗證碼至教授信箱」

                    // 註冊成功後，嘗試發送帳密到登入API以觸發驗證碼發送
                    // 這裡其實是利用 login API 的「無驗證碼則發送」的特性
                    const loginApiRequest = await fetch('api/process_login pro.php', { // <-- 呼叫登入 API
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            professor_accountnumber: username,
                            professor_password: password,
                            // 不包含 verification_code，讓後端知道要發送驗證碼
                            verification_code: '' // 明確傳遞空字串
                        })
                    });

                    const loginApiData = await loginApiRequest.json();

                    if (loginApiData.success && loginApiData.step === "code_sent") {
                        alert(loginApiData.message); // 顯示「驗證碼已寄出至教師信箱」

                        // 儲存帳號和密碼到 sessionStorage
                        sessionStorage.setItem('pendingVerificationUsername', username);
                        sessionStorage.setItem('pendingVerificationPassword', password);

                        // 顯示驗證碼輸入框和驗證按鈕
                        if (verificationCodeGroup) {
                            verificationCodeGroup.style.display = 'block';
                        }
                        if (verifyBtn) {
                            verifyBtn.style.display = 'block';
                        }
                        
                        // 禁用註冊按鈕和帳號密碼輸入框
                        if (registerBtn) {
                            registerBtn.disabled = true;
                            registerBtn.style.opacity = '0.5';
                            registerBtn.style.cursor = 'not-allowed';
                        }
                        teacherIdInput.disabled = true;
                        usernameInput.disabled = true;
                        passwordInput.disabled = true;

                    } else if (!loginApiData.success) {
                        alert(loginApiData.message || '無法發送驗證碼，請檢查帳號密碼。');
                    } else {
                        // 這種情況不應該發生，但作為防禦性編程
                        alert("未知錯誤：無法從登入API獲取驗證碼。");
                    }

                } else {
                    alert(registerData.message || '註冊失敗');
                }
            } catch (error) {
                console.error('Error during registration or sending code:', error);
                alert('操作失敗，請稍後再試。');
            }
        });
    }

    // --- 驗證碼送出按鈕點擊事件 (第二階段：發送帳密和驗證碼進行最終登入) ---
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const verificationCode = verificationCodeInput.value.trim();
            
            // 從 sessionStorage 讀取之前註冊成功後儲存的帳號和密碼
            const accountForVerification = sessionStorage.getItem('pendingVerificationUsername');
            const passwordForVerification = sessionStorage.getItem('pendingVerificationPassword');


            let message = '';
            if (!accountForVerification || !passwordForVerification) {
                message += '帳號或密碼資訊遺失，請重新註冊或登入。\n';
            }
            if (!verificationCode) {
                message += '請輸入驗證碼。\n';
            }

            if (message) {
                alert(message);
                return;
            }

            try {
                // 發送請求到登入 API 進行帳密和驗證碼驗證
                const response = await fetch('api/process_login pro.php', { // <-- 呼叫登入 API
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        professor_accountnumber: accountForVerification, // 使用 session storage 的帳號
                        professor_password: passwordForVerification,     // 使用 session storage 的密碼
                        verification_code: verificationCode            // 使用用戶輸入的驗證碼
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    sessionStorage.removeItem('pendingVerificationUsername'); // 成功後清除
                    sessionStorage.removeItem('pendingVerificationPassword'); // 成功後清除
                    if (data.redirect_url) {
                        window.location.href = data.redirect_url;
                    }
                } else {
                    alert(data.message || '驗證失敗');
                }
            } catch (error) {
                console.error('Error during verification:', error);
                alert('驗證失敗，請稍後再試。');
            }
        });
    }
});