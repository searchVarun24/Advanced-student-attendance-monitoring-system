
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Register API
router.post("/register", registerUser);

// Login API
router.post("/login", loginUser);

// Access current authenticated user's token details
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "Authentication successful",
    user: req.user,
  });
});

// Example: only Faculty and Admin can access
router.get(
  "/faculty-test",
  protect,
  authorizeRoles("faculty", "admin"),
  (req, res) => {
    res.status(200).json({
      message: "Faculty/Admin access granted",
    });
  }
);

module.exports = router;
