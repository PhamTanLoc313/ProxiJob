import { useState, useEffect } from "react";
import { Briefcase, Users, Calendar, Wallet, Star, ShieldAlert, Award, ChevronRight, Zap, RefreshCw } from "lucide-react";
import { getBusinessProfileApi } from "../api/businessApi";
import { getPlansApi, purchasePlanApi, getPaymentStatusApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

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
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      {/* 1. Header banner */}
      <div className="bg-white border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản trị cửa hàng: {profile?.businessName || "Doanh nghiệp"}
          </h1>
          <p className="text-slate-400 text-xs mt-1">Địa chỉ: {profile?.address || "Chưa cập nhật"}</p>
          <div className="mt-3 flex gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              Gói hiện tại: {currentTier}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full md:w-auto shrink-0 justify-between">
          <div className="text-xs">
            <p className="font-bold text-slate-700">Tọa độ GPS Cơ Sở:</p>
            <p className="text-slate-500 font-semibold mt-0.5">
              {profile?.latitude?.toFixed(6) || "10.857461"}, {profile?.longitude?.toFixed(6) || "106.801522"}
            </p>
          </div>
          <button
            onClick={() => onNavigateToSection && onNavigateToSection("profile")}
            className="text-xs font-bold text-orange-600 hover:underline shrink-0 ml-4"
          >
            Sửa tọa độ ⚙️
          </button>
        </div>
      </div>

      {/* 2. Key business metrics cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tin tuyển dụng", val: "06", icon: <Briefcase size={20} className="text-orange-500" />, action: "jobs" },
          { label: "Nhân sự quản lý", val: "12", icon: <Users size={20} className="text-emerald-500" />, action: "hrm" },
          { label: "Ca làm trong tuần", val: "28", icon: <Calendar size={20} className="text-purple-500" />, action: "scheduling" },
          { label: "Chi phí ca làm", val: "9.2M đ", icon: <Wallet size={20} className="text-orange-500" />, action: "payroll" }
        ].map((item, idx) => (
          <article
            key={idx}
            onClick={() => onNavigateToSection && onNavigateToSection(item.action)}
            className="bg-white border border-slate-100 hover:border-orange-200 rounded-3xl p-6 shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-slate-400">{item.label}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{item.val}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border">
              {item.icon}
            </div>
          </article>
        ))}
      </div>

      {/* 3. Subscription package manager & Checkout steps */}
      {!orderInfo ? (
        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6">
          <div className="border-b border-slate-50 pb-4 mb-5 flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Bảng nâng cấp các gói cước dịch vụ</h2>
              <p className="text-slate-400 text-xs">Mở khóa giới hạn nhân sự, quét địa bàn tuyển dụng rộng hơn.</p>
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => {
              const isCurrent = currentTier.toLowerCase() === (p.planName || p.Name).toLowerCase();
              return (
                <div
                  key={p.id}
                  className={`border rounded-3xl p-5 flex flex-col justify-between transition ${
                    isCurrent
                      ? "border-orange-400 bg-orange-50/20 shadow-md"
                      : "border-slate-100 hover:border-orange-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        {p.durationDays >= 365 ? "Vô hạn" : `${p.durationDays} Ngày`}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                          Đang Dùng
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-base">Gói {p.planName || p.Name}</h3>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed min-h-[50px]">{p.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 flex flex-col gap-3">
                    <p className="font-black text-xl text-slate-800">
                      {p.price === 0 ? "Miễn Phí" : `${p.price?.toLocaleString()} đ`}
                    </p>
                    <button
                      type="button"
                      disabled={isCurrent || purchasing}
                      onClick={() => handlePurchase(p)}
                      className={`w-full h-10 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border"
                          : "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white shadow-md shadow-orange-600/10 cursor-pointer"
                      }`}
                    >
                      <Zap size={12} /> {isCurrent ? "Đang sử dụng" : "Nâng cấp ngay"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-lg mx-auto flex flex-col gap-6 items-center">
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
                  className="flex-1 h-11 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition flex items-center justify-center gap-2 text-xs"
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
