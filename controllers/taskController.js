const { default: mongoose } = require("mongoose");
const {
  scheduleReminders,
  cancelReminder,
  getNextDueDate,
} = require("../CronJobs/reminderScheduler");
const Task = require("../models/Task");
const sendMail = require("../utils/mailer");
const User = require("../models/User");
const {
  calculateNextDueDate,
  scheduleNextTaskCreation,
} = require("../utils/taskHelper");

exports.createTask = async (req, res) => {
  const {
    title,
    description,
    category,
    assignTo,
    priority,
    dueDate,
    attachments,
    reminder,
    repeat,
  } = req.body;

  try {
    // Create the initial task
    const newTask = new Task({
      title,
      description,
      category,
      assignTo,
      priority,
      dueDate,
      createdBy: req.user.emailID,
      currentUser: req.user.emailID,
      attachments,
      reminder: reminder || null,
      repeat: repeat
      ? {
          frequency: repeat.frequency,
          weeklyDays: repeat.weeklyDays || [],
          monthlyDays: repeat.monthlyDays || [],
          nextDueDate: calculateNextDueDate(dueDate, repeat.frequency, repeat.weeklyDays, repeat.monthlyDays), // Set initial next due date
        }
      : null,
    });

    const task = await newTask.save();
    if (repeat) {
      scheduleNextTaskCreation(task);
    }
    if (reminder) {
      scheduleReminders(task);
    }
    sendMail(
      task.assignTo,
      "Exciting News! A New Task Awaits You",
      `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0056b3;">You've Got a New Task!</h2>
          <p>${
            req.user.emailID
          } has assigned you a new task. Dive into the details below and get started!</p>
          <hr>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Assigned To:</strong> ${assignTo}</p>
          <p><strong>Priority:</strong> <span style="color: ${
            priority === "High" ? "red" : "green"
          };">${priority}</span></p>
          <p><strong>Due Date:</strong> ${new Date(
            dueDate
          ).toLocaleDateString()}</p>
          <hr>
           <p>Best regards,<br>Turning Point Team</p>
        </body>
      </html>
      `
    );
    res.status(201).send(task);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error.");
  }
};

exports.getTasks = async (req, res) => {
  try {
    const emailID = req.user.emailID;
    const userRole = req.user.role;
    const userId = req.user._id;

    let tasksQuery = {};

    let tasks;

    if (userRole === "Admin") {
      // Admin can see all tasks
      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else if (userRole === "TeamLeader") {
      // TeamLeader can see tasks assigned to them and their team
      const teamMembers = await User.find({ teamLeader: userId }).select("emailID");
      const teamMemberEmailIds = teamMembers.map(member => member.emailID);

      tasksQuery.$or = [
        { assignTo: emailID },
        { assignTo: { $in: teamMemberEmailIds } }
      ];

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else {
      // Regular user can see tasks assigned to them
      tasksQuery.assignTo = emailID;

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    }

    res.json({ message: "Tasks retrieved successfully", tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.getOverdueTasks = async (req, res) => {
  try {
    const emailID = req.user.emailID;
    const userRole = req.user.role;
    const userId = req.user._id;

    const currentDate = new Date();

    let tasksQuery = {
      dueDate: { $lt: currentDate }, // Tasks with dueDate less than current date
      status: { $ne: 'Completed' } // Tasks that are not completed
    };

    let tasks;

    if (userRole === "Admin") {
      // Admin can see all overdue tasks
      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else if (userRole === "TeamLeader") {
      // TeamLeader can see overdue tasks assigned to them and their team
      const teamMembers = await User.find({ teamLeader: userId }).select("emailID");
      const teamMemberEmailIds = teamMembers.map(member => member.emailID);

      tasksQuery.$or = [
        { assignTo: emailID },
        { assignTo: { $in: teamMemberEmailIds } }
      ];

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else {
      // Regular user can see overdue tasks assigned to them
      tasksQuery.assignTo = emailID;

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    }

    res.json({ message: "Overdue tasks retrieved successfully", tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};
exports.getDelayedTasks = async (req, res) => {
  try {
    const emailID = req.user.emailID;
    const userRole = req.user.role;
    const userId = req.user._id;

    const currentDate = new Date();

    let tasksQuery = {
      dueDate: { $lt: currentDate }, // Tasks with dueDate less than current date
      status: 'Completed' // Tasks that are completed
    };

    let tasks;

    if (userRole === "Admin") {
      // Admin can see all delayed tasks
      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else if (userRole === "TeamLeader") {
      // TeamLeader can see delayed tasks assigned to them and their team
      const teamMembers = await User.find({ teamLeader: userId }).select("emailID");
      const teamMemberEmailIds = teamMembers.map(member => member.emailID);

      tasksQuery.$or = [
        { assignTo: emailID },
        { assignTo: { $in: teamMemberEmailIds } }
      ];

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    } else {
      // Regular user can see delayed tasks assigned to them
      tasksQuery.assignTo = emailID;

      tasks = await Task.aggregate([
        { $match: tasksQuery },
        { $sort: { _id: -1 } },
        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } }
      ]);
    }

    res.json({ message: "Delayed tasks retrieved successfully", tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};


exports.getMyTasks = async (req, res) => {
  try {
    const { emailID } = req.user;
    const isDelayededParam = req.query.isDelayeded;

    let tasksQuery = { assignTo: emailID };

    if (isDelayededParam === "true") {
      tasksQuery.isDelayeded = true;
    }

    // Use aggregation to get distinct tasks
    const myTasks = await Task.aggregate([
      { $match: tasksQuery },
      { $sort: { _id: -1 } },
      { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } }
    ]);

    res.json({ message: "My tasks retrieved successfully", tasks: myTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.getDelegatedTasks = async (req, res) => {
  try {
    const { emailID } = req.user;
    const isDelayededParam = req.query.isDelayeded;

    let tasksQuery = { createdBy: emailID };

    if (isDelayededParam === "true") {
      tasksQuery.isDelayeded = true;
    }

    // Use aggregation to get distinct tasks
    const delegatedTasks = await Task.aggregate([
      { $match: tasksQuery },
      { $sort: { _id: -1 } },
      { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } }
    ]);

    res.json({
      message: "Delegated tasks retrieved successfully",
      tasks: delegatedTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};


exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignTo",
      "username"
    );
    if (!task) return res.status(404).send("Task not found.");
    res.send(task);
  } catch (err) {
    res.status(500).send("Server error.");
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.transfer) {
      updateData.transfer = {
        fromWhom: req.user.emailID,
        reasonToTransfer: req.body.transfer.reasonToTransfer,
      };
    }

    const currentTask = await Task.findById(req.params.id);
    if (!currentTask)
      return res.status(404).json({ message: "Task not found." });

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    const updatedFields = Object.keys(updateData).filter(
      (key) =>
        JSON.stringify(currentTask[key]) !== JSON.stringify(updateData[key])
    );

    const updatedFieldsText = updatedFields
      .map((field) => `${field}: ${updateData[field]}`)
      .join(", ");

    res.json(task);

    sendMail(
      req.body.assignTo,
      "Task Updated Turningpoint Taskify App",
      `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>
        <p>The task "<strong>${task.title}</strong>" has been updated.</p>
        <p><strong>Updated fields:</strong></p>
        <ul>
          ${updatedFieldsText
            .split(", ")
            .map((field) => `<li>${field}</li>`)
            .join("")}
        </ul>
        <p>Best regards,<br>Turning Point Team</p>
      </div>
      `
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, reason, changesAttachments } = req.body;

  if (!newStatus || !reason) {
    return res
      .status(400)
      .json({ message: "New status and reason are required" });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.currentUser = req.user.emailID;
    task.status = newStatus;
    task.statusChanges.push({
      status: newStatus,
      reason: reason,
      taskUpdatedBy: req.user.emailID,
      changesAttachments: changesAttachments || [],
      changedAt: new Date(),
    });

    if (newStatus === "Completed") {
      task.closedAt = new Date();
      cancelReminder(task._id);
    }

    task.updatedAt = new Date();

    await task.save();

    // Send email notification
    sendMail(
      task.assignTo,
      "Task Status Updated",
      `
      <html>
        <body>
          <h2>Task Status Updated</h2>
          <p>The status of the task <strong>${task.title}</strong> has been updated to <strong>${newStatus}</strong>.</p>
          <p>Reason: ${reason}</p>
          <p>Updated by: ${req.user.emailID}</p>
           <p>Best regards,<br>Turning Point Team</p>
        </body>
      </html>
      `
    );

    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while updating the task status",
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  // Validate the ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Task ID." });
  }

  try {
    // Find the task by ID and delete it
    const task = await Task.findByIdAndDelete(id);

    // If the task is not found, return a 404 status with an error message
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found." });
    }

    // Uncomment and configure the sendMail function if email functionality is needed
    // sendMail(
    //   "recipient@example.com",
    //   "Task Deleted",
    //   `The task "${task.title}" has been deleted.`
    // );

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Task removed successfully." });
  } catch (err) {
    // Log the error and return a 500 status with a generic error message
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
