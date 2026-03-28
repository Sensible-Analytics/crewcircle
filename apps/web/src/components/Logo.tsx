import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  variant = 'dark',
  className = '' 
}: LogoProps) {
  const sizes = {
    sm: { width: 120, height: 30, iconSize: 24 },
    md: { width: 160, height: 40, iconSize: 32 },
    lg: { width: 200, height: 50, iconSize: 40 },
  };

  const { width, height, iconSize } = sizes[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-md"
        style={{ width: iconSize, height: iconSize }}
      >
        <span className="text-white font-bold" style={{ fontSize: iconSize * 0.5 }}>C</span>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight ${textColor}`} style={{ fontSize: width * 0.15 }}>
          Crew<span className="text-orange-500">Circle</span>
        </span>
      )}
    </Link>
  );
}