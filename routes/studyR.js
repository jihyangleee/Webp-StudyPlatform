var express = require('express');
const dayjs = require('dayjs');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 마이페이지 렌더링
router.get('/mypage', (req, res) => {
  // const userFilePath = path.join(__dirname, '../user.json');
  const filePath = path.join(__dirname, '../src/studies.json');
  const appFile = path.join(__dirname, '../src/applications.json');
  // const users = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  // const loginUser = users.find(u => u.kakaoId);
  const { filter } = req.query;
  const now = dayjs();
  // const days = parseInt(req.query.deadlineDays, 7); // 예: 3일

  const allApplications = fs.existsSync(appFile)
  ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
  : {};
    
  let studies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const userId = req.cookies.currentUserId;  // ← 로그인한 사용자 kakaoId
  const myStudies = studies.filter(study => study.writer === userId);  // ← 내 글만 추출

  // 해당 유저가 신청한 것만
  // studies = studies.filter(study => study.applicants.includes(loginUser));

   const filtered = myStudies.filter(study => {
    if (filter === 'soon') {
      return dayjs(study.deadline).diff(now, 'day') <= 3;
    } else if (filter === 'approved') {
      return study.status === 'approved';
    } else if (filter === 'pending') {
      return study.status === 'pending';
    }
    return true; // 필터 없음
  });

    const myApplications = [];
  for (const [studyId, apps] of Object.entries(allApplications)) {
    apps.forEach(app => {
      if (app.userId === userId && app.hidden !== true) {
        const study = studies.find(s => String(s.id) === String(studyId));
        if (study) {
          myApplications.push({
            ...app,
            studyTitle: study.title,
            studyId: studyId
          });
        }
      }
    });
  }

  const ongoing = myApplications.filter(app => app.status === '합격');
  const pending = myApplications.filter(app => !app.status || app.status === '불합격' || app.status === '대기중');


  // 렌더링할 때 함께 넘기기
  res.render('mypage', {
    studies: filtered,
    ongoing,
    pending
  });
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
   
  res.render('webP', {studies: studies});  // views/webP.ejs를 렌더링
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
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);  // 예: '.png'
    const baseName = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now();
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });
router.post('/studies', upload.single('thumbnail'), (req, res) => {
  const data = req.body;
  const userId = req.cookies.currentUserId;
  const action = req.body.action;
  const filePath = path.join(__dirname, '../src/studies.json');

  let studies = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    studies = fileData ? JSON.parse(fileData) : [];
  }

  const newStudy = {
    id: Date.now().toString(),
    writer: userId || 'anonymous',
    ...data,
    thumbnailPath: req.file ? `/uploads/${req.file.filename}` : null // ← 파일 경로 저장
  };

  studies.push(newStudy);
  const jsonData = JSON.stringify(studies, null, 2);

  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('저장 실패');
    }

    if (action === 'upload') {
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

router.post('/studies/edit/:id', upload.single('thumbnail'), (req, res) => {
  const action = req.body.action;
  const id = req.params.id;
  const filePath = path.join(__dirname, '../src/studies.json');

  // 기존 데이터 불러오기
  const fileData = fs.readFileSync(filePath, 'utf8');
  let studies = JSON.parse(fileData);
  const index = studies.findIndex(study => study.id === id);
  if (index === -1) return res.status(404).send('글 없음');

  // 기존 글 가져오기
  const existing = studies[index];

  // 새로 업로드된 썸네일이 있으면 경로 갱신
  const updatedStudy = {
    ...existing,
    ...req.body,
    thumbnailPath: req.file ? `/uploads/${req.file.filename}` : existing.thumbnailPath
  };

  // 업데이트
  studies[index] = updatedStudy;

  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');

  if (action === 'upload') {
    res.redirect('/studyR/webP');
  } else {
    res.redirect('/studyR/mypage');
  }
});

// 스터디 자세히보기
router.get('/studies/:id', (req, res) => {
  const filePath = path.join(__dirname, '../src/studies.json');
  const appFile = path.join(__dirname, '../src/applications.json');
  const userId = req.cookies.currentUserId;

  const studies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const allApplications = fs.existsSync(appFile)
    ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
    : {};

  const study = studies.find(s => s.id === req.params.id);
  if (!study) return res.status(404).send('스터디를 찾을 수 없습니다.');

  // 해당 스터디에 대한 지원자 목록
  const studyApplications = Array.isArray(allApplications[study.id])
    ? allApplications[study.id]
    : [];

  // 현재 유저가 이 스터디에 이미 지원했는지 확인
  const alreadyApplied = studyApplications.some(app => app.userId === userId);

  res.render('studyDetail', {
    study,
    kakaoKey: process.env.KAKAO_JAVASCRIPT_KEY,
    alreadyApplied
  });
});


  // 지원서 작성 페이지 라우터
  router.get('/apply/:id/form', (req, res) => {
  const studyId = req.params.id;
  res.render('applicationForm', { studyId });
});

const applyFile = path.join(__dirname, '../src/applications.json');

router.post('/apply/:id', (req, res) => {
  const studyId = String(req.params.id);
  const userId = req.cookies.currentUserId;

  if (!userId) {
    return res.status(403).send('로그인이 필요합니다.');
  }

  const application = {
    userId,
    name: req.body.name,
    age: req.body.age,
    email: req.body.email,
    stack: req.body.stack,
    intro: req.body.intro,
    reason: req.body.reason,
    github: req.body.github,
    status: "대기중"
  };

  let allApplications = {};
  if (fs.existsSync(applyFile)) {
    try {
      allApplications = JSON.parse(fs.readFileSync(applyFile, 'utf8'));
    } catch (err) {
      console.error('지원서 JSON 파싱 실패:', err);
      return res.status(500).send('지원서 파일 읽기 오류');
    }
  }

  if (!Array.isArray(allApplications[studyId])) {
    allApplications[studyId] = [];
  }

  allApplications[studyId].push(application);

  try {
    fs.writeFileSync(applyFile, JSON.stringify(allApplications, null, 2));
    res.redirect('/studyR/mypage');
  } catch (err) {
    console.error('지원서 저장 오류:', err);
    res.status(500).send('지원서 저장 중 오류 발생');
  }
});

// 지원자 관리
router.get('/studies/manage/:id', (req, res) => {
  const userId = req.cookies.currentUserId;
  const studyId = req.params.id;

  const studyFile = path.join(__dirname, '../src/studies.json');
  const appFile = path.join(__dirname, '../src/applications.json');

  const studies = JSON.parse(fs.readFileSync(studyFile, 'utf8'));
  const allApplications = fs.existsSync(appFile)
    ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
    : {};

  const study = studies.find(s => s.id === studyId);

   if (!study || study.writer !== userId) {
    return res.status(403).send('권한이 없습니다.');
  }

  const applications = Array.isArray(allApplications[studyId])
    ? allApplications[studyId]
    : [];

  const approved = applications.filter(app => app.status === '합격');
  const pending = applications.filter(app => app.status !== '합격' && app.status !== '불합격');

  res.render('manageApplicants', {
    study,
    approved,
    pending
  });
});

// 지원 스터디 삭제
router.post('/applications/delete/:studyId', (req, res) => {
  const userId = req.cookies.currentUserId;
  const studyId = req.params.studyId;

  const appFile = path.join(__dirname, '../src/applications.json');
  const allApplications = JSON.parse(fs.readFileSync(appFile, 'utf8'));

  if (!Array.isArray(allApplications[studyId])) {
    return res.redirect('/mypage');
  }

  allApplications[studyId] = allApplications[studyId].map(app => {
    if (app.userId !== userId) return app;

    if (app.status === '합격') {
      return { ...app, hidden: true }; // 표시만 숨기기
    } else {
      return null; // 완전 삭제
    }
  }).filter(Boolean);

  fs.writeFileSync(appFile, JSON.stringify(allApplications, null, 2));
  res.redirect('/studyR/mypage');
});

// 지원자 상태 변경 (합격/불합격 처리용 POST 라우터)
router.post('/applications/:studyId/:userId', (req, res) => {
  const { studyId, userId } = req.params;
  const { status } = req.body;

  const appFile = path.join(__dirname, '../src/applications.json');
  const allApplications = fs.existsSync(appFile)
    ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
    : {};

  if (!Array.isArray(allApplications[studyId])) {
    return res.redirect('/studyR/mypage'); // 없으면 마이페이지로 튕김
  }

  // 해당 지원자 status 업데이트
  allApplications[studyId] = allApplications[studyId].map(app => {
    if (app.userId === userId) {
      return { ...app, status };
    }
    return app;
  });

  fs.writeFileSync(appFile, JSON.stringify(allApplications, null, 2));

  res.redirect(`/studyR/studies/manage/${studyId}`); // 다시 지원자 관리 페이지로
});



module.exports = router;
