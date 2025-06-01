const dataArea = document.querySelector('.main-content #data-area'); 
const moduleTitleElement = document.getElementById('module-title');
let currentModule = ''; // 用於追蹤當前選中的模組

const modulesConfig = {
    message_board: {
        title: '留言管理',
        apiEndpoint: 'http://localhost/professor_web/api/message_board.php', // 對應 message_board 表
        fields: {
            question_ID: { label: '問題ID', type: 'text', readOnly: true }, // 主鍵通常為 readOnly
            question_name: { label: '提問者姓名', type: 'text' },
            question_department: { label: '提問者系所', type: 'text' },
            question_title: { label: '問題標題', type: 'text' }, // 雖然是 TEXT，但這裡通常顯示單行
            question_content: { label: '問題內容', type: 'textarea', canTruncate: true }, // 設置為 textarea 且可截斷
            popular_question: { label: '熱門問題', type: 'text' } // 考慮使用 select 類型實現 是/否
        },
        actions: ['edit', 'delete']
    },
    appointment: {
        title: '預約管理',
        apiEndpoint: 'http://localhost/professor_web/api/appointment_info.php', // 對應 appointment_info 表
        fields: {
            appointment_ID: { label: '預約ID', type: 'text', readOnly: true }, // 主鍵
            office_location: { label: '辦公室位置', type: 'text' },
            appoint_Date: { label: '預約日期', type: 'datetime-local' }, // 根據你的資料庫 datetime 類型調整
            status: {
                label: '狀態',
                type: 'select', // <--- **修改為 'select'**
                options: [       // <--- **新增 options 陣列**
                    { value: 0, label: '預約失敗' },
                    { value: 1, label: '預約成功' },
                    { value: 2, label: '審查中' }
                ],
                displayField: 'status_display' // <--- **新增這行！用於表格顯示**
            },
            student_ID: { label: '學生ID', type: 'text' },
            student_Name: { label: '學生姓名', type: 'text' },
            student_email: { label: '學生EMAIL', type: 'text' },
            course_ID: { label: '課程ID', type: 'text' },
            problem_description: { label: '問題描述', type: 'textarea', canTruncate: true } // 設置為 textarea 且可截斷
        },
        actions: ['edit', 'delete']
    },
    evaluation: {
        title: '評論管理',
        apiEndpoint: 'http://localhost/professor_web/api/evaluation.php', // 對應 evaluation 表
        fields: {
            evaluate_ID: { label: '評論ID', type: 'text', readOnly: true }, // 主鍵
            student_ID: { label: '學生ID', type: 'text' },
            course_period: { label: '學期', type: 'text' },
            course_ID: { label: '課程ID', type: 'text'},
            evaluate: { label: '評論內容', type: 'textarea', canTruncate: true }, // 設置為 textarea 且可截斷
        },
        actions: ['delete']
    },
    course_info: {
        title: '課程管理',
        apiEndpoint: 'http://localhost/professor_web/api/course_info.php', // 對應 course_info 表
        fields: {
            course_ID: { label: '課程ID', type: 'text', readOnly: false }, // 主鍵，新增時可能可輸入，編輯時只讀
            course_name: { label: '課程名稱', type: 'text' },
            course_time: { label: '課程時間', type: 'text' },
            course_outline: { label: '課程大綱', type: 'textarea', canTruncate: true }, // 設置為 textarea 且可截斷
            teacher_ID: { label: '教師ID', type: 'text' },
            course_score: { label: '學分', type: 'number' } // 你的資料表是 varchar(300)，這裡用 number 可能需要後端轉換或前端處理
        },
        actions: ['edit', 'delete']
    },
    sensitive_words: { // 新增的敏感詞管理模組
        title: '敏感詞管理',
        apiEndpoint: 'http://localhost/professor_web/api/sensitive_words.php', // 假設你有 sensitive_words.php API
        fields: {
            word_ID: { label: '詞彙ID', type: 'text', readOnly: true }, // 主鍵
            word: { label: '敏感詞', type: 'text' }
        },
        actions: ['edit', 'delete'] // 敏感詞也應該可以編輯、刪除
    }
};

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
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'API 請求失敗');
        }
        return await response.json();
    } catch (error) {
        console.error(`API 請求錯誤 (${method} ${url}):`, error);
        throw error; // 將錯誤重新拋出，讓調用者處理
    }
}

// --- UI 輔助函數 ---

// 生成操作按鈕 HTML
function generateActionButtons(id, moduleName) {
    const config = modulesConfig[moduleName];
    if (!config || !config.actions) return ''; // 如果沒有配置操作，返回空字串

    let buttonsHtml = '<div class="action-buttons">';
    config.actions.forEach(action => {
        if (action === 'edit') {
            buttonsHtml += `<button class="edit-btn" data-id="${id}">編輯</button>`;
        } else if (action === 'delete') {
            buttonsHtml += `<button class="delete-btn" data-id="${id}">刪除</button>`;
        }
    });
    buttonsHtml += '</div>';
    return buttonsHtml;
}


// 根據數據生成表格 HTML
function generateTable(moduleName, dataRows) {
    const config = modulesConfig[moduleName];
    if (!config || !dataRows || dataRows.length === 0) {
        return `<p>此功能暫無數據。</p>`;
    }

    // 使用模組配置中定義的字段作為表頭順序
    const headers = Object.keys(config.fields);

    let tableHtml = `
        <div class="control-panel">
            <button onclick="openAddModal('${moduleName}')">新增資料</button>
            <input type="text" id="search-input" placeholder="查詢...">
            <button onclick="performSearch()">查詢</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th></th> `;
    headers.forEach(headerKey => {
        // 使用配置中的 label 作為顯示名稱
        tableHtml += `<th>${config.fields[headerKey].label}</th>`;
    });
    tableHtml += `
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    // 填充表格行
    dataRows.forEach(row => {
        tableHtml += `<tr><td><input type="checkbox"></td>`; // 複選框
        const idKey = Object.keys(config.fields)[0]; // 第一個字段通常是ID
        const rowId = row[idKey];

        headers.forEach(headerKey => {
            let displayValue = row[headerKey]; // 默認顯示原始值
            const fieldConfig = config.fields[headerKey]; // 獲取該欄位的配置

            // *** 重點修改這裡：檢查是否為 'status' 欄位，或者是否有指定 displayField ***
            if (headerKey === 'status' && row['status_display'] !== undefined) {
                displayValue = row['status_display'];
            } else if (fieldConfig.displayField && row[fieldConfig.displayField] !== undefined) {
                 // 如果配置中明確指定了 displayField，並且該欄位存在
                 displayValue = row[fieldConfig.displayField];
            }
            // 處理 null 或 undefined 顯示為空字串
            else if (displayValue === null || displayValue === undefined) {
                displayValue = '';
            }

            // 對於 'problem_description' 這種可能很長的文本，可以考慮截斷
            if (fieldConfig.canTruncate && displayValue.length > 50) { // 假設超過50個字元就截斷
                displayValue = displayValue.substring(0, 50) + '...';
            }


            tableHtml += `<td>${displayValue}</td>`; // 顯示數據
        });
        tableHtml += `<td>${generateActionButtons(rowId, moduleName)}</td></tr>`;
    });

    tableHtml += `
            </tbody>
        </table>
    `;
    return tableHtml;
}


// 載入模組內容 (更新為從 API 獲取數據)
async function loadModule(moduleName) {
    currentModule = moduleName;
    const config = modulesConfig[moduleName];

    if (!config) {
        moduleTitleElement.textContent = '錯誤：未知的模組';
        dataArea.innerHTML = '<p>請選擇一個有效的管理功能。</p>';
        return;
    }

    moduleTitleElement.textContent = config.title;
    dataArea.innerHTML = '<p>載入中...</p>'; // 顯示載入狀態

    // 處理側邊欄活躍狀態 (不修改 HTML 的前提下，這是最佳實踐)
    document.querySelectorAll('.sidebar ul li').forEach(li => {
        li.classList.remove('active');
    });
    const liElement = document.querySelector(`.sidebar ul li[onclick*="loadModule('${moduleName}')"]`);
    if (liElement) {
        liElement.classList.add('active');
    }

    // 新增：點選其他欄位時收起教師名單摺疊區塊
    const teacherList = document.getElementById('teacher-list');
    if (teacherList) {
        teacherList.style.display = 'none';
    }
    const teacherMenu = document.getElementById('teacher-menu');
    if (teacherMenu) {
        teacherMenu.classList.remove('active');
    }

    try {
        const data = await fetchData(config.apiEndpoint, 'GET');
        dataArea.innerHTML = generateTable(moduleName, data);
        addActionButtonListeners(); // 重新綁定事件
    } catch (error) {
        dataArea.innerHTML = `<p style="color: red;">載入資料失敗：${error.message}</p>`;
    }
}

// 添加操作按鈕的事件監聽器
function addActionButtonListeners() {
    dataArea.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.dataset.id;
            openEditModal(currentModule, id);
        };
    });
    dataArea.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.dataset.id;
            if (confirm(`確定要刪除 ID: ${id} 的資料嗎?`)) {
                deleteData(currentModule, id);
            }
        };
    });

    // 為查詢輸入框添加回車事件
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// 執行查詢（前端過濾）
// 注意：更實際的查詢應該是向 API 發送帶有查詢參數的 GET 請求
async function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const config = modulesConfig[currentModule];

    try {
        const allData = await fetchData(config.apiEndpoint, 'GET'); // 獲取所有數據
        if (!searchTerm) {
            dataArea.innerHTML = generateTable(currentModule, allData);
        } else {
            const filteredData = allData.filter(item => {
                for (const key in item) {
                    if (config.fields.hasOwnProperty(key) && String(item[key]).toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
                return false;
            });
            dataArea.innerHTML = generateTable(currentModule, filteredData);
        }
        addActionButtonListeners(); // 重新綁定事件
    } catch (error) {
        dataArea.innerHTML = `<p style="color: red;">查詢失敗：${error.message}</p>`;
    }
}


// --- 增刪改查實際功能 (與後端 API 交互) ---

// 刪除數據
async function deleteData(moduleName, idToDelete) {
    
    const config = modulesConfig[moduleName];
    const idKey = Object.keys(config.fields)[0]; // 獲取主鍵名
    const deleteUrl = `${config.apiEndpoint}?${idKey}=${idToDelete}`;

    try {
        const result = await fetchData(deleteUrl, 'DELETE');
        if (result && result.success) { // 假設後端返回 { success: true, message: "..." }
            alert(result.message);
        } else if (result && result.message) { // 如果後端返回 { success: false, message: "..." }
            alert(`刪除失敗：${result.message}`);
        } else {
            // 如果後端沒有明確的 success/message 字段，但 HTTP 狀態碼是成功的
            // 且 result 不是 undefined，則假設成功
            alert('刪除成功！'); // 這裡顯示「刪除成功」
        }
        loadModule(moduleName); // 重新載入頁面以更新顯示
    } catch (error) {
        // 如果 fetchData 拋出錯誤 (例如網路問題或伺服器非 2xx 響應)
        alert(`刪除失敗：${error.message}`);
    }
}

// 處理新增/編輯的模態框邏輯
let currentModalType = ''; // 'add' or 'edit'
let editingItemId = null; // 儲存當前編輯的項目ID

// 獲取模態框元素 (如果 HTML 中沒有模態框元素，則動態創建它)
let modal = document.querySelector('.modal');
if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="closeModal()">&times;</span>
            <h2 id="modal-title"></h2>
            <form id="data-form">
                <div class="form-buttons">
                    <button type="submit">儲存</button>
                    <button type="button" class="cancel-btn" onclick="closeModal()">取消</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

const dataForm = document.getElementById('data-form');
const modalTitle = document.getElementById('modal-title');
const formButtonsContainer = dataForm.querySelector('.form-buttons');


// 打開新增資料模態框
function openAddModal(moduleName, initialData = {}) {
    currentModalType = 'add';
    modalTitle.textContent = `新增 ${modulesConfig[moduleName].title} 資料`;
    generateFormFields(moduleName, initialData, 'add');

    modal.style.display = 'flex'; // 顯示模態框
}

// 打開編輯資料模態框
async function openEditModal(moduleName, id) {
    currentModalType = 'edit';
    editingItemId = id;
    modalTitle.textContent = `編輯 ${modulesConfig[moduleName].title} 資料`;
    const config = modulesConfig[moduleName];
    const idKey = Object.keys(config.fields)[0]; // 獲取主鍵名

    try {
        // 從 API 獲取單個條目數據
        const itemToEdit = await fetchData(`${config.apiEndpoint}?${idKey}=${id}`, 'GET');
        generateFormFields(moduleName, itemToEdit, 'edit');
        modal.style.display = 'flex'; // 顯示模態框
    } catch (error) {
        alert(`載入編輯資料失敗：${error.message}`);
        closeModal();
    }
}

// 關閉模態框
function closeModal() {
    modal.style.display = 'none';
    dataForm.reset(); // 重置表單
    editingItemId = null;
    currentModalType = '';
}

// 動態生成表單字段
function generateFormFields(moduleName, itemData, mode) {
    const config = modulesConfig[moduleName];
    let formHtml = '';

    // 將按鈕容器從表單中移除，以便重新生成字段
    const buttonsHtml = formButtonsContainer.outerHTML;
    dataForm.innerHTML = ''; // 清空表單內容

    Object.keys(config.fields).forEach(fieldKey => {
        const fieldConfig = config.fields[fieldKey];
        const label = fieldConfig.label;
        const type = fieldConfig.type;
        const readOnly = fieldConfig.readOnly;

        let inputTag = '';
        const currentValue = itemData[fieldKey] !== undefined ? itemData[fieldKey] : '';

        // 處理 ID 字段的只讀邏輯
        if (readOnly && mode === 'edit') {
            inputTag = `<input type="text" id="${fieldKey}" name="${fieldKey}" value="${currentValue}" readonly>`;
        } else if (readOnly && mode === 'add') { // 如果是新增模式但ID是只讀，則不顯示或留空
            // 某些ID可能是自動生成的，這裡可以選擇不顯示或顯示為自動生成
             inputTag = `<input type="text" id="${fieldKey}" name="${fieldKey}" value="" placeholder="系統自動生成 (或留空)" readonly>`;
        }
        else {
            switch (type) {
                case 'textarea':
                    inputTag = `<textarea id="${fieldKey}" name="${fieldKey}">${currentValue}</textarea>`;
                    break;
                case 'date':
                    // 處理日期格式，確保能正確設置 input type="date" 的值
                    let dateValue = '';
                    if (currentValue) {
                        try {
                            // 嘗試將資料庫返回的日期字串轉換為 'YYYY-MM-DD' 格式
                            const d = new Date(currentValue);
                            dateValue = d.toISOString().split('T')[0];
                        } catch (e) {
                            dateValue = currentValue; // 如果轉換失敗，保留原始值
                        }
                    }
                    inputTag = `<input type="date" id="${fieldKey}" name="${fieldKey}" value="${dateValue}">`;
                    break;
                case 'datetime-local':
                    // 處理 datetime-local 格式，需要 'YYYY-MM-DDTHH:mm'
                    let datetimeLocalValue = '';
                    if (currentValue) {
                         try {
                            const d = new Date(currentValue);
                            // toISOString() 格式為 "YYYY-MM-DDTHH:mm:ss.sssZ"
                            // 我們只需要 "YYYY-MM-DDTHH:mm"
                            datetimeLocalValue = d.toISOString().substring(0, 16);
                        } catch (e) {
                            datetimeLocalValue = currentValue;
                        }
                    }
                    inputTag = `<input type="datetime-local" id="${fieldKey}" name="${fieldKey}" value="${datetimeLocalValue}">`;
                    break;
                case 'select': // <-- **新增此 case 處理 select 類型**
                    let selectOptionsHtml = '';
                    fieldConfig.options.forEach(option => {
                        const selectedAttribute = (option.value === currentValue) ? 'selected' : '';
                        selectOptionsHtml += `<option value="${option.value}" ${selectedAttribute}>${option.label}</option>`;
                    });
                    inputTag = `<select id="${fieldKey}" name="${fieldKey}">${selectOptionsHtml}</select>`;
                    break;
                default:
                    inputTag = `<input type="${type}" id="${fieldKey}" name="${fieldKey}" value="${currentValue}">`;
                    break;
            }
        }
        
        // 將 ID 欄位在新增模式下設為可輸入，如果 config 允許的話
        // 你的 course_info.php 在 POST 時需要 course_ID，所以它應該可寫入
        if (fieldKey === Object.keys(config.fields)[0] && mode === 'add') {
             inputTag = `<input type="text" id="${fieldKey}" name="${fieldKey}" value="${currentValue}" ${fieldKey === 'course_ID' ? '' : 'readonly'}>`;
             // 上面針對 course_ID 移除了 readonly，讓它可以被輸入
        }


        formHtml += `
            <label for="${fieldKey}">${label}:</label>
            ${inputTag}
        `;
    });

    dataForm.innerHTML = formHtml;
    // 重新添加按鈕
    dataForm.appendChild(formButtonsContainer);

    // 重新綁定表單提交事件
    dataForm.onsubmit = function(e) {
        e.preventDefault(); // 阻止表單默認提交
        handleFormSubmit(moduleName);
    };
}

// 處理表單提交
async function handleFormSubmit(moduleName) {
    const config = modulesConfig[moduleName];
    const formData = new FormData(dataForm);
    const submitData = {};

    Object.keys(config.fields).forEach(fieldKey => {
        // 從 formData 中獲取值，如果沒有則用空字串
        const value = formData.get(fieldKey);
        // 如果是 number 類型且值非空，嘗試轉換為數字
        if (config.fields[fieldKey].type === 'number' && value !== '') {
            submitData[fieldKey] = Number(value);
        } else {
            submitData[fieldKey] = value;
        }
    });

    try {
        let result;
        if (currentModalType === 'add') {
            result = await fetchData(config.apiEndpoint, 'POST', submitData);
        } else if (currentModalType === 'edit') {
            const idKey = Object.keys(config.fields)[0];
            const url = `${config.apiEndpoint}`; // PUT 請求通常是直接到端點，數據在 body 裡
            result = await fetchData(url, 'PUT', submitData);
        }
        alert(result.message);
        closeModal();
        loadModule(moduleName); // 重新載入數據
    } catch (error) {
        alert(`操作失敗：${error.message}`);
    }
}

// 教師資訊管理摺疊展開/收合
async function toggleTeacherList() {
    // 移除所有 li 的 active 樣式
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    // 給教師資訊管理 li 加上 active
    const teacherMenu = document.getElementById('teacher-menu');
    if (teacherMenu) teacherMenu.classList.add('active');

    const list = document.getElementById('teacher-list');
    if (list.style.display === 'none' || list.style.display === '') {
        // 展開時載入教師名單
        await loadTeacherNames();
        list.style.display = 'block';
    } else {
        list.style.display = 'none';
    }
}

// 從API取得教師名單並渲染
async function loadTeacherNames() {
    const list = document.getElementById('teacher-list');
    list.innerHTML = '<li style="color:#fff; padding:5px 15px;">載入中...</li>';
    try {
        const res = await fetch('api/teacher_info_get.php');
        const json = await res.json();
        const teachers = (json && json.success && Array.isArray(json.teachers)) ? json.teachers : [];
        if (teachers.length === 0) {
            list.innerHTML = '<li style="color:#fff; padding:5px 15px;">查無教師資料</li>';
        } else {
            list.innerHTML = '';
            teachers.forEach(t => {
                const li = document.createElement('li');
                li.textContent = t.teacher_name || '(無名教師)';
                li.style.cursor = 'pointer';
                li.style.color = '#fff';
                li.style.padding = '5px 15px';
                li.onclick = (e) => {
                    e.stopPropagation();
                    showTeacherDetail(t.teacher_ID, t.teacher_name);
                };
                list.appendChild(li);
            });
        }
    } catch {
        list.innerHTML = '<li style="color:#fff; padding:5px 15px;">載入失敗</li>';
    }
}

// 顯示教師詳細資料（以三個表格呈現）
async function showTeacherDetail(teacher_ID, teacher_name) {
    moduleTitleElement.textContent = `教師資訊 - ${teacher_name}`;
    dataArea.innerHTML = '<p>載入中...</p>';
    try {
        const res = await fetch(`api/teacher_info_get.php?teacher_ID=${encodeURIComponent(teacher_ID)}`);
        const json = await res.json();
        if (json && json.success && json.data) {
            const t = json.data;
            // 1. personal_info 表格
            let personalInfoHtml = `<h2>基本資料</h2><table><tbody>`;
            // 過濾掉 teacher_ID, teacher_name, majors, degrees
            for (const key in t) {
                if (key === 'majors' || key === 'degrees') continue;
                personalInfoHtml += `<tr><th>${key}</th><td>${t[key]}</td></tr>`;
            }
            personalInfoHtml += `</tbody></table>`;

            // 2. teacher_major 表格
            let majorHtml = `<h2>專長</h2><table><thead><tr><th>major</th></tr></thead><tbody>`;
            if (Array.isArray(t.majors) && t.majors.length > 0) {
                t.majors.forEach(m => {
                    majorHtml += `<tr><td>${m}</td></tr>`;
                });
            } else {
                majorHtml += `<tr><td>無資料</td></tr>`;
            }
            majorHtml += `</tbody></table>`;

            // 3. teacher_degree 表格
            let degreeHtml = `<h2>學歷</h2><table><thead><tr><th>degree</th></tr></thead><tbody>`;
            if (Array.isArray(t.degrees) && t.degrees.length > 0) {
                t.degrees.forEach(d => {
                    degreeHtml += `<tr><td>${d}</td></tr>`;
                });
            } else {
                degreeHtml += `<tr><td>無資料</td></tr>`;
            }
            degreeHtml += `</tbody></table>`;

            dataArea.innerHTML = personalInfoHtml + majorHtml + degreeHtml;
        } else {
            dataArea.innerHTML = '<p>查無詳細資料</p>';
        }
    } catch {
        dataArea.innerHTML = '<p>載入失敗</p>';
    }
}

// 初始化：頁面載入時載入第一個模組（留言管理）
document.addEventListener('DOMContentLoaded', () => {
    // 預設載入第一個模組 (留言管理)
    loadModule('message_board'); 
});
