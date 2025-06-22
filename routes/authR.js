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
  try {
    const { token } = req.body;

    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const kakaoData = await kakaoRes.json();
    const kakaoId = kakaoData.id;
    const nickname = kakaoData.properties?.nickname || '익명';

    // 쿠키 설정
    res
      .cookie('currentUserId', kakaoId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 // 1시간
      })
      .cookie('currentUserName', nickname, {
        httpOnly: false, // localStorage용으로 JS에서 접근 가능하게
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60
      });

    // localStorage 저장용 정보 응답
    res.json({
      username: nickname,
      userId: kakaoId
    });

  } catch (err) {
    console.error('카카오 API 오류:', err.message);
    res.status(400).json({ message: '카카오 인증 실패' });
  }
});
router.post('/logout', (req, res) => {
  res.clearCookie('currentUserId');
  res.clearCookie('currentUserName');
  res.json({ success: true });
  Kakao.Auth.logout(function () {
  console.log('카카오에서 완전히 로그아웃됨');
});
});


module.exports = router;