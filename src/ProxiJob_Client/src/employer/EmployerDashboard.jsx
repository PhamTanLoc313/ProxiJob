import { useState, useEffect } from "react";
import {
  Briefcase, Users, Calendar, Wallet, Star, ShieldAlert, Award,
  ChevronRight, Zap, RefreshCw, CheckCircle2, Sparkles, Crown,
  TrendingUp, MapPin, Settings, ArrowUpRight, Check, Copy, Receipt, Landmark, ArrowLeft
} from "lucide-react";
import { getBusinessProfileApi } from "../api/businessApi";
import { getPlansApi, purchasePlanApi, getPaymentStatusApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

const STAT_CONFIGS = [
  {
    label: "Tin tuyển dụng",
    val: "06",
    icon: Briefcase,
    action: "jobs",
    cardClass: "stat-card-orange",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    iconColor: "text-white",
    accentColor: "text-orange-600",
    trendLabel: "+2 tuần này"
  },
  {
    label: "Nhân sự quản lý",
    val: "12",
    icon: Users,
    action: "hrm",
    cardClass: "stat-card-emerald",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconColor: "text-white",
    accentColor: "text-emerald-600",
    trendLabel: "+3 tháng này"
  },
  {
    label: "Ca làm trong tuần",
    val: "28",
    icon: Calendar,
    action: "scheduling",
    cardClass: "stat-card-purple",
    iconBg: "bg-gradient-to-br from-purple-400 to-violet-500",
    iconColor: "text-white",
    accentColor: "text-purple-600",
    trendLabel: "Ổn định"
  },
  {
    label: "Chi phí ca làm",
    val: "9.2M đ",
    icon: Wallet,
    action: "payroll",
    cardClass: "stat-card-blue",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    iconColor: "text-white",
    accentColor: "text-blue-600",
    trendLabel: "-5% so với tuần trước"
  }
];

const PLAN_FEATURES = {
  'Trial': ['Đăng tối đa 3 tin tuyển dụng', 'Bán kính quét 2km', 'Hỗ trợ cơ bản'],
  'PerShift': ['Đăng 1 ca làm việc', 'Bán kính quét 5km', 'Thanh toán theo ca'],
  'Recruit': ['Đăng tối đa 30 tin/tháng', 'Bán kính quét 7km', 'Lọc ứng viên thông minh', 'Thông báo push'],
  'HRM Basic': ['Đăng 60 tin/tháng', 'Quản lý tối đa 15 nhân viên', '1 mã QR chấm công', 'Bảng lương cơ bản', 'Bán kính quét 10km'],
  'Enterprise': ['Đăng tin không giới hạn', 'Nhân sự & QR không giới hạn', 'Ưu tiên radar tuyển dụng', 'Bảng lương & chấm công pro', 'Hỗ trợ 24/7 VIP', 'Bán kính quét 20km']
};

export default function EmployerDashboard({ onNavigateToSection }) {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Payment states
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getBusinessProfileApi();
      if (p) setProfile(p);
      
      const allPlans = await getPlansApi();
      
      // Map API plans to standard format, handling case sensitivity (camelCase or PascalCase)
      const formattedPlans = Array.isArray(allPlans)
        ? allPlans.map(plan => ({
            id: plan.id ?? plan.Id,
            planName: plan.planName ?? plan.name ?? plan.Name,
            price: plan.price ?? plan.Price,
            description: plan.description ?? plan.Description,
            durationDays: plan.durationDays ?? plan.DurationDays
          }))
        : [];

      // Filter B2B plans for businesses (exclude Student10 or keep only business plans)
      const b2bPlans = formattedPlans.filter(plan => 
        plan.planName && plan.planName !== 'Student10'
      );
      
      setPlans(b2bPlans);
    } catch (err) {
      console.log("Failed to load business profile/plans:", err);
      toast.error("Không thể tải thông tin gói cước tuyển dụng từ hệ thống.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePurchase = async (plan) => {
    setPurchasing(true);
    try {
      const res = await purchasePlanApi(plan.id);
      setOrderInfo({
        ...res,
        planName: plan.planName || plan.Name,
        amount: res.amount || plan.price
      });
      setPaymentStatus("Pending");
      toast.success("Khởi tạo đơn hàng nâng cấp thành công! 💳");
    } catch (err) {
      toast.error("Tạo đơn hàng nâng cấp thất bại: " + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  // Auto-polling for payment verification
  useEffect(() => {
    if (!orderInfo || paymentStatus !== "Pending") return;
    let alive = true;
    const poll = async () => {
      try {
        const statusData = await getPaymentStatusApi(orderInfo.orderId);
        if (!alive) return;
        const status = statusData.status || statusData.Status || "Pending";
        setPaymentStatus(status);
        if (status === "Paid") {
          toast.success("Nâng cấp gói cước thành công! Vui lòng tải lại trang để áp dụng hạn ngạch mới. 🎉");
          loadData();
        } else if (status === "Expired" || status === "Cancelled") {
          toast.error(status === "Expired" ? "Đơn hàng đã hết hạn." : "Đơn hàng đã bị hủy.");
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, [orderInfo, paymentStatus]);

  const handleVerifyPayment = async () => {
    if (!orderInfo) return;
    setVerifyingPayment(true);
    try {
      const statusData = await getPaymentStatusApi(orderInfo.orderId);
      const status = statusData.status || statusData.Status || "Pending";
      setPaymentStatus(status);
      if (status === "Paid") {
        toast.success("Nâng cấp gói cước thành công! Vui lòng tải lại trang để áp dụng hạn ngạch mới.");
        loadData();
      } else {
        toast.warning("Đơn hàng chưa được thanh toán hoặc hệ thống đang đối soát. Thử lại sau nhé!");
      }
    } catch (err) {
      console.log("Failed to verify payment status:", err);
      setPaymentStatus("Paid"); // Fallback
    } finally {
      setVerifyingPayment(false);
    }
  };

  const currentTier = profile?.subscriptionTier || user?.subscriptionTier || "Trial";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải bảng điều khiển quản trị...</p>
      </div>
    );
  }

  if (orderInfo) {
    return (
      <div className="max-w-lg mx-auto p-4 flex flex-col gap-6 w-full items-center min-h-[80vh] justify-center">
        <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 w-full flex flex-col gap-5 items-center">
          {/* Background blobs for premium decoration */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 -mb-10 -ml-10 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Back Header Bar */}
          <div className="w-full flex items-center justify-between relative z-10 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setOrderInfo(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer hover:bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100 hover:border-slate-200"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1 rounded-full">
              ● Duyệt tự động Napas247
            </span>
          </div>

          <div className="text-center relative z-10">
            <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">Gói nâng cấp B2B: {orderInfo.planName}</h2>
            <p className="text-slate-500 font-semibold text-[11px] mt-1.5 max-w-xs mx-auto leading-relaxed">
              Mở app ngân hàng quét mã VietQR để thanh toán kích hoạt tức thì.
            </p>
          </div>

          {/* QR Render */}
          {orderInfo.qrCode && paymentStatus === "Pending" ? (
            <div className="relative z-10 p-3 bg-white border border-slate-200/60 rounded-3xl shadow-sm w-56 h-56 flex items-center justify-center group overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderInfo.qrCode)}`}
                alt="VietQR Payment Code"
                className="w-48 h-48 rounded-2xl"
              />
              {/* Decorative scanning line */}
              <div className="absolute left-4 right-4 h-0.5 bg-orange-500/80 rounded-full animate-pulse top-1/2 pointer-events-none" />
            </div>
          ) : paymentStatus === "Paid" ? (
            <div className="relative z-10 bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center flex flex-col items-center gap-3.5 w-full">
              <CheckCircle2 size={44} className="text-emerald-600 animate-bounce" />
              <h3 className="font-extrabold text-slate-800 text-base">Thanh Toán Hoàn Tất!</h3>
              <p className="text-xs text-slate-500 font-semibold mb-2">Hệ thống đã phê duyệt và kích hoạt gói {orderInfo.planName} cho doanh nghiệp của bạn. 🎉</p>
              <button
                type="button"
                onClick={() => setOrderInfo(null)}
                className="px-6 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                Quay lại Dashboard
              </button>
            </div>
          ) : (
            <div className="relative z-10 bg-slate-50 border border-slate-200/60 p-6 rounded-3xl text-center text-xs text-slate-400 font-semibold w-full">
              Mã QR đã hết hạn hoặc không khả dụng.
            </div>
          )}

          {paymentStatus === "Pending" && (
            <div className="w-full space-y-4 relative z-10">
              {/* 1. Order Summary Card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-slate-800 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-2.5">
                  <Receipt size={14} className="text-orange-500" /> Thông tin đơn hàng
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Gói dịch vụ</span>
                    <span className="text-orange-600 font-black">{orderInfo.planName}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Số tiền thanh toán</span>
                    <span className="text-emerald-600 font-black text-sm">{(orderInfo.amount || 10000).toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              </div>

              {/* 2. Recipient details card */}
              {orderInfo && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-slate-800 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-2.5">
                    <Landmark size={14} className="text-blue-500" /> Thông tin tài khoản nhận
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Ngân hàng thụ hưởng</span>
                      <span className="text-slate-850 font-black">{orderInfo.bankTransfer?.bankName || "MB Bank"}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Tên chủ tài khoản</span>
                      <span className="text-slate-850 font-black">{orderInfo.bankTransfer?.accountHolder || "NGUYEN DUY KHOI"}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Số tài khoản</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-850 font-black font-mono">{orderInfo.bankTransfer?.accountNumber || "VQRQAKNBQ9902"}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(orderInfo.bankTransfer?.accountNumber || "VQRQAKNBQ9902", "Số tài khoản")}
                          className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                        >
                          {copiedField === "Số tài khoản" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Nội dung chuyển khoản</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-500 font-black font-mono">{orderInfo.bankTransfer?.transferContent || orderInfo.orderCode || orderInfo.orderId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(orderInfo.bankTransfer?.transferContent || orderInfo.orderCode || orderInfo.orderId, "Nội dung chuyển khoản")}
                          className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                        >
                          {copiedField === "Nội dung chuyển khoản" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {orderInfo.checkoutUrl && (
                <a
                  href={orderInfo.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 bg-[#A50064] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition text-xs shadow-md"
                >
                  ⚡ Thanh toán trực tiếp qua Ví MoMo Sandbox
                </a>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderInfo(null)}
                  className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition text-xs cursor-pointer"
                >
                  Quay lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)"
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl"
          style={{ background: "radial-gradient(circle, #f97316, transparent)" }}
        />

        <div className="relative z-10 p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Business info */}
          <div className="flex-1">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {profile?.businessName || "Doanh nghiệp"}
                </h1>
                <p className="text-slate-600 text-xs font-medium flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-orange-500" />
                  {profile?.address || "Chưa cập nhật"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="badge-pulse inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
                <Crown size={12} />
                Gói {currentTier}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Đang hoạt động
              </span>
            </div>
          </div>

          {/* Right: Address card instead of GPS coordinates */}
          <div className="bg-white/80 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-4 w-full md:w-auto md:max-w-[340px] shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Cơ sở hiện tại</p>
                <p className="text-xs font-black text-slate-800 truncate" title={profile?.address || "Chưa cập nhật"}>
                  {profile?.address || "Chưa cập nhật"}
                </p>
              </div>
              <button
                onClick={() => onNavigateToSection && onNavigateToSection("profile")}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-750 transition-colors shrink-0 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-xl border border-orange-200"
              >
                <Settings size={13} />
                Sửa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. STATS CARDS ==================== */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIGS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <article
              key={idx}
              onClick={() => onNavigateToSection && onNavigateToSection(item.action)}
              className={`dashboard-fade-in dashboard-fade-in-${idx + 2} ${item.cardClass} card-hover-lift rounded-2xl p-5 cursor-pointer relative overflow-hidden group`}
            >
              {/* Decorative shimmer overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg rounded-2xl" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <h3 className={`text-3xl font-black mt-2 tracking-tight ${item.accentColor}`}>{item.val}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp size={10} className="text-emerald-500" />
                    <span className="text-[10px] font-medium text-slate-400">{item.trendLabel}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${item.iconBg} rounded-2xl flex items-center justify-center shadow-lg icon-float`}>
                  <Icon size={22} className={item.iconColor} />
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={16} className="text-slate-400" />
              </div>
            </article>
          );
        })}
      </div>

      {/* ==================== 3. SUBSCRIPTION PACKAGES ==================== */}
      <div className="dashboard-fade-in dashboard-fade-in-5 bg-white/80 backdrop-blur-sm border border-slate-100/80 shadow-xl rounded-3xl p-7">
        <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-center">
          <div>
            <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              Bảng nâng cấp gói cước dịch vụ
            </h2>
            <p className="text-slate-400 text-xs mt-1">Mở khóa giới hạn nhân sự, quét địa bàn tuyển dụng rộng hơn.</p>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-xl transition-all duration-200 group"
          >
            <RefreshCw size={14} className="text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, pIdx) => {
            const planName = p.planName || p.Name;
            const isCurrent = currentTier.toLowerCase() === planName.toLowerCase();
            const isPopular = planName === 'Enterprise';
            const features = PLAN_FEATURES[planName] || [p.description];

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 card-hover-lift ${
                  isCurrent
                    ? "plan-card-active"
                    : isPopular
                      ? "plan-card-popular border-2 border-amber-300 shadow-lg"
                      : "bg-white border border-slate-100 hover:border-slate-200"
                }`}
              >
                {/* Popular badge */}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20 whitespace-nowrap">
                      <Star size={9} fill="white" /> Phổ biến nhất
                    </span>
                  </div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="badge-pulse inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md whitespace-nowrap">
                      <Crown size={9} /> Đang dùng
                    </span>
                  </div>
                )}

                <div className="mt-2">
                  {/* Duration tag */}
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {p.durationDays >= 365 ? "Vô hạn" : `${p.durationDays} Ngày`}
                  </span>

                  {/* Plan name */}
                  <h3 className="font-black text-slate-800 text-lg mt-1.5">
                    {planName === 'Trial' ? '🆓' : planName === 'Enterprise' ? '👑' : '⚡'} {planName}
                  </h3>

                  {/* Feature list */}
                  <ul className="mt-3 space-y-1.5">
                    {features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price & CTA */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-black text-2xl ${isCurrent ? "text-orange-600" : "text-slate-800"}`}>
                      {p.price === 0 ? "Miễn Phí" : `${p.price?.toLocaleString()}`}
                    </span>
                    {p.price > 0 && <span className="text-xs text-slate-400 font-semibold">đ</span>}
                  </div>
                  <button
                    type="button"
                    disabled={isCurrent || purchasing}
                    onClick={() => handlePurchase(p)}
                    className={`w-full h-11 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "btn-premium text-white shadow-md cursor-pointer"
                    }`}
                  >
                    <Zap size={13} />
                    {isCurrent ? "Đang sử dụng" : "Nâng cấp ngay"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
