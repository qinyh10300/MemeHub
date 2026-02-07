<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Clock } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  endTime: Date
  compact?: boolean
}>(), {
  compact: false,
})

const timeLeft = ref('')

function updateTimer() {
  const now = Date.now()
  const distance = props.endTime.getTime() - now

  if (distance < 0) {
    timeLeft.value = 'Ended'
    return
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

  if (props.compact) {
    if (days > 0) {
      timeLeft.value = `${days}d ${hours}h`
    } else if (hours > 0) {
      timeLeft.value = `${hours}h ${minutes}m`
    } else {
      timeLeft.value = `${minutes}m`
    }
  } else {
    timeLeft.value = `${days}d ${hours}h ${minutes}m`
  }
}

let interval: ReturnType<typeof setInterval>

onMounted(() => {
  updateTimer()
  interval = setInterval(updateTimer, 60000)
})

onUnmounted(() => {
  clearInterval(interval)
})

watch(() => [props.endTime, props.compact], updateTimer)
</script>

<template>
  <div class="inline-flex items-center gap-1.5 text-muted-foreground">
    <Clock class="w-4 h-4" />
    <span :class="timeLeft === 'Ended' ? 'text-red-500' : ''">{{ timeLeft }}</span>
  </div>
</template>
