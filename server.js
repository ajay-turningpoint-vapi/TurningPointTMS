const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const Task = require("./models/Task.js");
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

    // Function to update isDelay for existing tasks
    async function updateIsDelayForExistingTasks() {
      try {
        await Task.updateMany(
          { dueDate: { $lt: new Date() } },
          { $set: { isDelay: true } }
        );
        console.log("Existing tasks updated successfully.");
      } catch (error) {
        console.error("Error updating existing tasks:", error);
      }
    }

    // Call the function to update existing tasks
    updateIsDelayForExistingTasks();
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
app.use("/api/dashboard", dashboardRoutes); // Add this line

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
