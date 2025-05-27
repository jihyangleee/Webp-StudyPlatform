var express = require('express');
var router = express.Router();
// 마이페이지 렌더링
router.get('/mypage', (req, res) => {
  // 로그인 여부 확인 후 렌더링
  res.render('mypage');
});

// 스터디 등록 페이지 렌더링
router.get('/studies/new', (req, res) => {
  res.render('studyEnroll');  
});

module.exports = router;
