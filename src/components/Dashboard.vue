<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Home, BarChart3, Target, TrendingUp, Vault, Users, Wallet, LogOut, Menu, X, Gamepad2, ArrowRight } from 'lucide-vue-next'
import { Line, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import ReputationBadge from './ReputationBadge.vue'
import TaskCard from './TaskCard.vue'
import PredictionCard from './PredictionCard.vue'
import { mockTasks, mockPredictionMarkets } from '@/lib/mockData'
import { useWallet } from '@/composables/useWallet'
import { toast } from 'vue-sonner'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const router = useRouter()
const { user, disconnect } = useWallet()

const sidebarOpen = ref(false)

const myTasks = computed(() => mockTasks.filter(t => t.status === 'joined'))
const myPredictions = computed(() => mockPredictionMarkets.slice(0, 2))

const mockWinRateData = [
  { month: 'Jan', rate: 60 },
  { month: 'Feb', rate: 65 },
  { month: 'Mar', rate: 62 },
  { month: 'Apr', rate: 68 },
  { month: 'May', rate: 70 },
  { month: 'Jun', rate: 68.5 },
]

const lineChartData = computed(() => ({
  labels: mockWinRateData.map(d => d.month),
  datasets: [{
    data: mockWinRateData.map(d => d.rate),
    borderColor: '#00D1FF',
    borderWidth: 2,
    tension: 0.3,
    fill: false,
    pointBackgroundColor: '#00D1FF',
    pointRadius: 3,
  }],
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1f2e' } },
  scales: {
    x: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    y: { ticks: { color: '#8b92a8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
  },
}

const tokenData = computed(() => {
  if (!user.value) return []
  return [
    { name: 'DHC', value: user.value.dhcBalance, color: '#00D1FF' },
    { name: 'Emotion', value: user.value.emotionBalance, color: '#7C3AED' },
    { name: 'Intellectual', value: user.value.intellectualBalance, color: '#00FF9D' },
  ]
})

const pieChartData = computed(() => ({
  labels: tokenData.value.map(t => t.name),
  datasets: [{
    data: tokenData.value.map(t => t.value),
    backgroundColor: tokenData.value.map(t => t.color),
    borderWidth: 0,
    spacing: 4,
  }],
}))

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1f2e' } },
}

function handleDisconnect() {
  disconnect()
  router.push('/')
  toast.info('Disconnected from wallet')
}

// Sidebar: Trade is the 2nd item, right after Dashboard
const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard', color: '' },
  { icon: BarChart3, label: 'Trade', path: '/dex', color: 'text-[#00D084]' },
  { icon: Target, label: 'Quests', path: '/tasks', color: '' },
  { icon: TrendingUp, label: 'Predict', path: '/predictions', color: '' },
  { icon: Vault, label: 'Vault', path: '/vault', color: '' },
  { icon: Users, label: 'Community', path: '/community', color: '' },
  { icon: Gamepad2, label: 'Game', path: '/game', color: '' },
]
</script>

<template>
  <div v-if="user" class="min-h-screen flex">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:block border-r border-white/10" style="background: rgba(10, 14, 23, 0.95);">
      <div class="w-64 flex flex-col p-6 space-y-6 h-screen sticky top-0">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-[#00D084] to-[#00D1FF] rounded-full flex items-center justify-center text-2xl">
            {{ user.avatar }}
          </div>
          <div>
            <div class="font-bold">{{ user.name }}</div>
            <div class="text-xs text-muted-foreground font-mono">{{ user.address.slice(0, 6) }}...{{ user.address.slice(-4) }}</div>
          </div>
        </div>

        <ReputationBadge :score="user.reputation" size="lg" />

        <nav class="flex-1 space-y-1">
          <button
            v-for="item in navItems"
            :key="item.label"
            @click="router.push(item.path)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left',
              item.color,
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
          </button>
        </nav>

        <button
          @click="handleDisconnect"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
        >
          <LogOut class="w-5 h-5" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden" @click="sidebarOpen = false">
      <div class="fixed top-0 left-0 h-full w-64 flex flex-col p-6 space-y-6" style="background: rgba(10, 14, 23, 0.98);" @click.stop>
        <button @click="sidebarOpen = false" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X class="w-6 h-6" />
        </button>

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-[#00D084] to-[#00D1FF] rounded-full flex items-center justify-center text-2xl">
            {{ user.avatar }}
          </div>
          <div>
            <div class="font-bold">{{ user.name }}</div>
            <div class="text-xs text-muted-foreground font-mono">{{ user.address.slice(0, 6) }}...{{ user.address.slice(-4) }}</div>
          </div>
        </div>

        <ReputationBadge :score="user.reputation" size="lg" />

        <nav class="flex-1 space-y-1">
          <button
            v-for="item in navItems"
            :key="item.label"
            @click="router.push(item.path); sidebarOpen = false"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left',
              item.color,
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
          </button>
        </nav>

        <button
          @click="handleDisconnect"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
        >
          <LogOut class="w-5 h-5" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1">
      <!-- Mobile Header -->
      <div class="lg:hidden border-b border-white/10 p-4 flex items-center justify-between" style="background: rgba(10, 14, 23, 0.95);">
        <button @click="sidebarOpen = true">
          <Menu class="w-6 h-6" />
        </button>
        <h2 class="font-bold">Dashboard</h2>
        <div class="w-6" />
      </div>

      <div class="p-6 max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl mb-2">Welcome back, {{ user.name }}!</h1>
          <p class="text-muted-foreground">Here's your activity overview</p>
        </div>

        <!-- Quick Trade Banner -->
        <div class="mb-8 relative overflow-hidden rounded-2xl border border-[#00D084]/20" style="background: radial-gradient(900px 400px at 20% 30%, rgba(0, 208, 132, 0.12), transparent 55%), radial-gradient(600px 400px at 90% 10%, rgba(0, 209, 255, 0.08), transparent 60%), #0b0f14;">
          <div class="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 bg-gradient-to-br from-[#00D084]/20 to-[#00D1FF]/20 rounded-2xl flex items-center justify-center">
                <BarChart3 class="w-7 h-7 text-[#00D084]" />
              </div>
              <div>
                <h3 class="text-lg font-bold">DarkHorse DEX</h3>
                <p class="text-sm text-muted-foreground">Trade tokens with real-time charts, order book depth, and on-chain settlement</p>
              </div>
            </div>
            <NeonButton @click="router.push('/dex')">
              <span class="flex items-center gap-2">
                Open Exchange
                <ArrowRight class="w-4 h-4" />
              </span>
            </NeonButton>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div class="text-sm text-muted-foreground mb-2">DHC Balance</div>
            <div class="text-2xl text-[#00D1FF]">{{ user.dhcBalance.toLocaleString() }}</div>
            <div class="text-xs text-muted-foreground mt-1">+12.5% this month</div>
          </GlassCard>
          <GlassCard>
            <div class="text-sm text-muted-foreground mb-2">Quests Completed</div>
            <div class="text-2xl">{{ user.tasksCompleted }}</div>
            <div class="text-xs text-[#00FF9D] mt-1">+5 this week</div>
          </GlassCard>
          <GlassCard>
            <div class="text-sm text-muted-foreground mb-2">Win Rate</div>
            <div class="text-2xl">{{ user.predictionWinRate }}%</div>
            <div class="text-xs text-[#00FF9D] mt-1">+2.3% improvement</div>
          </GlassCard>
          <GlassCard>
            <div class="text-sm text-muted-foreground mb-2">Reputation Score</div>
            <div class="text-2xl">{{ user.reputation }}</div>
            <ReputationBadge :score="user.reputation" size="sm" />
          </GlassCard>
        </div>

        <!-- Charts Row -->
        <div class="grid lg:grid-cols-2 gap-6 mb-8">
          <GlassCard>
            <h3 class="mb-4">Prediction Win Rate Trend</h3>
            <div style="height: 200px">
              <Line :data="lineChartData" :options="lineChartOptions" />
            </div>
          </GlassCard>

          <GlassCard>
            <h3 class="mb-4">Token Distribution</h3>
            <div style="height: 200px">
              <Pie :data="pieChartData" :options="pieChartOptions" />
            </div>
            <div class="flex justify-center gap-6 mt-4">
              <div v-for="token in tokenData" :key="token.name" class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: token.color }"></div>
                <span class="text-sm">{{ token.name }}: {{ token.value }}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <!-- Active Tasks -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl">My Active Quests</h2>
            <button @click="router.push('/tasks')" class="text-[#00D1FF] hover:text-[#00B8E6] transition-colors">
              View All →
            </button>
          </div>
          <div v-if="myTasks.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TaskCard v-for="task in myTasks" :key="task.id" :task="task" @click="router.push('/tasks')" />
          </div>
          <GlassCard v-else>
            <div class="text-center py-8 text-muted-foreground">
              <Target class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active quests yet. Start by joining a quest!</p>
              <button @click="router.push('/tasks')" class="mt-4 text-[#00D1FF] hover:text-[#00B8E6]">
                Browse Quests
              </button>
            </div>
          </GlassCard>
        </div>

        <!-- My Predictions -->
        <div>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl">My Predictions</h2>
            <button @click="router.push('/predictions')" class="text-[#00D1FF] hover:text-[#00B8E6] transition-colors">
              View All →
            </button>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <PredictionCard
              v-for="market in myPredictions"
              :key="market.id"
              :market="market"
              @click="router.push('/predictions')"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
