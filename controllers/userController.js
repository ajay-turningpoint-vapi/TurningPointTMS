const User = require("../models/User");
const sendMail = require("../utils/mailer");


//profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).send('User not found.');
    res.send(user);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

// Update current user profile
exports.updateUserProfile = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send('User not found.');

    user.username = username || user.username;
    if (password) user.password = password; // Password will be hashed in the model pre-save hook

    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};




// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.send(users);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Get a user by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).send("User not found.");
    res.send(user);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Create a user
exports.createUser = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).send('User already exists.');

    user = new User({ username, password, role });
    await user.save();

    sendMail(user.username, 'User Created', 'A new user has been created for you.');

    res.status(201).send(user);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found.");

    user.username = username || user.username;
    if (password) user.password = password; // Password will be hashed in the model pre-save hook
    user.role = role || user.role;

    await user.save();

    sendMail(
      user.username,
      "User Updated",
      "Your user details have been updated."
    );

    res.send(user);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found.");

    await user.remove();

    sendMail(
      user.username,
      "User Deleted",
      "Your user account has been deleted."
    );

    res.send("User removed.");
  } catch (err) {
    res.status(500).send("Server error.");
  }
};
