import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function NeonButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false 
}: NeonButtonProps) {
  const baseStyles = "relative overflow-hidden transition-all duration-300 rounded-lg font-medium";
  
  const variantStyles = {
    primary: "bg-[#00D1FF] text-[#0A0E17] hover:bg-[#00B8E6] hover:shadow-[0_0_20px_rgba(0,209,255,0.5)]",
    secondary: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]",
    outline: "border-2 border-[#00D1FF] text-[#00D1FF] hover:bg-[#00D1FF] hover:text-[#0A0E17]"
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}
