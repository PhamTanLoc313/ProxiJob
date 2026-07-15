import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, EyeOff, UserX, UserCheck, Users, UserPlus, Plus, Edit2, Trash2, X, Calendar } from "lucide-react";
import { getAdminSession, formatDateTime } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";
import { useToast } from "./ToastContext";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filterRole, setFilterRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteUserId, setDeleteUserId] = useState(null);
  
  // CRUD states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    role: "Student",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const session = getAdminSession();
  const token = session?.token;

  // Query users
  const { data: users = [], isLoading, error: queryError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Không thể lấy danh sách người dùng: " + res.status);
      return res.json();
    },
    enabled: !!token
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setFieldErrors({});
    const errors = {};
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = (formData.phoneNumber || "").trim();
    const trimmedPassword = (formData.password || "").trim();

    if (!trimmedName) {
      errors.fullName = "Họ và tên không được để trống.";
    }
    if (!trimmedEmail) {
      errors.email = "Email không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Email không đúng định dạng.";
      }
    }
    if (!trimmedPassword) {
      errors.password = "Mật khẩu không được để trống.";
    } else if (trimmedPassword.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          role: formData.role,
          password: trimmedPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Tạo người dùng thất bại.");
        return;
      }
      toast.success("Tạo người dùng thành công!");
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setFieldErrors({});
    const errors = {};
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = (formData.phoneNumber || "").trim();

    if (!trimmedName) {
      errors.fullName = "Họ và tên không được để trống.";
    }
    if (!trimmedEmail) {
      errors.email = "Email không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Email không đúng định dạng.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: trimmedEmail,
          fullName: trimmedName,
          phoneNumber: trimmedPhone,
          role: formData.role,
          isActive: selectedUser.isActive
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Cập nhật người dùng thất bại.");
        return;
      }
      toast.success("Cập nhật người dùng thành công!");
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Xóa người dùng thất bại.");
        return;
      }
      toast.success("Xóa người dùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  const toggleUserStatus = async (user) => {
    if (!token) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
        toast.error(data.message || "Thay đổi trạng thái thất bại.");
        return;
      }
      toast.success(user.isActive ? "Đã vô hiệu hóa người dùng!" : "Đã kích hoạt người dùng!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-table-container admin-page-enter">
        <div className="admin-table-toolbar">
          <div className="admin-skeleton" style={{ width: "150px", height: "30px" }}></div>
          <div className="admin-skeleton" style={{ width: "300px", height: "38px" }}></div>
        </div>
        <div style={{ padding: "20px" }}>
          <div className="admin-skeleton admin-skeleton-table-row" style={{ height: "40px", marginBottom: "16px" }}></div>
          <div className="admin-skeleton admin-skeleton-table-row"></div>
          <div className="admin-skeleton admin-skeleton-table-row"></div>
          <div className="admin-skeleton admin-skeleton-table-row"></div>
          <div className="admin-skeleton admin-skeleton-table-row"></div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return <div className="admin-error-box">{queryError.message}</div>;
  }

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setFieldErrors({});
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
    setFieldErrors({});
    setShowPassword(false);
    setFormData({
      email: "",
      fullName: "",
      phoneNumber: "",
      role: "Student",
      password: "",
    });
  };

  const filteredUsers = users
    .filter((u) => {
      const matchRole = filterRole === "All" || u.role === filterRole;
      const matchSearch =
        (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchRole && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderRoleBadge = (role) => {
    switch (role) {
      case "Admin": return <span className="admin-badge admin-badge-admin">Admin</span>;
      case "Business": return <span className="admin-badge admin-badge-business">Business</span>;
      case "Student": return <span className="admin-badge admin-badge-student">Student</span>;
      default: return <span className="admin-badge">{role}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
      <div className="admin-table-container">
        <div className="admin-table-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, padding: "20px 24px" }}>
          {/* Left Side: Search & Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", flex: 1 }}>
            <div className="admin-search" style={{ maxWidth: 320, width: "100%" }}>
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Tabs Switched Layout */}
            <div style={{ display: "flex", background: "var(--admin-border)", padding: 3, borderRadius: 10, gap: 2 }}>
              {["All", "Student", "Business", "Admin"].map((r) => (
                <button
                  key={r}
                  className={`admin-dashboard-period-btn ${filterRole === r ? "active" : ""}`}
                  style={{ padding: "6px 16px", fontSize: 13, borderRadius: 8, fontWeight: 700 }}
                  onClick={() => setFilterRole(r)}
                >
                  {r === "All" ? "Tất cả" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Action Add Button */}
          <button 
            className="admin-btn" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              padding: "10px 20px", 
              background: "linear-gradient(135deg, var(--admin-primary), var(--admin-primary-hover))", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: 12, 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: "pointer", 
              boxShadow: "0 4px 12px var(--admin-primary-glow)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onClick={openAddModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px var(--admin-primary-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 12px var(--admin-primary-glow)";
            }}
          >
            <Plus size={18} />
            <span>Thêm người dùng</span>
          </button>
        </div>

        <div style={{ overflowX: "auto", position: "relative" }}>
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
                              onClick={() => setDeleteUserId(user.id)}
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
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "var(--admin-primary-glow)",
                  color: "var(--admin-primary)",
                  padding: 8,
                  borderRadius: 10,
                  display: "flex"
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16 }}>Thêm người dùng mới</h3>
                  <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "2px 0 0" }}>Tạo tài khoản thành viên mới cho hệ thống</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} noValidate autoComplete="off">
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px" }}>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Họ và Tên*</label>
                  <input
                    type="text"
                    className={`admin-form-input ${fieldErrors.fullName ? "admin-input-error-state" : ""}`}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "11px 14px",
                      fontSize: "13.5px"
                    }}
                  />
                  {fieldErrors.fullName && <span className="admin-field-error-msg">{fieldErrors.fullName}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email*</label>
                    <input
                      type="email"
                      autoComplete="new-email"
                      className={`admin-form-input ${fieldErrors.email ? "admin-input-error-state" : ""}`}
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                      }}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "11px 14px",
                        fontSize: "13.5px"
                      }}
                    />
                    {fieldErrors.email && <span className="admin-field-error-msg">{fieldErrors.email}</span>}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Ví dụ: 0987654321"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "11px 14px",
                        fontSize: "13.5px"
                      }}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Vai trò (Role)*</label>
                  <select
                    className="admin-form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "11px 14px",
                      fontSize: "13.5px",
                      background: "#fff"
                    }}
                  >
                    <option value="Student">Student (Sinh viên)</option>
                    <option value="Business">Business (Doanh nghiệp)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ position: "relative" }}>
                  <label className="admin-form-label">Mật khẩu*</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`admin-form-input ${fieldErrors.password ? "admin-input-error-state" : ""}`}
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                      }}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "11px 44px 11px 14px",
                        fontSize: "13.5px"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--admin-text-muted)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="admin-field-error-msg">{fieldErrors.password}</span>}
                </div>
              </div>
              
              <div className="admin-modal-footer" style={{ borderTop: "1px solid var(--admin-border)", paddingTop: 16 }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-success" style={{ backgroundColor: "var(--admin-success)", borderColor: "var(--admin-success)" }}>Thêm mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Edit User Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "var(--admin-primary-glow)",
                  color: "var(--admin-primary)",
                  padding: 8,
                  borderRadius: 10,
                  display: "flex"
                }}>
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16 }}>Chỉnh sửa thông tin</h3>
                  <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "2px 0 0" }}>Cập nhật thông tin tài khoản người dùng</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px" }}>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Họ và Tên*</label>
                  <input
                    type="text"
                    className={`admin-form-input ${fieldErrors.fullName ? "admin-input-error-state" : ""}`}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "11px 14px",
                      fontSize: "13.5px"
                    }}
                  />
                  {fieldErrors.fullName && <span className="admin-field-error-msg">{fieldErrors.fullName}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email*</label>
                    <input
                      type="email"
                      className={`admin-form-input ${fieldErrors.email ? "admin-input-error-state" : ""}`}
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                      }}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "11px 14px",
                        fontSize: "13.5px"
                      }}
                    />
                    {fieldErrors.email && <span className="admin-field-error-msg">{fieldErrors.email}</span>}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Ví dụ: 0987654321"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "11px 14px",
                        fontSize: "13.5px"
                      }}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Vai trò (Role)*</label>
                  <select
                    className="admin-form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={selectedUser?.role === "Admin"}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "11px 14px",
                      fontSize: "13.5px",
                      background: "#fff"
                    }}
                  >
                    <option value="Student">Student (Sinh viên)</option>
                    <option value="Business">Business (Doanh nghiệp)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer" style={{ borderTop: "1px solid var(--admin-border)", paddingTop: 16 }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-success" style={{ backgroundColor: "var(--admin-primary)", borderColor: "var(--admin-primary)" }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteUserId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteUserId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <h3 className="admin-modal-title" style={{ color: "var(--admin-danger)", display: "flex", alignItems: "center", gap: 8 }}>
                <Trash2 size={20} />
                Xác nhận xóa tài khoản
              </h3>
              <button className="admin-modal-close" onClick={() => setDeleteUserId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ paddingTop: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--admin-text-secondary)", lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa người dùng này? Tài khoản sẽ bị xóa vĩnh viễn khỏi danh sách hoạt động và không thể khôi phục lại.
              </p>
            </div>
            <div className="admin-modal-footer" style={{ borderTop: "none", paddingTop: 16 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => setDeleteUserId(null)}>Hủy</button>
              <button 
                className="admin-btn admin-btn-danger" 
                onClick={() => {
                  handleDeleteUser(deleteUserId);
                  setDeleteUserId(null);
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
