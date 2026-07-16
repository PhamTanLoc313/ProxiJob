import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, MapPin, AlertCircle, RefreshCw, XCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyApplications, cancelApplicationApi } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";

export default function StudentCalendar() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchApplications = () => {
    if (!user) return;
    setLoading(true);
    getMyApplications(user.id)
      .then((data) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to load applications:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const handleCancelClick = (app) => {
    setSelectedApp(app);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmittingCancel(true);
    try {
      // cancelApplicationApi takes: applicationId, businessId, note, updatedBy
      await cancelApplicationApi(selectedApp.id, selectedApp.businessId || 1, cancelReason || "Em bận lịch đột xuất.");
      setCancelModalOpen(false);
      setSelectedApp(null);
      setCancelReason("");
      fetchApplications(); // refresh
    } catch (err) {
      alert(err.message || "Không thể hủy lịch làm việc. Vui lòng liên hệ chủ quán.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "approved":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Đã duyệt (Chờ làm)</span>;
      case "pending":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Chờ duyệt</span>;
      case "completed":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">Đã hoàn thành</span>;
      case "cancelled":
      case "canceled":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200">Đã hủy</span>;
      case "rejected":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">Từ chối</span>;
      default:
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto min-h-screen">
      {/* 1. Header Row */}
      <div className="flex justify-between items-center bg-white border border-slate-100 shadow-md rounded-3xl p-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lịch Roster & Nhật Ký Ca Trực</h1>
          <p className="text-slate-400 text-xs mt-0.5">Theo dõi lịch làm việc đã duyệt và lịch sử ca trực của bạn.</p>
        </div>
        <button
          onClick={fetchApplications}
          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-2xl transition"
        >
          <RefreshCw size={18} className="text-slate-600" />
        </button>
      </div>

      {/* 2. Main list layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
          <p className="text-slate-500 text-sm font-semibold">Đang tải lịch trình ca trực của bạn...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-md text-center">
          <Calendar className="text-slate-300 mb-4" size={48} />
          <p className="text-slate-800 font-bold">Lịch roster đang trống</p>
          <p className="text-slate-400 text-xs mt-1">Bạn chưa đăng ký ca trực nào cả. Hãy tìm việc ngay thôi!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => {
            const dateObj = app.shiftDate ? new Date(app.shiftDate) : new Date();
            const weekday = dateObj.toLocaleDateString("vi-VN", { weekday: 'long' });
            const dayStr = dateObj.toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' });
            
            const isApproved = (app.status || "").toLowerCase() === "approved";
            const companyName = app.companyName || app.company || "Cửa hàng";

            return (
              <article
                key={app.id}
                className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 hover:border-orange-100 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Left Side: Date Calendar Icon and Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Calendar Sheet Visual */}
                  <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black uppercase text-orange-600">{weekday.split(' ')[1] || weekday}</span>
                    <span className="text-lg font-black text-slate-800 -mt-0.5">{dayStr}</span>
                  </div>

                  {/* Core details */}
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-extrabold text-slate-800 text-base">{app.jobTitle || "Ca làm việc"}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{companyName}</p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        <span>{app.shiftStartTime?.slice(0, 5)} - {app.shiftEndTime?.slice(0, 5)}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-600">
                        <DollarSign size={13} className="text-emerald-500" />
                        <span>{app.shiftSalary?.toLocaleString()} đ/giờ</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Badges & Actions */}
                <div className="flex sm:flex-row items-start sm:items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-0 pt-3 md:pt-0">
                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    {getStatusBadge(app.status)}
                    {app.appliedDate && (
                      <span className="text-[10px] text-slate-400">Ứng tuyển: {new Date(app.appliedDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {isApproved && (
                    <button
                      onClick={() => handleCancelClick(app)}
                      className="px-4 h-9 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl font-bold text-xs transition shrink-0"
                    >
                      Xin Nghỉ Ca 🚫
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Modal popup */}
      {cancelModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleCancelSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-black text-lg text-slate-800 text-red-600 flex items-center gap-2">
                  <AlertCircle size={20} /> Xác nhận xin nghỉ ca
                </h3>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
                <p className="text-slate-400 font-semibold">CA TRỰC XIN NGHỈ:</p>
                <p className="font-bold text-slate-800 text-sm">{selectedApp.jobTitle}</p>
                <p className="text-slate-600 font-semibold">{selectedApp.companyName || selectedApp.company}</p>
                <p className="text-red-500 font-bold">
                  Ngày trực: {new Date(selectedApp.shiftDate).toLocaleDateString()} ({selectedApp.shiftStartTime?.slice(0, 5)} - {selectedApp.shiftEndTime?.slice(0, 5)})
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Lý do xin nghỉ ca (Gửi chủ quán duyệt)</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cung cấp lý do chi tiết..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition"
                />
              </div>

              <p className="text-[10px] text-amber-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
                ⚠️ **Chú ý:** Việc tự ý hủy ca làm việc đã duyệt mà không có lý do chính đáng có thể làm giảm điểm uy tín E-Portfolio của bạn.
              </p>

              <button
                type="submit"
                disabled={submittingCancel}
                className="w-full h-11 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-red-600/10 transition flex items-center justify-center gap-2 text-sm"
              >
                {submittingCancel ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>Xác nhận hủy ca trực</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
