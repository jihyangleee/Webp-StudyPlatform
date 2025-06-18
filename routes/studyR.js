var express = require('express');
const dayjs = require('dayjs');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 마이페이지 렌더링
router.get('/mypage', (req, res) => {
  // const userFilePath = path.join(__dirname, '../user.json');
  const filePath = path.join(__dirname, '../src/studies.json');
  // const users = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  // const loginUser = users.find(u => u.kakaoId);
  const { filter } = req.query;
  const now = dayjs();
  // const days = parseInt(req.query.deadlineDays, 7); // 예: 3일
    
  let studies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 해당 유저가 신청한 것만
  // studies = studies.filter(study => study.applicants.includes(loginUser));

   const filtered = studies.filter(study => {
    if (filter === 'soon') {
      return dayjs(study.deadline).diff(now, 'day') <= 3;
    } else if (filter === 'approved') {
      return study.status === 'approved';
    } else if (filter === 'pending') {
      return study.status === 'pending';
    }
    return true; // 필터 없음
  });

  res.render('mypage', { studies: filtered });
});

// 스터디 등록 페이지 렌더링
router.get('/studies/new', (req, res) => {
  res.render('studyEnroll', { study: {} });
});

//메인 페이지 렌더링
router.get('/webP', (req, res) => {
  const filePath = path.join(__dirname, '../src/studies.json');
  let studies = [];

  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }
  res.render('webP',{studies});  // views/webP.ejs를 렌더링
});

//필터링 기능 구현
router.get('/filter', (req, res) => {
  const { techstack, progress_method, deadline } = req.query;
  const filePath = path.join(__dirname, '../src/studies.json');

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const now = dayjs();

  const filtered = studies.filter(study => {
    const studyDeadline = dayjs(study.deadline);
    const isDeadlineOk = deadline === 'past'
      ? studyDeadline.isBefore(now, 'day')
      : deadline === 'future'
      ? studyDeadline.isAfter(now, 'day')
      : true;

    let techArray = [];
    try {
      if (typeof study.techstack === 'string') {
        techArray = JSON.parse(study.techstack).map(obj => obj.value);
      } else if (Array.isArray(study.techstack)) {
        techArray = study.techstack.map(obj => obj.value);
      }
    } catch (e) {
      techArray = [];
    }

    const hasTech = !techstack || techArray.includes(techstack);
    const matchesProgress = !progress_method || study.progress_method === progress_method;

    // techstack을 value만 join된 문자열로 치환
    study.techstack = techArray.join(', ');

    return isDeadlineOk && hasTech && matchesProgress;
  });

  res.render('webP', { studies: filtered });
});
  
// 검색 기능
router.get('/autocomplete', (req, res) => {
  const query = req.query.query?.toLowerCase() || '';
  const filePath = path.join(__dirname, '../src/studies.json');

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const matches = studies
    .map(study => study.title)
    .filter(title => title?.toLowerCase().includes(query))
    .slice(0, 3); // 최대 3개 추천

  res.json(matches);
});
  
// 글 저장
router.post('/studies', (req, res) => {
  const data = req.body;
  const action = req.body.action;
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
     if (action ==='upload') {
      res.redirect('/studyR/webP');
    } else {
      res.redirect('/studyR/mypage');
    }
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
  const action = req.body.action;
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');
  const fileData = fs.readFileSync(filePath, 'utf8');
  let studies = JSON.parse(fileData);
  const index = studies.findIndex(study => study.id === id);
  if (index === -1) return res.status(404).send('글 없음');

  studies[index] = { ...studies[index], ...req.body };
  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  if (action ==='upload') {
      res.redirect('/studyR/webP');
    } else {
      res.redirect('/studyR/mypage');
    }

  
});


module.exports = router;
