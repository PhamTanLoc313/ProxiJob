import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Phone, Briefcase, RefreshCw, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
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
    setFullName(emp.name || "");
    setPhone(emp.phone || "");
    setRole(emp.role || "");
    setEmployeeType(emp.employeeType || "Internal");
    setSalaryPerHour(emp.salaryPerHour || 25000);
    setStatus(emp.status || "Active");
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
    const type = (emp.employeeType || "").toLowerCase();
    if (filterRole === "internal") return type === "internal";
    if (filterRole === "student") return type === "external";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      {/* 1. Header Area */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quản Lý Nhân Sự (HRM Panel)</h1>
          <p className="text-slate-400 text-xs mt-0.5">Quản lý hồ sơ nhân viên cố định và giám sát lao động vãng lai.</p>
        </div>

        {/* Tab Filter & Actions */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setFilterRole("all")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filterRole === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterRole("internal")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filterRole === "internal" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Nhân sự nội bộ
            </button>
            <button
              onClick={() => setFilterRole("student")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filterRole === "student" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Nhân sự vãng lai
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
             className="flex items-center gap-1 text-xs font-black bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white px-4 py-2 rounded-2xl shadow-md transition"
          >
            <Plus size={14} /> Thêm nhân viên 👤
          </button>
        </div>
      </div>

      {/* 2. Staff grid list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent mb-4" />
          <p className="text-slate-400 text-xs font-semibold">Đang tải danh sách hồ sơ nhân sự...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border text-center">
          <RefreshCw className="text-slate-300 mb-3" size={36} />
          <p className="text-slate-800 font-bold text-sm">Danh sách nhân viên trống</p>
          <p className="text-slate-400 text-xs mt-1">Chưa có nhân sự nào trong bộ lọc này.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((emp) => {
            const isInternal = (emp.employeeType || emp.EmployeeType || "Internal").toLowerCase() === "internal";
            return (
              <article
                key={emp.id}
                className="bg-white border border-slate-100 hover:border-orange-200 rounded-3xl p-5 shadow-md hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-full border flex items-center justify-center font-bold">
                        {isInternal ? "👔" : "⚡"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1">{emp.name || emp.Name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Vai trò: {emp.role || emp.Role}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      isInternal ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {isInternal ? "Nội bộ" : "Vãng lai"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" /> {emp.phone || emp.Phone || "Không có số"}
                    </p>
                    <p className="flex items-center gap-1.5 font-bold text-slate-700">
                      💰 Lương: {emp.salaryPerHour?.toLocaleString()} đ / giờ
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 flex justify-between items-center text-xs">
                  <span className={`text-[10px] uppercase font-extrabold ${emp.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}>
                    ● {emp.status === "Active" ? "Đang trực" : "Nghỉ việc"}
                  </span>
                  
                  {isInternal ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 italic">Được liên kết tự động</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                  👤 {isEditing ? "Cập nhật nhân viên" : "Thêm nhân sự mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>

              {/* Full name & Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ tên đầy đủ..."
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
                />
              </div>

              {/* Role & Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Vai trò</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Phục vụ, pha chế..."
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Lương/giờ (VND)</label>
                  <input
                    type="number"
                    required
                    value={salaryPerHour}
                    onChange={(e) => setSalaryPerHour(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Employee Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Loại nhân sự</label>
                  <select
                    value={employeeType}
                    onChange={(e) => setEmployeeType(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 transition cursor-pointer"
                  >
                    <option value="Internal">Cố định (Internal)</option>
                    <option value="External">Ca lẻ (External)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 transition cursor-pointer"
                  >
                    <option value="Active">Đang làm</option>
                    <option value="Inactive">Thôi việc</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-600/10 transition mt-2"
              >
                {isEditing ? "Cập nhật hồ sơ" : "Xác nhận thêm nhân viên"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
