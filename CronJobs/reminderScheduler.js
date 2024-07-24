const schedule = require("node-schedule");
const { sendReminder } = require("../utils/sendReminder");


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

  schedule.scheduleJob(rule, () => sendReminder(task));
};

module.exports = {
  scheduleReminders,
};
