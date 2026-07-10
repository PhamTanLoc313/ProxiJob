import React from 'react';
import { MapPin, Radio, CheckSquare } from 'lucide-react';

export default function Workflow() {
  return (
    <div className="pt-12">
      {/* Workflow Section */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>⚙️</span> VẬN HÀNH MƯỢT MÀ
            </span>
          </div>
          <h3 className="font-sora font-black text-slate-900 text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase leading-tight">
            QUY TRÌNH 3 BƯỚC SIÊU TỐC
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col items-start gap-4 border border-outline-variant/10 text-left shadow-sm hover:shadow-organic hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary-container transition-transform group-hover:scale-110">
              <MapPin size={20} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h4 className="font-sora font-black text-lg text-slate-900">1. Đăng ca rảnh</h4>
              <p className="font-hanken text-slate-600 leading-relaxed font-semibold text-xs lg:text-sm">Chủ quán tạo ca làm trong 30s, định vị chính xác vị trí cửa hàng.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col items-start gap-4 border border-outline-variant/10 text-left shadow-sm hover:shadow-organic hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary-container transition-transform group-hover:scale-110">
              <Radio size={20} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h4 className="font-sora font-black text-lg text-slate-900">2. Quét Matching</h4>
              <p className="font-hanken text-slate-600 leading-relaxed font-semibold text-xs lg:text-sm">Hệ thống đẩy thông báo real-time tới sinh viên trong bán kính gần nhất.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col items-start gap-4 border border-outline-variant/10 text-left shadow-sm hover:shadow-organic hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary-container transition-transform group-hover:scale-110">
              <CheckSquare size={20} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h4 className="font-sora font-black text-lg text-slate-900">3. Đối soát & Đối chiếu</h4>
              <p className="font-hanken text-slate-600 leading-relaxed font-semibold text-xs lg:text-sm">Giám sát chấm công bằng định vị GPS và tự động tổng hợp thù lao, ghi nhận lịch sử minh bạch ngay khi kết thúc ca.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
