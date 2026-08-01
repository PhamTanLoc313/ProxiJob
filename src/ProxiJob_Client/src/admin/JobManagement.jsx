import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Ban, CheckCircle, Briefcase, Plus, Edit2, Trash2, X, AlertTriangle, Calendar, MapPin, FileText, ClipboardList, Building, Tag } from "lucide-react";
import { getAdminSession, formatDate } from "./adminData";
import { JOB_API_URL } from "../apiConfig";
import { useToast } from "./ToastContext";
import AdminModal from "./AdminModal";

export default function JobManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusConfirmData, setStatusConfirmData] = useState(null);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [mapError, setMapError] = useState(false);
  
  const session = getAdminSession();

  const { data: jobs = [], isLoading: loadingJobs, error: jobsError } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch(`${JOB_API_URL}/admin/jobs`);
      if (!res.ok) throw new Error("Không thể tải danh sách việc làm: " + res.status);
      return res.json();
    }
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${JOB_API_URL}/categories`);
      if (!res.ok) throw new Error("Error loading categories");
      return res.json();
    }
  });

  const handleDeleteJob = async (jobId) => {
    try {
      const res = await fetch(`${JOB_API_URL}/admin/jobs/${jobId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Xóa thất bại.");
        return;
      }
      toast.success("Đã xóa bài đăng tuyển dụng!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  const handleViewDetails = async (job) => {
    setSelectedJob(job);
    setMapError(false);
    setShowDetailModal(true);

    if (!job.latitude || !job.longitude || parseFloat(job.latitude) === 0 || parseFloat(job.longitude) === 0) {
      // 1. Try Goong Maps Geocoder
      try {
        const goongUrl = `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(job.address)}&api_key=CvNapWs3C3Vt7ZTRZf0uZliN9v3q8TBJKxd2CEcW`;
        const res = await fetch(goongUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            setSelectedJob(prev => (prev && prev.id === job.id ? { ...prev, latitude: loc.lat, longitude: loc.lng } : prev));
            return;
          }
        }
      } catch (err) {
        console.error("Goong geocode failed, trying OpenStreetMap...", err);
      }

      // 2. Try OpenStreetMap Nominatim Geocoder (handles alleys exceptionally well)
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.address)}&limit=1`;
        const res = await fetch(osmUrl, {
          headers: { 'User-Agent': 'ProxiJobAdmin/1.0' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const loc = data[0];
            setSelectedJob(prev => (prev && prev.id === job.id ? { ...prev, latitude: parseFloat(loc.lat), longitude: parseFloat(loc.lon) } : prev));
            return;
          }
        }
      } catch (err) {
        console.error("OSM geocode failed...", err);
      }

      // 3. Try simplified address fallback with Goong Geocode (splits by comma and drops the specific house/alley number)
      const parts = job.address.split(",");
      if (parts.length > 2) {
        const simplifiedAddress = parts.slice(1).join(",").trim();
        try {
          const goongUrl = `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(simplifiedAddress)}&api_key=CvNapWs3C3Vt7ZTRZf0uZliN9v3q8TBJKxd2CEcW`;
          const res = await fetch(goongUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const loc = data.results[0].geometry.location;
              setSelectedJob(prev => (prev && prev.id === job.id ? { ...prev, latitude: loc.lat, longitude: loc.lng } : prev));
              return;
            }
          }
        } catch (err) {
          console.error("Simplified Goong geocode failed...", err);
        }
      }
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
        toast.error(data.message || "Đổi trạng thái thất bại.");
        return;
      }
      toast.success(newStatus === "Published" ? "Đã duyệt/hiển thị tin tuyển dụng!" : "Đã gỡ/đóng tin tuyển dụng!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setStatusConfirmData(null);
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  if (loadingJobs || loadingCategories) {
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

  if (jobsError) {
    return <div className="admin-error-box">{jobsError.message}</div>;
  }

  const resetForm = () => {
    setFieldErrors({});
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
      case "Published": return <span className="admin-badge admin-badge-published" style={{ whiteSpace: "nowrap" }}>Đang mở</span>;
      case "Closed": return <span className="admin-badge admin-badge-closed" style={{ whiteSpace: "nowrap" }}>Đã đóng</span>;
      default: return <span className="admin-badge" style={{ whiteSpace: "nowrap" }}>{status}</span>;
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
                placeholder="Tìm tiêu đề, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Tabs Switched Layout */}
            <div style={{ display: "flex", background: "var(--admin-border)", padding: 3, borderRadius: 10, gap: 2 }}>
              {["All", "Published", "Closed"].map((st) => (
                <button
                  key={st}
                  className={`admin-dashboard-period-btn ${filterStatus === st ? "active" : ""}`}
                  style={{ padding: "6px 16px", fontSize: 13, borderRadius: 8, fontWeight: 700 }}
                  onClick={() => setFilterStatus(st)}
                >
                  {st === "All" ? "Tất cả" : st === "Published" ? "Đang mở" : "Đã đóng"}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side is empty since admin cannot post jobs */}
        </div>
        <div style={{ overflowX: "auto", position: "relative" }}>
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
                    <td style={{ maxWidth: 220, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={job.address || ""}>
                      {job.address || "—"}
                    </td>
                    <td>{renderStatusBadge(job.status)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          className="admin-btn-icon"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetails(job)}
                        >
                          <Eye size={14} />
                        </button>
                         <button
                           className="admin-btn-icon"
                           style={job.status === "Published" ? { color: "var(--admin-warning)", borderColor: "rgba(245,158,11,0.3)" } : { color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                           title={job.status === "Published" ? "Gỡ bài (Đóng)" : "Hiển thị lại (Mở)"}
                           onClick={() => setStatusConfirmData({ jobId: job.id, currentStatus: job.status, title: job.title })}
                         >
                          {job.status === "Published" ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          className="admin-btn-icon"
                          style={{ color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" }}
                          title="Xóa"
                          onClick={() => setDeleteJobId(job.id)}
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

      {/* Detail Job Modal */}
      <AdminModal
        isOpen={selectedJob && showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedJob(null); }}
        title="Chi tiết tin tuyển dụng"
        subtitle="Xem thông tin kiểm duyệt bài đăng của đối tác"
        icon={Briefcase}
        maxWidth={620}
        footer={
          <button 
            type="button" 
            className="admin-btn admin-btn-primary" 
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: 12, 
              background: "linear-gradient(135deg, var(--admin-primary), var(--admin-primary-hover))", 
              color: "#ffffff", 
              border: "none", 
              fontWeight: 700, 
              cursor: "pointer"
            }}
            onClick={() => { setShowDetailModal(false); setSelectedJob(null); }}
          >
            Đóng cửa sổ
          </button>
        }
      >
        {selectedJob && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Job Title & Status */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className={`admin-badge ${selectedJob.status === "Published" ? "admin-badge-published" : "admin-badge-closed"}`} style={{ fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {selectedJob.status === "Published" ? "Đang mở" : "Đã đóng"}
                </span>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", fontWeight: 500 }}>
                  Mã bài viết: #{selectedJob.id}
                </span>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--admin-text)", margin: 0, lineHeight: 1.4 }}>{selectedJob.title}</h2>
            </div>

            {/* Meta Grid Information */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "10.5px", color: "var(--admin-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }}>
                  <Tag size={12} style={{ color: "var(--admin-primary)" }} /> Danh mục
                </span>
                <span style={{ fontSize: "13px", color: "var(--admin-text)", fontWeight: 700 }}>{selectedJob.categoryName || "Chưa phân loại"}</span>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "10.5px", color: "var(--admin-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }}>
                  <Building size={12} style={{ color: "#3b82f6" }} /> Doanh nghiệp
                </span>
                <span style={{ fontSize: "13px", color: "var(--admin-text)", fontWeight: 700 }}>ID: {selectedJob.businessId}</span>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "10.5px", color: "var(--admin-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }}>
                  <Calendar size={12} style={{ color: "#10b981" }} /> Đăng ngày
                </span>
                <span style={{ fontSize: "13px", color: "var(--admin-text)", fontWeight: 700 }}>{formatDate(selectedJob.createdAt)}</span>
              </div>
            </div>

            {/* Address Map Section */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-text)", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={15} style={{ color: "#ef4444" }} /> Địa điểm & Bản đồ
              </h4>
              <p style={{ fontSize: "13.5px", color: "var(--admin-text-secondary)", margin: "0 0 10px 0", lineHeight: 1.5 }}>{selectedJob.address || "Chưa có địa chỉ"}</p>
              
              {selectedJob.latitude && selectedJob.longitude && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ background: "rgba(16,185,129,0.06)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)", padding: "4px 10px", borderRadius: 20, fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%" }}></span>
                      Lat: {parseFloat(selectedJob.latitude).toFixed(6)}
                    </span>
                    <span style={{ background: "rgba(16,185,129,0.06)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)", padding: "4px 10px", borderRadius: 20, fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%" }}></span>
                      Lng: {parseFloat(selectedJob.longitude).toFixed(6)}
                    </span>
                  </div>

                  <div style={{ marginTop: 4, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", height: 200, background: "#f8fafc" }}>
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8" />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                          <style>
                            body { margin: 0; padding: 0; }
                            #map { height: 100vh; width: 100vw; }
                            .leaflet-control-attribution { display: none !important; }
                          </style>
                        </head>
                        <body>
                          <div id="map"></div>
                          <script>
                            var map = L.map('map', { zoomControl: true }).setView([${selectedJob.latitude}, ${selectedJob.longitude}], 16);
                            L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                              maxZoom: 20
                            }).addTo(map);
                            L.marker([${selectedJob.latitude}, ${selectedJob.longitude}]).addTo(map);
                          </script>
                        </body>
                        </html>
                      `}
                      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                      title="Bản đồ định vị công việc"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-text)", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={15} style={{ color: "var(--admin-primary)" }} /> Mô tả công việc
              </h4>
              <div style={{ background: "#fafafb", padding: "14px 16px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{selectedJob.description}</p>
              </div>
            </div>

            {/* Requirements Section */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-text)", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <ClipboardList size={15} style={{ color: "#f59e0b" }} /> Yêu cầu tuyển dụng
              </h4>
              <div style={{ background: "#fafafb", padding: "14px 16px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{selectedJob.requirements}</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={!!deleteJobId}
        onClose={() => setDeleteJobId(null)}
        title="Xác nhận xóa bài đăng"
        icon={Trash2}
        maxWidth={440}
        footer={
          <>
            <button className="admin-btn admin-btn-outline" onClick={() => setDeleteJobId(null)}>Hủy</button>
            <button 
              className="admin-btn admin-btn-danger" 
              onClick={() => {
                handleDeleteJob(deleteJobId);
                setDeleteJobId(null);
              }}
            >
              Xác nhận xóa
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>
          Bạn có chắc chắn muốn xóa bài đăng tuyển dụng này? Toàn bộ thông tin bài đăng sẽ bị xóa vĩnh viễn khỏi hệ thống.
        </p>
      </AdminModal>

      {/* Status Toggle Confirmation Modal */}
      <AdminModal
        isOpen={!!statusConfirmData}
        onClose={() => setStatusConfirmData(null)}
        title={statusConfirmData?.currentStatus === "Published" ? "Xác nhận gỡ bài đăng" : "Xác nhận mở lại bài đăng"}
        icon={AlertTriangle}
        maxWidth={450}
        footer={
          <>
            <button className="admin-btn admin-btn-outline" onClick={() => setStatusConfirmData(null)}>Hủy</button>
            <button 
              className="admin-btn admin-btn-warning" 
              style={statusConfirmData?.currentStatus === "Published" ? {} : { backgroundColor: "var(--admin-success)", borderColor: "var(--admin-success)" }}
              onClick={() => {
                if (statusConfirmData) {
                  toggleJobStatus(statusConfirmData.jobId, statusConfirmData.currentStatus);
                  setStatusConfirmData(null);
                }
              }}
            >
              Xác nhận
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>
          Bạn có chắc chắn muốn {statusConfirmData?.currentStatus === "Published" ? "gỡ (đóng)" : "mở lại (hiển thị)"} bài đăng tuyển dụng <strong>"{statusConfirmData?.title}"</strong> không?
          {statusConfirmData?.currentStatus === "Published"
            ? " Sau khi gỡ, sinh viên sẽ không thể tìm thấy và ứng tuyển vào tin này trên ứng dụng di động."
            : " Sau khi mở lại, tin đăng sẽ hiển thị công khai trên điện thoại cho các sinh viên nộp hồ sơ ứng tuyển."
          }
        </p>
      </AdminModal>
    </div>
  );
}
