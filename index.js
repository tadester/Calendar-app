const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const bodyParser = require('body-parser');
const Task = require('./TaskModel');
const calendarAPI = require('./calendar');
require('dotenv').config({ path: './cal.env'});
const helmet = require('helmet');
app.use(helmet());
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

mongoose.connect('mongodb://localhost/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Task model
const TaskSchema = new mongoose.Schema({
  title: String,
  googleEventId: String,
});
const Task = mongoose.model('Task', TaskSchema);
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

app.post('/update-token', async (req, res) => {
    const { email, refreshToken } = req.body;
    try {
      const user = await UserService.storeOrUpdateUser(email, refreshToken);
      res.status(200).json({ message: 'Refresh token updated', user });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update refresh token', error: err.message });
    }
  });

  app.post('/tasks', async (req, res) => {
    const { title, description, duration, dueDate } = req.body;
    try {
      // Create the task instance but don't save yet
      const newTask = new Task({ title, description, duration, dueDate });
  
      // Define the calendar event
      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: new Date(dueDate).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(new Date(dueDate).getTime() + duration * 60000).toISOString(),
          timeZone: 'America/New_York',
        }
      };
  
      // Insert the event into Google Calendar
      const createdEvent = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
  
      // Store the Google Event ID in the task object
      newTask.googleEventId = createdEvent.data.id;
      await newTask.save();
  
      res.status(201).send({ task: newTask, googleEventId: createdEvent.data.id });
    } catch (error) {
      console.error('Failed to create task and calendar event:', error);
      res.status(500).send(error);
    }
  });
  app.patch('/tasks/:taskId', async (req, res) => {
    const { title, description, duration, dueDate } = req.body;
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) {
        return res.status(404).send('Task not found');
      }
  
      // Update the task details
      task.title = title;
      task.description = description;
      task.duration = duration;
      task.dueDate = dueDate;
      await task.save();
  
      // Update the Google Calendar event using the stored event ID
      const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId: task.googleEventId,
        resource: {
          summary: title,
          description: description,
          start: {
            dateTime: new Date(dueDate).toISOString(),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: new Date(new Date(dueDate).getTime() + duration * 60000).toISOString(),
            timeZone: 'America/New_York',
          }
        }
      });
  
      res.send({ task, updatedEvent: updatedEvent.data });
    } catch (error) {
      console.error('Error updating task and calendar event:', error);
      res.status(500).send(error);
    }
  });
  app.delete('/tasks/:taskId', async (req, res) => {
    try {
        // Find the task in the database
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).send('Task not found.');
        }

        // Delete the event from Google Calendar
        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: task.googleEventId,  // Use the stored Google Event ID to identify the event
            });
        } catch (error) {
            console.error('Error deleting the calendar event:', error);
            // Decide how to handle the error - you might choose to not delete the task if the event cannot be deleted
            return res.status(500).send('Failed to delete the associated calendar event.');
        }

        // Delete the task from MongoDB
        await task.remove();
        res.status(204).send('Task and associated calendar event deleted successfully.');
    } catch (error) {
        console.error('Failed to delete task:', error);
        res.status(500).send('Failed to delete task.');
    }
});


    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send(error);
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
