document.addEventListener('DOMContentLoaded', function() {

    // DOM 元素引用
    const scheduleTable = document.querySelector('.schedule-table');
    const professorViewElements = document.querySelectorAll('.professor-view-element');

    const changeAvailabilityBtn = document.getElementById('change-availability-btn');
    const setAvailableBtn = document.getElementById('set-available-btn');
    const setUnavailableBtn = document.getElementById('set-unavailable-btn');
    const cancelChangeBtn = document.getElementById('cancel-change-btn');
    const selectDateInput = document.getElementById('select-date');
    const operationInstruction = document.getElementById('operation-instruction');

    const studentAppointmentModal = new bootstrap.Modal(document.getElementById('studentAppointmentModal'));
    const appointmentDetailModal = new bootstrap.Modal(document.getElementById('appointmentDetailModal'));
    const addUnavailableCourseModal = new bootstrap.Modal(document.getElementById('addUnavailableCourseModal'));
    // 在 meeting.js 最上方加上
    const $courseSelect = $('#course_id');

    // 全局狀態變數
    let isProfessorLoggedIn = localStorage.getItem('isLoggedIn') === 'true';    let isChangingAvailability = false; // 教授是否處於更改時段模式
    // 將初始日期設定為 2025-06-02 (星期一)
    let currentSelectedDate = '2025-06-02';
    let selectedSlotsForChange = []; // 儲存教授模式下選中的時段 { dayIndex, time }

    // 常量定義
    // 更改為只包含星期一到星期五，用於表格標頭顯示
    const daysOfWeekHeaders = ['一', '二', '三', '四', '五', '六', '日'];
    // 完整的星期名稱陣列，用於 Date.getDay() 的映射 (0=日, 1=一, ..., 6=六)
    const fullDaysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const timeSlots = [
        "09:00-09:30", "09:30-10:00", "10:00-10:30", "10:30-11:00",
        "11:00-11:30", "11:30-12:00",
        "12:00-12:30", "12:30-13:00",
        "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00",
        "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00",
        "17:00-17:30", "17:30-18:00", "18:00-18:30", "18:30-19:00",
        "19:00-19:30", "19:30-20:00", "20:00-20:30", "20:30-21:00",
        "21:00-21:30", "21:30-22:00"
    ];

    // 統一 API 路徑變數
    // const API_BASE_URL = './api/'; // 基礎路徑
    // const APPOINTMENT_API_URL = `${API_BASE_URL}appointment_info.php`;
    // const COURSE_API_URL = `${API_BASE_URL}course_info.php`;

    // 1. 載入課程清單並填入下拉選單
    function loadCourses() {
        $.ajax({
            url: 'api/course_info.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                const courseList = response.data || [];
                $courseSelect.empty();
                $courseSelect.append('<option value="">請選擇課程</option>');
                courseList.forEach(course => {
                    $courseSelect.append(
                        `<option value="${course.course_ID}" data-name="${course.course_name}">${course.course_ID} - ${course.course_name}</option>`
                    );
                });
            },
            error: function() {
                alert('載入課程失敗');
            }
        });
    }

// 2. 當學生選擇課程時，自動帶出課程名稱
    $('#course_id').on('change', function() {
        const selectedName = $(this).find('option:selected').data('name') || '';
        $('#selected_course_name').val(selectedName); // 假設有一個 input 顯示課程名稱
    });

// 3. 頁面初始化時呼叫
    $(document).ready(function() {
        loadCourses();
    });


    // --- 工具函數 ---

    // UUID 生成函數
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getChineseStatus(status) {
        switch (parseInt(status)) {
            case 0: return '預約失敗';
            case 1: return '預約成功';
            case 2: return '審查中';
            case -1: return '教授行程';
            default: return '未知狀態';
        }
    }

    // 輔助函數：獲取中文星期幾 (與PHP的邏輯匹配)
    function getDayOfWeekInChinese(date) {
        // date 應該是一個 Date 對象
        return fullDaysOfWeek[date.getDay()];
    }

    // --- 介面更新函數 ---

    function updateView() {
        // 根據 isProfessorLoggedIn 狀態為 body 添加/移除類別
        document.body.classList.toggle('professor-logged-in', isProfessorLoggedIn);
        document.body.classList.toggle('student-logged-in', !isProfessorLoggedIn);

        // 教授模式控制元素顯示/隱藏
        professorViewElements.forEach(el => el.classList.toggle('d-none', !isProfessorLoggedIn));

        // 表格內容根據視圖切換
        $('.appointment-slot').each(function() {
            if (isProfessorLoggedIn) {
                $(this).find('.student-view-content').addClass('d-none');
                $(this).find('.professor-view-content').removeClass('d-none');
            } else {
                $(this).find('.student-view-content').removeClass('d-none');
                $(this).find('.professor-view-content').addClass('d-none');
            }
        });

        // 確保教授控制按鈕在非更改模式下隱藏
        if (!isChangingAvailability) {
            setAvailableBtn.classList.add('d-none');
            setUnavailableBtn.classList.add('d-none');
            cancelChangeBtn.classList.add('d-none');
            changeAvailabilityBtn.classList.remove('d-none');
            operationInstruction.textContent = '點擊時段進行選擇，然後點擊下方按鈕修改狀態。';
        }
    }

    // --- AJAX 數據載入和渲染 ---

    // 載入指定日期的所有預約和課程
    async function loadAppointmentsAndCourses(date) {
        showLoading(); // 顯示加載動畫

        try {
            // Promise.all 同時發送兩個請求
            const [appointmentsResponse, coursesResponse] = await Promise.all([
                // 注意：您的 appointment_info.php 在 GET 請求中似乎沒有 date_filter 參數來過濾，
                // 它會返回所有預約。我們這裡暫時保持這個行為，在前端處理過濾。
                // 如果您希望後端過濾，需要修改 appointment_info.php 的 GET 邏輯。
                fetch('api/appointment_info.php'),
                fetch('api/course_info.php') // 獲取所有課程
            ]);

            if (!appointmentsResponse.ok) {
                throw new Error(`HTTP error! status: ${appointmentsResponse.status} from appointments`);
            }
            if (!coursesResponse.ok) {
                throw new Error(`HTTP error! status: ${coursesResponse.status} from courses`);
            }

            // 解析 JSON 數據 0605
            const appointmentsJson = await appointmentsResponse.json();
            const coursesJson = await coursesResponse.json();

            const appointments = appointmentsJson.data || [];
            const courses = coursesJson.data || [];

            // 過濾 appointments 到當前選定日期
            const filteredAppointments = appointments.filter(app => {
                if (!app.appoint_Date) return false; // 避免空值
                const appDateStr = app.appoint_Date.replace(' ', 'T');
                const appDateObj = new Date(appDateStr);
                if (isNaN(appDateObj.getTime())) {
                    // 解析失敗，略過這筆資料
                    return false;
                }
                return true;
            });

            // 處理課程數據，生成「教授行程」的偽預約對象
            // 這個函數會將課程時段解析並轉換成預約時段格式
            // 這裡需要為一週的每一天生成教授行程
            const allProfessorCourseSlots = [];
            const selectedDateObj = new Date(date);
            const mondayOfSelectedWeek = getMondayOfWeek(selectedDateObj);

            for (let i = 0; i < 7; i++) { // 遍歷週一到週五
                const targetDay = new Date(mondayOfSelectedWeek);
                targetDay.setDate(mondayOfSelectedWeek.getDate() + i);
                const dailyCourseSlots = generateProfessorCourseSlots(courses, targetDay);
                allProfessorCourseSlots.push(...dailyCourseSlots);
            }

            // 合併預約和教授行程數據
            const combinedData = [...appointments, ...allProfessorCourseSlots]; // 用原始的 appointments 數據

            // 渲染表格
            renderScheduleTable(combinedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('加載資料失敗：' + error.message);
            renderScheduleTable([]); // 即使失敗，也渲染一個空的課表，避免介面混亂
        } finally {
            hideLoading(); // 隱藏加載動畫
        }
    }

    // 顯示/隱藏載入動畫
    function showLoading() {
        // 假設您有一個 spinner 或 overlay
        // 可以在這裡顯示它，例如：document.body.classList.add('loading');
        // 或顯示一個文字提示
        operationInstruction.textContent = '載入中...';
    }

    function hideLoading() {
        // 隱藏載入動畫
        // document.body.classList.remove('loading');
        if (!isChangingAvailability) {
            operationInstruction.textContent = '點擊時段進行選擇，然後點擊下方按鈕修改狀態。';
        } else {
            operationInstruction.textContent = '請點擊表格中的時段來選擇要更改狀態的時段。再次點擊取消選擇。';
        }
    }

    // 輔助函數：獲取選定日期所在週的星期一的日期
    function getMondayOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整為星期一
        return new Date(d.setDate(diff));
    }


    // 根據 course_info 數據生成「教授行程」的偽預約對象
    // meeting.js 片段
    function generateProfessorCourseSlots(courses, targetDateObj) {
        const professorSlots = [];
        const targetDayOfWeekChinese = getDayOfWeekInChinese(targetDateObj); // 例如 '星期二'
        const targetDateISO = targetDateObj.toISOString().slice(0, 10);

        courses.forEach(course => {
            // 支援 "星期二、三 12:10~13:00" 及 "星期六 09:10~12:00"
            const match = course.course_time.match(/^((星期[一二三四五六日七](?:、[一二三四五六日七])*)?)\s*(\d{2}:\d{2})[~-](\d{2}:\d{2})$/);
            if (match) {
                let daysPart = match[1]; // 可能是 "星期二、三" 或 "星期六"
                const courseStartTimeStr = match[3];
                const courseEndTimeStr = match[4];

                // 處理 "星期二、三" 轉為 ["星期二", "星期三"]
                let courseDays = [];
                if (daysPart) {
                    // 將 "星期二、三" 轉為 ["星期二", "星期三"]
                    if (daysPart.includes('、')) {
                        // 先將 "星期二、三" 換成 "星期二、星期三"
                        daysPart = daysPart.replace(/、([一二三四五六日七])/g, '、星期$1');
                    }
                    courseDays = daysPart.split('、');
                }

                // 跳過包含"星期七"的資料
                if (courseDays.includes('星期七')) {
                    return; // 直接跳過這筆資料
                }

                if (courseDays.includes(targetDayOfWeekChinese)) {
                    const courseStartDateTime = new Date(`${targetDateISO}T${courseStartTimeStr}:00`);
                    const courseEndDateTime = new Date(`${targetDateISO}T${courseEndTimeStr}:00`);

                    timeSlots.forEach(slot => {
                        const [slotStartTimeStr, slotEndTimeStr] = slot.split('-');
                        const currentSlotStart = new Date(`${targetDateISO}T${slotStartTimeStr}:00`);
                        const currentSlotEnd = new Date(`${targetDateISO}T${slotEndTimeStr}:00`);

                        if (courseStartDateTime < currentSlotEnd && courseEndDateTime > currentSlotStart) {
                            professorSlots.push({
                                appointment_ID: `PROF_COURSE_${course.course_ID}_${targetDateISO.replace(/-/g, '')}_${slotStartTimeStr.replace(':', '')}`,
                                office_location: 'N/A',
                                appoint_Date: `${targetDateISO} ${slotStartTimeStr}:00`,
                                status: -1,
                                student_ID: '',
                                student_Name: '教授課程',
                                student_email: '',
                                course_ID: course.course_ID,
                                problem_description: `課程: ${course.course_name}`
                            });
                        }
                    });
                }
            } else {
                console.warn(`Course time format not matched for course ID: ${course.course_ID}, time: ${course.course_time}`);
            }
        });
        return professorSlots;
    }


    // 渲染或更新課表
    function renderScheduleTable(appointments) {
        const $tbody = $('.schedule-table tbody');
        $tbody.empty(); // 清空所有內容，重新生成

        // 計算當前選擇日期所在週的星期一的日期
        const selectedDateObj = new Date(currentSelectedDate);
        const mondayOfSelectedWeek = getMondayOfWeek(selectedDateObj);

        timeSlots.forEach(time => {
            let rowHtml = `<tr><td>${time}</td>`;
            // 只遍歷週一到週五
            for (let i = 0; i < 7; i++) { // i 代表從星期一開始的偏移量 (0=週一, 1=週二, ...)
                const targetDay = new Date(mondayOfSelectedWeek);
                targetDay.setDate(mondayOfSelectedWeek.getDate() + i);
                const targetDateISO = targetDay.toISOString().slice(0, 10); // 格式為YYYY-MM-DD
                const chineseDayName = fullDaysOfWeek[targetDay.getDay()]; // 獲取正確的中文星期名稱 (日, 一, ..., 六)
                const fullDateTime = `${targetDateISO} ${time.split('-')[0]}:00`;

                // 找到對應的預約或教授行程
                let appointment = appointments.find(app => {
                    return app.appoint_Date === fullDateTime && app.status >= 0;
                });

                // 如果沒有真實預約，再檢查是否有教授行程 (-1) course_info裡的
                if (!appointment) {
                    appointment = appointments.find(app => {
                        const dbAppointDateFormatted = app.appoint_Date ? new Date(app.appoint_Date).toISOString().slice(0, 19).replace('T', ' ') : '';
                        const slotDateTimeFormatted = new Date(fullDateTime).toISOString().slice(0, 19).replace('T', ' ');
                        return dbAppointDateFormatted === slotDateTimeFormatted && app.status === -1;
                    });
                }

                let slotClass = 'available'; // 預設為可預約 (白色)
                let studentContent = '點擊預約';
                let professorContentHtml = ''; // 教授內容，可能包含按鈕
                let dataStatus = 'available'; // 自定義 data 屬性表示可用
                let dataAppointmentID = '';

                if (appointment) {
                    dataStatus = appointment.status;
                    dataAppointmentID = appointment.appointment_ID;

                    if (appointment.status == 0) {
                        slotClass = 'status-0'; // 預約失敗 (淺紅色)
                        studentContent = '預約失敗';
                        professorContentHtml = `預約失敗`;
                    } else if (appointment.status == 2 && appointment.student_ID === 'T002') {
                        slotClass = 'status--1'; // 淺灰色
                        studentContent = '無法預約';
                        professorContentHtml = `教授行程: ${appointment.problem_description || '未說明'}`;
                    } else if (appointment.status == 1) {
                        slotClass = 'status-1'; // 預約成功 (淺綠色)
                        studentContent = '預約成功';
                        professorContentHtml = `預約成功`;
                    } else if (appointment.status == 2) {
                        slotClass = 'status-2'; // 審查中 (淺黃色)
                        studentContent = '審核中';
                        professorContentHtml = `審核中`;
                    } else if (appointment.status == -1) { // 教授自訂不可用 / 課程時段
                        slotClass = 'status--1 unavailable-custom'; // 淺灰色，禁用點擊
                        studentContent = '無法預約';
                        professorContentHtml = `教授行程: ${appointment.problem_description || '未說明'}`;
                    }
                }

                // 只有當時段被佔用時，才顯示查看詳情按鈕 不需要
                if (dataStatus !== 'available' && dataStatus != -1) {
                    professorContentHtml += `<br><button class="btn btn-sm btn-info mt-1 view-appointment-btn" data-appointment-id="${dataAppointmentID}">查看預約</button>`;
                }

                rowHtml += `
                    <td class="appointment-slot ${slotClass}"
                        data-day="${chineseDayName}"
                        data-time="${time}"
                        data-day-index="${targetDay.getDay()}" 
                        data-status="${dataStatus}"
                        data-appointment-id="${dataAppointmentID}"
                        data-full-date="${targetDateISO}"
                        data-student-id="${appointment?.student_ID || ''}">
                        <div class="student-view-content">${studentContent}</div>
                        <div class="professor-view-content d-none">${professorContentHtml}</div>
                    </td>
                `;

            }
            rowHtml += `</tr>`;
            $tbody.append(rowHtml);
        });

        updateView(); // 每次渲染後更新視圖

        // 動態生成表頭
        const $thead = $('.schedule-table thead tr');
        $thead.empty();
        $thead.append('<th>時間</th>');
        for (let i = 0; i < 7; i++) {
            const targetDay = new Date(mondayOfSelectedWeek);
            targetDay.setDate(mondayOfSelectedWeek.getDate() + i);
            const dateString = `${targetDay.getMonth() + 1}/${targetDay.getDate()}`; // M/D 格式
            $thead.append(`<th>${daysOfWeekHeaders[i]}<br>${dateString}</th>`);
        }
    }

    // --- 事件監聽器 ---

    // 日期選擇器改變時載入預約 (教授模式)
    selectDateInput.addEventListener('change', function() {
        currentSelectedDate = this.value;
        loadAppointmentsAndCourses(currentSelectedDate);
    });

    // 載入預約按鈕 (教授模式)
    document.getElementById('load-appointments-btn').addEventListener('click', function() {
        loadAppointmentsAndCourses(currentSelectedDate);
    });

    // 點擊預約時段或「查看預約」按鈕 (統一處理)
    $(document).on('click', '.appointment-slot, .view-appointment-btn', function(e) {
        const $target = $(e.target); // 點擊的具體元素
        let $slot;
        let appointmentID;

        if ($target.hasClass('view-appointment-btn')) {
            // 如果點擊的是按鈕
            $slot = $target.closest('.appointment-slot');
            appointmentID = $target.data('appointment-id');
            e.stopPropagation(); // 阻止事件冒泡到父級 .appointment-slot，避免雙重觸發
        } else if ($target.hasClass('appointment-slot')) {
            // 如果點擊的是格子本身
            $slot = $target;
            appointmentID = $slot.data('appointment-id');
        } else {
            // 如果點擊的是格子內的文本內容等，找到父級的 .appointment-slot
            $slot = $target.closest('.appointment-slot');
            appointmentID = $slot.data('appointment-id');
        }

        const slotStatus = $slot.data('status');
        const time = $slot.data('time');
        const dayIndex = $slot.data('day-index');
        const dayOfWeek = fullDaysOfWeek[dayIndex]; // 這裡的 fullDaysOfWeek 是完整的中文星期
        const fullDateFromSlot = $slot.data('full-date');

        const fullDateTimeForDB = `${fullDateFromSlot} ${time.split('-')[0]}:00`;

        if (isProfessorLoggedIn) {
            // 教授模式
            if (isChangingAvailability) {
                // 教授處於更改開放時段模式，點擊格子本身來選中/取消選中
                if (!$target.hasClass('view-appointment-btn')) { // 確保不是點擊按鈕
                    $slot.toggleClass('selected-for-change');
                    const slotInfo = {
                        day: dayOfWeek, // 這是中文的星期幾
                        time: time,
                        dayIndex: dayIndex,
                        fullDateTime: fullDateTimeForDB,
                        appointment_ID: appointmentID, // 帶上可能的預約ID
                        student_ID: $slot.data('student-id')
                    };
                    const index = selectedSlotsForChange.findIndex(s =>
                        s.day === slotInfo.day && s.time === slotInfo.time && s.fullDateTime === slotInfo.fullDateTime
                    );
                    if (index > -1) {
                        selectedSlotsForChange.splice(index, 1);
                    } else {
                        selectedSlotsForChange.push(slotInfo);
                    }
                    console.log('Selected slots for change:', selectedSlotsForChange);
                }
            } else {
                // 教授未處於更改模式，點擊預約時段或按鈕查看詳情
                if (slotStatus !== 'available' && appointmentID) { // 確保不是 'available' 狀態且有 ID
                    // 這裡統一呼叫查看詳情函數
                    showAppointmentDetails(appointmentID);
                } else if (slotStatus === 'available') {
                    console.log('Professor clicked on an available slot (not in change mode).');
                }
            }
        } else {
            // 學生模式
            if (slotStatus === 'available') { // 只有 'available' (白色) 的時段才能點擊預約
                const selectedDateTimeDisplay = document.getElementById('selectedDateTimeDisplay');
                const appointDateForDBInput = document.getElementById('appointDateForDB');

                const dateObj = new Date(fullDateFromSlot);
                // 注意：這裡使用 getDayOfWeekInChinese 函數來獲取中文星期，與渲染表格時保持一致
                const displayDayOfWeek = getDayOfWeekInChinese(dateObj).replace('星期', ''); // 例如 '一'

                const displayFormattedTime = `${fullDateFromSlot} 星期${displayDayOfWeek} ${time}`;
                const dbFormattedDateTime = `${fullDateFromSlot} ${time.split('-')[0]}:00`;

                if (selectedDateTimeDisplay) {
                    selectedDateTimeDisplay.textContent = displayFormattedTime;
                }
                if (appointDateForDBInput) {
                    appointDateForDBInput.value = dbFormattedDateTime;
                }

                $('#form_appointment_time').val(time);
                $('#form_appointment_ID').val(generateUUID());

                studentAppointmentModal.show();
            } else {
                alert(`該時段當前狀態為 "${getChineseStatus(slotStatus)}"`);
            }
        }
    });

    // 2. 教授更改時段時，點選格子時只做選取，不彈窗（只允許選一個）
    $(document).on('click', '.appointment-slot', function(e) {
        if (isProfessorLoggedIn && isChangingAvailability) {
            const $slot = $(this);
            const slotStatus = $slot.data('status');
            const slotStudentID = $slot.data('student-id');
            if (slotStudentID === 'T002') return;
            if (
                slotStatus === 'available' ||
                (parseInt(slotStatus) === 2 && slotStudentID === 'T002')
            ) {
                // 只允許選一個：先移除所有選取
                $('.appointment-slot.selected-for-change').removeClass('selected-for-change');
                selectedSlotsForChange = [];

                // 加入目前這一個
                const dayIndex = $slot.data('day-index');
                const time = $slot.data('time');
                const fullDate = $slot.data('full-date');
                selectedSlotsForChange.push({
                    dayIndex,
                    time,
                    fullDate,
                    appointment_ID: $slot.data('appointment-id'),
                    status: slotStatus,
                    student_ID: slotStudentID
                });
                $slot.addClass('selected-for-change');
                e.stopPropagation();
            } else {
                alert('此時段不可更改開放狀態。');
            }
        }
    });

    // 設為不開放按鈕，彈出自訂 modal 表單
    setUnavailableBtn.addEventListener('click', function() {
        if (selectedSlotsForChange.length === 0) {
            alert('請選擇至少一個時段。');
            return;
        }
        // 顯示自訂 modal，讓教授填寫原因
        $('#unavailable-batch-modal').modal('show');
    });

    // modal 表單送出時，才發送多筆資料
    $('#unavailable-batch-form').on('submit', function(e) {
        e.preventDefault();
        const customContent = $('#unavailable-batch-reason').val();
        const professorEmail = $('#unavailable-batch-email').val();
        if (!customContent.trim()) {
            alert('必須提供不開放的原因。');
            return;
        }
        if (!confirm(`確定將選定的時段設為不開放，原因為 "${customContent}" 嗎？這將會刪除該時段內所有的學生預約！`)) {
            return;
        }
        const unavailablePromises = selectedSlotsForChange.map(slot => {
            const fullDateTime = `${slot.fullDate} ${slot.time.split('-')[0]}:00`;
            const deleteExistingPromise = (slot.appointment_ID && slot.appointment_ID !== 'undefined') ? $.ajax({
                url: 'api/appointment_info.php',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    action: 'delete',
                    appointment_ID: slot.appointment_ID
                }),
                dataType: 'json'
            }) : Promise.resolve({ success: true, message: '沒有現有預約可刪除' });

            return deleteExistingPromise.then(() => {
                const newUnavailableID = `PROF_UNA_${Math.random().toString(36).substring(2, 9)}`;
                return $.ajax({
                    url: 'api/appointment_info.php',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        action: 'create', // 這裡要用 create
                        appointment_ID: newUnavailableID,
                        office_location: 'E405',
                        appoint_Date: fullDateTime,
                        status: 2,
                        student_ID: 'T002',
                        student_Name: '李榮三',
                        student_email: professorEmail,
                        course_ID: 'CS000',
                        problem_description: customContent
                    }),
                    dataType: 'json'
                });
            });
        });

        Promise.all(unavailablePromises)
            .then(responses => {
                alert('選定時段已設為不開放。');
                $('#unavailable-batch-modal').modal('hide');
                cancelChangeBtn.click();
            })
            .catch(error => {
                console.error('設定不開放時段失敗:', error);
                alert('設定不開放時段失敗，請檢查控制台。');
            });
    });

    // 3. 教授設定開放時段按鈕
    $('#set-available-btn').on('click', function() {
        // 假設只允許單選
        const slot = selectedSlotsForChange[0];
        if (slot && slot.student_ID === 'T002' && slot.appointment_ID) {
            // 發送刪除請求
            $.ajax({
                url: 'api/appointment_info.php',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    action: 'delete',
                    appointment_ID: slot.appointment_ID
                }),
                success: function(res) {
                    console.log('刪除回應:', res);
                    if (res.success) {
                        alert('已成功刪除該預約，時段已改為開放。');
                        // 重新載入資料
                    } else {
                        alert('刪除失敗：' + (res.message || '未知錯誤'));
                    }
                },
                error: function(xhr) {
                    console.log('刪除錯誤:', xhr.responseText);
                    alert('刪除請求失敗');
                }
            });
        } else {
            alert('此時段無法更改為開放，僅能刪除教授自訂不可用時段。');
        }
    });


    // 顯示預約詳情的函數 (新增此函數以避免代碼重複)
    function showAppointmentDetails(appointmentID) {
        if (!appointmentID) return;

        $.ajax({
            url: 'api/appointment_info.php',
            method: 'GET',
            data: { appointment_ID: appointmentID },
            dataType: 'json',
            success: function(res) {
                if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                    const data = res.data[0];
                    $('#modal_appointment_ID').text(data.appointment_ID);
                    $('#modal_office_location').text(data.office_location || '無');
                    $('#modal_appoint_Date').text(data.appoint_Date);
                    $('#modal_status').text(getChineseStatus(data.status));
                    $('#modal_student_ID').text(data.student_ID || '無');
                    $('#modal_student_Name').text(data.student_Name || '無');
                    $('#modal_student_email').text(data.student_email || '無');
                    $('#modal_course_ID').text(data.course_ID || '無');
                    $('#modal_problem_description').text(data.problem_description || '無');

                    $('#accept-appointment-btn').data('appointment_id', data.appointment_ID);
                    $('#reject-appointment-btn').data('appointment_id', data.appointment_ID);

                    if (data.status == 2) {
                        $('#accept-appointment-btn').show();
                        $('#reject-appointment-btn').show();
                    } else {
                        $('#accept-appointment-btn').hide();
                        $('#reject-appointment-btn').hide();
                    }

                    appointmentDetailModal.show();
                } else {
                    alert('無法載入預約詳情。');
                }
            },
            error: function(xhr) {
                console.error('Error loading appointment details:', xhr.responseText);
                alert('載入預約詳情失敗！');
            }
        });
    }

    // 提交學生預約表單
    $('#student-appointment-form').on('submit', function(e) {
        e.preventDefault();

        const appointDateForDB = document.getElementById('appointDateForDB').value;

        const formData = {
            appointment_ID: $('#form_appointment_ID').val(),
            office_location: $('#office_location').val(),
            appoint_Date: appointDateForDB,
            status: 2, // 預設審查中 (學生預約)
            student_ID: $('#student_id').val(),
            student_Name: $('#student_name').val(),
            student_email: $('#student_email').val(),
            course_ID: $('#course_id').val(),
            problem_description: $('#problem_description').val()
        };

        formData.action = 'create';
        $.ajax({
            url: 'api/appointment_info.php', // 使用正確的 API URL
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('預約成功！等待教授審核。');
                    studentAppointmentModal.hide();
                    loadAppointmentsAndCourses(currentSelectedDate); // 重新載入以更新課表顯示
                    $('#student-appointment-form')[0].reset(); // 清空表單
                } else {
                    alert('預約失敗: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('預約請求失敗: ' + xhr.responseText);
                console.error('AJAX Error:', xhr.responseText);
            }
        });
    });

    // 教授接受預約
    document.getElementById('accept-appointment-btn').addEventListener('click', function() {
        const appointmentID = $(this).data('appointment_id');
        if (confirm('確定接受此預約嗎？')) {
            updateAppointmentStatus(appointmentID, 1); // 1 = 成功
        }
    });

    // 教授拒絕預約
    document.getElementById('reject-appointment-btn').addEventListener('click', function() {
        const appointmentID = $(this).data('appointment_id');
        if (confirm('確定拒絕此預約嗎？')) {
            updateAppointmentStatus(appointmentID, 0); // 0 = 失敗
        }
    });

    // 更新預約狀態的 AJAX 函數
    function updateAppointmentStatus(appointmentID, newStatus) {
        $.ajax({
            url: 'api/appointment_info.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'update',
                appointment_ID: appointmentID,
                status: newStatus
            }),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('預約狀態更新成功！');
                    appointmentDetailModal.hide();
                    loadAppointmentsAndCourses(currentSelectedDate);
                } else {
                    alert('更新失敗: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('更新請求失敗: ' + xhr.responseText);
                console.error('AJAX Error:', xhr.responseText);
            }
        });
    }

    // --- 教授更改開放時段邏輯 ---
    changeAvailabilityBtn.addEventListener('click', function() {
        isChangingAvailability = true;
        selectedSlotsForChange = [];
        $('.appointment-slot').removeClass('selected-for-change'); // 清除之前選中的樣式

        // 隱藏/顯示按鈕
        changeAvailabilityBtn.classList.add('d-none');
        setAvailableBtn.classList.remove('d-none');
        setUnavailableBtn.classList.remove('d-none');
        cancelChangeBtn.classList.remove('d-none');
        operationInstruction.textContent = '請點擊表格中的時段來選擇要更改狀態的時段。再次點擊取消選擇。';
    });

    cancelChangeBtn.addEventListener('click', function() {
        isChangingAvailability = false;
        selectedSlotsForChange = [];
        $('.appointment-slot').removeClass('selected-for-change'); // 移除選中樣式

        // 隱藏/顯示按鈕
        changeAvailabilityBtn.classList.remove('d-none');
        setAvailableBtn.classList.add('d-none');
        setUnavailableBtn.classList.add('d-none');
        cancelChangeBtn.classList.add('d-none');
        operationInstruction.textContent = '點擊時段進行選擇，然後點擊下方按鈕修改狀態。';

        loadAppointmentsAndCourses(currentSelectedDate); // 取消時重新載入以顯示最新狀態
    });


    // 初始載入（學生視圖），載入當前日期的預約和課程
    selectDateInput.value = currentSelectedDate;
    loadAppointmentsAndCourses(currentSelectedDate);
    updateView(); // 初始更新視圖
});