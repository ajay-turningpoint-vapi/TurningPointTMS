const schedule = require("node-schedule");
const { sendReminder } = require("../utils/sendReminder");
const jobMap = new Map();

const scheduleReminders = (task) => {
  if (!task.reminder || !task.reminder.frequency || !task.reminder.startDate) {
    return;
  }

  let rule = new schedule.RecurrenceRule();
  rule.hour = 9; // Send reminder at 9 AM

  switch (task.reminder.frequency) {
    case "Daily":
      rule.dayOfWeek = new schedule.Range(0, 6);
      break;
    case "Weekly":
      rule.dayOfWeek = task.reminder.startDate.getDay();
      break;
    case "Monthly":
      rule.date = task.reminder.startDate.getDate();
      break;
    default:
      break;
  }

  const job = schedule.scheduleJob(rule, () => sendReminder(task));
  jobMap.set(task._id.toString(), job);
};

const cancelReminder = (taskId) => {
  const job = jobMap.get(taskId);
  if (job) {
    job.cancel();
    jobMap.delete(taskId);
  }
};
module.exports = {
  scheduleReminders,
  cancelReminder,
};
