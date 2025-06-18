const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const userFile = path.join(__dirname, '..', 'user.json');

// 루트 접속 시 /login으로 리다이렉트
router.get('/', (req, res) => {
  res.redirect('/login');
});

// 로그인 페이지 렌더링
router.get('/login', (req, res) => {
  res.render('login', { kakaoKey: process.env.KAKAO_JAVASCRIPT_KEY });
});

// POST /auth/kakao 요청 처리
router.post('/kakao', async (req, res) => {
  const kakaoToken = req.body.token;

  try {
    const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoToken}` }
    });

    const kakaoId = kakaoUser.data.id;
    const nickname = kakaoUser.data.kakao_account.profile.nickname;

    // user.json 읽기
    let users = [];
    if (fs.existsSync(userFile)) {
      const data = fs.readFileSync(userFile);
      users = JSON.parse(data);
    }

    // 신규 사용자인지 확인 후 추가
    let user = users.find(u => u.kakaoId === kakaoId);
    if (!user) {
      user = { kakaoId, nickname };
      users.push(user);
      fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
    }

    // JWT 생성
    const token = jwt.sign({ kakaoId, nickname }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ username: nickname, token });

  } catch (err) {
    console.error('카카오 API 오류:', err.message);
    res.status(400).json({ message: '카카오 인증 실패' });
  }
}); //access token을 서버에 보내면 이를 통해 jwt 발급 이것을 쿠키나 로컬 스토리지에 저장

module.exports = router;
