<script setup lang="ts">
import { TrendingUp, DollarSign } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import CountdownTimer from './CountdownTimer.vue'
import type { PredictionMarket } from '@/lib/mockData'

defineProps<{
  market: PredictionMarket
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <GlassCard hover class="cursor-pointer" @click="emit('click')">
    <div class="flex justify-between items-start mb-4">
      <span class="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full text-sm">
        {{ market.category }}
      </span>
      <span v-if="market.resolved" class="px-2 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs">
        Resolved
      </span>
    </div>

    <h3 class="text-lg mb-2">{{ market.title }}</h3>
    <p class="text-sm text-muted-foreground mb-6 line-clamp-2">{{ market.description }}</p>

    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="glass p-4 rounded-lg">
        <div class="text-sm text-muted-foreground mb-1">YES</div>
        <div class="text-2xl text-[#00FF9D]">{{ (market.yesPrice * 100).toFixed(0) }}%</div>
        <div class="text-xs text-muted-foreground mt-1">${{ market.yesPrice.toFixed(2) }}</div>
      </div>
      <div class="glass p-4 rounded-lg">
        <div class="text-sm text-muted-foreground mb-1">NO</div>
        <div class="text-2xl text-[#FF6B6B]">{{ (market.noPrice * 100).toFixed(0) }}%</div>
        <div class="text-xs text-muted-foreground mt-1">${{ market.noPrice.toFixed(2) }}</div>
      </div>
    </div>

    <div class="flex justify-between items-center pt-4 border-t border-white/10">
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <DollarSign class="w-4 h-4" />
          <span>${{ (market.liquidity / 1000).toFixed(0) }}k</span>
        </div>
        <div class="flex items-center gap-1">
          <TrendingUp class="w-4 h-4" />
          <span>${{ (market.volume / 1000).toFixed(0) }}k vol</span>
        </div>
      </div>
      <CountdownTimer :end-time="market.endTime" compact />
    </div>
  </GlassCard>
</template>
