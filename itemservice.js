const Item = require('./itemmodel');

const storeOrUpdateItem = async (name, duration, dueDate, priority) => {
    try {
        const updatedItem = await Item.findOneAndUpdate(
            { name: name },
            { duration: duration, dueDate: dueDate, priority: priority },
            { new: true, upsert: true }
        );
        console.log('Item updated or inserted:', updatedItem);
        return updatedItem;
    } catch (err) {
        console.error('Error updating or inserting Item:', err);
    }
};

const getItem = async (name) => {
    try {
        const item = await Item.findOne({ name: name });
        return item;
    } catch (err) {
        console.error('Error retrieving item:', err);
        return null;
    }
};

const deleteItem = async (id) => {
    try {
        await Item.findByIdAndDelete(id);
        console.log('Item deleted');
    } catch (err) {
        console.error('Error deleting item:', err);
    }
};

const getAllItems = async (query) => {
    try {
        const items = await Item.find(query);
        return items;
    } catch (err) {
        console.error('Error retrieving items:', err);
        return [];
    }
};

module.exports = {
    storeOrUpdateItem,
    getItem,
    deleteItem,
    getAllItems
};
