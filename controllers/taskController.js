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
