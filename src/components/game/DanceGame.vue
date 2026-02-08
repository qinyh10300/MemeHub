<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Music, Star } from 'lucide-vue-next'

const props = defineProps({
  selectedCharacter: String,
})

const emit = defineEmits(['complete'])

const beats = ref([])
const score = ref(0)
const combo = ref(0)
const gameStarted = ref(false)
const gameEnded = ref(false)
const showFeedback = ref(null)
const progress = ref(0)
let beatIdCounter = 0
let beatInterval = null
let gameLoop = null
const targetHits = 15

function startGame() {
  gameStarted.value = true
}

function updateBeats() {
  beats.value = beats.value
    .map(beat => ({ ...beat, position: beat.position + 2 }))
    .filter(beat => {
      if (beat.position > 100 && beat.hit === null) {
        combo.value = 0
        showFeedback.value = 'miss'
        setTimeout(() => { showFeedback.value = null }, 500)
        return false
      }
      return beat.position < 105
    })

  if (gameStarted.value && !gameEnded.value) {
    gameLoop = requestAnimationFrame(updateBeats)
  }
}

watch(gameStarted, (started) => {
  if (started && !gameEnded.value) {
    beatInterval = setInterval(() => {
      beats.value.push({
        id: beatIdCounter++,
        position: 0,
        hit: null,
      })
    }, 1200)

    gameLoop = requestAnimationFrame(updateBeats)
  }
})

watch(score, (newScore) => {
  if (newScore >= targetHits && !gameEnded.value) {
    gameEnded.value = true
    clearInterval(beatInterval)
    if (gameLoop) cancelAnimationFrame(gameLoop)
    setTimeout(() => emit('complete'), 2000)
  }
})

onUnmounted(() => {
  clearInterval(beatInterval)
  if (gameLoop) cancelAnimationFrame(gameLoop)
})

function handleBeatClick() {
  const hittableBeats = beats.value.filter(
    beat => beat.position >= 82 && beat.position <= 98 && beat.hit === null
  )

  if (hittableBeats.length > 0) {
    const beat = hittableBeats[0]
    const accuracy = Math.abs(90 - beat.position)

    let feedback = 'good'
    let points = 1

    if (accuracy <= 3) {
      feedback = 'perfect'
      points = 2
    }

    beats.value = beats.value.map(b =>
      b.id === beat.id ? { ...b, hit: true } : b
    )
    score.value += points
    combo.value += 1
    showFeedback.value = feedback
    progress.value = (score.value / targetHits) * 100
    setTimeout(() => { showFeedback.value = null }, 500)
  } else {
    combo.value = 0
    showFeedback.value = 'miss'
    setTimeout(() => { showFeedback.value = null }, 500)
  }
}
</script>

<template>
  <!-- Start Screen -->
  <div v-if="!gameStarted" class="min-h-screen bg-gradient-to-b from-purple-600 via-pink-500 to-red-500 flex flex-col items-center justify-center p-8">
    <div class="text-center animate-scale-in">
      <div class="text-8xl mb-8 animate-wiggle">💃</div>
      <h1 class="text-6xl font-bold text-white mb-4 drop-shadow-lg">
        Dance Club! 🎵
      </h1>
      <p class="text-2xl text-white mb-8">
        Welcome to the hottest spot on campus!
      </p>
      <div class="bg-white/20 backdrop-blur-md rounded-2xl p-8 mb-8 max-w-2xl">
        <h2 class="text-3xl font-bold text-white mb-4">How to Play:</h2>
        <ul class="text-xl text-white text-left space-y-2">
          <li>⭐ Click when the beat reaches the target zone!</li>
          <li>🎯 Hit {{ targetHits }} beats to complete the game</li>
          <li>💫 Perfect timing = Double points!</li>
          <li>🔥 Keep the combo going!</li>
        </ul>
      </div>
      <button
        @click="startGame"
        class="bg-white text-purple-600 px-12 py-4 rounded-full text-3xl font-bold shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-90"
      >
        Start Dancing! 🕺
      </button>
    </div>
  </div>

  <!-- Game Screen -->
  <div v-else class="min-h-screen bg-gradient-to-b from-purple-600 via-pink-500 to-red-500 flex flex-col items-center justify-center p-8 relative overflow-hidden">
    <!-- Background effects -->
    <div class="absolute top-20 left-20 text-6xl opacity-30 animate-spin-slow">🎵</div>
    <div class="absolute bottom-20 right-20 text-6xl opacity-30 animate-spin-slow-reverse">🎶</div>

    <!-- Score and Progress -->
    <div class="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
      <div class="bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4 mb-4">
        <div class="flex items-center gap-8">
          <div class="text-white">
            <p class="text-sm opacity-75">Score</p>
            <p class="text-4xl font-bold">{{ score }}</p>
          </div>
          <div class="text-white">
            <p class="text-sm opacity-75">Combo</p>
            <p class="text-4xl font-bold text-yellow-300">{{ combo }}x</p>
          </div>
          <div class="text-white">
            <p class="text-sm opacity-75">Progress</p>
            <p class="text-2xl font-bold">{{ score }}/{{ targetHits }}</p>
          </div>
        </div>
      </div>
      <!-- Progress Bar -->
      <div class="w-96 h-4 bg-white/30 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Dancing Character -->
    <div class="mb-12 animate-dance">
      <svg v-if="selectedCharacter === 'male'" viewBox="0 0 200 200" class="w-48 h-48">
        <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
        <path d="M 55 50 Q 50 30, 70 25 Q 90 20, 100 22 Q 110 20, 130 25 Q 150 30, 145 50 L 140 60 Q 130 35, 100 35 Q 70 35, 60 60 Z" fill="#4a3428" />
        <circle cx="85" cy="70" r="8" fill="#2c1810" />
        <circle cx="115" cy="70" r="8" fill="#2c1810" />
        <path d="M 80 85 Q 100 95, 120 85" stroke="#2c1810" stroke-width="3" fill="none" />
        <ellipse cx="100" cy="140" rx="35" ry="45" fill="#3b82f6" />
        <ellipse cx="70" cy="135" rx="12" ry="30" fill="#ffd4a3" class="animate-arm-left" />
        <ellipse cx="130" cy="135" rx="12" ry="30" fill="#ffd4a3" class="animate-arm-right" />
        <ellipse cx="85" cy="185" rx="10" ry="20" fill="#1e40af" />
        <ellipse cx="115" cy="185" rx="10" ry="20" fill="#1e40af" />
      </svg>
      <svg v-else viewBox="0 0 200 200" class="w-48 h-48">
        <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
        <path d="M 55 50 Q 50 30, 70 25 Q 90 20, 100 22 Q 110 20, 130 25 Q 150 30, 145 50 L 140 70 Q 130 35, 100 35 Q 70 35, 60 70 Z" fill="#8b4513" />
        <circle cx="50" cy="70" r="18" fill="#8b4513" />
        <circle cx="150" cy="70" r="18" fill="#8b4513" />
        <circle cx="85" cy="70" r="8" fill="#2c1810" />
        <circle cx="115" cy="70" r="8" fill="#2c1810" />
        <path d="M 80 85 Q 100 95, 120 85" stroke="#ff69b4" stroke-width="3" fill="none" />
        <path d="M 65 120 L 100 185 L 135 120 Q 118 120, 100 125 Q 82 120, 65 120" fill="#ec4899" />
        <ellipse cx="100" cy="130" rx="35" ry="25" fill="#ec4899" />
        <ellipse cx="70" cy="135" rx="12" ry="30" fill="#ffd4a3" class="animate-arm-left" />
        <ellipse cx="130" cy="135" rx="12" ry="30" fill="#ffd4a3" class="animate-arm-right" />
      </svg>
    </div>

    <!-- Game Area -->
    <div class="relative w-full max-w-4xl h-32 mb-8">
      <div class="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
        <!-- Beats -->
        <div
          v-for="beat in beats"
          :key="beat.id"
          class="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-opacity"
          :style="{ left: beat.position + '%', opacity: beat.hit ? 0 : 1 }"
        >
          <div
            :class="[
              'w-16 h-16 rounded-full flex items-center justify-center shadow-xl',
              beat.hit === null ? 'bg-yellow-400' : 'bg-green-400',
            ]"
          >
            <Music class="w-8 h-8 text-white" />
          </div>
        </div>

        <!-- Target Zone -->
        <div class="absolute left-[90%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-8 border-white border-dashed flex items-center justify-center">
          <Star class="w-12 h-12 text-white" />
        </div>
      </div>
    </div>

    <!-- Hit Button -->
    <button
      @click="handleBeatClick"
      class="bg-white text-purple-600 px-16 py-8 rounded-full text-4xl font-bold shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-90 z-10"
    >
      HIT! 🎯
    </button>

    <!-- Feedback -->
    <Transition name="feedback">
      <div
        v-if="showFeedback"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      >
        <div
          :class="[
            'text-6xl font-bold drop-shadow-lg',
            showFeedback === 'perfect' ? 'text-yellow-300' :
            showFeedback === 'good' ? 'text-green-300' :
            'text-red-300',
          ]"
        >
          <template v-if="showFeedback === 'perfect'">⭐ PERFECT! ⭐</template>
          <template v-else-if="showFeedback === 'good'">✨ GOOD! ✨</template>
          <template v-else>❌ MISS! ❌</template>
        </div>
      </div>
    </Transition>

    <!-- Game Complete -->
    <div
      v-if="gameEnded"
      class="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
    >
      <div class="text-center">
        <div class="text-9xl mb-8 animate-spin-slow">🏆</div>
        <h2 class="text-6xl font-bold text-white mb-4">Amazing! 🎉</h2>
        <p class="text-3xl text-white">You earned 1 M Coin!</p>
      </div>
    </div>

    <!-- Music Note -->
    <div class="absolute bottom-8 right-8 text-white text-xl opacity-75">
      🎵 Beat It - Michael Jackson (Inspired)
    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.5s ease-out;
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
.animate-wiggle {
  animation: wiggle 0.5s ease-in-out infinite 1s;
}
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  75% { transform: rotate(-10deg); }
}
.animate-dance {
  animation: dance 1s ease-in-out infinite;
}
@keyframes dance {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-20px) rotate(5deg); }
}
.animate-arm-left {
  animation: armSwing 0.5s ease-in-out infinite;
  transform-origin: 70px 135px;
}
@keyframes armSwing {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(45deg); }
}
.animate-arm-right {
  animation: armSwingRight 0.5s ease-in-out infinite;
  transform-origin: 130px 135px;
}
@keyframes armSwingRight {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-45deg); }
}
.animate-spin-slow {
  animation: spin 20s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow-reverse {
  animation: spinReverse 15s linear infinite;
}
@keyframes spinReverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.feedback-enter-active {
  animation: feedbackIn 0.3s ease-out;
}
.feedback-leave-active {
  animation: feedbackOut 0.2s ease-in;
}
@keyframes feedbackIn {
  from { opacity: 0; transform: translate(-50%, 50px) scale(0.5); }
  to { opacity: 1; transform: translate(-50%, -50px) scale(1.5); }
}
@keyframes feedbackOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
