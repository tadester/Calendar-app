const User = require('./usermodel');

const storeOrUpdateUser = async (email, refreshToken) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { refreshToken: refreshToken },
      { new: true, upsert: true }
    );
    console.log('User updated or inserted:', updatedUser);
    return updatedUser;
  } catch (err) {
    console.error('Error updating or inserting user:', err);
  }
};

const getRefreshToken = async (email) => {
  try {
    const user = await User.findOne({ email: email });
    return user ? user.refreshToken : null;
  } catch (err) {
    console.error('Error retrieving user refresh token:', err);
    return null;
  }
};

module.exports = {
  storeOrUpdateUser,
  getRefreshToken
};
