require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');

const authRouter = require('./routes/authR');
const usersRouter = require('./routes/users'); // 필요한 경우
const studyRouter = require('./routes/studyR');
const app = express();

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




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
