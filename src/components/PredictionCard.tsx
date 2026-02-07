import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { CountdownTimer } from './CountdownTimer';
import { type PredictionMarket } from '../lib/mockData';

interface PredictionCardProps {
  market: PredictionMarket;
  onClick: () => void;
}

export function PredictionCard({ market, onClick }: PredictionCardProps) {
  return (
    <GlassCard hover className="cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full text-sm">
          {market.category}
        </span>
        {market.resolved && (
          <span className="px-2 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs">
            Resolved
          </span>
        )}
      </div>

      <h3 className="text-lg mb-2">{market.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{market.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">YES</div>
          <div className="text-2xl text-[#00FF9D]">{(market.yesPrice * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-1">${market.yesPrice.toFixed(2)}</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">NO</div>
          <div className="text-2xl text-[#FF6B6B]">{(market.noPrice * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-1">${market.noPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>${(market.liquidity / 1000).toFixed(0)}k</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>${(market.volume / 1000).toFixed(0)}k vol</span>
          </div>
        </div>
        <CountdownTimer endTime={market.endTime} compact />
      </div>
    </GlassCard>
  );
}
