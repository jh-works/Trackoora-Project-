import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', showText = true }) => {
  const sizeClasses = {
    xs: { container: 'h-5', icon: 'h-4', text: 'text-sm' },
    sm: { container: 'h-6', icon: 'h-5', text: 'text-sm' },
    md: { container: 'h-8', icon: 'h-7', text: 'text-2xl' },
    lg: { container: 'h-12', icon: 'h-10', text: 'text-4xl' }
  };

  const currentSize = sizeClasses[size];
  
  return (
    <div className={`flex items-center gap-2 ${currentSize.container} ${className}`}>
      <div className={`relative ${currentSize.icon} aspect-[2/1]`}>
        <svg viewBox="0 0 60 30" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Loop Shadow Effect */}
          <path 
            d="M30 15C30 15 25 5 15 5C5 5 5 15 5 15C5 15 5 25 15 25C25 25 30 15 30 15ZM30 15C30 15 35 5 45 5C55 5 55 15 55 15C55 15 55 25 45 25C35 25 30 15 30 15Z" 
            stroke="currentColor" 
            strokeWidth="6" 
            className="text-bg3 opacity-10"
            strokeLinecap="round"
          />
          {/* Left loop (Infinity style - Orange) */}
          <path 
            d="M30 15C30 15 25 5 15 5C5 5 5 15 5 15C5 15 5 25 15 25C25 25 30 15 30 15Z" 
            stroke="#f97316" 
            strokeWidth="7" 
            strokeLinecap="round"
            className="drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
          />
          {/* Right loop (Infinity style - Deep Blue/Cyan) */}
          <path 
            d="M30 15C30 15 35 5 45 5C55 5 55 15 55 15C55 15 55 25 45 25C35 25 30 15 30 15Z" 
            stroke="#06b6d4" 
            strokeWidth="7" 
            strokeLinecap="round"
            className="drop-shadow-[0_2px_4px_rgba(6,182,212,0.3)]"
          />
          {/* Intersection highlight */}
          <circle cx="30" cy="15" r="3.5" fill="white" className="dark:fill-bg2" />
        </svg>
      </div>
      {showText && (
        <span className={`${currentSize.text} font-black tracking-tight text-text whitespace-nowrap font-syne`}>
          Track<span className="text-orange">oo</span>ra<span className="text-cyan ml-0.5">BD</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
