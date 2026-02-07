<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock, CheckCircle } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend
} from 'chart.js'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import CountdownTimer from './CountdownTimer.vue'
import PaymentModal from './PaymentModal.vue'
import { mockPredictionMarkets } from '@/lib/mockData'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const props = defineProps<{ id: string }>()
const router = useRouter()

const orderType = ref<'market' | 'limit'>('market')
const betType = ref<'yes' | 'no'>('yes')
const betAmount = ref('10')
const showPaymentModal = ref(false)
const showSuccess = ref(false)

const market = computed(() => mockPredictionMarkets.find(m => m.id === props.id) || mockPredictionMarkets[0])

const mockPriceHistory = computed(() => [
  { time: '00:00', yes: 0.55, no: 0.45 },
  { time: '04:00', yes: 0.58, no: 0.42 },
  { time: '08:00', yes: 0.62, no: 0.38 },
  { time: '12:00', yes: 0.65, no: 0.35 },
  { time: '16:00', yes: 0.68, no: 0.32 },
  { time: '20:00', yes: market.value.yesPrice, no: market.value.noPrice },
])

const chartData = computed(() => ({
  labels: mockPriceHistory.value.map(d => d.time),
  datasets: [
    {
      label: 'YES',
      data: mockPriceHistory.value.map(d => d.yes),
      borderColor: '#00FF9D',
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointBackgroundColor: '#00FF9D',
    },
    {
      label: 'NO',
      data: mockPriceHistory.value.map(d => d.no),
      borderColor: '#FF6B6B',
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointBackgroundColor: '#FF6B6B',
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, labels: { color: '#8b92a8' } }, tooltip: { backgroundColor: '#1a1f2e' } },
  scales: {
    x: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    y: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
  },
}

const mockOrderBook = {
  bids: [
    { price: 0.67, amount: 150 },
    { price: 0.66, amount: 300 },
    { price: 0.65, amount: 450 },
  ],
  asks: [
    { price: 0.69, amount: 200 },
    { price: 0.70, amount: 350 },
    { price: 0.71, amount: 500 },
  ],
}

function handlePlaceBet() {
  showPaymentModal.value = true
}

function handlePaymentSuccess() {
  showPaymentModal.value = false
  showSuccess.value = true
  setTimeout(() => (showSuccess.value = false), 3000)
}

const estimatedShares = computed(() =>
  parseFloat(betAmount.value) / (betType.value === 'yes' ? market.value.yesPrice : market.value.noPrice)
)

const potentialProfit = computed(() =>
  betType.value === 'yes'
    ? estimatedShares.value * (1 - market.value.yesPrice)
    : estimatedShares.value * (1 - market.value.noPrice)
)
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <button @click="router.push('/predictions')" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
      <ArrowLeft class="w-5 h-5" />
      Back to Markets
    </button>

    <div v-if="showSuccess" class="mb-6 glass p-4 rounded-lg border-2 border-[#00FF9D] animate-slide-in-top">
      <div class="flex items-center gap-3">
        <CheckCircle class="w-6 h-6 text-[#00FF9D]" />
        <div>
          <div class="text-[#00FF9D]">Bet Placed Successfully!</div>
          <div class="text-sm text-muted-foreground">Your {{ betType.toUpperCase() }} shares have been added to your portfolio</div>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Market Header -->
        <GlassCard>
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <span class="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full text-sm">{{ market.category }}</span>
              <h1 class="text-3xl mt-4 mb-2">{{ market.title }}</h1>
              <p class="text-muted-foreground">{{ market.description }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <div class="text-sm text-muted-foreground mb-1">Volume</div>
              <div class="flex items-center gap-1">
                <TrendingUp class="w-4 h-4 text-[#00D1FF]" />
                <span class="text-lg">${{ (market.volume / 1000).toFixed(0) }}k</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Liquidity</div>
              <div class="flex items-center gap-1">
                <DollarSign class="w-4 h-4 text-[#7C3AED]" />
                <span class="text-lg">${{ (market.liquidity / 1000).toFixed(0) }}k</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Traders</div>
              <div class="flex items-center gap-1">
                <Users class="w-4 h-4" />
                <span class="text-lg">247</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Ends In</div>
              <div class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                <CountdownTimer :end-time="market.endTime" />
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Current Odds -->
        <GlassCard>
          <h3 class="mb-4">Current Odds</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="glass p-6 rounded-lg text-center">
              <div class="text-sm text-muted-foreground mb-2">YES</div>
              <div class="text-4xl text-[#00FF9D] mb-1">{{ (market.yesPrice * 100).toFixed(0) }}%</div>
              <div class="text-sm text-muted-foreground">${{ market.yesPrice.toFixed(2) }} per share</div>
            </div>
            <div class="glass p-6 rounded-lg text-center">
              <div class="text-sm text-muted-foreground mb-2">NO</div>
              <div class="text-4xl text-[#FF6B6B] mb-1">{{ (market.noPrice * 100).toFixed(0) }}%</div>
              <div class="text-sm text-muted-foreground">${{ market.noPrice.toFixed(2) }} per share</div>
            </div>
          </div>
        </GlassCard>

        <!-- Price Chart -->
        <GlassCard>
          <h3 class="mb-4">Price History (24h)</h3>
          <div style="height: 300px">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </GlassCard>

        <!-- Order Book -->
        <GlassCard>
          <h3 class="mb-4">Order Book</h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <div class="text-sm text-[#00FF9D] mb-3">Bids (Buy YES)</div>
              <div class="space-y-2">
                <div v-for="(bid, i) in mockOrderBook.bids" :key="i" class="flex justify-between text-sm p-2 glass rounded">
                  <span>${{ bid.price.toFixed(2) }}</span>
                  <span class="text-muted-foreground">{{ bid.amount }} shares</span>
                </div>
              </div>
            </div>
            <div>
              <div class="text-sm text-[#FF6B6B] mb-3">Asks (Buy NO)</div>
              <div class="space-y-2">
                <div v-for="(ask, i) in mockOrderBook.asks" :key="i" class="flex justify-between text-sm p-2 glass rounded">
                  <span>${{ ask.price.toFixed(2) }}</span>
                  <span class="text-muted-foreground">{{ ask.amount }} shares</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <!-- Betting Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-6">
          <GlassCard>
            <h3 class="mb-4">Place a Bet</h3>
            <div class="space-y-4">
              <!-- Bet Type -->
              <div>
                <label class="block text-sm mb-2">I predict</label>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="betType = 'yes'" :class="['p-3 rounded-lg border transition-all', betType === 'yes' ? 'border-[#00FF9D] bg-[#00FF9D]/10 text-[#00FF9D]' : 'border-white/10 hover:border-white/30']">YES</button>
                  <button @click="betType = 'no'" :class="['p-3 rounded-lg border transition-all', betType === 'no' ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]' : 'border-white/10 hover:border-white/30']">NO</button>
                </div>
              </div>

              <!-- Order Type -->
              <div>
                <label class="block text-sm mb-2">Order Type</label>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="orderType = 'market'" :class="['p-3 rounded-lg border transition-all', orderType === 'market' ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]' : 'border-white/10 hover:border-white/30']">Market</button>
                  <button @click="orderType = 'limit'" :class="['p-3 rounded-lg border transition-all', orderType === 'limit' ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]' : 'border-white/10 hover:border-white/30']">Limit</button>
                </div>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm mb-2">Amount (USDC)</label>
                <input v-model="betAmount" type="number" min="1" class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]" />
                <div class="flex gap-2 mt-2">
                  <button v-for="amt in [10, 25, 50, 100]" :key="amt" @click="betAmount = amt.toString()" class="flex-1 px-3 py-1 text-sm glass rounded hover:bg-white/5 transition-colors">${{ amt }}</button>
                </div>
              </div>

              <!-- Summary -->
              <div class="glass p-4 rounded-lg space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">You pay</span>
                  <span>${{ betAmount }} USDC</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">You get</span>
                  <span>{{ estimatedShares.toFixed(2) }} shares</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Avg. price</span>
                  <span>${{ (betType === 'yes' ? market.yesPrice : market.noPrice).toFixed(2) }}</span>
                </div>
                <div class="border-t border-white/10 pt-2 flex justify-between">
                  <span class="text-muted-foreground">Potential profit</span>
                  <span class="text-[#00FF9D]">+${{ potentialProfit.toFixed(2) }}</span>
                </div>
              </div>

              <NeonButton @click="handlePlaceBet" class="w-full" size="lg" :variant="betType === 'yes' ? 'primary' : 'secondary'">
                Buy {{ betType.toUpperCase() }} for ${{ betAmount }}
              </NeonButton>
            </div>
          </GlassCard>

          <GlassCard class="mt-6">
            <h3 class="mb-3">Market Info</h3>
            <div class="space-y-3 text-sm">
              <div>
                <div class="text-muted-foreground mb-1">Resolution</div>
                <div>Verified on-chain data</div>
              </div>
              <div>
                <div class="text-muted-foreground mb-1">Creator Fee</div>
                <div>1% on winning shares</div>
              </div>
              <div>
                <div class="text-muted-foreground mb-1">Platform Fee</div>
                <div>2% on all trades</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>

    <PaymentModal
      :is-open="showPaymentModal"
      :amount="parseFloat(betAmount)"
      currency="USDC"
      :purpose="`Buy ${betType.toUpperCase()} shares: ${market.title}`"
      @close="showPaymentModal = false"
      @confirm="handlePaymentSuccess"
    />
  </div>
</template>
