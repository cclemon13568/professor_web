const dataArea = document.querySelector('.main-content #data-area'); 
const moduleTitleElement = document.getElementById('module-title');
let currentModule = ''; // 用於追蹤當前選中的模組

const modulesConfig = {
    message_board: {
        title: '留言管理',
        apiEndpoint: 'api/message_board.php', // 對應 message_board 表
        fields: {
            question_ID: { label: '問題ID', type: 'text', readOnly: true }, // 主鍵通常為 readOnly
            question_name: { label: '提問者姓名', type: 'text' },
            question_department: { label: '提問者系所', type: 'text' },
            question_title: { label: '問題標題', type: 'text' }, // 雖然是 TEXT，但這裡通常顯示單行
            question_content: { label: '問題內容', type: 'textarea', canTruncate: true } // 設置為 textarea 且可截斷
        },
        actions: ['add','edit','delete']
    },
    appointment: {
        title: '預約管理',
        apiEndpoint: 'api/appointment_info.php', // 對應 appointment_info 表
        fields: {
            appointment_ID: { label: '預約ID', type: 'text', readOnly: true },
            office_location: { label: '辦公室位置', type: 'text' },
            appoint_Date: { label: '預約日期', type: 'datetime-local' },
            status: {
                label: '狀態',
                type: 'select', // <--- This indicates it's a dropdown in forms
                options: [        // <--- These are the options for the dropdown
                    { value: 0, label: '預約失敗' },
                    { value: 1, label: '預約成功' },
                    { value: 2, label: '審查中' }
                ],
                displayField: 'status_display' // <--- **Crucial for table display**
            },
            student_ID: { label: '學生ID', type: 'text' },
            student_Name: { label: '學生姓名', type: 'text' },
            student_email: { label: '學生EMAIL', type: 'text' },
            course_ID: { label: '課程ID', type: 'text' },
            problem_description: { label: '問題描述', type: 'textarea', canTruncate: true }
        },
        actions: ['edit', 'delete']
    },
    evaluation: {
        title: '評論管理',
        apiEndpoint: 'api/evaluation.php', // 對應 evaluation 表
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
        apiEndpoint: 'api/course_info.php', // 對應 course_info 表
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
        apiEndpoint: 'api/sensitive_words.php', // 假設你有 sensitive_words.php API
        fields: {
            word_ID: { label: '詞彙ID', type: 'text', readOnly: true }, // 主鍵
            word: { label: '敏感詞', type: 'text' }
        },
        actions: ['edit', 'delete'] // 敏感詞也應該可以編輯、刪除
    }
};

// --- 通用 API 請求函數 ---
// --- 通用 API 請求函數 ---
async function fetchData(url, method = 'GET', payload = null) { // 將 data 改名為 payload 更清晰
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // 'Accept': 'application/json' // 可選，表示接受 JSON 回應
        }
    };

    if (payload) { // 使用 payload
        options.body = JSON.stringify(payload);
    }

    try {
        const response = await fetch(url, options);
        const jsonResponse = await response.json().catch(() => {
            // 如果無法解析 JSON，返回一個預設的錯誤結構
            return { success: false, message: response.statusText || 'Response not JSON' };
        });

        // 檢查 HTTP 狀態碼
        if (!response.ok) {
            // 如果 HTTP 狀態碼不是 2xx，拋出錯誤，使用後端返回的 message
            throw new Error(jsonResponse.message || `API 請求失敗，狀態碼: ${response.status}`);
        }

        // 檢查後端返回的 success 屬性
        if (jsonResponse.success === false) {
            throw new Error(jsonResponse.message || '操作失敗');
        }

        // 如果一切成功，返回實際的數據 (對於 GET/POST 新增/更新/刪除等，返回 data 或 message)
        // 這裡判斷是否返回 data 屬性。對於 GET，通常有 data。對於 POST/PUT/DELETE，可能只有 message。
        // 所以這裡我們返回整個 jsonResponse，讓調用者根據需要處理
        return jsonResponse; // 返回整個 JSON 響應，包含 success, message 和 data (如果存在)

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
    `;
    // 只在個人資訊管理(info)顯示最左邊的框框
    if (moduleName === 'info') {
        tableHtml += `<th></th>`;
    }
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
        tableHtml += `<tr>`;
        // 只在個人資訊管理(info)顯示最左邊的框框
        if (moduleName === 'info') {
            tableHtml += `<td><input type="checkbox"></td>`;
        }
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
        const responseData = await fetchData(config.apiEndpoint, 'GET'); // 這裡獲取的是 { success: true, data: [...] }

        // *** 關鍵修改 START ***
        if (responseData.success) {
            // 如果成功，使用 responseData.data 傳遞給 generateTable
            dataArea.innerHTML = generateTable(moduleName, responseData.data);
        } else {
            // 如果後端 success 為 false，顯示後端返回的錯誤訊息
            dataArea.innerHTML = `<p style="color: red;">載入資料失敗：${responseData.message || '未知錯誤'}</p>`;
        }
        // *** 關鍵修改 END ***

        addActionButtonListeners(); // 重新綁定事件
    } catch (error) {
        // 捕獲網路或其他錯誤
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
    // 獲取主鍵名 (例如 'question_ID', 'appointment_ID', 'course_ID')
    const idKey = Object.keys(config.fields)[0]; 

    // 構建要發送給後端的 payload
    const payload = {
        action: 'delete', // 後端期望的動作
        [idKey]: idToDelete // 使用計算屬性名來動態設置 ID
    };

    try {
        // 將 method 改為 'POST'，並傳遞 payload
        const result = await fetchData(config.apiEndpoint, 'POST', payload); 

        // 由於 fetchData 現在直接返回整個 JSON 響應 (包含 success, message)
        // 這裡的邏輯是正確的，無需修改
        if (result && result.success) { 
            alert(result.message);
        } else if (result && result.message) { 
            alert(`刪除失敗：${result.message}`);
        } else {
            // 這段通常在 success:true, message: "..." 情況下不會觸發
            // 只有當後端響應非常不規範時才可能走到這裡
            alert('刪除成功！');
        }
        loadModule(moduleName); // 重新載入頁面以更新顯示
    } catch (error) {
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
        // 確保這裡發送的 GET 請求包含 ID 參數，例如 api/course_info.php?course_ID=C001
        const response = await fetchData(`${config.apiEndpoint}?${idKey}=${id}`, 'GET');

        // *** 關鍵修改 START ***
        // 檢查 response.success 並取出實際的數據
        if (response.success && response.data) {
            let itemToEdit;
            // 判斷 response.data 是陣列還是物件
            if (Array.isArray(response.data)) {
                // 如果是陣列，取出第一個元素
                itemToEdit = response.data[0];
            } else {
                // 如果是物件，直接使用
                itemToEdit = response.data;
            }

            if (itemToEdit) { // 確保 itemToEdit 不為 undefined
                generateFormFields(moduleName, itemToEdit, 'edit');
                modal.style.display = 'flex'; // 顯示模態框
            } else {
                alert(`載入編輯資料失敗：未找到資料`);
                closeModal();
            }
        } else {
            // 如果 success 為 false 或沒有 data 屬性，顯示錯誤訊息
            alert(`載入編輯資料失敗：${response.message || '未找到資料或操作失敗'}`);
            closeModal();
        }
        // *** 關鍵修改 END ***

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

    formHtml += `
        <div class="form-buttons">
            <button type="submit">儲存</button>
            <button type="button" class="cancel-btn" onclick="closeModal()">取消</button>
        </div>
    `;

    dataForm.innerHTML = formHtml;

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
        const idKey = Object.keys(config.fields)[0]; // 獲取主鍵名

        if (currentModalType === 'add') {
            submitData.action = 'create'; // 新增操作
            // 如果 ID 是自動生成的，這裡不需要包含 ID
            // 如果前端需要提供 ID (例如 course_ID)，則確保 payload 中包含 ID
            if (config.fields[idKey].readOnly && submitData[idKey] === '') {
                // 如果是只讀且為空字串，說明是自動生成的，可以移除
                delete submitData[idKey]; 
            }
            // 由於您的 course_ID 是 `readOnly: false` 且在新增時可輸入，所以不用刪除
            // 但如果其他模組的 ID 是自動生成且是 readOnly: true，則需要這個判斷

            result = await fetchData(config.apiEndpoint, 'POST', submitData);

        } else if (currentModalType === 'edit') {
            submitData.action = 'update'; // 編輯操作
            // 確保編輯時傳遞當前編輯項目的 ID
            submitData[idKey] = editingItemId; // 從全局變量獲取 ID

            // 調用 fetchData，方法為 POST，數據為 submitData
            result = await fetchData(config.apiEndpoint, 'POST', submitData);
        }

        alert(result.message);
        if (result.success) {
            closeModal();
            loadModule(moduleName); // 重新載入數據
        }
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
    const addBtnContainer = document.getElementById('add-teacher-btn-container');
    if (list.style.display === 'none' || list.style.display === '') {
        // 展開時載入教師名單
        await loadTeacherNames();
        list.style.display = 'block';
        addBtnContainer.style.display = 'none';
    } else {
        list.style.display = 'none';
        addBtnContainer.style.display = 'none';
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
        list.innerHTML = '';

        // 先插入「新增教師」按鈕
        const addLi = document.createElement('li');
        addLi.textContent = '＋ 新增教師';
        addLi.style.fontWeight = 'bold';
        addLi.style.color = '#fff';
        addLi.style.cursor = 'pointer';
        addLi.style.padding = '5px 15px';
        addLi.onclick = (e) => {
            e.stopPropagation();
            openSubTableModal('info', 'add');
        };
        list.appendChild(addLi);

        // 再插入教師名單
        if (teachers.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.textContent = '查無教師資料';
            emptyLi.style.color = '#fff';
            list.appendChild(emptyLi);
        } else {
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

// 初始化：頁面載入時載入第一個模組（留言管理）
document.addEventListener('DOMContentLoaded', () => {
    // 預設載入第一個模組 (留言管理)
    loadModule('message_board');
    loadTeacherNames();

    // 綁定全局事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-item')) {
            const type = e.target.dataset.type;
            const row = JSON.parse(e.target.dataset.row);
            openSubTableModal(type, 'edit', row);
        } else if (e.target.classList.contains('delete-item')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            deleteSubTableRow(type, id);
        }
    });
});

let currentTeacherID = '';
let currentTeacherName = '';

const subTableApi = {

    info: {
        insert: 'api/teacher_info_insert.php',
        update: 'api/teacher_info_update.php',
        delete: 'api/teacher_info_delete.php',
        fields: ['teacher_ID', 'teacher_name', 'teacher_email', 'teacher_intro', 'office_location', 'office_hours']
    },
    major: {
        insert: 'api/major_insert.php',
        update: 'api/major_update.php',
        delete: 'api/major_delete.php',
        fields: ['id', 'teacher_ID', 'major']
    },
    degree: {
        insert: 'api/degree_insert.php',
        update: 'api/degree_update.php',
        delete: 'api/degree_delete.php',
        fields: ['id', 'teacher_ID', 'degree']
    },
    campus: {
        insert: 'api/campus_insert.php',
        update: 'api/campus_update.php',
        delete: 'api/campus_delete.php',
        fields: ['id', 'teacher_ID', 'experience']
    },
    external: {
        insert: 'api/external_insert.php',
        update: 'api/external_update.php',
        delete: 'api/external_delete.php',
        fields: ['id', 'teacher_ID', 'experience']
    },
    publication: {
        insert: 'api/publication_insert.php',
        update: 'api/publication_update.php',
        delete: 'api/publication_delete.php',
        fields: ['paper_ID', 'teacher_ID', 'paper_topic', 'paper_authors', 'paper_year']
    },
    project: {
        insert: 'api/project_insert.php',
        update: 'api/project_update.php',
        delete: 'api/project_delete.php',
        fields: ['project_ID', 'teacher_ID', 'project_role', 'project_period', 'project_organization']
    }
};

// 新增：根據子表型別取得主鍵欄位名稱
function getSubTableIdField(type) {
    switch (type) {
        case 'publication': return 'paper_ID';
        case 'project': return 'project_ID';
        default: return 'id';
    }
}

function openModal(title, formHtml, onSubmit) {
    const modal = document.querySelector('.modal');
    document.getElementById('modal-title').textContent = title;
    const form = document.getElementById('data-form');
    form.innerHTML = formHtml;
    // 每次生成新的按鈕區塊
    form.insertAdjacentHTML('beforeend', `
        <div class="form-buttons">
            <button type="submit">儲存</button>
            <button type="button" class="cancel-btn" onclick="closeModal()">取消</button>
        </div>
    `);
    form.onsubmit = async (e) => {
        e.preventDefault();
        await onSubmit();
    };
    modal.style.display = 'flex';
}

function generateSubtableFormFields(fields, data = {}, type = '') {
    // 中文欄位對照表
    const fieldLabels = {
        teacher_ID: '編號',
        teacher_name: '姓名',
        teacher_email: '信箱',
        teacher_intro: '簡介',
        office_location: '辦公地點',
        office_hours: '辦公時間',
        id: '編號',
        major: '專長',
        degree: '學歷',
        experience: '經歷',
        paper_ID: '編號',
        paper_topic: '標題',
        paper_authors: '作者',
        paper_year: '年份',
        project_ID: '編號',
        project_role: '角色',
        project_period: '時期',
        project_organization: '計畫組織'
    };

    // 需要 textarea 的欄位
    const textareaFields = ['teacher_intro', 'experience', 'paper_authors', 'paper_topic', 'project_organization'];

    // 除 info 外，teacher_ID 不顯示於表單
    return fields
        .filter(field => !(field === 'teacher_ID' && type !== 'info'))
        .map(field => {
            const value = data[field] || '';
            const label = fieldLabels[field] || field;
            if (textareaFields.includes(field)) {
                return `
                    <label for="${field}">${label}：</label>
                    <textarea id="${field}" name="${field}" style="width:100%;min-height:100px;">${value}</textarea>
                `;
            } else {
                return `
                    <label for="${field}">${label}：</label>
                    <input id="${field}" name="${field}" value="${value}" style="width:100%;">
                `;
            }
        }).join('');
}

function openSubTableModal(type, mode, row = {}) {
    const config = subTableApi[type];
    // 取得表格中文名稱
    const tableNames = {
        info: '基本資料',
        major: '專長',
        degree: '學歷',
        campus: '校內經歷',
        external: '校外經歷',
        publication: '論文',
        project: '研究計畫'
    };
    const tableLabel = tableNames[type] || type;
    const title = `${mode === 'edit' ? '編輯' : '新增'} ${tableLabel} 資料`;
    const fields = config.fields;
    // 自動填入 teacher_ID，但不顯示於表單（除 info 外）
    if (type !== 'info') row.teacher_ID = currentTeacherID;
    const formHtml = generateSubtableFormFields(fields, row, type);

    openModal(title, formHtml, async () => {
        const formData = new FormData(document.getElementById('data-form'));
        const payload = {};
        fields.forEach(f => {
            // teacher_ID 自動帶入
            if (f === 'teacher_ID' && type !== 'info') {
                payload[f] = currentTeacherID;
            } else {
                payload[f] = formData.get(f);
            }
        });

        const url = config[mode === 'edit' ? 'update' : 'insert'];
        const res = await fetchData(url, 'POST', payload);
        alert(res.message);
        if (res.success) {
            closeModal();
            showTeacherDetail(currentTeacherID, currentTeacherName);
        }
    });
}

async function deleteSubTableRow(type, id) {
    const config = subTableApi[type];
    const idField = getSubTableIdField(type);
    if (!confirm(`確定要刪除 ${type} 的資料 ID: ${id} 嗎？`)) return;
    const res = await fetchData(config.delete, 'POST', { [idField]: id });
    alert(res.message);
    if (res.success) showTeacherDetail(currentTeacherID, currentTeacherName);
}

// 教師詳細頁載入（略過重複代碼）
async function showTeacherDetail(teacher_ID, teacher_name) {
    currentTeacherID = teacher_ID;
    currentTeacherName = teacher_name;
    moduleTitleElement.textContent = `個人資訊 - ${teacher_name}`;
    dataArea.innerHTML = '<p>載入中...</p>';

    try {
        const info = await fetchData(`api/teacher_info_get.php?teacher_ID=${teacher_ID}`);
        const ext = await fetchData(`api/teacher_extended_info.php?teacher_ID=${teacher_ID}`);

        // 新增：取得帳號資訊
        const loginInfoRes = await fetchData(`api/login_info.php?teacher_ID=${teacher_ID}`);
        let loginInfoHtml = '';
        if (loginInfoRes.success && loginInfoRes.data) {
            const login = loginInfoRes.data;
            loginInfoHtml = `
                <h2>帳號資訊</h2>
                <table>
                    <tbody>
                        <tr>
                            <th>帳號</th>
                            <td>${login.professor_accountnumber || ''}</td>
                        </tr>
                        <tr>
                            <th>密碼</th>
                            <td>${login.professor_password || ''}</td>
                        </tr>
                        <tr>
                            <th>信箱</th>
                            <td>${login.email || ''}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="action-buttons" style="margin-top: 10px;">
                    <button class="edit-btn login-edit-btn" data-account="${login.professor_accountnumber}" data-password="${login.professor_password}" data-email="${login.email}">編輯</button>
                </div>
            `;
        } else {
            loginInfoHtml = `
                <h2>帳號資訊</h2>
                <table><tbody>
                    <tr><td colspan="2">查無帳號資料</td></tr>
                </tbody></table>
            `;
        }

        if (!info.success || !ext.success) throw new Error('資料載入失敗');

        // 中文欄位對照表
        const fieldLabels = {
            teacher_ID: '編號',
            teacher_name: '姓名',
            teacher_email: '信箱',
            teacher_intro: '簡介',
            office_location: '辦公地點',
            office_hours: '辦公時間'
        };

        // 各子表格欄位中文對照
        const tableFieldLabels = {
            major: {
                id: '編號',
                major: '專長'
            },
            degree: {
                id: '編號',
                degree: '學歷'
            },
            campus: {
                id: '編號',
                experience: '經歷'
            },
            external: {
                id: '編號',
                experience: '經歷'
            },
            publication: {
                paper_ID: '編號',
                paper_topic: '標題',
                paper_authors: '作者',
                paper_year: '年份'
            },
            project: {
                project_ID: '編號',
                project_role: '角色',
                project_period: '時期',
                project_organization: '計畫組織'
            }
        };

        let html = `<h2>基本資料</h2><table><tbody>`;
        Object.entries(info.data).forEach(([k, v]) => {
            if (k !== 'majors' && k !== 'degrees') {
                const label = fieldLabels[k] || k;
                html += `<tr><th>${label}</th><td>${v}</td></tr>`;
            }
        });
        html += `</tbody></table><div class="action-buttons" style="margin-top:16px;">
            <button class="edit-btn" onclick="openSubTableModal('info', 'edit', ${JSON.stringify(info.data).replace(/"/g, '&quot;')})">編輯</button>
            <button class="delete-btn" onclick="deleteTeacher('${teacher_ID}', '${teacher_name}')">刪除</button>
        </div>`;

        // 插入帳號資訊表（含下方操作按鈕）
        html += loginInfoHtml;

        const tables = [
            { key: 'majors', label: '專長', type: 'major', data: info.data.majors },
            { key: 'degrees', label: '學歷', type: 'degree', data: info.data.degrees },
            { key: 'campus_experience', label: '校內經歷', type: 'campus', data: ext.data.campus_experience },
            { key: 'external_experience', label: '校外經歷', type: 'external', data: ext.data.external_experience },
            { key: 'publications', label: '論文', type: 'publication', data: ext.data.publications },
            { key: 'projects', label: '研究計畫', type: 'project', data: ext.data.projects }
        ];

        for (const table of tables) {
            // 將新增按鈕放到表格名稱右側，並統一 class
            html += `
                <div style="display:flex;align-items:center;gap:10px;margin-top:24px;">
                    <h2 style="margin:0;">${table.label}</h2>
                    <button class="add-btn" style="margin-left:8px;" onclick="openSubTableModal('${table.type}', 'add')">新增</button>
                </div>
                <table><thead><tr>
            `;
            if (Array.isArray(table.data) && table.data.length > 0) {
                const fieldMap = tableFieldLabels[table.type];
                Object.keys(table.data[0]).forEach(k => {
                    html += `<th>${(fieldMap && fieldMap[k]) ? fieldMap[k] : k}</th>`;
                });
                html += `<th>操作</th></tr></thead><tbody>`;
                table.data.forEach(row => {
                    html += '<tr>';
                    Object.values(row).forEach(v => html += `<td>${v}</td>`);
                    html += `<td>
                        <button class="edit-btn edit-item" data-type="${table.type}" data-row='${JSON.stringify(row)}'>編輯</button>
                        <button class="delete-btn delete-item" data-type="${table.type}" data-id="${row.id || row.paper_ID || row.project_ID}">刪除</button>
                    </td></tr>`;
                });
            } else {
                html += `<tr><td colspan="100%">無資料</td></tr>`;
            }
            html += `</tbody></table>`;
        }

        dataArea.innerHTML = html;

        // 綁定帳號表的編輯按鈕事件
        const editBtn = dataArea.querySelector('.login-edit-btn');
        if (editBtn) {
            editBtn.onclick = function () {
                openLoginEditModal({
                    professor_accountnumber: editBtn.dataset.account,
                    professor_password: editBtn.dataset.password,
                    email: editBtn.dataset.email,
                    teacher_ID: teacher_ID
                });
            };
        }
    } catch (err) {
        dataArea.innerHTML = `<p>載入失敗：${err.message}</p>`;
    }
}

// 帳號資訊編輯模態框
function openLoginEditModal(login) {
    const modal = document.querySelector('.modal');
    // 標題改為「編輯 帳號資訊 資料」
    document.getElementById('modal-title').textContent = '編輯 帳號資訊 資料';
    const form = document.getElementById('data-form');
    form.innerHTML = `
        <label for="current_account">目前帳號：</label>
        <input id="current_account" name="current_account" value="${login.professor_accountnumber || ''}" readonly>
        <label for="current_password">目前密碼：</label>
        <input id="current_password" name="current_password" value="${login.professor_password || ''}" readonly>
        <label for="new_account">新帳號：</label>
        <input id="new_account" name="new_account" value="${login.professor_accountnumber || ''}">
        <label for="new_password">新密碼：</label>
        <input id="new_password" name="new_password" value="${login.professor_password || ''}">
        <label for="email">信箱：</label>
        <input id="email" name="email" value="${login.email || ''}" readonly>
        <div class="form-buttons">
            <button type="submit">儲存</button>
            <button type="button" class="cancel-btn" onclick="closeModal()">取消</button>
        </div>
    `;
    form.onsubmit = async function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = {
            current_account: formData.get('current_account'),
            current_password: formData.get('current_password'),
            new_account: formData.get('new_account'),
            new_password: formData.get('new_password')
        };
        try {
            const res = await fetchData('api/login_info.php', 'PUT', payload);
            alert(res.message);
            if (res.success) {
                closeModal();
                showTeacherDetail(currentTeacherID, currentTeacherName);
            }
        } catch (err) {
            alert('更新失敗：' + err.message);
        }
    };
    modal.style.display = 'flex';
}

async function deleteTeacher(id, name) {
    if (!confirm(`確定刪除教師「${name}」嗎？`)) return;
    const res = await fetchData('api/teacher_info_delete.php', 'POST', { teacher_ID: id });
    alert(res.message);
    if (res.success) {
        dataArea.innerHTML = '<p>請選擇左側教師</p>';
        await loadTeacherNames();
    }
}