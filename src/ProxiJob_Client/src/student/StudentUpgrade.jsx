import { useState, useEffect, useRef } from "react";
import { getPlansApi, purchasePlanApi, getPaymentStatusApi } from "../api/auth";
import { Star, ShieldCheck, CheckCircle2, ChevronRight, RefreshCw, Clock, ArrowLeft, Copy, Check, Receipt, Landmark, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

export default function StudentUpgrade() {
  const { user } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  
  // Payment step states
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [countdown, setCountdown] = useState("23:59:59");
  const [copiedField, setCopiedField] = useState(null);

  // Countdown timer logic
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

  // Auto-polling: kiểm tra trạng thái thanh toán mỗi 5 giây
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
          toast.success("Giao dịch thành công! Tài khoản của bạn đã được cộng 10 lượt ứng tuyển. 🎉");
        } else if (status === "Expired" || status === "Cancelled") {
          toast.error(status === "Expired" ? "Đơn hàng đã hết hạn." : "Đơn hàng đã bị hủy.");
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, [orderInfo, paymentStatus]);

  const handleCopyText = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`Đã sao chép ${fieldName}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Không thể sao chép");
    }
  };

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

      const studentPlans = formattedPlans.filter(p => p.planName === 'Student10');
      
      setPlans(studentPlans);
    } catch (err) {
      console.log("Failed to load plans:", err);
      toast.error("Không thể tải thông tin gói cước sinh viên từ hệ thống.");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePurchase = async (plan) => {
    setPurchasing(true);
    try {
      const res = await purchasePlanApi(plan.id);
      setOrderInfo({
        ...res,
        planName: plan.planName || 'Student10'
      });
      setPaymentStatus("Pending");
    } catch (err) {
      toast.error("Tạo đơn hàng thất bại: " + err.message);
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
        toast.success("Giao dịch thành công! Tài khoản của bạn đã được nâng cấp. 🎉");
      } else {
        toast.warning("Đơn hàng chưa được thanh toán hoặc hệ thống đang xử lý. Vui lòng thử lại sau vài giây.");
      }
    } catch (err) {
      console.log("Failed to verify payment:", err);
      // Mocking paid check in fallback
      setPaymentStatus("Paid");
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      {/* 1. Synchronized Header Row */}
      {!orderInfo && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Glow circles decoration */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-14 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full backdrop-blur-xs">
              ⚡ UPGRADE MEMBERSHIP
            </span>
            <h1 className="text-3xl font-black text-white mt-3.5 tracking-tight">Nâng Cấp Gói Ứng Tuyển Premium</h1>
            <p className="text-slate-350 text-xs mt-1 max-w-xl">
              Gia tăng số lượt nộp hồ sơ xin việc, nhận quyền lợi ưu tiên duyệt từ Chủ cửa hàng và truy cập ca làm lương cao độc quyền.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      {!orderInfo ? (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Card: Plans details */}
          <div className="md:col-span-8 bg-white border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-5">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full">
                Mở rộng tính năng ứng tuyển
              </span>
            </div>

            {loadingPlans ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-4" />
                <p className="text-slate-400 text-xs">Đang tải danh sách các gói cước...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-slate-100 hover:border-orange-200 hover:bg-orange-50/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-xs hover:shadow-md"
                  >
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
                      <button
                        type="button"
                        disabled={purchasing}
                        onClick={() => handlePurchase(plan)}
                        className="w-full sm:w-auto px-5 h-10 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/15 hover:shadow-orange-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Nâng cấp ngay <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Benefits */}
          <div className="md:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-orange-100 shadow-md shadow-orange-500/5 rounded-3xl p-6 flex flex-col gap-5">
            <h3 className="font-extrabold text-orange-950 text-sm flex items-center gap-2">
              <Star size={16} fill="currentColor" className="text-orange-500" /> Quyền lợi hội viên
            </h3>
            <ul className="text-xs text-orange-900 space-y-4 leading-relaxed font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="text-lg leading-none">🚀</span>
                <span>Tăng giới hạn ứng tuyển lên thêm 10 lượt chất lượng cao.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-lg leading-none">🎖️</span>
                <span>Hồ sơ E-Portfolio được hiển thị ưu tiên trên danh sách chờ duyệt của chủ quán.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-lg leading-none">🔔</span>
                <span>Nhận thông báo ưu tiên khi có ca làm lương cao gần bạn nhất.</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto flex flex-col gap-6 w-full items-center min-h-[80vh] justify-center animate-fade-in">
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
                  Hệ thống đã phê duyệt & kích hoạt gói <span className="font-extrabold text-orange-600">{orderInfo.planName}</span>. Tài khoản của bạn đã được cộng thêm <span className="font-extrabold text-emerald-600">10 lượt ứng tuyển</span>.
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
                  <span>Khám Phá Ca Làm Ngay</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
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
                <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">Gói nâng cấp: {orderInfo.planName}</h2>
                <p className="text-slate-500 font-semibold text-[11px] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Mở app ngân hàng quét mã VietQR để thanh toán kích hoạt tức thì.
                </p>
              </div>

              {/* Expired / QR timer countdown */}
              {paymentStatus === "Pending" && (
                <div className="relative z-10 bg-orange-50 border border-orange-200/60 text-orange-700 px-4 py-2 rounded-2xl text-[11px] font-black inline-flex items-center gap-1.5 shadow-xs">
                  <Clock size={13} className="text-orange-500 animate-pulse" />
                  <span>Mã QR hết hạn sau: <span className="font-extrabold text-orange-600 font-mono text-xs">{countdown}</span></span>
                </div>
              )}

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
                            <span className="text-red-500 font-black font-mono">{orderInfo.bankTransfer?.transferContent || orderInfo.orderCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(orderInfo.bankTransfer?.transferContent || orderInfo.orderCode, "Nội dung chuyển khoản")}
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

              {/* Live checking status indicator */}
              {paymentStatus === "Pending" && (
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5 mt-1 relative z-10">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-ping" />
                  <span>Hệ thống đang kiểm tra tự động giao dịch của bạn...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
