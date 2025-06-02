document.addEventListener("DOMContentLoaded", function () {
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

    // ✅ 자동 슬라이드 시작 함수
    function startAutoSlide() {
        timer = setInterval(showNextSlide, 3000);
    }

    // ✅ 자동 슬라이드 멈춤 함수
    function stopAutoSlide() {
        clearInterval(timer);
    }

    // ✅ 마우스 올라가면 멈춤 / 벗어나면 다시 시작
    wrapper.addEventListener('mouseenter', stopAutoSlide);
    wrapper.addEventListener('mouseleave', startAutoSlide);

    // 초기 자동 슬라이드 시작
    startAutoSlide();
});
