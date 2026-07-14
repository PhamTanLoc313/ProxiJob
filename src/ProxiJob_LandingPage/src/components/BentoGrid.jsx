import React, { useState } from 'react';
import { MapPin, Calendar, MessageSquare, Clock } from 'lucide-react';
import { IconWallet } from './CustomIcons';

export default function BentoGrid() {
  const [radius, setRadius] = useState(100);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 35;
    const rotateY = (centerX - x) / 35;
    
    card.style.transform = `perspective(1200px) translateY(-6px) scale(1.005) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.zIndex = '50';
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1200px) translateY(0) scale(1) rotateX(0) rotateY(0)`;
    card.style.zIndex = '';
  };

  return (
    <section id="features" className="py-16 px-6 bg-transparent relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>💡</span> CÔNG NGHỆ ĐỘT PHÁ
            </span>
          </div>
          <h3 className="font-sora font-black text-slate-900 text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase leading-tight">
            VẬN HÀNH TUYỂN DỤNG SIÊU TỐC
          </h3>
          <p className="font-hanken text-slate-700 text-base md:text-lg font-medium leading-relaxed max-w-xl">
            Không hồ sơ rườm rà. Định vị, xếp lịch và theo dõi chấm công minh bạch trên một bố cục trực quan.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-bento-gap">
          
          {/* Card 1: Hyperlocal Matching */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="col-span-1 md:col-span-8 lg:col-span-8 bento-card rounded-4xl p-6 md:p-8 shadow-organic relative overflow-hidden group text-left cursor-pointer"
          >
            {/* Viewfinder brackets decoration */}
            <div className="viewfinder-bracket viewfinder-top-left" />
            <div className="viewfinder-bracket viewfinder-bottom-right" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 text-left">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <MapPin size={24} />
                </div>
                <h4 className="font-sora font-black text-slate-900 text-xl lg:text-2xl tracking-tighter mb-2">
                  Định Vị Geofence 100m
                </h4>
                <p className="font-hanken text-slate-700 text-sm lg:text-base leading-relaxed mb-4 font-medium">
                  Kết nối ứng viên trong bán kính an toàn. Có nhân sự ngay tức thì.
                </p>

                {/* Interactive Slider Widget */}
                <div className="bg-surface p-4 rounded-xl border border-brand-border text-left">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-sora font-extrabold text-[13px] text-slate-900">Bán Kính Tìm Kiếm</span>
                    <span className="font-sora font-black text-[13px] text-primary-container">{radius} mét</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-container"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-extrabold mt-1.5">
                    <span>50m</span>
                    <span>100m (Khuyên dùng)</span>
                    <span>500m</span>
                  </div>
                </div>
              </div>

              {/* Decorative side graphics */}
              <div className="md:col-span-5 relative w-full h-48 md:h-full bg-slate-50 border border-brand-border rounded-xl p-4 flex flex-col justify-around overflow-hidden min-h-[190px]">
                <div className="absolute inset-0 grid-bg-dots opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-container/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Candidate list simulation */}
                <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-brand-border shadow-sm group-hover:-translate-x-1 transition-transform duration-500 z-10">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                    NH
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-sora font-extrabold text-[11px] text-slate-900">Ngọc Huyền</div>
                    <div className="font-hanken text-[9.5px] text-slate-500 font-bold">Phục vụ • 80m gần đây</div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-600 font-extrabold text-[8.5px] rounded-full">
                    Khớp 98%
                  </span>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-brand-border shadow-sm opacity-90 group-hover:translate-x-1 transition-transform duration-500 z-10">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                    MA
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-sora font-bold text-[11px] text-slate-900">Minh Anh</div>
                    <div className="font-hanken text-[9.5px] text-slate-500 font-bold">Pha chế • 100m gần đây</div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-600 font-extrabold text-[8.5px] rounded-full">
                    Khớp 95%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Real-time Communication */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="col-span-1 md:col-span-4 lg:col-span-4 bento-card rounded-4xl p-6 md:p-8 shadow-organic relative flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                <MessageSquare size={24} />
              </div>
              <h4 className="font-sora font-black text-slate-900 text-xl lg:text-2xl tracking-tighter mb-2">
                Kênh Trực Tuyến
              </h4>
              <p className="font-hanken text-slate-700 text-sm leading-relaxed mb-4 font-medium">
                Trao đổi, xếp lịch và duyệt ca trực tiếp qua Live Chat.
              </p>
            </div>

            <div className="bg-slate-50 border border-brand-border rounded-xl p-3 text-left shadow-inner">
              <div className="text-[9px] text-secondary font-extrabold uppercase tracking-wide mb-2">Live Chat</div>
              <div className="flex gap-2 items-start mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0">NH</div>
                <div className="bg-white p-2.5 rounded-xl rounded-tl-none text-[11px] font-hanken shadow-sm font-semibold leading-snug">
                  Em đã sẵn sàng nhận ca rồi ạ!
                </div>
              </div>
              <div className="flex gap-2 items-start justify-end">
                <div className="bg-primary/10 p-2.5 rounded-xl rounded-tr-none text-[11px] font-hanken text-primary font-extrabold shadow-sm leading-snug">
                  Tuyệt vời, hẹn gặp em lúc 2h nhé!
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Automated Scheduling */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="col-span-1 md:col-span-4 lg:col-span-4 bento-card rounded-4xl p-6 md:p-8 shadow-organic relative flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container mb-4">
                <Calendar size={24} />
              </div>
              <h4 className="font-sora font-black text-slate-900 text-xl lg:text-2xl tracking-tighter mb-2">
                Lịch Trình Thông Minh
              </h4>
              <p className="font-hanken text-slate-700 text-sm leading-relaxed mb-4 font-medium">
                AI tự động điều phối và xếp lịch các ca gãy phù hợp cho sinh viên.
              </p>
            </div>

            <div className="bg-slate-50 border border-brand-border rounded-xl p-3 text-left flex flex-col gap-2.5 shadow-inner">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase">
                <span>Ca gãy: Bán hàng tối</span>
                <span className="text-primary-container font-black">Đang Chờ</span>
              </div>
              <div className="flex gap-2 items-center">
                <Clock size={12} className="text-slate-400" />
                <span className="text-[11px] font-hanken font-extrabold text-slate-900">Hôm nay, 17:00 - 22:00</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-primary-container h-full w-2/3 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Card 4: Local Payroll & Compliance */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="col-span-1 md:col-span-8 lg:col-span-8 bento-card rounded-4xl p-6 md:p-8 shadow-organic relative overflow-hidden group text-left cursor-pointer"
          >
            {/* Viewfinder brackets decoration */}
            <div className="viewfinder-bracket viewfinder-top-left" />
            <div className="viewfinder-bracket viewfinder-bottom-right" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 text-left">
                <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary mb-4">
                  <IconWallet className="w-6 h-6" />
                </div>
                <h4 className="font-sora font-black text-xl lg:text-2xl tracking-tighter mb-2">
                  Đối Soát Ca Làm Minh Bạch
                </h4>
                <p className="font-hanken text-slate-700 text-sm lg:text-base leading-relaxed mb-3.5 font-medium">
                  Chấm công tự động qua định vị GPS. Thống kê và hiển thị thù lao rõ ràng ngay sau khi hoàn thành ca.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="px-2.5 py-1 bg-secondary/5 text-secondary font-hanken font-extrabold text-[10px] rounded-full">
                    GPS Geofence
                  </span>
                  <span className="px-2.5 py-1 bg-primary/5 text-primary font-hanken font-extrabold text-[10px] rounded-full">
                    Đối soát ca tức thì
                  </span>
                  <span className="px-2.5 py-1 bg-green-500/5 text-green-600 font-hanken font-extrabold text-[10px] rounded-full">
                    Lịch sử minh bạch
                  </span>
                </div>
              </div>

              {/* Decorative side graphics */}
              <div className="md:col-span-5 bg-slate-50 border border-brand-border rounded-xl p-4 flex flex-col gap-3 text-left shadow-sm relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 absolute" />
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Thống kê thù lao</div>
                <div>
                  <div className="text-[10px] font-hanken text-slate-400 leading-none mb-1">Đã đối soát ca</div>
                  <div className="font-sora font-extrabold text-xl text-slate-900">1.450.000đ</div>
                </div>
                <div className="h-px bg-brand-border w-full" />
                <div className="flex justify-between items-center text-[9px] font-hanken font-bold">
                  <span className="text-secondary uppercase tracking-widest">Real-time stats</span>
                  <span className="text-green-600">Thành công</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
