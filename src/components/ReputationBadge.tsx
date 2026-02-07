import React from 'react';
import { Award } from 'lucide-react';

interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ReputationBadge({ score, size = 'md' }: ReputationBadgeProps) {
  const getColor = () => {
    if (score >= 90) return 'from-yellow-400 to-orange-500';
    if (score >= 70) return 'from-purple-400 to-pink-500';
    if (score >= 50) return 'from-blue-400 to-cyan-500';
    return 'from-gray-400 to-gray-600';
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${getColor()} rounded-full ${sizeClasses[size]}`}>
      <Award className={iconSizes[size]} />
      <span className="font-semibold">{score}</span>
    </div>
  );
}
