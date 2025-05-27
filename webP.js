document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.querySelector('.login');

    // 카카오 SDK 초기화 (주의: 한 번만 실행되어야 함)
    if (!Kakao.isInitialized()) {
        Kakao.init('bcd4e7a262e8b36b6931d781701f1abb'); // 너의 JavaScript 키
    }

    loginButton.addEventListener('click', function () {
        // 바로 카카오 로그인 팝업 실행
        Kakao.Auth.login({
            success: function (authObj) {
                console.log("카카오 로그인 성공!", authObj);

                // 서버에 토큰 보내기
                fetch('/auth/kakao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: authObj.access_token })
                })
                .then(res => res.json())
                .then(data => {
                    localStorage.setItem('jwt', data.token);
                    localStorage.setItem('username', data.username);

                    alert(`${data.username}님 환영합니다!`);
                    // location.href = '/dashboard.html'; // 로그인 후 이동할 페이지가 있다면 여기에 작성
                })
                .catch(err => {
                    alert("서버 인증 실패: " + JSON.stringify(err));
                });
            },
            fail: function (err) {
                alert("카카오 로그인 실패: " + JSON.stringify(err));
            }
        });
    });
});
