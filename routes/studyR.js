var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 마이페이지 랜더링
router.get('/mypage', (req, res) => {
  const userId = req.cookies.currentUserId || '';
  const studiesPath = path.join(__dirname, '../src/studies.json');
  const applicationsPath = path.join(__dirname, '../src/applications.json');

  let allStudies = [];
  if (fs.existsSync(studiesPath)) {
    const data = fs.readFileSync(studiesPath, 'utf8');
    allStudies = data ? JSON.parse(data) : [];
  }

  //  내가 쓴 글만 필터링
  const myStudies = allStudies.filter(study => study.userId === userId);

  //  내가 지원한 스터디 목록 구성
  let applications = {};
  if (fs.existsSync(applicationsPath)) {
    const data = fs.readFileSync(applicationsPath, 'utf8');
    applications = data ? JSON.parse(data) : {};
  }

  const myApplications = [];

  for (const [studyId, apps] of Object.entries(applications)) {
    apps.forEach(app => {
      if (app.id === userId) {
        const study = allStudies.find(s => s.id === studyId);
        if (study) {
          myApplications.push({
            title: study.title,
            deadline: study.deadline,
            status:
              app.status === 'accepted'
                ? ' 합격'
                : app.status === 'rejected'
                ? ' 불합격'
                : ' 대기 중'
          });
        }
      }
    });
  }

  res.render('mypage', {
    studies: myStudies,
    myApplications,
    currentUserId: userId
  });
});



// 스터디 등록 페이지 렌더링
router.get('/studies/new', (req, res) => {
  res.render('studyEnroll', { study: {} });
});

// 글 저장
router.post('/studies', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '../src/studies.json');

  if (data.techstack) {
    data.techstack = JSON.stringify(
      data.techstack.split(',').map(s => ({ value: s.trim() }))
    );
  }

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const newStudy = {
    id: Date.now().toString(),
    userId: req.cookies.currentUserId,
    ...data
  };

  studies.push(newStudy);
  const jsonData = JSON.stringify(studies, null, 2);

  fs.writeFileSync(filePath, jsonData, 'utf8');
  res.redirect('/studyR/mypage');

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

  const updatedData = { ...req.body };
  if (updatedData.techstack) {
    updatedData.techstack = JSON.stringify(
      updatedData.techstack.split(',').map(s => ({ value: s.trim() }))
    );
  }

  studies[index] = { ...studies[index], ...req.body };
  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  res.redirect('/studyR/mypage');
});

// 지원자 목록 보기
router.get('/studies/applicants/:id', (req, res) => {
  const studyId = req.params.id;
  const studiesPath = path.join(__dirname, '../src/studies.json');
  const applicationsPath = path.join(__dirname, '../src/applications.json');

  // 스터디 정보 읽기
  const studyData = fs.readFileSync(studiesPath, 'utf8');
  const studies = studyData ? JSON.parse(studyData) : [];
  const study = studies.find(s => s.id === studyId);
  if (!study) return res.status(404).send('스터디를 찾을 수 없습니다.');

  // 지원자 정보 읽기
  let applications = {};
  if (fs.existsSync(applicationsPath)) {
    const appData = fs.readFileSync(applicationsPath, 'utf8');
    applications = appData ? JSON.parse(appData) : {};
  }

  const applicantList = applications[studyId] || [];

  res.render('applicantList', { study, applicants: applicantList });
});

// 지원자 합격/불합격 처리
router.post('/studies/applicants/:studyId/:userId/:decision', (req, res) => {
  const { studyId, userId, decision } = req.params;
  const filePath = path.join(__dirname, '../src/applications.json');

  let applications = {};
  if (fs.existsSync(filePath)) {
    applications = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
  }

  const applicantList = applications[studyId] || [];
  const target = applicantList.find(app => app.id === userId);
  if (target) {
    target.status = decision === 'accept' ? 'accepted' : 'rejected';
    fs.writeFileSync(filePath, JSON.stringify(applications, null, 2), 'utf8');
  }

  res.redirect(`/studyR/studies/applicants/${studyId}`);
});


// 스터디 상세정보 보기
router.get('/studies/detail/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const study = studies.find(s => s.id == id);
  if (!study) return res.status(404).send('스터디를 찾을 수 없습니다.');

  res.render('studyDetail', { study });
});


module.exports = router;
