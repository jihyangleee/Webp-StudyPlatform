var express = require('express');
var router = express.Router();
// 마이페이지 렌더링
router.get('/mypage', (req, res) => {
  // 로그인 여부 확인 후 렌더링
  res.render('mypage');
});

// 스터디 등록 페이지 렌더링
router.get('/studies/new', (req, res) => {
  res.render('studyEnroll',{ study: {} } );  
});

router.post('/studies', (req, res) => {
  const data = req.body;
  //!!수정필요!!
  // data를 JSON 문자열로 변환
  const jsonData = JSON.stringify(data, null, 2);

  // 파일 저장 경로
  const filePath = path.join(__dirname, 'data', 'study.json');

  // 파일에 저장 (덮어쓰기)
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('저장 실패');
    }
    res.send('저장 완료');
  });
});

module.exports = router;
