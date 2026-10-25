
const User = require("../models/user");
const Attendance = require("../models/Attendance");

// Get all students and search students
const getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: "student" };

    if (search && search.trim()) {
      const keyword = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { rollNumber: { $regex: keyword, $options: "i" } },
      ];
    }

    const students = await User.find(filter)
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      message: "Failed to fetch students",
    });
  }
};

// Get one student's details
const getStudentById = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    }).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      message: "Failed to fetch student",
    });
  }
};

// Delete a student and their attendance records
const deleteStudent = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    await Attendance.deleteMany({
      student: student._id,
    });

    await User.deleteOne({
      _id: student._id,
      role: "student",
    });

    res.status(200).json({
      success: true,
      message: "Student and attendance records deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      message: "Failed to delete student",
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  deleteStudent,
};
