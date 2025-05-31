document.addEventListener("DOMContentLoaded", () => {
    // 瀏覽列互動效果
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
    const teacherDepartment = document.getElementById('teacherDepartment'); // 資料庫中沒有這個欄位
    const teacherEmail = document.getElementById('teacherEmail');
    const teacherPhone = document.getElementById('teacherPhone');     // 資料庫中沒有這個欄位
    const teacherLab = document.getElementById('teacherLab');       // 資料庫中是 office_location
    // const teacherPhoto = document.getElementById('teacherPhoto'); 

    // 學歷和專長 DOM 元素
    const educationList = document.getElementById('educationList');
    const specialtyList = document.getElementById('specialtyList');

    // 設定要查詢的教師 ID
    const teacherId = 'T002'; 

    /**
     * 根據教師 ID 從 API 獲取教師個人資訊、學歷與專長。
     * @param {string} id - 教師的唯一 ID。
     */
    async function fetchTeacherCoreInfo(id) {
        // 設定初始載入提示
        if (teacherName) teacherName.textContent = '載入中...';
        if (teacherDepartment) teacherDepartment.textContent = '載入中...';
        if (teacherEmail) teacherEmail.textContent = '載入中...';
        if (teacherPhone) teacherPhone.textContent = '載入中...';
        if (teacherLab) teacherLab.textContent = '載入中...';

        if (educationList) educationList.innerHTML = '<li class="list-group-item text-muted">載入學歷資料中...</li>';
        if (specialtyList) specialtyList.innerHTML = '<li class="list-group text-muted">載入專長資料中...</li>';

        try {
            const apiUrl = `api/teacher_info_get.php?teacher_ID=${encodeURIComponent(id)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                const errorMessage = `資料載入失敗: ${data.error}`;
                if (teacherName) teacherName.textContent = '資料載入失敗';
                if (teacherDepartment) teacherDepartment.textContent = '';
                if (teacherEmail) teacherEmail.textContent = '';
                if (teacherPhone) teacherPhone.textContent = '';
                if (teacherLab) teacherLab.textContent = '';
                if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
                if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;

            } else {
                // 填充個人基本資訊 - **請修改這裡以匹配資料庫欄位名稱**
                if (teacherName) teacherName.textContent = data.teacher_name || 'N/A'; // 來自資料庫的 teacher_name
                // 注意：資料庫沒有 department 欄位，這會顯示 N/A
                if (teacherDepartment) teacherDepartment.textContent = data.department || 'N/A'; 
                if (teacherEmail) {
                    teacherEmail.textContent = data.teacher_email || 'N/A'; // 來自資料庫的 teacher_email
                    teacherEmail.href = `mailto:${data.teacher_email}` || '#'; 
                }
                // 注意：資料庫沒有 phone 欄位，這會顯示 N/A
                if (teacherPhone) teacherPhone.textContent = data.phone || 'N/A'; 
                if (teacherLab) teacherLab.textContent = data.office_location || 'N/A'; // 來自資料庫的 office_location

                // 填充學歷 (Degrees)
                if (educationList) {
                    educationList.innerHTML = ''; 
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
                    specialtyList.innerHTML = ''; 
                    if (data.majors && data.majors.length > 0) {
                        data.majors.forEach(major => {
                            const li = document.createElement('li');
                            li.className = 'list-group'; 
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
            }
        } catch (error) {
            const errorMessage = `資料載入失敗: ${error.message}`;
            console.error('Fetch error:', error);

            if (teacherName) teacherName.textContent = '資料載入失敗';
            if (teacherDepartment) teacherDepartment.textContent = '';
            if (teacherEmail) teacherEmail.textContent = '';
            if (teacherPhone) teacherPhone.textContent = '';
            if (teacherLab) teacherLab.textContent = '';

            if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
            if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
        }
    }

    fetchTeacherCoreInfo(teacherId);
});