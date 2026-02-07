import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div 
      className={`
        glass rounded-xl p-6 
        ${hover ? 'hover:bg-[rgba(26,31,46,0.8)] transition-all duration-300 hover:scale-[1.02]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
