import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        <linearGradient id="logoBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        <linearGradient id="logoYtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff2e54" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>

      {/* Base Squircle */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="112"
        fill="url(#logoBgGrad)"
        stroke="url(#logoBorderGrad)"
        strokeWidth="12"
      />

      {/* Antennas */}
      <path d="M256 140 L256 95" stroke="#38bdf8" strokeWidth="16" strokeLinecap="round" />
      <circle cx="256" cy="85" r="22" fill="#38bdf8" />

      <path d="M160 170 L120 120" stroke="#6366f1" strokeWidth="12" strokeLinecap="round" />
      <circle cx="110" cy="110" r="16" fill="#6366f1" />

      <path d="M352 170 L392 120" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
      <circle cx="402" cy="110" r="16" fill="#ef4444" />

      {/* Robot Face Chassis */}
      <rect x="116" y="140" width="280" height="230" rx="56" fill="#1e293b" stroke="#334155" strokeWidth="8" />

      {/* Visor */}
      <rect x="136" y="160" width="240" height="190" rx="40" fill="#0b0f19" stroke="#1e293b" strokeWidth="6" />

      {/* Left Eye */}
      <circle cx="195" cy="220" r="28" fill="#0284c7" />
      <circle cx="195" cy="220" r="18" fill="#38bdf8" />
      <circle cx="195" cy="220" r="8" fill="#ffffff" />

      {/* Right Eye */}
      <circle cx="317" cy="220" r="28" fill="#0284c7" />
      <circle cx="317" cy="220" r="18" fill="#38bdf8" />
      <circle cx="317" cy="220" r="8" fill="#ffffff" />

      {/* YouTube Play Triangle */}
      <path d="M232 270 L295 305 L232 340 Z" fill="url(#logoYtGrad)" />

      {/* Side Ears */}
      <rect x="96" y="215" width="20" height="80" rx="8" fill="#38bdf8" />
      <rect x="396" y="215" width="20" height="80" rx="8" fill="#ef4444" />

      {/* Status Nodes */}
      <circle cx="210" cy="400" r="8" fill="#38bdf8" />
      <circle cx="256" cy="400" r="8" fill="#6366f1" />
      <circle cx="302" cy="400" r="8" fill="#ef4444" />
    </svg>
  );
}
