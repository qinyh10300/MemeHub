<script setup>
import { ref, onMounted } from 'vue'
import { Trophy, Sparkles, RotateCcw } from 'lucide-vue-next'

const emit = defineEmits(['playAgain'])

const confettiItems = ref([])

onMounted(() => {
  confettiItems.value = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: ['🎉', '🎊', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }))
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-300 via-orange-300 to-pink-400 flex flex-col items-center justify-center p-8 relative overflow-hidden">
    <!-- Confetti -->
    <div
      v-for="item in confettiItems"
      :key="item.id"
      class="absolute text-4xl animate-confetti"
      :style="{
        left: item.left + '%',
        animationDelay: item.delay + 's',
        animationDuration: item.duration + 's',
      }"
    >
      {{ item.emoji }}
    </div>

    <div class="text-center z-10 animate-scale-in">
      <!-- Trophy Animation -->
      <div class="mb-8 animate-trophy">
        <div class="inline-block bg-white rounded-full p-8 shadow-2xl">
          <Trophy class="w-32 h-32 text-yellow-500" />
        </div>
      </div>

      <!-- Congratulations Text -->
      <h1 class="text-7xl font-bold text-white mb-6 drop-shadow-2xl animate-slide-up" style="animation-delay: 0.3s">
        Congratulations! 🎉
      </h1>

      <!-- Coin Reward -->
      <div class="bg-white/30 backdrop-blur-md rounded-3xl p-12 mb-8 inline-block animate-bounce-in" style="animation-delay: 0.6s">
        <div class="flex items-center gap-6">
          <div class="text-8xl animate-spin-slow">🪙</div>
          <div class="text-left">
            <p class="text-3xl text-white mb-2">You earned</p>
            <p class="text-7xl font-bold text-yellow-300 drop-shadow-lg">1 M Coin</p>
          </div>
        </div>
      </div>

      <!-- Thank You Message -->
      <div class="mb-8 animate-fade-in-delayed">
        <p class="text-3xl text-white mb-4 drop-shadow-lg">Thank you for playing! 🙏</p>
        <p class="text-2xl text-white opacity-90 drop-shadow">Looking forward to the official release! 🚀</p>
      </div>

      <!-- Achievements Summary -->
      <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-2xl mx-auto animate-slide-up" style="animation-delay: 1.2s">
        <h3 class="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
          <Sparkles class="w-6 h-6" />
          Your Journey
          <Sparkles class="w-6 h-6" />
        </h3>
        <div class="grid grid-cols-3 gap-6 text-white">
          <div>
            <p class="text-4xl mb-2">✅</p>
            <p class="text-sm opacity-75">Character</p>
            <p class="font-bold">Selected</p>
          </div>
          <div>
            <p class="text-4xl mb-2">🎓</p>
            <p class="text-sm opacity-75">Tutorial</p>
            <p class="font-bold">Completed</p>
          </div>
          <div>
            <p class="text-4xl mb-2">💃</p>
            <p class="text-sm opacity-75">Dance</p>
            <p class="font-bold">Mastered</p>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-6 justify-center">
        <button
          @click="emit('playAgain')"
          class="bg-white text-purple-600 px-10 py-4 rounded-full text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
        >
          <RotateCcw class="w-6 h-6" />
          Play Again
        </button>
      </div>

      <!-- Footer Message -->
      <div class="mt-12 text-white text-lg opacity-75 animate-fade-in-delayed" style="animation-delay: 1.5s">
        <p>🌟 Web3 University - Where Learning Meets Fun! 🌟</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-confetti {
  animation: confetti 3s linear infinite;
}
@keyframes confetti {
  0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.animate-scale-in {
  animation: scaleIn 0.8s ease-out both;
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
.animate-trophy {
  animation: trophyBounce 2s ease-in-out infinite;
}
@keyframes trophyBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(5deg); }
  75% { transform: translateY(-20px) rotate(-5deg); }
}
.animate-slide-up {
  animation: slideUp 0.6s ease-out both;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-bounce-in {
  animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}
@keyframes bounceIn {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}
.animate-spin-slow {
  animation: spin 3s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-fade-in-delayed {
  animation: fadeIn 0.5s ease-out both;
  animation-delay: 1s;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
