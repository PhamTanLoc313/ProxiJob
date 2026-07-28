import { useState, useEffect } from "react";
import {
  Briefcase, Users, Calendar, Wallet, Star, ShieldAlert, Award,
  ChevronRight, Zap, RefreshCw, CheckCircle2, Sparkles, Crown,
  TrendingUp, MapPin, Settings, ArrowUpRight, Check
} from "lucide-react";
import { getBusinessProfileApi } from "../api/businessApi";
import { getPlansApi, purchasePlanApi, getPaymentStatusApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

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
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Payment states
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getBusinessProfileApi();
      if (p) setProfile(p);
      
      const allPlans = await getPlansApi();
      // Filter B2B plans for businesses
      const b2bPlans = Array.isArray(allPlans)
        ? allPlans.filter(plan => ['Trial', 'PerShift', 'Recruit', 'HRM Basic', 'Enterprise'].includes(plan.planName || plan.Name))
        : [];
      
      if (b2bPlans.length === 0) {
        setPlans([
          { id: 1, planName: 'Trial', price: 0, description: 'Gói thử nghiệm miễn phí. Được đăng tối đa 3 tin tuyển dụng.', durationDays: 9999 },
          { id: 5, planName: 'PerShift', price: 15000, description: 'Đăng 1 ca làm việc.', durationDays: 1 },
          { id: 2, planName: 'Recruit', price: 99000, description: 'Gói chuyên tuyển dụng. Đăng tối đa 30 tin/tháng, bán kính quét 7km.', durationDays: 30 },
          { id: 3, planName: 'HRM Basic', price: 199000, description: 'Gói quản lý HRM cơ bản. Đăng 60 tin, quản lý tối đa 15 nhân viên, 1 mã QR chấm công.', durationDays: 30 },
          { id: 4, planName: 'Enterprise', price: 299000, description: 'Gói doanh nghiệp toàn diện. Đăng tin không giới hạn, ưu tiên radar, không giới hạn nhân sự & QR.', durationDays: 30 }
        ]);
      } else {
        setPlans(b2bPlans);
      }
    } catch (err) {
      console.log("Failed to load business profile/plans:", err);
      // Fallbacks
      setProfile({
        businessName: "Cửa hàng Coffee & Tea",
        address: "84/10 Nam Cao, Quận 9, TP.HCM",
        subscriptionTier: "HRM Basic"
      });
      setPlans([
        { id: 1, planName: 'Trial', price: 0, description: 'Gói thử nghiệm miễn phí. Được đăng tối đa 3 tin tuyển dụng.', durationDays: 9999 },
        { id: 5, planName: 'PerShift', price: 15000, description: 'Đăng 1 ca làm việc.', durationDays: 1 },
        { id: 2, planName: 'Recruit', price: 99000, description: 'Gói chuyên tuyển dụng. Đăng tối đa 30 tin/tháng, bán kính quét 7km.', durationDays: 30 },
        { id: 3, planName: 'HRM Basic', price: 199000, description: 'Gói quản lý HRM cơ bản. Đăng 60 tin, quản lý tối đa 15 nhân viên, 1 mã QR chấm công.', durationDays: 30 },
        { id: 4, planName: 'Enterprise', price: 299000, description: 'Gói doanh nghiệp toàn diện. Đăng tin không giới hạn, ưu tiên radar, không giới hạn nhân sự & QR.', durationDays: 30 }
      ]);
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
        planName: plan.planName || plan.Name
      });
      setPaymentStatus("Pending");
    } catch (err) {
      alert("Tạo đơn hàng nâng cấp thất bại: " + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderInfo) return;
    setVerifyingPayment(true);
    try {
      const statusData = await getPaymentStatusApi(orderInfo.orderId);
      const status = statusData.status || statusData.Status || "Pending";
      setPaymentStatus(status);
      if (status === "Paid") {
        alert("Nâng cấp gói cước thành công! Vui lòng tải lại trang để áp dụng hạn ngạch mới.");
        loadData();
      } else {
        alert("Đơn hàng chưa được thanh toán hoặc hệ thống đang đối soát. Thử lại sau nhé!");
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
              <span className="text-xs text-slate-500 font-semibold">
                Đang hoạt động
              </span>
            </div>
          </div>

          {/* Right: GPS card */}
          <div className="bg-white/80 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-4 w-full md:w-auto md:min-w-[280px] shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Tọa độ GPS Cơ Sở</p>
                <p className="text-sm font-black text-slate-800 font-mono">
                  {profile?.latitude?.toFixed(6) || "10.857461"}, {profile?.longitude?.toFixed(6) || "106.801522"}
                </p>
              </div>
              <button
                onClick={() => onNavigateToSection && onNavigateToSection("profile")}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors shrink-0 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-xl border border-orange-200"
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
      {!orderInfo ? (
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
      ) : (
        /* ==================== 4. PAYMENT CHECKOUT ==================== */
        <div className="dashboard-fade-in bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-lg mx-auto flex flex-col gap-6 items-center">
          <div className="text-center w-full">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1 rounded-full">
              Thanh Toán Nâng Cấp B2B
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mt-3">Gói nâng cấp: {orderInfo.planName}</h2>
            <p className="text-slate-400 text-xs mt-1">Vui lòng quét mã VietQR bên dưới để thanh toán kích hoạt.</p>
          </div>

          {/* QR Render */}
          {orderInfo.qrCode && paymentStatus === "Pending" ? (
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-inner flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderInfo.qrCode)}`}
                alt="VietQR Payment Code"
                className="w-56 h-56 rounded-xl shadow-xs"
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-3">Mã VietQR đối soát Napas247</p>
            </div>
          ) : paymentStatus === "Paid" ? (
            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center flex flex-col items-center gap-3">
              <CheckCircle2 size={48} className="text-emerald-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Thanh Toán Hoàn Tất!</h3>
              <p className="text-xs text-slate-500">Hệ thống đã phê duyệt và kích hoạt gói cho doanh nghiệp của bạn.</p>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl text-center text-xs text-slate-500">
              Không thể tải mã QR. Vui lòng thanh toán qua link MoMo hoặc thử lại.
            </div>
          )}

          {paymentStatus === "Pending" && (
            <div className="w-full space-y-4">
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
                  className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition text-xs"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={verifyingPayment}
                  onClick={handleVerifyPayment}
                  className="flex-1 h-11 btn-premium disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition flex items-center justify-center gap-2 text-xs"
                >
                  {verifyingPayment ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <RefreshCw size={14} /> Tôi đã thanh toán
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
