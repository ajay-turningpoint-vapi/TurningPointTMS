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
      emailID,
      "User Created for Turningpoint Taskfiy App",
      `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>User Created</h2>
        <p>A new user has been created with the following details:</p>
        <ul>
          <li><strong>Username:</strong> ${userName}</li>
          <li><strong>Department:</strong> ${department}</li>
          <li><strong>Email ID:</strong> ${emailID}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Role:</strong> ${role}</li>
          <li><strong>Password:</strong> ${req.body.password}</li>
        </ul>
         <p>Best regards,<br>Turning Point Team</p>
      </div>
      `
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

    const mailSubject = "User Details Updated";
    const mailHtmlContent = `<html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333333;
          font-size: 24px;
          text-align: center;
          margin-bottom: 20px;
        }
        p {
          font-size: 16px;
          color: #555555;
          margin: 10px 0;
        }
        .user-details {
          border: 1px solid #dddddd;
          border-radius: 4px;
          padding: 15px;
          background-color: #f9f9f9;
        }
        .user-details p {
          margin: 5px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Details Updated</h1>
        <p>Your user details have been updated. Please find the updated details below:</p>
        <div class="user-details">
          ${userName ? `<p><strong>User Name:</strong> ${userName}</p>` : ""}
          ${password ? `<p><strong>Password:</strong> ${password}</p>` : ""}
          ${role ? `<p><strong>Role:</strong> ${role}</p>` : ""}
          ${
            department
              ? `<p><strong>Department:</strong> ${department}</p>`
              : ""
          }
          ${emailID ? `<p><strong>Email ID:</strong> ${emailID}</p>` : ""}
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          ${
            teamLeader
              ? `<p><strong>Team Leader:</strong> ${teamLeader}</p>`
              : ""
          }
          
          <p><strong>Updated On:</strong> ${new Date(
            updateFields.updatedStamp
          ).toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Turning Point. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>`;

    sendMail(user.emailID, mailSubject, mailHtmlContent);

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

    await User.deleteOne({ _id: req.params.id });

    sendMail(
      user.emailID,
      "User Deleted",
      `
      <html>
        <body>
          <h2>Your Account has been Deleted</h2>
          <p>Dear ${user.userName},</p>
          <p>Your user account has been successfully deleted from our system.</p>
          <p>If you have any questions, please contact support.</p>
          <p>Best regards,<br>Turning Point Team</p>
        </body>
      </html>
      `
    );

    res.send("User and assigned tasks removed.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
};
