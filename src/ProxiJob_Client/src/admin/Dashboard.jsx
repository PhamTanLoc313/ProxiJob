import { useState, useEffect } from "react";
import { Users, Briefcase, CreditCard, DollarSign } from "lucide-react";
import { getStats, mockActivities, formatCurrency, timeAgo } from "./adminData";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchRealStats = async () => {
      const mockStats = getStats();
      try {
        const rawSession = localStorage.getItem("proxijob_admin_session");
        const session = rawSession ? JSON.parse(rawSession) : null;
        if (!session?.token) {
          setStats(mockStats);
          return;
        }
        const res = await fetch("http://localhost:5231/api/admin/payments", {
          headers: {
            "Authorization": `Bearer ${session.token}`
          }
        });
        if (res.ok) {
          const payments = await res.json();
          const pendingCount = payments.filter(p => p.status === "Pending").length;
          const revenue = payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
          
          setStats({
            ...mockStats,
            pendingPayments: pendingCount,
            totalRevenue: revenue
          });
          return;
        }
      } catch (err) {
        console.log("Failed to fetch real stats:", err);
      }
      setStats(mockStats);
    };
    fetchRealStats();
  }, []);

  if (!stats) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-card-label">Tổng Users</span>
            <div className="admin-stat-card-icon" style={{ background: "var(--admin-info-bg)", color: "var(--admin-info)" }}>
              <Users size={20} />
            </div>
          </div>
          <div className="admin-stat-card-value">{stats.totalUsers}</div>
          <div className="admin-stat-card-change" style={{ color: "var(--admin-success)" }}>
            +12% so với tháng trước
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-card-label">Việc làm đang mở</span>
            <div className="admin-stat-card-icon" style={{ background: "var(--admin-success-bg)", color: "var(--admin-success)" }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div className="admin-stat-card-value">{stats.publishedJobs}</div>
          <div className="admin-stat-card-change" style={{ color: "var(--admin-text-muted)" }}>
            /{stats.totalJobs} tổng số
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-card-label">Đơn chờ duyệt</span>
            <div className="admin-stat-card-icon" style={{ background: "var(--admin-warning-bg)", color: "var(--admin-warning)" }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className="admin-stat-card-value">{stats.pendingPayments}</div>
          <div className="admin-stat-card-change" style={{ color: "var(--admin-warning)" }}>
            Cần xử lý ngay
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-card-label">Tổng doanh thu</span>
            <div className="admin-stat-card-icon" style={{ background: "var(--admin-primary-glow)", color: "var(--admin-primary)" }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="admin-stat-card-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="admin-stat-card-change" style={{ color: "var(--admin-success)" }}>
            +8% so với tháng trước
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        {/* Chart Placeholder */}
        <div className="admin-chart-container">
          <h2 className="admin-chart-title">Doanh thu 7 ngày qua</h2>
          <div className="admin-chart-bars">
            {[30, 45, 25, 60, 40, 75, 55].map((val, idx) => (
              <div key={idx} className="admin-chart-bar" style={{ height: `${val}%` }}>
                <span className="admin-chart-bar-value">{formatCurrency(val * 10000)}</span>
                <span className="admin-chart-bar-label">T{idx + 2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="admin-card" style={{ padding: "0" }}>
          <div className="admin-card-header" style={{ padding: "22px 22px 0", marginBottom: "0" }}>
            <h2 className="admin-chart-title">Hoạt động gần đây</h2>
          </div>
          <div className="admin-activity-list" style={{ padding: "0 22px 22px" }}>
            {mockActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="admin-activity-item">
                <div className={`admin-activity-dot ${activity.type}`} />
                <div style={{ flex: 1 }}>
                  <div className="admin-activity-text">{activity.message}</div>
                  <div className="admin-activity-time">{timeAgo(activity.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
