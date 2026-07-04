// ============================================================
// ProxiJob Admin — Mock Data & Helpers
// ============================================================

// ---------- USERS ----------
export const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@proxijob.vn",
    fullName: "Nguyễn Văn Admin",
    phoneNumber: "0901000001",
    avatarUrl: null,
    isActive: true,
    role: "Admin",
    createdAt: "2026-01-15T08:00:00Z",
    jobPostsUsed: 0,
  },
  {
    id: 2,
    username: "business1",
    email: "quanan123@gmail.com",
    fullName: "Trần Minh Khôi",
    phoneNumber: "0901000002",
    avatarUrl: null,
    isActive: true,
    role: "Business",
    createdAt: "2026-02-10T10:30:00Z",
    jobPostsUsed: 5,
    businessProfile: {
      businessName: "Quán Cà Phê Sài Gòn",
      businessType: "Quán cà phê",
      address: "123 Nguyễn Huệ, Q.1, TP.HCM",
      city: "TP.HCM",
      taxCode: "0123456789",
      description: "Quán cà phê phong cách hiện đại, phục vụ cà phê specialty",
      reputationScore: 4.5,
      reviewCount: 23,
    },
  },
  {
    id: 3,
    username: "business2",
    email: "nhahangpho@gmail.com",
    fullName: "Lê Thị Hương",
    phoneNumber: "0901000003",
    avatarUrl: null,
    isActive: true,
    role: "Business",
    createdAt: "2026-03-05T14:20:00Z",
    jobPostsUsed: 12,
    businessProfile: {
      businessName: "Nhà Hàng Phở Bò Kho",
      businessType: "Nhà hàng",
      address: "456 Lý Tự Trọng, Q.3, TP.HCM",
      city: "TP.HCM",
      taxCode: "0987654321",
      description: "Nhà hàng chuyên phở và bò kho truyền thống",
      reputationScore: 4.8,
      reviewCount: 67,
    },
  },
  {
    id: 4,
    username: "student1",
    email: "nguyenvanan@student.edu.vn",
    fullName: "Nguyễn Văn An",
    phoneNumber: "0901000004",
    avatarUrl: null,
    isActive: true,
    role: "Student",
    createdAt: "2026-03-12T09:15:00Z",
    jobPostsUsed: 0,
    studentProfile: {
      dateOfBirth: "2004-05-20",
      gender: "Nam",
      address: "78 Trần Hưng Đạo, Q.5, TP.HCM",
      city: "TP.HCM",
      school: "ĐH Bách Khoa TP.HCM",
      major: "Công nghệ thông tin",
      yearOfStudy: 3,
      bio: "Sinh viên năm 3 CNTT, muốn tìm việc part-time dịch vụ ăn uống",
      skills: "Pha chế, phục vụ, giao tiếp tốt",
      reputationScore: 4.2,
      reviewCount: 8,
    },
  },
  {
    id: 5,
    username: "student2",
    email: "phamthib@student.edu.vn",
    fullName: "Phạm Thị Bích",
    phoneNumber: "0901000005",
    avatarUrl: null,
    isActive: true,
    role: "Student",
    createdAt: "2026-04-01T11:45:00Z",
    jobPostsUsed: 0,
    studentProfile: {
      dateOfBirth: "2003-11-15",
      gender: "Nữ",
      address: "12 Nguyễn Trãi, Q.1, TP.HCM",
      city: "TP.HCM",
      school: "ĐH Kinh Tế TP.HCM",
      major: "Quản trị kinh doanh",
      yearOfStudy: 4,
      bio: "Sinh viên năm cuối, kinh nghiệm phục vụ nhà hàng 2 năm",
      skills: "Phục vụ, thu ngân, quản lý kho",
      reputationScore: 4.7,
      reviewCount: 15,
    },
  },
  {
    id: 6,
    username: "student3",
    email: "levanc@student.edu.vn",
    fullName: "Lê Văn Cường",
    phoneNumber: "0901000006",
    avatarUrl: null,
    isActive: false,
    role: "Student",
    createdAt: "2026-04-15T16:30:00Z",
    jobPostsUsed: 0,
    studentProfile: {
      dateOfBirth: "2005-02-28",
      gender: "Nam",
      address: "99 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM",
      city: "TP.HCM",
      school: "ĐH FPT TP.HCM",
      major: "Kỹ thuật phần mềm",
      yearOfStudy: 2,
      bio: "Sinh viên năm 2, muốn kiếm thêm thu nhập",
      skills: "Pha chế cơ bản, nhiệt tình",
      reputationScore: 3.8,
      reviewCount: 3,
    },
  },
  {
    id: 7,
    username: "business3",
    email: "trasu@gmail.com",
    fullName: "Hoàng Đức Trung",
    phoneNumber: "0901000007",
    avatarUrl: null,
    isActive: true,
    role: "Business",
    createdAt: "2026-05-20T08:00:00Z",
    jobPostsUsed: 3,
    businessProfile: {
      businessName: "Trà Sữa TocoToco Q.7",
      businessType: "Quán trà sữa",
      address: "200 Nguyễn Thị Thập, Q.7, TP.HCM",
      city: "TP.HCM",
      taxCode: "1122334455",
      description: "Chi nhánh TocoToco tại Q.7",
      reputationScore: 4.1,
      reviewCount: 11,
    },
  },
  {
    id: 8,
    username: "student4",
    email: "tranthid@student.edu.vn",
    fullName: "Trần Thị Duyên",
    phoneNumber: "0901000008",
    avatarUrl: null,
    isActive: true,
    role: "Student",
    createdAt: "2026-05-25T13:00:00Z",
    jobPostsUsed: 0,
    studentProfile: {
      dateOfBirth: "2004-08-10",
      gender: "Nữ",
      address: "55 Phạm Văn Đồng, Q.Thủ Đức, TP.HCM",
      city: "TP.HCM",
      school: "ĐH Sư Phạm TP.HCM",
      major: "Ngôn ngữ Anh",
      yearOfStudy: 3,
      bio: "Giao tiếp tiếng Anh tốt, phù hợp phục vụ khách quốc tế",
      skills: "Tiếng Anh, phục vụ, pha chế",
      reputationScore: 4.6,
      reviewCount: 12,
    },
  },
];

export function getAdminUsers() {
  let realUsers = [];
  try {
    const raw = localStorage.getItem('proxijob_users');
    if (raw) {
      realUsers = JSON.parse(raw).map(u => ({
        id: u.id,
        username: u.email.split('@')[0],
        email: u.email,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber || '',
        avatarUrl: null,
        isActive: true,
        role: u.role || 'Student',
        createdAt: new Date(u.createdAt).toISOString(),
        jobPostsUsed: 0,
      }));
    }
  } catch (e) {}

  const allUsers = [...mockUsers, ...realUsers];
  const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.email, u])).values());
  return uniqueUsers;
}

// ---------- SUBSCRIPTIONS ----------
export const mockSubscriptions = [
  {
    id: 1,
    name: "Miễn phí",
    description: "Gói cơ bản cho chủ quán mới bắt đầu",
    price: 0,
    variableCost: 0,
    grossMargin: 0,
    billingType: "PerShift",
    jobPostLimit: 3,
    durationDays: 30,
    hasPriorityDisplay: false,
    hasHrManagement: false,
    activeUsers: 2,
    features: [
      "Đăng tối đa 3 tin/tháng",
      "Hiển thị thường",
      "Hỗ trợ qua email",
    ],
  },
  {
    id: 2,
    name: "Cơ bản",
    description: "Gói phù hợp cho quán nhỏ, tuyển dụng thường xuyên",
    price: 199000,
    variableCost: 50000,
    grossMargin: 149000,
    billingType: "Monthly",
    jobPostLimit: 10,
    durationDays: 30,
    hasPriorityDisplay: false,
    hasHrManagement: false,
    activeUsers: 1,
    features: [
      "Đăng tối đa 10 tin/tháng",
      "Hiển thị thường",
      "Hỗ trợ qua chat",
      "Thống kê cơ bản",
    ],
  },
  {
    id: 3,
    name: "Chuyên nghiệp",
    description: "Gói nâng cao cho chuỗi quán và nhà hàng",
    price: 499000,
    variableCost: 100000,
    grossMargin: 399000,
    billingType: "Monthly",
    jobPostLimit: 50,
    durationDays: 30,
    hasPriorityDisplay: true,
    hasHrManagement: true,
    activeUsers: 1,
    features: [
      "Đăng tối đa 50 tin/tháng",
      "Ưu tiên hiển thị",
      "Quản lý nhân sự (HR)",
      "Hỗ trợ ưu tiên 24/7",
      "Thống kê nâng cao",
      "QR Code chấm công",
    ],
  },
  {
    id: 4,
    name: "Doanh nghiệp",
    description: "Gói dành cho doanh nghiệp lớn với nhu cầu tuyển dụng cao",
    price: 999000,
    variableCost: 150000,
    grossMargin: 849000,
    billingType: "Monthly",
    jobPostLimit: 999,
    durationDays: 30,
    hasPriorityDisplay: true,
    hasHrManagement: true,
    activeUsers: 0,
    features: [
      "Đăng tin không giới hạn",
      "Ưu tiên hiển thị cao nhất",
      "Quản lý nhân sự đầy đủ",
      "Account manager riêng",
      "API tích hợp",
      "Báo cáo tuỳ chỉnh",
    ],
  },
];

// ---------- PAYMENT ORDERS ----------
export const mockPaymentOrders = [
  {
    orderId: 1,
    orderCode: "PJ-2026-0001",
    status: "Pending",
    amount: 499000,
    planId: 3,
    planName: "Chuyên nghiệp",
    userId: 2,
    userEmail: "quanan123@gmail.com",
    userFullName: "Trần Minh Khôi",
    createdAt: "2026-06-28T14:30:00Z",
    expiresAt: "2026-06-29T14:30:00Z",
    paidAt: null,
    confirmedBy: null,
    adminNote: null,
    gateway: "BankTransfer",
  },
  {
    orderId: 2,
    orderCode: "PJ-2026-0002",
    status: "Pending",
    amount: 199000,
    planId: 2,
    planName: "Cơ bản",
    userId: 7,
    userEmail: "trasu@gmail.com",
    userFullName: "Hoàng Đức Trung",
    createdAt: "2026-06-29T09:15:00Z",
    expiresAt: "2026-06-30T09:15:00Z",
    paidAt: null,
    confirmedBy: null,
    adminNote: null,
    gateway: "BankTransfer",
  },
  {
    orderId: 3,
    orderCode: "PJ-2026-0003",
    status: "Pending",
    amount: 999000,
    planId: 4,
    planName: "Doanh nghiệp",
    userId: 3,
    userEmail: "nhahangpho@gmail.com",
    userFullName: "Lê Thị Hương",
    createdAt: "2026-06-30T08:00:00Z",
    expiresAt: "2026-07-01T08:00:00Z",
    paidAt: null,
    confirmedBy: null,
    adminNote: null,
    gateway: "BankTransfer",
  },
  {
    orderId: 4,
    orderCode: "PJ-2026-0004",
    status: "Paid",
    amount: 499000,
    planId: 3,
    planName: "Chuyên nghiệp",
    userId: 3,
    userEmail: "nhahangpho@gmail.com",
    userFullName: "Lê Thị Hương",
    createdAt: "2026-06-20T10:00:00Z",
    expiresAt: "2026-06-21T10:00:00Z",
    paidAt: "2026-06-20T11:30:00Z",
    confirmedBy: "admin@proxijob.vn",
    adminNote: "Đã nhận CK MB Bank",
    gateway: "BankTransfer",
  },
  {
    orderId: 5,
    orderCode: "PJ-2026-0005",
    status: "Paid",
    amount: 199000,
    planId: 2,
    planName: "Cơ bản",
    userId: 2,
    userEmail: "quanan123@gmail.com",
    userFullName: "Trần Minh Khôi",
    createdAt: "2026-05-15T16:45:00Z",
    expiresAt: "2026-05-16T16:45:00Z",
    paidAt: "2026-05-15T17:20:00Z",
    confirmedBy: "admin@proxijob.vn",
    adminNote: "OK, đã xác nhận",
    gateway: "BankTransfer",
  },
  {
    orderId: 6,
    orderCode: "PJ-2026-0006",
    status: "Cancelled",
    amount: 499000,
    planId: 3,
    planName: "Chuyên nghiệp",
    userId: 7,
    userEmail: "trasu@gmail.com",
    userFullName: "Hoàng Đức Trung",
    createdAt: "2026-06-10T12:00:00Z",
    expiresAt: "2026-06-11T12:00:00Z",
    paidAt: null,
    confirmedBy: "admin@proxijob.vn",
    adminNote: "Không nhận được chuyển khoản",
    gateway: "BankTransfer",
  },
  {
    orderId: 7,
    orderCode: "PJ-2026-0007",
    status: "Expired",
    amount: 199000,
    planId: 2,
    planName: "Cơ bản",
    userId: 2,
    userEmail: "quanan123@gmail.com",
    userFullName: "Trần Minh Khôi",
    createdAt: "2026-04-01T08:00:00Z",
    expiresAt: "2026-04-02T08:00:00Z",
    paidAt: null,
    confirmedBy: null,
    adminNote: null,
    gateway: "BankTransfer",
  },
  {
    orderId: 8,
    orderCode: "PJ-2026-0008",
    status: "Paid",
    amount: 199000,
    planId: 2,
    planName: "Cơ bản",
    userId: 7,
    userEmail: "trasu@gmail.com",
    userFullName: "Hoàng Đức Trung",
    createdAt: "2026-06-25T14:00:00Z",
    expiresAt: "2026-06-26T14:00:00Z",
    paidAt: "2026-06-25T15:00:00Z",
    confirmedBy: "admin@proxijob.vn",
    adminNote: "Xác nhận nhanh",
    gateway: "BankTransfer",
  },
];

// ---------- JOB POSTS ----------
export const mockJobPosts = [
  {
    id: 1,
    businessId: 2,
    businessName: "Quán Cà Phê Sài Gòn",
    title: "Nhân viên pha chế part-time",
    description: "Cần tuyển nhân viên pha chế cho ca tối, ưu tiên sinh viên có kinh nghiệm.",
    requirements: "Có kinh nghiệm pha chế, ngoại hình ưa nhìn, giao tiếp tốt",
    status: "Published",
    category: "Pha chế",
    location: { address: "123 Nguyễn Huệ, Q.1, TP.HCM", city: "TP.HCM", latitude: 10.7769, longitude: 106.7009 },
    shifts: [
      { dayOfWeek: "Thứ 2", startTime: "17:00", endTime: "22:00", hourlyRate: 30000 },
      { dayOfWeek: "Thứ 4", startTime: "17:00", endTime: "22:00", hourlyRate: 30000 },
      { dayOfWeek: "Thứ 6", startTime: "17:00", endTime: "22:00", hourlyRate: 30000 },
    ],
    skills: ["Pha chế", "Latte Art"],
    createdAt: "2026-06-20T10:00:00Z",
    applicationsCount: 5,
  },
  {
    id: 2,
    businessId: 3,
    businessName: "Nhà Hàng Phở Bò Kho",
    title: "Phục vụ bàn cuối tuần",
    description: "Tuyển nhân viên phục vụ bàn cho cuối tuần, lương hấp dẫn.",
    requirements: "Sinh viên năng động, chịu khó, có thể làm cuối tuần",
    status: "Published",
    category: "Phục vụ",
    location: { address: "456 Lý Tự Trọng, Q.3, TP.HCM", city: "TP.HCM", latitude: 10.7756, longitude: 106.6921 },
    shifts: [
      { dayOfWeek: "Thứ 7", startTime: "10:00", endTime: "14:00", hourlyRate: 28000 },
      { dayOfWeek: "Thứ 7", startTime: "17:00", endTime: "21:00", hourlyRate: 32000 },
      { dayOfWeek: "CN", startTime: "10:00", endTime: "14:00", hourlyRate: 28000 },
      { dayOfWeek: "CN", startTime: "17:00", endTime: "21:00", hourlyRate: 32000 },
    ],
    skills: ["Phục vụ", "Giao tiếp"],
    createdAt: "2026-06-22T08:30:00Z",
    applicationsCount: 12,
  },
  {
    id: 3,
    businessId: 7,
    businessName: "Trà Sữa TocoToco Q.7",
    title: "Nhân viên bán hàng ca sáng",
    description: "Tuyển nhân viên bán hàng ca sáng từ 7h-12h, phù hợp sinh viên buổi chiều rảnh.",
    requirements: "Nhanh nhẹn, thân thiện, biết pha chế trà sữa cơ bản",
    status: "Published",
    category: "Bán hàng",
    location: { address: "200 Nguyễn Thị Thập, Q.7, TP.HCM", city: "TP.HCM", latitude: 10.7380, longitude: 106.7218 },
    shifts: [
      { dayOfWeek: "Thứ 2", startTime: "07:00", endTime: "12:00", hourlyRate: 25000 },
      { dayOfWeek: "Thứ 3", startTime: "07:00", endTime: "12:00", hourlyRate: 25000 },
      { dayOfWeek: "Thứ 5", startTime: "07:00", endTime: "12:00", hourlyRate: 25000 },
    ],
    skills: ["Pha chế", "Bán hàng"],
    createdAt: "2026-06-25T07:00:00Z",
    applicationsCount: 3,
  },
  {
    id: 4,
    businessId: 2,
    businessName: "Quán Cà Phê Sài Gòn",
    title: "Thu ngân part-time",
    description: "Cần nhân viên thu ngân part-time, ưu tiên sinh viên có kinh nghiệm.",
    requirements: "Cẩn thận, trung thực, biết sử dụng máy POS",
    status: "Draft",
    category: "Thu ngân",
    location: { address: "123 Nguyễn Huệ, Q.1, TP.HCM", city: "TP.HCM", latitude: 10.7769, longitude: 106.7009 },
    shifts: [
      { dayOfWeek: "Thứ 3", startTime: "14:00", endTime: "20:00", hourlyRate: 28000 },
      { dayOfWeek: "Thứ 5", startTime: "14:00", endTime: "20:00", hourlyRate: 28000 },
    ],
    skills: ["Thu ngân", "POS"],
    createdAt: "2026-06-28T15:30:00Z",
    applicationsCount: 0,
  },
  {
    id: 5,
    businessId: 3,
    businessName: "Nhà Hàng Phở Bò Kho",
    title: "Nhân viên bếp phụ",
    description: "Tuyển nhân viên bếp phụ giúp chuẩn bị nguyên liệu, rửa chén.",
    requirements: "Chịu khó, sạch sẽ, có thể đứng lâu",
    status: "Closed",
    category: "Bếp",
    location: { address: "456 Lý Tự Trọng, Q.3, TP.HCM", city: "TP.HCM", latitude: 10.7756, longitude: 106.6921 },
    shifts: [
      { dayOfWeek: "Thứ 2-CN", startTime: "08:00", endTime: "14:00", hourlyRate: 26000 },
    ],
    skills: ["Nấu ăn cơ bản"],
    createdAt: "2026-05-10T09:00:00Z",
    applicationsCount: 8,
  },
  {
    id: 6,
    businessId: 7,
    businessName: "Trà Sữa TocoToco Q.7",
    title: "Nhân viên giao hàng nội khu",
    description: "Giao hàng cho các đơn GrabFood/ShopeeFood trong khu vực Q.7",
    requirements: "Có xe máy, GPLX, biết đường Q.7",
    status: "Published",
    category: "Giao hàng",
    location: { address: "200 Nguyễn Thị Thập, Q.7, TP.HCM", city: "TP.HCM", latitude: 10.7380, longitude: 106.7218 },
    shifts: [
      { dayOfWeek: "Thứ 2-CN", startTime: "11:00", endTime: "14:00", hourlyRate: 35000 },
      { dayOfWeek: "Thứ 2-CN", startTime: "17:00", endTime: "21:00", hourlyRate: 35000 },
    ],
    skills: ["Giao hàng", "Lái xe"],
    createdAt: "2026-06-27T10:00:00Z",
    applicationsCount: 7,
  },
];

// ---------- RECENT ACTIVITIES ----------
export const mockActivities = [
  { id: 1, type: "payment", message: "Trần Minh Khôi tạo đơn thanh toán gói Chuyên nghiệp", time: "2026-06-28T14:30:00Z" },
  { id: 2, type: "user", message: "Trần Thị Duyên đăng ký tài khoản Student mới", time: "2026-06-28T13:00:00Z" },
  { id: 3, type: "job", message: "Quán Cà Phê Sài Gòn đăng tin 'Thu ngân part-time'", time: "2026-06-28T15:30:00Z" },
  { id: 4, type: "payment", message: "Hoàng Đức Trung tạo đơn thanh toán gói Cơ bản", time: "2026-06-29T09:15:00Z" },
  { id: 5, type: "payment", message: "Lê Thị Hương tạo đơn thanh toán gói Doanh nghiệp", time: "2026-06-30T08:00:00Z" },
  { id: 6, type: "job", message: "Trà Sữa TocoToco Q.7 đăng tin 'Giao hàng nội khu'", time: "2026-06-27T10:00:00Z" },
  { id: 7, type: "user", message: "Lê Văn Cường bị vô hiệu hoá tài khoản", time: "2026-06-26T16:00:00Z" },
  { id: 8, type: "payment", message: "Admin xác nhận đơn PJ-2026-0008 cho Hoàng Đức Trung", time: "2026-06-25T15:00:00Z" },
];

// ---------- ADMIN AUTH ----------
const ADMIN_SESSION_KEY = "proxijob_admin_session";

export const ADMIN_CREDENTIALS = {
  email: "admin@proxijob.test",
  password: "Password1!",
};

export async function adminLogin(email, password) {
  try {
    const res = await fetch("http://localhost:5231/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const resData = await res.json();
    if (!res.ok) {
      const errMsg = resData.message || (resData.errors && resData.errors.join(", ")) || "Đăng nhập thất bại.";
      return { ok: false, message: errMsg };
    }

    const token = resData.data?.accessToken;
    if (!token) {
      return { ok: false, message: "Không nhận được token từ máy chủ." };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { ok: false, message: "Token không hợp lệ." };
    }
    
    // Decode base64 payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload["role"];
    
    if (role !== "Admin") {
      return { ok: false, message: "Tài khoản không phải Admin. Bạn không có quyền truy cập!" };
    }

    const session = {
      token,
      email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || payload["email"] || email,
      fullName: payload["fullname"] || "Admin",
      role: "Admin",
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return { ok: true, admin: session };
  } catch (err) {
    return { ok: false, message: "Lỗi kết nối server: " + err.message };
  }
}

export function getAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// ---------- HELPERS ----------
export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

// Stats computed from mock data
export function getStats() {
  const users = getAdminUsers();
  const totalUsers = users.length;
  const totalStudents = users.filter((u) => u.role === "Student").length;
  const totalBusinesses = users.filter((u) => u.role === "Business").length;
  const totalJobs = mockJobPosts.length;
  const publishedJobs = mockJobPosts.filter((j) => j.status === "Published").length;
  const pendingPayments = mockPaymentOrders.filter((p) => p.status === "Pending").length;
  const totalRevenue = mockPaymentOrders
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalUsers,
    totalStudents,
    totalBusinesses,
    totalJobs,
    publishedJobs,
    pendingPayments,
    totalRevenue,
  };
}
