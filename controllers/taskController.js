const Task = require("../models/Task");
const sendMail = require("../utils/mailer");

exports.createTask = async (req, res) => {
  const {
    title,
    description,
    category,
    assignTo,
    priority,
    dueDate,
    attachments,
  } = req.body;
  console.log(req.body);
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
    });

    const task = await newTask.save();

    // sendMail('recipient@example.com', 'New Task Created', `A new task "${title}" has been created.`);

    res.status(201).send(task);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error.");
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.send(tasks);
  } catch (err) {
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
  const {
    title,
    description,
    category,
    assignTo,
    priority,
    dueDate,
    reminder,
    status,
    statusChangeReason,
    attachments,
  } = req.body;

  if (!statusChangeReason)
    return res.status(400).send("Status change reason is required.");

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found.");

    task.title = title || task.title;
    task.description = description || task.description;
    task.category = category || task.category;
    task.assignTo = assignTo || task.assignTo;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.reminder = reminder || task.reminder;
    task.status = status || task.status;
    task.statusChangeReason = statusChangeReason;
    task.attachments = attachments || task.attachments;

    await task.save();

    sendMail(
      "recipient@example.com",
      "Task Updated",
      `The task "${task.title}" has been updated.`
    );

    res.send(task);
  } catch (err) {
    res.status(500).send("Server error.");
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

    task.status = newStatus;
    task.statusChanges.push({
      status: newStatus,
      reason: reason,
      changesAttachments: changesAttachments || [],
      changedAt: new Date(),
    });

    if (newStatus === "Completed") {
      task.closedAt = new Date();
    }

    task.updatedAt = new Date();

    await task.save();
    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "An error occurred while updating the task status",
        error: error.message,
      });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found.");

    await task.remove();

    sendMail(
      "recipient@example.com",
      "Task Deleted",
      `The task "${task.title}" has been deleted.`
    );

    res.send("Task removed.");
  } catch (err) {
    res.status(500).send("Server error.");
  }
};
