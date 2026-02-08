<script setup>
import { useRouter } from 'vue-router'
import { Sparkles, TrendingUp, Users, Zap, ArrowRight, Trophy, Target, Rocket } from 'lucide-vue-next'
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
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div class="text-center">
          <!-- Logo -->
          <div class="flex justify-center mb-8">
            <img :src="logoImage" alt="Dark Horse Coin" class="w-48 h-48 md:w-64 md:h-64 object-contain animate-float" />
          </div>

          <div class="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
            <Sparkles class="w-4 h-4 text-[#00D1FF]" />
            <span class="text-sm">Powered by Web3</span>
          </div>

          <h1 class="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-white via-[#00D1FF] to-[#7C3AED] bg-clip-text text-transparent">
            Everyone Can Be a<br />Leader
          </h1>

          <p class="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Become a Dark Horse
          </p>

          <p class="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Publish tasks, earn DHC tokens, predict outcomes, and grow together in a decentralized community
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NeonButton size="lg" @click="handleConnect">
              <span class="flex items-center gap-2">
                Connect Wallet (Gasless)
                <Zap class="w-5 h-5" />
              </span>
            </NeonButton>
            <NeonButton size="lg" variant="outline" @click="router.push('/tasks')">
              <span class="flex items-center gap-2">
                Explore Tasks
                <ArrowRight class="w-5 h-5" />
              </span>
            </NeonButton>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.totalUsers.toLocaleString() }}</div>
              <div class="text-sm text-muted-foreground">Active Users</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.tasksCompleted.toLocaleString() }}</div>
              <div class="text-sm text-muted-foreground">Tasks Completed</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ (communityStats.dhcVolume / 1000000).toFixed(1) }}M</div>
              <div class="text-sm text-muted-foreground">DHC Volume</div>
            </GlassCard>
            <GlassCard>
              <div class="text-3xl mb-2">{{ communityStats.activeMarkets }}</div>
              <div class="text-sm text-muted-foreground">Active Markets</div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="text-center mb-16">
        <h2 class="text-4xl mb-4">Why Black Horse Guild?</h2>
        <p class="text-muted-foreground text-lg">Empower yourself with Web3 technology</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center mb-4">
            <Target class="w-6 h-6 text-[#00D1FF]" />
          </div>
          <h3 class="text-xl mb-3">Personalized Tasks</h3>
          <p class="text-muted-foreground">
            Create and join tasks tailored to your interests, emotional growth, or academic pursuits. Earn DHC rewards for completion.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp class="w-6 h-6 text-[#7C3AED]" />
          </div>
          <h3 class="text-xl mb-3">Prediction Markets</h3>
          <p class="text-muted-foreground">
            Bet on task outcomes, crypto trends, and community events. Put your knowledge to the test and earn from accurate predictions.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00FF9D]/20 rounded-lg flex items-center justify-center mb-4">
            <Trophy class="w-6 h-6 text-[#00FF9D]" />
          </div>
          <h3 class="text-xl mb-3">Reputation System</h3>
          <p class="text-muted-foreground">
            Build your Black Horse Score through task completion and community participation. Higher reputation unlocks better opportunities.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#FFA500]/20 rounded-lg flex items-center justify-center mb-4">
            <Zap class="w-6 h-6 text-[#FFA500]" />
          </div>
          <h3 class="text-xl mb-3">Gasless Transactions</h3>
          <p class="text-muted-foreground">
            Powered by Conflux EIP-7702, enjoy gasless logins and transactions. No CFX needed to get started.
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#FF6B6B]/20 rounded-lg flex items-center justify-center mb-4">
            <Rocket class="w-6 h-6 text-[#FF6B6B]" />
          </div>
          <h3 class="text-xl mb-3">Yield Vault</h3>
          <p class="text-muted-foreground">
            Stake your tokens in our RWA-backed vault and earn passive income. Current APY: 8.2%
          </p>
        </GlassCard>

        <GlassCard hover>
          <div class="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center mb-4">
            <Users class="w-6 h-6 text-[#00D1FF]" />
          </div>
          <h3 class="text-xl mb-3">Community First</h3>
          <p class="text-muted-foreground">
            Connect with like-minded individuals, share experiences, and grow together in a supportive Web3 community.
          </p>
        </GlassCard>
      </div>
    </section>

    <!-- Hot Tasks Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-b from-transparent via-[#1a1f2e]/30 to-transparent">
      <div class="flex justify-between items-center mb-12">
        <div>
          <h2 class="text-4xl mb-2">🔥 Hot Tasks</h2>
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
          @click="router.push('/tasks')"
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
        <div class="absolute inset-0 bg-gradient-to-r from-[#00D1FF]/10 to-[#7C3AED]/10"></div>
        <div class="relative">
          <h2 class="text-4xl mb-4">Ready to become a Black Horse?</h2>
          <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students and alumni achieving their goals together
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NeonButton size="lg" @click="handleConnect">
              Get Started Now
            </NeonButton>
            <NeonButton size="lg" variant="secondary" @click="router.push('/tasks')">
              Create Your First Task
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
            <h4 class="mb-4">Black Horse Guild</h4>
            <p class="text-sm text-muted-foreground">
              Empowering communities through Web3 technology and decentralized collaboration.
            </p>
          </div>
          <div>
            <h4 class="mb-4">Platform</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><button @click="router.push('/tasks')" class="hover:text-foreground">Tasks</button></li>
              <li><button @click="router.push('/predictions')" class="hover:text-foreground">Predictions</button></li>
              <li><button @click="router.push('/vault')" class="hover:text-foreground">Vault</button></li>
              <li><button @click="router.push('/community')" class="hover:text-foreground">Community</button></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-4">Resources</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground">Documentation</a></li>
              <li><a href="#" class="hover:text-foreground">API</a></li>
              <li><a href="#" class="hover:text-foreground">Whitepaper</a></li>
              <li><a href="#" class="hover:text-foreground">Brand Assets</a></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-4">Community</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground">Discord</a></li>
              <li><a href="#" class="hover:text-foreground">Twitter</a></li>
              <li><a href="#" class="hover:text-foreground">WeChat Group</a></li>
              <li><a href="#" class="hover:text-foreground">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Black Horse Guild. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
