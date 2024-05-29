const mongoose = require('mongoose');

// Define the schema for the Task model
const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    duration: Number,
    dueDate: Date,
    priority: String,
    googleEventId: String
});

// Create the Task model
const Task = mongoose.model('Task', taskSchema);

// Export the Task model so it can be used in other files
module.exports = Task;
