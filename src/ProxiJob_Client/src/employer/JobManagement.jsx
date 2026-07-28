import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, Check, X, FileText, Briefcase, RefreshCw, Star, UserCheck, AlertTriangle, Wallet, Zap } from "lucide-react";
import { getJobPostsByBusiness, createJobPost, createJobShift, getJobPostShifts, deleteJobPostApi, getApplicationsByShift, approveApplication, rejectApplication, publishJobPost } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";

const checkIsEmergency = (title, desc) => {
  const t = (title || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  return (
    t.includes("tuyển gấp") ||
    t.includes("gấp") ||
    d.includes("tuyển gấp") ||
    d.includes("gấp")
  );
};

const getCategoryTheme = (categoryName) => {
  const cat = (categoryName || "").toLowerCase();
  if (cat.includes("phục vụ") || cat.includes("bồi bàn")) {
    return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", accent: "#ea580c" };
  }
  if (cat.includes("pha chế") || cat.includes("bar")) {
    return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", accent: "#d97706" };
  }
  if (cat.includes("thu ngân") || cat.includes("tiền")) {
    return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", accent: "#059669" };
  }
  if (cat.includes("giao hàng") || cat.includes("shipper")) {
    return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", accent: "#2563eb" };
  }
  if (cat.includes("bếp") || cat.includes("nấu")) {
    return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", accent: "#e11d48" };
  }
  return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", accent: "#7c3aea" };
};

export default function JobManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts"); // posts | approvals
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [currentApprovalsPage, setCurrentApprovalsPage] = useState(1);
  const jobsPerPage = 5;

  // Wizard Post State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [customCategory, setCustomCategory] = useState("");
  const [salary, setSalary] = useState(25000);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [address, setAddress] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [shiftsInput, setShiftsInput] = useState([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
  const [latitude, setLatitude] = useState(10.857461);
  const [longitude, setLongitude] = useState(106.801522);
  const [loadingGps, setLoadingGps] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const handleOpenWizard = () => {
    setTitle("");
    setCategoryId(1);
    setCustomCategory("");
    setSalary(25000);
    setDescription("");
    setRequirements("");
    setAddress("");
    setSelectedSkills([]);
    setCustomSkill("");
    setShowCustomSkillInput(false);
    setIsEmergency(false);
    setShiftsInput([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
    setLatitude(Number(user?.currentLatitude || 10.857461));
    setLongitude(Number(user?.currentLongitude || 106.801522));
    setLoadingGps(false);
    setShowMapModal(false);
    setWizardStep(1);
    setShowWizard(true);
  };

  // Active expanded jobs/shifts
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobShifts, setJobShifts] = useState([]);
  const [selectedShiftForApprovals, setSelectedShiftForApprovals] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    try {
      const data = await getJobPostsByBusiness(user.id);
      const list = data?.items || (Array.isArray(data) ? data : []);
      
      const enrichedJobs = await Promise.all(
        list.map(async (job) => {
          try {
            const shiftsRes = await getJobPostShifts(job.id);
            const shifts = Array.isArray(shiftsRes)
              ? shiftsRes
              : (shiftsRes && Array.isArray(shiftsRes.data))
                ? shiftsRes.data
                : (shiftsRes?.items || shiftsRes?.Items || []);
            
            const salary = shifts.length > 0 ? (shifts[0].salary !== undefined ? shifts[0].salary : (shifts[0].Salary || 0)) : 0;
            return { ...job, salary, shifts };
          } catch (e) {
            console.log(`Failed to fetch shifts for job ${job.id}:`, e);
            return { ...job, salary: 0, shifts: [] };
          }
        })
      );
      
      setJobs(enrichedJobs);
      setCurrentPage(1);
      setCurrentApprovalsPage(1);
      setLoadingJobs(false);
    } catch (err) {
      console.log("Failed to load business jobs:", err);
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const parseDateTimeToUTC = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    // Subtract 7 hours to convert from ICT (GMT+7) to UTC
    dateObj.setUTCHours(dateObj.getUTCHours() - 7);
    return dateObj.toISOString();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { "User-Agent": "ProxiJobClient/1.0" }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          } else {
            setAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch (e) {
          setAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        
        setLoadingGps(false);
        alert(`Đã định vị GPS thành công: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      (error) => {
        setLoadingGps(false);
        alert("Lấy vị trí thất bại: " + error.message);
      }
    );
  };

  const handleConfirmMapLocation = async () => {
    const mapDiv = document.getElementById("leaflet-map-picker");
    if (mapDiv && mapDiv.dataset.lat && mapDiv.dataset.lng) {
      const selectedLat = Number(mapDiv.dataset.lat);
      const selectedLng = Number(mapDiv.dataset.lng);
      setLatitude(selectedLat);
      setLongitude(selectedLng);
      setShowMapModal(false);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${selectedLat}&lon=${selectedLng}&format=json`, {
          headers: { "User-Agent": "ProxiJobClient/1.0" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Tọa độ: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`);
          }
        } else {
          setAddress(`Tọa độ: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`);
        }
      } catch (e) {
        setAddress(`Tọa độ: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`);
      }
      
      alert(`Đã xác nhận tọa độ bản đồ: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`);
    }
  };

  useEffect(() => {
    let map = null;
    let marker = null;

    if (showMapModal) {
      // 1. Inject Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Helper initialization
      const initMap = () => {
        const mapDiv = document.getElementById("leaflet-map-picker");
        if (!mapDiv) return;
        if (mapDiv._leaflet_id) return; // already initialized

        const initialLat = Number(latitude) || 10.857461;
        const initialLng = Number(longitude) || 106.801522;

        map = window.L.map("leaflet-map-picker").setView([initialLat, initialLng], 15);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap"
        }).addTo(map);

        marker = window.L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        // Update dataset on drag end
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          mapDiv.dataset.lat = position.lat;
          mapDiv.dataset.lng = position.lng;
        });

        // Move marker on click
        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          mapDiv.dataset.lat = e.latlng.lat;
          mapDiv.dataset.lng = e.latlng.lng;
        });

        mapDiv.dataset.lat = initialLat;
        mapDiv.dataset.lng = initialLng;
      };

      // 3. Inject script or load map
      if (!window.L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          setTimeout(initMap, 200);
        };
        document.head.appendChild(script);
      } else {
        setTimeout(initMap, 200);
      }
    }

    return () => {
      // Clean up map instance if modal closes to avoid memory leaks
      if (map) {
        map.remove();
      }
    };
  }, [showMapModal]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!user) return;

    for (const shift of shiftsInput) {
      if (!shift.date || !shift.startTime || !shift.endTime) {
        alert("Vui lòng điền đầy đủ ngày làm việc và giờ của các ca làm.");
        return;
      }
    }
    
    try {
      // Map custom category safely to other category code if selected
      let finalCategoryId = categoryId;
      if (Number(categoryId) === 9999) {
        finalCategoryId = 6; // Standard "Khác" category ID
      }

      let finalTitle = title;
      let finalDescription = description;
      if (Number(categoryId) === 9999 && customCategory.trim()) {
        finalTitle = `${title} (${customCategory.trim()})`;
        finalDescription = `[Danh mục khác: ${customCategory.trim()}]\n\n${description}`;
      }

      const finalSelectedSkills = [...selectedSkills];
      if (showCustomSkillInput && customSkill.trim()) {
        const customSkills = customSkill
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        finalSelectedSkills.push(...customSkills);
      }

      // Add emergency prefix/suffix and multiply salary if isEmergency is active
      const finalSalary = isEmergency 
        ? Math.round(Number(salary) * 1.3)
        : Number(salary);

      const displayTitle = isEmergency ? `${finalTitle} (KHẨN CẤP)` : finalTitle;
      const displayDescription = isEmergency ? `${finalDescription} (Tuyển gấp khẩn cấp)` : finalDescription;

      const payload = {
        title: displayTitle,
        categoryId: Number(finalCategoryId),
        description: displayDescription,
        requirements,
        location: {
          address: address || user.currentAddress || "Cơ sở cửa hàng",
          latitude: Number(latitude),
          longitude: Number(longitude)
        },
        skillNames: finalSelectedSkills,
        createdBy: user.fullName || user.email || "Business Owner",
        businessId: Number(user.id)
      };

      const newJob = await createJobPost(payload);
      const jobPostId = typeof newJob === 'object' && newJob !== null ? (newJob.id || newJob.data || newJob) : newJob;
      if (!jobPostId) {
        throw new Error("Không nhận được ID từ API tạo bài đăng.");
      }

      // Add shifts sequentially
      for (const shift of shiftsInput) {
        const startTimeIso = parseDateTimeToUTC(shift.date, shift.startTime);
        let endTimeIso = parseDateTimeToUTC(shift.date, shift.endTime);

        // If end time is before start time, shift ends the next day
        if (new Date(endTimeIso) < new Date(startTimeIso)) {
          const endDate = new Date(endTimeIso);
          endDate.setUTCDate(endDate.getUTCDate() + 1);
          endTimeIso = endDate.toISOString();
        }

        await createJobShift(jobPostId, {
          businessId: Number(user.id),
          startTime: startTimeIso,
          endTime: endTimeIso,
          salary: Number(finalSalary),
          slots: Number(shift.slotsRequired),
          createdBy: user.fullName || user.email || "Business Owner"
        });
      }

      // Automatically publish the post
      await publishJobPost(jobPostId, Number(user.id), user.fullName || user.email || "Business Owner");

      alert("Đăng tin tuyển dụng thành công và đã xuất bản lên radar!");
      setShowWizard(false);
      // Reset inputs
      setTitle("");
      setDescription("");
      setRequirements("");
      setShiftsInput([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
      fetchJobs();
    } catch (err) {
      alert("Đăng ca làm thất bại: " + (err.message || err));
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
      const list = data?.items || (Array.isArray(data) ? data : []);
      setApplicants(list);
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
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. PREMIUM HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="relative z-10 p-6 md:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <Briefcase size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Quản lý Đăng Ca & Duyệt Tin</h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">Trình tạo ca làm tuyển dụng và phê duyệt ứng viên.</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-orange-200/60 shadow-xs">
            <button
              onClick={() => setActiveTab("posts")}
              className={`text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeTab === "posts"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
              }`}
            >
              <Briefcase size={15} /> Tin Đăng Tuyển
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeTab === "approvals"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
              }`}
            >
              <UserCheck size={15} /> Duyệt Đơn ({applicants.length})
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 2. TAB VIEWS ==================== */}
      {activeTab === "posts" ? (
        <div className="dashboard-fade-in dashboard-fade-in-2 grid gap-6 lg:grid-cols-12">

          {/* ===== LEFT: Job List ===== */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" />
                  Tin tuyển dụng đang chạy
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">{jobs.length} tin đăng tuyển</p>
              </div>
              <button
                onClick={handleOpenWizard}
                className="btn-premium text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"
              >
                <Plus size={16} /> Đăng ca làm mới
              </button>
            </div>

            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-md">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
                <p className="text-slate-500 text-sm font-semibold">Đang tải danh sách ca tuyển dụng...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 text-center shadow-md">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="text-slate-300" size={28} />
                </div>
                <p className="text-slate-800 font-bold text-base">Chưa đăng ca làm việc nào</p>
                <p className="text-slate-400 text-sm mt-2 max-w-sm">Bấm nút "Đăng ca làm mới" phía trên để tạo tin tuyển dụng phục vụ, pha chế đầu tiên.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage).map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const theme = getCategoryTheme(job.categoryName);
                  const isUrgent = checkIsEmergency(job.title, job.description);
                  return (
                    <article
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`group relative p-5 bg-white/80 backdrop-blur-sm border-2 rounded-2xl cursor-pointer card-hover-lift transition-all duration-300 ${
                        isSelected
                          ? "border-orange-400 shadow-lg shadow-orange-500/10 bg-gradient-to-r from-orange-50/50 to-amber-50/30"
                          : "border-slate-100 hover:border-orange-200"
                      }`}
                    >
                      {/* Color accent bar */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                        style={{ background: theme.accent }}
                      />

                      <div className="flex justify-between items-start gap-4 pl-3">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${theme.bg} ${theme.text} border ${theme.border}`}>
                              {job.categoryName || "Đăng tin"}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                              job.status === "Published"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : job.status === "Draft"
                                  ? "bg-slate-50 text-slate-500 border-slate-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {job.status === "Published" ? "Công khai" : job.status === "Draft" ? "Bản nháp" : "Đã đóng"}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-black uppercase text-white bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-1 rounded-full shadow-sm">
                                🔥 Gấp
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-slate-800 text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {job.title}
                          </h4>
                          <p className="text-sm text-slate-400 font-medium line-clamp-1 mt-1">{job.address || "Tại cửa hàng"}</p>

                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <span className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
                              <Calendar size={14} className="text-orange-400" />
                              Ca làm: <strong className="text-slate-700">{job.shiftCount || 0} ca</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                              <Wallet size={14} />
                              {job.salary && job.salary > 0 ? `${job.salary.toLocaleString()}đ/h` : "Lương ca"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 shrink-0 self-start opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* Pagination */}
                {jobs.length > jobsPerPage && (
                  <div className="flex items-center justify-center gap-3 mt-4 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Trước
                    </button>
                    <span className="text-sm font-extrabold text-slate-500">
                      {currentPage} / {Math.ceil(jobs.length / jobsPerPage)}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === Math.ceil(jobs.length / jobsPerPage)}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== RIGHT: Job Detail Panel ===== */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
            {!selectedJob ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 min-h-[350px]">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                  <FileText size={32} className="text-slate-300" />
                </div>
                <h3 className="font-black text-slate-700 text-base">Chưa chọn tin tuyển dụng</h3>
                <p className="text-sm text-slate-400 max-w-xs mt-2">Bấm chọn một tin tuyển dụng bên trái để xem các ca làm việc và danh sách chi tiết.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chi tiết tin tuyển dụng</span>
                  <h3 className="font-black text-slate-800 text-lg mt-1">{selectedJob.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">ID: #{selectedJob.id}</p>
                </div>

                {/* Description */}
                <div className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Mô tả công việc</p>
                  <p className="text-sm">{selectedJob.description || "Không có mô tả."}</p>
                  <p className="font-bold text-slate-700 mt-4 mb-2 text-xs uppercase tracking-wider">Yêu cầu</p>
                  <p className="text-sm">{selectedJob.requirements || "Làm việc nghiêm túc, trách nhiệm."}</p>
                </div>

                {/* Shifts */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-orange-500" />
                    Các ca làm việc trực thuộc
                  </h4>
                  {jobShifts.length === 0 ? (
                    <p className="text-slate-400 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">Chưa cấu hình ca làm.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {jobShifts.map((shift) => {
                        const dateStr = shift.date ? new Date(shift.date).toLocaleDateString() : "Hôm nay";
                        return (
                          <div
                            key={shift.id}
                            className="border border-slate-100 hover:border-orange-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all card-hover-lift"
                          >
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                <Calendar size={14} className="text-orange-500" /> {dateStr}
                              </span>
                              <span className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                                <Clock size={14} className="text-slate-400" /> {shift.startTime?.slice(0, 5)} - {shift.endTime?.slice(0, 5)}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold mt-0.5">
                                Slots: {shift.slotsFilled || 0}/{shift.slotsRequired}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleSelectShiftForApprovals(shift);
                                setActiveTab("approvals");
                              }}
                              className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-xl font-bold text-xs uppercase transition whitespace-nowrap"
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
        /* ==================== TAB: DUYỆT ĐƠN ==================== */
        <div className="dashboard-fade-in dashboard-fade-in-2 grid gap-6 lg:grid-cols-12">

          {/* LEFT: Shifts list */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <UserCheck size={18} className="text-orange-500" />
              Chọn ca làm đối soát đơn
            </h2>
            {jobs.length === 0 ? (
              <p className="text-slate-400 text-sm bg-white/80 p-6 rounded-2xl border border-slate-100 text-center">Chưa có tin tuyển dụng.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.slice((currentApprovalsPage - 1) * jobsPerPage, currentApprovalsPage * jobsPerPage).map((job) => (
                  <div key={job.id} className="border border-slate-100 bg-white/80 backdrop-blur-sm rounded-2xl p-5 space-y-3 card-hover-lift">
                    <h4 className="font-black text-slate-800 text-base truncate">{job.title}</h4>
                    <div className="border-t pt-3 border-slate-100">
                      <button
                        onClick={async () => {
                          const data = await getJobPostShifts(job.id);
                          if (data && data.length > 0) {
                            handleSelectShiftForApprovals(data[0]);
                          } else {
                            alert("Tin tuyển dụng chưa có ca làm!");
                          }
                        }}
                        className="w-full text-left p-3 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-xl text-sm font-bold text-slate-600 hover:text-orange-600 transition-all flex items-center gap-2"
                      >
                        <FileText size={14} /> Xem ca làm tuyển dụng
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {jobs.length > jobsPerPage && (
                  <div className="flex items-center justify-center gap-3 mt-4 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      disabled={currentApprovalsPage === 1}
                      onClick={() => setCurrentApprovalsPage((prev) => prev - 1)}
                      className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Trước
                    </button>
                    <span className="text-sm font-extrabold text-slate-500">
                      {currentApprovalsPage} / {Math.ceil(jobs.length / jobsPerPage)}
                    </span>
                    <button
                      type="button"
                      disabled={currentApprovalsPage === Math.ceil(jobs.length / jobsPerPage)}
                      onClick={() => setCurrentApprovalsPage((prev) => prev + 1)}
                      className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Candidate list */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
            {!selectedShiftForApprovals ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 min-h-[350px]">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                  <UserCheck size={32} className="text-slate-300" />
                </div>
                <h3 className="font-black text-slate-700 text-base">Chưa chọn ca làm duyệt đơn</h3>
                <p className="text-sm text-slate-400 max-w-xs mt-2">Vui lòng chọn ca làm bên trái để hiển thị danh sách hồ sơ xin việc.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đơn ứng cử</span>
                  <h3 className="font-black text-slate-800 text-lg mt-1">Ca: #{selectedShiftForApprovals.id}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    ⏰ {selectedShiftForApprovals.startTime?.slice(0, 5)} - {selectedShiftForApprovals.endTime?.slice(0, 5)} | Slots: {selectedShiftForApprovals.slotsFilled || 0}/{selectedShiftForApprovals.slotsRequired}
                  </p>
                </div>

                {loadingApplicants ? (
                  <div className="flex flex-col items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent mb-3" />
                    <p className="text-sm text-slate-400">Đang tìm hồ sơ ứng tuyển...</p>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center p-12">
                    <UserCheck size={40} className="text-slate-200 mb-3 mx-auto" />
                    <p className="font-bold text-sm text-slate-500">Chưa có sinh viên nào nộp đơn ứng tuyển ca này.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {applicants.map((app) => {
                      const status = (app.status || "").toLowerCase();
                      const isPending = status === "pending";
                      return (
                        <div
                          key={app.id}
                          className="border border-slate-100 hover:border-orange-200 p-5 rounded-2xl flex flex-col gap-3 transition-all card-hover-lift"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center font-bold text-lg border border-orange-200 shrink-0">
                                👨‍🎓
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800 text-sm">{app.studentName || "Sinh viên"}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{app.studentSchool || "Đại học FPT"}</p>
                              </div>
                            </div>

                            <span className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full shrink-0">
                              <Star size={13} fill="currentColor" /> {app.studentReputationScore || "4.8"}
                            </span>
                          </div>

                          {/* Introduction */}
                          {app.introduction && (
                            <div className="bg-slate-50 p-4 rounded-xl border text-sm text-slate-500 leading-relaxed italic">
                              "{app.introduction}"
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-3">
                            <span className={`text-[10px] uppercase font-extrabold px-3 py-1 rounded-full border ${
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
                                  className="h-9 px-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center gap-1.5 transition text-xs font-bold"
                                >
                                  <X size={14} /> Từ chối
                                </button>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="h-9 px-4 btn-premium text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
                                >
                                  <Check size={14} /> Duyệt ứng viên
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

      {/* ==================== WIZARD MODAL ==================== */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <form onSubmit={handleCreateJob} className="p-6 md:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

              {/* Wizard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                    <Briefcase size={18} className="text-white" />
                  </div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">
                    Tạo tuyển dụng mới
                  </h3>
                </div>

                {/* Step Progress */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                          wizardStep >= num
                            ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm scale-110"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {num}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                          wizardStep >= num ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        Bước {num}
                      </span>
                      {num < 3 && <div className={`w-4 h-0.5 ${wizardStep > num ? "bg-orange-400" : "bg-slate-200"} transition-colors`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1 */}
              {wizardStep === 1 && (
                <div className="flex flex-col gap-5">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-orange-500 pl-3">
                    Nội dung ca làm (Bước 1/3)
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Tiêu đề công việc</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Phục vụ bàn ca sáng..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md focus:shadow-orange-500/5 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Ngành nghề</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all appearance-none cursor-pointer font-bold"
                      >
                        <option value={1}>Phục vụ ăn uống</option>
                        <option value={2}>Pha chế</option>
                        <option value={3}>Kho vận / Xếp dỡ</option>
                        <option value={4}>Shipper / Giao hàng</option>
                        <option value={9999}>Khác...</option>
                      </select>
                    </div>
                  </div>

                  {Number(categoryId) === 9999 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Tên ngành nghề khác tự chọn</label>
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Ví dụ: Tạp vụ rửa bát, PG sự kiện..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Mô tả chi tiết</label>
                      <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả công việc chi tiết..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Yêu cầu đối với ứng viên</label>
                      <textarea
                        rows={4}
                        required
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Các yêu cầu kỹ năng, thái độ..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {wizardStep === 2 && (
                <div className="flex flex-col gap-5">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-orange-500 pl-3">
                    Quyền lợi & Kỹ năng (Bước 2/3)
                  </h4>

                  {/* Emergency Toggle */}
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-extrabold text-red-600 flex items-center gap-1.5">
                        <AlertTriangle size={15} /> CHẾ ĐỘ ĐĂNG CA GẤP (EMERGENCY)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Tự động nhân hệ số khẩn cấp (+30% lương đề xuất), đẩy tin tức thì qua thông báo tới các ứng viên trong bán kính 3km.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Mức lương đề xuất (VND/giờ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={salary}
                        onChange={(e) => setSalary(Number(e.target.value))}
                        className="w-full h-12 pl-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VND</span>
                    </div>
                  </div>

                  {isEmergency && salary > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm flex justify-between items-center">
                      <span className="font-bold text-orange-800">🔥 Mức lương thực tế ca gấp (+30%):</span>
                      <span className="font-black text-orange-700 text-lg">
                        {Math.round(salary * 1.3).toLocaleString()} đ/giờ
                      </span>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Kỹ năng cần thiết</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Giao tiếp',
                        'Pha chế',
                        'Xử lý tình huống',
                        'Tiếng Anh',
                        'Sử dụng máy POS',
                        'Làm việc nhóm',
                        'Bưng bê',
                        'Lái xe'
                      ].map((skillName) => {
                        const isSelected = selectedSkills.includes(skillName);
                        return (
                          <button
                            key={skillName}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSkills(selectedSkills.filter(s => s !== skillName));
                              } else {
                                setSelectedSkills([...selectedSkills, skillName]);
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                              isSelected
                                ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{skillName}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowCustomSkillInput(!showCustomSkillInput)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                          showCustomSkillInput
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {showCustomSkillInput ? '✓ ' : ''}Khác...
                      </button>
                    </div>
                  </div>

                  {showCustomSkillInput && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Nhập kỹ năng khác (cách nhau bởi dấu phẩy)</label>
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Ví dụ: Rửa cốc chén, sử dụng máy xay sinh tố..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 */}
              {wizardStep === 3 && (
                <div className="flex flex-col gap-5">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-orange-500 pl-3">
                    Địa điểm & Thời gian (Bước 3/3)
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Địa chỉ ca làm</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Nhập địa chỉ ca làm việc..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Định vị & Bản đồ</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loadingGps}
                          onClick={handleGetCurrentLocation}
                          className="flex-1 h-12 px-4 border border-orange-200 hover:border-orange-300 text-orange-600 bg-orange-50/50 hover:bg-orange-50 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2"
                        >
                          {loadingGps ? "Đang định vị..." : "📍 GPS Hiện Tại"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="flex-1 h-12 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2"
                        >
                          🗺 Chọn Bản Đồ
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-500 font-semibold font-mono">
                        <span className="bg-white px-3 py-1.5 rounded-lg border">Lat: {latitude ? Number(latitude).toFixed(6) : "N/A"}</span>
                        <span className="bg-white px-3 py-1.5 rounded-lg border">Lng: {longitude ? Number(longitude).toFixed(6) : "N/A"}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                          ✓ Định vị sẵn sàng
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shift Creator */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={15} className="text-orange-500" /> Thiết lập ca làm:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShiftsInput([...shiftsInput, { date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }])}
                        className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition"
                      >
                        + Thêm ca làm
                      </button>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl">
                      {shiftsInput.map((shift, idx) => (
                        <div key={idx} className="bg-white border p-4 rounded-xl flex flex-wrap gap-3 items-end">
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ngày làm việc</p>
                            <input
                              type="date"
                              required
                              value={shift.date}
                              onChange={(e) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].date = e.target.value;
                                setShiftsInput(newShifts);
                              }}
                              className="w-full h-10 border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:border-orange-400"
                            />
                          </div>
                          <div className="w-24">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ vào</p>
                            <input
                              type="text"
                              required
                              value={shift.startTime}
                              onChange={(e) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].startTime = e.target.value;
                                setShiftsInput(newShifts);
                              }}
                              className="w-full h-10 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-orange-400"
                            />
                          </div>
                          <div className="w-24">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ ra</p>
                            <input
                              type="text"
                              required
                              value={shift.endTime}
                              onChange={(e) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].endTime = e.target.value;
                                setShiftsInput(newShifts);
                              }}
                              className="w-full h-10 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-orange-400"
                            />
                          </div>
                          <div className="w-20">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Slots</p>
                            <input
                              type="number"
                              required
                              value={shift.slotsRequired}
                              onChange={(e) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].slotsRequired = Number(e.target.value);
                                setShiftsInput(newShifts);
                              }}
                              className="w-full h-10 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-orange-400"
                            />
                          </div>
                          {shiftsInput.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setShiftsInput(shiftsInput.filter((_, i) => i !== idx))}
                              className="h-10 w-10 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notice */}
              <p className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 leading-relaxed font-medium">
                ⚠️ <strong>Chú ý:</strong> Hệ thống tự động trừ hạn ngạch đăng ca làm dựa trên gói Subscription (Trial: 3 ca, Recruit: 30 ca, HRM Basic: 60 ca, Enterprise: Vô hạn).
              </p>

              {/* Wizard Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition"
                  >
                    ← Quay lại
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition"
                  >
                    Hủy bỏ
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 1) {
                        if (!title.trim() || !description.trim() || !requirements.trim()) {
                          alert("Vui lòng điền đầy đủ tiêu đề, mô tả và yêu cầu ứng viên.");
                          return;
                        }
                        if (Number(categoryId) === 9999 && !customCategory.trim()) {
                          alert("Vui lòng nhập tên ngành nghề khác.");
                          return;
                        }
                      } else if (wizardStep === 2) {
                        if (!salary || Number(salary) <= 0) {
                          alert("Vui lòng nhập mức lương hợp lệ.");
                          return;
                        }
                      }
                      setWizardStep(wizardStep + 1);
                    }}
                    className="px-6 py-3 btn-premium text-white rounded-xl text-sm font-bold shadow-lg"
                  >
                    Tiếp theo →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 btn-premium text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
                  >
                    <Zap size={15} /> Đăng tin tuyển dụng
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MAP MODAL ==================== */}
      {showMapModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" style={{ animation: "fadeInUp 0.3s ease-out" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                🗺 Chọn Vị Trí Trên Bản Đồ
              </h3>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="text-sm font-bold text-slate-400 bg-white hover:bg-slate-100 border px-3 py-2 rounded-lg transition"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 relative bg-slate-100">
              <div id="leaflet-map-picker" className="absolute inset-0 z-10" />
            </div>

            <div className="p-5 border-t bg-slate-50 flex justify-between items-center gap-4">
              <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
                💡 <strong>Mẹo:</strong> Kéo thả ghim đỏ hoặc nhấp chọn lên bản đồ để chọn tọa độ mới cho ca làm việc.
              </p>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                className="px-5 py-3 btn-premium text-white rounded-xl text-sm font-bold shadow-lg shrink-0"
              >
                Xác nhận Vị trí
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
