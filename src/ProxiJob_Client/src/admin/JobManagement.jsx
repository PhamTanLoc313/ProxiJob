import { useState, useEffect } from "react";
import { Search, Eye, Ban, CheckCircle, Briefcase } from "lucide-react";
import { mockJobPosts, formatDate } from "./adminData";

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setJobs([...mockJobPosts]);
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const matchStatus = filterStatus === "All" || j.status === filterStatus;
    const matchSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const toggleJobStatus = (jobId, newStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }
  };

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
        <div className="admin-table-toolbar">
          <h2 className="admin-table-title">Quản lý Việc làm</h2>
          <div className="admin-table-filters">
            <div className="admin-search">
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, quán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

        <div style={{ overflowX: "auto" }}>
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
                      <div style={{ fontSize: 12, color: "var(--admin-primary-hover)" }}>{job.businessName}</div>
                    </td>
                    <td>{job.category}</td>
                    <td>{job.location.city}</td>
                    <td>{renderStatusBadge(job.status)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          className="admin-btn-icon"
                          title="Xem chi tiết"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye size={16} />
                        </button>
                        {job.status === "Published" ? (
                          <button
                            className="admin-btn-icon"
                            style={{ color: "var(--admin-warning)", borderColor: "rgba(245,158,11,0.3)" }}
                            title="Gỡ bài"
                            onClick={() => toggleJobStatus(job.id, "Closed")}
                          >
                            <Ban size={16} />
                          </button>
                        ) : job.status === "Closed" ? (
                          <button
                            className="admin-btn-icon"
                            style={{ color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                            title="Hiển thị lại"
                            onClick={() => toggleJobStatus(job.id, "Published")}
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="admin-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="admin-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Chi tiết Bài đăng</h3>
              <button className="admin-modal-close" onClick={() => setSelectedJob(null)}>
                <Ban size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--admin-primary-hover)" }}>
                {selectedJob.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--admin-text-muted)", margin: "0 0 16px" }}>
                {selectedJob.businessName} • {renderStatusBadge(selectedJob.status)}
              </p>

              <div className="admin-info-grid" style={{ marginBottom: 20 }}>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Danh mục</span>
                  <span className="admin-info-item-value">{selectedJob.category}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Lượt ứng tuyển</span>
                  <span className="admin-info-item-value">{selectedJob.applicationsCount} ứng viên</span>
                </div>
                <div className="admin-info-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="admin-info-item-label">Địa chỉ</span>
                  <span className="admin-info-item-value">{selectedJob.location.address}</span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span className="admin-info-item-label">Mô tả công việc</span>
                <p style={{ fontSize: 14, color: "var(--admin-text)", lineHeight: 1.5, marginTop: 4 }}>
                  {selectedJob.description}
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span className="admin-info-item-label">Yêu cầu</span>
                <p style={{ fontSize: 14, color: "var(--admin-text)", lineHeight: 1.5, marginTop: 4 }}>
                  {selectedJob.requirements}
                </p>
              </div>

              <div>
                <span className="admin-info-item-label">Ca làm việc ({selectedJob.shifts.length})</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {selectedJob.shifts.map((shift, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{shift.dayOfWeek}: {shift.startTime} - {shift.endTime}</span>
                      <span style={{ fontSize: 14, color: "var(--admin-success)", fontWeight: 600 }}>{shift.hourlyRate.toLocaleString()}đ/h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
