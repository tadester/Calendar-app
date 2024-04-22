const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const calendarAPI = require('./calendar');
require('dotenv').config({ path: './cal.env'});
const helmet = require('helmet');
app.use(helmet());
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);
const app = express();
const PORT = process.env.PORT;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);
// Automatically refresh and store tokens when they expire
oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in your database!
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
  });
  
  // Set credentials including refresh token
  oauth2Client.setCredentials({
    refresh_token: "STORED_REFRESH_TOKEN"
  });
// Google's OAuth2 URL
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar', 'profile', 'email']
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { tokens } = await oauth2Client.getToken(req.query.code);
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens;
  res.redirect('/welcome');
});

app.get('/list-events', (req, res) => {
  if (!req.session.tokens) return res.status(401).send('Authentication required');
  oauth2Client.setCredentials(req.session.tokens);

  calendarAPI.listCalendarEvents(oauth2Client, (err, events) => {
    if (err) {
      res.status(500).send('Failed to retrieve events');
    } else {
      res.status(200).json(events);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
