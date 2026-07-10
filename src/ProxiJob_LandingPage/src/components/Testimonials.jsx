import React from 'react';
import { Quote, Star, ShieldCheck } from 'lucide-react';

export default function Testimonials() {
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
    <div className="pt-12">
      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>💬</span> Ý KIẾN KHÁCH HÀNG
            </span>
          </div>
          <h3 className="font-sora font-black text-slate-900 text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase leading-tight">
            CỘNG ĐỒNG NÓI GÌ?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
          {/* Testimonial 1 */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bento-card rounded-4xl p-6 md:p-8 organic-shadow relative flex flex-col justify-between group h-full cursor-pointer text-left"
          >
            {/* Quote Icon background decoration */}
            <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote size={60} className="text-primary-container" />
            </div>

            <div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-primary-container text-primary-container" />
                ))}
              </div>

              <p className="text-base md:text-lg text-slate-700 italic relative z-10 mb-8 leading-relaxed font-semibold">
                "Tìm được việc ngay quán cafe dưới chung cư. Đi bộ 2 phút là tới chỗ làm, không tốn tiền gửi xe!"
              </p>
            </div>

            <div className="flex items-center gap-4 border-t border-brand-border/60 pt-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-primary-container organic-shadow overflow-hidden flex items-center justify-center font-sora font-extrabold text-sm text-slate-700">
                NH
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-slate-900 flex items-center gap-1">
                  Ngọc Huyền
                  <ShieldCheck size={14} className="text-primary-container" />
                </p>
                <p className="text-xs text-slate-400 font-medium opacity-70">Sinh viên năm 2</p>
              </div>
              <span className="ml-auto px-2.5 py-1 rounded-full text-[9px] font-hanken font-extrabold uppercase tracking-wider bg-primary-container/10 text-primary-container">
                SINH VIÊN
              </span>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bento-card rounded-4xl p-6 md:p-8 organic-shadow relative flex flex-col justify-between group h-full cursor-pointer text-left"
          >
            {/* Quote Icon background decoration */}
            <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote size={60} className="text-secondary" />
            </div>

            <div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-primary-container text-primary-container" />
                ))}
              </div>

              <p className="text-base md:text-lg text-slate-700 italic relative z-10 mb-8 leading-relaxed font-semibold">
                "Tuyển ca gãy cực nhanh. Chỉ 15 giây là có sinh viên gần đây ứng tuyển, đỡ sợ nhân sự nghỉ đột xuất."
              </p>
            </div>

            <div className="flex items-center gap-4 border-t border-brand-border/60 pt-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-secondary organic-shadow overflow-hidden flex items-center justify-center font-sora font-extrabold text-sm text-slate-700">
                AT
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-slate-900 flex items-center gap-1">
                  Anh Tuấn
                  <ShieldCheck size={14} className="text-secondary" />
                </p>
                <p className="text-xs text-slate-400 font-medium opacity-70">Chủ tiệm bánh GenZ</p>
              </div>
              <span className="ml-auto px-2.5 py-1 rounded-full text-[9px] font-hanken font-extrabold uppercase tracking-wider bg-secondary/10 text-secondary">
                CHỦ TIỆM
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
