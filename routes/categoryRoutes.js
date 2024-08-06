const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
router.post("/", auth, categoryController.createCategory);
router.get("/", auth, categoryController.getCategories);
module.exports = router;
