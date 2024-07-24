const { default: mongoose } = require("mongoose");
const { scheduleReminders } = require("../CronJobs/reminderScheduler");
const Task = require("../models/Task");
const sendMail = require("../utils/mailer");
const User = require("../models/User");

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
  } = req.body;

  try {
    const newTask = new Task({
      title,
      description,
      category,
      assignTo,
      priority,
      dueDate,
      createdBy: req.user.emailID,
      attachments,
      reminder: reminder || null,
      currentUser: req.user.emailID,
    });

    const task = await newTask.save();
    if (reminder) {
      scheduleReminders(task);
    }
    sendMail(
      task.assignTo,
      "New Task Created",
      `A new task "${title}" has been created.`
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
    const isDelayParam = req.query.isDelay; // Check if isDelay parameter is provided

    let tasksQuery = {};

    if (isDelayParam === "true") {
      tasksQuery.isDelay = true;
    }

    if (userRole === "Admin") {
      // Admin can see all tasks, optionally filtered by isDelay
      tasks = await Task.find(tasksQuery);
    } else if (userRole === "TeamLeader") {
      // TeamLeader can see tasks assigned to them and their team, optionally filtered by isDelay
      const teamMembers = await User.find({ teamLeader: userId }).select(
        "emailID"
      );
      const teamMemberEmailIds = teamMembers.map((member) => member.emailID);

      tasksQuery.$or = [
        { assignTo: emailID },
        { assignTo: { $in: teamMemberEmailIds } },
      ];

      tasks = await Task.find(tasksQuery);
    } else {
      // Regular user can see tasks assigned to them, optionally filtered by isDelay
      tasksQuery.assignTo = emailID;

      tasks = await Task.find(tasksQuery);
    }

    res.send(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
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
      updatedTaskBy: req.user.emailID,
      changesAttachments: changesAttachments || [],
      changedAt: new Date(),
    });

    if (newStatus === "Completed") {
      task.closedAt = new Date();
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
