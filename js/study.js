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
});


// 顯示更多論文按鈕功能
document.addEventListener('DOMContentLoaded', function () {

    



    // ----------------------------------------------------
    // 通用的「展開/收回」功能函數
    // ----------------------------------------------------
    function setupToggleSection(buttonId, contentId) {
        const toggleBtn = document.getElementById(buttonId);
        const toggleContent = document.getElementById(contentId);

        // 如果按鈕或內容區塊不存在，就直接返回
        if (!toggleBtn || !toggleContent) {
            return;
        }

        // 檢查內容區塊是否有子元素 (表示有更多內容)
        const hasMoreContent = toggleContent.children.length > 0;

        if (hasMoreContent) {
            toggleContent.classList.add('hidden'); // 預設隱藏更多內容
            toggleBtn.textContent = '展開更多';     // 預設按鈕文字
            toggleBtn.style.display = 'block';       // 確保按鈕顯示

            toggleBtn.addEventListener('click', function () {
                if (toggleContent.classList.contains('hidden')) {
                    toggleContent.classList.remove('hidden'); // 顯示內容
                    this.textContent = '收回';                 // 改變按鈕文字
                } else {
                    toggleContent.classList.add('hidden');    // 隱藏內容
                    this.textContent = '展開更多';             // 改變按鈕文字
                    // (可選) 捲動到按鈕上方，讓使用者看到內容被收回
                    // this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        } else {
            // 如果沒有更多內容，隱藏按鈕
            toggleBtn.style.display = 'none';
        }
    }

    // ----------------------------------------------------
    // 設定「最新論文」的展開/收回功能
    // ----------------------------------------------------
    setupToggleSection('showMoreBtn', 'morePapers');

    // ----------------------------------------------------
    // 設定「研究方向與瀏覽排行」的展開/收回功能
    // ----------------------------------------------------
    setupToggleSection('showMoreResearchBtn', 'moreResearchProjects');

});