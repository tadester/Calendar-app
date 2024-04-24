const { google } = require('googleapis');

function listCalendarEvents(authClient, timeMin, timeMax, callback) {
    const calendar = google.calendar({version: 'v3', auth: authClient});
    calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500  // Adjust as necessary
    }, (err, res) => {
        if (err) callback(err, null);
        else callback(null, res.data.items.map(event => ({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime)
        })));
    });
}

module.exports = {
    listCalendarEvents,
};
