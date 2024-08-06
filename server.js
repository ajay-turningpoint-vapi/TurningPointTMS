const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes");
const Task = require("./models/Task.js");
const fileRoute = require("./routes/fileRoutes.js");
const { sendDelayMail } = require("./utils/sendReminder.js");
const { checkAndSendDelayedMails } = require("./CronJobs/delayMailCron.js");
const schedule = require("node-schedule");
require("dotenv").config();
const app = express();

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(bodyParser.json());
app.use(cors());
app.get("/api", (req, res) => {
  res.send("Server Running!!");
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", fileRoute);

schedule.scheduleJob({ hour: 10, minute: 0 }, checkAndSendDelayedMails);
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
