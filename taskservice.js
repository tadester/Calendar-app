const Task = require('./taskmodel');

const createOrUpdateTask = async (title, description, duration, dueDate, googleEventId) => {
    try {
        const updatedTask = await Task.findOneAndUpdate(
            { title: title },
            { description: description, duration: duration, dueDate: dueDate, googleEventId: googleEventId },
            { new: true, upsert: true }
        );
        console.log('Task updated or inserted:', updatedTask);
        return updatedTask;
    } catch (err) {
        console.error('Error updating or inserting Task:', err);
    }
};

const getTask = async (id) => {
    try {
        const task = await Task.findById(id);
        return task;
    } catch (err) {
        console.error('Error retrieving task:', err);
        return null;
    }
};

const deleteTask = async (id) => {
    try {
        await Task.findByIdAndDelete(id);
        console.log('Task deleted');
    } catch (err) {
        console.error('Error deleting task:', err);
    }
};

const getAllTasks = async () => {
    try {
        const tasks = await Task.find({});
        return tasks;
    } catch (err) {
        console.error('Error retrieving tasks:', err);
        return [];
    }
};

module.exports = {
    createOrUpdateTask,
    getTask,
    deleteTask,
    getAllTasks
};
