const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
const PORT = 8000;

const JWT_SECRET = 'your_jwt_secret'; // 진짜 프로젝트에서는 .env로 따로 관리!

app.use(express.json());
app.use(express.static(__dirname));

// 사용자 정보 저장용 파일
const userFile = 'user.json';

// POST /auth/kakao
app.post('/auth/kakao', async (req, res) => {
  const kakaoToken = req.body.token;

  try {
    // 카카오 API로 사용자 정보 요청
    const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoToken}`,
      },
    });

    const kakaoId = kakaoUser.data.id;
    const nickname = kakaoUser.data.kakao_account.profile.nickname;

    // user.json 읽기 (없으면 빈 배열)
    let users = [];
    if (fs.existsSync(userFile)) {
      const data = fs.readFileSync(userFile);
      users = JSON.parse(data);
    }

    // 사용자 확인 or 추가
    let user = users.find(u => u.kakaoId === kakaoId);
    if (!user) {
      user = { kakaoId, nickname };
      users.push(user);
      fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
    }

    // JWT 생성
    const token = jwt.sign({ kakaoId, nickname }, JWT_SECRET, { expiresIn: '1h' });

    // 응답
    res.json({ username: nickname, token });

  } catch (err) {
    console.error('카카오 API 오류:', err.message);
    res.status(400).json({ message: '카카오 인증 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});


