const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/mailer");
require("dotenv").config();
exports.register = async (req, res) => {
  const { userName, department, emailID, phone, password, role } = req.body;

  try {
    // Check if all required fields are provided
    if (!userName || !department || !emailID || !phone || !password || !role) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    // Check if the email or username is already in use
    let user = await User.findOne({ $or: [{ emailID }, { userName }] });
    if (user) {
      return res.status(400).json({
        message:
          user.emailID === emailID
            ? "Email already exists."
            : "Username already exists.",
      });
    }

    // Create a new user
    user = new User({
      userName,
      department,
      emailID,
      phone,
      role,
      password,
    });

    // Save the user to the database
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role, emailID: user.emailID },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    // Send registration success email (uncomment if you have email sending setup)
    // await sendMail(
    //   user.userName,
    //   "Registration Successful",
    //   "You have successfully registered."
    // );

    // Respond with the token and user info
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        userName: user.userName,
        department: user.department,
        emailID: user.emailID,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.login = async (req, res) => {
  const { emailID, password } = req.body;

  try {
    // Check if all required fields are provided
    if (!emailID || !password) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    // Check if the user exists
    const user = await User.findOne({ emailID });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Check if the password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Create the payload for the JWT
    const payload = {
      user,
    };

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role, emailID: user.emailID },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    // Send login notification email
    // await sendMail(user.userName, 'Login Notification', 'You have successfully logged in.');

    // Respond with the token and user info
    res.json({ token, user: payload.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
