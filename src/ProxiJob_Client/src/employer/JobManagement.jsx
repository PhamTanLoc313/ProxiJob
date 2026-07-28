import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, Check, X, FileText, Briefcase, RefreshCw, Star, UserCheck, AlertTriangle, Wallet, Zap, Search, ChevronDown, MapPin, DollarSign, Award, ArrowLeft } from "lucide-react";
import { getJobPostsByBusiness, createJobPost, createJobShift, getJobPostShifts, deleteJobPostApi, getApplicationsByShift, approveApplication, rejectApplication, publishJobPost } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";
import CustomTimePicker from "./CustomTimePicker";
import CustomDatePicker from "./CustomDatePicker";
import { getBusinessProfileApi } from "../api/businessApi";

const checkIsEmergency = (title, desc) => {
  const t = (title || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  return (
    t.includes("khần cấp") ||
    t.includes("khẩn cấp") ||
    t.includes("khấn cấp") ||
    t.includes("tuyển gấp") ||
    t.includes("gấp") ||
    d.includes("khần cấp") ||
    d.includes("khẩn cấp") ||
    d.includes("khấn cấp") ||
    d.includes("tuyển gấp") ||
    d.includes("gấp")
  );
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

const formatShiftTimeText = (shift) => {
  if (!shift) return "";
  const start = shift.startTime || "";
  const end = shift.endTime || "";
  if (start.includes("T") || start.includes("-")) {
    const sTime = formatTimeVN(start);
    const eTime = formatTimeVN(end);
    return `${sTime} - ${eTime}`;
  }
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
};

const formatShiftDateText = (shift) => {
  if (!shift) return "";
  const dateVal = shift.date || shift.startTime || "";
  if (dateVal.includes("T") || dateVal.includes("-")) {
    return formatDateVN(dateVal);
  }
  return dateVal ? new Date(dateVal).toLocaleDateString("vi-VN") : "Hôm nay";
};

const FILTER_CATEGORIES = [
  { id: "", name: "Tất cả", icon: "💼" },
  { id: "Giao hàng", name: "Giao hàng", icon: "🛵" },
  { id: "Thú cưng", name: "Dịch vụ thú cưng", icon: "🐾" },
  { id: "Gia sư", name: "Gia sư", icon: "📚" },
  { id: "Sửa chữa", name: "Sửa chữa", icon: "🔧" },
  { id: "Phục vụ", name: "Phục vụ", icon: "🍽️" },
  { id: "Khác", name: "Khác", icon: "🏷️" }
];

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

export default function JobManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("posts"); // posts | approvals
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false);

  const filteredJobs = jobs.filter((job) => {
    // 1. Search term check
    const matchSearch =
      !searchTerm.trim() ||
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Salary check
    const salaryVal = job.salary || 0;
    const matchSalary = salaryVal >= minSalary;

    // 3. Category check
    if (!selectedCategory) return matchSearch && matchSalary;

    const name = (job.categoryName || "").toLowerCase();
    let matchCat = false;
    if (selectedCategory === "Phục vụ") {
      matchCat = (name.includes("phục vụ") || name.includes("waiter") || name.includes("chạy bàn") || name.includes("phụ vụ") || name.includes("cafe") || name.includes("cà phê"));
    } else if (selectedCategory === "Gia sư") {
      matchCat = (name.includes("gia sư") || name.includes("tutor") || name.includes("dạy") || name.includes("học"));
    } else if (selectedCategory === "Giao hàng") {
      matchCat = (name.includes("giao hàng") || name.includes("delivery") || name.includes("shipper"));
    } else if (selectedCategory === "Sửa chữa") {
      matchCat = (name.includes("sửa chữa") || name.includes("repair") || name.includes("bảo trì") || name.includes("kỹ thuật"));
    } else if (selectedCategory === "Thú cưng") {
      matchCat = (name.includes("thú cưng") || name.includes("pet") || name.includes("dịch vụ thú cưng"));
    } else if (selectedCategory === "Khác") {
      const isKnown =
        name.includes("phục vụ") || name.includes("waiter") || name.includes("chạy bàn") || name.includes("phụ vụ") || name.includes("cafe") || name.includes("cà phê") ||
        name.includes("gia sư") || name.includes("tutor") || name.includes("dạy") || name.includes("học") ||
        name.includes("giao hàng") || name.includes("delivery") || name.includes("shipper") ||
        name.includes("sửa chữa") || name.includes("repair") || name.includes("bảo trì") || name.includes("kỹ thuật") ||
        name.includes("thú cưng") || name.includes("pet") || name.includes("dịch vụ thú cưng");
      matchCat = !isKnown;
    }

    return matchSearch && matchSalary && matchCat;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [currentApprovalsPage, setCurrentApprovalsPage] = useState(1);
  const jobsPerPage = 6;

  // Wizard Post State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [isOpenCategory, setIsOpenCategory] = useState(false);
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
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCoords, setBusinessCoords] = useState({ lat: 10.857461, lng: 106.801522 });

  const handleOpenWizard = () => {
    setTitle("");
    setCategoryId(1);
    setCustomCategory("");
    setSalary(25000);
    setDescription("");
    setRequirements("");
    setAddress(businessAddress);
    setSelectedSkills([]);
    setCustomSkill("");
    setShowCustomSkillInput(false);
    setIsEmergency(false);
    setShiftsInput([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
    setLatitude(Number(businessCoords.lat || user?.currentLatitude || 10.857461));
    setLongitude(Number(businessCoords.lng || user?.currentLongitude || 106.801522));
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
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const pendingLeavesCount = leaveRequests.filter(r => r.status === 'pending').length;

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

  const fetchLeaveRequests = async () => {
    if (!user) return;
    setLoadingLeaves(true);
    try {
      const data = await getJobPostsByBusiness(user.id);
      const list = data?.items || (Array.isArray(data) ? data : []);
      const dbLeaveRequests = [];

      await Promise.all(
        list.map(async (job) => {
          try {
            const shiftsRes = await getJobPostShifts(job.id);
            const shifts = Array.isArray(shiftsRes)
              ? shiftsRes
              : (shiftsRes && Array.isArray(shiftsRes.data))
                ? shiftsRes.data
                : (shiftsRes?.items || []);

            await Promise.all(
              shifts.map(async (s) => {
                try {
                  const appsRes = await getApplicationsByShift(s.id, user.id);
                  const appsList = Array.isArray(appsRes)
                    ? appsRes
                    : (appsRes && Array.isArray(appsRes.data))
                      ? appsRes.data
                      : (appsRes?.items || []);

                  const cancelledApps = appsList.filter(
                    (a) =>
                      a.status === "Cancelled" ||
                      a.status === "CancelledApproved" ||
                      a.status === "CancelledRejected"
                  );

                  cancelledApps.forEach((a) => {
                    const staffName = a.studentName || `Sinh viên #${a.studentId}`;
                    const position = a.studentSchool || "Nhân viên";
                    const reason = a.cancelNote || a.introduction || "Yêu cầu hủy ca làm việc / xin nghỉ phép";
                    const isSwap =
                      reason.toLowerCase().includes("đổi") ||
                      reason.toLowerCase().includes("chuyển") ||
                      reason.toLowerCase().includes("sang") ||
                      reason.toLowerCase().includes("ca");
                    const requestType = isSwap ? "swap" : "leave";

                    const shiftTime = formatShiftTimeText(s);
                    const shiftDate = formatShiftDateText(s);

                    let localStatus = "pending";
                    if (a.status === "CancelledApproved") {
                      localStatus = "approved";
                    } else if (a.status === "CancelledRejected") {
                      localStatus = "rejected";
                    }

                    dbLeaveRequests.push({
                      id: a.id,
                      staffName,
                      position,
                      type: requestType,
                      shiftDate,
                      shiftTime,
                      jobTitle: job.title,
                      reason,
                      status: localStatus
                    });
                  });
                } catch (err) {
                  console.log(`Error loading applications for shift ${s.id}:`, err);
                }
              })
            );
          } catch (err) {
            console.log(`Error loading shifts for job ${job.id}:`, err);
          }
        })
      );

      const sortedLeaves = dbLeaveRequests.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      });

      setLeaveRequests(sortedLeaves);
      setLoadingLeaves(false);
    } catch (error) {
      console.log("Failed to load leave requests:", error);
      setLoadingLeaves(false);
    }
  };

  const handleActionLeaveRequest = async (requestId, status) => {
    try {
      if (status === 'approved') {
        await approveApplication(requestId, user.id, user.name);
        toast.success("Đã chấp thuận yêu cầu xin nghỉ!");
      } else {
        await rejectApplication(requestId, user.id, user.name);
        toast.success("Đã từ chối yêu cầu xin nghỉ!");
      }
      fetchLeaveRequests();
      fetchJobs();
    } catch (err) {
      toast.error(err.message || "Xử lý yêu cầu thất bại.");
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchLeaveRequests();

    // Pre-fetch business profile address and coordinates for defaults
    getBusinessProfileApi()
      .then((data) => {
        if (data && data.address) {
          setBusinessAddress(data.address);
          
          // Geocode address to get default lat/lng
          const queryStr = `${data.address} ${data.city || "TP. Hồ Chí Minh"}`;
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`,
            { headers: { "User-Agent": "ProxiJob-Web" } }
          )
            .then((res) => {
              if (res.ok) return res.json();
              return [];
            })
            .then((geoData) => {
              if (geoData && geoData.length > 0) {
                setBusinessCoords({
                  lat: parseFloat(geoData[0].lat),
                  lng: parseFloat(geoData[0].lon)
                });
              }
            })
            .catch((err) => console.log("Geocoding business address failed:", err));
        }
      })
      .catch((err) => {
        console.log("Failed to load business profile address:", err);
      });
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
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
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
        toast.success(`Đã định vị GPS thành công: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      (error) => {
        setLoadingGps(false);
        toast.error("Lấy vị trí thất bại: " + error.message);
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

      toast.success(`Đã xác nhận tọa độ bản đồ: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`);
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
        toast.warning("Vui lòng điền đầy đủ ngày làm việc và giờ của các ca làm.");
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

      toast.success("Đăng tin tuyển dụng thành công và đã xuất bản lên radar! 🚀");
      setShowWizard(false);
      // Reset inputs
      setTitle("");
      setDescription("");
      setRequirements("");
      setShiftsInput([{ date: "", startTime: "08:00", endTime: "12:00", slotsRequired: 1 }]);
      fetchJobs();
    } catch (err) {
      toast.error("Đăng ca làm thất bại: " + (err.message || err));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Ca làm liên kết cũng sẽ bị hủy.")) return;
    try {
      await deleteJobPostApi(jobId, user.id);
      fetchJobs();
      setSelectedJob(null);
      toast.success("Xóa tin tuyển dụng thành công!");
    } catch (err) {
      toast.error(err.message || "Xóa tin tuyển dụng thất bại.");
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
      toast.success("Đã duyệt ứng viên thành công! 🎉");
      if (selectedShiftForApprovals) {
        handleSelectShiftForApprovals(selectedShiftForApprovals);
      }
    } catch (err) {
      toast.error(err.message || "Lỗi duyệt đơn.");
    }
  };

  const handleReject = async (appId) => {
    try {
      await rejectApplication(appId, user.id);
      toast.success("Đã từ chối đơn ứng cử.");
      if (selectedShiftForApprovals) {
        handleSelectShiftForApprovals(selectedShiftForApprovals);
      }
    } catch (err) {
      toast.error(err.message || "Lỗi từ chối đơn.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">
      <style>{`
        @keyframes urgentPulse {
          0%, 100% {
            background-color: #ffffff;
            border-color: #f1f5f9;
          }
          50% {
            background-color: var(--urgent-bg);
            border-color: var(--urgent-border);
            box-shadow: 0 0 12px var(--urgent-glow);
          }
        }
        .urgent-flashing-card {
          animation: urgentPulse 1.8s infinite ease-in-out;
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .urgent-badge-pulse {
          animation: badgePulse 1.2s infinite ease-in-out;
        }
        .custom-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          cursor: pointer;
          z-index: 20;
        }
      `}</style>

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
              className={`text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === "posts"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                }`}
            >
              <Briefcase size={15} /> Tin Đăng Tuyển
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={"text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 " + (
                activeTab === "leaves"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
              )}
            >
              <Calendar size={15} /> Xin Nghỉ / Đổi Ca ({pendingLeavesCount})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "posts" ? (
        <div className="dashboard-fade-in dashboard-fade-in-2 flex flex-col gap-6 w-full">
          {selectedJob ? (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full" style={{ animation: "fadeInUp 0.3s ease-out" }}>
              {/* Back Button */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setJobShifts([]);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-slate-650 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer shadow-xs"
                >
                  <ArrowLeft size={15} /> Quay lại danh sách
                </button>
              </div>

              {/* Main Layout Grid */}
              <div className="grid gap-6 md:grid-cols-12">
                {/* Left Side: Job Header and details */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  {/* 1. Job Overview Card (Student Style) */}
                  <div className="bg-white border border-slate-100 shadow-lg shadow-slate-900/5 rounded-3xl p-6">
                    <div className="flex items-start gap-4">
                      {/* Category Avatar */}
                      <div
                        style={{
                          backgroundColor: getShopBgColor(selectedJob.companyName || selectedJob.company || "Doanh nghiệp"),
                          color: getShopTextColor(selectedJob.companyName || selectedJob.company || "Doanh nghiệp")
                        }}
                        className="font-extrabold flex items-center justify-center rounded-2xl w-14 h-14 shrink-0 border border-slate-200/50 text-lg shadow-sm"
                      >
                        {getCategoryInitials(selectedJob.categoryName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={"text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border " + getCategoryTheme(selectedJob.categoryName).bg + " " + getCategoryTheme(selectedJob.categoryName).text + " " + getCategoryTheme(selectedJob.categoryName).border}>
                            {selectedJob.categoryName || "Part-time"}
                          </span>
                          {checkIsEmergency(selectedJob.title, selectedJob.description) && (
                            <span className="text-[10px] font-black tracking-wide uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full urgent-badge-pulse flex items-center gap-0.5 animate-pulse">
                              🔥 TUYỂN GẤP
                            </span>
                          )}
                        </div>
                        <h1 className="text-2xl font-black mt-2 text-slate-800 tracking-tight leading-tight">
                          {selectedJob.title}
                        </h1>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedJob.companyName || selectedJob.company || "Doanh nghiệp của bạn"}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                        <MapPin className="text-slate-500 shrink-0" size={20} />
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase">Địa chỉ</p>
                          <p className="text-xs text-slate-700 font-bold mt-0.5 line-clamp-1">{selectedJob.address || "Tại cửa hàng"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                        <DollarSign className="text-emerald-500 shrink-0" size={20} />
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase">Lương cơ bản</p>
                          <p className="text-xs text-emerald-600 font-black mt-0.5">
                            {selectedJob.salary && selectedJob.salary > 0
                              ? selectedJob.salary.toLocaleString("vi-VN") + " đ / giờ"
                              : "Lương thỏa thuận"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Job Detail Description Card */}
                  <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6">
                    <h2 className="font-extrabold text-slate-800 text-lg mb-3">Mô tả công việc</h2>
                    <div className="text-sm text-slate-605 leading-relaxed whitespace-pre-line">
                      {selectedJob.description || "Chưa có mô tả chi tiết từ nhà tuyển dụng."}
                    </div>

                    <h2 className="font-extrabold text-slate-800 text-lg mt-6 mb-3">Yêu cầu công việc</h2>
                    <div className="text-sm text-slate-605 leading-relaxed whitespace-pre-line">
                      {selectedJob.requirements || "Làm việc nghiêm túc, đúng giờ, có trách nhiệm."}
                    </div>

                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <>
                        <h2 className="font-extrabold text-slate-800 text-lg mt-6 mb-3">Kỹ năng yêu cầu</h2>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills.map((skill, index) => (
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
                </div>

                {/* Right Side: Shifts & Actions */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  {/* 3. Shifts & Applications Card */}
                  <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6">
                    {!selectedShiftForApprovals ? (
                      <>
                        <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Calendar size={16} className="text-purple-500" />
                          Các ca làm việc ({jobShifts.length})
                        </h4>

                        {jobShifts.length === 0 ? (
                          <p className="text-slate-400 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">Chưa có ca làm nào được thiết lập.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {jobShifts.map((shift) => {
                              const filled = shift.slotsFilled || 0;
                              const req = shift.slotsRequired || 1;
                              const isFull = filled >= req;
                              return (
                                <div
                                  key={shift.id}
                                  className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col gap-3 transition-all hover:border-purple-200"
                                >
                                  <div className="space-y-1 p-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-slate-850 flex items-center gap-1">
                                        <Clock size={13} className="text-purple-500" /> {formatShiftTimeText(shift)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                      <Calendar size={13} className="text-slate-400" /> {formatShiftDateText(shift)}
                                    </p>
                                    <div className="mt-1">
                                      <span className={"text-[9px] uppercase font-black px-2 py-0.5 rounded-full border " + (isFull ? 'bg-red-50 text-red-650 border-red-200' : 'bg-green-50 text-green-650 border-green-200')}>
                                        {isFull ? "Đầy ca" : "Còn " + (req - filled) + "/" + req + " Slot"}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleSelectShiftForApprovals(shift)}
                                    className="w-full h-9 bg-purple-600 hover:bg-purple-750 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-purple-600/10 cursor-pointer"
                                  >
                                    <UserCheck size={13} /> Duyệt ứng viên
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider">Đơn ứng cử</span>
                            <h4 className="font-black text-slate-800 text-xs mt-0.5">
                              {formatShiftTimeText(selectedShiftForApprovals)} | {formatShiftDateText(selectedShiftForApprovals)}
                            </h4>
                          </div>
                          <button
                            onClick={() => setSelectedShiftForApprovals(null)}
                            className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            ← Quay lại
                          </button>
                        </div>

                        {loadingApplicants ? (
                          <div className="flex flex-col items-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent mb-2" />
                            <p className="text-[10px] text-slate-400 font-semibold">Đang tải...</p>
                          </div>
                        ) : applicants.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 font-bold py-6">Chưa có ai ứng tuyển.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {applicants.map((app) => {
                              const status = (app.status || "").toLowerCase();
                              const isPending = status === "pending";
                              return (
                                <div
                                  key={app.id}
                                  className="border border-slate-100 p-3 rounded-xl flex flex-col gap-2.5 transition-all"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h5 className="font-black text-slate-800 text-xs">{app.studentName || "Sinh viên"}</h5>
                                      <p className="text-[9px] text-slate-400">{app.studentSchool || "Đại học FPT"}</p>
                                    </div>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                                      ★ {app.studentReputationScore || "4.8"}
                                    </span>
                                  </div>

                                  {app.introduction && (
                                    <p className="bg-slate-50 p-2 rounded-lg border text-[10px] text-slate-500 italic">
                                      "{app.introduction}"
                                    </p>
                                  )}

                                  <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                    <span className={"text-[8px] uppercase font-black px-2 py-0.5 rounded-full border " + (
                                      status === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                                        status === "rejected" ? "bg-red-50 text-red-505 border-red-200" :
                                          "bg-amber-50 text-amber-600 border-amber-200"
                                    )}>
                                      {app.status || "Chờ"}
                                    </span>

                                    {isPending && (
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleReject(app.id)}
                                          className="h-7 px-2 bg-red-50 border border-red-200 text-red-650 rounded-lg text-[10px] font-bold cursor-pointer"
                                        >
                                          Từ chối
                                        </button>
                                        <button
                                          onClick={() => handleApprove(app.id)}
                                          className="h-7 px-2.5 bg-green-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                        >
                                          Nhận
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Store Profile Card (Student style) */}
                  <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6 text-center">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-xl border border-orange-100">
                      🏪
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm mt-3 line-clamp-1">{selectedJob.companyName || selectedJob.company || "Doanh nghiệp của bạn"}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{selectedJob.address || "Tại cửa hàng"}</p>

                    <div className="mt-4 border-t border-slate-50 pt-3.5 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium">Đánh giá quán</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5 text-xs font-bold text-amber-500">
                          ★ 4.8
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium">Thanh toán</p>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">98%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ===== PAGE WIDE: Job Posts Search & Grid View ===== */
            <>
              {/* Unified Search, Action & Filter Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/4 p-5 flex flex-col gap-4 w-full">
                <div className="grid gap-3 md:grid-cols-12 items-center">
                  {/* Search box */}
                  <div className="relative md:col-span-5">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Tìm kiếm theo tiêu đề công việc hoặc tên quán..."
                      className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="relative md:col-span-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCatDropdownOpen(!catDropdownOpen);
                        setSalaryDropdownOpen(false);
                      }}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold flex items-center justify-between hover:bg-white hover:border-purple-400 transition cursor-pointer"
                    >
                      <span>{FILTER_CATEGORIES.find(c => c.id === selectedCategory)?.name || "Tất cả ngành nghề"}</span>
                      <ChevronDown size={14} className={"text-slate-400 transition-transform duration-200 " + (catDropdownOpen ? "rotate-180" : "")} />
                    </button>

                    {catDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setCatDropdownOpen(false)} />
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                          {FILTER_CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c.id);
                                setCatDropdownOpen(false);
                                setCurrentPage(1);
                              }}
                              className={"w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " + (selectedCategory === c.id ? "bg-purple-600 text-white" : "text-slate-700 hover:bg-purple-50 hover:text-purple-650")}
                            >
                              {c.name === "Tất cả" ? "Tất cả ngành nghề" : c.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Salary Dropdown */}
                  <div className="relative md:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSalaryDropdownOpen(!salaryDropdownOpen);
                        setCatDropdownOpen(false);
                      }}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold flex items-center justify-between hover:bg-white hover:border-purple-400 transition cursor-pointer"
                    >
                      <span>{minSalary === 0 ? "Tất cả mức lương" : "Từ " + minSalary.toLocaleString("vi-VN") + "đ/h"}</span>
                      <ChevronDown size={14} className={"text-slate-400 transition-transform duration-200 " + (salaryDropdownOpen ? "rotate-180" : "")} />
                    </button>

                    {salaryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSalaryDropdownOpen(false)} />
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                          {[
                            { val: 0, lbl: "Tất cả mức lương" },
                            { val: 20000, lbl: "Từ 20.000đ/h" },
                            { val: 25000, lbl: "Từ 25.000đ/h" },
                            { val: 30000, lbl: "Từ 30.000đ/h" },
                            { val: 35000, lbl: "Từ 35.000đ/h" }
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => {
                                setMinSalary(opt.val);
                                setSalaryDropdownOpen(false);
                                setCurrentPage(1);
                              }}
                              className={"w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " + (minSalary === opt.val ? "bg-purple-600 text-white" : "text-slate-700 hover:bg-purple-50 hover:text-purple-650")}
                            >
                              {opt.lbl}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Create shift button */}
                  <div className="md:col-span-2">
                    <button
                      onClick={handleOpenWizard}
                      className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/10 transition cursor-pointer"
                    >
                      <Plus size={15} /> Đăng ca làm mới
                    </button>
                  </div>
                </div>

                {/* Horizontal Category pills */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 mt-1">
                  {FILTER_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCurrentPage(1);
                        }}
                        className={"px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border cursor-pointer flex items-center gap-1.5 " + (isSelected ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/15" : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50")}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jobs Grid (Spacious Full-Width Display) */}
              <div className="w-full mt-2">
                {loadingJobs ? (
                  <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-4" />
                    <p className="text-slate-550 text-sm font-semibold">Đang tải danh sách ca tuyển dụng...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Briefcase className="text-slate-300" size={28} />
                    </div>
                    <p className="text-slate-800 font-bold text-base">Không tìm thấy ca làm phù hợp</p>
                    <p className="text-slate-400 text-sm mt-2 max-w-sm">Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm để quét rộng hơn nhé.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage).map((job) => {
                        const theme = getCategoryTheme(job.categoryName);
                        const isUrgent = checkIsEmergency(job.title, job.description);
                        return (
                          <article
                            key={job.id}
                            onClick={() => handleSelectJob(job)}
                            style={{
                              borderLeft: "6px solid " + theme.accent,
                              "--urgent-bg": theme.accentBg,
                              "--urgent-border": theme.borderLight,
                              "--urgent-glow": theme.accent + "26"
                            }}
                            className={"group relative p-5 bg-white border border-slate-100/90 rounded-2xl cursor-pointer card-hover-lift transition-all duration-300 shadow-xs hover:shadow-md " + (isUrgent ? "urgent-flashing-card" : "")}
                          >
                            <div className="flex justify-between items-start gap-4 pl-1">
                              <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                  <span className={"text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border " + theme.bg + " " + theme.text + " " + theme.border}>
                                    {job.categoryName || "Đăng tin"}
                                  </span>
                                  <span className={"text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border " + (
                                    job.status === "Published"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-255"
                                      : job.status === "Draft"
                                        ? "bg-slate-50 text-slate-500 border-slate-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  )}>
                                    {job.status === "Published" ? "Công khai" : job.status === "Draft" ? "Bản nháp" : "Đã đóng"}
                                  </span>
                                  {isUrgent && (
                                    <span className="text-[10px] font-black uppercase text-white bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-0.5 rounded-full shadow-xs">
                                      🔥 Gấp
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-black text-slate-800 text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">
                                  {job.title}
                                </h4>
                                <p className="text-xs text-slate-400 font-semibold line-clamp-1 mt-1">{job.address || "Tại cửa hàng"}</p>

                                <div className="flex flex-wrap items-center gap-4 mt-4 border-t border-slate-50 pt-3">
                                  <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                    <Calendar size={13} className="text-purple-500" />
                                    Ca làm: <strong className="text-slate-700">{job.shiftCount || 0} ca</strong>
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                                    <Wallet size={13} />
                                    {job.salary && job.salary > 0 ? job.salary.toLocaleString("vi-VN") + "đ/h" : "Lương ca"}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteJob(job.id);
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 shrink-0 self-start opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {filteredJobs.length > jobsPerPage && (
                      <div className="flex items-center justify-center gap-3 mt-6 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 max-w-xs mx-auto">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => prev - 1)}
                          className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-650 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          ← Trước
                        </button>
                        <span className="text-xs font-extrabold text-slate-500">
                          {currentPage} / {Math.ceil(filteredJobs.length / jobsPerPage)}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage === Math.ceil(filteredJobs.length / jobsPerPage)}
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredJobs.length / jobsPerPage)))}
                          className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-650 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ==================== TAB: XIN NGHỈ / ĐỔI CA ==================== */
        <div className="dashboard-fade-in dashboard-fade-in-2 flex flex-col gap-5 w-full">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-md rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  🏖️ Danh sách Yêu Cầu Xin Nghỉ / Đổi Ca
                </h2>
                <p className="text-slate-505 text-xs font-semibold mt-1">
                  Duyệt hoặc từ chối các yêu cầu xin nghỉ phép hoặc đổi ca từ sinh viên.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLeaveRequests}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {loadingLeaves ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
                <p className="text-slate-500 text-sm font-semibold">Đang tải danh sách yêu cầu...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4">🏖️</span>
                <p className="text-slate-800 font-bold text-base">Mọi người đều đi làm đầy đủ!</p>
                <p className="text-slate-400 text-xs mt-1">Không có yêu cầu xin nghỉ hoặc đổi ca nào cần xử lý.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {leaveRequests.map((request) => {
                  const isPending = request.status === 'pending';
                  const isSwap = request.type === 'swap';
                  const isApproved = request.status === 'approved';
                  const isRejected = request.status === 'rejected';

                  return (
                    <div
                      key={request.id}
                      className={"relative bg-white border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 shadow-sm hover:shadow-md " + 
                        (isPending ? "border-orange-100 hover:border-orange-300" : "border-slate-100 opacity-75")}
                    >
                      {/* Request Type tag */}
                      <div className="flex justify-between items-center">
                        <span className={"text-[10px] uppercase font-black px-2.5 py-1 rounded-full border " + 
                          (isApproved ? "bg-green-50 text-green-600 border-green-200" : 
                           isRejected ? "bg-red-50 text-red-500 border-red-200" : 
                           isSwap ? "bg-purple-50 text-purple-650 border-purple-200" : "bg-rose-50 text-rose-600 border-rose-200")}
                        >
                          {isApproved ? "✅ ĐÃ CHẤP THUẬN" : 
                           isRejected ? "❌ ĐÃ TỪ CHỐI" : 
                           isSwap ? "🔄 ĐỔI CA" : "❌ XIN NGHỈ"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">Mã số: #{request.id}</span>
                      </div>

                      {/* Employee Info Row */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center font-extrabold text-orange-600 text-sm border border-orange-100">
                          {request.staffName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm">{request.staffName}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{request.position}</p>
                        </div>
                      </div>

                      {/* Shift details box */}
                      <div className="bg-slate-50 border-l-4 border-orange-400 p-4 rounded-r-xl text-xs space-y-1.5">
                        <p className="font-extrabold text-slate-700">Công việc: {request.jobTitle}</p>
                        <p className="text-slate-500 font-bold">📅 Ca làm: {request.shiftTime} | {request.shiftDate}</p>
                        <p className="text-slate-500 italic mt-1 bg-white p-2.5 rounded-lg border border-slate-100">
                          "Lý do: {request.reason}"
                        </p>
                      </div>

                      {/* Actions row */}
                      {isPending && (
                        <div className="flex gap-2.5 border-t border-slate-100 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleActionLeaveRequest(request.id, 'rejected')}
                            className="flex-1 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-xl font-bold text-xs transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActionLeaveRequest(request.id, 'approved')}
                            className="flex-1 h-9 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Duyệt {isSwap ? "Đổi ⚡" : "Nghỉ ⚡"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                        className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 " + (
                          wizardStep >= num
                            ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm scale-110"
                            : "bg-slate-200 text-slate-500"
                        )}
                      >
                        {num}
                      </div>
                      <span
                        className={"text-[10px] font-bold uppercase tracking-wider hidden sm:inline " + (
                          wizardStep >= num ? "text-slate-800" : "text-slate-400"
                        )}
                      >
                        Bước {num}
                      </span>
                      {num < 3 && <div className={"w-4 h-0.5 transition-colors " + (wizardStep > num ? "bg-orange-400" : "bg-slate-200")} />}
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
                      <label className="text-sm font-bold text-slate-700">Tiêu đề công việc <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Phục vụ bàn ca sáng..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md focus:shadow-orange-500/5 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-sm font-bold text-slate-700">Ngành nghề <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => setIsOpenCategory(!isOpenCategory)}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:shadow-md transition-all flex items-center justify-between cursor-pointer font-bold text-slate-700"
                      >
                        <span>{
                          categoryId === 1 ? "Phục vụ ăn uống" :
                          categoryId === 2 ? "Pha chế" :
                          categoryId === 3 ? "Kho vận / Xếp dỡ" :
                          categoryId === 4 ? "Shipper / Giao hàng" : "Khác..."
                        }</span>
                        <ChevronDown size={16} className={"text-slate-450 transition-transform duration-250 " + (isOpenCategory ? "rotate-180" : "")} />
                      </button>

                      {isOpenCategory && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsOpenCategory(false)} />
                          <div className="absolute top-[82px] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-2xl z-50 p-1.5 space-y-1" style={{ animation: "fadeInUp 0.15s ease-out" }}>
                            {[
                              { value: 1, label: "Phục vụ ăn uống" },
                              { value: 2, label: "Pha chế" },
                              { value: 3, label: "Kho vận / Xếp dỡ" },
                              { value: 4, label: "Shipper / Giao hàng" },
                              { value: 9999, label: "Khác..." }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setCategoryId(opt.value);
                                  setIsOpenCategory(false);
                                }}
                                className={"w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between " + (categoryId === opt.value ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-orange-50 hover:text-orange-600")}
                              >
                                <span>{opt.label}</span>
                                {categoryId === opt.value && <Check size={14} className="text-white" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {Number(categoryId) === 9999 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Tên ngành nghề khác tự chọn <span className="text-red-500">*</span></label>
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
                      <label className="text-sm font-bold text-slate-700">Mô tả chi tiết <span className="text-red-500">*</span></label>
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
                      <label className="text-sm font-bold text-slate-700">Yêu cầu đối với ứng viên <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-bold text-slate-700">Mức lương đề xuất (VND/giờ) <span className="text-red-500">*</span></label>
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
                            className={"px-3.5 py-2 rounded-xl text-sm font-bold transition-all border " + (isSelected ? "bg-orange-500 text-white border-orange-600 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300")}
                          >
                            {isSelected ? '✓ ' : ''}{skillName}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowCustomSkillInput(!showCustomSkillInput)}
                        className={"px-3.5 py-2 rounded-xl text-sm font-bold transition-all border " + (showCustomSkillInput ? "bg-amber-500 text-white border-amber-600 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100")}
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
                      <label className="text-sm font-bold text-slate-700">Địa chỉ ca làm <span className="text-red-500">*</span></label>
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

                    <div className="space-y-3 p-1 bg-slate-50/50 rounded-2xl overflow-visible">
                      {shiftsInput.map((shift, idx) => (
                        <div key={idx} className="bg-white border p-4 rounded-xl flex flex-wrap gap-3 items-end">
                          <div className="flex-1 min-w-[130px] relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ngày làm việc <span className="text-red-500">*</span></p>
                            <CustomDatePicker
                              value={shift.date}
                              onChange={(val) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].date = val;
                                setShiftsInput(newShifts);
                              }}
                              inputHeightClass="h-10"
                            />
                          </div>
                          <div className="w-28">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ vào <span className="text-red-500">*</span></p>
                            <CustomTimePicker
                              value={shift.startTime}
                              onChange={(val) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].startTime = val;
                                setShiftsInput(newShifts);
                              }}
                              inputHeightClass="h-10"
                            />
                          </div>
                          <div className="w-28">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Giờ ra <span className="text-red-500">*</span></p>
                            <CustomTimePicker
                              value={shift.endTime}
                              onChange={(val) => {
                                const newShifts = [...shiftsInput];
                                newShifts[idx].endTime = val;
                                setShiftsInput(newShifts);
                              }}
                              inputHeightClass="h-10"
                            />
                          </div>
                          <div className="w-20">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Slots <span className="text-red-500">*</span></p>
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
                          toast.warning("Vui lòng điền đầy đủ tiêu đề, mô tả và yêu cầu ứng viên.");
                          return;
                        }
                        if (Number(categoryId) === 9999 && !customCategory.trim()) {
                          toast.warning("Vui lòng nhập tên ngành nghề khác.");
                          return;
                        }
                      } else if (wizardStep === 2) {
                        if (!salary || Number(salary) <= 0) {
                          toast.warning("Vui lòng nhập mức lương hợp lệ.");
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


