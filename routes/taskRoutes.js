const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.post("/", auth,role(["Admin", "TeamLeader"]), taskController.createTask);
router.get("/", auth, taskController.getTasks);
router.get("/:id", auth, taskController.getTask);
router.patch(
  "/:id",
  auth,
  role(["Admin", "TeamLeader"]),
  taskController.updateTask
);
router.put("/:id/status", auth, taskController.updateTaskStatus);
router.delete(
  "/:id",
  auth,
  role(["Admin", "TeamLeader"]),
  taskController.deleteTask
);

module.exports = router;
