// js/meeting.js

document.addEventListener('DOMContentLoaded', function () {
    // ** 模擬教授登入狀態的變數 **
    let isProfessorLoggedIn = localStorage.getItem('isProfessorLoggedIn') === 'true';

    const loginToggleButton = document.getElementById('login-toggle-btn');
    const appointmentSlots = document.querySelectorAll('.appointment-slot'); // 所有預約時段的單元格
    const setAvailabilityButton = document.getElementById('set-availability-btn'); // 新增的「開放預約」按鈕
    const professorModeControls = document.querySelector('.professor-mode-controls'); // 新增的操作說明和按鈕容器

    // *** 核心函數：切換教授登入狀態並更新介面 ***
    function toggleProfessorMode() {
        isProfessorLoggedIn = !isProfessorLoggedIn; // 切換狀態
        localStorage.setItem('isProfessorLoggedIn', isProfessorLoggedIn); // 將狀態存儲到 localStorage

        // 更新導覽列的登入按鈕文字和樣式
        if (loginToggleButton) {
            if (isProfessorLoggedIn) {
                loginToggleButton.textContent = '登出 (模擬教授)';
                loginToggleButton.classList.add('btn-warning');
                loginToggleButton.classList.remove('btn-outline-light');
            } else {
                loginToggleButton.textContent = '登入';
                loginToggleButton.classList.remove('btn-warning');
                loginToggleButton.classList.add('btn-outline-light');
            }
        }

        // 根據登入狀態，在 body 上添加或移除 'professor-mode' class
        // 這個 class 會被 meeting.css 用來控制教授操作的顯示/隱藏
        if (isProfessorLoggedIn) {
            document.body.classList.add('professor-mode');
            if (professorModeControls) professorModeControls.classList.remove('d-none'); // 顯示操作說明和按鈕
            // 進入教授模式時，移除所有 .selected 狀態，讓其顯示原始狀態
            appointmentSlots.forEach(slot => {
                slot.classList.remove('selected');
                updateSlotDisplay(slot); // 確保顯示正確的顏色
            });
        } else {
            document.body.classList.remove('professor-mode');
            if (professorModeControls) professorModeControls.classList.add('d-none'); // 隱藏操作說明和按鈕
            // 離開教授模式時，清除所有選取狀態
            appointmentSlots.forEach(slot => {
                slot.classList.remove('selected');
                updateSlotDisplay(slot); // 確保顯示正確的顏色
            });
        }

        console.log('預約頁面 - 教授模式:', isProfessorLoggedIn ? '開啟' : '關閉');
    }

    // 為模擬登入按鈕綁定事件
    if (loginToggleButton) {
        loginToggleButton.addEventListener('click', function(event) {
            event.preventDefault(); // 阻止頁面跳轉
            toggleProfessorMode();
        });
    }

    // *** 預約時段的顯示更新函數 ***
    function updateSlotDisplay(slot) {
        const currentStatus = slot.dataset.status;
        const studentViewText = slot.querySelector('.student-view-text');
        const professorActions = slot.querySelector('.professor-actions');

        // 移除所有可能的狀態 class，然後添加正確的 class
        // 注意：這裡不移除 'selected'，因為 'selected' 類由教授模式下的點擊獨立控制
        slot.classList.remove('available', 'booked', 'unavailable');
        slot.classList.add(currentStatus);

        // 更新學生視圖文字
        if (studentViewText) {
            switch (currentStatus) {
                case 'available':
                    studentViewText.textContent = '點擊預約';
                    studentViewText.style.color = '#007bff'; // 藍色
                    break;
                case 'booked':
                    studentViewText.textContent = '已被預約'; // 修改為「已被預約」
                    studentViewText.style.color = '#28a745'; // 綠色
                    break;
                case 'unavailable':
                    studentViewText.textContent = '無法預約';
                    studentViewText.style.color = '#6c757d'; // 灰色
                    break;
                default:
                    studentViewText.textContent = '未知狀態';
                    studentViewText.style.color = '#6c757d';
                    break;
            }
        }

        // 根據是否為教授模式，控制元素的可見性
        // 核心修改點：在教授模式下，只有 booked 狀態才顯示 professor-actions
        if (isProfessorLoggedIn) {
            if (currentStatus === 'booked') {
                if (studentViewText) studentViewText.style.display = 'none'; // 隱藏學生文字
                if (professorActions) professorActions.style.display = 'flex'; // 顯示接受/拒絕按鈕
            } else {
                if (studentViewText) studentViewText.style.display = 'block'; // 顯示學生文字（用於教授模式下查看狀態）
                if (professorActions) professorActions.style.display = 'none'; // 隱藏按鈕
            }
        } else { // 學生模式
            if (studentViewText) studentViewText.style.display = 'block'; // 顯示學生文字
            if (professorActions) professorActions.style.display = 'none'; // 隱藏按鈕
        }
    }


    // *** 綁定每個預約時段的事件監聽器 ***
    appointmentSlots.forEach(slot => {
        const acceptBtn = slot.querySelector('.accept-btn');
        const rejectBtn = slot.querySelector('.reject-btn');

        // 綁定「接受」按鈕事件
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function (event) {
                event.stopPropagation(); // 阻止事件冒泡到父層的 td 點擊事件
                if (!isProfessorLoggedIn) return; // 只有教授登入才生效

                if (slot.dataset.status === 'booked') { // 確保只處理已預約的時段
                    slot.dataset.status = 'booked'; // 接受後保持 'booked' 狀態
                    updateSlotDisplay(slot);
                    alert('預約已接受！(此為前端模擬)');
                }
            });
        }

        // 綁定「拒絕」按鈕事件
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function (event) {
                event.stopPropagation(); // 阻止事件冒泡
                if (!isProfessorLoggedIn) return; // 只有教授登入才生效

                if (slot.dataset.status === 'booked') { // 確保只處理已預約的時段
                    slot.dataset.status = 'unavailable'; // 拒絕後變為不可預約
                    updateSlotDisplay(slot);
                    alert('預約已拒絕！(此為前端模擬)');
                }
            });
        }

        // 預約時段單元格點擊事件
        slot.addEventListener('click', function(event) {
            // 如果點擊的是教授操作按鈕或其子元素，則不執行 TD 的點擊邏輯
            if (event.target.closest('.professor-actions')) {
                return;
            }

            if (isProfessorLoggedIn) {
                // 教授模式下，點擊未被預約的格子切換選取狀態 (用於開放預約)
                // 如果是 booked 狀態，點擊時則顯示接受/拒絕按鈕 (已由 CSS 和 updateSlotDisplay 控制顯示)
                if (this.dataset.status !== 'booked') {
                    this.classList.toggle('selected');
                } else {
                    // 如果是 booked 狀態，點擊時就讓 updateSlotDisplay 重新評估顯示
                    // 確保 professor-actions 再次可見
                    updateSlotDisplay(this);
                }
            } else {
                // 學生模式下，執行預約邏輯
                const currentStatus = this.dataset.status;
                if (currentStatus === 'available') {
                    if (confirm('確定要預約這個時段嗎？')) {
                        slot.dataset.status = 'booked'; // 模擬預約成功
                        updateSlotDisplay(slot);
                        alert('預約成功！(此為前端模擬)');
                        // 在這裡可以添加發送預約請求到後端的邏輯
                    }
                } else if (currentStatus === 'booked') {
                    alert('該時段已被預約。');
                } else { // unavailable
                    alert('該時段無法預約。');
                }
            }
        });

        // 初始載入時更新每個時段的顯示
        updateSlotDisplay(slot);
    });

    // *** 新增「開放預約」按鈕的事件監聽器 ***
    if (setAvailabilityButton) {
        setAvailabilityButton.addEventListener('click', function() {
            if (!isProfessorLoggedIn) {
                alert('您未登入教授模式，無法執行此操作。');
                return;
            }

            const selectedSlots = document.querySelectorAll('.appointment-slot.selected');

            if (confirm('確定要設定開放時段嗎？未選取的時段將設定為不可預約。')) { // 更新確認訊息
                // 首先，將所有時段都設定為 'unavailable'
                appointmentSlots.forEach(slot => {
                    slot.dataset.status = 'unavailable';
                    slot.classList.remove('selected'); // 移除選取狀態
                    updateSlotDisplay(slot); // 更新顯示
                });

                // 然後，將之前被選取的時段設定為 'available'
                selectedSlots.forEach(slot => {
                    slot.dataset.status = 'available';
                    slot.classList.remove('selected'); // 移除選取狀態
                    updateSlotDisplay(slot); // 更新顯示
                });

                alert('已成功設定開放時段！(此為前端模擬)');
            }
        });
    }


    // 初始載入時，根據 localStorage 判斷並初始化教授模式狀態
    // 這裡我們直接調用 toggleProfessorMode 一次，它會根據 localStorage 進行初始化
    // 首次載入時，如果 localStorage 是 true，它會被設為 false 然後再變成 true，所以需要一點調整
    // 更好的做法是在 DOMContentLoaded 裡直接根據 localStorage 狀態來設定 body class 和按鈕文字
    if (localStorage.getItem('isProfessorLoggedIn') === 'true') {
        document.body.classList.add('professor-mode');
        if (professorModeControls) professorModeControls.classList.remove('d-none');
        if (loginToggleButton) {
            loginToggleButton.textContent = '登出 (模擬教授)';
            loginToggleButton.classList.add('btn-warning');
            loginToggleButton.classList.remove('btn-outline-light');
        }
        appointmentSlots.forEach(slot => {
            updateSlotDisplay(slot); // 確保教授模式下的初始顯示正確
        });
    } else {
        document.body.classList.remove('professor-mode');
        if (professorModeControls) professorModeControls.classList.add('d-none');
        if (loginToggleButton) {
            loginToggleButton.textContent = '登入';
            loginToggleButton.classList.remove('btn-warning');
            loginToggleButton.classList.add('btn-outline-light');
        }
        appointmentSlots.forEach(slot => {
            updateSlotDisplay(slot); // 確保學生模式下的初始顯示正確
        });
    }


    // ===========================================
    // 瀏覽列互動效果
    // ===========================================
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const currentPage = window.location.pathname.split("/").pop(); // e.g. 'meeting.html'

    navLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (linkHref === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

});