
const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAttendance,
  getMyAttendance,
  getMyAttendancePercentage,
  getFacultyAnalytics,
} = require("../controllers/attendanceController");


const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// @route   POST /api/attendance/mark
// @desc    Mark student attendance
// @access  Faculty and Admin
router.post(
  "/mark",
  protect,
  authorizeRoles("faculty", "admin"),
  markAttendance
);

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Faculty and Admin
router.get(
  "/",
  protect,
  authorizeRoles("faculty", "admin"),
  getAttendance
);
// Faculty subject-wise analytics
router.get(
  "/faculty/analytics",
  protect,
  authorizeRoles("faculty", "admin"),
  getFacultyAnalytics
);
// Student's own attendance history
router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyAttendance
);
// Student attendance analytics
router.get(
  "/my/analytics",
  protect,
  authorizeRoles("student"),
  getMyAttendancePercentage
);

module.exports = router;
