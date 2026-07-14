import { useState, useEffect } from "react";
import { Search, Eye, Ban, CheckCircle, Briefcase, Plus, Edit2, Trash2, X } from "lucide-react";
import { getAdminSession, formatDate } from "./adminData";
import { JOB_API_URL } from "../apiConfig";


export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  
  // CRUD states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    categoryId: "",
    status: "Published",
    address: "",
    businessId: "5", // Default mock business (DN Test ProxiJob)
  });

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const session = getAdminSession();
      if (!session?.token) {
        setError("Chưa đăng nhập admin hoặc phiên làm việc hết hạn.");
        return;
      }
      const res = await fetch(`${JOB_API_URL}/admin/jobs`);
      if (!res.ok) {
        setError("Không thể tải danh sách việc làm: " + res.status);
        return;
      }
      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      setError("Lỗi kết nối tới máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${JOB_API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      }
    } catch (err) {
      console.log("Error loading categories:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${JOB_API_URL}/admin/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: parseInt(formData.businessId),
          categoryId: parseInt(formData.categoryId),
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          status: formData.status,
          address: formData.address,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Tạo việc làm thất bại.");
        return;
      }
      setShowAddModal(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${JOB_API_URL}/admin/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          status: formData.status,
          address: formData.address,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Cập nhật thất bại.");
        return;
      }
      setShowEditModal(false);
      resetForm();
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tuyển dụng này?")) return;
    try {
      const res = await fetch(`${JOB_API_URL}/admin/jobs/${jobId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Xóa thất bại.");
        return;
      }
      fetchJobs();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "Published" ? "Closed" : "Published";
    try {
      const res = await fetch(`${JOB_API_URL}/admin/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Đổi trạng thái thất bại.");
        return;
      }
      fetchJobs();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      categoryId: job.categoryId.toString(),
      status: job.status,
      address: job.address || "",
      businessId: job.businessId.toString(),
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      requirements: "",
      categoryId: categories[0]?.id?.toString() || "",
      status: "Published",
      address: "",
      businessId: "5",
    });
  };

  const filteredJobs = jobs.filter((j) => {
    const matchStatus = filterStatus === "All" || j.status === filterStatus;
    const matchSearch =
      (j.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Published": return <span className="admin-badge admin-badge-published">Đang hiển thị</span>;
      case "Draft": return <span className="admin-badge admin-badge-draft">Bản nháp</span>;
      case "Closed": return <span className="admin-badge admin-badge-closed">Đã đóng</span>;
      default: return <span className="admin-badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="admin-table-container">
        <div className="admin-table-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="admin-table-title" style={{ margin: 0 }}>Quản lý Việc làm</h2>
          </div>
          <button 
            className="admin-btn admin-btn-success" 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Đăng việc làm</span>
          </button>
        </div>

        <div className="admin-table-toolbar" style={{ borderTop: "none", paddingTop: 0 }}>
          <div className="admin-table-filters" style={{ width: "100%", justifyContent: "space-between" }}>
            <div className="admin-search" style={{ maxWidth: 300 }}>
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Published", "Draft", "Closed"].map((st) => (
                <button
                  key={st}
                  className={`admin-filter-btn ${filterStatus === st ? "active" : ""}`}
                  onClick={() => setFilterStatus(st)}
                >
                  {st === "All" ? "Tất cả" : st}
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
                <th>Tiêu đề / Quán</th>
                <th>Danh mục</th>
                <th>Khu vực</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      <Briefcase className="admin-empty-icon" />
                      <div className="admin-empty-text">Không tìm thấy bài đăng việc làm nào</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: "var(--admin-primary-hover)" }}>Doanh nghiệp ID: {job.businessId}</div>
                    </td>
                    <td>{job.categoryName}</td>
                    <td>{job.address || "—"}</td>
                    <td>{renderStatusBadge(job.status)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          className="admin-btn-icon"
                          title="Sửa thông tin"
                          onClick={() => openEditModal(job)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="admin-btn-icon"
                          style={job.status === "Published" ? { color: "var(--admin-warning)", borderColor: "rgba(245,158,11,0.3)" } : { color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                          title={job.status === "Published" ? "Gỡ bài (Đóng)" : "Hiển thị lại (Mở)"}
                          onClick={() => toggleJobStatus(job.id, job.status)}
                        >
                          {job.status === "Published" ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          className="admin-btn-icon"
                          style={{ color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" }}
                          title="Xóa"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Add Job Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Đăng việc làm mới</h3>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Tiêu đề việc làm</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Danh mục</label>
                  <select
                    className="admin-form-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ background: "var(--admin-input-bg)" }}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Địa chỉ làm việc</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả công việc</label>
                  <textarea
                    className="admin-form-input"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Yêu cầu công việc</label>
                  <textarea
                    className="admin-form-input"
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="admin-form-group" style={{ flex: 1 }}>
                    <label className="admin-form-label">Doanh nghiệp ID</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={formData.businessId}
                      onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group" style={{ flex: 1 }}>
                    <label className="admin-form-label">Trạng thái ban đầu</label>
                    <select
                      className="admin-form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ background: "var(--admin-input-bg)" }}
                    >
                      <option value="Published">Published (Hiển thị ngay)</option>
                      <option value="Draft">Draft (Bản nháp)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-success">Đăng bài</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Edit Job Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Chỉnh sửa bài đăng việc làm</h3>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Tiêu đề việc làm</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Danh mục</label>
                  <select
                    className="admin-form-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ background: "var(--admin-input-bg)" }}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Địa chỉ làm việc</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả công việc</label>
                  <textarea
                    className="admin-form-input"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Yêu cầu công việc</label>
                  <textarea
                    className="admin-form-input"
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Trạng thái tuyển dụng</label>
                  <select
                    className="admin-form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ background: "var(--admin-input-bg)" }}
                  >
                    <option value="Published">Published (Hiển thị)</option>
                    <option value="Draft">Draft (Bản nháp)</option>
                    <option value="Closed">Closed (Đã đóng)</option>
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
