var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 마이페이지 렌더링
router.get('/mypage', (req, res) => {
  const filePath = path.join(__dirname, '../src/studies.json');
  let studies = [];

  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  res.render('mypage', { studies });
});

// 스터디 등록 페이지 렌더링
router.get('/studies/new', (req, res) => {
  res.render('studyEnroll', { study: {} });
});

// 글 저장
router.post('/studies', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '../src/studies.json');

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const newStudy = {
    id: Date.now().toString(),
    ...data
  };

  studies.push(newStudy);
  const jsonData = JSON.stringify(studies, null, 2);

  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('저장 실패');
    }
    res.redirect('/studyR/mypage');
  });
});

// 글 삭제
router.post('/studies/delete/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');
  let studies = [];

  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  studies = studies.filter(study => study.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  res.redirect('/studyR/mypage');
});

// 수정 폼 이동
router.get('/studies/edit/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');
  const fileData = fs.readFileSync(filePath, 'utf8');
  const studies = JSON.parse(fileData);
  const study = studies.find(study => study.id === id);
  if (!study) return res.status(404).send('글 없음');
  res.render('studyEnroll', { study });
});

// 수정 반영 저장
router.post('/studies/edit/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');
  const fileData = fs.readFileSync(filePath, 'utf8');
  let studies = JSON.parse(fileData);
  const index = studies.findIndex(study => study.id === id);
  if (index === -1) return res.status(404).send('글 없음');

  studies[index] = { ...studies[index], ...req.body };
  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  res.redirect('/studyR/mypage');
});

module.exports = router;
