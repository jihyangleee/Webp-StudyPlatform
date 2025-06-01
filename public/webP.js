document.addEventListener("DOMContentLoaded", function () {
    // 메인페이지용 로직만 넣기 (예: 마이페이지 버튼 처리)
    const mypageBtn = document.querySelector('.mypage');
    if (mypageBtn) {
        mypageBtn.addEventListener('click', function () {
            window.location.href = '/studyR/mypage';
        });
    }
});

const carousel = document.querySelector('.carousel-images');
const slides = document.querySelectorAll('.carousel-images img');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let index = 0;

function updateCarousel() {
    carousel.style.transform = `translateX(-${index * 600}px)`;
}

prevBtn.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    updateCarousel();
});

nextBtn.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    updateCarousel();
});
// 반응형 대응: 브라우저 크기 변경 시 슬라이드 위치 보정
window.addEventListener('resize', updateCarousel);

// 초기 위치
updateCarousel();