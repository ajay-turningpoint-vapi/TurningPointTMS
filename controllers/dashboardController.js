const Task = require('../models/Task');
const User = require('../models/User');

// Helper function to calculate stats
const calculateStats = (tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const openTasks = tasks.filter(task => task.status === 'Open').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;

  return {
    totalTasks,
    completedTasks,
    openTasks,
    inProgressTasks,
    completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0
  };
};

// Get individual user stats
exports.getUserStats = async (req, res) => {
  try {
    const tasks = await Task.find({ assignTo: req.user._id });
    const stats = calculateStats(tasks);

    res.send(stats);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

// Get team leader stats
exports.getTeamLeaderStats = async (req, res) => {
  try {
    const teamMembers = await User.find({ role: 'User' });
    const tasks = await Task.find({ assignTo: { $in: teamMembers.map(user => user._id) } });

    const stats = calculateStats(tasks);

    res.send(stats);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

// Get overall stats
exports.getOverallStats = async (req, res) => {
  try {
    const tasks = await Task.find();
    const stats = calculateStats(tasks);

    res.send(stats);
  } catch (err) {
    res.status(500).send('Server error.');
  }
};
