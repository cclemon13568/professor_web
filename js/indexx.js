console.log('indexx.js loaded');

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
    // 校內、校外經歷 DOM 元素
    const teacherExpIn = document.getElementById('inExperienceList');
    const teacherExpOut = document.getElementById('outExperienceList');
    // 學歷和專長 DOM 元素
    const educationList = document.getElementById('educationList');
    const specialtyList = document.getElementById('specialtyList');

    // 設定要查詢的教師 ID
    const teacherId = 'T002';

    // 經歷列表渲染（如需展示更多功能可用此函式）
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

        console.log('teacherName:', teacherName);
        console.log('teacherEmail:', teacherEmail);
        console.log('teacherLab:', teacherLab);
        console.log('teacherSelfIntroduction:', teacherSelfIntroduction);
        console.log('educationList:', educationList);
        console.log('specialtyList:', specialtyList);
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

            console.log('coreData', coreData); // <-- 這就是你問的位置，它已經在這裡了！
            // 處理基本資料
            if (!coreData.success) {
                const errorMessage = `資料載入失敗: ${coreData.message || '未知錯誤'}`;
                if (teacherName) teacherName.textContent = '資料載入失敗';
                if (teacherEmail) teacherEmail.textContent = '';
                if (teacherPhone) teacherPhone.textContent = '';
                if (teacherLab) teacherLab.textContent = '';
                if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = errorMessage;
                if (educationList) educationList.innerHTML = `<li class="list-group-item text-danger">${errorMessage}</li>`;
                if (specialtyList) specialtyList.innerHTML = `<li class="list-group text-danger">${errorMessage}</li>`;
            } else {
                // 個人資訊
                if (teacherName) teacherName.textContent = coreData.data.teacher_name || 'N/A';
                if (teacherEmail) {
                    teacherEmail.textContent = coreData.data.teacher_email || 'N/A';
                    teacherEmail.href = coreData.data.teacher_email ? `mailto:${coreData.data.teacher_email}` : '#';
                }
                if (teacherPhone) teacherPhone.textContent = coreData.data.phone || 'N/A';
                if (teacherLab) teacherLab.textContent = coreData.data.office_location || 'N/A';
                if (teacherSelfIntroduction) teacherSelfIntroduction.textContent = coreData.data.teacher_intro || 'N/A';

                // 學歷
                if (educationList) {
                    educationList.innerHTML = '';
                    if (coreData.data.degrees && coreData.data.degrees.length > 0) {
                        coreData.data.degrees.forEach(degreeObj => {
                            const li = document.createElement('li');
                            li.className = 'list-group-item';
                            li.textContent = degreeObj.degree; // 取 degree 欄位
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
                    if (coreData.data.majors && coreData.data.majors.length > 0) {
                        coreData.data.majors.forEach(majorObj => {
                            const li = document.createElement('li');
                            li.className = 'list-group';
                            li.textContent = majorObj.major; // 取 major 欄位
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
            if (teacherExpIn) {
                teacherExpIn.innerHTML = '';
                const campusList = extData.data && extData.data.campus_experience ? extData.data.campus_experience : [];
                if (Array.isArray(campusList) && campusList.length > 0) {
                    campusList.forEach(exp => {
                        const li = document.createElement('li');
                        li.textContent = exp.experience;
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
                        li.textContent = exp.experience;
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