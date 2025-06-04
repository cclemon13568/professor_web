document.addEventListener('DOMContentLoaded', function() {

    

    // DOM 元素引用
    const loginToggleButton = document.getElementById('login-toggle-btn');
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

    // 全局狀態變數
    let isProfessorLoggedIn = false; // 模擬登入狀態，預設為學生
    let isChangingAvailability = false; // 教授是否處於更改時段模式
    // 將初始日期設定為 2025-06-02 (星期一)
    let currentSelectedDate = '2025-06-02';
    let selectedSlotsForChange = []; // 儲存教授模式下選中的時段 { dayIndex, time }

    // 常量定義
    // 更改為只包含星期一到星期五，用於表格標頭顯示
    const daysOfWeekHeaders = ['一', '二', '三', '四', '五'];
    // 完整的星期名稱陣列，用於 Date.getDay() 的映射 (0=日, 1=一, ..., 6=六)
    const fullDaysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const timeSlots = [
        "09:00-09:30", "09:30-10:00", "10:00-10:30", "10:30-11:00",
        "11:00-11:30", "11:30-12:00",
        "12:00-12:30", "12:30-13:00",
        "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00",
        "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00"
    ];

    // 統一 API 路徑變數
    const API_BASE_URL = 'http://localhost/professor_web/api/'; // 基礎路徑
    const APPOINTMENT_API_URL = `${API_BASE_URL}appointment_info.php`;
    const COURSE_API_URL = `${API_BASE_URL}course_info.php`;

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

        // 登入按鈕文字
        loginToggleButton.textContent = isProfessorLoggedIn ? '登出 (教授)' : '登入';

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
                fetch(APPOINTMENT_API_URL),
                fetch(COURSE_API_URL) // 獲取所有課程
            ]);

            if (!appointmentsResponse.ok) {
                throw new Error(`HTTP error! status: ${appointmentsResponse.status} from appointments`);
            }
            if (!coursesResponse.ok) {
                throw new Error(`HTTP error! status: ${coursesResponse.status} from courses`);
            }

            const appointments = await appointmentsResponse.json();
            const courses = await coursesResponse.json();

            // 過濾 appointments 到當前選定日期
            const filteredAppointments = appointments.filter(app => {
                const appDate = new Date(app.appoint_Date).toISOString().slice(0, 10);
                // 這裡需要調整：如果表格顯示一週，則應過濾出這一週的數據
                // 目前您的 loadAppointmentsAndCourses 只接收單一日期，
                // 如果後端沒有提供範圍篩選，前端需要自行處理。
                // 為了不改動其他功能，我們還是只根據 currentSelectedDate 篩選，
                // 但在 renderScheduleTable 會根據當前週一到週五的日期來找數據。
                // 因此，這裡的 filteredAppointments 可能會缺少其他日期的數據，
                // 如果您的後端 API 只能獲取單日數據，您可能需要多次調用 API 來獲取一週數據。
                // 但根據您現有的 loadAppointmentsAndCourses，它會獲取所有預約，
                // 然後才在前端過濾，所以這裡的篩選邏輯其實對 `appointments` 變數沒有影響，
                // 真正影響的是 `combinedData` 和 `renderScheduleTable` 的查找。
                // For simplicity and adherence to "不改動其他功能", we proceed as if `appointments` contains all data.
                return true; // 這裡改為 true，假設 appointmentsResponse 包含了所有數據，之後在 renderScheduleTable 進行日期匹配
            });

            // 處理課程數據，生成「教授行程」的偽預約對象
            // 這個函數會將課程時段解析並轉換成預約時段格式
            // 這裡需要為一週的每一天生成教授行程
            const allProfessorCourseSlots = [];
            const selectedDateObj = new Date(date);
            const mondayOfSelectedWeek = getMondayOfWeek(selectedDateObj);

            for (let i = 0; i < 5; i++) { // 遍歷週一到週五
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
    function generateProfessorCourseSlots(courses, targetDateObj) {
        const professorSlots = [];
        const targetDayOfWeekChinese = getDayOfWeekInChinese(targetDateObj); // 例如 '星期一'
        const targetDateISO = targetDateObj.toISOString().slice(0, 10); // YYYY-MM-DD

        courses.forEach(course => {

            // meeting.js, 第 210 行 - 修正 console.log 語法
            console.log(`DEBUG: 處理課程ID: ${course.course_ID}, 原始時間字串: "${course.course_time}"`);

            // 修改正則表達式以捕獲所有星期幾
            // 假設格式是 "星期X、Y 時段" 或 "星期X 時段"
            // 修正 Regex: 移除了星期的 "?"，表示星期幾的部分是「必須」存在的
            const multiDayMatch = course.course_time.match(/^(星期[一二三四五六日](?:、星期[一二三四五六日])*)\s*(\d{2}:\d{2})[~-](\d{2}:\d{2})$/);

            if (multiDayMatch) {
                const daysPart = multiDayMatch[1]; // 星期幾部分 (例如 "星期二、三" 或 "星期三")
                const courseStartTimeStr = multiDayMatch[2]; // 開始時間 (例如 "12:10")
                const courseEndTimeStr = multiDayMatch[3];   // 結束時間 (例如 "13:00")

                let courseDays = [];
                if (daysPart) {
                    courseDays = daysPart.split('、'); // 按全形逗號分割星期
                } else {
                    // 根據新的 Regex，daysPart 不應該為空，除非數據異常
                    console.warn(`Course ${course.course_ID} has no day of week part after regex match, which is unexpected with current regex: ${course.course_time}`);
                    return;
                }

                // 檢查當前日期是否是該課程的星期之一
                if (courseDays.includes(targetDayOfWeekChinese)) {
                    // *** 這是之前反覆強調的 Date 物件創建語法修正處！ ***
                    const courseStartDateTime = new Date(`${targetDateISO}T${courseStartTimeStr}:00`);
                    const courseEndDateTime = new Date(`${targetDateISO}T${courseEndTimeStr}:00`);

                    timeSlots.forEach(slot => {
                        const slotStartTimeStr = slot.split('-')[0];
                        const slotEndTimeStr = slot.split('-')[1];

                        // *** 這裡也是 Date 物件創建語法修正處！ ***
                        const currentSlotStart = new Date(`${targetDateISO}T${slotStartTimeStr}:00`);
                        const currentSlotEnd = new Date(`${targetDateISO}T${slotEndTimeStr}:00`);

                        // 檢查課程時間與時段是否有重疊
                        if (courseStartDateTime.getTime() < currentSlotEnd.getTime() &&
                            courseEndDateTime.getTime() > currentSlotStart.getTime()) {

                            // 如果重疊，將其作為教授行程加入
                            professorSlots.push({
                                appointment_ID: `PROF_COURSE_${course.course_ID}_${targetDateISO.replace(/-/g, '')}_${slotStartTimeStr.replace(':', '')}`,
                                office_location: 'N/A', // 課程通常沒有具體辦公室
                                appoint_Date: `${targetDateISO} ${slotStartTimeStr}:00`, // 使用 slot 的精確開始時間
                                status: -1, // 教授行程狀態
                                student_ID: '',
                                student_Name: '教授課程', // 顯示為教授課程
                                student_email: '',
                                course_ID: course.course_ID, // 帶上課程ID
                                problem_description: `課程: ${course.course_name}` // 顯示課程名稱
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
    function renderScheduleTable(appointmentsData) {
        const $tbody = $('.schedule-table tbody');
        $tbody.empty(); // 清空所有內容，重新生成

        // 計算當前選擇日期所在週的星期一的日期
        const selectedDateObj = new Date(currentSelectedDate);
        const mondayOfSelectedWeek = getMondayOfWeek(selectedDateObj);

        timeSlots.forEach(time => {
            let rowHtml = `<tr><td>${time}</td>`;
            // 只遍歷週一到週五
            for (let i = 0; i < 5; i++) { // i 代表從星期一開始的偏移量 (0=週一, 1=週二, ...)
                const targetDay = new Date(mondayOfSelectedWeek);
                targetDay.setDate(mondayOfSelectedWeek.getDate() + i);
                const targetDateISO = targetDay.toISOString().slice(0, 10); // 格式為YYYY-MM-DD
                const chineseDayName = fullDaysOfWeek[targetDay.getDay()]; // 獲取正確的中文星期名稱 (日, 一, ..., 六)

                const fullDateTime = `${targetDateISO} ${time.split('-')[0]}:00`;

                // 找到對應的預約或教授行程
                let appointment = appointmentsData.find(app => {
                    // 為了比較日期時間，確保它們都是 ISO 8601 格式，且精確到秒
                    const dbAppointDateFormatted = app.appoint_Date ? new Date(app.appoint_Date).toISOString().slice(0, 19).replace('T', ' ') : '';
                    const slotDateTimeFormatted = new Date(fullDateTime).toISOString().slice(0, 19).replace('T', ' ');
                    return dbAppointDateFormatted === slotDateTimeFormatted && app.status >= 0; // 優先顯示真實預約 (0, 1, 2)
                });

                // 如果沒有真實預約，再檢查是否有教授行程 (-1)
                if (!appointment) {
                    appointment = appointmentsData.find(app => {
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

                // 只有當時段被佔用時，才顯示查看詳情按鈕
                if (dataStatus !== 'available') {
                    const btnText = (dataStatus === -1) ? '查看行程' : '查看預約';
                    // 確保只在教授模式下顯示按鈕，並且這個按鈕是 `professor-view-content` 的一部分
                    professorContentHtml += `<br><button class="btn btn-sm btn-info mt-1 view-appointment-btn" data-appointment-id="${dataAppointmentID}">${btnText}</button>`;
                }

                rowHtml += `
                        <td class="appointment-slot ${slotClass}"
                            data-day="${chineseDayName}"
                            data-time="${time}"
                            data-day-index="${targetDay.getDay()}" // 使用實際的getDay()值 (0-6)
                            data-status="${dataStatus}"
                            data-appointment-id="${dataAppointmentID}"
                            data-full-date="${targetDateISO}">
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
        for (let i = 0; i < 5; i++) {
            const targetDay = new Date(mondayOfSelectedWeek);
            targetDay.setDate(mondayOfSelectedWeek.getDate() + i);
            const dateString = `${targetDay.getMonth() + 1}/${targetDay.getDate()}`; // M/D 格式
            $thead.append(`<th>${daysOfWeekHeaders[i]}<br>${dateString}</th>`);
        }
    }

    // --- 事件監聽器 ---

    // 登入/登出切換
    loginToggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        isProfessorLoggedIn = !isProfessorLoggedIn;
        isChangingAvailability = false; // 切換身份後重置更改時段模式
        selectedSlotsForChange = []; // 清空選中的時段
        $('.appointment-slot').removeClass('selected-for-change'); // 移除所有選中樣式

        selectDateInput.value = currentSelectedDate; // 設定日期選擇器為當前日期
        loadAppointmentsAndCourses(currentSelectedDate); // 載入當前日期的預約和課程

        updateView();
    });

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
                        appointment_ID: appointmentID // 帶上可能的預約ID
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

    // 顯示預約詳情的函數 (新增此函數以避免代碼重複)
    function showAppointmentDetails(appointmentID) {
        if (!appointmentID) return; // 確保有預約 ID

        $.ajax({
            url: APPOINTMENT_API_URL, // 使用正確的 API URL
            method: 'GET',
            data: { appointment_ID: appointmentID },
            dataType: 'json',
            success: function(data) {
                if (data) {
                    $('#modal_appointment_ID').text(data.appointment_ID);
                    $('#modal_office_location').text(data.office_location || '無');
                    $('#modal_appoint_Date').text(data.appoint_Date);
                    $('#modal_status').text(getChineseStatus(data.status));
                    $('#modal_student_ID').text(data.student_ID || '無');
                    $('#modal_student_Name').text(data.student_Name || '無');
                    $('#modal_student_email').text(data.student_email || '無');
                    $('#modal_course_ID').text(data.course_ID || '無');
                    $('#modal_problem_description').text(data.problem_description || '無');

                    // 儲存當前查看的 appointment_ID 到按鈕上
                    $('#accept-appointment-btn').data('appointment_id', data.appointment_ID);
                    $('#reject-appointment-btn').data('appointment_id', data.appointment_ID);

                    // 根據當前狀態隱藏接受/拒絕按鈕
                    if (data.status == 2) { // 審查中才顯示接受/拒絕
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

        $.ajax({
            url: APPOINTMENT_API_URL, // 使用正確的 API URL
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
            url: APPOINTMENT_API_URL, // 使用正確的 API URL
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                appointment_ID: appointmentID,
                status: newStatus
            }),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('預約狀態更新成功！');
                    appointmentDetailModal.hide();
                    loadAppointmentsAndCourses(currentSelectedDate); // 重新載入以更新顯示
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

    setAvailableBtn.addEventListener('click', function() {
        if (selectedSlotsForChange.length === 0) {
            alert('請選擇至少一個時段。');
            return;
        }

        if (confirm('確定將選定的時段設為「開放」嗎？這將會刪除該時段內所有的學生預約及教授自訂行程！')) {
            const deletePromises = selectedSlotsForChange.map(slot => {
                // 只有當 slot.appointment_ID 存在且不為空時才發送 DELETE 請求
                if (slot.appointment_ID && slot.appointment_ID !== 'undefined') {
                    return $.ajax({
                        url: APPOINTMENT_API_URL + '?appointment_ID=' + slot.appointment_ID,
                        method: 'DELETE',
                        dataType: 'json'
                    });
                }
                // 如果沒有 appointment_ID，則直接解決 Promise，表示無需刪除
                return Promise.resolve({ success: true, message: '沒有現有預約可刪除或ID為空' });
            });

            Promise.all(deletePromises)
                .then(responses => {
                    alert('選定時段已設為開放，相關預約已刪除。');
                    cancelChangeBtn.click(); // 模擬點擊取消，重置狀態並重新載入課表
                })
                .catch(error => {
                    console.error('設定開放時段失敗:', error);
                    alert('設定開放時段失敗，請檢查控制台。');
                });
        }
    });

    setUnavailableBtn.addEventListener('click', function() {
        if (selectedSlotsForChange.length === 0) {
            alert('請選擇至少一個時段。');
            return;
        }

        const customContent = prompt("請輸入不開放的原因 (例如：會議, 上課):");
        if (customContent === null || customContent.trim() === '') {
            alert('必須提供不開放的原因。');
            return;
        }

        if (confirm(`確定將選定的時段設為不開放，原因為 "${customContent}" 嗎？這將會刪除該時段內所有的學生預約！`)) {
            const unavailablePromises = selectedSlotsForChange.map(slot => {
                const fullDateTime = slot.fullDateTime;

                // 嘗試刪除現有預約或教授行程，如果存在的話
                const deleteExistingPromise = (slot.appointment_ID && slot.appointment_ID !== 'undefined') ? $.ajax({
                    url: APPOINTMENT_API_URL + '?appointment_ID=' + slot.appointment_ID,
                    method: 'DELETE',
                    dataType: 'json'
                }) : Promise.resolve({ success: true, message: '沒有現有預約可刪除' });

                return deleteExistingPromise.then(() => {
                    // 確保生成一個新的唯一ID，避免與 PROF_COURSE_ 的ID衝突
                    const newUnavailableID = `PROF_UNAVAIL_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;

                    return $.ajax({
                        url: APPOINTMENT_API_URL,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            appointment_ID: newUnavailableID, // 使用新生成的唯一ID
                            office_location: 'N/A', // 根據您的需求填寫
                            appoint_Date: fullDateTime,
                            status: -1, // 設為教授自訂不可用
                            student_ID: '',
                            student_Name: '教授行程', // 顯示為教授行程
                            student_email: '',
                            course_ID: '', // 這裡因為是自訂行程，可以留空
                            problem_description: customContent // 顯示用戶輸入的原因
                        }),
                        dataType: 'json'
                    });
                });
            });

            Promise.all(unavailablePromises)
                .then(responses => {
                    alert('選定時段已設為不開放。');
                    cancelChangeBtn.click(); // 模擬點擊取消，重置狀態並重新載入課表
                })
                .catch(error => {
                    console.error('設定不開放時段失敗:', error);
                    alert('設定不開放時段失敗，請檢查控制台。');
                });
        }
    });

    // 初始載入（學生視圖），載入當前日期的預約和課程
    selectDateInput.value = currentSelectedDate;
    loadAppointmentsAndCourses(currentSelectedDate);
    updateView(); // 初始更新視圖
});