import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  theme?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', showText, theme }) => {
  const sizeClasses = {
    xs: { container: 'h-8 w-16 flex shrink-0 items-center justify-center relative' },
    sm: { container: 'h-10 w-20 flex shrink-0 items-center justify-center relative' },
    md: { container: 'h-12 w-28 flex shrink-0 items-center justify-center relative' },
    lg: { container: 'h-16 w-36 flex shrink-0 items-center justify-center relative' }
  };

  const currentSize = sizeClasses[size || 'md'];
  
  // Use light mode logo if theme is light, otherwise default to dark mode logo
  const logoId = theme === 'light' 
    ? '18CpgCHfHJRcE28EAL-9G_B1oTKZ9rPAp' 
    : '1DTUWdbFh8ok9UeQGcho9k54L-4S3-2Db';

  return (
    <div className={`flex items-center justify-center gap-4 group cursor-pointer ${className}`}>
      <div className={currentSize.container}>
        <img 
          src={`https://drive.google.com/thumbnail?id=${logoId}&sz=w1000`}
          alt="Trackoora Logo"
          className="absolute inset-0 w-full h-full object-contain drop-shadow-sm transition-transform duration-300 scale-[5.25] group-hover:scale-[5.4]"
          style={{ transformOrigin: 'center center', pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};

export default Logo;
