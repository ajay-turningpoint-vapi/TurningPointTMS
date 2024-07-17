const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.get("/user", auth, dashboardController.getUserStats);
router.get(
  "/teamleader",
  auth,
  role(["TeamLeader", "Admin"]),
  dashboardController.getTeamLeaderStats
);
router.get(
  "/admin",
  auth,
  role(["Admin"]),
  dashboardController.getOverallStats
);
router.get(
  "/allusersperformance",
  auth,
  role(["Admin"]),
  dashboardController.getAllUsersPerformance
);
router.get(
  "/allcategoryperformance",
  auth,
  role(["Admin"]),
  dashboardController.getCategoryWisePerformance
);
module.exports = router;
