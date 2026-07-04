import { useState, useEffect } from "react";
import { Check, X, Search, Filter, Eye, CreditCard } from "lucide-react";
import { getAdminSession, formatCurrency, formatDateTime } from "./adminData";

export default function PaymentManagement() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'confirm' | 'reject' | 'view'
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const session = getAdminSession();
      if (!session?.token) {
        setError("Chưa đăng nhập admin hoặc phiên làm việc hết hạn.");
        return;
      }
      const res = await fetch("http://localhost:5231/api/admin/payments", {
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Tài khoản không có quyền truy cập xem thông tin thanh toán.");
        } else {
          setError("Lỗi tải danh sách thanh toán từ server: " + res.status);
        }
        return;
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      setError("Lỗi kết nối tới máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    const matchSearch =
      (o.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleConfirm = async (e) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session?.token) {
      alert("Hết hạn phiên đăng nhập.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5231/api/admin/payments/${selectedOrder.orderId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Lỗi xác nhận đơn: " + (data.message || res.statusText));
        return;
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session?.token) {
      alert("Hết hạn phiên đăng nhập.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5231/api/admin/payments/${selectedOrder.orderId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Lỗi từ chối đơn: " + (data.message || res.statusText));
        return;
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <h2 className="admin-table-title">Quản lý Đơn Thanh Toán</h2>
          <div className="admin-table-filters">
            <div className="admin-search">
              <Search className="admin-search-icon" />
              <input
                type="text"
                placeholder="Tìm mã đơn, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {["All", "Pending", "Paid", "Cancelled", "Expired"].map((st) => (
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

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--admin-danger)", borderRadius: 8, margin: "10px 16px", border: "1px solid rgba(239,68,68,0.2)", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <span style={{ padding: "8px 16px", background: "var(--admin-card-bg)", borderRadius: 8, border: "1px solid var(--admin-border)", fontSize: 13, fontWeight: 500 }}>Đang tải...</span>
            </div>
          )}
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

            <div className="admin-modal-body">
              <div className="admin-info-grid" style={{ marginBottom: 20 }}>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Mã đơn</span>
                  <span className="admin-info-item-value">{selectedOrder.orderCode}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Số tiền</span>
                  <span className="admin-info-item-value" style={{ color: "var(--admin-primary-hover)", fontWeight: 700 }}>
                    {formatCurrency(selectedOrder.amount)}
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Người dùng</span>
                  <span className="admin-info-item-value">{selectedOrder.userFullName}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Gói dịch vụ</span>
                  <span className="admin-info-item-value">{selectedOrder.planName}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Ngày tạo</span>
                  <span className="admin-info-item-value">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-item-label">Trạng thái</span>
                  <span className="admin-info-item-value">{renderBadge(selectedOrder.status)}</span>
                </div>
              </div>

              {modalType !== "view" ? (
                <form id="actionForm" onSubmit={modalType === "confirm" ? handleConfirm : handleReject}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-form-label">
                      Ghi chú của Admin (Tùy chọn)
                    </label>
                    <textarea
                      className="admin-form-input"
                      placeholder="Nhập ghi chú hoặc lý do..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                </form>
              ) : (
                selectedOrder.adminNote && (
                  <div className="admin-info-item" style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <span className="admin-info-item-label">Ghi chú của Admin</span>
                    <span className="admin-info-item-value">{selectedOrder.adminNote}</span>
                  </div>
                )
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={closeModal}>
                Đóng
              </button>
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
