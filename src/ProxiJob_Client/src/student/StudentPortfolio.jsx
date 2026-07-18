import { useState, useEffect, useRef } from "react";
import {
  User, Mail, School, BookOpen, Star, Award, ShieldCheck,
  Check, Save, Camera, Phone, Calendar, MapPin, Info, Plus, X, ChevronDown
} from "lucide-react";
import { getStudentProfileApi, updateStudentProfileApi } from "../api/studentApi";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

export default function StudentPortfolio() {
  const { user, setCurrentUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1");
  const [bio, setBio] = useState("");

  // Skills tags state
  const [skills, setSkills] = useState("");
  const [skillInput, setSkillInput] = useState("");

  // Custom dropdown & datepicker states
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const fileInputRef = useRef(null);

  // Sync calendar views
  useEffect(() => {
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
      }
    }
  }, [dateOfBirth]);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const yearsArray = [];
  for (let y = 2016; y >= 1950; y--) {
    yearsArray.push(y);
  }

  const getDaysArray = () => {
    const days = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    
    // Fill previous month empty days
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: viewMonth === 0 ? 11 : viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true
      });
    }
    
    // Fill next month days
    const totalSlots = 42; // 6 rows * 7 days
    const nextDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      days.push({
        day: i,
        month: viewMonth === 11 ? 0 : viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const formatDateString = (dateStr) => {
    if (!dateStr) return "Chọn ngày sinh";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getStudentProfileApi()
      .then((data) => {
        setProfile(data);
        if (data) {
          setPhoneNumber(data.phoneNumber || "");
          setAvatarUrl(data.avatarUrl || "");
          setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
          setGender(data.gender || "Nam");
          setAddress(data.address || "");
          setCity(data.city || "");
          setSchool(data.school || "");
          setMajor(data.major || "");
          setYearOfStudy(data.yearOfStudy ? data.yearOfStudy.toString() : "1");
          setBio(data.bio || "");
          setSkills(data.skills || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to load student profile:", err);
        // Fallback mock profile for demo
        const mockProfile = {
          school: "Đại học FPT",
          major: "Kỹ thuật phần mềm",
          skills: "Phục vụ bàn, Pha chế, Tiếng Anh giao tiếp",
          phoneNumber: "0901234567",
          avatarUrl: "",
          dateOfBirth: "2004-01-01",
          gender: "Nam",
          address: "Lô E2a-7, Đường D1, Đ. Phường Tân Phú, TP. Thủ Đức",
          city: "Hồ Chí Minh",
          yearOfStudy: "3",
          bio: "Mình là sinh viên năm 3 chuyên ngành Kỹ thuật Phần mềm tại Đại học FPT. Có kinh nghiệm làm part-time phục vụ và trợ giảng.",
          reputationScore: 4.8,
          totalShifts: 15
        };
        setProfile(mockProfile);
        setPhoneNumber(mockProfile.phoneNumber);
        setAvatarUrl(mockProfile.avatarUrl);
        setDateOfBirth(mockProfile.dateOfBirth);
        setGender(mockProfile.gender);
        setAddress(mockProfile.address);
        setCity(mockProfile.city);
        setSchool(mockProfile.school);
        setMajor(mockProfile.major);
        setYearOfStudy(mockProfile.yearOfStudy);
        setBio(mockProfile.bio);
        setSkills(mockProfile.skills);
        setLoading(false);
      });
  }, [user]);

  // Skill Tag Handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;

    const currentList = skills
      ? skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    if (currentList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("Kỹ năng này đã tồn tại trong danh sách!");
      return;
    }

    const updated = [...currentList, trimmed].join(", ");
    setSkills(updated);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentList = skills
      ? skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const updated = currentList.filter(s => s !== skillToRemove).join(", ");
    setSkills(updated);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        phoneNumber,
        avatarUrl,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        gender,
        address,
        city,
        school,
        major,
        yearOfStudy: parseInt(yearOfStudy) || 1,
        bio,
        skills
      };
      await updateStudentProfileApi(payload);

      // Update global context user state if avatar has changed
      if (user && setCurrentUser) {
        setCurrentUser({
          ...user,
          avatarUrl: avatarUrl
        });
      }

      toast.success("Cập nhật hồ sơ năng lực thành công! ✨");
    } catch (err) {
      toast.error(err.message || "Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  const parsedSkills = skills
    ? skills.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải hồ sơ năng lực của bạn...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      {/* 1. Header Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-950/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Student Avatar"
                  className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-lg transition duration-300 group-hover:brightness-90"
                />
              ) : (
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md border-4 border-white/30 rounded-full flex items-center justify-center text-4xl shadow-lg transition duration-300 group-hover:bg-white/30">
                  👨‍🎓
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <Camera size={24} className="text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex flex-col md:flex-row items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{user?.name || "Sinh viên"}</h1>
                <span className="text-[10px] uppercase font-black px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                  Sinh Viên
                </span>
              </div>
              <p className="text-xs text-orange-100 font-semibold mt-1">{user?.email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4 text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-900 bg-white/90 px-3 py-1.5 rounded-xl shadow-xs">
                  <Star size={13} className="text-amber-500" fill="currentColor" /> {profile?.reputationScore || "4.8"} Uy tín
                </span>
                <span className="flex items-center gap-1 font-bold text-orange-950 bg-white/90 px-3 py-1.5 rounded-xl shadow-xs">
                  💼 {profile?.totalShifts || "12"} Ca làm hoàn thành
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Background blobs for premium decoration */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Form content layout */}
      <form onSubmit={handleSaveProfile} className="grid gap-6 md:grid-cols-12">

        {/* Left column - Personal info settings */}
        <div className="md:col-span-8 bg-white border border-slate-100 shadow-xl rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <User size={16} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Thông tin cá nhân</h2>
              <p className="text-[10px] text-slate-400">Thiết lập các thông tin liên lạc và lý lịch cơ bản của bạn</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> Số điện thoại
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" /> Ngày sinh
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-white hover:border-orange-400 transition cursor-pointer"
                >
                  <span>{formatDateString(dateOfBirth)}</span>
                  <Calendar size={14} className="text-slate-400" />
                </button>
                
                {datePickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDatePickerOpen(false)} />
                    <div className="absolute z-50 left-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 w-72 flex flex-col gap-3">
                      {/* DatePicker Header */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition cursor-pointer"
                        >
                          &larr;
                        </button>
                        
                        <div className="flex gap-1">
                          <select
                            value={viewMonth}
                            onChange={(e) => setViewMonth(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg focus:outline-none cursor-pointer"
                          >
                            {monthNames.map((m, idx) => (
                              <option key={idx} value={idx}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg focus:outline-none cursor-pointer"
                          >
                            {yearsArray.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition cursor-pointer"
                        >
                          &rarr;
                        </button>
                      </div>

                      {/* Day labels */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysArray().map((item, idx) => {
                          const isSelected = dateOfBirth && 
                            new Date(dateOfBirth).getDate() === item.day && 
                            new Date(dateOfBirth).getMonth() === item.month && 
                            new Date(dateOfBirth).getFullYear() === item.year;
                          
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const mStr = String(item.month + 1).padStart(2, "0");
                                const dStr = String(item.day).padStart(2, "0");
                                setDateOfBirth(`${item.year}-${mStr}-${dStr}`);
                                setDatePickerOpen(false);
                              }}
                              className={`h-7 w-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                                !item.isCurrentMonth 
                                  ? "text-slate-350 hover:bg-slate-50" 
                                  : isSelected
                                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/20"
                                  : "text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                              }`}
                            >
                              {item.day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Giới tính</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-750 flex items-center justify-between hover:bg-white hover:border-orange-400 transition cursor-pointer"
                >
                  <span>{gender}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${genderDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {genderDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setGenderDropdownOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                      {["Nam", "Nữ", "Khác"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setGender(opt);
                            setGenderDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            gender === opt
                              ? "bg-orange-600 text-white"
                              : "text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" /> Thành phố
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ví dụ: Hồ Chí Minh, Hà Nội..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" /> Địa chỉ thường trú
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ nhà, tên đường, phường/xã, quận/huyện..."
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Info size={14} className="text-slate-400" /> Giới thiệu ngắn về bản thân
            </label>
            <textarea
              rows={4}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ một chút thông tin về thế mạnh, sở thích và kinh nghiệm làm việc của bạn để tạo lòng tin với nhà tuyển dụng..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Right column - Education and Skills */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Education panel */}
          <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <School size={16} />
              </div>
              <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Học vấn & Đào tạo</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Trường học
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Ví dụ: Đại học FPT..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Chuyên ngành
              </label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Ví dụ: Kỹ thuật phần mềm..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Sinh viên năm</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-750 flex items-center justify-between hover:bg-white hover:border-orange-400 transition cursor-pointer"
                >
                  <span>{yearOfStudy === "1" ? "Năm 1" : yearOfStudy === "2" ? "Năm 2" : yearOfStudy === "3" ? "Năm 3" : yearOfStudy === "4" ? "Năm 4" : "Năm 5 / Khác"}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${yearDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {yearDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setYearDropdownOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                      {[
                        { val: "1", lbl: "Năm 1" },
                        { val: "2", lbl: "Năm 2" },
                        { val: "3", lbl: "Năm 3" },
                        { val: "4", lbl: "Năm 4" },
                        { val: "5", lbl: "Năm 5 / Khác" }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setYearOfStudy(opt.val);
                            setYearDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            yearOfStudy === opt.val
                              ? "bg-orange-600 text-white"
                              : "text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          {opt.lbl}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Skills tags panel */}
          <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                <Award size={16} />
              </div>
              <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Kỹ năng năng lực</h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Nhập kỹ năng mới..."
                className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSkill(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="w-11 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/10 transition cursor-pointer font-bold"
              >
                <Plus size={18} />
              </button>
            </div>

            {parsedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {parsedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold transition hover:bg-orange-100"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-orange-400 hover:text-orange-600 focus:outline-none ml-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">Chưa thêm kỹ năng nào. Nhập kỹ năng và bấm nút cộng để thêm.</p>
            )}

            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-[10px] text-orange-800 leading-relaxed flex items-start gap-2">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <p>Mẹo: Thêm nhiều kỹ năng cụ thể (ví dụ: Pha chế cafe, Tin học văn phòng) giúp tin tuyển dụng phù hợp radar định vị của bạn hơn.</p>
            </div>
          </div>

          {/* Form save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/15 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save size={14} /> Lưu Thay Đổi Hồ Sơ
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
