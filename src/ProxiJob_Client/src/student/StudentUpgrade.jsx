import { useState, useEffect } from "react";
import { getPlansApi, purchasePlanApi, getPaymentStatusApi } from "../api/auth";
import { Star, ShieldCheck, CheckCircle2, ChevronRight, Clock, ArrowLeft, Receipt, Landmark, X, ExternalLink } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

export default function StudentUpgrade() {
  const { user } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [countdown, setCountdown] = useState("23:59:59");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!orderInfo || !orderInfo.expiresAt) return;
    const timer = setInterval(() => {
      const diff = new Date(orderInfo.expiresAt) - new Date();
      if (diff <= 0) {
        setCountdown("00:00:00");
        setPaymentStatus("Expired");
        clearInterval(timer);
      } else {
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setCountdown(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [orderInfo]);

  // Auto-polling payment status every 2.5s
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
          toast.success("Giao dịch thành công! Tài khoản của bạn đã được cộng thêm 10 lượt ứng tuyển. 🎉");
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
        toast.success("Giao dịch thành công! Tài khoản của bạn đã được cộng thêm 10 lượt ứng tuyển. 🎉");
      } else if (e.data?.type === 'PAYOS_CANCEL') {
        setPaymentStatus("Cancelled");
        toast.error("Đơn hàng đã bị hủy.");
      }
    };
    window.addEventListener("message", handleMessage);

    return () => { alive = false; clearInterval(iv); window.removeEventListener("message", handleMessage); };
  }, [orderInfo, paymentStatus]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const data = await getPlansApi();
      const rawPlans = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.items))
          ? data.items
          : (data && data.data && Array.isArray(data.data.items))
            ? data.data.items
            : (data && data.data && Array.isArray(data.data))
              ? data.data
              : [];

      const formattedPlans = rawPlans.map(plan => ({
        id: plan.id ?? plan.Id,
        planName: plan.planName ?? plan.name ?? plan.Name,
        price: plan.price ?? plan.Price,
        description: plan.description ?? plan.Description,
        durationDays: plan.durationDays ?? plan.DurationDays
      }));

      setPlans(formattedPlans.filter(p => p.planName === 'Student10'));
    } catch (err) {
      toast.error("Không thể tải thông tin gói cước sinh viên từ hệ thống.");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const handlePurchase = async (plan) => {
    setPurchasing(true);
    try {
      const res = await purchasePlanApi(plan.id);
      setOrderInfo({ ...res, planName: plan.planName || 'Student10' });
      setPaymentStatus("Pending");
    } catch (err) {
      toast.error("Tạo đơn hàng thất bại: " + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  // ============ RENDER ============
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 max-w-7xl mx-auto min-h-screen">

      {/* ==================== PLAN SELECTION ==================== */}
      {!orderInfo ? (
        <>
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-950/10">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 -mb-14 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-extrabold tracking-widest bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full">
                ⚡ UPGRADE MEMBERSHIP
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">Nâng Cấp Gói Ứng Tuyển Premium</h1>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Gia tăng số lượt nộp hồ sơ xin việc, nhận quyền lợi ưu tiên duyệt từ Chủ cửa hàng.
              </p>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-12">
            <div className="md:col-span-8 bg-white border border-slate-100 shadow-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full self-start">
                Mở rộng tính năng ứng tuyển
              </span>

              {loadingPlans ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-4" />
                  <p className="text-slate-400 text-xs">Đang tải danh sách các gói cước...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-slate-100 hover:border-orange-200 hover:bg-orange-50/10 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-xs hover:shadow-md">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                          Gói {plan.planName || 'Student10'}
                          <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold uppercase">Bán Chạy</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">{plan.description}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase flex items-center gap-1">⏱️ {plan.durationDays} ngày hiệu lực</p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-3 shrink-0 w-full sm:w-auto">
                        <p className="font-black text-2xl text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-3.5 py-1 rounded-xl">{(plan.price || 10000).toLocaleString()} đ</p>
                        <button type="button" disabled={purchasing} onClick={() => handlePurchase(plan)} className="w-full sm:w-auto px-5 h-10 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          Nâng cấp ngay <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Benefits sidebar */}
            <div className="md:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-orange-100 shadow-md shadow-orange-500/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-5">
              <h3 className="font-extrabold text-orange-950 text-sm flex items-center gap-2">
                <Star size={16} fill="currentColor" className="text-orange-500" /> Quyền lợi hội viên
              </h3>
              <ul className="text-xs text-orange-900 space-y-4 leading-relaxed font-semibold">
                <li className="flex items-start gap-2.5"><span className="text-lg leading-none">🚀</span><span>Tăng giới hạn ứng tuyển lên thêm 10 lượt chất lượng cao.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-lg leading-none">🎖️</span><span>Hồ sơ E-Portfolio được hiển thị ưu tiên trên danh sách chờ duyệt của chủ quán.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-lg leading-none">🔔</span><span>Nhận thông báo ưu tiên khi có ca làm lương cao gần bạn nhất.</span></li>
              </ul>
            </div>
          </div>
        </>
      ) : (

        /* ==================== PAYMENT CHECKOUT ==================== */
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 w-full animate-fade-in">

          {/* ===== PAID SUCCESS ===== */}
          {paymentStatus === "Paid" ? (
            <div className="relative overflow-hidden bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.12)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-lg mx-auto w-full flex flex-col items-center text-center gap-5 sm:gap-6 animate-scale-up">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-emerald-50/40 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 my-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-100/80">
                  <CheckCircle2 size={36} strokeWidth={2.5} className="animate-bounce" />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">Thành công</span>
              </div>

              <div className="relative z-10 space-y-2 max-w-sm">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Thanh Toán Hoàn Tất! 🎉</h2>
                <p className="text-slate-600 font-medium text-xs leading-relaxed">
                  Hệ thống đã phê duyệt & kích hoạt gói <span className="font-extrabold text-orange-600">{orderInfo.planName}</span>. Tài khoản của bạn đã được cộng thêm <span className="font-extrabold text-emerald-600">10 lượt ứng tuyển</span>.
                </p>
              </div>

              <div className="relative z-10 w-full bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 sm:p-4 text-xs space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/40">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Mã đơn hàng</span>
                  <span className="text-slate-800 font-black font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">{orderInfo.orderCode || orderInfo.orderId}</span>
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

              <div className="relative z-10 w-full pt-2">
                <button type="button" onClick={() => setOrderInfo(null)} className="w-full h-11 sm:h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>Khám Phá Ca Làm Ngay</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (

            /* ===== PENDING CHECKOUT ===== */
            <div className="relative">
              {/* Top nav */}
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <button type="button" onClick={() => setOrderInfo(null)} className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer bg-white hover:bg-slate-50 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> Bảo mật
                </span>
              </div>

              {/* 2-col on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

                {/* LEFT: Payment area */}
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
                      {paymentStatus === "Pending" && (
                        <div className="bg-orange-500/15 border border-orange-500/30 text-orange-400 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black flex items-center gap-1 sm:gap-1.5">
                          <Clock size={10} className="animate-pulse" />
                          <span className="font-mono">{countdown}</span>
                        </div>
                      )}
                    </div>

                    {/* Content: Always show embedded PayOS iframe centered with tuned width & height */}
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
                        {/* Extra help link for mobile users */}
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
                    ) : paymentStatus !== "Pending" ? (
                      <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '250px' }}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <X size={22} className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 font-bold">Đơn hàng đã hết hạn hoặc bị hủy</p>
                        <button type="button" onClick={() => setOrderInfo(null)} className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer transition">Tạo đơn mới</button>
                      </div>
                    ) : (
                      <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3" style={{ minHeight: '250px' }}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <X size={22} className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 font-bold">Không có link thanh toán</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Order sidebar — shows first on mobile */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 sm:gap-4 order-1 lg:order-2">
                  {/* Order details card */}
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
                        <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Lượt ứng tuyển</span>
                        <span className="text-emerald-600 font-black text-xs">+10 lượt</span>
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

                  {/* Waiting status card */}
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

                  {/* Security badges */}
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

                  {/* Cancel */}
                  <button type="button" onClick={() => setOrderInfo(null)} className="w-full h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl sm:rounded-2xl font-bold transition text-xs cursor-pointer flex items-center justify-center gap-1.5">
                    <X size={13} /> Hủy & quay lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
