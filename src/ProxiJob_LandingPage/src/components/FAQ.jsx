import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqs = [
  {
    id: 'gps',
    question: 'Chống Fake GPS bằng cách nào?',
    answer: 'Dùng thuật toán Haversine đo đạc trực tiếp qua GPS thiết bị. Sinh viên bắt buộc phải ở trong bán kính quy định mới được chấm công.',
    iconColor: 'bg-primary-container/10 text-primary-container',
  },
  {
    id: 'salary',
    question: 'Lương thù lao ca làm được thanh toán như thế nào?',
    answer: 'Lương được chủ quán trực tiếp đối soát và thanh toán ngay sau khi kết thúc ca làm thông qua các hình thức chuyển khoản ngân hàng hoặc tiền mặt. Hệ thống ProxiJob hỗ trợ theo dõi chấm công và thống kê thù lao minh bạch cho cả hai bên.',
    iconColor: 'bg-secondary/10 text-secondary',
  },
  {
    id: 'fee',
    question: 'Sinh viên có mất phí không?',
    answer: 'Đăng ký tài khoản và theo dõi thù lao là hoàn toàn miễn phí. Sinh viên được tặng sẵn 3 lượt ứng tuyển ban đầu; nếu muốn tăng số lượng ứng tuyển ca làm, bạn có thể mua thêm gói lượt ứng tuyển với chi phí cực kỳ tiết kiệm (chỉ 10.000đ cho 10 lượt).',
    iconColor: 'bg-tertiary/10 text-tertiary',
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState('gps'); // Open the first one by default

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-16 space-y-10" id="faq">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <span className="font-hanken font-extrabold text-xs uppercase tracking-wider text-primary">
            GIẢI ĐÁP THẮC MẮC
          </span>
        </div>
        <h3 className="font-sora font-black text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tighter uppercase leading-tight">
          CÁC CÂU HỎI THƯỜNG GẶP
        </h3>
        <p className="font-hanken text-slate-700 text-base md:text-lg font-medium max-w-xl">
          Giải đáp các thông tin cơ bản về cơ chế hoạt động, tính năng an toàn và đối soát thù lao của ProxiJob.
        </p>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-4">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`faq-item bg-white rounded-3xl border transition-all duration-300 text-left overflow-hidden ${
                isOpen 
                  ? 'border-primary-container/30 shadow-organic bg-white' 
                  : 'border-outline-variant/10 shadow-sm hover:shadow-organic hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex justify-between items-center p-6 md:p-8 cursor-pointer outline-none select-none text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${faq.iconColor}`}>
                    <HelpCircle size={20} />
                  </div>
                  <h4 className="font-sora font-black text-lg lg:text-xl text-slate-900 pr-8 leading-snug tracking-tighter">
                    {faq.question}
                  </h4>
                </div>
                <span className={`text-primary-container transition-transform duration-300 flex-shrink-0 ${
                  isOpen ? 'rotate-180' : 'rotate-0'
                }`}>
                  <ChevronDown size={24} />
                </span>
              </button>
              
              {/* Smooth height transition container */}
              <div 
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 md:px-8 md:pb-8 text-slate-600 font-hanken font-semibold text-sm lg:text-base leading-relaxed border-t border-outline-variant/5 pt-4 pl-[80px] md:pl-[88px]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
