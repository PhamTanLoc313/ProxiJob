import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Users, Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { getAdminSession, formatCurrency } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";
import { useToast } from "./ToastContext";

export default function SubscriptionManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const session = getAdminSession();
  const token = session?.token;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [deleteSubId, setDeleteSubId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    variableCost: 0,
    billingType: "Monthly",
    jobPostLimit: 1,
    durationDays: 30,
    hasPriorityDisplay: false,
    hasHrManagement: false,
    maxEmployees: 0,
    maxActiveQrs: 0,
    maxSearchRadius: 10,
  });

  // Fetch real plans from backend
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      try {
        const res = await fetch(`${IDENTITY_API_URL}/plans/admin`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error("Lỗi kết nối hoặc tài khoản không có quyền Admin.");
        }
        const data = await res.json();
        return data.data || data.Data || (Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("plans/admin failed, fetching real public database API /plans:", err);
        const publicRes = await fetch(`${IDENTITY_API_URL}/plans`);
        if (publicRes.ok) {
          const publicData = await publicRes.json();
          const rawPlans = publicData.data || publicData.Data || (Array.isArray(publicData) ? publicData : []);
          return rawPlans.map(plan => ({
            id: plan.id ?? plan.Id,
            name: plan.name ?? plan.Name ?? plan.planName ?? plan.PlanName,
            description: plan.description ?? plan.Description ?? "",
            price: plan.price ?? plan.Price ?? 0,
            variableCost: plan.variableCost ?? plan.VariableCost ?? 0,
            billingType: plan.billingType ?? plan.BillingType ?? "Monthly",
            jobPostLimit: plan.jobPostLimit ?? plan.JobPostLimit ?? 0,
            durationDays: plan.durationDays ?? plan.DurationDays ?? 30,
            hasPriorityDisplay: plan.hasPriorityDisplay ?? plan.HasPriorityDisplay ?? false,
            hasHrManagement: plan.hasHrManagement ?? plan.HasHrManagement ?? false,
            activeUsers: plan.activeUsers ?? plan.ActiveUsers ?? 0,
            maxEmployees: plan.maxEmployees ?? plan.MaxEmployees ?? 0,
            maxActiveQrs: plan.maxActiveQrs ?? plan.MaxActiveQrs ?? 0,
            maxSearchRadius: plan.maxSearchRadius ?? plan.MaxSearchRadius ?? 10
          }));
        }
        return [];
      }
    },
    enabled: !!token
  });

  const getVietnamesePlanName = (name) => {
    switch (name) {
      case "PerShift": return "Đăng Lẻ 1 Ca";
      case "Recruit": return "Gói Tuyển Dụng";
      case "HRM Basic":
      case "HrmBasic": 
        return "Gói HRM Cơ Bản";
      case "Enterprise": return "Gói Enterprise";
      default: return name;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Tên gói
    if (!formData.name || !formData.name.trim()) {
      errors.name = "Tên gói không được để trống";
    }

    // Giá bán
    if (formData.price === "" || formData.price === undefined || formData.price === null) {
      errors.price = "Giá bán không được để trống";
    } else if (Number(formData.price) <= 0) {
      errors.price = "Giá bán phải lớn hơn 0";
    }

    // Chi phí biến đổi
    if (formData.variableCost === "" || formData.variableCost === undefined || formData.variableCost === null) {
      errors.variableCost = "Chi phí biến đổi không được để trống";
    } else if (Number(formData.variableCost) <= 0) {
      errors.variableCost = "Chi phí biến đổi phải lớn hơn 0";
    } else if (formData.price !== "" && Number(formData.variableCost) > Number(formData.price)) {
      errors.variableCost = "Chi phí biến đổi không được lớn hơn Giá bán (tránh bán lỗ)";
    }

    // Hạn mức tin đăng
    if (formData.jobPostLimit === "" || formData.jobPostLimit === undefined || formData.jobPostLimit === null) {
      errors.jobPostLimit = "Hạn mức tin đăng không được để trống";
    } else if (Number(formData.jobPostLimit) <= 0) {
      errors.jobPostLimit = "Hạn mức tin đăng phải lớn hơn 0";
    }

    // Hiệu lực ngày
    if (formData.durationDays === "" || formData.durationDays === undefined || formData.durationDays === null) {
      errors.durationDays = "Số ngày hiệu lực không được để trống";
    } else if (Number(formData.durationDays) <= 0) {
      errors.durationDays = "Số ngày hiệu lực phải lớn hơn 0";
    }

    // Bán kính quét
    if (formData.maxSearchRadius === "" || formData.maxSearchRadius === undefined || formData.maxSearchRadius === null) {
      errors.maxSearchRadius = "Bán kính quét không được để trống";
    } else if (Number(formData.maxSearchRadius) <= 0) {
      errors.maxSearchRadius = "Bán kính quét phải lớn hơn 0";
    }

    // Nhân viên tối đa
    if (formData.maxEmployees === "" || formData.maxEmployees === undefined || formData.maxEmployees === null) {
      errors.maxEmployees = "Nhân viên tối đa không được để trống";
    } else if (Number(formData.maxEmployees) <= 0) {
      errors.maxEmployees = "Nhân viên tối đa phải lớn hơn 0";
    }

    // QR chấm công tối đa
    if (formData.maxActiveQrs === "" || formData.maxActiveQrs === undefined || formData.maxActiveQrs === null) {
      errors.maxActiveQrs = "QR chấm công tối đa không được để trống";
    } else if (Number(formData.maxActiveQrs) <= 0) {
      errors.maxActiveQrs = "QR chấm công tối đa phải lớn hơn 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setFieldErrors({});
    setFormData({
      name: "",
      description: "",
      price: "",
      variableCost: "",
      billingType: "Monthly",
      jobPostLimit: "",
      durationDays: "",
      hasPriorityDisplay: false,
      hasHrManagement: false,
      maxEmployees: "",
      maxActiveQrs: "",
      maxSearchRadius: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (sub) => {
    setFieldErrors({});
    setSelectedSub(sub);
    setFormData({
      name: sub.name,
      description: sub.description,
      price: sub.price,
      variableCost: sub.variableCost,
      billingType: sub.billingType,
      jobPostLimit: sub.jobPostLimit,
      durationDays: sub.durationDays,
      hasPriorityDisplay: sub.hasPriorityDisplay,
      hasHrManagement: sub.hasHrManagement,
      maxEmployees: sub.maxEmployees,
      maxActiveQrs: sub.maxActiveQrs,
      maxSearchRadius: sub.maxSearchRadius,
    });
    setShowEditModal(true);
  };

  // Add Plan API
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          variableCost: Number(formData.variableCost),
          jobPostLimit: Number(formData.jobPostLimit),
          durationDays: Number(formData.durationDays),
          maxEmployees: Number(formData.maxEmployees),
          maxActiveQrs: Number(formData.maxActiveQrs),
          maxSearchRadius: Number(formData.maxSearchRadius),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Tạo gói dịch vụ thất bại.");
        return;
      }
      toast.success("Tạo gói dịch vụ mới thành công!");
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  // Edit Plan API
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch(`${IDENTITY_API_URL}/plans/${selectedSub.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          variableCost: Number(formData.variableCost),
          jobPostLimit: Number(formData.jobPostLimit),
          durationDays: Number(formData.durationDays),
          maxEmployees: Number(formData.maxEmployees),
          maxActiveQrs: Number(formData.maxActiveQrs),
          maxSearchRadius: Number(formData.maxSearchRadius),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Cập nhật thất bại.");
        return;
      }
      toast.success("Cập nhật gói dịch vụ thành công!");
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  // Delete Plan API
  const handleDeletePlan = async (id) => {
    try {
      const res = await fetch(`${IDENTITY_API_URL}/plans/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        toast.error("Không thể xóa gói dịch vụ này.");
        return;
      }
      toast.success("Đã xóa gói dịch vụ thành công!");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
        <div className="admin-sub-cards">
          <div className="admin-stat-card admin-skeleton admin-skeleton-card" style={{ height: "280px" }}></div>
          <div className="admin-stat-card admin-skeleton admin-skeleton-card" style={{ height: "280px" }}></div>
          <div className="admin-stat-card admin-skeleton admin-skeleton-card" style={{ height: "280px" }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="admin-error-box">Lỗi: {error.message}</div>;
  }

  const studentPlans = subscriptions.filter(sub => 
    sub.name.toLowerCase().includes("student") || 
    sub.name.toLowerCase().includes("sinh viên") || 
    sub.name.toLowerCase().includes("sinhvien") ||
    sub.jobPostLimit === 0
  );
  const businessPlans = subscriptions.filter(sub => !studentPlans.includes(sub));

  const renderPlanCard = (sub) => (
    <div key={sub.id} className={`admin-sub-card ${sub.hasPriorityDisplay ? "admin-sub-card-popular" : ""}`} style={{ position: "relative" }}>
      
      {/* Action buttons (Edit / Delete) */}
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6, zIndex: 10 }}>
        <button 
          className="admin-btn-icon" 
          title="Chỉnh sửa gói" 
          style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--admin-border)", padding: 6, width: 28, height: 28 }}
          onClick={() => openEditModal(sub)}
        >
          <Edit2 size={13} style={{ color: "var(--admin-text-secondary)" }} />
        </button>
        <button 
          className="admin-btn-icon" 
          title="Xóa gói" 
          style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--admin-border)", color: "var(--admin-danger)", padding: 6, width: 28, height: 28 }}
          onClick={() => setDeleteSubId(sub.id)}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--admin-text)", margin: "0 0 8px", paddingRight: 60 }}>
        {getVietnamesePlanName(sub.name)}
      </h3>
      <p style={{ fontSize: 13, color: "var(--admin-text-secondary)", margin: 0, minHeight: 40, paddingRight: 20 }}>
        {sub.description}
      </p>
      
      <div className="admin-sub-price">
        {sub.price === 0 ? "Miễn phí" : formatCurrency(sub.price)}
        {sub.price > 0 && <span className="admin-sub-price-unit">/{sub.billingType === "Monthly" ? "tháng" : "ca"}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--admin-border)", borderBottom: "1px solid var(--admin-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--admin-text)" }}>
          <Users size={16} color="var(--admin-primary)" />
          <strong>{sub.activeUsers}</strong> {sub.jobPostLimit === 0 ? "sinh viên" : "doanh nghiệp"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--admin-text)" }}>
          <PackageCheck size={16} color="var(--admin-success)" />
          {sub.jobPostLimit === 0 ? (
            <span>Hạn mức ứng tuyển: <strong>+{sub.description.match(/\d+/)?.[0] || 10} lượt</strong></span>
          ) : (
            <span>Hạn mức đăng tin: <strong>{sub.jobPostLimit === 9999 ? "Vô hạn" : sub.jobPostLimit}</strong></span>
          )}
        </div>
      </div>

      <ul className="admin-sub-features">
        <li>Hiệu lực: <strong>{sub.durationDays} ngày</strong></li>
        {sub.jobPostLimit > 0 && (
          <>
            <li>Hiển thị ưu tiên: <strong>{sub.hasPriorityDisplay ? "Có" : "Không"}</strong></li>
            <li>Tính năng HRM: <strong>{sub.hasHrManagement ? "Có" : "Không"}</strong></li>
            {sub.maxEmployees > 0 && <li>Số nhân viên HRM: <strong>Tối đa {sub.maxEmployees} người</strong></li>}
            {sub.maxActiveQrs > 0 && <li>QR chấm công: <strong>Tối đa {sub.maxActiveQrs} mã</strong></li>}
            <li>Bán kính quét tin: <strong>{sub.maxSearchRadius === 9999 ? "Không giới hạn" : `${sub.maxSearchRadius} km`}</strong></li>
          </>
        )}
        {sub.jobPostLimit === 0 && (
          <li>Loại tài khoản áp dụng: <strong>Student (Sinh viên)</strong></li>
        )}
      </ul>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
      
      {/* Top action row */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 4px" }}>
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
          <span>Thêm gói dịch vụ</span>
        </button>
      </div>

      {/* Gói dịch vụ cho Sinh viên */}
      <h3 style={{ 
        fontSize: 15, 
        fontWeight: 700, 
        color: "var(--admin-text)", 
        margin: "0 0 -8px 0", 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        paddingLeft: 4 
      }}>
        <span style={{ width: 4, height: 16, background: "var(--admin-primary)", borderRadius: 2, display: "inline-block" }}></span>
        GÓI DỊCH VỤ CHO SINH VIÊN ({studentPlans.length})
      </h3>
      {studentPlans.length === 0 ? (
        <div style={{ padding: "30px", background: "#f8fafc", borderRadius: 16, border: "1px dashed var(--admin-border)", textAlign: "center", color: "var(--admin-text-muted)", fontSize: 13 }}>
          Không có gói dịch vụ nào dành cho sinh viên.
        </div>
      ) : (
        <div className="admin-sub-cards" style={{ marginBottom: 12 }}>
          {studentPlans.map((sub) => renderPlanCard(sub))}
        </div>
      )}

      {/* Gói dịch vụ cho Chủ quán */}
      <h3 style={{ 
        fontSize: 15, 
        fontWeight: 700, 
        color: "var(--admin-text)", 
        margin: "12px 0 -8px 0", 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        paddingLeft: 4 
      }}>
        <span style={{ width: 4, height: 16, background: "var(--admin-primary)", borderRadius: 2, display: "inline-block" }}></span>
        GÓI DỊCH VỤ CHO CHỦ QUÁN / NHÀ TUYỂN DỤNG ({businessPlans.length})
      </h3>
      {businessPlans.length === 0 ? (
        <div style={{ padding: "30px", background: "#f8fafc", borderRadius: 16, border: "1px dashed var(--admin-border)", textAlign: "center", color: "var(--admin-text-muted)", fontSize: 13 }}>
          Không có gói dịch vụ nào dành cho chủ quán.
        </div>
      ) : (
        <div className="admin-sub-cards">
          {businessPlans.map((sub) => renderPlanCard(sub))}
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "var(--admin-primary-glow)",
                  color: "var(--admin-primary)",
                  padding: 8,
                  borderRadius: 10,
                  display: "flex"
                }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16 }}>Thêm gói dịch vụ mới</h3>
                  <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "2px 0 0" }}>Cấu hình gói dịch vụ đăng tuyển và quản trị</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} noValidate>
              <div className="admin-modal-body" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Section 1: Thông tin cơ bản */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "0 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Thông tin cơ bản
                </h4>

                <div className="admin-form-group">
                  <label className="admin-form-label">Tên gói dịch vụ (System Name)*</label>
                  <input
                    type="text"
                    name="name"
                    className={`admin-form-input ${fieldErrors.name ? "admin-input-error-state" : ""}`}
                    placeholder="Ví dụ: PerShift, Recruit, HRM Basic, Enterprise"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                  />
                  {fieldErrors.name && <span className="admin-field-error-msg">{fieldErrors.name}</span>}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả gói</label>
                  <textarea
                    name="description"
                    className="admin-form-input"
                    placeholder="Mô tả quyền lợi nổi bật của gói..."
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ height: 60, borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px", resize: "none" }}
                  />
                </div>

                {/* Section 2: Chi phí & Chu kỳ */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "10px 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Chi phí & Chu kỳ
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá bán (VNĐ)*</label>
                    <input
                      type="number"
                      name="price"
                      className={`admin-form-input ${fieldErrors.price ? "admin-input-error-state" : ""}`}
                      value={formData.price}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.price && <span className="admin-field-error-msg">{fieldErrors.price}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Chi phí biến đổi (VNĐ)</label>
                    <input
                      type="number"
                      name="variableCost"
                      className={`admin-form-input ${fieldErrors.variableCost ? "admin-input-error-state" : ""}`}
                      value={formData.variableCost}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.variableCost && <span className="admin-field-error-msg">{fieldErrors.variableCost}</span>}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Loại chu kỳ*</label>
                  <select
                    name="billingType"
                    className="admin-form-input"
                    value={formData.billingType}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px", background: "#fff" }}
                  >
                    <option value="PerShift">Đăng lẻ theo ca (PerShift)</option>
                    <option value="Monthly">Thuê bao tháng (Monthly)</option>
                  </select>
                </div>

                {/* Section 3: Giới hạn & Tính năng */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "10px 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Giới hạn & Quyền lợi
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hạn mức tin đăng*</label>
                    <input
                      type="number"
                      name="jobPostLimit"
                      className={`admin-form-input ${fieldErrors.jobPostLimit ? "admin-input-error-state" : ""}`}
                      value={formData.jobPostLimit}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.jobPostLimit && <span className="admin-field-error-msg">{fieldErrors.jobPostLimit}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hiệu lực (ngày)*</label>
                    <input
                      type="number"
                      name="durationDays"
                      className={`admin-form-input ${fieldErrors.durationDays ? "admin-input-error-state" : ""}`}
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.durationDays && <span className="admin-field-error-msg">{fieldErrors.durationDays}</span>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Bán kính quét (km)</label>
                    <input
                      type="number"
                      name="maxSearchRadius"
                      className={`admin-form-input ${fieldErrors.maxSearchRadius ? "admin-input-error-state" : ""}`}
                      value={formData.maxSearchRadius}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.maxSearchRadius && <span className="admin-field-error-msg">{fieldErrors.maxSearchRadius}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Nhân viên tối đa</label>
                    <input
                      type="number"
                      name="maxEmployees"
                      className={`admin-form-input ${fieldErrors.maxEmployees ? "admin-input-error-state" : ""}`}
                      value={formData.maxEmployees}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.maxEmployees && <span className="admin-field-error-msg">{fieldErrors.maxEmployees}</span>}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">QR chấm công tối đa</label>
                  <input
                    type="number"
                    name="maxActiveQrs"
                    className={`admin-form-input ${fieldErrors.maxActiveQrs ? "admin-input-error-state" : ""}`}
                    value={formData.maxActiveQrs}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                  />
                  {fieldErrors.maxActiveQrs && <span className="admin-field-error-msg">{fieldErrors.maxActiveQrs}</span>}
                </div>

                <div style={{
                  display: "flex",
                  gap: 20,
                  marginTop: 8,
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0"
                }}>
                  <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0, fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      name="hasPriorityDisplay"
                      checked={formData.hasPriorityDisplay}
                      onChange={handleInputChange}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span>Hiển thị ưu tiên</span>
                  </label>

                  <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0, fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      name="hasHrManagement"
                      checked={formData.hasHrManagement}
                      onChange={handleInputChange}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span>Kích hoạt HRM</span>
                  </label>
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

      {/* Edit Subscription Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
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
                  <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16 }}>Chỉnh sửa gói dịch vụ</h3>
                  <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "2px 0 0" }}>Cập nhật cấu hình gói dịch vụ đã chọn</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} noValidate>
              <div className="admin-modal-body" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Section 1: Thông tin cơ bản */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "0 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Thông tin cơ bản
                </h4>

                <div className="admin-form-group">
                  <label className="admin-form-label">Tên gói dịch vụ (System Name)*</label>
                  <input
                    type="text"
                    name="name"
                    className={`admin-form-input ${fieldErrors.name ? "admin-input-error-state" : ""}`}
                    placeholder="Ví dụ: PerShift, Recruit, HRM Basic, Enterprise"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                  />
                  {fieldErrors.name && <span className="admin-field-error-msg">{fieldErrors.name}</span>}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả gói</label>
                  <textarea
                    name="description"
                    className="admin-form-input"
                    placeholder="Mô tả quyền lợi nổi bật của gói..."
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ height: 60, borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px", resize: "none" }}
                  />
                </div>

                {/* Section 2: Chi phí & Chu kỳ */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "10px 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Chi phí & Chu kỳ
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá bán (VNĐ)*</label>
                    <input
                      type="number"
                      name="price"
                      className={`admin-form-input ${fieldErrors.price ? "admin-input-error-state" : ""}`}
                      value={formData.price}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.price && <span className="admin-field-error-msg">{fieldErrors.price}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Chi phí biến đổi (VNĐ)</label>
                    <input
                      type="number"
                      name="variableCost"
                      className={`admin-form-input ${fieldErrors.variableCost ? "admin-input-error-state" : ""}`}
                      value={formData.variableCost}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.variableCost && <span className="admin-field-error-msg">{fieldErrors.variableCost}</span>}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Loại chu kỳ*</label>
                  <select
                    name="billingType"
                    className="admin-form-input"
                    value={formData.billingType}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px", background: "#fff" }}
                  >
                    <option value="PerShift">Đăng lẻ theo ca (PerShift)</option>
                    <option value="Monthly">Thuê bao tháng (Monthly)</option>
                  </select>
                </div>

                {/* Section 3: Giới hạn & Tính năng */}
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--admin-primary)", margin: "10px 0 4px 0", borderBottom: "1px dashed var(--admin-border-light)", paddingBottom: "6px" }}>
                  Giới hạn & Quyền lợi
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hạn mức tin đăng*</label>
                    <input
                      type="number"
                      name="jobPostLimit"
                      className={`admin-form-input ${fieldErrors.jobPostLimit ? "admin-input-error-state" : ""}`}
                      value={formData.jobPostLimit}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.jobPostLimit && <span className="admin-field-error-msg">{fieldErrors.jobPostLimit}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hiệu lực (ngày)*</label>
                    <input
                      type="number"
                      name="durationDays"
                      className={`admin-form-input ${fieldErrors.durationDays ? "admin-input-error-state" : ""}`}
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.durationDays && <span className="admin-field-error-msg">{fieldErrors.durationDays}</span>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Bán kính quét (km)</label>
                    <input
                      type="number"
                      name="maxSearchRadius"
                      className={`admin-form-input ${fieldErrors.maxSearchRadius ? "admin-input-error-state" : ""}`}
                      value={formData.maxSearchRadius}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.maxSearchRadius && <span className="admin-field-error-msg">{fieldErrors.maxSearchRadius}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Nhân viên tối đa</label>
                    <input
                      type="number"
                      name="maxEmployees"
                      className={`admin-form-input ${fieldErrors.maxEmployees ? "admin-input-error-state" : ""}`}
                      value={formData.maxEmployees}
                      onChange={handleInputChange}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                    />
                    {fieldErrors.maxEmployees && <span className="admin-field-error-msg">{fieldErrors.maxEmployees}</span>}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">QR chấm công tối đa</label>
                  <input
                    type="number"
                    name="maxActiveQrs"
                    className={`admin-form-input ${fieldErrors.maxActiveQrs ? "admin-input-error-state" : ""}`}
                    value={formData.maxActiveQrs}
                    onChange={handleInputChange}
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: "13.5px" }}
                  />
                  {fieldErrors.maxActiveQrs && <span className="admin-field-error-msg">{fieldErrors.maxActiveQrs}</span>}
                </div>

                <div style={{
                  display: "flex",
                  gap: 20,
                  marginTop: 8,
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0"
                }}>
                  <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0, fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      name="hasPriorityDisplay"
                      checked={formData.hasPriorityDisplay}
                      onChange={handleInputChange}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span>Hiển thị ưu tiên</span>
                  </label>

                  <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0, fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      name="hasHrManagement"
                      checked={formData.hasHrManagement}
                      onChange={handleInputChange}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span>Kích hoạt HRM</span>
                  </label>
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
      {deleteSubId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteSubId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <h3 className="admin-modal-title" style={{ color: "var(--admin-danger)", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} />
                Xác nhận xóa gói dịch vụ
              </h3>
              <button className="admin-modal-close" onClick={() => setDeleteSubId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ paddingTop: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--admin-text-secondary)", lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa gói dịch vụ này? Toàn bộ thông tin gói sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
              </p>
            </div>
            <div className="admin-modal-footer" style={{ borderTop: "none", paddingTop: 16 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => setDeleteSubId(null)}>Hủy</button>
              <button 
                className="admin-btn admin-btn-danger" 
                onClick={() => {
                  handleDeletePlan(deleteSubId);
                  setDeleteSubId(null);
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
