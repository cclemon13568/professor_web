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

    // --- 動態載入教師資訊邏輯 ---

    // 個人基本資訊 DOM 元素
    const teacherName = document.getElementById('teacherName');
    const teacherEmail = document.getElementById('teacherEmail');
    const teacherPhone = document.getElementById('teacherPhone');
    const teacherLab = document.getElementById('teacherLab');
    const teacherSelfIntroduction = document.getElementById('teacher_intro');
    // 新增校內、校外經歷 DOM 元素
    const teacherExpIn = document.getElementById('inExperienceList');
    const teacherExpOut = document.getElementById('outExperienceList');

    // 學歷和專長 DOM 元素
    const educationList = document.getElementById('educationList');
    const specialtyList = document.getElementById('specialtyList');

    // 設定要查詢的教師 ID
    const teacherId = 'T002';


function renderExperienceList(list, container, moreBtnId, type) {
    container.innerHTML = '';
    let showCount = 3;
    const moreBtn = document.getElementById(moreBtnId);
    if (moreBtn) moreBtn.remove();

    if (Array.isArray(list) && list.length > 0) {
        list.forEach((exp, idx) => {
            const li = document.createElement('li');
            li.textContent = exp.experience;
            if (idx >= showCount) {
                li.style.display = 'none';
                li.classList.add('exp-hidden');
            }
            container.appendChild(li);
        });

        if (list.length > showCount) {
            const btn = document.createElement('button');
            btn.textContent = '展示更多';
            btn.className = 'btn btn-link p-0';
            btn.id = moreBtnId;
            btn.onclick = function () {
                const hiddenItems = container.querySelectorAll('.exp-hidden');
                hiddenItems.forEach(item => item.style.display = '');
                btn.style.display = 'none';
            };
            container.parentNode.appendChild(btn);
        }
    } else {
        const li = document.createElement('li');
        li.className = 'text-muted';
        li.textContent = type === 'in' ? '無校內經歷' : '無校外經歷';
        container.appendChild(li);
    }
}



    /**
     * 同時取得教師基本資料與經歷資料
     */
    async function fetchTeacherAllInfo(id) {
        // 初始載入提示
        if (teacherName) teacherName.textContent = '載入中...';
        if (teacherEmail) teacherEmail.textContent = '載入中...';
        if (teacherPhone) teacherPhone.textContent = '載入中...';
        if (teacherLab) teacherLab.textContent = '載入中...';
        if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = '載入中...';
        if (educationList) educationList.innerHTML = '<li class="list-group-item text-muted">載入學歷資料中...</li>';
        if (specialtyList) specialtyList.innerHTML = '<li class="list-group text-muted">載入專長資料中...</li>';
        if (teacherExpIn) teacherExpIn.textContent = '載入中...';
        if (teacherExpOut) teacherExpOut.textContent = '載入中...';

        try {
            // 同時呼叫兩個 API
            const [coreRes, extRes] = await Promise.all([
                fetch(`api/teacher_info_get.php?teacher_ID=${encodeURIComponent(id)}`),
                fetch(`api/teacher_extended_info.php?teacher_ID=${encodeURIComponent(id)}`)
            ]);

            if (!coreRes.ok) throw new Error('核心資料載入失敗');
            if (!extRes.ok) throw new Error('經歷資料載入失敗');

            const coreData = await coreRes.json();
            const extData = await extRes.json();

            console.log('extData:', extData);

            // 處理基本資料
            if (coreData.error) {
                const errorMessage = `資料載入失敗: ${coreData.error}`;
                if (teacherName) teacherName.textContent = '資料載入失敗';
                if (teacherEmail) teacherEmail.textContent = '';
                if (teacherPhone) teacherPhone.textContent = '';
                if (teacherLab) teacherLab.textContent = '';
                if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = errorMessage;
                if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
                if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
            } else {
                if (teacherName) teacherName.textContent = coreData.teacher_name || 'N/A';
                if (teacherEmail) {
                    teacherEmail.textContent = coreData.teacher_email || 'N/A';
                    teacherEmail.href = `mailto:${coreData.teacher_email}` || '#';
                }
                if (teacherPhone) teacherPhone.textContent = coreData.phone || 'N/A';
                if (teacherLab) teacherLab.textContent = coreData.office_location || 'N/A';
                if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = coreData.teacher_intro || 'N/A';

                // 學歷
                if (educationList) {
                    educationList.innerHTML = '';
                    if (coreData.degrees && coreData.degrees.length > 0) {
                        coreData.degrees.forEach(degree => {
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

                // 專長
                if (specialtyList) {
                    specialtyList.innerHTML = '';
                    if (coreData.majors && coreData.majors.length > 0) {
                        coreData.majors.forEach(major => {
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

            // 處理校內經歷
            // 處理校內經歷
            if (teacherExpIn) {
                teacherExpIn.innerHTML = '';
                const campusList = extData.data && extData.data.campus_experience ? extData.data.campus_experience : [];
                if (Array.isArray(campusList) && campusList.length > 0) {
                    campusList.forEach(exp => {
                        const li = document.createElement('li');
                        li.textContent = exp.experience; // 注意：exp 是物件，要取 experience 欄位
                        teacherExpIn.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.className = 'text-muted';
                    li.textContent = '無校內經歷';
                    teacherExpIn.appendChild(li);
                }
            }

            // 處理校外經歷
            if (teacherExpOut) {
                teacherExpOut.innerHTML = '';
                const externalList = extData.data && extData.data.external_experience ? extData.data.external_experience : [];
                if (Array.isArray(externalList) && externalList.length > 0) {
                    externalList.forEach(exp => {
                        const li = document.createElement('li');
                        li.textContent = exp.experience; // 注意：exp 是物件，要取 experience 欄位
                        teacherExpOut.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.className = 'text-muted';
                    li.textContent = '無校外經歷';
                    teacherExpOut.appendChild(li);
                }
            }

        } catch (error) {
            const errorMessage = `資料載入失敗: ${error.message}`;
            console.error('Fetch error:', error);

            if (teacherName) teacherName.textContent = '資料載入失敗';
            if (teacherEmail) teacherEmail.textContent = '';
            if (teacherPhone) teacherPhone.textContent = '';
            if (teacherLab) teacherLab.textContent = '';
            if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = errorMessage;
            if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
            if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
            if (teacherExpIn) teacherExpIn.textContent = '載入失敗';
            if (teacherExpOut) teacherExpOut.textContent = '載入失敗';
        }
    }

    fetchTeacherAllInfo(teacherId);
});