import React from 'react';
import { Users, Trophy, Clock } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ReputationBadge } from './ReputationBadge';
import { CountdownTimer } from './CountdownTimer';
import { type Task } from '../lib/mockData';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Interest': return 'bg-[#00D1FF]/20 text-[#00D1FF]';
      case 'Emotional': return 'bg-[#7C3AED]/20 text-[#7C3AED]';
      case 'Academic-Industry': return 'bg-[#00FF9D]/20 text-[#00FF9D]';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = () => {
    if (task.status === 'joined') {
      return <span className="px-2 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs">Joined</span>;
    }
    if (task.status === 'ended') {
      return <span className="px-2 py-1 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded text-xs">Ended</span>;
    }
    return null;
  };

  return (
    <GlassCard hover className="cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(task.category)}`}>
          {task.category}
        </span>
        {getStatusBadge()}
      </div>

      <h3 className="text-lg mb-2 line-clamp-2">{task.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>

      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{task.creator.avatar}</span>
          <div>
            <div className="text-sm">{task.creator.name}</div>
            <ReputationBadge score={task.creator.reputation} size="sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-muted-foreground">Reward</div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-[#FFA500]" />
            <span className="text-[#FFA500]">{task.reward} DHC</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Entry Fee</div>
          <div className="text-[#00D1FF]">{task.entryFee} USDC</div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{task.participants}/{task.maxParticipants}</span>
        </div>
        <CountdownTimer endTime={task.deadline} compact />
      </div>
    </GlassCard>
  );
}