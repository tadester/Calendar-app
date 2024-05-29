const Task = require('./taskmodel');

const createOrUpdateTask = async (title, description, duration, dueDate, googleEventId) => {
    try {
        const task = await Task.findOneAndUpdate(
            { title },
            { title, description, duration, dueDate, googleEventId },
            { new: true, upsert: true }
        );
        return task;
    } catch (err) {
        console.error('Error updating or inserting task:', err);
    }
};

const getTask = async (taskId) => {
    try {
        return await Task.findById(taskId);
    } catch (err) {
        console.error('Error retrieving task:', err);
        return null;
    }
};

const getAllTasks = async () => {
    try {
        return await Task.find({});
    } catch (err) {
        console.error('Error retrieving all tasks:', err);
        return [];
    }
};

const deleteTask = async (taskId) => {
    try {
        await Task.findByIdAndDelete(taskId);
    } catch (err) {
        console.error('Error deleting task:', err);
    }
};

module.exports = {
    createOrUpdateTask,
    getTask,
    getAllTasks,
    deleteTask
};
