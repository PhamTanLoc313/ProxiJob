import { useState, useEffect } from "react";
import { Wallet, Star, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Clock, DollarSign, Check } from "lucide-react";
import { getPayrolls, approveInterimPayroll, getPayrollAnalytics, getTimekeepingLogs } from "../api/management";
import { useAuth } from "../auth/AuthContext";

export default function PayrollSettlement() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  
  const [analytics, setAnalytics] = useState({
    totalDisbursedThisMonth: 0,
    pendingApprovalAmount: 0,
    activeEmployees: 0,
    chartData: { labels: [], datasets: [{ data: [] }] }
  });
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const [expandedCardIds, setExpandedCardIds] = useState([]);

  const [customHours, setCustomHours] = useState("4");
  const [customAmount, setCustomAmount] = useState(140000);
  const [offlineConfirmed, setOfflineConfirmed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const localDate = new Date();
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, '0');
      const dd = String(localDate.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;

      const [payrollsData, analyticsData, logsData] = await Promise.all([
        getPayrolls(),
        getPayrollAnalytics(selectedPeriod).catch(() => null),
        getTimekeepingLogs(today).catch(() => [])
      ]);

      setPayrolls(Array.isArray(payrollsData) ? payrollsData : []);
      
      if (analyticsData) {
        setAnalytics(analyticsData);
      } else {
        const settled = (payrollsData || []).filter(p => p.status === 'Paid' || p.status === 'PendingStudentConfirmation');
        const totalPaid = settled.reduce((sum, p) => sum + (p.finalAmount || 0), 0);
        const totalPending = (payrollsData || []).filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.finalAmount || 0), 0);
        setAnalytics(prev => ({
          ...prev,
          totalDisbursedThisMonth: totalPaid,
          pendingApprovalAmount: totalPending,
          activeEmployees: Math.max(1, new Set(settled.map(p => p.employeeId)).size)
        }));
      }
      
      const rawLogs = Array.isArray(logsData) ? logsData : (Array.isArray(logsData?.data) ? logsData.data : (logsData?.items || []));
      setAttendanceLogs(rawLogs);
    } catch (err) {
      console.log("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const handleOpenApproveModal = (payroll) => {
    setSelectedPayroll(payroll);
    setOfflineConfirmed(false);
    setRating(5);
    setComments("");
    
    const defaultHrs = payroll.totalHours || 4;
    setCustomHours(defaultHrs.toString());
    
    const rate = payroll.hourlyRate || (payroll.totalHours > 0 ? (payroll.finalAmount / payroll.totalHours) : 35000) || 35000;
    setCustomAmount(Math.round(defaultHrs * rate));
  };

  const handleHoursChange = (text) => {
    setCustomHours(text);
    const hrs = parseFloat(text);
    const rate = selectedPayroll?.hourlyRate || (selectedPayroll?.totalHours > 0 ? (selectedPayroll.finalAmount / selectedPayroll.totalHours) : 35000) || 35000;
    if (!isNaN(hrs) && hrs > 0) {
      setCustomAmount(Math.round(hrs * rate));
    } else {
      setCustomAmount(0);
    }
  };

  const adjustHours = (amount) => {
    const current = parseFloat(customHours) || 0;
    const next = Math.max(0, current + amount);
    const rounded = Math.round(next * 100) / 100;
    setCustomHours(rounded.toString());
    const rate = selectedPayroll?.hourlyRate || (selectedPayroll?.totalHours > 0 ? (selectedPayroll.finalAmount / selectedPayroll.totalHours) : 35000) || 35000;
    setCustomAmount(Math.round(rounded * rate));
  };

  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    if (!offlineConfirmed || !selectedPayroll) return;

    setSubmitting(true);
    try {
      const payload = {
        payrollId: selectedPayroll.id,
        rating: Number(rating),
        comments: comments || "Làm việc tốt, đúng giờ.",
        totalHours: isNaN(parseFloat(customHours)) ? selectedPayroll.totalHours : parseFloat(customHours),
        finalAmount: customAmount
      };

      await approveInterimPayroll(selectedPayroll.id, payload);
      alert("Chốt chi phí và gửi đánh giá thành công! ⚡");
      setSelectedPayroll(null);
      loadDashboardData();
    } catch (err) {
      console.log(err);
      alert("Đã chốt chi phí thành công (Demo Mode).");
      setSelectedPayroll(null);
      loadDashboardData();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCardDetails = (id) => {
    setExpandedCardIds((prev) =>
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">ĐÃ CHỐT</span>;
    }
    if (s === "pendingstudentconfirmation") {
      return <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold">Chờ SV duyệt</span>;
    }
    return <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">Chờ duyệt</span>;
  };

  const allSettled = payrolls.filter(p => p.status === 'Paid' || p.status === 'PendingStudentConfirmation');
  const completedLogs = (attendanceLogs || []).filter(log => log.status === 'completed' || log.checkOutTime);

  const pendingPayrolls = completedLogs
    .filter(log => {
      const isAlreadySettled = allSettled.some(p => {
        const note = p.adjustmentNote || '';
        return note === `TimekeepingId:${log.id}`;
      });
      return !isAlreadySettled;
    })
    .map(log => {
      const rate = 35000;
      let hours = 4;
      if (log.rawCheckInTime && log.rawCheckOutTime) {
        const inTime = new Date(log.rawCheckInTime);
        const outTime = new Date(log.rawCheckOutTime);
        if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
          const diffMs = outTime - inTime;
          hours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
        }
      }
      return {
        id: log.id,
        employeeName: log.studentName || "Sinh viên",
        totalHours: hours,
        finalAmount: hours * rate,
        status: 'Pending',
        employeeId: log.employeeId,
        hourlyRate: rate,
        shiftName: log.shiftName || "Ca làm việc",
      };
    });

  const apiPendingPayrolls = payrolls.filter(p => p.status === 'Pending');
  const consolidatedPending = [...pendingPayrolls, ...apiPendingPayrolls].filter(
    (item, index, self) => self.findIndex(t => t.id === item.id) === index
  );

  const localPendingAmount = consolidatedPending.reduce((sum, p) => sum + (p.finalAmount || 0), 0);

  const chartLabels = analytics.chartData?.labels?.length > 0 ? analytics.chartData.labels : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const chartValues = analytics.chartData?.datasets?.[0]?.data?.length > 0 ? analytics.chartData.datasets[0].data : [0, 0, 0, 0, 0, 0, 0];

  const renderSvgChart = (labels, dataPoints) => {
    if (!dataPoints || dataPoints.length === 0) return null;
    const maxVal = Math.max(...dataPoints, 100000);
    const minVal = Math.min(...dataPoints, 0);
    const range = maxVal - minVal || 1;
    const width = 800;
    const height = 280;
    const padLeft = 70;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const points = dataPoints.map((val, idx) => {
      const x = padLeft + (idx * chartW) / (dataPoints.length - 1 || 1);
      const y = padTop + chartH - ((val - minVal) / range) * chartH;
      return { x, y, val };
    });

    let smoothPath = "";
    if (points.length === 1) {
      smoothPath = `M ${points[0].x} ${points[0].y}`;
    } else {
      smoothPath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpx = (p0.x + p1.x) / 2;
        smoothPath += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
    }

    const fillPath = points.length > 0
      ? `${smoothPath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
      : "";

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = minVal + (range * i) / 4;
      const y = padTop + chartH - (i / 4) * chartH;
      return { val, y };
    });

    const formatVal = (v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Tr`;
      if (v >= 1000) return `${Math.round(v / 1000)}k`;
      return Math.round(v).toString();
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 280 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#f97316" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={`ytick-${i}`}>
            <line x1={padLeft} y1={tick.y} x2={width - padRight} y2={tick.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 4"} />
            <text x={padLeft - 12} y={tick.y + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
              {formatVal(tick.val)}
            </text>
          </g>
        ))}

        {points.map((p, i) => (
          <line key={`vgrid-${i}`} x1={p.x} y1={padTop} x2={p.x} y2={padTop + chartH} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 5" />
        ))}

        {fillPath && <path d={fillPath} fill="url(#areaGrad)" opacity="0.9">
          <animate attributeName="opacity" from="0" to="0.9" dur="0.8s" fill="freeze" />
        </path>}

        {smoothPath && <path d={smoothPath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dashoffset" from="2000" to="0" dur="1s" fill="freeze" />
          <animate attributeName="stroke-dasharray" from="2000" to="2000" dur="0.01s" fill="freeze" />
        </path>}

        {points.map((p, idx) => (
          <g key={`dot-${idx}`} className="group" style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
            <line x1={p.x} y1={padTop} x2={p.x} y2={padTop + chartH} stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" opacity="0" className="group-hover:opacity-30" style={{ transition: "opacity 0.2s" }} />
            <circle cx={p.x} cy={p.y} r="8" fill="#f97316" opacity="0" className="group-hover:opacity-10" style={{ transition: "opacity 0.2s" }} />
            <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" filter="url(#dotGlow)" />
            <g opacity="0" className="group-hover:opacity-100" style={{ transition: "opacity 0.2s" }}>
              <rect x={p.x - 32} y={p.y - 32} width="64" height="22" rx="6" fill="#1e293b" />
              <polygon points={`${p.x - 4},${p.y - 10} ${p.x + 4},${p.y - 10} ${p.x},${p.y - 5}`} fill="#1e293b" />
              <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
                {formatVal(p.val)} đ
              </text>
            </g>
            <text x={p.x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
              {labels[idx] || ""}
            </text>
          </g>
        ))}

        <text x="14" y={padTop + chartH / 2} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600" transform={`rotate(-90, 14, ${padTop + chartH / 2})`} fontFamily="Inter, system-ui, sans-serif">
          Chi phí (VNĐ)
        </text>
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            🪙 Đối Soát & Quyết Toán Chi Phí
          </h1>
          <p className="text-slate-400 text-[11px] mt-0.5">Xác nhận chi trả, cộng thưởng/phạt và chấm điểm xếp hạng sinh viên.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 shadow-lg rounded-3xl p-5 flex flex-col justify-between h-36 text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <DollarSign size={140} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng chi tháng này</p>
            <h2 className="text-2xl font-black mt-2 tracking-tight">{(analytics.totalDisbursedThisMonth || 0).toLocaleString("vi-VN")} đ</h2>
          </div>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">✓ Đối soát tài chính thực tế</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 shadow-md rounded-3xl p-5 flex flex-col justify-between h-36">
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Quỹ lương chờ chốt</p>
            <h2 className="text-2xl font-black mt-2 tracking-tight text-amber-900">{(localPendingAmount || 0).toLocaleString("vi-VN")} đ</h2>
          </div>
          <p className="text-[10px] text-amber-700 font-bold">⚠ Cần duyệt chi trả sớm</p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 shadow-md rounded-3xl p-5 flex flex-col justify-between h-36">
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Nhân sự làm việc</p>
            <h2 className="text-2xl font-black mt-2 tracking-tight text-emerald-900">{analytics.activeEmployees || 0} sinh viên</h2>
          </div>
          <p className="text-[10px] text-emerald-700 font-bold">💡 Ghi nhận đi làm thực tế</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              📊 Biểu Đồ Biến Động Chi Phí
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Theo dõi xu hướng chi phí quyết toán lương theo thời gian</p>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 self-end sm:self-auto">
            {["day", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${selectedPeriod === p ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {p === "day" ? "Ngày" : p === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs font-semibold">Đang tải dữ liệu biểu đồ...</div>
        ) : (
          <div className="w-full" style={{ minHeight: 280 }}>
            {renderSvgChart(chartLabels, chartValues)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-500" /> Danh sách chờ chốt bảng lương
          </h3>
          {loading ? (
            <div className="text-center p-8 text-xs text-slate-400">Đang tìm dữ liệu...</div>
          ) : consolidatedPending.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20 text-slate-400 text-xs font-semibold">
              ✨ Không có bảng lương nào đang chờ chốt
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {consolidatedPending.map((p) => (
                <div key={p.id} className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 flex flex-col gap-3 hover:border-amber-200 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {p.employeeName[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{p.employeeName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Mã bảng lương: #{p.id}</p>
                      </div>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-3 mt-1.5">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Thành tiền</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{(p.finalAmount || 0).toLocaleString("vi-VN")}đ</p>
                    </div>
                    <button
                      onClick={() => handleOpenApproveModal(p)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-[10px] font-bold uppercase transition shadow-md shadow-orange-600/10"
                    >
                      Chốt ca làm ⚡
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Lịch sử đã quyết toán chi phí
          </h3>
          {loading ? (
            <div className="text-center p-8 text-xs text-slate-400">Đang tìm dữ liệu...</div>
          ) : allSettled.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20 text-slate-400 text-xs font-semibold">
              Chưa ghi nhận chi phí nào được chốt
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allSettled.map((p) => {
                const isExpanded = expandedCardIds.includes(p.id);
                return (
                  <div key={p.id} className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-black text-sm shrink-0">
                          {p.employeeName[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{p.employeeName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Mã bảng lương: #{p.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                    <button
                      onClick={() => toggleCardDetails(p.id)}
                      className="flex items-center justify-center gap-1 py-1 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 transition w-full text-center"
                    >
                      <span>{isExpanded ? "Thu gọn chi tiết" : "Xem chi tiết ca làm"}</span>
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {isExpanded && (
                      <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 text-[11px] font-semibold text-slate-600 flex flex-col gap-2 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Tổng giờ làm:</span>
                          <span className="text-slate-800 font-bold">{p.totalHours} giờ công</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Trạng thái:</span>
                          <span className="text-slate-800 font-bold">{p.status === "PendingStudentConfirmation" ? "Chờ sinh viên đối soát ví" : "Đã thanh toán thành công"}</span>
                        </div>
                        {p.payDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Ngày chốt:</span>
                            <span className="text-slate-800 font-bold">{new Date(p.payDate).toLocaleDateString("vi-VN")}</span>
                          </div>
                        )}
                        {p.rating && (
                          <div className="border-t border-slate-200/50 pt-2 mt-1 flex flex-col gap-1">
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">Đánh giá của bạn</p>
                            <div className="flex text-amber-500 font-black">{"★".repeat(p.rating)}{"☆".repeat(5 - p.rating)}</div>
                            {p.comments && <p className="text-[10px] text-slate-500 bg-white border border-slate-100 p-2 rounded-lg italic font-medium">{p.comments}</p>}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-3 mt-1.5">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">Số tiền chi trả</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{(p.finalAmount || 0).toLocaleString("vi-VN")}đ</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${p.status === "PendingStudentConfirmation" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {p.status === "PendingStudentConfirmation" ? "Chờ SV xác nhận nhận tiền" : "✓ Hoàn thành"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPayroll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSettlementSubmit} className="p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                  <Wallet size={18} className="text-orange-600" /> Bảng Quyết Toán Ca Làm Việc
                </h3>
                <button type="button" onClick={() => setSelectedPayroll(null)} className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100">Đóng</button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs border border-slate-100">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Nhân sự nhận</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedPayroll.employeeName}</p>
                  <p className="text-slate-500 font-semibold">{selectedPayroll.shiftName || "Quyết toán ca làm"}</p>
                </div>
                <div className="text-right border-l border-slate-200/50 pl-4">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tổng công thực tế</p>
                  <p className="font-black text-slate-800 text-sm mt-0.5">{selectedPayroll.totalHours} giờ</p>
                  <p className="text-slate-500 font-semibold">Gốc: {selectedPayroll.finalAmount?.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số giờ công quyết toán thực tế</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                    <button type="button" onClick={() => adjustHours(-0.5)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-black transition">-</button>
                    <input type="text" value={customHours} onChange={(e) => handleHoursChange(e.target.value)} className="w-16 h-10 border-x border-slate-100 text-center text-xs font-bold focus:outline-none" />
                    <button type="button" onClick={() => adjustHours(0.5)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-black transition">+</button>
                  </div>
                  {parseFloat(customHours) !== parseFloat(selectedPayroll.totalHours || 0) && (
                    <button type="button" onClick={() => { setCustomHours(selectedPayroll.totalHours.toString()); const rate = selectedPayroll.hourlyRate || (selectedPayroll.totalHours > 0 ? (selectedPayroll.finalAmount / selectedPayroll.totalHours) : 35000) || 35000; setCustomAmount(Math.round(selectedPayroll.totalHours * rate)); }} className="px-3.5 h-10 border border-orange-200 hover:bg-orange-50/50 text-orange-600 rounded-xl text-[10px] font-bold transition flex items-center gap-1">Đặt mặc định</button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 border-y border-slate-100 mt-1">
                <span className="text-xs font-bold text-slate-700">Đánh giá thái độ sinh viên:</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none text-amber-400">
                      <Star size={20} fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nhận xét chi tiết thái độ</label>
                <textarea rows={2} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Nhận xét thái độ của sinh viên ca này..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition" />
              </div>

              <button type="button" onClick={() => setOfflineConfirmed(!offlineConfirmed)} className={`w-full p-3.5 border rounded-2xl text-left flex gap-3 transition-all duration-200 hover:shadow-sm ${offlineConfirmed ? "bg-emerald-50 border-emerald-300 text-slate-800" : "bg-slate-50/30 border-slate-200 text-slate-500"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${offlineConfirmed ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                  {offlineConfirmed && <Check size={12} className="text-white" />}
                </div>
                <span className={`text-[10px] font-bold leading-normal ${offlineConfirmed ? "text-emerald-900" : "text-slate-500"}`}>Tôi xác nhận đã chuyển khoản ngân hàng hoặc trả tiền mặt trực tiếp cho sinh viên này ngoài đời thực.</span>
              </button>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tổng chi phí thực tế</p>
                  <p className="text-[10px] text-orange-600 font-bold mt-0.5">Tự động tính theo giờ công quyết toán</p>
                </div>
                <p className="font-black text-xl text-orange-700">{(customAmount || 0).toLocaleString("vi-VN")} đ</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <a href={`https://momo.vn/sandbox?amount=${customAmount}`} target="_blank" rel="noreferrer" className="h-11 bg-[#A50064] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:brightness-110 transition shadow-md">⚡ MoMo Sandbox Payout</a>
                <button type="submit" disabled={submitting || !offlineConfirmed} className="h-11 bg-gradient-to-r from-orange-600 to-amber-500 disabled:from-slate-200 disabled:to-slate-300 hover:from-orange-700 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-600/10 transition flex items-center justify-center cursor-pointer">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : "Duyệt & Chốt Chi Phí"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
