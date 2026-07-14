import React from 'react';

export default function PlexusBackground() {
  return (
    <div className="fixed inset-0 -z-20 w-full h-full pointer-events-none bg-gradient-to-r from-[#FFFFFF] via-[#F8FAFC] to-[#F3F4F6] overflow-hidden">
      {/* Primary Orange Glow Mesh (First Wave) */}
      <div
        className="absolute top-[-5%] right-[-10%] w-[80vw] h-[95vh] bg-[radial-gradient(circle_at_right_top,rgba(255,107,0,0.38)_0%,rgba(255,107,0,0.12)_45%,transparent_70%)] pointer-events-none animate-orange-wave-first"
      />

      {/* Secondary Orange Glow Mesh (Second Wave - creating fluid wavy interference) */}
      <div
        className="absolute top-[5%] right-[-15%] w-[85vw] h-[90vh] bg-[radial-gradient(circle_at_right_top,rgba(255,107,0,0.32)_0%,rgba(255,107,0,0.08)_40%,transparent_65%)] pointer-events-none animate-orange-wave-second"
      />

      {/* Left-Side Glow: Soft orange/peach ambient wave to light up the left text area dynamically */}
      <div
        className="absolute top-[-10%] left-[-15%] w-[65vw] h-[75vh] bg-[radial-gradient(circle_at_left_top,rgba(255,107,0,0.28)_0%,rgba(255,107,0,0.06)_40%,transparent_65%)] pointer-events-none animate-orange-wave-left"
      />

      {/* Refined Vector Blueprint Grid (Lưới tọa độ bản đồ chìm) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-40 pointer-events-none"
      />
    </div>
  );
}
