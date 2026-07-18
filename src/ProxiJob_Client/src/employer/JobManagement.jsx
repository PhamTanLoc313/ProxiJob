import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, Check, X, FileText, Briefcase, RefreshCw, Star, UserCheck, AlertTriangle } from "lucide-react";
import { getJobPostsByBusiness, createJobPost, createJobShift, getJobPostShifts, deleteJobPostApi, getApplicationsByShift, approveApplication, rejectApplication } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";

export default function JobManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts"); // posts | approvals
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Wizard Post State
  const [showWizard, setShowWizard] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [salary, setSalary] = useState(25000);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [address, setAddress] = useState("");
  const [shiftsInput, setShiftsInput] = useState([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);

  // Active expanded jobs/shifts
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobShifts, setJobShifts] = useState([]);
  const [selectedShiftForApprovals, setSelectedShiftForApprovals] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchJobs = () => {
    if (!user) return;
    setLoadingJobs(true);
    // employer businessId is parsed or default to user.id
    getJobPostsByBusiness(user.id)
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoadingJobs(false);
      })
      .catch((err) => {
        console.log("Failed to load business jobs:", err);
        setLoadingJobs(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const payload = {
        title,
        categoryId: Number(categoryId),
        salary: Number(salary),
        description,
        requirements,
        address: address || user.currentAddress || "Cơ sở cửa hàng",
        latitude: user.currentLatitude || 10.857461,
        longitude: user.currentLongitude || 106.801522,
        businessId: user.id
      };

      const newJob = await createJobPost(payload);
      const jobPostId = newJob.id;

      // Add shifts sequentially
      for (const shift of shiftsInput) {
        await createJobShift(jobPostId, {
          startTime: `${shift.startTime}:00`,
          endTime: `${shift.endTime}:00`,
          date: new Date(shift.date).toISOString(),
          slotsRequired: Number(shift.slotsRequired),
          salaryPerHour: Number(salary)
        });
      }

      alert("Đăng tin tuyển dụng thành công! ca làm đã được đưa lên radar.");
      setShowWizard(false);
      // Reset inputs
      setTitle("");
      setDescription("");
      setRequirements("");
      setShiftsInput([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
      fetchJobs();
    } catch (err) {
      alert("Đăng ca làm thất bại: " + err.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Ca làm liên kết cũng sẽ bị hủy.")) return;
    try {
      await deleteJobPostApi(jobId, user.id);
      fetchJobs();
      setSelectedJob(null);
    } catch (err) {
      alert(err.message || "Xóa tin tuyển dụng thất bại.");
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    try {
      const data = await getJobPostShifts(job.id);
      setJobShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      setJobShifts([]);
    }
  };

  const handleSelectShiftForApprovals = async (shift) => {
    setSelectedShiftForApprovals(shift);
    setLoadingApplicants(true);
    try {
      const data = await getApplicationsByShift(shift.id, user.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Failed to load applicants:", err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      await approveApplication(appId, user.id);
      alert("Đã duyệt ứng viên thành công!");
      if (selectedShiftForApprovals) {
        handleSelectShiftForApprovals(selectedShiftForApprovals);
      }
    } catch (err) {
      alert(err.message || "Lỗi duyệt đơn.");
    }
  };

  const handleReject = async (appId) => {
    try {
      await rejectApplication(appId, user.id);
      alert("Đã từ chối đơn ứng cử.");
      if (selectedShiftForApprovals) {
        handleSelectShiftForApprovals(selectedShiftForApprovals);
      }
    } catch (err) {
      alert(err.message || "Lỗi từ chối đơn.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      {/* 1. Header & Section Tab controls */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý Đăng Ca & Duyệt Tin</h1>
          <p className="text-slate-400 text-xs mt-0.5">Trình tạo ca làm tuyển dụng và phê duyệt ứng viên.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("posts")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              activeTab === "posts" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📂 Tin Đăng Tuyển
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              activeTab === "approvals" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 Duyệt Đơn ({applicants.length})
          </button>
        </div>
      </div>

      {/* 2. Main Tab views */}
      {activeTab === "posts" ? (
        <div className="grid gap-6 md:grid-cols-12">
          {/* List of Job Posts (Left side) */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-base">Tin tuyển dụng đang chạy</h2>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition"
              >
                <Plus size={14} /> Đăng ca làm mới ⚡
              </button>
            </div>

            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4" />
                <p className="text-slate-400 text-xs font-semibold">Đang tải danh sách ca tuyển dụng...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border text-center">
                <Briefcase className="text-slate-300 mb-3" size={36} />
                <p className="text-slate-800 font-bold text-sm">Chưa đăng ca làm việc nào</p>
                <p className="text-slate-400 text-xs mt-1">Bấm nút phía trên để đăng tuyển ca phục vụ, pha chế đầu tiên.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <article
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`p-5 bg-white border rounded-3xl cursor-pointer hover:border-blue-200 transition ${
                        isSelected ? "border-blue-500 shadow-md bg-blue-50/5" : "border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            {job.categoryName || "Đăng tin"}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm mt-2 line-clamp-1">{job.title}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{job.address || "Tại cửa hàng"}</p>
                          <p className="text-xs text-emerald-600 font-bold mt-2">Lương: {job.salary?.toLocaleString()}đ/giờ</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Job details and shifts list (Right side) */}
          <div className="md:col-span-6 bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-6">
            {!selectedJob ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 text-slate-400 h-full min-h-[300px]">
                <FileText size={48} className="text-slate-300 mb-3" />
                <h3 className="font-extrabold text-slate-700 text-sm">Chưa chọn tin tuyển dụng</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Bấm chọn một tin tuyển dụng bên trái để xem các ca làm việc và danh sách chi tiết.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-50 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-800 text-base">{selectedJob.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ID Tin tuyển dụng: #{selectedJob.id}</p>
                  </div>
                </div>

                {/* Description info */}
                <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-1">MÔ TẢ CÔNG VIỆC:</p>
                  <p>{selectedJob.description || "Không có mô tả."}</p>
                  <p className="font-bold text-slate-700 mt-3 mb-1">YÊU CẦU:</p>
                  <p>{selectedJob.requirements || "Làm việc nghiêm túc, trách nhiệm."}</p>
                </div>

                {/* Shifts list */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Các ca làm việc trực thuộc:</h4>
                  {jobShifts.length === 0 ? (
                    <p className="text-slate-400 text-xs">Tin tuyển dụng này chưa được cấu hình ca làm.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {jobShifts.map((shift) => {
                        const dateStr = shift.date ? new Date(shift.date).toLocaleDateString() : "Hôm nay";
                        return (
                          <div
                            key={shift.id}
                            className="border border-slate-100 p-4 rounded-2xl flex justify-between items-center hover:border-blue-200 transition"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Calendar size={13} className="text-blue-500" /> {dateStr}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                <Clock size={13} className="text-slate-400" /> {shift.startTime?.slice(0, 5)} - {shift.endTime?.slice(0, 5)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                                Slots: {shift.slotsFilled || 0}/{shift.slotsRequired}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleSelectShiftForApprovals(shift);
                                setActiveTab("approvals");
                              }}
                              className="px-3.5 h-8 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl font-bold text-[10px] uppercase transition shrink-0"
                            >
                              Xem Đơn Ứng Tuyển
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Tab Duyệt đơn ứng cử */
        <div className="grid gap-6 md:grid-cols-12">
          {/* List of Shifts waiting for approvals (Left side) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <h2 className="font-extrabold text-slate-800 text-base">Chọn ca làm đối soát đơn</h2>
            {jobs.length === 0 ? (
              <p className="text-slate-400 text-xs">Chưa có tin tuyển dụng.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-slate-100 bg-white rounded-3xl p-4 space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-xs truncate">{job.title}</h4>
                    
                    {/* Tiny shifts triggers */}
                    <div className="flex flex-col gap-2 border-t pt-2 border-slate-50">
                      <button
                        onClick={async () => {
                          const data = await getJobPostShifts(job.id);
                          if (data && data.length > 0) {
                            handleSelectShiftForApprovals(data[0]);
                          } else {
                            alert("Tin tuyển dụng chưa có ca làm!");
                          }
                        }}
                        className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-slate-600 transition"
                      >
                        📂 Xem ca làm tuyển dụng
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidate list (Right side) */}
          <div className="md:col-span-7 bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-6">
            {!selectedShiftForApprovals ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 text-slate-400 min-h-[300px]">
                <UserCheck size={48} className="text-slate-300 mb-3" />
                <h3 className="font-extrabold text-slate-700 text-sm">Chưa chọn ca làm duyệt đơn</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Vui lòng chọn ca làm bên trái để hiển thị danh sách hồ sơ xin việc của các bạn sinh viên.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-50 pb-3 flex justify-between items-baseline">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">Đơn ứng cử ca: #{selectedShiftForApprovals.id}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Thời gian: {selectedShiftForApprovals.startTime?.slice(0, 5)} - {selectedShiftForApprovals.endTime?.slice(0, 5)} | Slots: {selectedShiftForApprovals.slotsFilled || 0}/{selectedShiftForApprovals.slotsRequired}
                    </p>
                  </div>
                </div>

                {loadingApplicants ? (
                  <div className="text-center p-6 text-xs text-slate-400">Đang tìm hồ sơ ứng tuyển...</div>
                ) : applicants.length === 0 ? (
                  <div className="text-center p-12 text-slate-400">
                    <UserCheck size={36} className="text-slate-200 mb-2 mx-auto" />
                    <p className="font-bold text-xs">Chưa có sinh viên nào nộp đơn ứng tuyển ca này.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {applicants.map((app) => {
                      const status = (app.status || "").toLowerCase();
                      const isPending = status === "pending";
                      return (
                        <div
                          key={app.id}
                          className="border border-slate-100 hover:border-blue-200 p-5 rounded-2xl flex flex-col gap-3 transition"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold border shrink-0">
                                👨‍🎓
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800 text-xs">{app.studentName || "Sinh viên"}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{app.studentSchool || "Đại học FPT"}</p>
                              </div>
                            </div>

                            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full shrink-0">
                              <Star size={11} fill="currentColor" /> {app.studentReputationScore || "4.8"}
                            </span>
                          </div>

                          {/* Introduction Letter */}
                          {app.introduction && (
                            <div className="bg-slate-50 p-3 rounded-xl border text-[11px] text-slate-500 leading-relaxed italic">
                              "{app.introduction}"
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                              status === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                              status === "rejected" ? "bg-red-50 text-red-500 border-red-200" :
                              "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {app.status || "Chờ Duyệt"}
                            </span>

                            {isPending && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReject(app.id)}
                                  className="h-8 w-8 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition"
                                >
                                  <X size={14} />
                                </button>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="px-3.5 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] uppercase shadow-md shadow-blue-600/10 flex items-center gap-1 transition"
                                >
                                  <Check size={12} /> Duyệt ứng viên
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Post new job Wizard Modal overlay */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateJob} className="p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                  <Briefcase size={20} className="text-blue-600" /> Tạo tin tuyển ca làm mới
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Hủy
                </button>
              </div>

              {/* Title & Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tiêu đề công việc</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Phục vụ bàn ca sáng..."
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Ngành nghề</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="1">Phục vụ ăn uống</option>
                    <option value="2">Pha chế</option>
                    <option value="3">Kho vận / Xếp dỡ</option>
                    <option value="4">Shipper / Giao hàng</option>
                  </select>
                </div>
              </div>

              {/* Wage and Address */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Mức lương theo giờ (VND)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ ca làm</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Bỏ trống nếu lấy theo địa chỉ cửa hàng..."
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Details textareas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả công việc chi tiết..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Yêu cầu ứng viên</label>
                  <textarea
                    rows={3}
                    required
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Các yêu cầu kỹ năng, thái độ..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Shift Creator wizard step */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={14} className="text-blue-500" /> Thiết lập ca làm:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShiftsInput([...shiftsInput, { date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }])}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition"
                  >
                    + Thêm ca làm
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl">
                  {shiftsInput.map((shift, idx) => (
                    <div key={idx} className="bg-white border p-4 rounded-xl flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ngày làm việc</p>
                        <input
                          type="date"
                          required
                          value={shift.date}
                          onChange={(e) => {
                            const newShifts = [...shiftsInput];
                            newShifts[idx].date = e.target.value;
                            setShiftsInput(newShifts);
                          }}
                          className="w-full h-9 border border-slate-200 rounded-lg text-xs px-2 focus:outline-none focus:border-blue-400 mt-1"
                        />
                      </div>
                      <div className="w-20">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Giờ vào</p>
                        <input
                          type="text"
                          required
                          value={shift.startTime}
                          onChange={(e) => {
                            const newShifts = [...shiftsInput];
                            newShifts[idx].startTime = e.target.value;
                            setShiftsInput(newShifts);
                          }}
                          className="w-full h-9 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-400 mt-1"
                        />
                      </div>
                      <div className="w-20">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Giờ ra</p>
                        <input
                          type="text"
                          required
                          value={shift.endTime}
                          onChange={(e) => {
                            const newShifts = [...shiftsInput];
                            newShifts[idx].endTime = e.target.value;
                            setShiftsInput(newShifts);
                          }}
                          className="w-full h-9 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-400 mt-1"
                        />
                      </div>
                      <div className="w-16">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Slots</p>
                        <input
                          type="number"
                          required
                          value={shift.slotsRequired}
                          onChange={(e) => {
                            const newShifts = [...shiftsInput];
                            newShifts[idx].slotsRequired = Number(e.target.value);
                            setShiftsInput(newShifts);
                          }}
                          className="w-full h-9 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-400 mt-1"
                        />
                      </div>
                      {shiftsInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShiftsInput(shiftsInput.filter((_, i) => i !== idx))}
                          className="h-9 w-9 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Secure notification */}
              <p className="text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                ⚠️ **Chú ý:** Hệ thống tự động trừ hạn ngạch đăng ca làm dựa trên gói Subscription (Trial: 3 ca, Recruit: 30 ca, HRM Basic: 60 ca, Enterprise: Vô hạn).
              </p>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-600/10 transition"
              >
                Xác nhận Đăng ca tuyển dụng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
