const { google } = require('googleapis');

function listCalendarEvents(authClient, callback) {
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res.data.items);
        }
    });
}

module.exports = {
    listCalendarEvents,
};
