import React from 'react';
import { ArrowRight, MapPin, Shield, Search } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:py-0 px-6 grid-bg-dots lg:min-h-[calc(100vh-80px)] lg:flex lg:items-center">
      {/* Background glow accents */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-10 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-center w-full relative">
        {/* Floating elements and connection line in the middle gap (Only visible on large screens to prevent mobile clutter) */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block z-0">
          {/* Curved SVG connection line */}
          <svg className="absolute top-[35%] left-[53%] -translate-x-1/2 w-[380px] h-[180px] opacity-30" viewBox="0 0 380 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 10 90 Q 190 10 370 90"
              stroke="url(#gradient-line)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <path
              d="M 10 90 Q 190 10 370 90"
              stroke="url(#gradient-pulse)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="40 300"
              className="animate-flow-light"
            />
            <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6b00" />
                <stop offset="100%" stopColor="#6200EE" />
              </linearGradient>
              <linearGradient id="gradient-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6b00" />
                <stop offset="50%" stopColor="#ff6b00" />
                <stop offset="100%" stopColor="#6200EE" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating job badges */}
          <div className="absolute top-[26%] left-[55%] animate-float-slow bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-brand-border/40 text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-sm">☕</span>
            <span>Pha chế</span>
          </div>

          <div className="absolute top-[48%] left-[54%] animate-float-medium bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-brand-border/40 text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-sm">📚</span>
            <span>Gia sư</span>
          </div>

          <div className="absolute top-[70%] left-[56%] animate-float-fast bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-brand-border/40 text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-sm">🛒</span>
            <span>Bán hàng</span>
          </div>
        </div>

        {/* Left text column - with fadeInUp entry */}
        <div className="lg:col-span-7 flex flex-col items-start text-left animate-fade-in-up relative z-10">

          {/* Student Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6 hover:scale-105 transition-transform duration-350">
            <span className="text-sm">🏷️</span>
            <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary">
              DÀN RIÊNG CHO SINH VIÊN
            </span>
          </div>

          {/* Headline - Bold, Tracking-tighter, Black Slate-900 */}
          <h2 className="font-sora font-black text-slate-900 leading-tight tracking-tighter text-4xl sm:text-5xl lg:text-5xl xl:text-6xl mb-4">
            TÌM VIỆC LÀM <br />
            <span className="text-primary-container drop-shadow-[0_0_8px_rgba(255,107,0,0.5)] font-black animate-pulse relative inline-block">SIÊU GẦN</span> <br />
            KẾT NỐI NHANH <br />
            <span className="text-primary-container drop-shadow-[0_0_8px_rgba(255,107,0,0.5)] font-black animate-pulse relative inline-block">GEN-Z</span>
          </h2>

          {/* Description - Large, High Contrast */}
          <p className="font-hanken text-slate-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 max-w-xl font-medium">
            Việc làm thêm bán kính <span className="font-extrabold text-slate-900 underline decoration-primary-container/40 decoration-4">dưới 100m</span>. Tối ưu di chuyển, theo dõi thù lao minh bạch ngay sau ca.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto z-10">
            <a
              href="/Proxijob_version1.apk"
              download="Proxijob.apk"
              className="px-8 py-4 bg-primary-container text-white font-hanken font-extrabold rounded-full shadow-glow hover:bg-primary-container/90 transition-all hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2 group text-base"
            >
              Tải App APK Ngay 📱
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#pricing"
              className="px-8 py-4 bg-white border border-brand-border text-slate-900 font-hanken font-extrabold rounded-full hover:border-primary-container hover:bg-primary-container/5 transition-all text-center flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md"
            >
              Dành Cho Chủ Quán 💼
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-10 mt-10 pt-6 border-t border-brand-border w-full max-w-xl">
            <div>
              <p className="font-sora font-black text-2xl md:text-3xl text-slate-900 tracking-tighter">1.2s</p>
              <p className="font-hanken font-extrabold text-xs text-slate-500 uppercase tracking-wider mt-1">Khớp ca làm</p>
            </div>
            <div>
              <p className="font-sora font-black text-2xl md:text-3xl text-slate-900 tracking-tighter">&lt;100m</p>
              <p className="font-hanken font-extrabold text-xs text-slate-500 uppercase tracking-wider mt-1">Bán kính quét</p>
            </div>
            <div>
              <p className="font-sora font-black text-2xl md:text-3xl text-slate-900 tracking-tighter">98%</p>
              <p className="font-hanken font-extrabold text-xs text-slate-500 uppercase tracking-wider mt-1">Quyết toán ca</p>
            </div>
          </div>
        </div>

        {/* Right mockup column - Clean, frontal view iPhone mockup in Bento container */}
        <div className="lg:col-span-5 relative w-full flex justify-center items-center mt-10 lg:mt-0 animate-fade-in-up delay-200">

          {/* Outer Bento-style Light Container */}
          <div className="w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[250px] xl:max-w-[280px] 2xl:max-w-[300px] bento-card rounded-[40px] p-4 sm:p-5 shadow-organic flex justify-center items-center relative group hover:border-primary-container/20 transition-all duration-500">
            {/* Ambient orange neon edge reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/8 via-transparent to-primary-container/4 rounded-[40px] opacity-70 blur-md pointer-events-none group-hover:opacity-100 transition-opacity" />

            {/* Phone Bezel Hardware (Frontal View, Brushed Aluminum Finish, Balanced Scale) */}
            <div
              className="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[190px] xl:max-w-[220px] 2xl:max-w-[240px] aspect-[9/19] bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-300 p-[3px] rounded-[44px] border border-slate-300/40 relative shadow-2xl animate-glow"
              style={{ boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)' }}
            >
              {/* Ultra-thin black inner bezel */}
              <div className="w-full h-full bg-slate-950 rounded-[41px] p-[2.5px]">

                {/* Screen content (High-fidelity light theme ProxiJob App) */}
                <div className="w-full h-full bg-slate-50 rounded-[39px] p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden text-slate-800 font-hanken">

                  {/* Dynamic Island Notch */}
                  <div className="w-14 h-4 sm:w-20 sm:h-5 bg-slate-950 rounded-full mx-auto mb-0.5 flex items-center justify-center text-[6.5px] sm:text-[8px] text-white font-extrabold relative shadow-inner z-30">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />
                    ProxiScan
                  </div>

                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[7px] sm:text-[8.5px] px-2 sm:px-3 font-hanken font-extrabold text-slate-400 mb-0.5 z-20">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-4 h-2 sm:w-5 sm:h-2.5 border border-slate-300 rounded-xs p-0.5 flex items-center bg-slate-200">
                        <div className="w-full h-full bg-slate-500 rounded-3xs" />
                      </div>
                    </div>
                  </div>

                  {/* App Header Bar (User Avatar + Clean Search Bar) */}
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-1 sm:gap-1.5 text-left z-20">
                    <div className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-sora font-extrabold text-[8px] sm:text-[10px] flex-shrink-0">
                      MA
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-1 sm:px-2 sm:py-1.5 flex items-center gap-1 text-[6.5px] sm:text-[8px] text-slate-400 font-bold">
                      <Search size={6} className="text-slate-400" />
                      <span>Tìm việc gần nhà...</span>
                    </div>
                  </div>

                  {/* App Map View with Realistic Minimalist Vector Map */}
                  <div className="flex-1 my-1.5 sm:my-3 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden p-1.5 flex flex-col justify-between">
                    {/* Vector Map Background */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="none">
                      {/* Park / Green Zone */}
                      <path d="M 0 40 Q 50 30 70 80 T 130 90 L 150 0 L 0 0 Z" fill="#E2F0D9" opacity="0.6" />
                      <path d="M 120 200 L 200 150 L 200 200 Z" fill="#E2F0D9" opacity="0.6" />

                      {/* Water Body / River */}
                      <path d="M -10 180 Q 60 140 100 160 T 210 120 L 210 145 Q 140 185 100 180 T -10 210 Z" fill="#D2E5F9" opacity="0.8" />

                      {/* Roads / Streets */}
                      {/* Main Highway */}
                      <path d="M -10 90 Q 90 110 210 70" stroke="#E2E8F0" strokeWidth="6" fill="none" strokeLinecap="round" />
                      <path d="M -10 90 Q 90 110 210 70" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />

                      {/* Cross Street 1 */}
                      <path d="M 50 -10 Q 70 90 40 210" stroke="#E8EDF2" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M 50 -10 Q 70 90 40 210" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />

                      {/* Cross Street 2 */}
                      <path d="M 150 -10 Q 130 110 170 210" stroke="#E8EDF2" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M 150 -10 Q 130 110 170 210" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />

                      {/* Minor Road */}
                      <path d="M 40 85 Q 110 75 145 95" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      <path d="M 100 165 Q 120 120 140 93" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                      {/* Concentric Radar Scan Rings centered around Ngọc Huyền (top-[28%] left-[28%] -> x=56, y=56) */}
                      <circle cx="56" cy="56" r="15" stroke="#ff6b00" strokeWidth="0.8" fill="none" strokeDasharray="3 2" opacity="0.4" className="animate-pulse" />
                      <circle cx="56" cy="56" r="30" stroke="#ff6b00" strokeWidth="0.8" fill="none" strokeDasharray="4 3" opacity="0.25" />
                      <circle cx="56" cy="56" r="45" stroke="#ff6b00" strokeWidth="0.8" fill="none" strokeDasharray="5 4" opacity="0.15" />
                    </svg>

                    {/* Dot Grid Map Pattern overlay for texture */}
                    <div className="absolute inset-0 grid-bg-dots opacity-30 pointer-events-none" />

                    {/* Active job pins on map */}
                    <div className="absolute top-[28%] left-[28%] z-20 hover:scale-110 transition-transform">
                      <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-primary-container flex items-center justify-center text-white border border-white shadow-[0_0_12px_rgba(255,107,0,0.6)]">
                        <MapPin size={6} className="fill-current stroke-[3]" />
                      </div>
                    </div>

                    <div className="absolute top-[55%] right-[22%] z-20 hover:scale-110 transition-transform">
                      <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-secondary flex items-center justify-center text-white border border-white shadow-[0_0_12px_rgba(91,0,223,0.5)]">
                        <MapPin size={6} className="fill-current stroke-[3]" />
                      </div>
                    </div>

                    {/* Floating Candidate Card 1 */}
                    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-md flex items-center gap-1 shadow-sm absolute top-1 right-1 sm:top-2 sm:right-2 z-25">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary-container text-white text-[6.5px] sm:text-[8px] font-extrabold flex items-center justify-center">NH</div>
                      <span className="text-[6px] sm:text-[7.5px] font-extrabold text-slate-900 leading-none">Huyền • 80m</span>
                    </div>

                    {/* Floating Candidate Card 2 */}
                    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-md flex items-center gap-1 shadow-sm absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-25">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-secondary text-white text-[6.5px] sm:text-[8px] font-extrabold flex items-center justify-center">MA</div>
                      <span className="text-[6px] sm:text-[7.5px] font-extrabold text-slate-900 leading-none">Anh • 100m</span>
                    </div>
                  </div>

                  {/* Refined Job Listing Card */}
                  <div className="bg-white p-1.5 sm:p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between text-left z-20">
                    <div>
                      <p className="text-[6px] sm:text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wide">Pha chế Part-time</p>
                      <p className="text-[8px] sm:text-[10px] font-extrabold text-slate-900 leading-tight">Coffee House</p>
                      <p className="text-[7.5px] sm:text-[8.5px] text-primary-container font-extrabold">1.2km • HOT</p>
                    </div>
                    <button className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 bg-primary-container text-white rounded-full text-[7px] sm:text-[8.5px] font-extrabold shadow-glow hover:bg-primary-container/95 transition-all cursor-pointer">
                      Ứng tuyển
                    </button>
                  </div>

                  {/* iPhone Bottom indicator */}
                  <div className="w-12 h-0.5 sm:w-16 sm:h-1 bg-slate-300 rounded-full mx-auto mt-1.5 sm:mt-2" />
                </div>

              </div>
            </div>

            {/* Inner floating tags (Nested inside bento-card relative positioning) */}
            {/* Float Card 1: Active Jobs */}
            <div className="absolute -top-3 -left-2 sm:-left-4 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-organic border border-brand-border flex items-center gap-2 animate-bounce duration-1000 hidden sm:flex z-20">
              <div className="w-6 h-6 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
                <MapPin size={12} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="font-sora font-extrabold text-[9px] sm:text-[10px] text-slate-900">Khu Vực Trung Tâm</p>
                <p className="font-hanken text-[8px] text-slate-400 font-extrabold">14 ca đang chạy</p>
              </div>
            </div>

            {/* Float Card 2: Security */}
            <div className="absolute -bottom-3 -right-2 sm:-right-4 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-organic border border-brand-border flex items-center gap-2 hidden sm:flex z-20">
              <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                <Shield size={12} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="font-sora font-extrabold text-[9px] sm:text-[10px] text-slate-900">Đối Tác Tin Cậy</p>
                <p className="font-hanken text-[8px] text-slate-400 font-extrabold">An Toàn Bảo Mật</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
