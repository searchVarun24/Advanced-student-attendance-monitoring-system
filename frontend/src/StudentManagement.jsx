
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./StudentManagement.css";

const API = "http://localhost:5000/api";

export default function StudentManagement({ user }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const token = localStorage.getItem("attendanceToken");
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Fetch students from the backend
  const fetchStudents = useCallback(
    async (keyword = "") => {
      if (!token) {
        setError("Login session nahi mila. Please login again.");
        setStudents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API}/students`, {
          params: keyword.trim()
            ? { search: keyword.trim() }
            : {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStudents(response.data.students || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Students load nahi ho paaye. Backend aur login check karo."
        );
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Search with a small delay to avoid unnecessary requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, fetchStudents, refreshKey]);

  // Fetch individual student details
  const viewDetails = async (student) => {
    setSelectedStudent({
      ...student,
      detailsLoading: true,
      detailsError: "",
    });

    try {
      const response = await axios.get(
        `${API}/students/${student._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedStudent(response.data.student);
    } catch (err) {
      setSelectedStudent({
        ...student,
        detailsLoading: false,
        detailsError:
          err.response?.data?.message ||
          "Student details load nahi hui.",
      });
    }
  };

  // Delete student - admin only in UI; backend must enforce this too
  const handleDelete = async (student) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Kya tum "${student.name}" ko delete karna chahte ho? Uske attendance records bhi delete ho jayenge.`
    );

    if (!confirmed) return;

    setDeletingId(student._id);
    setError("");

    try {
      await axios.delete(`${API}/students/${student._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStudents((previous) =>
        previous.filter((item) => item._id !== student._id)
      );

      if (selectedStudent?._id === student._id) {
        setSelectedStudent(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Student delete nahi ho paaya."
      );
    } finally {
      setDeletingId("");
    }
  };

  const closeDetails = () => setSelectedStudent(null);

  // Close the details modal using Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <section className="student-page">
      <div className="student-heading">
        <div>
          <p className="student-eyebrow">CAMPUS DIRECTORY</p>
          <h1>Student Management</h1>
          <p className="student-subtitle">
            View student profiles, search records and manage
            registered students.
          </p>
        </div>

        <button
          type="button"
          className="student-refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>{" "}
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="student-summary">
        <div className="student-summary-icon">♙</div>
        <div>
          <span className="student-summary-label">
            {search.trim() ? "Matching Students" : "Total Students"}
          </span>
          <strong>{loading ? "..." : students.length}</strong>
        </div>

        <div className="student-access">
          <span>Current access</span>
          <strong className={isAdmin ? "admin-role" : "faculty-role"}>
            {isAdmin ? "Admin" : "Faculty"}
          </strong>
        </div>
      </div>

      <div className="student-toolbar">
        <div className="student-search">
          <span className="student-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search by name, email or roll number..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search students by name, email or roll number"
          />
          {search && (
            <button
              type="button"
              className="student-clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <span className="student-result-count">
          {loading ? "Loading records..." : `${students.length} records`}
        </span>
      </div>

      {error && (
        <div className="student-alert" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      <div className="student-table-wrap">
        <table className="student-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Roll Number</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="student-empty">
                  <span className="student-spinner" />
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="student-empty">
                  <div className="student-empty-icon">♙</div>
                  <strong>No students found</strong>
                  <p>
                    {search.trim()
                      ? "Try another name, email or roll number."
                      : "Registered student accounts will appear here."}
                  </p>
                  {search && (
                    <button
                      type="button"
                      className="student-view"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student._id}>
                  <td>
                    <div className="student-name-cell">
                      <div className="student-avatar">
                        {(student.name || "S")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="student-name-info">
                        <strong>{student.name || "Unnamed Student"}</strong>
                        <span>Student</span>
                      </div>
                    </div>
                  </td>

                  <td className="student-email">
                    {student.email || "—"}
                  </td>
                  <td>{student.rollNumber || "—"}</td>
                  <td>{student.department || "—"}</td>
                  <td>
                    {student.semester ?? "—"}
                  </td>

                  <td>
                    <div className="student-actions">
                      <button
                        type="button"
                        className="student-view"
                        onClick={() => viewDetails(student)}
                      >
                        View
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className="student-delete"
                          onClick={() => handleDelete(student)}
                          disabled={deletingId === student._id}
                        >
                          {deletingId === student._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="student-footer-note">
        <span aria-hidden="true">ⓘ</span>
        <p>
          {isAdmin
            ? "Admin access: you can view student details and delete student accounts."
            : "Faculty access: you can view student details. Account deletion is restricted to admins."}
        </p>
      </div>

      {/* Student details modal */}
      {selectedStudent && (
        <div
          className="student-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
          >
            <div className="student-modal-header">
              <div>
                <p className="student-eyebrow">STUDENT PROFILE</p>
                <h2 id="student-detail-title">Student Details</h2>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={closeDetails}
                aria-label="Close student details"
              >
                ×
              </button>
            </div>

            <div className="student-modal-profile">
              <div className="student-avatar student-avatar-large">
                {(selectedStudent.name || "S")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h3>{selectedStudent.name || "Unnamed Student"}</h3>
                <span className="student-role-pill">
                  {selectedStudent.role || "student"}
                </span>
              </div>
            </div>

            {selectedStudent.detailsLoading ? (
              <div className="student-modal-loading">
                <span className="student-spinner" />
                Loading student details...
              </div>
            ) : (
              <>
                {selectedStudent.detailsError && (
                  <div className="student-alert" role="alert">
                    {selectedStudent.detailsError}
                  </div>
                )}

                <div className="student-detail-grid">
                  <DetailItem
                    label="Full Name"
                    value={selectedStudent.name}
                  />
                  <DetailItem
                    label="Email Address"
                    value={selectedStudent.email}
                  />
                  <DetailItem
                    label="Roll Number"
                    value={selectedStudent.rollNumber}
                  />
                  <DetailItem
                    label="Department"
                    value={selectedStudent.department}
                  />
                  <DetailItem
                    label="Semester"
                    value={selectedStudent.semester}
                  />
                  <DetailItem
                    label="Account Role"
                    value={selectedStudent.role}
                  />
                </div>
              </>
            )}

            <div className="student-modal-footer">
              <button
                type="button"
                className="student-refresh"
                onClick={closeDetails}
              >
                Close
              </button>

              {isAdmin && !selectedStudent.detailsLoading && (
                <button
                  type="button"
                  className="student-delete"
                  disabled={deletingId === selectedStudent._id}
                  onClick={() => handleDelete(selectedStudent)}
                >
                  {deletingId === selectedStudent._id
                    ? "Deleting..."
                    : "Delete Student"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="student-detail-item">
      <span>{label}</span>
      <strong>
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </strong>
    </div>
  );
}
