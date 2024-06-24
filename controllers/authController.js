const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/mailer');

exports.register = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).send('User already exists.');

    user = new User({ username, password, role });
    await user.save();

    const token = jwt.sign({ _id: user._id, role: user.role }, 'your_jwt_secret', {
      expiresIn: '1h'
    });

    sendMail(user.username, 'Registration Successful', 'You have successfully registered.');

    res.send({ token });
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Invalid credentials.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).send('Invalid credentials.');

    const token = jwt.sign({ _id: user._id, role: user.role }, 'your_jwt_secret', {
      expiresIn: '1h'
    });

    sendMail(user.username, 'Login Notification', 'You have successfully logged in.');

    res.send({ token });
  } catch (err) {
    res.status(500).send('Server error.');
  }
};
