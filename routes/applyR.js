const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 스터디 데이터 로드 함수
function loadStudies() {
  const filePath = path.join(__dirname, '../src/studies.json');
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf8');
  return data ? JSON.parse(data) : [];
}

// 신청서 작성 폼
router.get('/apply/:id', (req, res) => {
  const studyId = req.params.id;
  const studies = loadStudies();
  const study = studies.find(s => s.id === studyId);
  if (!study) return res.status(404).send('스터디를 찾을 수 없습니다.');
  res.render('applyForm', { study });
});

// 신청서 제출 저장
router.post('/apply/:id', (req, res) => {
  const studyId = req.params.id;
  const filePath = path.join(__dirname, '../src/applications.json');

  // 기존 지원서 로드
  let applications = {};
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    applications = fileData ? JSON.parse(fileData) : {};
  } catch (err) {
    applications = {};
  }

  const newApplication = {
    id: req.cookies.currentUserId,
    studyId,
    ...req.body,
    submittedAt: new Date().toISOString()
  };

  if (!applications[studyId]) {
    applications[studyId] = [];
  }
  applications[studyId].push(newApplication);

  fs.writeFileSync(filePath, JSON.stringify(applications, null, 2), 'utf8');

  res.send('<h2>지원서가 제출되었습니다!</h2><a href="/main">메인으로 돌아가기</a>');
});

module.exports = router;

