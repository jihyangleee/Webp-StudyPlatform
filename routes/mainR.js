const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 메인 페이지 렌더링
router.get('/main', (req, res) => {
  const studiesPath = path.join(__dirname, '../src/studies.json');
  const applicationsPath = path.join(__dirname, '../src/applications.json');
  const userId = req.cookies.currentUserId || '';

  let studies = [];
  let applications = {};

  // studies.json 읽기
  if (fs.existsSync(studiesPath)) {
    const data = fs.readFileSync(studiesPath, 'utf-8');
    studies = data ? JSON.parse(data) : [];
  }

  // applications.json 읽기
  if (fs.existsSync(applicationsPath)) {
    const appData = fs.readFileSync(applicationsPath, 'utf-8');
    applications = appData ? JSON.parse(appData) : {};
  }

  // 기술 스택 및 지원 여부 처리
  studies.forEach(study => {
    try {
      const stackArray = JSON.parse(study.techstack);
      study.stackList = stackArray.map(s => s.value);
    } catch (err) {
      study.stackList = [];
    }

    const applicants = applications[study.id] || [];
    study.applied = applicants.some(app => app.id === userId); // 지원 여부 확인
  });

  res.render('main', { studies, currentUserId: userId });
});

module.exports = router;



