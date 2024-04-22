const Item = require('./itemmodel');


const storeOrUpdateItem = async (name, duration , dueDate) => {
    try {
      const updatedItem = await Item.findOneAndUpdate(
        { name: name },
        { duration: duration },
        { dueDate: dueDate },
        { new: true, upsert: true }
      );
      console.log('Item updated or inserted:', updatedItem);
      return updatedItem;
    } catch (err) {
      console.error('Error updating or inserting Item:', err);
    }
  };
  
  const getDuration = async (name) => {
    try {
      const item = await Item.findOne({ name: name });
      return item ? item.duration : null;
    } catch (err) {
      console.error('Error retrieving item duration ', err);
      return null;
    }
  };
  const detDueDate = async (name) => {
    try {
      const item = await Item.findOne({ name: name });
      return item ? item.dueDate : null;
    } catch (err) {
      console.error('Error retrieving item duedate ', err);
      return null;
    }
  };
  