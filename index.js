const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config({ path: './cal.env' });
const itemService = require('./itemservice');
const taskService = require('./taskservice');
const userService = require('./userservice');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("MongoDB connection error:", err);
    console.log('Exiting due to connection error');
    process.exit(1);  // Exit process if MongoDB connection fails
});

app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,  // Allow saving uninitialized session to make sure it persists
    cookie: { secure: false, maxAge: 60000 }  // Use secure: false for local development
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100  // limit each IP to 100 requests per windowMs
}));

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Token refresh handling
oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        console.log("New refresh token:", tokens.refresh_token);
        // Here you might want to store the refresh token in the database
    }
    console.log("New access token:", tokens.access_token);
});

// OAuth2 Google URL
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar', 'profile', 'email']
    });
    console.log("Generated auth URL:", url);
    res.redirect(url);
});

// OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
    console.log("Received authorization code:", req.query.code);
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        console.log("Tokens received from Google:", tokens);
        oauth2Client.setCredentials(tokens);

        // Save tokens in the session
        req.session.tokens = tokens;
        console.log("Tokens set in session, saving session...");
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send('Failed to save session.');
            }
            console.log("Tokens successfully saved in session:", req.session.tokens);
            res.redirect('/welcome');
        });
    } catch (error) {
        console.error('Error during Google OAuth callback:', error);
        res.status(500).send('Authentication failed.');
    }
});

// Middleware to log session details
app.use((req, res, next) => {
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    next();
});

// Middleware to set credentials for each request
app.use((req, res, next) => {
    if (req.session.tokens) {
        console.log("Setting OAuth2 client credentials from session:", req.session.tokens);
        oauth2Client.setCredentials(req.session.tokens);
    } else {
        console.log("No tokens found in session");
    }
    next();
});

app.get('/list-events', (req, res) => {
    if (!req.session.tokens) {
        console.log("No tokens found in session for /list-events");
        return res.status(401).send('Authentication required');
    }
    oauth2Client.setCredentials(req.session.tokens);

    listCalendarEvents(oauth2Client, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), (err, events) => {
        if (err) {
            console.log("Error listing calendar events:", err);
            res.status(500).send('Failed to retrieve events');
        } else {
            res.status(200).json(events);
        }
    });
});

// Define the function to list calendar events
const listCalendarEvents = (auth, start, end, callback) => {
    const calendar = google.calendar({ version: 'v3', auth });
    calendar.events.list({
        calendarId: 'primary',
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 100,  // Increase to fetch more events
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, res) => {
        if (err) {
            console.error('The API returned an error:', err);
            return callback(err, null);
        }
        const events = res.data.items;
        if (events.length) {
            console.log('Upcoming events:');
            events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
            });
            callback(null, events);
        } else {
            console.log('No upcoming events found.');
            callback(null, []);
        }
    });
};

app.post('/update-token', async (req, res) => {
    const { email, refreshToken } = req.body;
    try {
        const user = await userService.storeOrUpdateUser(email, refreshToken);
        res.status(200).json({ message: 'Refresh token updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update refresh token', error: err.message });
    }
});

app.post('/tasks', async (req, res) => {
    const { title, description, duration, dueDate } = req.body;
    try {
        if (!req.session.tokens) {
            console.log("No tokens found in session for /tasks");
            return res.status(401).send('Authentication required');
        }
        oauth2Client.setCredentials(req.session.tokens);

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
        const createdEvent = await google.calendar({ version: 'v3', auth: oauth2Client }).events.insert({
            calendarId: 'primary',
            resource: event,
        });

        // Store the Google Event ID in the task object
        const newTask = await taskService.createOrUpdateTask(title, description, duration, dueDate, createdEvent.data.id);

        res.status(201).send({ task: newTask, googleEventId: createdEvent.data.id });
    } catch (error) {
        console.error('Failed to create task and calendar event:', error);
        res.status(500).send(error);
    }
});

app.patch('/tasks/:taskId', async (req, res) => {
    const { title, description, duration, dueDate } = req.body;
    try {
        if (!req.session.tokens) {
            console.log("No tokens found in session for /tasks");
            return res.status(401).send('Authentication required');
        }
        oauth2Client.setCredentials(req.session.tokens);

        const task = await taskService.getTask(req.params.taskId);
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
        const updatedEvent = await google.calendar({ version: 'v3', auth: oauth2Client }).events.update({
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
        if (!req.session.tokens) {
            console.log("No tokens found in session for /tasks");
            return res.status(401).send('Authentication required');
        }
        oauth2Client.setCredentials(req.session.tokens);

        // Find the task in the database
        const task = await taskService.getTask(req.params.taskId);
        if (!task) {
            return res.status(404).send('Task not found.');
        }

        // Delete the event from Google Calendar
        try {
            await google.calendar({ version: 'v3', auth: oauth2Client }).events.delete({
                calendarId: 'primary',
                eventId: task.googleEventId,  // Use the stored Google Event ID to identify the event
            });
        } catch (error) {
            console.error('Error deleting the calendar event:', error);
            // Decide how to handle the error - you might choose to not delete the task if the event cannot be deleted
            return res.status(500).send('Failed to delete the associated calendar event.');
        }

        // Delete the task from MongoDB
        await taskService.deleteTask(req.params.taskId);
        res.status(204).send('Task and associated calendar event deleted successfully.');
    } catch (error) {
        console.error('Failed to delete task:', error);
        res.status(500).send('Failed to delete task.');
    }
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    console.error('Internal Server Error:', err);

    if (err.isOperational) {
        res.status(err.statusCode).send({ status: 'error', message: err.message });
    } else {
        // For unexpected errors, consider logging the stack trace and sending a generic message
        res.status(500).send({ status: 'error', message: 'An unexpected error occurred!' });
    }
});

// for todo list 
app.post('/items', async (req, res) => {
    const { name, duration, dueDate, priority } = req.body;

    if (!name || !duration) {
        return res.status(400).send('Name and duration are required.');
    }

    try {
        const newItem = await itemService.storeOrUpdateItem(name, duration, dueDate, priority);
        res.status(201).send({ message: 'Item added successfully', item: newItem });
    } catch (error) {
        console.error('Failed to add new item:', error);
        res.status(500).send('Error adding item to the database.');
    }
});

app.get('/items', async (req, res) => {
    let query = {};
    const { search, duration, dueDate, priority } = req.query;

    if (search) {
        query.name = { $regex: search, $options: 'i' };  // Case-insensitive partial match
    }
    if (duration) {
        query.duration = duration;
    }
    if (dueDate) {
        query.dueDate = new Date(dueDate);
    }
    if (priority){
        query.priority = priority;
    }

    try {
        const items = await itemService.getAllItems(query);
        if (items.length === 0) {
            // If there are no items, return an empty array
            return res.status(200).json([]);
        }
        res.status(200).json(items);
    } catch (error) {
        console.error('Failed to retrieve items:', error);
        res.status(500).send('Error retrieving items from the database.');
    }
});

const scheduleTasks = async () => {
    try {
        const items = await itemService.getAllItems({});
        const tasks = await taskService.getAllTasks();
        console.log("Items retrieved:", items);
        console.log("Tasks retrieved:", tasks);
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        const events = await new Promise((resolve, reject) => {
            listCalendarEvents(oauth2Client, now, end, (err, items) => {
                if (err) {
                    console.error("Error listing calendar events:", err);
                    reject(err);
                } else {
                    resolve(items);
                }
            });
        });

        // Combine items and tasks, and sort by duration (shortest to longest)
        const allTasks = [...items, ...tasks].sort((a, b) => a.duration - b.duration);

        const freeSlots = findFreeSlots(events, allTasks);
        console.log("Free slots calculated:", freeSlots);
        return freeSlots;
    } catch (error) {
        console.error("Error in scheduleTasks:", error);
        throw error;
    }
};

const findFreeSlots = (events, tasks) => {
    let slots = [];
    let availableSlots = calculateAvailableSlots(events);

    tasks.forEach(task => {
        for (let i = 0; i < availableSlots.length; i++) {
            const slot = availableSlots[i];
            const slotDuration = (slot.end.getTime() - slot.start.getTime()) / 60000; // Duration in minutes
            if (slotDuration >= task.duration) {
                const taskStart = new Date(slot.start);
                const taskEnd = new Date(taskStart.getTime() + task.duration * 60000);

                slots.push({
                    taskName: task.title || task.name, // use title if available, else use name
                    priority: task.priority,
                    start: taskStart,
                    end: taskEnd
                });

                // Update the start time of the current slot to reflect the booked time
                slot.start = taskEnd;
                break;  // Found a slot, no need to check further slots for this task
            }
        }
    });

    return slots;
};

function calculateAvailableSlots(events) {
    let availableSlots = [];
    // Calculate slots between events
    for (let i = 0; i < events.length - 1; i++) {
        const endCurrent = new Date(events[i].end.dateTime || events[i].end.date);
        const startNext = new Date(events[i + 1].start.dateTime || events[i + 1].start.date);
        if (endCurrent < startNext) {
            availableSlots.push({ start: endCurrent, end: startNext });
        }
    }
    // Consider adding slots before the first event and after the last event, as needed
    return availableSlots;
}

app.get('/optimize-schedule', async (req, res) => {
    try {
        console.log("Request received at /optimize-schedule");
        const scheduledTasks = await scheduleTasks();
        console.log("Scheduled tasks:", scheduledTasks);
        res.json({status: 'success', scheduledTasks});
    } catch (error) {
        console.error('Scheduling error:', error);
        res.status(500).send({status: 'error', message: 'Unable to optimize schedule due to internal error.'});
    }
});

app.get('/welcome', (req, res) => {
    res.send('Welcome! You are authenticated.');
});
