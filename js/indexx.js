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

    // --- 動態載入教師資訊邏輯 ---

    // 個人基本資訊 DOM 元素
    const teacherName = document.getElementById('teacherName');
    const teacherDepartment = document.getElementById('teacherDepartment');
    const teacherEmail = document.getElementById('teacherEmail');
    const teacherPhone = document.getElementById('teacherPhone');
    const teacherLab = document.getElementById('teacherLab');
    // const teacherPhoto = document.getElementById('teacherPhoto'); // 如果需要動態載入照片路徑，請在 PHP 返回 photo_url 欄位

    // 學歷和專長 DOM 元素
    const educationList = document.getElementById('educationList');
    const specialtyList = document.getElementById('specialtyList');

    // 校內外經歷 DOM 元素
    const inExperienceList = document.getElementById('inExperienceList');
    const outExperienceList = document.getElementById('outExperienceList');

    // 設定要查詢的教師 ID
    const teacherId = 'T002'; // 這裡的 ID 應該與您資料庫中李榮三教授的 ID 相符

    /**
     * 根據教師 ID 從 API 獲取所有教師資訊。
     * @param {string} id - 教師的唯一 ID。
     */
    async function fetchAllTeacherInfo(id) {
        // 設定初始載入提示
        if (teacherName) teacherName.textContent = '載入中...';
        if (teacherDepartment) teacherDepartment.textContent = '載入中...';
        if (teacherEmail) teacherEmail.textContent = '載入中...';
        if (teacherPhone) teacherPhone.textContent = '載入中...';
        if (teacherLab) teacherLab.textContent = '載入中...';

        if (educationList) educationList.innerHTML = '<li class="list-group-item text-muted">載入學歷資料中...</li>';
        if (specialtyList) specialtyList.innerHTML = '<li class="list-group text-muted">載入專長資料中...</li>';
        if (inExperienceList) inExperienceList.innerHTML = '<li class="text-muted">載入校內經歷中...</li>';
        if (outExperienceList) outExperienceList.innerHTML = '<li class="text-muted">載入校外經歷中...</li>';


        try {
            // 構建 API URL。請確保 'teacher_info_get.php' 的路徑正確。
            // 根據您之前的確認，路徑為 'api/teacher_info_get.php'
            const apiUrl = `api/teacher_info_get.php?teacher_ID=${encodeURIComponent(id)}`;
            const response = await fetch(apiUrl);

            // 檢查 HTTP 響應是否成功 (status code 200-299)
            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }

            // 解析 JSON 響應
            const data = await response.json();

            // 檢查 API 返回的資料中是否有錯誤訊息
            if (data.error) {
                // 如果 API 返回錯誤訊息，則顯示錯誤
                const errorMessage = `載入失敗: ${data.error}`;
                if (teacherName) teacherName.textContent = '資料載入失敗';
                if (teacherDepartment) teacherDepartment.textContent = '';
                if (teacherEmail) teacherEmail.textContent = '';
                if (teacherPhone) teacherPhone.textContent = '';
                if (teacherLab) teacherLab.textContent = '';
                if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
                if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
                if (inExperienceList) inExperienceList.innerHTML = `<li class="text-danger">${errorMessage}</li>`;
                if (outExperienceList) outExperienceList.innerHTML = `<li class="text-danger">${errorMessage}</li>`;

            } else {
                // 填充個人基本資訊
                if (teacherName) teacherName.textContent = data.name || 'N/A';
                if (teacherDepartment) teacherDepartment.textContent = data.department || 'N/A';
                if (teacherEmail) {
                    teacherEmail.textContent = data.email || 'N/A';
                    teacherEmail.href = `mailto:${data.email}` || '#'; // 設定信箱連結
                }
                if (teacherPhone) teacherPhone.textContent = data.phone || 'N/A';
                if (teacherLab) teacherLab.textContent = data.lab || 'N/A';
                // 如果您的 PHP 返回了照片路徑，可以取消註釋下面這行
                // if (teacherPhoto && data.photo_url) teacherPhoto.src = data.photo_url;

                // 填充學歷 (Degrees)
                if (educationList) {
                    educationList.innerHTML = ''; // 清空載入中提示
                    if (data.degrees && data.degrees.length > 0) {
                        data.degrees.forEach(degree => {
                            const li = document.createElement('li');
                            li.className = 'list-group-item';
                            li.textContent = degree;
                            educationList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.className = 'list-group-item text-muted';
                        li.textContent = '無學歷資料';
                        educationList.appendChild(li);
                    }
                }

                // 填充專長 (Majors)
                if (specialtyList) {
                    specialtyList.innerHTML = ''; // 清空載入中提示
                    if (data.majors && data.majors.length > 0) {
                        data.majors.forEach(major => {
                            const li = document.createElement('li');
                            li.className = 'list-group'; // 保持 Bootstrap 樣式
                            li.textContent = major;
                            specialtyList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.className = 'list-group text-muted';
                        li.textContent = '無專長資料';
                        specialtyList.appendChild(li);
                    }
                }

                // 填充校內經歷 (in_experiences)
                if (inExperienceList) {
                    inExperienceList.innerHTML = '';
                    if (data.in_experiences && data.in_experiences.length > 0) {
                        data.in_experiences.forEach(exp => {
                            const li = document.createElement('li');
                            li.textContent = exp;
                            inExperienceList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.className = 'text-muted';
                        li.textContent = '無校內經歷資料';
                        inExperienceList.appendChild(li);
                    }
                }

                // 填充校外經歷 (out_experiences)
                if (outExperienceList) {
                    outExperienceList.innerHTML = '';
                    if (data.out_experiences && data.out_experiences.length > 0) {
                        data.out_experiences.forEach(exp => {
                            const li = document.createElement('li');
                            li.textContent = exp;
                            outExperienceList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.className = 'text-muted';
                        li.textContent = '無校外經歷資料';
                        outExperienceList.appendChild(li);
                    }
                }
            }
        } catch (error) {
            // 捕獲網路錯誤或 JSON 解析錯誤
            const errorMessage = `載入失敗: ${error.message}`;
            console.error('Fetch error:', error);

            // 顯示錯誤訊息到所有相關的 DOM 元素
            if (teacherName) teacherName.textContent = '資料載入失敗';
            if (teacherDepartment) teacherDepartment.textContent = '';
            if (teacherEmail) teacherEmail.textContent = '';
            if (teacherPhone) teacherPhone.textContent = '';
            if (teacherLab) teacherLab.textContent = '';

            if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
            if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
            if (inExperienceList) inExperienceList.innerHTML = `<li class="text-danger">${errorMessage}</li>`;
            if (outExperienceList) outExperienceList.innerHTML = `<li class="text-danger">${errorMessage}</li>`;
        }
    }

    // 頁面載入完成後立即查詢所有教師資訊
    fetchAllTeacherInfo(teacherId);
});
