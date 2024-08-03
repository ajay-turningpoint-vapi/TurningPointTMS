const Task = require("../models/Task");
const { sendDelayMail } = require("../utils/sendReminder");

async function checkAndSendDelayedMails() {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $ne: "Completed" },
    });

    // Update isDelayed for tasks due before now
    await Task.updateMany(
      { dueDate: { $lt: new Date() }, status: { $ne: "Completed" } },
      { $set: { isDelayed: true } }
    );

    // Send email for delayed tasks
    for (const task of tasks) {
      if (!task.isDelayed) {
        await sendDelayMail(task);
      }
    }

    console.log("Delayed tasks processed successfully.");
  } catch (error) {
    console.error("Error processing delayed tasks:", error);
  }
}
module.exports = { checkAndSendDelayedMails };
