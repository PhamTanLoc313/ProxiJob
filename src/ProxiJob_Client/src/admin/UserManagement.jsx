import { useState, useEffect } from "react";
import { Search, Eye, UserX, UserCheck, Users } from "lucide-react";
import { getAdminUsers, formatDateTime } from "./adminData";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    setUsers(getAdminUsers());
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "All" || u.role === filterRole;
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const renderRoleBadge = (role) => {
    switch (role) {
      case "Admin": return <span className="admin-badge admin-badge-admin">Admin</span>;
      case "Business": return <span className="admin-badge admin-badge-business">Business</span>;
      case "Student": return <span className="admin-badge admin-badge-student">Student</span>;
      default: return <span className="admin-badge">{role}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <h2 className="admin-table-title">Quản lý Người dùng</h2>
          <div className="admin-table-filters">
            <div className="admin-search">
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {["All", "Student", "Business", "Admin"].map((r) => (
              <button
                key={r}
                className={`admin-filter-btn ${filterRole === r ? "active" : ""}`}
                onClick={() => setFilterRole(r)}
              >
                {r === "All" ? "Tất cả" : r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Role</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      <Users className="admin-empty-icon" />
                      <div className="admin-empty-text">Không tìm thấy người dùng nào</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="admin-sidebar-avatar" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12 }}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                          <div style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{renderRoleBadge(user.role)}</td>
                    <td>{user.phoneNumber || "—"}</td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      {user.isActive ? (
                        <span className="admin-badge admin-badge-active">Hoạt động</span>
                      ) : (
                        <span className="admin-badge admin-badge-inactive">Vô hiệu hóa</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          className="admin-btn-icon"
                          title="Xem chi tiết"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye size={16} />
                        </button>
                        {user.role !== "Admin" && (
                          <button
                            className="admin-btn-icon"
                            style={user.isActive ? { color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" } : { color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                            title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
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
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Chi tiết Người dùng</h3>
              <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-user-detail-header">
                <div className="admin-user-detail-avatar">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="admin-user-detail-info">
                  <h3>{selectedUser.fullName}</h3>
                  <p>{selectedUser.email}</p>
                  <div style={{ marginTop: 6 }}>{renderRoleBadge(selectedUser.role)}</div>
                </div>
              </div>

              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-item-label">ID</span>
                  <span className="admin-info-item-value">#{selectedUser.id}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">SĐT</span>
                  <span className="admin-info-item-value">{selectedUser.phoneNumber || "—"}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Username</span>
                  <span className="admin-info-item-value">{selectedUser.username}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Trạng thái</span>
                  <span className="admin-info-item-value">
                    {selectedUser.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                  </span>
                </div>
              </div>

              {selectedUser.role === "Business" && selectedUser.businessProfile && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--admin-border)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", marginBottom: 12, textTransform: "uppercase" }}>
                    Thông tin Doanh nghiệp
                  </h4>
                  <div className="admin-info-grid">
                    <div className="admin-info-item">
                      <span className="admin-info-item-label">Tên cơ sở</span>
                      <span className="admin-info-item-value">{selectedUser.businessProfile.businessName}</span>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-item-label">Mã số thuế</span>
                      <span className="admin-info-item-value">{selectedUser.businessProfile.taxCode || "—"}</span>
                    </div>
                    <div className="admin-info-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="admin-info-item-label">Địa chỉ</span>
                      <span className="admin-info-item-value">{selectedUser.businessProfile.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === "Student" && selectedUser.studentProfile && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--admin-border)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", marginBottom: 12, textTransform: "uppercase" }}>
                    Hồ sơ Sinh viên
                  </h4>
                  <div className="admin-info-grid">
                    <div className="admin-info-item">
                      <span className="admin-info-item-label">Trường ĐH</span>
                      <span className="admin-info-item-value">{selectedUser.studentProfile.school}</span>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-item-label">Năm học</span>
                      <span className="admin-info-item-value">Năm {selectedUser.studentProfile.yearOfStudy}</span>
                    </div>
                    <div className="admin-info-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="admin-info-item-label">Kỹ năng</span>
                      <span className="admin-info-item-value">{selectedUser.studentProfile.skills}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
