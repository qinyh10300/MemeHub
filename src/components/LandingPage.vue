<script setup>
import { useRouter } from 'vue-router'
import { Sparkles, TrendingUp, Users, Zap, ArrowRight, Trophy, Target, Rocket, BarChart3, Gamepad2, Shield } from 'lucide-vue-next'
import NeonButton from './NeonButton.vue'
import GlassCard from './GlassCard.vue'
import TaskCard from './TaskCard.vue'
import PredictionCard from './PredictionCard.vue'
import { communityStats, mockTasks, mockPredictionMarkets } from '@/lib/mockData'
import { useWallet } from '@/composables/useWallet'
import logoImage from '@/assets/b8f58a1008053d1020a7a7afc4c7f9710150ac8f.png'

const router = useRouter()
const { isConnected, openConnectModal } = useWallet()

function handleConnect() {
  if (isConnected.value) {
    router.push('/dashboard')
  } else {
    openConnectModal()
  }
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Animated gradient background -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#0A0E17] via-[#1a1f2e] to-[#0A0E17] animate-gradient"></div>
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-20 left-20 w-72 h-72 bg-[#00D1FF] rounded-full blur-[120px] animate-float"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-[#7C3AED] rounded-full blur-[120px] animate-float" style="animation-delay: 3s"></div>
        <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-[#00D084] rounded-full blur-[100px] animate-float" style="animation-delay: 1.5s"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div class="text-center">
          <!-- Logo -->
          <div class="flex justify-center mb-8">
            <img :src="logoImage" alt="Dark Horse Coin" class="w-48 h-48 md:w-64 md:h-64 object-contain animate-float" />
          </div>

          <div class="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
            <Sparkles class="w-4 h-4 text-[#00D1FF]" />
            <span class="text-sm">Powered by Web3 Civilization</span>
          </div>

          <h1 class="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-white via-[#00D1FF] to-[#7C3AED] bg-clip-text text-transparent">
            Everyone Can Be a<br />Leader
          </h1>

          <p class="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Become a Dark Horse
          </p>

          <p class="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Trade on-chain, complete quests, predict markets, and grow together in a decentralized community
          </p>

          <!-- Hero CTA — Trade is primary -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NeonButton size="lg" @click="router.push('/dex')">
              <span class="flex items-center gap-2">
                Start Trading
                <BarChart3 class="w-5 h-5" />
              </span>
            </NeonButton>
            <NeonButton size="lg" variant="outline" @click="handleConnect">
              <span class="flex items-center gap-2">
                Connect Wallet
                <Zap class="w-5 h-5" />
              </span>
            </NeonButton>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.totalUsers.toLocaleString() }}</div>
              <div class="text-sm text-muted-foreground">Active Traders</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.tasksCompleted.toLocaleString() }}</div>
              <div class="text-sm text-muted-foreground">Quests Completed</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ (communityStats.dhcVolume / 1000000).toFixed(1) }}M</div>
              <div class="text-sm text-muted-foreground">Trading Volume</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.activeMarkets }}</div>
              <div class="text-sm text-muted-foreground">Active Markets</div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>

    <!-- DEX Trading Section — NEW, prominent -->
    <section class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="absolute inset-0 bg-gradient-to-b from-[#00D084]/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
      <div class="relative">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 bg-[#00D084]/10 border border-[#00D084]/20 px-4 py-2 rounded-full mb-6">
            <BarChart3 class="w-4 h-4 text-[#00D084]" />
            <span class="text-sm text-[#00D084] font-semibold">On-Chain DEX</span>
          </div>
          <h2 class="text-4xl md:text-5xl mb-4">Trade Any Token</h2>
          <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time order book, K-line charts, limit & market orders — all fully on-chain with zero intermediaries
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <GlassCard hover class="border border-[#00D084]/10">
            <div class="w-14 h-14 bg-gradient-to-br from-[#00D084]/20 to-[#00D1FF]/20 rounded-2xl flex items-center justify-center mb-5">
              <BarChart3 class="w-7 h-7 text-[#00D084]" />
            </div>
            <h3 class="text-xl mb-3 font-bold">Live K-Line Charts</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              Real-time candlestick charts with multiple timeframes. Watch the market pulse as trades happen on-chain.
            </p>
          </GlassCard>

          <GlassCard hover class="border border-[#00D084]/10">
            <div class="w-14 h-14 bg-gradient-to-br from-[#7C3AED]/20 to-[#FF6B6B]/20 rounded-2xl flex items-center justify-center mb-5">
              <TrendingUp class="w-7 h-7 text-[#7C3AED]" />
            </div>
            <h3 class="text-xl mb-3 font-bold">Order Book Trading</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              Place market or limit orders with full depth visibility. See bid/ask spread, volume, and trade history.
            </p>
          </GlassCard>

          <GlassCard hover class="border border-[#00D084]/10">
            <div class="w-14 h-14 bg-gradient-to-br from-[#00D1FF]/20 to-[#00D084]/20 rounded-2xl flex items-center justify-center mb-5">
              <Shield class="w-7 h-7 text-[#00D1FF]" />
            </div>
            <h3 class="text-xl mb-3 font-bold">Vault & Deposits</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              Deposit tokens into the DEX vault for seamless trading. Withdraw anytime — your keys, your funds.
            </p>
          </GlassCard>
        </div>

        <div class="text-center">
          <NeonButton size="lg" @click="router.push('/dex')">
            <span class="flex items-center gap-2">
              Open DEX
              <ArrowRight class="w-5 h-5" />
            </span>
          </NeonButton>
        </div>
      </div>
    </section>

    <!-- Features Section — Reorganized as ecosystem pillars -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="text-center mb-16">
        <h2 class="text-4xl mb-4">The DarkHorse Ecosystem</h2>
        <p class="text-muted-foreground text-lg">Trade, earn, learn, and build — all in one platform</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <GlassCard hover>
          <div class="w-12 h-12 bg-[#FFA500]/20 rounded-lg flex items-center justify-center mb-4">
            <Target class="w-6 h-6 text-[#FFA500]" />
          </div>
          <h3 class="text-xl mb-3">Quests & Challenges</h3>
          <p class="text-muted-foreground">
            Join community quests, prove skills, and earn DHC tokens. From Web3 courses to daily habits.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp class="w-6 h-6 text-[#7C3AED]" />
          </div>
          <h3 class="text-xl mb-3">Prediction Markets</h3>
          <p class="text-muted-foreground">
            Bet on crypto trends, task outcomes, and community events. Earn from your market insights.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00FF9D]/20 rounded-lg flex items-center justify-center mb-4">
            <Trophy class="w-6 h-6 text-[#00FF9D]" />
          </div>
          <h3 class="text-xl mb-3">Reputation Score</h3>
          <p class="text-muted-foreground">
            Build your on-chain reputation through activity. Higher scores unlock exclusive access and better rates.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#FF6B6B]/20 rounded-lg flex items-center justify-center mb-4">
            <Rocket class="w-6 h-6 text-[#FF6B6B]" />
          </div>
          <h3 class="text-xl mb-3">Yield Vault</h3>
          <p class="text-muted-foreground">
            Stake tokens in our RWA-backed vault for passive income. Current APY: 8.2%.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center mb-4">
            <Gamepad2 class="w-6 h-6 text-[#00D1FF]" />
          </div>
          <h3 class="text-xl mb-3">Web3 Games</h3>
          <p class="text-muted-foreground">
            Play interactive Web3 games on campus, collect tokens, and complete challenges to earn rewards.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00D084]/20 rounded-lg flex items-center justify-center mb-4">
            <Users class="w-6 h-6 text-[#00D084]" />
          </div>
          <h3 class="text-xl mb-3">Community Hub</h3>
          <p class="text-muted-foreground">
            Share wins, discuss strategies, and climb the leaderboard in a vibrant Web3 community.
          </p>
        </GlassCard>
      </div>
    </section>

    <!-- Hot Tasks Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-b from-transparent via-[#1a1f2e]/30 to-transparent">
      <div class="flex justify-between items-center mb-12">
        <div>
          <h2 class="text-4xl mb-2">🔥 Hot Quests</h2>
          <p class="text-muted-foreground">Join popular challenges and earn rewards</p>
        </div>
        <NeonButton variant="outline" @click="router.push('/tasks')">
          View All
        </NeonButton>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TaskCard
          v-for="task in mockTasks.slice(0, 3)"
          :key="task.id"
          :task="task"
          @click="task.isGameTask ? router.push('/game') : router.push('/tasks')"
        />
      </div>
    </section>

    <!-- Prediction Markets Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="flex justify-between items-center mb-12">
        <div>
          <h2 class="text-4xl mb-2">📊 Featured Predictions</h2>
          <p class="text-muted-foreground">Bet on outcomes and earn from your insights</p>
        </div>
        <NeonButton variant="outline" @click="router.push('/predictions')">
          View Markets
        </NeonButton>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <PredictionCard
          v-for="market in mockPredictionMarkets.slice(0, 2)"
          :key="market.id"
          :market="market"
          @click="router.push('/predictions')"
        />
      </div>
    </section>

    <!-- CTA Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <GlassCard class="text-center py-16 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-[#00D084]/10 via-[#00D1FF]/10 to-[#7C3AED]/10"></div>
        <div class="relative">
          <h2 class="text-4xl mb-4">Ready to ride the Dark Horse?</h2>
          <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of traders and builders shaping the future of decentralized finance
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NeonButton size="lg" @click="router.push('/dex')">
              Launch DEX
            </NeonButton>
            <NeonButton size="lg" variant="secondary" @click="handleConnect">
              Connect & Explore
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10 mt-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <h4 class="mb-4">DarkHorse Community</h4>
            <p class="text-sm text-muted-foreground">
              A full-stack Web3 platform combining on-chain trading, gamified quests, prediction markets, and community governance.
            </p>
          </div>
          <div>
            <h4 class="mb-4">Trading</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><button @click="router.push('/dex')" class="hover:text-foreground">DEX Exchange</button></li>
              <li><button @click="router.push('/predictions')" class="hover:text-foreground">Predictions</button></li>
              <li><button @click="router.push('/vault')" class="hover:text-foreground">Yield Vault</button></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-4">Explore</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><button @click="router.push('/tasks')" class="hover:text-foreground">Quests</button></li>
              <li><button @click="router.push('/game')" class="hover:text-foreground">Web3 Game</button></li>
              <li><button @click="router.push('/community')" class="hover:text-foreground">Community</button></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-4">Connect</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground">Discord</a></li>
              <li><a href="#" class="hover:text-foreground">Twitter</a></li>
              <li><a href="#" class="hover:text-foreground">GitHub</a></li>
              <li><a href="#" class="hover:text-foreground">Docs</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 DarkHorse Community. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
