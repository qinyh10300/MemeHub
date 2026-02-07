<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, TrendingUp, DollarSign } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import PredictionCard from './PredictionCard.vue'
import { mockPredictionMarkets } from '@/lib/mockData'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('All')

const categories = ['All', 'Crypto', 'Tasks', 'Platform', 'NFT']

const filteredMarkets = computed(() =>
  mockPredictionMarkets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'All' || market.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
)

const totalVolume = mockPredictionMarkets.reduce((sum, m) => sum + m.volume, 0)
const totalLiquidity = mockPredictionMarkets.reduce((sum, m) => sum + m.liquidity, 0)
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl mb-2">Prediction Markets</h1>
      <p class="text-muted-foreground">Bet on outcomes and earn from your insights</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
            <TrendingUp class="w-6 h-6 text-[#00D1FF]" />
          </div>
          <div>
            <div class="text-2xl">{{ mockPredictionMarkets.length }}</div>
            <div class="text-sm text-muted-foreground">Active Markets</div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
            <DollarSign class="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <div class="text-2xl">${{ (totalVolume / 1000).toFixed(0) }}k</div>
            <div class="text-sm text-muted-foreground">24h Volume</div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-[#00FF9D]/20 rounded-lg flex items-center justify-center">
            <span class="text-xl">💰</span>
          </div>
          <div>
            <div class="text-2xl">${{ (totalLiquidity / 1000).toFixed(0) }}k</div>
            <div class="text-sm text-muted-foreground">Total Liquidity</div>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Search & Filters -->
    <div class="mb-8 space-y-4">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search markets..."
          class="w-full pl-12 pr-4 py-3 bg-input-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
        />
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <Filter class="w-5 h-5 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Category:</span>
        </div>
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'px-4 py-2 rounded-lg border transition-all',
            selectedCategory === cat
              ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
              : 'border-white/10 hover:border-white/30',
          ]"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Markets Grid -->
    <div v-if="filteredMarkets.length > 0" class="grid md:grid-cols-2 gap-6">
      <PredictionCard
        v-for="market in filteredMarkets"
        :key="market.id"
        :market="market"
        @click="router.push(`/predictions/${market.id}`)"
      />
    </div>
    <GlassCard v-else>
      <div class="text-center py-12 text-muted-foreground">
        <Search class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No markets found matching your criteria</p>
      </div>
    </GlassCard>

    <!-- Info Banner -->
    <div class="mt-12">
      <GlassCard class="bg-gradient-to-r from-[#00D1FF]/10 to-[#7C3AED]/10">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-[#7C3AED]/30 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp class="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div class="flex-1">
            <h3 class="mb-1">How Prediction Markets Work</h3>
            <p class="text-sm text-muted-foreground">
              Buy YES or NO shares based on your prediction. If you're right, you earn profits. If you're wrong, you lose your stake. All markets are resolved fairly based on verifiable outcomes.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>
