import React, { useState } from 'react';
import { Vault, TrendingUp, DollarSign, Download, Upload, Info } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { mockVaultData } from '../lib/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function VaultPage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');

  const { totalDeposited, currentAPY, claimableRewards, assetComposition, historicalAPY } = mockVaultData;

  const COLORS = ['#00D1FF', '#7C3AED', '#00FF9D', '#FFA500'];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Yield Vault</h1>
        <p className="text-muted-foreground">Stake your tokens and earn passive income from RWA strategies</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D1FF]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Vault className="w-4 h-4" />
              <span>Total Deposited</span>
            </div>
            <div className="text-4xl mb-1">${totalDeposited.toLocaleString()}</div>
            <div className="text-sm text-[#00FF9D]">+12.5% this month</div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Current APY</span>
            </div>
            <div className="text-4xl mb-1 text-[#00FF9D]">{currentAPY}%</div>
            <div className="text-sm text-muted-foreground">Updated hourly</div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF9D]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Claimable Rewards</span>
            </div>
            <div className="text-4xl mb-1">${claimableRewards.toFixed(2)}</div>
            <NeonButton size="sm" className="mt-2">
              Claim Rewards
            </NeonButton>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* APY History */}
          <GlassCard>
            <h3 className="mb-4">APY History (6 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalAPY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(value) => [`${value}%`, 'APY']}
                />
                <Line type="monotone" dataKey="apy" stroke="#00FF9D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Asset Composition */}
          <GlassCard>
            <h3 className="mb-4">Asset Composition</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetComposition}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                {assetComposition.map((asset, index) => (
                  <div key={asset.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <div>{asset.name}</div>
                        <div className="text-sm text-muted-foreground">${asset.amount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div>{asset.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Strategy Info */}
          <GlassCard>
            <h3 className="mb-4">Vault Strategy</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 glass rounded-lg">
                <Info className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="mb-1">Real-World Asset (RWA) Backed</div>
                  <p className="text-sm text-muted-foreground">
                    Your deposits are invested in a diversified portfolio of tokenized real-world assets including real estate, bonds, and treasury bills.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 glass rounded-lg">
                <Info className="w-5 h-5 text-[#7C3AED] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="mb-1">Smart Contract Security</div>
                  <p className="text-sm text-muted-foreground">
                    All funds are secured by audited smart contracts. Withdrawals are processed instantly without lock-up periods.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 glass rounded-lg">
                <Info className="w-5 h-5 text-[#00FF9D] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="mb-1">Dynamic APY</div>
                  <p className="text-sm text-muted-foreground">
                    APY automatically adjusts based on market conditions and strategy performance. Historical average: 7.5-9.0%
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Deposit/Withdraw Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <GlassCard>
              <div className="flex border-b border-white/10 mb-6">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 px-4 py-3 transition-colors ${
                    activeTab === 'deposit'
                      ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1" />
                  Deposit
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 px-4 py-3 transition-colors ${
                    activeTab === 'withdraw'
                      ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  Withdraw
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className="flex-1 px-2 py-1 text-xs glass rounded hover:bg-white/5 transition-colors"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {amount && (
                  <div className="glass p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You {activeTab}</span>
                      <span>${amount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. annual earnings</span>
                      <span className="text-[#00FF9D]">
                        ${(parseFloat(amount) * currentAPY / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. monthly earnings</span>
                      <span className="text-[#00FF9D]">
                        ${(parseFloat(amount) * currentAPY / 100 / 12).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <NeonButton
                  className="w-full"
                  size="lg"
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} {amount && `$${amount}`}
                </NeonButton>

                {activeTab === 'deposit' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Minimum deposit: $10 USDC
                  </p>
                )}
                {activeTab === 'withdraw' && (
                  <p className="text-xs text-muted-foreground text-center">
                    No lock-up period. Instant withdrawal.
                  </p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="mt-6">
              <h4 className="mb-3">Your Stats</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Deposited</span>
                  <span>${totalDeposited.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="text-[#00FF9D]">$2,048.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>Jan 2026</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
