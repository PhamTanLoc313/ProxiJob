import { useState, useEffect } from "react";
import { ArrowLeft, Clock, MapPin, DollarSign, Calendar, Star, Send, ShieldAlert, Award, FileText, CheckCircle } from "lucide-react";
import { getJobPostById, applyToShiftApi } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

const getCategoryTheme = (categoryName) => {
  const name = (categoryName || "").toLowerCase();

  if (name.includes("giao hàng") || name.includes("delivery") || name.includes("shipper")) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      accent: "#EF4444",
      accentBg: "#FFE4E6",
      borderLight: "#F87171"
    };
  }
  if (name.includes("gia sư") || name.includes("tutor") || name.includes("dạy") || name.includes("học")) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
      accent: "#2563EB",
      accentBg: "#DBEAFE",
      borderLight: "#60A5FA"
    };
  }
  if (name.includes("sửa chữa") || name.includes("repair") || name.includes("bảo trì") || name.includes("kỹ thuật")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-300",
      accent: "#F59E0B",
      accentBg: "#FEF3C7",
      borderLight: "#FBBF24"
    };
  }
  if (name.includes("phục vụ") || name.includes("waiter") || name.includes("chạy bàn") || name.includes("phụ vụ") || name.includes("cafe") || name.includes("cà phê")) {
    return {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
      accent: "#8B5CF6",
      accentBg: "#F3E8FF",
      borderLight: "#C084FC"
    };
  }
  if (name.includes("thú cưng") || name.includes("pet")) {
    return {
      bg: "bg-pink-100",
      text: "text-pink-700",
      border: "border-pink-300",
      accent: "#EC4899",
      accentBg: "#FCE7F3",
      borderLight: "#F472B6"
    };
  }
  return {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-300",
    accent: "#0D9488",
    accentBg: "#CCFBF1",
    borderLight: "#2DD4BF"
  };
};

const checkIsEmergency = (title, description) => {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();
  return (
    t.includes("khần cấp") ||
    t.includes("khấn cấp") ||
    t.includes("khẩn cấp") ||
    t.includes("tuyển gấp") ||
    t.includes("gấp") ||
    d.includes("khần cấp") ||
    d.includes("khấn cấp") ||
    d.includes("khẩn cấp") ||
    d.includes("tuyển gấp") ||
    d.includes("gấp")
  );
};

const getShopBgColor = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return '#EFF6FF';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#FFE4E6', '#FEF3C7', '#ECFDF5', '#EFF6FF', '#F5F3FF', '#FFF7ED'];
  return colors[charCode % colors.length];
};

const getShopTextColor = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return '#2563EB';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#E11D48', '#D97706', '#059669', '#2563EB', '#7C3AED', '#EA580C'];
  return colors[charCode % colors.length];
};

const getCategoryInitials = (categoryName) => {
  if (!categoryName) return 'PJ';
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };
  const clean = removeAccents(categoryName).trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'PJ';
};

const getShopInitials = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return 'PJ';
  const cleanName = shopName.replace(/(Coffee|Tea|Restaurant|Store|Shop|Quán|Café|Cửa hàng|Doanh nghiệp)/gi, '').trim();
  if (!cleanName) return 'PJ';
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).substring(0, 2).toUpperCase();
  }
  return cleanName.substring(0, 2).toUpperCase();
};

const getRemainingSlots = (shift) => {
  if (!shift) return 0;
  return shift.remainingSlots !== undefined ? shift.remainingSlots : (shift.RemainingSlots !== undefined ? shift.RemainingSlots : 0);
};

const getSlots = (shift) => {
  if (!shift) return 0;
  return shift.slots !== undefined ? shift.slots : (shift.Slots !== undefined ? shift.Slots : 0);
};

const getShiftStartTime = (shift) => {
  if (!shift) return '';
  return shift.startTime !== undefined ? shift.startTime : (shift.StartTime !== undefined ? shift.StartTime : '');
};

const getShiftEndTime = (shift) => {
  if (!shift) return '';
  return shift.endTime !== undefined ? shift.endTime : (shift.EndTime !== undefined ? shift.EndTime : '');
};

const formatTimeVN = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

const formatDateVN = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${weekday}, ${day} tháng ${month}, ${year}`;
  } catch (e) {
    return '';
  }
};

const getSalary = (job) => {
  if (!job) return 0;
  let val = job.salary !== undefined ? job.salary : (job.Salary !== undefined ? job.Salary : 0);
  if (val <= 0 && Array.isArray(job.shifts) && job.shifts.length > 0) {
    const shiftSalaries = job.shifts.map(s => s.salary !== undefined ? s.salary : (s.Salary !== undefined ? s.Salary : 0)).filter(s => s > 0);
    if (shiftSalaries.length > 0) {
      val = Math.min(...shiftSalaries);
    }
  }
  return val;
};

export default function JobDetail({ jobId, shiftId, onBack, onNavigateToCalendar }) {
  const { user } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [introduction, setIntroduction] = useState("");
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getJobPostById(jobId)
      .then((data) => {
        setJob(data);
        if (data && Array.isArray(data.shifts) && data.shifts.length > 0) {
          const targetShift = shiftId
            ? data.shifts.find(s => s.id === shiftId || s.Id === shiftId)
            : data.shifts[0];
          setSelectedShift(targetShift || data.shifts[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to load job details:", err);
        setLoading(false);
      });
  }, [jobId, shiftId]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Vui lòng đăng nhập để ứng tuyển.");
      return;
    }
    if (!selectedShift) return;

    setApplying(true);
    setErrorMsg("");

    try {
      // In mobile, applyToShiftApi takes: shiftId, studentId, introduction, createdBy
      await applyToShiftApi(selectedShift.id, user.id, introduction || "Em xin ứng tuyển vào ca làm này.");
      setSuccess(true);
      toast.success("Ứng tuyển thành công! Roster của bạn đã được cập nhật. 🎉");
      setTimeout(() => {
        setSuccess(false);
        setIsApplyModalOpen(false);
        setIntroduction("");
        if (onNavigateToCalendar) {
          onNavigateToCalendar();
        }
      }, 1800);
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("hết lượt") || msg.includes("limit") || msg.includes("quota")) {
        setQuotaModalVisible(true);
      } else {
        setErrorMsg(err.message || "Không thể ứng tuyển vào ca làm. Vui lòng thử lại.");
        toast.error(err.message || "Không thể ứng tuyển vào ca làm. Vui lòng thử lại.");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải thông tin chi tiết công việc...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl border border-slate-100 shadow-md text-center max-w-2xl mx-auto mt-10">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <p className="text-slate-800 font-bold text-lg">Không tìm thấy ca làm việc!</p>
        <p className="text-slate-400 text-xs mt-1 mb-6">Mã tin tuyển dụng không hợp lệ hoặc đã bị gỡ.</p>
        <button
          onClick={onBack}
          className="px-6 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const shifts = Array.isArray(job.shifts) ? job.shifts : [];
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const companyName = job.companyName || job.company || "Cửa hàng tuyển dụng";

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-2xl hover:bg-slate-50 transition"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Job Header and details */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Job Overview Card */}
          <div className="bg-white border border-slate-100 shadow-lg shadow-slate-900/5 rounded-3xl p-6">
            <style>{`
              @keyframes badgePulse {
                0%, 100% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.05); opacity: 1; }
              }
              .urgent-badge-pulse {
                animation: badgePulse 1.2s infinite ease-in-out;
              }
            `}</style>

            <div className="flex items-start gap-4">
              {/* Company Avatar */}
              <div
                style={{ backgroundColor: getShopBgColor(companyName), color: getShopTextColor(companyName) }}
                className="font-extrabold flex items-center justify-center rounded-2xl w-14 h-14 shrink-0 border border-slate-200/50 text-lg shadow-sm"
              >
                {getCategoryInitials(job.categoryName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getCategoryTheme(job.categoryName).bg} ${getCategoryTheme(job.categoryName).text} border ${getCategoryTheme(job.categoryName).border}`}>
                    {job.categoryName || "Part-time"}
                  </span>
                  {checkIsEmergency(job.title, job.description) && (
                    <span className="text-[10px] font-black tracking-wide uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full urgent-badge-pulse flex items-center gap-0.5">
                      🔥 TUYỂN GẤP
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black mt-2 text-slate-800 tracking-tight leading-tight">
                  {job.title}
                </h1>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{companyName}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                <MapPin className="text-slate-500 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Địa chỉ</p>
                  <p className="text-xs text-slate-700 font-bold mt-0.5 line-clamp-1">{job.address || "Quận 1, TP.HCM"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                <DollarSign className="text-emerald-500 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Lương cơ bản</p>
                  <p className="text-xs text-emerald-600 font-black mt-0.5">
                    {getSalary(job) > 0
                      ? `${getSalary(job).toLocaleString('vi-VN')} đ / giờ`
                      : "Lương thỏa thuận"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6">
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">Mô tả công việc</h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.description || "Chưa có mô tả chi tiết từ nhà tuyển dụng."}
            </div>

            <h2 className="font-extrabold text-slate-800 text-lg mt-6 mb-3">Yêu cầu công việc</h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.requirements || "Làm việc nghiêm túc, đúng giờ, có trách nhiệm."}
            </div>

            {skills.length > 0 && (
              <>
                <h2 className="font-extrabold text-slate-800 text-lg mt-6 mb-3">Kỹ năng yêu cầu</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl"
                    >
                      🛠️ {skill.name || skill}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Shifts Card Deleted */}
        </div>

        {/* Right Side: Quick info about store rating / pricing package */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Apply Now Box */}
          <div className="bg-white border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-4">
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider text-center">Ứng tuyển công việc</h4>
            {selectedShift ? (
              <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold uppercase">Ca làm:</span>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${getRemainingSlots(selectedShift) <= 0 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                    {getRemainingSlots(selectedShift) <= 0 ? "Đã Hết Slots" : `Còn ${getRemainingSlots(selectedShift)}/${getSlots(selectedShift)} Slot`}
                  </span>
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  {formatTimeVN(getShiftStartTime(selectedShift))} - {formatTimeVN(getShiftEndTime(selectedShift))}
                </p>
                <p className="text-slate-500 font-medium">
                  🗓️ {formatDateVN(getShiftStartTime(selectedShift)) || "Hôm nay"}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center">Không có ca làm trống</p>
            )}
            <button
              type="button"
              disabled={!selectedShift || getRemainingSlots(selectedShift) <= 0}
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-600/15 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              🚀 Ứng tuyển ngay
            </button>
          </div>

          {/* Store Profile Card */}
          <div className="bg-white border border-slate-100 shadow-lg rounded-3xl p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              🏪
            </div>
            <h3 className="font-extrabold text-slate-800 text-base mt-4 line-clamp-1">{companyName}</h3>
            <p className="text-xs text-slate-400 font-semibold">{job.address || "Quận 1, TP.HCM"}</p>

            <div className="mt-5 border-t border-slate-50 pt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Đánh giá quán</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-sm font-bold text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span>4.8</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Tỷ lệ thanh toán</p>
                <p className="text-sm font-bold text-emerald-600 mt-1">98%</p>
              </div>
            </div>
          </div>

          {/* Secure guidelines */}
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
            <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2">
              <Award size={16} /> Cam kết Bảo Chứng
            </h4>
            <ul className="mt-3 text-xs text-orange-700 space-y-2 leading-relaxed">
              <li>• <strong>Không qua môi giới:</strong> Bạn trao đổi làm việc trực tiếp 1-1 với chủ quán.</li>
              <li>• <strong>Điểm danh bằng GPS:</strong> Hệ thống dùng toạ độ để ghi nhận giờ công chuẩn xác.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Application Sheet / Modal popup */}
      {isApplyModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {success ? (
              <div className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle size={36} />
                </div>
                <h3 className="font-black text-xl text-slate-800">Ứng tuyển thành công!</h3>
                <p className="text-slate-500 text-sm">
                  Đơn ứng tuyển đã được gửi đi. Lịch làm việc sẽ hiển thị tại mục Lịch Roster khi được chủ quán duyệt.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h3 className="font-black text-lg text-slate-800">Thông tin ứng tuyển</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      setIntroduction("");
                      setErrorMsg("");
                    }}
                    className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
                  <p className="text-slate-400 font-semibold">CA TRỰC ĐÃ CHỌN:</p>
                  <p className="font-bold text-slate-800 text-sm">{job.title}</p>
                  <p className="text-slate-600 font-medium">Lương: {(getSalary(job) || 0).toLocaleString('vi-VN')} đ/giờ</p>
                  <p className="text-orange-600 font-bold">
                    Giờ: {formatTimeVN(getShiftStartTime(selectedShift))} - {formatTimeVN(getShiftEndTime(selectedShift))}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-400" /> Thư giới thiệu (Không bắt buộc)
                  </label>
                  <textarea
                    rows={4}
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    placeholder="Ví dụ: Em đã có kinh nghiệm làm phục vụ 6 tháng, tác phong nhanh nhẹn và mong muốn được làm việc ca này ạ."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 border border-red-200 rounded-xl">
                    ⚠️ {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={applying}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition flex items-center justify-center gap-2 text-sm"
                >
                  {applying ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send size={16} /> Xác nhận ứng tuyển ca trực
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Quota Modal popup */}
      {quotaModalVisible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-4 block">📈</span>
            <h3 className="font-black text-lg text-slate-800">Hết lượt ứng tuyển miễn phí!</h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Tài khoản miễn phí của bạn đã đạt giới hạn ứng tuyển trong ngày. Vui lòng nâng cấp tài khoản Premium của sinh viên để ứng tuyển không giới hạn ca.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setQuotaModalVisible(false);
                  setSelectedShift(null);
                  if (onNavigateToCalendar) onNavigateToCalendar(); // or open portfolio/upgrade tab
                }}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition"
              >
                Nâng cấp Premium ⚡
              </button>
              <button
                onClick={() => setQuotaModalVisible(false)}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
