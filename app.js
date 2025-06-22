require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
// const multer = require('multer');
const fs = require('fs');
// const uploadDir = path.join(__dirname, 'uploads');

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
//   console.log('uploads 폴더 생성 완료');
// }
// 업로드 경로 및 파일 이름 설정
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, 'uploads')); // 파일 저장 폴더
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = file.originalname;
//     cb(null, uniqueName);
//   }
// });
// const upload = multer({ storage: storage });
const calendarRouter = require('./routes/calendarR');
const authRouter = require('./routes/authR');
const usersRouter = require('./routes/users'); // 필요한 경우
const studyRouter = require('./routes/studyR');
const app = express();
// let lastUploadedImage = null;
// app.post('/uploads', upload.single('thumbnail'), (req, res) => {
//    if (!req.file) return res.status(400).send('파일 없음');

//   lastUploadedImage = '/uploads/' + req.file.filename;
//   console.log('파일 정보:', req.file);
//   res.send('업로드 성공!');
// });

// ✅ 정적 파일 서빙 설정 (public 폴더 안의 이미지, css 등 접근 가능하게)
app.use(express.static(path.join(__dirname, 'public')));

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const session = require('express-session');
app.use(session({
  secret: 'my-secret',
  resave: false,
  saveUninitialized: true
}));


// 미들웨어
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
// 라우터 연결
app.use('/', authRouter);
app.use('/users', usersRouter); // 필요 시
app.use('/studyR',studyRouter);
app.use('/calendarR', calendarRouter);
app.get('/mypage', (req, res) => {
  res.render('mypage', { studies: [], ongoing: [], pending: []});
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 404 처리
app.use((req, res, next) => {
  next(createError(404));
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
