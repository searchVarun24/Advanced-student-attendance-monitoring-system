
const express = require("express");
const router = express.Router();

const {
  getStudents,
  getStudentById,
  deleteStudent,
} = require("../controllers/studentController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Admin and faculty can view students
router.get(
  "/",
  protect,
  authorizeRoles("admin", "faculty"),
  getStudents
);

router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "faculty"),
  getStudentById
);

// Only admin can delete students
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteStudent
);

module.exports = router;
