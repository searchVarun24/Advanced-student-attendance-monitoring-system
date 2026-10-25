import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import StudentManagement from "./StudentManagement";
import AdminDashboard from "./AdminDashboard";

const API = "http://localhost:5000/api";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("attendanceToken") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("attendanceUser") || "null"
      );
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [analytics, setAnalytics] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Load dashboard analytics
  useEffect(() => {
    if (!token || !user) return;

    const fetchStats = async () => {
      try {
        let endpoint = "/attendance";

        if (user.role === "student") {
          endpoint = "/attendance/my/analytics";
        } else if (user.role === "faculty") {
          endpoint = "/attendance/faculty/analytics";
        }

        const response = await axios.get(`${API}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAnalytics(response.data.analytics || response.data);
      } catch {
        setAnalytics({});
      }
    };

    fetchStats();
  }, [token, user, refreshKey]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      const newToken = response.data.token;
      const newUser = response.data.user;

      if (!newToken) {
        throw new Error("Login response mein token nahi mila.");
      }

      localStorage.setItem("attendanceToken", newToken);
      setToken(newToken);

      if (newUser) {
        localStorage.setItem(
          "attendanceUser",
          JSON.stringify(newUser)
        );
        setUser(newUser);
      } else {
        const meResponse = await axios.get(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });

        const fetchedUser =
          meResponse.data.user || meResponse.data;

        localStorage.setItem(
          "attendanceUser",
          JSON.stringify(fetchedUser)
        );
        setUser(fetchedUser);
      }

      setActivePage("dashboard");
      setPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Backend aur credentials check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("attendanceToken");
    localStorage.removeItem("attendanceUser");

    setToken("");
    setUser(null);
    setAnalytics({});
    setActivePage("dashboard");
    setError("");
  };

  // Login screen
  if (!token || !user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand login-brand">
            <div className="brand-icon">A</div>
            <div>
              <strong>Attendly</strong>
              <span>Campus management</span>
            </div>
          </div>

          <div className="login-heading">
            <p className="eyebrow">WELCOME BACK</p>
            <h1>Sign in to your account</h1>
            <p>
              Manage attendance and track academic progress.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="alert error-alert">{error}</div>
            )}

            <button
              className="primary-button login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="login-footer">
            Automated Student Attendance Monitoring System
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    user.name || user.fullName || "Campus User";

  const role = (user.role || "student").toLowerCase();
  const isStaff = role === "faculty" || role === "admin";
  const isAdmin = role === "admin";

  const attendancePercentage =
    analytics.attendancePercentage ??
    analytics.percentage ??
    analytics.attendanceRate ??
    0;

  const totalClasses =
    analytics.totalClasses ??
    analytics.total ??
    analytics.totalRecords ??
    0;

  const presentCount =
    analytics.presentCount ?? analytics.present ?? 0;

  const absentCount =
    analytics.absentCount ?? analytics.absent ?? 0;

  const pageTitles = {
    dashboard: "Dashboard",
    attendance: "View Attendance",
    analytics: "Analytics",
    mark: "Mark Attendance",
    students: "Student Management",
     admin: "Admin Dashboard",
  };

  {isAdmin && (
  <button
    className={`nav-item ${
      activePage === "admin" ? "active" : ""
    }`}
    onClick={() => setActivePage("admin")}
  >
    <span className="nav-icon">▦</span>
    Admin Dashboard
  </button>
)}

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <strong>Attendly</strong>
            <span>Campus management</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className={`nav-item ${
            activePage === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActivePage("dashboard")}
        >
          <span className="nav-icon">▦</span>
          Dashboard
        </button>

        <button
          className={`nav-item ${
            activePage === "attendance" ? "active" : ""
          }`}
          onClick={() => setActivePage("attendance")}
        >
          <span className="nav-icon">◷</span>
          View Attendance
        </button>

        <button
          className={`nav-item ${
            activePage === "analytics" ? "active" : ""
          }`}
          onClick={() => setActivePage("analytics")}
        >
          <span className="nav-icon">▤</span>
          Analytics
        </button>

        {isStaff && (
          <button
            className={`nav-item ${
              activePage === "mark" ? "active" : ""
            }`}
            onClick={() => setActivePage("mark")}
          >
            <span className="nav-icon">＋</span>
            Mark Attendance
          </button>
        )}

        {/* Student Management: faculty and admin */}
        {isStaff && (
          <button
            className={`nav-item ${
              activePage === "students" ? "active" : ""
            }`}
            onClick={() => setActivePage("students")}
          >
            <span className="nav-icon">♙</span>
            Student Management
          </button>
        )}

        <div className="sidebar-bottom">
          <div className="avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{displayName}</strong>
            <span>{role}</span>
          </div>

          <button
            className="logout-icon"
            title="Logout"
            onClick={handleLogout}
          >
            ↗
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activePage === "admin" && isAdmin && (
  <AdminDashboard user={user} />
)}
        <header className="topbar">
          <div>
            <span className="topbar-caption">CAMPUS PORTAL</span>
            <h2>{pageTitles[activePage] || "Dashboard"}</h2>
          </div>

          <div className="topbar-user">
            <div className="avatar small-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>{role}</span>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {activePage === "dashboard" && (
          <section className="page-content">
            <div className="welcome-banner">
              <div>
                <p className="eyebrow light-eyebrow">
                  YOUR CAMPUS OVERVIEW
                </p>
                <h1>
                  Hello, {displayName.split(" ")[0]}! 👋
                </h1>
                <p>
                  Welcome to your attendance management dashboard.
                  Here is your latest overview.
                </p>
              </div>
              <div className="banner-decoration">A</div>
            </div>

            <div className="section-heading">
              <div>
                <h3>Overview</h3>
                <p>Your attendance summary</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => setRefreshKey((n) => n + 1)}
              >
                ↻ Refresh
              </button>
            </div>

            <div className="stats-grid">
              <StatCard
                icon="◷"
                label="Attendance"
                value={`${attendancePercentage}%`}
                note="Overall attendance"
                color="purple"
              />
              <StatCard
                icon="▤"
                label="Total Records"
                value={totalClasses}
                note="Recorded classes"
                color="blue"
              />
              <StatCard
                icon="✓"
                label="Present"
                value={presentCount}
                note="Present classes"
                color="green"
              />
              <StatCard
                icon="×"
                label="Absent"
                value={absentCount}
                note="Absent classes"
                color="orange"
              />
            </div>

            <div className="content-card quick-actions">
              <div>
                <h3>Quick actions</h3>
                <p>Choose what you want to do next.</p>
              </div>

              <div className="action-buttons">
                <button
                  className="primary-button"
                  onClick={() => setActivePage("attendance")}
                >
                  View Attendance →
                </button>

                {isStaff && (
                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("mark")}
                  >
                    + Mark Attendance
                  </button>
                )}

                <button
                  className="secondary-button"
                  onClick={() => setActivePage("analytics")}
                >
                  View Analytics
                </button>

                {isStaff && (
                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("students")}
                  >
                    Manage Students
                  </button>
                )}
              </div>
            </div>

            <p className="page-note">
              Logged in as <strong>{role}</strong>
              {user.department ? ` · ${user.department}` : ""}
              {user.semester ? ` · Semester ${user.semester}` : ""}
            </p>
          </section>
        )}

        {/* Attendance page */}
        {activePage === "attendance" && (
          <AttendancePage
            user={user}
            token={token}
            onMarked={() => setRefreshKey((n) => n + 1)}
            canMark={isStaff}
          />
        )}

        {/* Student Management page */}
        {activePage === "students" && isStaff && (
          <StudentManagement user={user} />
        )}

        {/* Mark attendance page */}
        {activePage === "mark" && isStaff && (
          <AttendancePage
            user={user}
            token={token}
            onMarked={() => {
              setRefreshKey((n) => n + 1);
              setActivePage("attendance");
            }}
            canMark={true}
            markOnly={true}
          />
        )}

        {/* Analytics page */}
        {activePage === "analytics" && (
          <section className="page-content">
            <div className="section-heading">
              <div>
                <h3>Attendance Analytics</h3>
                <p>Summary from your backend data</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => setRefreshKey((n) => n + 1)}
              >
                ↻ Refresh
              </button>
            </div>

            <div className="content-card analytics-card">
              <div className="analytics-circle">
                <span>{attendancePercentage}%</span>
                <small>Attendance</small>
              </div>

              <div className="analytics-details">
                <h3>Attendance performance</h3>
                <p>
                  Present: <strong>{presentCount}</strong>
                </p>
                <p>
                  Absent: <strong>{absentCount}</strong>
                </p>
                <p>
                  Total records: <strong>{totalClasses}</strong>
                </p>
                <p className="muted-text">
                  Statistics depend on the data and response fields
                  provided by your backend API.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, note, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <p className="stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-note">{note}</p>
    </div>
  );
}

function AttendancePage({
  user,
  token,
  onMarked,
  canMark,
  markOnly = false,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [status, setStatus] = useState("present");
  const [saving, setSaving] = useState(false);

  const role = (user.role || "student").toLowerCase();

  const loadAttendance = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint =
        role === "student" ? "/attendance/my" : "/attendance";

      const response = await axios.get(`${API}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data.attendance || data.records || data.data || [];

      setRecords(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Attendance load nahi hui. Backend route check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [token, role]);

  const handleMark = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await axios.post(
        `${API}/attendance/mark`,
        {
          studentId: studentId.trim(),
          subject: subject.trim(),
          date,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(
        response.data.message ||
          "Attendance marked successfully!"
      );

      setStudentId("");
      setSubject("");
      await loadAttendance();
      onMarked?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Attendance mark nahi hui. Student ID aur backend check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const getStudentName = (record) => {
    if (record.student && typeof record.student === "object") {
      return (
        record.student.name ||
        record.student.rollNumber ||
        record.student.email ||
        "Student"
      );
    }

    return record.studentName || record.rollNumber || "—";
  };

  const getFacultyName = (record) => {
    if (record.faculty && typeof record.faculty === "object") {
      return (
        record.faculty.name ||
        record.faculty.email ||
        "—"
      );
    }

    return record.facultyName || "—";
  };

  const showForm = canMark;

  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <h3>
            {markOnly
              ? "Mark Student Attendance"
              : "Attendance Records"}
          </h3>
          <p>
            {role === "student"
              ? "View your attendance history"
              : "View records and manage student attendance"}
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadAttendance}
        >
          ↻ Refresh
        </button>
      </div>

      {showForm && (
        <div className="content-card attendance-form-card">
          <h3>Mark Attendance</h3>
          <p className="form-description">
            Enter the student's MongoDB User ID and class details.
          </p>

          <form
            className="attendance-form"
            onSubmit={handleMark}
          >
            <div className="form-field">
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                type="text"
                placeholder="Paste student's MongoDB ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                placeholder="e.g. Java Programming"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="attendanceDate">Date</label>
              <input
                id="attendanceDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>

            <button
              className="primary-button submit-attendance"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="alert error-alert">{error}</div>
      )}

      {message && (
        <div className="alert success-alert">{message}</div>
      )}

      {!markOnly && (
        <div className="content-card table-card">
          <div className="table-heading">
            <div>
              <h3>Attendance History</h3>
              <p>{records.length} record(s)</p>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">
              Loading attendance records...
            </p>
          ) : records.length === 0 ? (
            <p className="empty-state">
              No attendance records found. Records will appear
              here after attendance is marked.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Faculty</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{getStudentName(record)}</td>
                      <td>{record.subject || "—"}</td>
                      <td>
                        {record.date
                          ? new Date(
                              record.date
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${(record.status || "")
                            .toLowerCase()}`}
                        >
                          {record.status || "Unknown"}
                        </span>
                      </td>
                      <td>{getFacultyName(record)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default App;