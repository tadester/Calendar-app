
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1  // Duration in minutes, must be at least 1 minute
    },
    dueDate: {
        type: Date,
        default: null  // Optional due date
    },
    priority: {
        type: Number,
        default: 0
    }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;