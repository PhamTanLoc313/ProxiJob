import React from 'react';
import { Check, Star, ShieldCheck } from 'lucide-react';
import { IconUser, IconTimer, IconWallet, IconPhone } from './CustomIcons';

const plans = [
  {
    name: 'PerShift',
    title: 'Đăng Theo Ca',
    price: '15.000đ',
    period: '/ca',
    desc: 'Giải pháp linh hoạt cho nhu cầu tuyển dụng tức thời.',
    features: [
      'Đăng tuyển 1 ca làm việc',
      'Hiển thị trên bản đồ radar',
      'Nhận hồ sơ ứng tuyển trực tiếp',
      'Đăng tin qua Web Dashboard',
    ],
    buttonText: 'Đăng tuyển ngay',
    hot: false,
  },
  {
    name: 'Recruit',
    title: 'Gói Tuyển Dụng',
    price: '99.000đ',
    period: '/tháng',
    desc: 'Phù hợp cho các cửa hàng nhỏ tuyển dụng định kỳ.',
    features: [
      'Đăng tuyển tối đa 30 ca/tháng',
      'Quản lý hồ sơ ứng viên cơ bản',
      'Hỗ trợ duyệt tin nhanh',
      'Đăng tin qua Web Dashboard',
    ],
    buttonText: 'Nâng cấp ngay',
    hot: false,
  },
  {
    name: 'HRM Basic',
    title: 'HRM Cơ Bản',
    price: '199.000đ',
    period: '/tháng',
    desc: 'Tuyển dụng kết hợp quản lý nhân sự vừa và nhỏ.',
    features: [
      'Đăng tuyển tối đa 60 ca/tháng',
      'Công cụ quản lý nhân sự (HR Tools)',
      'Tối đa 15 nhân viên quản lý',
      '1 mã QR điểm danh di động',
    ],
    buttonText: 'Nâng cấp ngay',
    hot: true,
  },
  {
    name: 'Enterprise',
    title: 'Doanh Nghiệp',
    price: '299.000đ',
    period: '/tháng',
    desc: 'Tuyển dụng & quản trị không giới hạn cho hệ thống lớn.',
    features: [
      'Đăng tuyển không giới hạn số ca',
      'Ưu tiên hiển thị (Radar Pin)',
      'Quản lý nhân sự & chấm công không giới hạn',
      'Hỗ trợ quản lý chuỗi nhiều cửa hàng',
    ],
    buttonText: 'Liên hệ hợp tác',
    hot: false,
  },
  {
    name: 'Student10',
    title: 'Gói Sinh Viên',
    price: '10.000đ',
    period: '/10 lượt',
    desc: 'Dành riêng cho sinh viên tăng lượt kết nối ca làm việc.',
    features: [
      'Cộng thêm 10 lượt ứng tuyển',
      'Lượt ứng tuyển tích lũy vĩnh viễn',
      'Không giới hạn thời hạn sử dụng',
      'Thanh toán qua tài khoản VietQR',
    ],
    buttonText: 'Tải app mua ngay',
    hot: false,
    isStudent: true,
  },
];

export default function Pricing() {
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
    <div id="pricing" className="space-y-20 pt-12">
      
      {/* Subscriptions Grid */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary">
              PHÙ HỢP MỌI QUY MÔ
            </span>
          </div>
          <h3 className="font-sora font-black text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tighter uppercase leading-tight">
            BẢNG GIÁ &amp; QUYỀN LỢI
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-bento-gap items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`bento-card rounded-4xl p-6 organic-shadow border transition-all duration-300 flex flex-col justify-between text-left cursor-pointer relative ${
                plan.hot 
                  ? 'border-2 border-primary-container/35 bg-gradient-to-b from-primary-container/5 to-transparent' 
                  : plan.isStudent
                    ? 'border-2 border-emerald-500/35 bg-gradient-to-b from-emerald-500/5 to-transparent'
                    : 'border-outline-variant/20 hover:border-slate-300'
              }`}
            >
              {plan.hot && (
                <div className="absolute top-4 right-4 bg-primary-container text-white px-2.5 py-1 rounded-full font-hanken font-extrabold text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1">
                  <Star size={8} className="fill-white" />
                  HOT
                </div>
              )}
              {plan.isStudent && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-2.5 py-1 rounded-full font-hanken font-extrabold text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1">
                  🎓 STUDENT
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h4 className={`font-sora font-black text-lg mb-1 tracking-tighter uppercase ${(plan.hot || plan.isStudent) ? 'pr-20' : ''} ${
                    plan.hot ? 'text-primary-container' : plan.isStudent ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {plan.title}
                  </h4>
                  <p className="font-hanken text-slate-500 text-xs leading-relaxed min-h-[32px]">
                    {plan.desc}
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="font-sora font-black text-2xl text-slate-900">{plan.price}</span>
                    <span className="font-hanken text-slate-500 text-[10px] font-bold">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6 font-hanken">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 font-semibold text-xs leading-tight">
                      {feature.includes('HR Management') || feature.includes('quản lý') || feature.includes('quản trị') ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0 mt-0.5">
                          <IconUser className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0 mt-0.5">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className={`w-full py-3 rounded-full font-hanken font-extrabold text-xs transition-all cursor-pointer ${
                  plan.hot 
                    ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20 hover:brightness-110' 
                    : plan.isStudent
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:brightness-110'
                      : 'border-2 border-outline-variant/30 text-slate-900 hover:bg-slate-50'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Bar Segment */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bento-card rounded-[32px] py-10 px-8 organic-shadow grid grid-cols-2 md:grid-cols-4 items-center gap-y-8 border-dashed border-2 border-outline-variant/40">
          <div className="text-center px-4 relative md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:w-[1px] md:after:h-12 md:after:bg-outline-variant/30 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container mb-3">
              <ShieldCheck size={20} />
            </div>
            <p className="font-sora font-black text-3xl text-primary-container mb-1 tracking-tighter">100%</p>
            <p className="font-hanken text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">An toàn &amp; Bảo mật</p>
          </div>

          <div className="text-center px-4 relative md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:w-[1px] md:after:h-12 md:after:bg-outline-variant/30 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
              <IconWallet className="w-5 h-5" />
            </div>
            <p className="font-sora font-black text-3xl text-slate-900 mb-1 tracking-tighter">0đ</p>
            <p className="font-hanken text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Phí duy trì</p>
          </div>

          <div className="text-center px-4 relative md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:w-[1px] md:after:h-12 md:after:bg-outline-variant/30 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
              <IconTimer className="w-5 h-5" />
            </div>
            <p className="font-sora font-black text-3xl text-slate-900 mb-1 tracking-tighter">15s</p>
            <p className="font-hanken text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Ứng tuyển siêu tốc</p>
          </div>

          <div className="text-center px-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
              <IconPhone className="w-5 h-5" />
            </div>
            <p className="font-sora font-black text-3xl text-slate-900 mb-1 tracking-tighter">24/7</p>
            <p className="font-hanken text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Hỗ trợ đối tác</p>
          </div>
        </div>
      </section>

    </div>
  );
}
