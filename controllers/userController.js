const User = require("../models/User");
const sendMail = require("../utils/mailer");

//profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).send("User not found.");
    res.send(user);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Update current user profile
exports.updateUserProfile = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found.");

    user.username = username || user.username;
    if (password) user.password = password; // Password will be hashed in the model pre-save hook

    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let users;

    if (userRole === "Admin") {
      // Admin can see all users
      users = await User.find().select("-password");
    } else if (userRole === "TeamLeader") {
      // TeamLeader can see only their team members
      users = await User.find({ teamLeader: userId }).select("-password");
    } else {
      // Other roles should not access this route
      return res.status(403).send("Access denied.");
    }

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
  const { userName, department, emailID, phone, reportingTo, password, role } =
    req.body;
  const creatorRole = req.user.role;
  const teamLeader = req.user._id;
  if (creatorRole === "TeamLeader" && role !== "User") {
    return res.status(403).send("TeamLeaders can only create Users.");
  }
  try {
    // Check if user with the same emailID already exists
    let user = await User.findOne({ emailID });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Create a new user instance
    user = new User({
      userName,
      department,
      emailID,
      phone,
      reportingTo,
      password,
      role,
    });

    if (creatorRole === "TeamLeader") {
      user.teamLeader = teamLeader;
    }
    // Save the user to the database
    await user.save();

    // Optionally, you can send an email notification here
    // sendMail(user.username, 'User Created', 'A new user has been created for you.');

    // Send a success response with the created user object
    res
      .status(201)
      .json({ message: "User created successfully.", user, success: true });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ message: "Server error.", success: false });
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
