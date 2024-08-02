const schedule = require("node-schedule");

const Task = require("../models/Task");
const calculateNextDueDate = (
  dueDate,
  frequency,
  weeklyDays = [],
  monthlyDays = []
) => {
  let nextDueDate = new Date(dueDate);

  switch (frequency) {
    case "Daily":
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case "Weekly":
      if (weeklyDays.length) {
        const dayIndex = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const days = weeklyDays.map(
          (day) => (dayIndex.indexOf(day) - nextDueDate.getDay() + 7) % 7
        );
        days.sort((a, b) => a - b);
        nextDueDate.setDate(nextDueDate.getDate() + days[0]);
      } else {
        nextDueDate.setDate(nextDueDate.getDate() + 7); // Default to one week later if no days specified
      }
      break;
    case "Monthly":
      if (monthlyDays.length) {
        const closestDay = monthlyDays.find(
          (day) => day > nextDueDate.getDate()
        );
        if (closestDay) {
          nextDueDate.setDate(closestDay);
        } else {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          nextDueDate.setDate(monthlyDays[0]);
        }
      } else {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Default to one month later if no days specified
      }
      break;
    case "Yearly":
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
    default:
      throw new Error("Unknown frequency");
  }

  return nextDueDate;
};

// Define scheduleNextTaskCreation function
const scheduleNextTaskCreation = async (task) => {
  const { repeat } = task;

  if (repeat && repeat.frequency) {
    let nextDueDate = calculateNextDueDate(
      task.dueDate,
      repeat.frequency,
      repeat.weeklyDays,
      repeat.monthlyDays
    );

    const scheduleTaskCreation = async () => {
      // Create the next task based on the repeat configuration
      const newTask = new Task({
        ...task.toObject(), // Spread the original task properties
        dueDate: nextDueDate,
        repeat: {
          ...repeat,
          nextDueDate: calculateNextDueDate(
            nextDueDate,
            repeat.frequency,
            repeat.weeklyDays,
            repeat.monthlyDays
          ),
        },
      });

      // Save the new task
      await newTask.save();

      // Reschedule the next task creation
      nextDueDate = calculateNextDueDate(
        nextDueDate,
        repeat.frequency,
        repeat.weeklyDays,
        repeat.monthlyDays
      );
      schedule.scheduleJob(nextDueDate, scheduleTaskCreation);
    };

    // Schedule the first task creation
    schedule.scheduleJob(nextDueDate, scheduleTaskCreation);
  }
};

module.exports = {
  calculateNextDueDate,
  scheduleNextTaskCreation,
};
