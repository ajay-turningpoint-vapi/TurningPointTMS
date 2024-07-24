const sendMail = require("./mailer");

const sendReminder = (task) => {
  const reminderSubject = `Reminder: Task "${task.title}"`;

  const reminderHtmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            color: #555555;
            margin: 10px 0;
          }
          .task-details {
            border: 1px solid #dddddd;
            border-radius: 4px;
            padding: 15px;
            background-color: #f9f9f9;
          }
          .task-details p {
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Task Reminder</h1>
          <p><strong>Title:</strong> ${task.title}</p>
          <div class="task-details">
            <p><strong>Description:</strong> ${task.description}</p>
            <p><strong>Due Date:</strong> ${new Date(
              task.dueDate
            ).toDateString()}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Assigned To:</strong> ${task.assignTo}</p>
          </div>
          <p>This is a reminder for the task mentioned above. Please make sure to complete it by the due date.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Turning Point Taskify App. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  sendMail(task.assignTo, reminderSubject, reminderHtmlContent);
};

module.exports = {
  sendReminder,
};
