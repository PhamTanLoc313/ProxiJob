import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Phone, Briefcase, RefreshCw, UserCheck, ShieldAlert,
  Sparkles, Users, Zap, Wallet, Building2, UserPlus, Check, X, ShieldCheck
} from "lucide-react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api/management";
import { useAuth } from "../auth/AuthContext";

export default function EmployerHRM() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all"); // all | internal | student

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Phục vụ");
  const [employeeType, setEmployeeType] = useState("Internal"); // Internal (cố định) | External (ca lẻ)
  const [salaryPerHour, setSalaryPerHour] = useState(25000);
  const [status, setStatus] = useState("Active");

  const fetchStaff = () => {
    if (!user) return;
    setLoading(true);
    getEmployees()
      .then((data) => {
        const list = data?.items || (Array.isArray(data) ? data : []);
        setStaff(list);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to load staff:", err);
        setStaff([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: fullName,
        phone,
        role,
        employeeType, // 'Internal' or 'External'
        salaryPerHour: Number(salaryPerHour),
        status,
        businessId: user.id
      };

      if (isEditing) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }

      setModalOpen(false);
      resetForm();
      fetchStaff();
      alert(isEditing ? "Đã cập nhật thông tin nhân viên!" : "Đã thêm nhân viên thành công!");
    } catch (err) {
      alert("Lỗi lưu thông tin nhân viên: " + err.message);
    }
  };

  const handleEditClick = (emp) => {
    setIsEditing(true);
    setEditingId(emp.id);
    setFullName(emp.name || emp.Name || "");
    setPhone(emp.phone || emp.Phone || "");
    setRole(emp.role || emp.Role || "");
    setEmployeeType(emp.employeeType || emp.EmployeeType || "Internal");
    setSalaryPerHour(emp.salaryPerHour || emp.SalaryPerHour || 25000);
    setStatus(emp.status || emp.Status || "Active");
    setModalOpen(true);
  };

  const handleDeleteClick = async (empId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thôi việc nhân viên này?")) return;
    try {
      await deleteEmployee(empId);
      fetchStaff();
    } catch (err) {
      alert(err.message || "Lỗi xóa nhân viên.");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFullName("");
    setPhone("");
    setRole("Phục vụ");
    setEmployeeType("Internal");
    setSalaryPerHour(25000);
    setStatus("Active");
  };

  const filteredStaff = staff.filter((emp) => {
    const type = (emp.employeeType || emp.EmployeeType || "").toLowerCase();
    if (filterRole === "internal") return type === "internal";
    if (filterRole === "student") return type === "external";
    return true;
  });

  const internalCount = staff.filter(e => (e.employeeType || e.EmployeeType || "").toLowerCase() === "internal").length;
  const externalCount = staff.filter(e => (e.employeeType || e.EmployeeType || "").toLowerCase() === "external").length;

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. PREMIUM HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="relative z-10 p-6 md:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Nhân Sự (HRM Panel)
              </h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">Quản lý hồ sơ nhân viên cố định và giám sát lao động vãng lai.</p>
            </div>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-1.5 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-orange-200/60 shadow-xs">
              <button
                onClick={() => setFilterRole("all")}
                className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all duration-300 ${
                  filterRole === "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                }`}
              >
                Tất cả ({staff.length})
              </button>
              <button
                onClick={() => setFilterRole("internal")}
                className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all duration-300 ${
                  filterRole === "internal"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                }`}
              >
                👔 Nội bộ ({internalCount})
              </button>
              <button
                onClick={() => setFilterRole("student")}
                className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all duration-300 ${
                  filterRole === "student"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                }`}
              >
                ⚡ Vãng lai ({externalCount})
              </button>
            </div>

            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="btn-premium text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Thêm nhân viên
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 2. QUICK METRICS ROW ==================== */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="stat-card-orange rounded-2xl p-5 border shadow-sm flex items-center justify-between card-hover-lift">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng nhân sự</p>
            <h3 className="text-3xl font-black text-orange-600 mt-1">{staff.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Đã được liên kết vào hệ thống</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-blue rounded-2xl p-5 border shadow-sm flex items-center justify-between card-hover-lift">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nhân sự nội bộ</p>
            <h3 className="text-3xl font-black text-blue-600 mt-1">{internalCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Nhân viên cố định hàng tháng</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Building2 size={22} />
          </div>
        </div>

        <div className="stat-card-emerald rounded-2xl p-5 border shadow-sm flex items-center justify-between card-hover-lift">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nhân sự vãng lai</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{externalCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Sinh viên đăng ký theo ca lẻ</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Zap size={22} />
          </div>
        </div>
      </div>

      {/* ==================== 3. STAFF GRID LIST ==================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-md">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
          <p className="text-slate-500 text-sm font-semibold">Đang tải danh sách hồ sơ nhân sự...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 text-center shadow-md">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Users className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-800 font-bold text-base">Danh sách nhân viên trống</p>
          <p className="text-slate-400 text-sm mt-2 max-w-sm">Chưa có nhân sự nào khớp với bộ lọc này. Bấm nút "Thêm nhân viên" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((emp) => {
            const empName = emp.name || emp.Name || "Nhân viên";
            const empRole = emp.role || emp.Role || "Phục vụ";
            const empPhone = emp.phone || emp.Phone || "Chưa cập nhật";
            const empSalary = emp.salaryPerHour || emp.SalaryPerHour || 0;
            const empStatus = emp.status || emp.Status || "Active";
            const isInternal = (emp.employeeType || emp.EmployeeType || "Internal").toLowerCase() === "internal";
            const empAvatar = emp.avatarUrl || emp.AvatarUrl || emp.avatar || emp.Avatar;

            const getInitials = (name) => {
              if (!name || name === "Nhân viên") return "NV";
              const words = name.trim().split(" ").filter(Boolean);
              if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
              return (words[0][0] + words[words.length - 1][0]).toUpperCase();
            };

            return (
              <article
                key={emp.id}
                className="group relative bg-white/80 backdrop-blur-sm border-2 border-slate-100 hover:border-orange-300 rounded-3xl p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between card-hover-lift"
              >
                <div>
                  {/* Top Bar: Avatar & Type Badge */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {empAvatar ? (
                        <img
                          src={empAvatar}
                          alt={empName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md uppercase tracking-wider shrink-0 ${
                            isInternal
                              ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
                              : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/20"
                          }`}
                        >
                          {getInitials(empName)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-slate-800 text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {empName}
                        </h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Briefcase size={12} className="text-slate-400" /> {empRole}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        isInternal
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {isInternal ? "Nội bộ" : "Vãng lai"}
                    </span>
                  </div>

                  {/* Employee Info Details */}
                  <div className="mt-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-400">
                        <Phone size={13} /> Số điện thoại:
                      </span>
                      <strong className="text-slate-700 font-bold">{empPhone}</strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-400">
                        <Wallet size={13} className="text-emerald-500" /> Mức lương:
                      </span>
                      <strong className="text-emerald-600 font-black text-sm">
                        {empSalary > 0 ? `${empSalary.toLocaleString()} đ/giờ` : "Lương thỏa thuận"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer Status & Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                      empStatus === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${empStatus === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {empStatus === "Active" ? "Đang làm" : "Thôi việc"}
                  </span>

                  {isInternal ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                        title="Sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(emp.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Xóa nhân viên"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" /> Tự động từ ca làm
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ==================== 4. ADD / EDIT EMPLOYEE MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <form onSubmit={handleSubmit} className="p-6 md:p-7 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                    <UserPlus size={18} className="text-white" />
                  </div>
                  <h3 className="font-black text-lg text-slate-800 tracking-tight">
                    {isEditing ? "Cập nhật nhân viên" : "Thêm nhân sự mới"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ tên đầy đủ..."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all"
                />
              </div>

              {/* Role & Salary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Vai trò / Chức danh</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Phục vụ, pha chế..."
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Lương/giờ (VND)</label>
                  <input
                    type="number"
                    required
                    value={salaryPerHour}
                    onChange={(e) => setSalaryPerHour(Number(e.target.value))}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Employee Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Loại nhân sự</label>
                  <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 flex items-center gap-2">
                    👔 Cố định (Internal)
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 font-bold transition-all cursor-pointer appearance-none"
                  >
                    <option value="Active">🟢 Đang làm</option>
                    <option value="Inactive">🔴 Thôi việc</option>
                  </select>
                </div>
              </div>

              {/* Informative Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 font-medium leading-relaxed flex items-start gap-2">
                <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mẹo:</strong> Form này chỉ dùng để tạo nhân sự cố định nội bộ. Các bạn sinh viên làm ca lẻ (vãng lai) sẽ tự động xuất hiện ở đây sau khi bạn <strong>Duyệt Đơn</strong> tại màn hình <em>Tin Đăng Tuyển</em>.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 btn-premium text-white rounded-2xl font-extrabold text-xs shadow-lg transition-all"
                >
                  {isEditing ? "Cập nhật hồ sơ" : "Thêm nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
