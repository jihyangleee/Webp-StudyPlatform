require('dotenv').config();
const express = require('express');
var router = express.Router();
const { google } = require('googleapis');
const session = require('express-session');
const app = express();
const fs = require('fs');
const path = require('path');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// ✅ STEP 2: 로그인 요청 보내기
router.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  res.redirect(url);
});

// ✅ STEP 3: 콜백에서 토큰 저장
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens;
  res.redirect('/studyR/mypage'); // 로그인 후 리디렉션
});

// router.get('/calendar', (req, res) => {
//   const filePath = path.join(__dirname, '../src/studies.json');
//   let studies = [];
//   if (fs.existsSync(filePath)) {
//     const fileData = fs.readFileSync(filePath, 'utf8');
//     studies = fileData ? JSON.parse(fileData) : [];
//   }

//   res.render('mypage', { studies }); // ✅ studies 전달
// });

// ✅ STEP 5: 구글 캘린더 API로 일정 추가
router.post('/add-google-event', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).send('Not authenticated');

  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: req.body.title,
    start: { dateTime: req.body.start },
    end: { dateTime: req.body.end }
  };

  try {
    await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    res.status(200).send('Event added to Google Calendar');
  } catch (err) {
    console.error('Error inserting event:', err);
    res.status(500).send('Error inserting event');
  }
});


router.get('/list-google-events', async (req, res) => {
  try {
    const tokens = req.session.tokens;
    if (!tokens) return res.status(401).send('Not authenticated');

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const start = new Date(req.query.start);
    const end = new Date(req.query.end);

    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = result.data.items.map(event => ({
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      allDay: !event.start.dateTime
    }));

    res.json(events);
  } catch (err) {
    console.error('❌ list-google-events error:', err);
    res.status(500).send(err.message);
  }
});
module.exports = router;