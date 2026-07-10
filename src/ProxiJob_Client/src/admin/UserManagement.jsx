import { useState, useEffect } from "react";
import { Search, Eye, UserX, UserCheck, Users, Plus, Edit2, Trash2, X } from "lucide-react";
import { getAdminSession, formatDateTime } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";


export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // CRUD states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    role: "Student",
    password: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const session = getAdminSession();
      if (!session?.token) {
        setError("Chưa đăng nhập admin hoặc phiên làm việc hết hạn.");
        return;
      }
      const res = await fetch(`${IDENTITY_API_URL}/admin/users`, {
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      if (!res.ok) {
        setError("Không thể lấy danh sách người dùng: " + res.status);
        return;
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      setError("Lỗi kết nối tới máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session?.token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Tạo người dùng thất bại.");
        return;
      }
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session?.token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          isActive: selectedUser.isActive
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Cập nhật người dùng thất bại.");
        return;
      }
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    const session = getAdminSession();
    if (!session?.token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Xóa người dùng thất bại.");
        return;
      }
      fetchUsers();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const toggleUserStatus = async (user) => {
    const session = getAdminSession();
    if (!session?.token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isActive: !user.isActive
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Thay đổi trạng thái thất bại.");
        return;
      }
      fetchUsers();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      password: "", // Empty for edit
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      fullName: "",
      phoneNumber: "",
      role: "Student",
      password: "",
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "All" || u.role === filterRole;
    const matchSearch =
      (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

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
        <div className="admin-table-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="admin-table-title" style={{ margin: 0 }}>Quản lý Người dùng</h2>
          </div>
          <button 
            className="admin-btn admin-btn-success" 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Thêm người dùng</span>
          </button>
        </div>

        <div className="admin-table-toolbar" style={{ borderTop: "none", paddingTop: 0 }}>
          <div className="admin-table-filters" style={{ width: "100%", justifyContent: "space-between" }}>
            <div className="admin-search" style={{ maxWidth: 300 }}>
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
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
        </div>

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--admin-danger)", borderRadius: 8, margin: "10px 16px", border: "1px solid rgba(239,68,68,0.2)", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <span style={{ padding: "8px 16px", background: "var(--admin-card-bg)", borderRadius: 8, border: "1px solid var(--admin-border)", fontSize: 13, fontWeight: 500 }}>Đang tải...</span>
            </div>
          )}
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
                          {(user.fullName || "U").charAt(0).toUpperCase()}
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
                          title="Sửa thông tin"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit2 size={14} />
                        </button>
                        {user.role !== "Admin" && (
                          <>
                            <button
                              className="admin-btn-icon"
                              style={user.isActive ? { color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" } : { color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                              title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button
                              className="admin-btn-icon"
                              style={{ color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" }}
                              title="Xóa"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
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

      {/* CRUD Add User Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Thêm người dùng mới</h3>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Vai trò (Role)</label>
                  <select
                    className="admin-form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ background: "var(--admin-input-bg)" }}
                  >
                    <option value="Student">Student (Sinh viên)</option>
                    <option value="Business">Business (Doanh nghiệp)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="admin-form-input"
                    placeholder="Mặc định: Password1!"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-success">Thêm mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Edit User Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Sửa thông tin người dùng</h3>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Vai trò (Role)</label>
                  <select
                    className="admin-form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={selectedUser?.role === "Admin"}
                    style={{ background: "var(--admin-input-bg)" }}
                  >
                    <option value="Student">Student (Sinh viên)</option>
                    <option value="Business">Business (Doanh nghiệp)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-success">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
