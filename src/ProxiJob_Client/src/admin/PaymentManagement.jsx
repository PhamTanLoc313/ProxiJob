import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, Filter, Eye, CreditCard, Calendar } from "lucide-react";
import { getAdminSession, formatCurrency, formatDateTime } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";
import { useToast } from "./ToastContext";

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
                        {order.status === "Pending" && (
                          <>
                            <button
                              className="admin-btn-icon"
                              style={{ color: "var(--admin-success)", borderColor: "rgba(16,185,129,0.3)" }}
                              title="Xác nhận"
                              onClick={() => openModal(order, "confirm")}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="admin-btn-icon"
                              style={{ color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" }}
                              title="Từ chối"
                              onClick={() => openModal(order, "reject")}
                            >
                              <X size={16} />
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

      {/* Modals */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {modalType === "confirm" && "Xác nhận Thanh toán"}
                {modalType === "reject" && "Từ chối Thanh toán"}
                {modalType === "view" && "Chi tiết Đơn hàng"}
              </h3>
              <button className="admin-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Premium Summary Card */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Chi tiết giao dịch
                  </span>
                  {renderBadge(selectedOrder.status)}
                </div>
                
                <div>
                  <h4 style={{ fontSize: "17px", fontWeight: 700, color: "var(--admin-text)", margin: 0 }}>
                    {selectedOrder.planName}
                  </h4>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--admin-primary)", marginTop: "4px" }}>
                    {formatCurrency(selectedOrder.amount)}
                  </div>
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                padding: "4px 4px"
              }}>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Mã đơn hàng</span>
                  <span className="admin-info-item-value" style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600, color: "var(--admin-text-secondary)" }}>
                    {selectedOrder.orderCode}
                  </span>
                </div>
                
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Thời gian tạo</span>
                  <span className="admin-info-item-value" style={{ fontSize: "13px", color: "var(--admin-text-secondary)" }}>
                    {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>

                <div className="admin-info-item" style={{ gridColumn: "span 2" }}>
                  <span className="admin-info-item-label">Khách hàng</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className="admin-info-item-value" style={{ fontSize: "14px", fontWeight: 600 }}>
                      {selectedOrder.userFullName}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                      {selectedOrder.userEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Note Section */}
              {modalType !== "view" ? (
                <form id="actionForm" onSubmit={modalType === "confirm" ? handleConfirm : handleReject} style={{ margin: 0 }}>
                  <div className="admin-form-group" style={{ marginBottom: 0, width: "100%" }}>
                    <label className="admin-form-label" style={{ fontSize: "13px", fontWeight: 600, color: "var(--admin-text-secondary)", marginBottom: "8px" }}>
                      Ghi chú của Admin (Tùy chọn)
                    </label>
                    <textarea
                      className="admin-form-input"
                      placeholder="Nhập ghi chú hoặc lý do phê duyệt/từ chối giao dịch này..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "90px",
                        resize: "none",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        background: "#fff",
                        fontSize: "13.5px",
                        lineHeight: "1.5",
                        outline: "none",
                        boxSizing: "border-box",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease"
                      }}
                    />
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* If order is Paid, show processing metadata */}
                  {selectedOrder.status === "Paid" && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      padding: "12px 16px",
                      background: "rgba(16,185,129,0.04)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      borderRadius: "12px"
                    }}>
                      <div className="admin-info-item">
                        <span className="admin-info-item-label" style={{ color: "var(--admin-success)" }}>Thời gian duyệt</span>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{formatDateTime(selectedOrder.paidAt)}</span>
                      </div>
                      <div className="admin-info-item">
                        <span className="admin-info-item-label" style={{ color: "var(--admin-success)" }}>Người phê duyệt</span>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{selectedOrder.confirmedBy || "Hệ thống"}</span>
                      </div>
                    </div>
                  )}

                  {/* If order is Expired, show expiry metadata */}
                  {selectedOrder.status === "Expired" && (
                    <div style={{
                      padding: "12px 16px",
                      background: "rgba(148,163,184,0.05)",
                      border: "1px solid rgba(148,163,184,0.15)",
                      borderRadius: "12px",
                      fontSize: "13px",
                      color: "var(--admin-text-secondary)",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span style={{ fontWeight: 600 }}>Hạn thanh toán:</span>
                      <span>{formatDateTime(selectedOrder.expiresAt)}</span>
                    </div>
                  )}

                  {/* Admin Note if exists */}
                  {selectedOrder.adminNote && (
                    <div style={{
                      padding: "16px",
                      background: "rgba(255,107,0,0.04)",
                      border: "1px dashed rgba(255,107,0,0.2)",
                      borderRadius: "12px"
                    }}>
                      <span className="admin-info-item-label" style={{ color: "var(--admin-primary)", display: "block", marginBottom: "6px" }}>
                        Ghi chú từ Admin
                      </span>
                      <span style={{ fontSize: "13.5px", color: "var(--admin-text-secondary)", lineHeight: "1.5" }}>
                        {selectedOrder.adminNote}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={closeModal}>
                Đóng
              </button>
              {modalType === "view" && selectedOrder.status === "Pending" && (
                <>
                  <button 
                    className="admin-btn admin-btn-danger" 
                    onClick={() => setModalType("reject")}
                    style={{ marginLeft: 8 }}
                  >
                    Từ chối đơn
                  </button>
                  <button 
                    className="admin-btn admin-btn-success" 
                    onClick={() => setModalType("confirm")}
                    style={{ marginLeft: 8 }}
                  >
                    Phê duyệt đơn
                  </button>
                </>
              )}
              {modalType === "confirm" && (
                <button type="submit" form="actionForm" className="admin-btn admin-btn-success">
                  Xác nhận Thanh toán
                </button>
              )}
              {modalType === "reject" && (
                <button type="submit" form="actionForm" className="admin-btn admin-btn-danger">
                  Từ chối Thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
