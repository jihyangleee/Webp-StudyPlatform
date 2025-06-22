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

router.post('/kakao', async (req, res) => {
  const kakaoToken = req.body.token;

  try {
    // 1. 카카오에서 사용자 정보 가져오기
    const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoToken}` }
    });

    const kakaoId = kakaoUser.data.id;
    const nickname = kakaoUser.data.kakao_account.profile.nickname;

    // 2. user.json에 사용자 저장
    let users = [];
    if (fs.existsSync(userFile)) {
      const data = fs.readFileSync(userFile);
      users = JSON.parse(data);
    }

    let user = users.find(u => u.kakaoId === kakaoId);
    if (!user) {
      user = { kakaoId, nickname };
      users.push(user);
      fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
    }

    // 3. 카카오userid을 쿠키에 저장 (JWT 대신)
    res
      .cookie('currentUserId', kakaoId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // 배포 시 true + HTTPS
        path: '/',
        maxAge: 1000 * 60 * 60 // 1시간
      })
      .json({ username: nickname });

  } catch (err) {
    console.error('카카오 API 오류:', err.message);
    res.status(400).json({ message: '카카오 인증 실패' });
  }
  const userId = req.cookies.currentUserId;
});


module.exports = router;