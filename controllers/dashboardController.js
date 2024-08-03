


const Task = require("../models/Task");
const User = require("../models/User");

// Helper function to calculate stats
const calculateStats = (tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const openTasks = tasks.filter((task) => task.status === "Open").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const now = new Date();

  const overdueTasks = tasks.filter(
    task => task.dueDate < now && task.status !== "Completed"
  ).length;

  const onTimeTasks = tasks.filter(
    task => task.status === "Completed" && task.dueDate >= task.closedAt
  ).length;

  const delayedTasks = tasks.filter(
    task => task.status === "Completed" && task.dueDate < task.closedAt
  ).length;

  return {
    totalTasks,
    completedTasks,
    openTasks,
    inProgressTasks,overdueTasks,
    onTimeTasks,
    delayedTasks,
    completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
  };
};

// Helper function to calculate category-wise stats
const calculateCategoryStats = (tasks) => {
  const categories = [...new Set(tasks.map((task) => task.category))];

  const categoryStats = categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.category === category);
    return {
      category,
      ...calculateStats(categoryTasks),
    };
  });

  return categoryStats;
};

// Helper function to get user task stats
const getUserTaskStats = async (emailID) => {
  const tasks = await Task.find({ assignTo: emailID });
  const stats = calculateStats(tasks);
  const categoryStats = calculateCategoryStats(tasks);

  return { stats, categoryStats };
};

// Helper function to get team leader stats
const getTeamLeaderStatus = async () => {
  const teamLeaders = await User.find({ role: "TeamLeader" }).lean();
  const userStatusPromises = teamLeaders.map(async (teamLeader) => {
    const teamMembers = await User.find({ teamLeader: teamLeader._id }).lean();

    const memberStatuses = await Promise.all(
      teamMembers.map(async (member) => {
        const memberStats = await getUserTaskStats(member.emailID);
        return {
          userName: member.userName,
          ...memberStats,
        };
      })
    );

    const leaderStats = await getUserTaskStats(teamLeader.emailID);

    return {
      teamLeader: teamLeader.userName,
      numberOfUsers: teamMembers.length,
      leaderStats,
      memberStatuses,
    };
  });

  return Promise.all(userStatusPromises);
};

// Helper function to get all users performance
const getAllUsersPerformance = async () => {
  const users = await User.find().lean(); // Exclude Admins
  const userPerformancePromises = users.map(async (user) => {
    const userStats = await getUserTaskStats(user.emailID);
    return {
      userName: user.userName,
      role: user.role,
      ...userStats,
    };
  });

  return Promise.all(userPerformancePromises);
};

// Get individual user stats
exports.getUserStats = async (req, res) => {
  try {
    const stats = await getUserTaskStats(req.user.emailID);
    res.send(stats);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Get team leader stats
exports.getTeamLeaderStats = async (req, res) => {
  try {
    const teamMembers = await User.find({
      role: "User",
      teamLeader: req.user._id,
    }).lean();
    const memberStatuses = await Promise.all(
      teamMembers.map(async (member) => {
        const memberStats = await getUserTaskStats(member.emailID);
        return {
          userName: member.userName,
          ...memberStats,
        };
      })
    );

    const leaderStats = await getUserTaskStats(req.user.emailID);

    res.send({ leaderStats, memberStatuses });
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Get overall stats
exports.getOverallStats = async (req, res) => {
  try {
    const tasks = await Task.find();
    const stats = calculateStats(tasks);
    const categoryStats = calculateCategoryStats(tasks);
    const teamLeaderStatus = await getTeamLeaderStatus();
    const allUsersPerformance = await getAllUsersPerformance();

    res.send({ stats, categoryStats, teamLeaderStatus, allUsersPerformance });
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

// Get all users performance
exports.getAllUsersPerformance = async (req, res) => {
  try {
    const allUsersPerformance = await getAllUsersPerformance();
    res.send(allUsersPerformance);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

const getCategoryWisePerformance = async () => {
  const tasks = await Task.find();
  const categoryStats = calculateCategoryStats(tasks);
  return categoryStats;
};
exports.getCategoryWisePerformance = async (req, res) => {
  try {
    const categoryStats = await getCategoryWisePerformance();
    res.send(categoryStats);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};






