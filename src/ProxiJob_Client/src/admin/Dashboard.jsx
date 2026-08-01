import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, CreditCard, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { getAdminSession, formatCurrency } from "./adminData";
import { IDENTITY_API_URL, JOB_API_URL } from "../apiConfig";
import avatarNamImg from "../assets/AvatarNam.png";
import avatarNuImg from "../assets/AvatarNu.png";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("7days");
  const [hoveredData, setHoveredData] = useState(null);
  const chartRef = useRef(null);

  const session = getAdminSession();
  const token = session?.token;

  // 1. Fetch Users
  const { data: rawUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch(`${IDENTITY_API_URL}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!token
  });

  // 2. Fetch Jobs
  const { data: rawJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch(`${JOB_API_URL}/admin/jobs`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    }
  });

  // 3. Fetch Payments
  const { data: rawPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch(`${IDENTITY_API_URL}/admin/payments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!token
  });

  const loading = loadingUsers || loadingJobs || loadingPayments;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
        <div className="admin-stats-grid">
          <div className="admin-stat-card admin-skeleton admin-skeleton-card"></div>
          <div className="admin-stat-card admin-skeleton admin-skeleton-card"></div>
          <div className="admin-stat-card admin-skeleton admin-skeleton-card"></div>
          <div className="admin-stat-card admin-skeleton admin-skeleton-card"></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
          <div className="admin-chart-container admin-skeleton" style={{ height: "300px", borderRadius: "16px" }}></div>
          <div className="admin-chart-container admin-skeleton" style={{ height: "300px", borderRadius: "16px" }}></div>
        </div>
      </div>
    );
  }

  // Reactive derived stats
  const totalUsers = rawUsers.length;
  const totalStudents = rawUsers.filter(u => u.role === "Student").length;
  const totalBusinesses = rawUsers.filter(u => u.role === "Business").length;
  const totalJobs = rawJobs.length;
  const publishedJobs = rawJobs.filter(j => j.status === "Published").length;
  const pendingPayments = rawPayments.filter(p => p.status === "Pending").length;
  const totalRevenue = rawPayments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);

  const stats = {
    totalUsers,
    totalStudents,
    totalBusinesses,
    totalJobs,
    publishedJobs,
    pendingPayments,
    totalRevenue
  };

  const planBreakdown = rawPayments
    .filter(p => p.status === "Paid")
    .reduce((acc, p) => {
      const planName = p.planName || "Khác";
      acc[planName] = (acc[planName] || 0) + p.amount;
      return acc;
    }, {});

  // 1. Dynamic Line Chart Calculations (aggregates from rawPayments)
  const getLineChartData = (payments, range) => {
    const paidPayments = payments.filter(p => p.status === "Paid");

    if (range === "7days") {
      const result = [];
      const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

        const total = paidPayments
          .filter(p => p.createdAt && p.createdAt.startsWith(dateStr))
          .reduce((sum, p) => sum + p.amount, 0);

        result.push({ date: dayLabel, value: total });
      }
      return result;
    }

    if (range === "30days") {
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);

        const total = paidPayments
          .filter(p => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt);
            return pDate >= start && pDate <= end;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        result.push({ date: `Tuần ${4 - i}`, value: total });
      }
      return result;
    }

    if (range === "12months") {
      const result = [];
      const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = monthNames[d.getMonth()];
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const total = paidPayments
          .filter(p => p.createdAt && p.createdAt.startsWith(yearMonth))
          .reduce((sum, p) => sum + p.amount, 0);

        result.push({ date: monthLabel, value: total });
      }
      return result;
    }

    return [];
  };

  const chartData = getLineChartData(rawPayments, timeRange);

  // SVG Chart sizing
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 20;

  // Calculate scales
  const maxValue = Math.max(...chartData.map(d => d.value)) * 1.15 || 10000;
  const points = chartData.map((d, index) => {
    const x = paddingX + (index / (chartData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.value / maxValue) * (height - 2 * paddingY);
    return { x, y, data: d };
  });

  // Calculate Cubic Bezier curved path
  const getCurvePath = (pts) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = getCurvePath(points);
  const areaPath = pts => {
    if (pts.length === 0) return "";
    const startX = pts[0].x;
    const endX = pts[pts.length - 1].x;
    const baseSignY = height - paddingY;
    return `${getCurvePath(pts)} L ${endX} ${baseSignY} L ${startX} ${baseSignY} Z`;
  };

  const handleMouseMove = (e) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    const svgWidth = rect.width;
    const scaleX = width / svgWidth;
    const svgMouseX = mouseX * scaleX;

    let nearest = points[0];
    let minDist = Math.abs(points[0].x - svgMouseX);

    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - svgMouseX);
      if (dist < minDist) {
        minDist = dist;
        nearest = points[i];
      }
    }

    setHoveredData({
      x: nearest.x * (rect.width / width),
      y: nearest.y * (rect.height / height),
      label: nearest.data.date,
      value: nearest.data.value
    });
  };

  // 2. Sparkline columns calculations based on last 6 paid transactions
  const paidAmounts = rawPayments
    .filter(p => p.status === "Paid")
    .map(p => p.amount);
  
  while (paidAmounts.length < 6) {
    paidAmounts.unshift(0);
  }
  const last6Amounts = paidAmounts.slice(-6);
  const maxAmount = Math.max(...last6Amounts) || 1;
  const sparkBars = last6Amounts.map(val => (val / maxAmount) * 20 + 5);

  // 3. User Distribution Calculations
  const totalUsersDist = stats.totalUsers || 1;
  const studentCount = stats.totalStudents || 0;
  const businessCount = stats.totalBusinesses || 0;
  const adminCount = Math.max(0, totalUsersDist - studentCount - businessCount);

  const studentPercent = Math.round((studentCount / totalUsersDist) * 100);
  const businessPercent = Math.round((businessCount / totalUsersDist) * 100);
  const adminPercent = Math.max(0, 100 - studentPercent - businessPercent);

  // 4. Job Categories bar data grouped from rawJobs
  const getCategoryData = (jobs) => {
    const colors = ["var(--admin-primary)", "var(--admin-success)", "var(--admin-info)", "var(--admin-warning)"];
    if (!jobs || jobs.length === 0) {
      return [
        { name: "PHA CHẾ", count: 0, color: colors[0] },
        { name: "PHỤC VỤ", count: 0, color: colors[1] },
        { name: "THU NGÂN", count: 0, color: colors[2] },
        { name: "BÁN HÀNG", count: 0, color: colors[3] }
      ];
    }

    const counts = {};
    jobs.forEach(j => {
      const name = (j.categoryName || "Khác").toUpperCase();
      counts[name] = (counts[name] || 0) + 1;
    });
    
    const sorted = Object.keys(counts)
      .map((name, idx) => ({
        name,
        count: counts[name],
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.count - a.count);

    while (sorted.length < 4) {
      sorted.push({ name: "CHƯA CÓ", count: 0, color: colors[sorted.length % colors.length] });
    }

    return sorted.slice(0, 4);
  };

  const categoryData = getCategoryData(rawJobs);
  const maxCategoryCount = Math.max(...categoryData.map(c => c.count)) || 15;

  // 5. Payment conversion statistics aggregated from rawPayments
  const getPaymentPerformance = (payments) => {
    if (!payments || payments.length === 0) {
      return { success: 100, pending: 0, failed: 0 };
    }
    const total = payments.length;
    const success = payments.filter(p => p.status === "Paid").length;
    const pending = payments.filter(p => p.status === "Pending").length;
    const failed = total - success - pending;

    return {
      success: Math.round((success / total) * 100),
      pending: Math.round((pending / total) * 100),
      failed: Math.round((failed / total) * 100)
    };
  };

  const performance = getPaymentPerformance(rawPayments);

  // 6. Recent activities log assembled dynamically from real signups, jobs, and payments
  const getRecentActivities = (users, jobs, payments) => {
    const list = [];

    // User registrations
    if (users) {
      users.forEach(u => {
        list.push({
          id: `u-${u.id}`,
          userName: u.fullName || "Người dùng",
          userAvatar: u.avatarUrl || u.avatar || (u.role === "Student" ? avatarNuImg : avatarNamImg),
          message: `đăng ký tài khoản ${u.role} mới`,
          date: u.createdAt ? new Date(u.createdAt) : new Date(),
          dotColor: "var(--admin-info)"
        });
      });
    }

    // Job creations
    if (jobs) {
      jobs.forEach(j => {
        list.push({
          id: `j-${j.id}`,
          userName: `DN tuyển dụng`,
          userAvatar: j.businessLogoUrl || avatarNamImg,
          message: `đăng tuyển việc làm '${j.title}'`,
          date: j.createdAt ? new Date(j.createdAt) : new Date(),
          dotColor: "var(--admin-success)"
        });
      });
    }

    // Payments
    if (payments) {
      payments.forEach(p => {
        list.push({
          id: `p-${p.id}`,
          userName: p.fullName || `Đối tác`,
          userAvatar: p.avatarUrl || avatarNamImg,
          message: `tạo đơn thanh toán gói ${p.planName || "VIP"}`,
          date: p.createdAt ? new Date(p.createdAt) : new Date(),
          dotColor: "var(--admin-warning)"
        });
      });
    }

    list.sort((a, b) => b.date - a.date);

    return list.slice(0, 3).map(item => {
      const diffTime = Math.abs(new Date() - item.date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const label = diffDays <= 0 ? "Hôm nay" : `${diffDays} ngày trước`;
      return {
        ...item,
        time: label
      };
    });
  };

  const computedActivities = getRecentActivities(rawUsers, rawJobs, rawPayments);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-page-enter">
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {/* Card 1: Users */}
        <div className="admin-stat-card stat-card-orange card-hover-lift">
          <div className="admin-card-inner">
            <div>
              <span className="admin-stat-card-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 800, color: "#c2410c" }}>Tổng Người dùng</span>
              <div className="admin-stat-card-value" style={{ margin: "6px 0", fontSize: 30, color: "#9a3412" }}>{stats.totalUsers}</div>
              <div className="admin-stat-card-change" style={{ color: "#ea580c", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                <TrendingUp size={14} />
                <span>SV: {stats.totalStudents} | DN: {stats.totalBusinesses}</span>
              </div>
            </div>
            {/* Circular Progress Ring */}
            <div className="admin-card-progress-container bg-white/60 p-2 rounded-2xl border border-orange-200/50 shadow-xs">
              <Users size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Jobs */}
        <div className="admin-stat-card stat-card-emerald card-hover-lift">
          <div className="admin-card-inner" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div>
                <span className="admin-stat-card-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 800, color: "#047857" }}>Việc làm đang mở</span>
                <div className="admin-stat-card-value" style={{ margin: "6px 0", fontSize: 30, color: "#065f46" }}>{stats.publishedJobs}</div>
              </div>
              <div style={{ background: "rgba(16, 185, 129, 0.2)", color: "#047857", padding: 10, borderRadius: 14, height: "fit-content", display: "flex" }}>
                <Briefcase size={22} />
              </div>
            </div>
            <div style={{ width: "100%", marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#047857", fontWeight: 700 }}>
                <span>Tiến trình tin đã duyệt</span>
                <span>{Math.round((stats.publishedJobs / (stats.totalJobs || 1)) * 100)}%</span>
              </div>
              <div className="admin-progress-bar-bg" style={{ background: "rgba(16, 185, 129, 0.15)", height: 6 }}>
                <div className="admin-progress-bar-fill" style={{ width: `${(stats.publishedJobs / (stats.totalJobs || 1)) * 100}%`, background: "linear-gradient(to right, #10b981, #059669)" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Payments */}
        <div className="admin-stat-card stat-card-purple card-hover-lift" style={stats.pendingPayments > 0 ? { borderColor: "#a855f7" } : {}}>
          <div className="admin-card-inner">
            <div>
              <span className="admin-stat-card-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 800, color: "#7e22ce" }}>Đơn chờ duyệt</span>
              <div className="admin-stat-card-value" style={{ margin: "6px 0", fontSize: 30, color: "#6b21a8" }}>{stats.pendingPayments}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="admin-pulse-dot" style={{ background: "#a855f7" }}></span>
                <span className="admin-stat-card-change" style={{ color: "#7e22ce", fontSize: 12, fontWeight: 700 }}>
                  {stats.pendingPayments > 0 ? "Cần phê duyệt ngay" : "Tất cả đã xử lý"}
                </span>
              </div>
            </div>
            <div style={{ background: "rgba(168, 85, 247, 0.2)", color: "#7e22ce", padding: 10, borderRadius: 14, display: "flex" }}>
              <CreditCard size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="admin-stat-card stat-card-blue card-hover-lift">
          <div className="admin-card-inner">
            <div>
              <span className="admin-stat-card-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 800, color: "#1d4ed8" }}>Tổng doanh thu</span>
              <div className="admin-stat-card-value" style={{ margin: "6px 0", fontSize: 26, color: "#1e40af" }}>{formatCurrency(stats.totalRevenue)}</div>
              <div className="admin-stat-card-change" style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                <DollarSign size={14} />
                <span>Doanh thu xác thực</span>
              </div>
            </div>
            {/* Sparkline column bars */}
            <svg width="70" height="30" style={{ overflow: "visible" }}>
              {sparkBars.map((h, idx) => {
                const w = 6;
                const spacing = 4;
                const x = idx * (w + spacing) + 10;
                const y = 30 - h;
                const isLast = idx === sparkBars.length - 1;
                return (
                  <rect 
                    key={idx} 
                    x={x} 
                    y={y} 
                    width={w} 
                    height={h} 
                    rx="2" 
                    fill={isLast ? "#2563eb" : "rgba(37, 99, 235, 0.2)"}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Primary Analytics Charts (Line Chart & Bar Chart) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Chart Card 1: Revenue Trends */}
        <div className="admin-chart-container" style={{ padding: 24, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 className="admin-chart-title" style={{ margin: 0, fontSize: 16 }}>Thống kê doanh thu dịch vụ</h2>
            </div>
            
            {/* Time range selector */}
            <div className="admin-dashboard-period-selector">
              {[
                { id: "7days", label: "7 ngày" },
                { id: "30days", label: "30 ngày" },
                { id: "12months", label: "12 tháng" }
              ].map((p) => (
                <button
                  key={p.id}
                  className={`admin-dashboard-period-btn ${timeRange === p.id ? "active" : ""}`}
                  onClick={() => setTimeRange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div 
            className="admin-chart-svg-container"
            ref={chartRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredData(null)}
          >
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (height - 2 * paddingY);
                return (
                  <line 
                    key={idx} 
                    x1={paddingX} 
                    y1={y} 
                    x2={width - paddingX} 
                    y2={y} 
                    stroke="var(--admin-border)" 
                    strokeWidth="1" 
                    strokeDasharray="4 6" 
                  />
                );
              })}

              {/* Area Under Curve */}
              <path d={areaPath(points)} fill="url(#area-grad)" />

              {/* Curve Line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="var(--admin-primary)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Data Points */}
              {points.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="var(--admin-card)" 
                  stroke="var(--admin-primary)" 
                  strokeWidth="2.5" 
                />
              ))}

              {/* X Axis Labels */}
              {points.map((p, idx) => (
                <text 
                  key={idx} 
                  x={p.x} 
                  y={height - 2} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fill="var(--admin-text-muted)" 
                  fontWeight="600"
                >
                  {p.data.date}
                </text>
              ))}

              {/* Vertical Guide Line */}
              {hoveredData && (
                <line 
                  x1={hoveredData.x * (width / chartRef.current?.getBoundingClientRect().width)}
                  y1={paddingY}
                  x2={hoveredData.x * (width / chartRef.current?.getBoundingClientRect().width)}
                  y2={height - paddingY}
                  stroke="var(--admin-primary-hover)"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />
              )}
            </svg>

            {/* Dynamic Tooltip */}
            {hoveredData && (
              <div 
                className="admin-chart-tooltip"
                style={{ 
                  left: hoveredData.x - 60, 
                  top: hoveredData.y - 75 
                }}
              >
                <span className="admin-chart-tooltip-title">{hoveredData.label}</span>
                <span className="admin-chart-tooltip-value">{formatCurrency(hoveredData.value)}</span>
              </div>
            )}
          </div>

          {/* Revenue breakdown by package type */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--admin-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 750, color: "var(--admin-text-secondary)", letterSpacing: 0.5 }}>PHÂN BỔ DOANH THU THEO GÓI</span>
              <span style={{ fontSize: 12, color: "var(--admin-text-muted)", fontWeight: 500 }}>{rawPayments.filter(p => p.status === "Paid").length} đơn thành công</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
              {[
                { name: "PerShift", label: "Đăng Lẻ 1 Ca", color: "var(--admin-info)" },
                { name: "Basic", label: "Gói Cơ Bản", color: "var(--admin-warning)" },
                { name: "Standard", label: "Gói Standard", color: "var(--admin-primary)" },
                { name: "Premium", label: "Gói Premium", color: "var(--admin-success)" }
              ].map(plan => {
                const amount = planBreakdown[plan.name] || 0;
                const percent = stats.totalRevenue > 0 ? Math.round((amount / stats.totalRevenue) * 100) : 0;
                return (
                  <div key={plan.name} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: plan.color }}></span>
                      <span style={{ fontSize: 11, fontWeight: 650, color: "var(--admin-text-secondary)" }}>{plan.label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 850, color: "#0f172a", marginTop: 2 }}>{formatCurrency(amount)}</div>
                    <div style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>Tỷ lệ: {percent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Card 2: Job Categories Bar Chart */}
        <div className="admin-chart-container" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="admin-chart-title" style={{ margin: 0, fontSize: 16 }}>Top danh mục</h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--admin-primary)",
                  background: "var(--admin-primary-glow)",
                  padding: "4px 10px",
                  borderRadius: 12
                }}
              >
                {rawJobs.length} tin tuyển dụng
              </span>
            </div>

            {/* Vertical Bar Chart SVG */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <svg viewBox="0 0 320 190" width="100%" height="200" style={{ overflow: "visible" }}>
                {categoryData.map((cat, idx) => {
                  const barWidth = 32;
                  const spacing = 45;
                  const x = 32 + idx * (barWidth + spacing);
                  const barHeight = (cat.count / maxCategoryCount) * 120;
                  const y = 150 - barHeight;
                  return (
                    <g key={idx}>
                      {/* Background track capsule */}
                      <rect x={x} y={20} width={barWidth} height={130} rx={16} fill="var(--admin-border)" opacity="0.3" />
                      {/* Capsule bar with rounded caps */}
                      <rect x={x} y={y} width={barWidth} height={barHeight} rx={16} fill={cat.color} style={{ transition: "height 0.5s ease" }} />
                      {/* Value text above bar */}
                      <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--admin-text)">
                        {cat.count}
                      </text>
                      {/* Category text label underneath */}
                      <text x={x + barWidth / 2} y={168} textAnchor="middle" fontSize="10" fill="var(--admin-text-secondary)" fontWeight="800">
                        {cat.name.split(" ")[0]}
                      </text>
                      <text x={x + barWidth / 2} y={182} textAnchor="middle" fontSize="10" fill="var(--admin-text-secondary)" fontWeight="800">
                        {cat.name.split(" ")[1] || ""}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Job Allocation breakdown section below bar chart */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--admin-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 750, color: "var(--admin-text-secondary)", letterSpacing: 0.5 }}>THỐNG KÊ CHI TIẾT THEO NGÀNH</span>
              <span style={{ fontSize: 12, color: "var(--admin-text-muted)", fontWeight: 500 }}>Tỷ lệ thị phần</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoryData.map((cat, idx) => {
                const percent = rawJobs.length > 0 ? Math.round((cat.count / rawJobs.length) * 100) : 0;
                return (
                  <div key={idx} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }}></span>
                        <span style={{ fontSize: 12, fontWeight: 750, color: "#0f172a" }}>{cat.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 850, color: "#0f172a" }}>{cat.count} tin</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--admin-text-muted)", minWidth: 32, textAlign: "right" }}>{percent}%</span>
                      </div>
                    </div>
                    {/* Animated Progress Bar */}
                    <div style={{ width: "100%", height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: cat.color, borderRadius: 3, transition: "width 0.5s ease" }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Grid Row 3: Secondary Analytics (Donut Chart, Conversions, Activity Log) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        
        {/* Card 1: User Distribution (Donut Chart) */}
        <div className="admin-card" style={{ padding: "22px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "var(--admin-text)" }}>
            Phân bộ Người dùng
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0" }}>
            <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
              <svg width="96" height="96" viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--admin-border)" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--admin-info)" strokeWidth="4.5" strokeDasharray={`${studentPercent} ${100 - studentPercent}`} strokeDashoffset="0" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--admin-success)" strokeWidth="4.5" strokeDasharray={`${businessPercent} ${100 - businessPercent}`} strokeDashoffset={-studentPercent} />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--admin-primary)" strokeWidth="4.5" strokeDasharray={`${adminPercent} ${100 - adminPercent}`} strokeDashoffset={-(studentPercent + businessPercent)} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "var(--admin-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Tổng</span>
                <span style={{ fontSize: 16, color: "var(--admin-text)", fontWeight: 800 }}>{totalUsers}</span>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--admin-info)", flexShrink: 0 }} />
                <span style={{ color: "var(--admin-text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>Sinh viên</span>
                <strong style={{ color: "var(--admin-text)", flexShrink: 0 }}>{studentPercent}%</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--admin-success)", flexShrink: 0 }} />
                <span style={{ color: "var(--admin-text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>Đối tác</span>
                <strong style={{ color: "var(--admin-text)", flexShrink: 0 }}>{businessPercent}%</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--admin-primary)", flexShrink: 0 }} />
                <span style={{ color: "var(--admin-text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>Quản trị</span>
                <strong style={{ color: "var(--admin-text)", flexShrink: 0 }}>{adminPercent}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Payment Conversions & Performance */}
        <div className="admin-card" style={{ padding: "22px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "var(--admin-text)" }}>
            Hiệu suất Thanh toán
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--admin-text-secondary)" }}>Đơn thành công</span>
                <strong style={{ color: "var(--admin-success)" }}>{performance.success}%</strong>
              </div>
              <div style={{ width: "100%", height: 6, background: "var(--admin-border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${performance.success}%`, height: "100%", background: "var(--admin-success)" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--admin-text-secondary)" }}>Đơn chờ duyệt</span>
                <strong style={{ color: "var(--admin-warning)" }}>{performance.pending}%</strong>
              </div>
              <div style={{ width: "100%", height: 6, background: "var(--admin-border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${performance.pending}%`, height: "100%", background: "var(--admin-warning)" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--admin-text-secondary)" }}>Hủy bỏ / Lỗi</span>
                <strong style={{ color: "var(--admin-danger)" }}>{performance.failed}%</strong>
              </div>
              <div style={{ width: "100%", height: 6, background: "var(--admin-border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${performance.failed}%`, height: "100%", background: "var(--admin-danger)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity Log */}
        <div className="admin-card" style={{ padding: "20px" }}>
          <h2 className="admin-chart-title" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Hoạt động mới nhất</h2>
          <div className="admin-activity-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {computedActivities.map((act) => (
              <div key={act.id} className="admin-activity-item" style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 10, borderBottom: "1px solid var(--admin-border)" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={act.userAvatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, background: act.dotColor, borderRadius: "50%", border: "2px solid var(--admin-card)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="admin-activity-text" style={{ fontSize: 13, lineHeight: 1.4, color: "var(--admin-text)" }}>
                    <strong>{act.userName}</strong> {act.message}
                  </div>
                  <div className="admin-activity-time" style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 2 }}>{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
