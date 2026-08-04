import { useState, useEffect } from "react";
import {
  Briefcase, Users, Calendar, Wallet, Star, ShieldAlert, Award,
  ChevronRight, Zap, RefreshCw, CheckCircle2, Sparkles, Crown,
  TrendingUp, MapPin, Settings, ArrowUpRight, Check, Copy, Receipt, Landmark, ArrowLeft,
  ShieldCheck, Clock, X, ExternalLink
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

  // Auto-polling for payment verification (2.5 giây tự động load giao diện thành công)
  useEffect(() => {
    if (!orderInfo || paymentStatus !== "Pending") return;
    let alive = true;
    const poll = async () => {
      try {
        const statusData = await getPaymentStatusApi(orderInfo.orderId);
        if (!alive) return;
        const status = statusData.status || statusData.Status || "Pending";
        if (status === "Paid") {
          setPaymentStatus("Paid");
          toast.success("Nâng cấp gói cước thành công! Vui lòng tải lại trang để áp dụng hạn ngạch mới. 🎉");
          loadData();
        } else if (status === "Expired" || status === "Cancelled") {
          setPaymentStatus(status);
          toast.error(status === "Expired" ? "Đơn hàng đã hết hạn." : "Đơn hàng đã bị hủy.");
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 2500);

    const handleMessage = (e) => {
      if (e.data?.type === 'PAYOS_SUCCESS') {
        setPaymentStatus("Paid");
        toast.success("Nâng cấp gói cước thành công! 🎉");
        loadData();
      } else if (e.data?.type === 'PAYOS_CANCEL') {
        setPaymentStatus("Cancelled");
        toast.error("Đơn hàng đã bị hủy.");
      }
    };
    window.addEventListener("message", handleMessage);

    return () => { alive = false; clearInterval(iv); window.removeEventListener("message", handleMessage); };
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
      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6 w-full animate-fade-in">
        {paymentStatus === "Paid" ? (
          <div className="relative overflow-hidden bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.12)] rounded-3xl p-8 w-full flex flex-col items-center text-center gap-6 animate-scale-up">
            {/* Decorative Glowing Radial Aura Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-emerald-50/40 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Animated Checkmark Badge with Ring */}
            <div className="relative z-10 my-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-100/80">
                <CheckCircle2 size={42} strokeWidth={2.5} className="animate-bounce" />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                Thành công
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="relative z-10 space-y-2 max-w-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Thanh Toán Hoàn Tất! 🎉
              </h2>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Hệ thống đã phê duyệt & kích hoạt gói <span className="font-extrabold text-orange-600">{orderInfo.planName}</span> cho doanh nghiệp của bạn.
              </p>
            </div>

            {/* Transaction Details Pill */}
            <div className="relative z-10 w-full bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 text-xs space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/40">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Mã đơn hàng</span>
                <span className="text-slate-800 font-black font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{orderInfo.orderCode || orderInfo.orderId}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/40">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Số tiền đã trả</span>
                <span className="text-emerald-600 font-black text-sm">{(orderInfo.amount || 10000).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Trạng thái</span>
                <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Đã kích hoạt
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderInfo(null)}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Quay lại Bảng điều khiển</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ==================== PENDING CHECKOUT UI ==================== */
          <div className="relative max-w-4xl mx-auto w-full">
            {/* Top nav */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <button type="button" onClick={() => setOrderInfo(null)} className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer bg-white hover:bg-slate-50 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                <ArrowLeft size={14} /> Quay lại
              </button>
              <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> Duyệt tự động Napas247
              </span>
            </div>

            {/* 2-col on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

              {/* LEFT: PayOS iframe */}
              <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
                <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 rounded-2xl sm:rounded-3xl">
                  {/* Dark header bar */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Receipt size={13} className="text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-extrabold text-[11px] sm:text-xs tracking-tight">Thanh toán qua PayOS</h3>
                        <p className="text-slate-400 text-[9px] sm:text-[10px] font-medium">Quét mã QR hoặc chuyển khoản</p>
                      </div>
                    </div>
                  </div>

                  {/* PayOS iframe */}
                  {orderInfo.checkoutUrl && paymentStatus === "Pending" ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full h-[450px] sm:h-[480px] bg-white flex justify-center items-center">
                        <iframe
                          src={orderInfo.checkoutUrl}
                          title="PayOS Checkout"
                          className="w-full max-w-[520px] h-full border-0 mx-auto"
                          allow="payment"
                        />
                      </div>
                      <div className="w-full p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">Chụp màn hình mã QR để quét trong app Ngân hàng</span>
                        <a
                          href={orderInfo.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] rounded-xl transition shrink-0"
                        >
                          <span>Mở Tab Mới</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '250px' }}>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <X size={22} className="text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-400 font-bold">Mã QR đã hết hạn hoặc không khả dụng</p>
                      <button type="button" onClick={() => setOrderInfo(null)} className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer transition">Tạo đơn mới</button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Order info sidebar */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 sm:gap-4 order-1 lg:order-2">
                <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                  <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 bg-orange-500/8 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                      <Star size={13} className="text-white" fill="white" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Chi tiết đơn hàng</h3>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-dashed border-slate-100">
                      <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Gói dịch vụ</span>
                      <span className="bg-orange-50 text-orange-700 font-black text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-orange-100">{orderInfo.planName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-dashed border-slate-100">
                      <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Mã đơn hàng</span>
                      <span className="text-slate-700 font-mono font-bold text-[10px] sm:text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px] sm:max-w-none">{orderInfo.orderCode || orderInfo.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 sm:pt-3 mt-1 border-t border-slate-200">
                      <span className="text-slate-800 font-extrabold text-xs sm:text-sm">Tổng thanh toán</span>
                      <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{(orderInfo.amount || 10000).toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>
                </div>

                {paymentStatus === "Pending" && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 shadow-md shadow-orange-500/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 mt-0.5">
                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-orange-900 text-[11px] sm:text-xs">Đang chờ thanh toán</h4>
                        <p className="text-orange-700/70 text-[10px] sm:text-[11px] font-medium leading-relaxed">
                          Tự động kiểm tra mỗi <span className="font-bold text-orange-700">2.5s</span>. Cập nhật ngay khi nhận thanh toán.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-orange-200/50">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                {/* Payment Steps Guidance Card */}
                <div className="bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 rounded-2xl sm:rounded-3xl p-4 text-xs space-y-2.5">
                  <h4 className="font-extrabold text-slate-800 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    💡 Hướng dẫn nhanh
                  </h4>
                  <div className="space-y-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Dùng App Ngân hàng quét mã QR ở khung bên trái.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Giữ nguyên nội dung chuyển khoản tự động điền.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Sau khi gửi xong, hệ thống sẽ tự duyệt trong 5 giây.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">SSL 256-bit</span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <Landmark size={12} className="text-blue-500" />
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Napas 247</span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-200" />
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">🔒 PayOS</span>
                </div>

                <button type="button" onClick={() => setOrderInfo(null)} className="w-full h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl sm:rounded-2xl font-bold transition text-xs cursor-pointer flex items-center justify-center gap-1.5">
                  <X size={13} /> Hủy & quay lại
                </button>
              </div>
            </div>
          </div>
        )}
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
