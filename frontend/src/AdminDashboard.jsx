
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api";

export default function AdminDashboard({ user }) {
  const [overview, setOverview] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [facultyForm, setFacultyForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const token = localStorage.getItem("attendanceToken");
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadOverview = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${API}/admin/overview`,
        { headers }
      );

      setOverview(response.data.overview);
      setRecentUsers(response.data.recentUsers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Admin overview load nahi hua. Admin login check karo."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const params = {};

      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;

      const response = await axios.get(`${API}/admin/users`, {
        headers,
        params,
      });

      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "User list load nahi hui."
      );
    } finally {
      setUsersLoading(false);
    }
  }, [token, search, roleFilter]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers, refreshKey]);

  const refreshAll = () => {
    setError("");
    setNotice("");
    setRefreshKey((value) => value + 1);
  };

  const handleFacultyInput = (event) => {
    const { name, value } = event.target;

    setFacultyForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateFaculty = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await axios.post(
        `${API}/admin/faculty`,
        facultyForm,
        { headers }
      );

      setNotice(
        response.data.message ||
          "Faculty account created successfully."
      );

      setFacultyForm({
        name: "",
        email: "",
        password: "",
        department: "",
      });

      setShowFacultyForm(false);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Faculty account create nahi hua."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaculty = async (faculty) => {
    if (faculty.role !== "faculty") return;

    const confirmed = window.confirm(
      `Delete faculty account for ${faculty.name}? Their existing attendance records will be retained.`
    );

    if (!confirmed) return;

    setDeletingId(faculty._id);
    setError("");
    setNotice("");

    try {
      const response = await axios.delete(
        `${API}/admin/faculty/${faculty._id}`,
        { headers }
      );

      setNotice(
        response.data.message ||
          "Faculty account deleted successfully."
      );

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Faculty account delete nahi hua."
      );
    } finally {
      setDeletingId("");
    }
  };

  const stats = overview || {};
  const attendanceRate = stats.attendancePercentage || 0;

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="admin-eyebrow">
            ADMINISTRATION CENTER
          </span>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome, {user?.name || "Administrator"}. Manage
            your campus users and monitor system activity.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={refreshAll}
          disabled={loading || usersLoading}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="admin-alert admin-alert-success" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <div className="admin-section-heading">
        <div>
          <h2>System Overview</h2>
          <p>Live counts from your MongoDB database</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon="♙"
          color="violet"
          loading={loading}
        />
        <StatCard
          label="Students"
          value={stats.totalStudents}
          icon="▤"
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Faculty"
          value={stats.totalFaculty}
          icon="♧"
          color="green"
          loading={loading}
        />
        <StatCard
          label="Attendance Records"
          value={stats.totalAttendance}
          icon="◷"
          color="orange"
          loading={loading}
        />
      </div>

      <div className="admin-overview-grid">
        <div className="admin-panel admin-attendance-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Attendance Summary</h3>
              <p>All recorded attendance statuses</p>
            </div>
            <span className="admin-panel-icon">◷</span>
          </div>

          <div className="admin-rate">
            <div
              className="admin-rate-circle"
              style={{
                "--attendance-rate": `${attendanceRate}%`,
              }}
            >
              <div>
                <strong>
                  {loading ? "—" : `${attendanceRate}%`}
                </strong>
                <span>Present</span>
              </div>
            </div>

            <div className="admin-attendance-counts">
              <SummaryRow
                label="Present"
                value={stats.presentCount}
                color="green"
                loading={loading}
              />
              <SummaryRow
                label="Absent"
                value={stats.absentCount}
                color="red"
                loading={loading}
              />
              <SummaryRow
                label="Late"
                value={stats.lateCount}
                color="orange"
                loading={loading}
              />
            </div>
          </div>
          <p className="admin-footnote">
            Present percentage = present records ÷ all attendance
            records. This is a record-based rate, not an individual
            student's attendance percentage.
          </p>
        </div>

        <div className="admin-panel admin-system-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>System Overview</h3>
              <p>Account distribution</p>
            </div>
            <span className="admin-panel-icon">⌘</span>
          </div>

          <SystemRow
            label="Student accounts"
            value={stats.totalStudents}
            total={stats.totalUsers}
            color="violet"
            loading={loading}
          />
          <SystemRow
            label="Faculty accounts"
            value={stats.totalFaculty}
            total={stats.totalUsers}
            color="green"
            loading={loading}
          />
          <SystemRow
            label="Admin accounts"
            value={stats.totalAdmins}
            total={stats.totalUsers}
            color="blue"
            loading={loading}
          />

          <div className="admin-system-total">
            <span>All registered accounts</span>
            <strong>
              {loading ? "—" : stats.totalUsers ?? 0}
            </strong>
          </div>
        </div>
      </div>

      <div className="admin-section-heading admin-users-heading">
        <div>
          <h2>User Management</h2>
          <p>Search and manage registered campus accounts</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowFacultyForm((value) => !value)}
        >
          {showFacultyForm ? "Cancel" : "+ Add Faculty"}
        </button>
      </div>

      {showFacultyForm && (
        <div className="admin-panel admin-faculty-form-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Create Faculty Account</h3>
              <p>New accounts are assigned the faculty role.</p>
            </div>
          </div>

          <form
            className="admin-faculty-form"
            onSubmit={handleCreateFaculty}
          >
            <div className="admin-form-field">
              <label htmlFor="faculty-name">Full Name</label>
              <input
                id="faculty-name"
                name="name"
                value={facultyForm.name}
                onChange={handleFacultyInput}
                placeholder="Enter faculty name"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="faculty-email">Email</label>
              <input
                id="faculty-email"
                name="email"
                type="email"
                value={facultyForm.email}
                onChange={handleFacultyInput}
                placeholder="faculty@college.edu"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="faculty-password">Password</label>
              <input
                id="faculty-password"
                name="password"
                type="password"
                value={facultyForm.password}
                onChange={handleFacultyInput}
                placeholder="Minimum 8 characters"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="faculty-department">Department</label>
              <input
                id="faculty-department"
                name="department"
                value={facultyForm.department}
                onChange={handleFacultyInput}
                placeholder="e.g. Computer Science"
                required
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowFacultyForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Faculty"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-panel admin-users-panel">
        <div className="admin-user-toolbar">
          <div className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search name, email, roll number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search users"
            />
          </div>

          <select
            className="admin-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter users by role"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Roll Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan="5" className="admin-empty">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {(item.name || item.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{item.name || "Unnamed user"}</strong>
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-role-badge ${item.role}`}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td>{item.department || "—"}</td>
                    <td>{item.rollNumber || "—"}</td>
                    <td>
                      {item.role === "faculty" ? (
                        <button
                          type="button"
                          className="admin-delete-button"
                          disabled={deletingId === item._id}
                          onClick={() => handleDeleteFaculty(item)}
                        >
                          {deletingId === item._id
                            ? "Deleting..."
                            : "Remove Faculty"}
                        </button>
                      ) : (
                        <span className="admin-no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-footer">
          Showing {users.length} result(s). The backend returns at
          most 200 matching users per request.
        </div>
      </div>

      <div className="admin-panel admin-recent-panel">
        <div className="admin-panel-heading">
          <div>
            <h3>Recently Registered Users</h3>
            <p>Latest five accounts by creation date</p>
          </div>
        </div>

        {loading ? (
          <p className="admin-recent-empty">Loading recent users...</p>
        ) : recentUsers.length === 0 ? (
          <p className="admin-recent-empty">No registered users yet.</p>
        ) : (
          <div className="admin-recent-list">
            {recentUsers.map((item) => (
              <div className="admin-recent-item" key={item._id}>
                <div className="admin-user-avatar">
                  {(item.name || item.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="admin-recent-info">
                  <strong>{item.name || "Unnamed user"}</strong>
                  <span>{item.email}</span>
                </div>
                <span className={`admin-role-badge ${item.role}`}>
                  {item.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${color}`}>{icon}</div>
      <span>{label}</span>
      <strong>{loading ? "—" : value ?? 0}</strong>
      <small>Database total</small>
    </div>
  );
}

function SummaryRow({ label, value, color, loading }) {
  return (
    <div className="admin-summary-row">
      <span className={`admin-status-dot ${color}`} />
      <span className="admin-summary-label">{label}</span>
      <strong>{loading ? "—" : value ?? 0}</strong>
    </div>
  );
}

function SystemRow({ label, value, total, color, loading }) {
  const percentage =
    total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="admin-system-row">
      <div className="admin-system-row-label">
        <span>{label}</span>
        <strong>{loading ? "—" : value ?? 0}</strong>
      </div>
      <div className="admin-progress-track">
        <div
          className={`admin-progress-fill ${color}`}
          style={{
            width: loading ? "0%" : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
