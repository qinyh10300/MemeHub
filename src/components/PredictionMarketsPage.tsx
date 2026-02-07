import React, { useState } from 'react';
import { Search, Filter, TrendingUp, DollarSign } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { PredictionCard } from './PredictionCard';
import { mockPredictionMarkets } from '../lib/mockData';

interface PredictionMarketsPageProps {
  onMarketClick: (marketId: string) => void;
}

export function PredictionMarketsPage({ onMarketClick }: PredictionMarketsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Crypto', 'Tasks', 'Platform', 'NFT'];

  const filteredMarkets = mockPredictionMarkets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalVolume = mockPredictionMarkets.reduce((sum, m) => sum + m.volume, 0);
  const totalLiquidity = mockPredictionMarkets.reduce((sum, m) => sum + m.liquidity, 0);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Prediction Markets</h1>
        <p className="text-muted-foreground">Bet on outcomes and earn from your insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div>
              <div className="text-2xl">{mockPredictionMarkets.length}</div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-2xl">${(totalVolume / 1000).toFixed(0)}k</div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00FF9D]/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="text-2xl">${(totalLiquidity / 1000).toFixed(0)}k</div>
              <div className="text-sm text-muted-foreground">Total Liquidity</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markets..."
            className="w-full pl-12 pr-4 py-3 bg-input-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredMarkets.map(market => (
            <PredictionCard
              key={market.id}
              market={market}
              onClick={() => onMarketClick(market.id)}
            />
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No markets found matching your criteria</p>
          </div>
        </GlassCard>
      )}

      {/* Info Banner */}
      <div className="mt-12">
        <GlassCard className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7C3AED]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7C3AED]/30 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1">How Prediction Markets Work</h3>
              <p className="text-sm text-muted-foreground">
                Buy YES or NO shares based on your prediction. If you're right, you earn profits. If you're wrong, you lose your stake. All markets are resolved fairly based on verifiable outcomes.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
