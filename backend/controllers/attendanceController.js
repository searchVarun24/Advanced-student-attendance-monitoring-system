
const Attendance = require("../models/Attendance");
const User = require("../models/user");

// Mark student attendance
const markAttendance = async (req, res) => {
  try {
    const { studentId, subject, date, status } = req.body || {};

    // Validate required fields
    if (!studentId || !subject || !date || !status) {
      return res.status(400).json({
        message: "Student ID, subject, date and status are required",
      });
    }

    // Validate attendance status
    const allowedStatuses = ["present", "absent", "late"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be present, absent or late",
      });
    }

    // Validate date
    const attendanceDate = new Date(date);

    if (Number.isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        message: "Invalid attendance date",
      });
    }

    // Validate subject
    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        message: "Subject must be a valid string",
      });
    }

    // Check that student exists
    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student: student._id,
      subject: subject.trim(),
      faculty: req.user.id,
      date: attendanceDate,
      status,
    });

    return res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    // Duplicate student-subject-date record
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Attendance already exists for this student, subject and date",
      });
    }

    console.error("Mark Attendance Error:", error);

    return res.status(500).json({
      message: "Server error while marking attendance",
    });
  }
};

// Get all attendance records
const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate(
        "student",
        "name email rollNumber department semester"
      )
      .populate("faculty", "name email")
      .sort({ date: -1 });

    return res.status(200).json({
      message: "Attendance records fetched successfully",
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);

    return res.status(500).json({
      message: "Server error while fetching attendance",
    });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      student: req.user.id,
    })
      .populate("faculty", "name email")
      .sort({ date: -1 });

    return res.status(200).json({
      message: "Your attendance history fetched successfully",
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get My Attendance Error:", error);

    return res.status(500).json({
      message: "Server error while fetching your attendance",
    });
  }
};


const getMyAttendancePercentage = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      student: req.user.id,
    });

    const totalClasses = attendance.length;

    const presentClasses = attendance.filter(
      (record) => record.status === "present"
    ).length;

    const absentClasses = attendance.filter(
      (record) => record.status === "absent"
    ).length;

    const lateClasses = attendance.filter(
      (record) => record.status === "late"
    ).length;

    const percentage =
      totalClasses === 0
        ? 0
        : Number(((presentClasses / totalClasses) * 100).toFixed(2));

    return res.status(200).json({
      message: "Attendance analytics fetched successfully",
      totalClasses,
      presentClasses,
      absentClasses,
      lateClasses,
      attendancePercentage: percentage,
    });
  } catch (error) {
    console.error("Attendance Analytics Error:", error);

    return res.status(500).json({
      message: "Server error while calculating attendance percentage",
    });
  }
};
const getFacultyAnalytics = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      faculty: req.user.id,
    });

    const subjectStats = {};

    attendance.forEach((record) => {
      const subject = record.subject;

      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          subject,
          totalClasses: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }

      subjectStats[subject].totalClasses++;

      if (record.status === "present") {
        subjectStats[subject].present++;
      } else if (record.status === "absent") {
        subjectStats[subject].absent++;
      } else if (record.status === "late") {
        subjectStats[subject].late++;
      }
    });

    const analytics = Object.values(subjectStats).map((item) => ({
      ...item,
      attendancePercentage:
        item.totalClasses === 0
          ? 0
          : Number(
              ((item.present / item.totalClasses) * 100).toFixed(2)
            ),
    }));

    return res.status(200).json({
      message: "Faculty analytics fetched successfully",
      subjects: analytics,
    });
  } catch (error) {
    console.error("Faculty Analytics Error:", error);

    return res.status(500).json({
      message: "Server error while fetching faculty analytics",
    });
  }
};


module.exports = {
  markAttendance,
  getAttendance,
  getMyAttendance,
  getMyAttendancePercentage,
  getFacultyAnalytics,
};
