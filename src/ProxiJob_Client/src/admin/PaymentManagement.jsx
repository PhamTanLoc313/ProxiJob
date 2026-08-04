import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, Filter, Eye, CreditCard, Calendar } from "lucide-react";
import { getAdminSession, formatCurrency, formatDateTime } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";
import { useToast } from "./ToastContext";
import AdminModal from "./AdminModal";

export default function PaymentManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'confirm' | 'reject' | 'view'
  const [adminNote, setAdminNote] = useState("");

  const session = getAdminSession();
  const token = session?.token;

  // Query payments
  const { data: orders = [], isLoading, error: queryError } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch(`${IDENTITY_API_URL}/admin/payments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Tài khoản không có quyền truy cập xem thông tin thanh toán.");
        }
        throw new Error("Lỗi tải danh sách thanh toán từ server: " + res.status);
      }
      return res.json();
    },
    enabled: !!token
  });

  const filteredOrders = orders.filter((o) => {
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    const matchSearch =
      (o.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Hết hạn phiên đăng nhập.");
      return;
    }
    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/payments/${selectedOrder.orderId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Lỗi xác nhận đơn: " + (data.message || res.statusText));
        return;
      }
      toast.success("Xác nhận thanh toán thành công!");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Invalidate other dependent queries as subscription changes roles
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Hết hạn phiên đăng nhập.");
      return;
    }
    try {
      const res = await fetch(`${IDENTITY_API_URL}/admin/payments/${selectedOrder.orderId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Lỗi từ chối đơn: " + (data.message || res.statusText));
        return;
      }
      toast.warning("Đã từ chối đơn thanh toán.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["payments"] });
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

  const openModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
    setAdminNote(order.adminNote || "");
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setAdminNote("");
  };

  const renderBadge = (status) => {
    switch (status) {
      case "Pending": return <span className="admin-badge admin-badge-pending"><div className="admin-badge-dot" />Chờ duyệt</span>;
      case "Paid": return <span className="admin-badge admin-badge-paid">Đã thanh toán</span>;
      case "Cancelled": return <span className="admin-badge admin-badge-cancelled">Đã huỷ</span>;
      case "Expired": return <span className="admin-badge admin-badge-expired">Hết hạn</span>;
      default: return <span className="admin-badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
      <div className="admin-table-container">
        <div className="admin-table-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, padding: "20px 24px" }}>
          {/* Left Side: Search & Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", flex: 1, justifyContent: "space-between" }}>
            <div className="admin-search" style={{ maxWidth: 320, width: "100%" }}>
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm mã đơn, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Tabs Switched Layout */}
            <div style={{ display: "flex", background: "var(--admin-border)", padding: 3, borderRadius: 10, gap: 2 }}>
              {["All", "Pending", "Paid", "Cancelled", "Expired"].map((st) => (
                <button
                  key={st}
                  className={`admin-dashboard-period-btn ${filterStatus === st ? "active" : ""}`}
                  style={{ padding: "6px 16px", fontSize: 13, borderRadius: 8, fontWeight: 700 }}
                  onClick={() => setFilterStatus(st)}
                >
                  {st === "All" ? "Tất cả" : st === "Pending" ? "Chờ duyệt" : st === "Paid" ? "Đã duyệt" : st === "Cancelled" ? "Đã huỷ" : "Hết hạn"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", position: "relative" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người dùng</th>
                <th>Gói dịch vụ</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-empty">
                      <CreditCard className="admin-empty-icon" />
                      <div className="admin-empty-text">Không tìm thấy đơn thanh toán nào</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td style={{ fontWeight: 600, color: "var(--admin-primary-hover)" }}>
                      {order.orderCode}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.userFullName}</div>
                      <div style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{order.userEmail}</div>
                    </td>
                    <td>{order.planName}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.amount)}</td>
                    <td>{renderBadge(order.status)}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          className="admin-btn-icon"
                          title="Xem chi tiết"
                          onClick={() => openModal(order, "view")}
                        >
                          <Eye size={16} />
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

      {/* Portal Modal */}
      <AdminModal
        isOpen={!!selectedOrder}
        onClose={closeModal}
        title={
          modalType === "confirm"
            ? "Xác nhận Thanh toán"
            : modalType === "reject"
            ? "Từ chối Thanh toán"
            : "Chi tiết Đơn hàng"
        }
        subtitle={selectedOrder ? `Mã giao dịch: #${selectedOrder.orderCode}` : ""}
        icon={CreditCard}
        maxWidth={580}
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, width: "100%" }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={closeModal}
              style={{
                padding: "10px 22px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "13.5px"
              }}
            >
              Đóng cửa sổ
            </button>
          </div>
        }
      >
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Hero Transaction Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                border: "1px solid rgba(249, 115, 22, 0.25)",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.12)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "#ea580c",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "rgba(249, 115, 22, 0.12)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    border: "1px solid rgba(249, 115, 22, 0.2)"
                  }}
                >
                  Chi tiết giao dịch
                </span>
                {renderBadge(selectedOrder.status)}
              </div>

              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  Gói dịch vụ đăng ký
                </div>
                <h4 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0, tracking: "-0.02em" }}>
                  {selectedOrder.planName}
                </h4>
                <div style={{ fontSize: "32px", fontWeight: 900, color: "#ea580c", marginTop: "8px", letterSpacing: "-0.03em" }}>
                  {formatCurrency(selectedOrder.amount)}
                </div>
              </div>
            </div>

            {/* Information Grid Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Card 1: Order Code */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mã đơn hàng
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#0f172a",
                    background: "#ffffff",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    wordBreak: "break-all"
                  }}
                >
                  {selectedOrder.orderCode}
                </span>
              </div>

              {/* Card 2: Created Date */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Thời gian khởi tạo
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  {formatDateTime(selectedOrder.createdAt)}
                </span>
              </div>

              {/* Card 3: User Customer Details (Full Width) */}
              <div
                style={{
                  gridColumn: "span 2",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Khách hàng / Doanh nghiệp
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "12px 14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "16px",
                      flexShrink: 0
                    }}
                  >
                    {(selectedOrder.userFullName || "K").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                      {selectedOrder.userFullName}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600 }}>
                      {selectedOrder.userEmail}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Note Form or Approval Metadata */}
            {modalType !== "view" ? (
              <form id="actionForm" onSubmit={modalType === "confirm" ? handleConfirm : handleReject} style={{ margin: 0 }}>
                <div className="admin-form-group" style={{ marginBottom: 0, width: "100%" }}>
                  <label
                    className="admin-form-label"
                    style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}
                  >
                    Ghi chú của Admin (Tùy chọn)
                  </label>
                  <textarea
                    className="admin-form-input"
                    placeholder="Nhập ghi chú hoặc lý do phê duyệt/từ chối giao dịch này..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "95px",
                      resize: "none",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      background: "#ffffff",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedOrder.status === "Paid" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      padding: "16px",
                      background: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "16px"
                    }}
                  >
                    <div className="admin-info-item">
                      <span className="admin-info-item-label" style={{ color: "#059669", fontWeight: 800 }}>
                        Thời gian duyệt
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>{formatDateTime(selectedOrder.paidAt)}</span>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-item-label" style={{ color: "#059669", fontWeight: 800 }}>
                        Người phê duyệt
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>{selectedOrder.confirmedBy || "Hệ thống"}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.adminNote && (
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(249, 115, 22, 0.05)",
                      border: "1px dashed rgba(249, 115, 22, 0.3)",
                      borderRadius: "16px"
                    }}
                  >
                    <span
                      className="admin-info-item-label"
                      style={{ color: "#ea580c", display: "block", marginBottom: "6px", fontWeight: 800 }}
                    >
                      Ghi chú từ Admin
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
