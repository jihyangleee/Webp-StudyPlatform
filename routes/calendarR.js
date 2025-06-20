require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.use(session({ secret: 'my-secret', resave: false, saveUninitialized: true }));

// ✅ STEP 2: 로그인 요청 보내기
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent' // refresh_token 항상 받기 위함
  });
  res.redirect(url);
});

// ✅ STEP 3: 구글이 리디렉션한 후 토큰 저장
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens;
  res.redirect('/calendar'); // 로그인 후 리디렉션 페이지
});

// ✅ STEP 4: FullCalendar UI 제공 (이건 클라이언트 JS로)
app.get('/calendar', (req, res) => {
  res.sendFile(__dirname + '/calendar.html');
});

// ✅ STEP 5: 클라이언트에서 일정 추가 요청 → 서버가 Google API 호출
app.use(express.json());

app.post('/add-google-event', async (req, res) => {
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
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    res.status(200).send('Event added to Google Calendar');
  } catch (err) {
    console.error('Error inserting event:', err);
    res.status(500).send('Error inserting event');
  }
});
module.exports = router;