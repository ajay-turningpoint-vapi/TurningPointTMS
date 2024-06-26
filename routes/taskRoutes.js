const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.post("/", auth, taskController.createTask);
router.get("/", auth, taskController.getTasks);
router.get("/:id", auth, taskController.getTask);
router.put(
  "/:id",
  auth,
  role(["Admin", "TeamLeader"]),
  taskController.updateTask
);
router.delete(
  "/:id",
  auth,
  role(["Admin", "TeamLeader"]),
  taskController.deleteTask
);

module.exports = router;
