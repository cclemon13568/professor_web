// js/stuu.js (或 study.js)

// 瀏覽列互動效果
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

    // --- 通用 API 請求函數 ---
    async function fetchData(url, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // 'Accept': 'application/json' // 可選，表示接受 JSON 回應
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // 嘗試解析錯誤訊息，即使狀態碼不是 2xx
                // 如果後端返回的不是 JSON (例如 PHP 錯誤的 HTML)，這裡會捕捉到並提供 fallback message
                const errorData = await response.json().catch(() => ({ message: response.statusText || '伺服器返回非JSON錯誤' }));
                throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API 請求錯誤 (${method} ${url}):`, error);
            // 重新拋出錯誤，讓調用者 (loadStudyPageData) 處理顯示
            throw error;
        }
    }


    // --- 動態載入教師資訊邏輯 ---

    // DOM 元素引用
    const publicationsTableBody = document.getElementById('publicationsTableBody');
    const projectsTableBody = document.getElementById('projectsTableBody');

    // 設定要查詢的教師 ID (根據您的需求，這可能來自 URL 參數或固定值)
    const teacherId = 'T002'; // 假設是李榮三教授的 ID

    // 新增「展開更多」按鈕的 ID
    const showMorePubsBtn = document.getElementById('showMorePubsBtn');
    const showMoreProjectsBtn = document.getElementById('showMoreProjectsBtn');

    // 設定預設顯示的行數
    const DEFAULT_VISIBLE_ROWS = 2;

    /**
     * 通用的表格「展開/收回」功能函數
     * @param {string} tableBodyId - 表格 tbody 的 ID
     * @param {string} buttonId - 展開/收回按鈕的 ID
     * @param {number} defaultRows - 預設顯示的行數
     */
    function setupTableToggle(tableBodyId, buttonId, defaultRows) {
        const tableBody = document.getElementById(tableBodyId);
        const toggleBtn = document.getElementById(buttonId);

        if (!tableBody || !toggleBtn) {
            console.warn(`setupTableToggle: Missing element(s) for tableBodyId: ${tableBodyId} or buttonId: ${buttonId}`);
            return; // 元素不存在，直接返回
        }

        const rows = Array.from(tableBody.children); // 獲取所有行 (tr)
        const totalRows = rows.length;

        if (totalRows <= defaultRows) {
            toggleBtn.style.display = 'none'; // 如果總行數小於等於預設行數，則隱藏按鈕
            return;
        }

        // 預設隱藏多餘的行
        for (let i = defaultRows; i < totalRows; i++) {
            rows[i].classList.add('hidden-row'); // 添加一個 CSS class 來隱藏
        }
        toggleBtn.textContent = '展開更多';
        toggleBtn.style.display = 'block'; // 確保按鈕顯示

        toggleBtn.addEventListener('click', function () {
            if (rows[defaultRows].classList.contains('hidden-row')) {
                // 顯示所有隱藏的行
                for (let i = defaultRows; i < totalRows; i++) {
                    rows[i].classList.remove('hidden-row');
                }
                this.textContent = '收回';
            } else {
                // 隱藏多餘的行
                for (let i = defaultRows; i < totalRows; i++) {
                    rows[i].classList.add('hidden-row');
                }
                this.textContent = '展開更多';
                // (可選) 捲動到按鈕上方，這裡取消註釋以啟用
                // this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }


    /**
     * 載入並顯示教師的論文和研究計畫資訊。
     * @param {string} id - 教師的唯一 ID。
     */
    async function loadStudyPageData(id) {
        // 設定初始載入提示
        if (publicationsTableBody) publicationsTableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">載入論文資訊中...</td></tr>';
        if (projectsTableBody) projectsTableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">載入研究計畫中...</td></tr>';

        // 隱藏按鈕直到數據加載完成
        if (showMorePubsBtn) showMorePubsBtn.style.display = 'none';
        if (showMoreProjectsBtn) showMoreProjectsBtn.style.display = 'none';

        try {
            // 使用整合後的 fetchData 函數
            // 注意: 這裡的 API 路徑是相對路徑，請確認其正確性
            // 如果您的檔案結構是 professor_web/api/teacher_extended_info.php
            // 而您的 HTML 檔案是 professor_web/study.html
            // 那麼路徑應該是 'api/teacher_extended_info.php'
            const data = await fetchData(`api/teacher_extended_info.php?teacher_ID=${encodeURIComponent(id)}`, 'GET');

            const extendedData = data.data; // 確保取得 data 屬性，因為您的 API 返回 { success: true, data: {...} }
            
            console.log("從API獲取的論文資料:", extendedData.publications);
            console.log("從API獲取的研究計畫資料:", extendedData.projects);
            // 確認這裡的陣列長度是否包含你資料庫中所有筆數
            console.log("論文資料筆數:", extendedData.publications ? extendedData.publications.length : 0);
            console.log("研究計畫資料筆數:", extendedData.projects ? extendedData.projects.length : 0);

            // --- 填充論文資訊 (Publications) ---
            if (publicationsTableBody) {
                publicationsTableBody.innerHTML = ''; // 清空載入中提示
                if (extendedData.publications && extendedData.publications.length > 0) {
                    extendedData.publications.forEach(pub => {
                        console.log("正在渲染論文:", pub.paper_ID); // 用於除錯
                        const tr = document.createElement('tr');
                        // 確保這裡的 `paper_link` 有值才生成連結
                        tr.innerHTML = `
                            <td><span class="paper-title-span">論文名稱: ${pub.paper_topic || 'N/A'} (${pub.paper_year || 'N/A'})</span></td>
                            <td><span class="paper-authors-span">作者群: ${pub.paper_authors || 'N/A'}</span></td>
                            <td><span class="paper-journal-span">期刊名稱: ${pub.paper_link && pub.paper_link.includes('(SCIE)') ? pub.paper_link : 'N/A'}</span></td>
                        `;
                        publicationsTableBody.appendChild(tr);
                    });
                    // 資料填充後，設定論文表格的展開/收回功能
                    setupTableToggle('publicationsTableBody', 'showMorePubsBtn', DEFAULT_VISIBLE_ROWS);
                } else {
                    publicationsTableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">無論文資訊</td></tr>';
                }
            }

            // --- 填充研究計畫 (Projects) ---
            if (projectsTableBody) {
                projectsTableBody.innerHTML = ''; // 清空載入中提示
                if (extendedData.projects && extendedData.projects.length > 0) {
                    extendedData.projects.forEach(project => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="project-id-span">${project.project_ID || 'N/A'}</span></td>
                            <td><span class="project-role-span">${project.project_role || 'N/A'}</span></td>
                            <td><span class="project-period-span">${project.project_period || 'N/A'}</span></td>
                            <td><span class="project-organization-span">${project.project_organization || 'N/A'}</span></td>
                        `;
                        projectsTableBody.appendChild(tr);
                    });
                    // 資料填充後，設定研究計畫表格的展開/收回功能
                    setupTableToggle('projectsTableBody', 'showMoreProjectsBtn', DEFAULT_VISIBLE_ROWS);
                } else {
                    projectsTableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">無研究計畫</td></tr>';
                }
            }

        } catch (error) {
            // 從 fetchData 拋出的錯誤會在這裡被捕捉
            const errorMessage = `載入資料失敗: ${error.message}`;

            // 在所有相關的 DOM 元素中顯示錯誤訊息
            if (publicationsTableBody) publicationsTableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${errorMessage}</td></tr>`;
            if (projectsTableBody) projectsTableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${errorMessage}</td></tr>`;

            // 出錯時也隱藏按鈕
            if (showMorePubsBtn) showMorePubsBtn.style.display = 'none';
            if (showMoreProjectsBtn) showMoreProjectsBtn.style.display = 'none';
        }
    }

    // 頁面載入完成後，呼叫載入研究頁面資料的函數
    loadStudyPageData(teacherId);
});