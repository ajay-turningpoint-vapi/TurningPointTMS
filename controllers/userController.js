const Task = require("../models/Task");
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
  const { userName, department, emailID, phone, role, teamLeader, password } =
    req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found.");

    user.userName = userName || user.userName;
    user.department = department || user.department;
    user.emailID = emailID || user.emailID;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.teamLeader = teamLeader || user.teamLeader;
    if (password) user.password = password; // Password will be hashed in the model pre-save hook
    user.updatedStamp = Date.now();

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
    sendMail(
      user.userName,
      "User Created",
      `A new user has been created EmailId : &{user.emailID} and Password : &{req.body.password}`
    );

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
  const {
    userName,
    password,
    role,
    department,
    emailID,
    phone,
    teamLeader,
    reportingTo,
  } = req.body;

  try {
    // Construct the update object
    const updateFields = {};
    if (userName) updateFields.userName = userName;
    if (password) updateFields.password = password; // Password will be hashed in the model pre-save hook
    if (role) updateFields.role = role;
    if (department) updateFields.department = department;
    if (emailID) updateFields.emailID = emailID;
    if (phone) updateFields.phone = phone;
    if (teamLeader) updateFields.teamLeader = teamLeader;
    if (reportingTo) updateFields.reportingTo = reportingTo;
    updateFields.updatedStamp = Date.now();

    // Use findByIdAndUpdate to update the user
    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).send("User not found.");

    // Uncomment and modify this if you have a mail-sending functionality
    sendMail(
      user.emailID,
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

    // Delete all tasks assigned to the user
    await Task.deleteMany({ assignTo: user.emailID });

    await user.remove();

    sendMail(
      user.emailId,
      "User Deleted",
      "Your user account has been deleted."
    );

    res.send("User and assigned tasks removed.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
};
