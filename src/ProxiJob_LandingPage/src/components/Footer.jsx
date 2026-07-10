import React, { useState } from 'react';
import { Send, MapPin } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`Đăng ký nhận tin tức thành công với email: ${email}`);
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 px-6 relative overflow-hidden mt-24">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-16 pb-16 border-b border-white/10">
        
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-5 space-y-10 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-white/10 p-1 flex-shrink-0">
              <img src={logo} alt="ProxiJob Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-extrabold text-5xl text-white tracking-tighter">ProxiJob</h2>
          </div>
          <p className="font-hanken font-medium opacity-70 max-w-sm leading-relaxed text-base text-slate-300">
            ProxiJob — Nền tảng kết nối việc làm siêu địa phương đầu tiên cho sinh viên tại Việt Nam.
          </p>
          
          <div className="flex gap-4">
            {/* Facebook icon */}
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary-container hover:text-white transition-all hover:-translate-y-1 text-slate-300" aria-label="Facebook">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </a>
            {/* Message/Zalo icon */}
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary-container hover:text-white transition-all hover:-translate-y-1 text-slate-300" aria-label="Chat">
              <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Product links */}
        <div className="col-span-1 md:col-span-3 space-y-10 text-left md:pl-12">
          <h4 className="font-sora font-bold text-primary-container uppercase tracking-[0.4em] text-xs pl-4">Sản phẩm</h4>
          <ul className="space-y-6 opacity-80 font-hanken font-bold text-sm text-slate-300">
            <li className="hover:text-primary-container transition-colors cursor-pointer relative group pl-4 flex items-center">
              <span className="absolute left-0 w-1.5 h-1.5 bg-primary-container rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0"></span>
              Tìm việc làm gần bạn
            </li>
            <li className="hover:text-primary-container transition-colors cursor-pointer relative group pl-4 flex items-center">
              <span className="absolute left-0 w-1.5 h-1.5 bg-primary-container rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0"></span>
              Giải pháp cho chủ quán
            </li>
            <li className="hover:text-primary-container transition-colors cursor-pointer relative group pl-4 flex items-center">
              <span className="absolute left-0 w-1.5 h-1.5 bg-primary-container rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0"></span>
              Cơ chế thanh toán
            </li>
            <li className="hover:text-primary-container transition-colors cursor-pointer relative group pl-4 flex items-center">
              <span className="absolute left-0 w-1.5 h-1.5 bg-primary-container rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0"></span>
              Quy trình ứng tuyển
            </li>
          </ul>
        </div>

        {/* Newsletter subscription */}
        <div className="col-span-1 md:col-span-4 space-y-10 text-left">
          <h4 className="font-sora font-bold text-primary-container uppercase tracking-[0.4em] text-xs">Cộng đồng</h4>
          <div className="space-y-6">
            <p className="font-hanken text-md opacity-70 leading-relaxed font-medium text-slate-300">
              Đăng ký nhận tin tức mới nhất về các việc làm HOT nhất khu vực của bạn.
            </p>
            <form onSubmit={handleSubscribe} className="w-full">
              <div className={`relative flex items-center bg-white/5 rounded-full border transition-all duration-300 p-1 ${
                isFocused ? 'border-primary-container shadow-glow' : 'border-white/10'
              }`}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 bg-transparent px-6 py-3 font-hanken text-sm text-white focus:outline-none placeholder-white/30"
                />
                <button
                  type="submit"
                  className="w-12 h-12 rounded-full bg-primary-container hover:bg-primary-container/90 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-10 text-sm opacity-40 font-medium">
        <p className="text-slate-400">© 2026 ProxiJob Platform. Crafted by Team 04 - FPT University Ho Chi Minh City.</p>
        <div className="flex gap-12 font-hanken text-slate-300">
          <a className="hover:underline hover:opacity-100 transition-opacity" href="#">Điều khoản sử dụng</a>
          <a className="hover:underline hover:opacity-100 transition-opacity" href="#">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
}
