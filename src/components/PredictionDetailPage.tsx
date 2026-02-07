import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { CountdownTimer } from './CountdownTimer';
import { PaymentModal } from './PaymentModal';
import { mockPredictionMarkets } from '../lib/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PredictionDetailPageProps {
  marketId: string;
  onBack: () => void;
}

export function PredictionDetailPage({ marketId, onBack }: PredictionDetailPageProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [betType, setBetType] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState<string>('10');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const market = mockPredictionMarkets.find(m => m.id === marketId) || mockPredictionMarkets[0];

  const mockPriceHistory = [
    { time: '00:00', yes: 0.55, no: 0.45 },
    { time: '04:00', yes: 0.58, no: 0.42 },
    { time: '08:00', yes: 0.62, no: 0.38 },
    { time: '12:00', yes: 0.65, no: 0.35 },
    { time: '16:00', yes: 0.68, no: 0.32 },
    { time: '20:00', yes: market.yesPrice, no: market.noPrice }
  ];

  const mockOrderBook = {
    bids: [
      { price: 0.67, amount: 150 },
      { price: 0.66, amount: 300 },
      { price: 0.65, amount: 450 }
    ],
    asks: [
      { price: 0.69, amount: 200 },
      { price: 0.70, amount: 350 },
      { price: 0.71, amount: 500 }
    ]
  };

  const handlePlaceBet = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const estimatedShares = parseFloat(betAmount) / (betType === 'yes' ? market.yesPrice : market.noPrice);
  const potentialProfit = betType === 'yes' 
    ? estimatedShares * (1 - market.yesPrice) 
    : estimatedShares * (1 - market.noPrice);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Markets
      </button>

      {showSuccess && (
        <div className="mb-6 glass p-4 rounded-lg border-2 border-[#00FF9D] animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#00FF9D]" />
            <div>
              <div className="text-[#00FF9D]">Bet Placed Successfully!</div>
              <div className="text-sm text-muted-foreground">Your {betType.toUpperCase()} shares have been added to your portfolio</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Header */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <span className="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full text-sm">
                  {market.category}
                </span>
                <h1 className="text-3xl mt-4 mb-2">{market.title}</h1>
                <p className="text-muted-foreground">{market.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Volume</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-lg">${(market.volume / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-lg">${(market.liquidity / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Traders</div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="text-lg">247</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Ends In</div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <CountdownTimer endTime={market.endTime} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Current Odds */}
          <GlassCard>
            <h3 className="mb-4">Current Odds</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-6 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-2">YES</div>
                <div className="text-4xl text-[#00FF9D] mb-1">{(market.yesPrice * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">${market.yesPrice.toFixed(2)} per share</div>
              </div>
              <div className="glass p-6 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-2">NO</div>
                <div className="text-4xl text-[#FF6B6B] mb-1">{(market.noPrice * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">${market.noPrice.toFixed(2)} per share</div>
              </div>
            </div>
          </GlassCard>

          {/* Price Chart */}
          <GlassCard>
            <h3 className="mb-4">Price History (24h)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPriceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Line type="monotone" dataKey="yes" stroke="#00FF9D" strokeWidth={2} name="YES" />
                <Line type="monotone" dataKey="no" stroke="#FF6B6B" strokeWidth={2} name="NO" />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Order Book */}
          <GlassCard>
            <h3 className="mb-4">Order Book</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-[#00FF9D] mb-3">Bids (Buy YES)</div>
                <div className="space-y-2">
                  {mockOrderBook.bids.map((bid, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 glass rounded">
                      <span>${bid.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{bid.amount} shares</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#FF6B6B] mb-3">Asks (Buy NO)</div>
                <div className="space-y-2">
                  {mockOrderBook.asks.map((ask, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 glass rounded">
                      <span>${ask.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{ask.amount} shares</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Betting Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <GlassCard>
              <h3 className="mb-4">Place a Bet</h3>
              
              <div className="space-y-4">
                {/* Bet Type */}
                <div>
                  <label className="block text-sm mb-2">I predict</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBetType('yes')}
                      className={`p-3 rounded-lg border transition-all ${
                        betType === 'yes'
                          ? 'border-[#00FF9D] bg-[#00FF9D]/10 text-[#00FF9D]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setBetType('no')}
                      className={`p-3 rounded-lg border transition-all ${
                        betType === 'no'
                          ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {/* Order Type */}
                <div>
                  <label className="block text-sm mb-2">Order Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType('market')}
                      className={`p-3 rounded-lg border transition-all ${
                        orderType === 'market'
                          ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => setOrderType('limit')}
                      className={`p-3 rounded-lg border transition-all ${
                        orderType === 'limit'
                          ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      Limit
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm mb-2">Amount (USDC)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="1"
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  />
                  <div className="flex gap-2 mt-2">
                    {[10, 25, 50, 100].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setBetAmount(amount.toString())}
                        className="flex-1 px-3 py-1 text-sm glass rounded hover:bg-white/5 transition-colors"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="glass p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You pay</span>
                    <span>${betAmount} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You get</span>
                    <span>{estimatedShares.toFixed(2)} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. price</span>
                    <span>${(betType === 'yes' ? market.yesPrice : market.noPrice).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-muted-foreground">Potential profit</span>
                    <span className="text-[#00FF9D]">+${potentialProfit.toFixed(2)}</span>
                  </div>
                </div>

                <NeonButton
                  onClick={handlePlaceBet}
                  className="w-full"
                  size="lg"
                  variant={betType === 'yes' ? 'primary' : 'secondary'}
                >
                  Buy {betType.toUpperCase()} for ${betAmount}
                </NeonButton>
              </div>
            </GlassCard>

            <GlassCard className="mt-6">
              <h3 className="mb-3">Market Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Resolution</div>
                  <div>Verified on-chain data</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Creator Fee</div>
                  <div>1% on winning shares</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Platform Fee</div>
                  <div>2% on all trades</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentSuccess}
        amount={parseFloat(betAmount)}
        currency="USDC"
        purpose={`Buy ${betType.toUpperCase()} shares: ${market.title}`}
      />
    </div>
  );
}
