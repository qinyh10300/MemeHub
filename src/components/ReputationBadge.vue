<script setup>
import { computed } from 'vue'
import { Award } from 'lucide-vue-next'

const props = defineProps({
  score: { type: Number, required: true },
  size: { type: String, default: 'md' },
})

const colorClass = computed(() => {
  if (props.score >= 90) return 'from-yellow-400 to-orange-500'
  if (props.score >= 70) return 'from-purple-400 to-pink-500'
  if (props.score >= 50) return 'from-blue-400 to-cyan-500'
  return 'from-gray-400 to-gray-600'
})

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}
</script>

<template>
  <div :class="['inline-flex items-center gap-1.5 bg-gradient-to-r rounded-full', colorClass, sizeClasses[size]]">
    <Award :class="iconSizes[size]" />
    <span class="font-semibold">{{ score }}</span>
  </div>
</template>
