document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('showMoreBtn');
    const more = document.getElementById('morePapers');
    if (btn && more) {
        btn.addEventListener('click', function () {
            more.classList.remove('hidden');
            this.style.display = 'none';
        });
    }
});
