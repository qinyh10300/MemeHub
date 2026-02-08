<script setup>
import { ref, computed } from 'vue'
import { Vault, TrendingUp, DollarSign, Download, Upload, Info } from 'lucide-vue-next'
import { Line, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import { mockVaultData } from '@/lib/mockData'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

const activeTab = ref('deposit')
const amount = ref('')

const { totalDeposited, currentAPY, claimableRewards, assetComposition, historicalAPY } = mockVaultData
const COLORS = ['#00D1FF', '#7C3AED', '#00FF9D', '#FFA500']

const lineChartData = {
  labels: historicalAPY.map(d => d.date),
  datasets: [{
    data: historicalAPY.map(d => d.apy),
    borderColor: '#00FF9D',
    borderWidth: 2,
    tension: 0.3,
    fill: false,
    pointBackgroundColor: '#00FF9D',
    pointRadius: 3,
  }],
}

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1f2e',
      callbacks: { label: (ctx) => `${ctx.parsed.y}% APY` },
    },
  },
  scales: {
    x: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    y: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
  },
}

const pieChartData = {
  labels: assetComposition.map(a => a.name),
  datasets: [{
    data: assetComposition.map(a => a.value),
    backgroundColor: COLORS,
    borderWidth: 0,
  }],
}

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1f2e' } },
}

const estimatedAnnual = computed(() =>
  amount.value ? (parseFloat(amount.value) * currentAPY / 100).toFixed(2) : '0.00'
)

const estimatedMonthly = computed(() =>
  amount.value ? (parseFloat(amount.value) * currentAPY / 100 / 12).toFixed(2) : '0.00'
)
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl mb-2">Yield Vault</h1>
      <p class="text-muted-foreground">Stake your tokens and earn passive income from RWA strategies</p>
    </div>

    <!-- Hero Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <GlassCard class="relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#00D1FF]/10 rounded-full blur-3xl"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Vault class="w-4 h-4" />
            <span>Total Deposited</span>
          </div>
          <div class="text-4xl mb-1">${{ totalDeposited.toLocaleString() }}</div>
          <div class="text-sm text-[#00FF9D]">+12.5% this month</div>
        </div>
      </GlassCard>
      <GlassCard class="relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp class="w-4 h-4" />
            <span>Current APY</span>
          </div>
          <div class="text-4xl mb-1 text-[#00FF9D]">{{ currentAPY }}%</div>
          <div class="text-sm text-muted-foreground">Updated hourly</div>
        </div>
      </GlassCard>
      <GlassCard class="relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#00FF9D]/10 rounded-full blur-3xl"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <DollarSign class="w-4 h-4" />
            <span>Claimable Rewards</span>
          </div>
          <div class="text-4xl mb-1">${{ claimableRewards.toFixed(2) }}</div>
          <NeonButton size="sm" class="mt-2">Claim Rewards</NeonButton>
        </div>
      </GlassCard>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- APY History -->
        <GlassCard>
          <h3 class="mb-4">APY History (6 months)</h3>
          <div style="height: 300px">
            <Line :data="lineChartData" :options="lineChartOptions" />
          </div>
        </GlassCard>

        <!-- Asset Composition -->
        <GlassCard>
          <h3 class="mb-4">Asset Composition</h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div style="height: 250px">
              <Pie :data="pieChartData" :options="pieChartOptions" />
            </div>
            <div class="space-y-4">
              <div v-for="(asset, index) in assetComposition" :key="asset.name" class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: COLORS[index % COLORS.length] }"></div>
                  <div>
                    <div>{{ asset.name }}</div>
                    <div class="text-sm text-muted-foreground">${{ asset.amount.toLocaleString() }}</div>
                  </div>
                </div>
                <div>{{ asset.value }}%</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Strategy Info -->
        <GlassCard>
          <h3 class="mb-4">Vault Strategy</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3 p-4 glass rounded-lg">
              <Info class="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
              <div>
                <div class="mb-1">Real-World Asset (RWA) Backed</div>
                <p class="text-sm text-muted-foreground">Your deposits are invested in a diversified portfolio of tokenized real-world assets including real estate, bonds, and treasury bills.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 glass rounded-lg">
              <Info class="w-5 h-5 text-[#7C3AED] mt-0.5 flex-shrink-0" />
              <div>
                <div class="mb-1">Smart Contract Security</div>
                <p class="text-sm text-muted-foreground">All funds are secured by audited smart contracts. Withdrawals are processed instantly without lock-up periods.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 glass rounded-lg">
              <Info class="w-5 h-5 text-[#00FF9D] mt-0.5 flex-shrink-0" />
              <div>
                <div class="mb-1">Dynamic APY</div>
                <p class="text-sm text-muted-foreground">APY automatically adjusts based on market conditions and strategy performance. Historical average: 7.5-9.0%</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <!-- Deposit/Withdraw Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-6">
          <GlassCard>
            <div class="flex border-b border-white/10 mb-6">
              <button @click="activeTab = 'deposit'" :class="['flex-1 px-4 py-3 transition-colors', activeTab === 'deposit' ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]' : 'text-muted-foreground hover:text-foreground']">
                <Upload class="w-4 h-4 mx-auto mb-1" />
                Deposit
              </button>
              <button @click="activeTab = 'withdraw'" :class="['flex-1 px-4 py-3 transition-colors', activeTab === 'withdraw' ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]' : 'text-muted-foreground hover:text-foreground']">
                <Download class="w-4 h-4 mx-auto mb-1" />
                Withdraw
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-2">Amount (USDC)</label>
                <input v-model="amount" type="number" placeholder="0.00" class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]" />
                <div class="flex gap-2 mt-2">
                  <button v-for="amt in [100, 500, 1000, 5000]" :key="amt" @click="amount = amt.toString()" class="flex-1 px-2 py-1 text-xs glass rounded hover:bg-white/5 transition-colors">${{ amt }}</button>
                </div>
              </div>
              <div v-if="amount" class="glass p-4 rounded-lg space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">You {{ activeTab }}</span>
                  <span>${{ amount }} USDC</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Est. annual earnings</span>
                  <span class="text-[#00FF9D]">${{ estimatedAnnual }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Est. monthly earnings</span>
                  <span class="text-[#00FF9D]">${{ estimatedMonthly }}</span>
                </div>
              </div>
              <NeonButton class="w-full" size="lg" :disabled="!amount || parseFloat(amount) <= 0">
                {{ activeTab === 'deposit' ? 'Deposit' : 'Withdraw' }} {{ amount ? `$${amount}` : '' }}
              </NeonButton>
              <p v-if="activeTab === 'deposit'" class="text-xs text-muted-foreground text-center">Minimum deposit: $10 USDC</p>
              <p v-if="activeTab === 'withdraw'" class="text-xs text-muted-foreground text-center">No lock-up period. Instant withdrawal.</p>
            </div>
          </GlassCard>

          <GlassCard class="mt-6">
            <h4 class="mb-3">Your Stats</h4>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Total Deposited</span>
                <span>${{ totalDeposited.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Total Earned</span>
                <span class="text-[#00FF9D]">$2,048.50</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Member Since</span>
                <span>Jan 2026</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  </div>
</template>
