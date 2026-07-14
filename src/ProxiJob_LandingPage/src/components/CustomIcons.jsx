import React from 'react';

// 1. ICON USER (Khối nhân sự / Profile sinh viên - Chuẩn nét dày Gen-Z)
export function IconUser({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={`stroke-[2.5] ${className}`} {...props}>
      {/* Đầu nhân vật (Dạng capsule phá cách) */}
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
      {/* Vai và thân dưới */}
      <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" />
      {/* Điểm nhấn chấm tròn công nghệ phía góc */}
      <circle cx="18" cy="7" r="1.5" className="fill-orange-500 stroke-none" />
    </svg>
  );
}

// 2. ICON TIMER (Tốc độ matching 15s / Khớp ca 1.2s)
export function IconTimer({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={`stroke-[2.5] ${className}`} {...props}>
      {/* Khung đồng hồ tròn */}
      <circle cx="12" cy="13" r="8" />
      {/* Kim giờ và kim phút lệch góc biểu thị tốc độ */}
      <path d="M12 9V13L15 15" className="stroke-orange-500" />
      {/* Nút bấm cơ học phía trên */}
      <path d="M10 3H14" />
      <path d="M12 3V5" />
      {/* Vệt gió siêu tốc phá cách bên ngoài */}
      <path d="M2 10H4" />
      <path d="M3 14H5" />
    </svg>
  );
}

// 3. ICON WALLET (Ví ProxiJob / Quyết toán thù lao ca làm)
export function IconWallet({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={`stroke-[2.5] ${className}`} {...props}>
      {/* Thân ví hình chữ nhật bo góc Brutalism */}
      <rect x="3" y="5" width="18" height="14" rx="3" />
      {/* Nắp gài ví */}
      <path d="M16 12C16 10.8954 16.8954 10 18 10H21V14H18C16.8954 14 16 13.1046 16 12Z" className="stroke-orange-500" />
      {/* Lỗ khóa/Chíp bảo mật của ví */}
      <circle cx="18.5" cy="12" r="1" className="fill-orange-500 stroke-none" />
      {/* Đường thẻ ngân hàng lướt ngầm phía sau */}
      <path d="M3 9H21" />
    </svg>
  );
}

// 4. ICON PHONE (Liên hệ / Hỗ trợ chủ quán đối tác 24/7)
export function IconPhone({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={`stroke-[2.5] ${className}`} {...props}>
      {/* Ống nghe điện thoại góc nghiêng cá tính */}
      <path d="M5 4H7.5L9.5 9L7.5 10.5C8.5 12.5 10.5 14.5 12.5 15.5L14 13.5L19 15.5V18C19 19.1046 18.1046 20 17 20C9.8203 20 4 14.1797 4 7C4 5.89543 4.89543 5 5 4Z" />
      {/* Vòng sóng radar liên lạc phát ra từ tổng đài */}
      <path d="M14 4C16.5 5 18 6.5 19 9" className="stroke-orange-500" />
    </svg>
  );
}
