document.addEventListener("DOMContentLoaded", function () {
    // ✅ 마이페이지 버튼
    const mypageBtn = document.querySelector('.mypage');
    if (mypageBtn) {
        mypageBtn.addEventListener('click', function () {
            window.location.href = '/mypage';
        });
    }

    // ✅ 캐러셀
    const wrapper = document.querySelector('.carousel-wrapper');
    const carousel = document.querySelector('.carousel-images');
    const slides = document.querySelectorAll('.carousel-images img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let index = 0;
    let timer;

    function updateCarousel() {
        const slideWidth = wrapper.clientWidth;
        carousel.style.transform = `translateX(-${index * slideWidth}px)`;
    }

    function showNextSlide() {
        index = (index + 1) % slides.length;
        updateCarousel();
    }

    function showPrevSlide() {
        index = (index - 1 + slides.length) % slides.length;
        updateCarousel();
    }

    prevBtn.addEventListener('click', showPrevSlide);
    nextBtn.addEventListener('click', showNextSlide);

    window.addEventListener('resize', updateCarousel);
    updateCarousel();

    wrapper.addEventListener('mouseenter', () => clearInterval(timer));
    wrapper.addEventListener('mouseleave', () => timer = setInterval(showNextSlide, 3000));
    timer = setInterval(showNextSlide, 3000);

    // ✅ 자동완성
    const searchInput = document.getElementById('titleSearch');
    const list = document.getElementById('autocompleteList');

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query.length === 0) {
            list.innerHTML = '';
            return;
        }

        const res = await fetch(`/studyR/autocomplete?query=${encodeURIComponent(query)}`);
        const matches = await res.json();

        list.innerHTML = matches.map(title =>
            `<div class="autocomplete-item" onclick="selectTitle('${title}')">${title}</div>`
        ).join('');
    });

    function selectTitle(title) {
        searchInput.value = title;
        list.innerHTML = '';
    }

    // ✅ 검색 기능
    document.getElementById('searchBtn').addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        const studyCards = document.querySelectorAll('.project-card');
        studyCards.forEach(card => {
            const title = card.querySelector('strong').innerText.toLowerCase();
            card.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    // ✅ 필터 드롭다운 동작
    const toggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel') || document.getElementById('filterDropdown');
    const cancelBtn = document.getElementById('cancelFilter');
    const clearBtn = document.getElementById('clearFilters');

    if (toggleBtn && filterPanel) {
        toggleBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('hidden');
        });
    }

    if (cancelBtn && filterPanel) {
        cancelBtn.addEventListener('click', () => {
            filterPanel.classList.add('hidden');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('filterForm').reset();
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById('filterModal');
    const openBtn = document.getElementById('openFilterModal');
    const closeBtn = document.getElementById('closeFilterModal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
});
