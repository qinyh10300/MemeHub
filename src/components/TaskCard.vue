<script setup lang="ts">
import { Users, Trophy } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import ReputationBadge from './ReputationBadge.vue'
import CountdownTimer from './CountdownTimer.vue'
import type { Task } from '@/lib/mockData'

defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  click: []
}>()

function getCategoryColor(category: string) {
  switch (category) {
    case 'Interest': return 'bg-[#00D1FF]/20 text-[#00D1FF]'
    case 'Emotional': return 'bg-[#7C3AED]/20 text-[#7C3AED]'
    case 'Academic-Industry': return 'bg-[#00FF9D]/20 text-[#00FF9D]'
    default: return 'bg-muted text-muted-foreground'
  }
}
</script>

<template>
  <GlassCard hover class="cursor-pointer" @click="emit('click')">
    <div class="flex justify-between items-start mb-4">
      <span :class="['px-3 py-1 rounded-full text-sm', getCategoryColor(task.category)]">
        {{ task.category }}
      </span>
      <span v-if="task.status === 'joined'" class="px-2 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs">
        Joined
      </span>
      <span v-else-if="task.status === 'ended'" class="px-2 py-1 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded text-xs">
        Ended
      </span>
    </div>

    <h3 class="text-lg mb-2 line-clamp-2">{{ task.title }}</h3>
    <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ task.description }}</p>

    <div class="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ task.creator.avatar }}</span>
        <div>
          <div class="text-sm">{{ task.creator.name }}</div>
          <ReputationBadge :score="task.creator.reputation" size="sm" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <div class="text-sm text-muted-foreground">Reward</div>
        <div class="flex items-center gap-1">
          <Trophy class="w-4 h-4 text-[#FFA500]" />
          <span class="text-[#FFA500]">{{ task.reward }} DHC</span>
        </div>
      </div>
      <div>
        <div class="text-sm text-muted-foreground">Entry Fee</div>
        <div class="text-[#00D1FF]">{{ task.entryFee }} USDC</div>
      </div>
    </div>

    <div class="flex justify-between items-center text-sm">
      <div class="flex items-center gap-1 text-muted-foreground">
        <Users class="w-4 h-4" />
        <span>{{ task.participants }}/{{ task.maxParticipants }}</span>
      </div>
      <CountdownTimer :end-time="task.deadline" compact />
    </div>
  </GlassCard>
</template>
