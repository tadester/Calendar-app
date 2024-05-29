const mongoose = require('mongoose');

// Define the schema for the Item model
const itemSchema = new mongoose.Schema({
    name: String,
    duration: Number,
    dueDate: Date,
    priority: Number  // Assuming priority is a string, you can change the type if needed
});

// Create the Item model
const Item = mongoose.model('Item', itemSchema);

// Export the Item model so it can be used in other files
module.exports = Item;
