var express = require('express');
const dayjs = require('dayjs');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 마이페이지 렌더링
const eventsPath = path.join(__dirname, '../src/schedule.json');
const notificationFile = path.join(__dirname, '../src/notifications.json');
router.get('/mypage', (req, res) => {
  // const userFilePath = path.join(__dirname, '../user.json');
  const savedEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8')); //캘린더 내용임
  const filePath = path.join(__dirname, '../src/studies.json');
  const appFile = path.join(__dirname, '../src/applications.json');
  // const users = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  // const loginUser = users.find(u => u.kakaoId);
  const { filter } = req.query;
  const now = dayjs();
  // const days = parseInt(req.query.deadlineDays, 7); // 예: 3일

  const allApplicationsRaw = fs.existsSync(appFile)
    ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
    : {};

  let studies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const userId = req.cookies.currentUserId;  // ← 로그인한 사용자 kakaoId
  const myStudies = studies.filter(study => study.writer === userId);  // ← 내 글만 추출
  if (!userId) return res.redirect('/login');

  let notifications = {};
  if (!fs.existsSync(notificationFile)) {
  fs.writeFileSync(notificationFile, '{}');
}
  if (fs.existsSync(notificationFile)) {
    try {
      notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
    } catch (err) {
      console.error('알림 파일 파싱 실패:', err);
      notifications = {};
    }
  }


  const userNoti = notifications[userId] || [];

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
  for (const [studyId, apps] of Object.entries(allApplicationsRaw)) {
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
  //캘린더 내용 그대로 렌더링
  const events = Array.isArray(savedEvents) ? savedEvents : [];

  //  합격 + 대기중/불합격 전체를 포함한 통합 배열 (일괄 삭제용)
  const allApplications = [...ongoing, ...pending];

  // 렌더링할 때 함께 넘기기
  res.render('mypage', {
    userId,
    notifications: userNoti,
    studies: filtered,
    ongoing,
    pending,
    events,
    allApplications  
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
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      studies = JSON.parse(raw); // ✅ 할당 필요
    } catch (err) {
      console.error('파일이 JSON 형식이 아닙니다:', raw.slice(0, 100));
    }
  }

  const filtered = studies.filter(study => study.action === 'upload');
  res.render('webP', { studies: filtered });
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

  studies = studies.filter(
    study => study.action?.toLowerCase().trim() !== 'enroll'
  );

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

  studies = studies.filter(
    study => study.action?.toLowerCase().trim() !== 'enroll'
  );

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
const marked = require('marked');
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
  // study.descriptionHtml = marked.parse(study.description || '');
  const newStudy = {
    id: Date.now().toString(),
    writer: userId || 'anonymous',
    ...data,
    thumbnailPath: req.file ? `/uploads/${req.file.filename}` : null,// ← 파일 경로 저장
    descriptionHtml: marked.parse(data.description || '')
  };


  studies.push(newStudy);
  const jsonData = JSON.stringify(studies, null, 2);

  fs.writeFile(filePath, jsonData, err => {
    if (err) return res.status(500).json({ error: '저장 실패' });
    return res.json({ redirect: action === 'upload' ? '/studyR/webP' : '/studyR/mypage' });
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

  studies = studies.filter(study => study.id.toString() !== id.toString());
  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  return res.json({ redirect: '/studyR/mypage' });
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
  if (index === -1) return res.status(404).json({ error: '글 없음' });

  // 기존 글 가져오기
  const existing = studies[index];
  const description = req.body.description || existing.description || '';
  

  // 새로 업로드된 썸네일이 있으면 경로 갱신
  const updatedStudy = {
    ...existing,
    ...req.body,
    thumbnailPath: req.file ? `/uploads/${req.file.filename}` : existing.thumbnailPath,
    descriptionHtml : marked.parse(description)
  };

  // 업데이트
  studies[index] = updatedStudy;

  fs.writeFileSync(filePath, JSON.stringify(studies, null, 2), 'utf8');
  return res.json({ redirect: action === 'upload' ? '/studyR/webP' : '/studyR/mypage' });
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
    alreadyApplied,
    currentUserId: userId
  });
});

// 지원서 폼 불러오기
router.get('/apply/:id/form', (req, res) => {
  const studyId = req.params.id;
  res.render('applicationForm', { studyId });
});
const studyFile = path.join(__dirname, '../src/studies.json');

// const applyFile = path.join(__dirname, '../src/applications.json');
// // apply뒤의 id는 studies의 id와 같다 writer가 아님
// router.post('/apply/:id', (req, res) => {
//   const studyId = String(req.params.id); // 이건 URL에서 /apply/:id 로 전달된 스터디 ID
//   const userId = req.cookies.currentUserId; // 현재 로그인한 사용자 ID
// 지원서 제출
router.post('/apply/:id', (req, res) => {
  const studyId = String(req.params.id);
  const userId = req.cookies.currentUserId;
  const applyFile = path.join(__dirname, '../src/applications.json');

  if (!userId) {
    return res.status(403).json({ error: '로그인이 필요합니다.' });
  }

  const application = {
    userId, // 지원한 사용자 ID
    name: req.body.name,
    age: req.body.age,
    email: req.body.email,
    stack: req.body.stack,
    intro: req.body.intro,
    reason: req.body.reason,
    github: req.body.github,
    status: "대기중"
  };

  // ✅ 지원서 저장
  let allApplications = {};
  if (fs.existsSync(applyFile)) {
    try {
      allApplications = JSON.parse(fs.readFileSync(applyFile, 'utf8'));
    } catch (err) {
      return res.status(500).json({ error: '지원서 JSON 파싱 실패' });
    }
  }

  if (!Array.isArray(allApplications[studyId])) {
    allApplications[studyId] = [];
  }

  const already = allApplications[studyId].find(app => app.userId === userId);
  if (already) {
    return res.status(400).json({ error: '이미 지원한 사용자입니다.' });
  }

  allApplications[studyId].push(application);

  try {
    fs.writeFileSync(applyFile, JSON.stringify(allApplications, null, 2));
  } catch (err) {
    console.error('지원서 저장 오류:', err);
    return res.status(500).send('지원서 저장 중 오류 발생');
  }
  // const notificationFile = path.join(__dirname, '../src/notifications.json');
  // ✅ 알림 저장
  try {
  const studies = JSON.parse(fs.readFileSync(studyFile, 'utf8'));
  const targetStudy = studies.find(study => study.id === studyId);
  if (!targetStudy) return res.status(404).send('스터디를 찾을 수 없습니다.');
  console.log('✅ targetStudy:', targetStudy);
  const ownerId = targetStudy.writer; // 관리자의 ID

  let notifications = {};
  if (fs.existsSync(notificationFile)) {
    notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
  }

  if (!Array.isArray(notifications[ownerId])) {
    notifications[ownerId] = [];
  }

  notifications[ownerId].push({
    message: `스터디 '${targetStudy.title}'에 새로운 지원이 도착했습니다.`,
    timestamp: new Date().toISOString(),
    read: false
  });

  fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));
} catch (err) {
  console.error('알림 저장 실패:', err);
}

  res.redirect('/studyR/mypage');
});

router.get('/notifications', (req, res) => {
  const userId = req.cookies.currentUserId;
  if (!userId) return res.json({ notifications: [] });

  let notifications = {};
  if (fs.existsSync(notificationFile)) {
    try {
      notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
    } catch (err) {
      console.error('알림 파싱 실패:', err);
    }
  }

  const userNoti = notifications[userId] || [];
  res.json({ notifications: userNoti });
});
//알림기능 읽음 처리
router.post('/notifications/:timestamp/read', (req, res) => {
  const userId = req.cookies.currentUserId;
  if (!userId) return res.status(403).send('로그인이 필요합니다.');

  if (!fs.existsSync(notificationFile)) return res.status(404).send('알림 파일 없음');
  const notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));

  if (!Array.isArray(notifications[userId])) return res.status(404).send('알림 없음');

  notifications[userId] = notifications[userId].map(noti => {
    if (noti.timestamp === req.params.timestamp) {
      return { ...noti, read: true };
    }
    return noti;
  });

  fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));
  res.sendStatus(200);
});
//알림기능 삭제 처리
router.post('/notifications/:timestamp/delete', (req, res) => {
  const userId = req.cookies.currentUserId;
  if (!userId) return res.status(403).send('로그인이 필요합니다.');

  if (!fs.existsSync(notificationFile)) return res.status(404).send('알림 파일 없음');
  const notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));

  if (!Array.isArray(notifications[userId])) return res.status(404).send('알림 없음');

  notifications[userId] = notifications[userId].filter(noti => noti.timestamp !== req.params.timestamp);

  fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));
  res.sendStatus(200);
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


// 지원자 상태 변경
router.post('/applications/:studyId/:userId', (req, res) => {
  const { studyId, userId } = req.params;
  const { status } = req.body;

  const appFile = path.join(__dirname, '../src/applications.json');
  const allApplications = fs.existsSync(appFile)
    ? JSON.parse(fs.readFileSync(appFile, 'utf8'))
    : {};

  if (!Array.isArray(allApplications[studyId])) {
    return res.status(404).json({ error: '해당 스터디 지원서 없음' });
  }

  allApplications[studyId] = allApplications[studyId].map(app => {
    if (app.userId === userId) {
      return { ...app, status };
    }
    return app;
  });

  fs.writeFileSync(appFile, JSON.stringify(allApplications, null, 2));
  return res.json({ redirect: `/studyR/studies/manage/${studyId}` });
});


// 지원 스터디 일괄 삭제
router.post('/applications/delete-bulk', (req, res) => {
  const { studyIds } = req.body;
  const userId = req.cookies.currentUserId;
  const filePath = path.join(__dirname, '../src/applications.json');

  if (!fs.existsSync(filePath)) return res.sendStatus(404);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let changed = false;
  studyIds.forEach(studyId => {
    const sid = String(studyId);
    if (data[sid]) {
      const originalLength = data[sid].length;
      data[sid] = data[sid].filter(app => app.userId !== userId);
      if (data[sid].length < originalLength) changed = true;
    }
  });

  if (!changed) return res.sendStatus(404);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.sendStatus(200);
});




module.exports = router;
