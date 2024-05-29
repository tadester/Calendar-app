const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    duration: Number,
    dueDate: Date,
    priority: String,
    googleEventId: String
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
