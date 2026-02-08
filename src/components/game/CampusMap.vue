<script setup>
import { ref } from 'vue'
import { Sparkles, BookOpen, Users } from 'lucide-vue-next'

const props = defineProps({
  selectedCharacter: String,
})

const emit = defineEmits(['enterBuilding'])

const playerPosition = ref({ x: 50, y: 75 })
const isMoving = ref(false)

function movePlayerTo(building) {
  isMoving.value = true

  const destinations = {
    clubs: { x: 50, y: 20 },
    work: { x: 20, y: 50 },
    features: { x: 80, y: 50 },
  }

  playerPosition.value = destinations[building]

  setTimeout(() => {
    isMoving.value = false
    emit('enterBuilding', building)
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-300 via-green-200 to-green-100 relative overflow-hidden">
    <!-- Sky and clouds -->
    <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-300 to-transparent">
      <div class="absolute top-8 left-10 text-4xl animate-cloud-right">☁️</div>
      <div class="absolute top-16 right-20 text-3xl animate-cloud-left">☁️</div>
    </div>

    <!-- Campus Title -->
    <div class="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
      <h2 class="text-4xl font-bold text-white drop-shadow-lg">
        Web3 University Campus
      </h2>
    </div>

    <!-- Game area -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] max-w-6xl max-h-[800px]">
      <!-- Top Building - Interest & Social Clubs -->
      <button
        @click="movePlayerTo('clubs')"
        :disabled="isMoving"
        class="absolute left-1/2 top-[10%] transform -translate-x-1/2 cursor-pointer hover:scale-105 transition-transform"
      >
        <div class="relative">
          <div class="bg-purple-400 rounded-lg w-48 h-40 shadow-xl border-4 border-purple-600 flex flex-col items-center justify-center hover:shadow-2xl transition-all">
            <Users class="w-12 h-12 text-white mb-2" />
            <div class="text-white text-center px-2">
              <p class="font-bold text-lg">Interest & Social</p>
              <p class="text-sm">Clubs 🎉</p>
            </div>
          </div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[120px] border-l-transparent border-r-[120px] border-r-transparent border-b-[50px] border-b-purple-600"></div>
          <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-purple-800 rounded-t-lg"></div>
        </div>
      </button>

      <!-- Left Building - Work & Study -->
      <button
        @click="movePlayerTo('work')"
        :disabled="isMoving"
        class="absolute left-[10%] top-1/2 transform -translate-y-1/2 cursor-pointer hover:scale-105 transition-transform"
      >
        <div class="relative">
          <div class="bg-blue-400 rounded-lg w-48 h-40 shadow-xl border-4 border-blue-600 flex flex-col items-center justify-center hover:shadow-2xl transition-all">
            <BookOpen class="w-12 h-12 text-white mb-2" />
            <div class="text-white text-center px-2">
              <p class="font-bold text-lg">Work & Study</p>
              <p class="text-sm">📚</p>
            </div>
          </div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[120px] border-l-transparent border-r-[120px] border-r-transparent border-b-[50px] border-b-blue-600"></div>
          <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-blue-800 rounded-t-lg"></div>
        </div>
      </button>

      <!-- Right Building - More Exciting Features -->
      <button
        @click="movePlayerTo('features')"
        :disabled="isMoving"
        class="absolute right-[10%] top-1/2 transform -translate-y-1/2 cursor-pointer hover:scale-105 transition-transform"
      >
        <div class="relative">
          <div class="bg-yellow-400 rounded-lg w-48 h-40 shadow-xl border-4 border-yellow-600 flex flex-col items-center justify-center hover:shadow-2xl transition-all">
            <Sparkles class="w-12 h-12 text-white mb-2" />
            <div class="text-white text-center px-2">
              <p class="font-bold text-lg">More Exciting</p>
              <p class="text-sm">Features ✨</p>
            </div>
          </div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[120px] border-l-transparent border-r-[120px] border-r-transparent border-b-[50px] border-b-yellow-600"></div>
          <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-yellow-800 rounded-t-lg"></div>
        </div>
      </button>

      <!-- Player Character -->
      <div
        class="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-in-out"
        :style="{ left: playerPosition.x + '%', top: playerPosition.y + '%' }"
      >
        <div class="animate-bounce-gentle">
          <!-- Male Character -->
          <svg v-if="selectedCharacter === 'male'" viewBox="0 0 200 200" class="w-20 h-20">
            <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
            <path d="M 55 50 Q 50 30, 70 25 Q 90 20, 100 22 Q 110 20, 130 25 Q 150 30, 145 50 L 140 60 Q 130 35, 100 35 Q 70 35, 60 60 Z" fill="#4a3428" />
            <circle cx="85" cy="70" r="8" fill="#2c1810" />
            <circle cx="115" cy="70" r="8" fill="#2c1810" />
            <circle cx="87" cy="68" r="3" fill="white" />
            <circle cx="117" cy="68" r="3" fill="white" />
            <path d="M 80 85 Q 100 95, 120 85" stroke="#2c1810" stroke-width="3" fill="none" stroke-linecap="round" />
            <ellipse cx="100" cy="140" rx="35" ry="45" fill="#3b82f6" />
            <ellipse cx="70" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(-20 70 135)" />
            <ellipse cx="130" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(20 130 135)" />
            <ellipse cx="85" cy="185" rx="10" ry="20" fill="#1e40af" />
            <ellipse cx="115" cy="185" rx="10" ry="20" fill="#1e40af" />
          </svg>
          <!-- Female Character -->
          <svg v-else viewBox="0 0 200 200" class="w-20 h-20">
            <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
            <path d="M 55 50 Q 50 30, 70 25 Q 90 20, 100 22 Q 110 20, 130 25 Q 150 30, 145 50 L 140 70 Q 130 35, 100 35 Q 70 35, 60 70 Z" fill="#8b4513" />
            <circle cx="50" cy="70" r="18" fill="#8b4513" />
            <circle cx="150" cy="70" r="18" fill="#8b4513" />
            <circle cx="85" cy="70" r="8" fill="#2c1810" />
            <circle cx="115" cy="70" r="8" fill="#2c1810" />
            <circle cx="87" cy="68" r="3" fill="white" />
            <circle cx="117" cy="68" r="3" fill="white" />
            <path d="M 80 85 Q 100 95, 120 85" stroke="#ff69b4" stroke-width="3" fill="none" stroke-linecap="round" />
            <path d="M 65 120 L 100 185 L 135 120 Q 118 120, 100 125 Q 82 120, 65 120" fill="#ec4899" />
            <ellipse cx="100" cy="130" rx="35" ry="25" fill="#ec4899" />
            <ellipse cx="70" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(-20 70 135)" />
            <ellipse cx="130" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(20 130 135)" />
          </svg>
        </div>
      </div>

      <!-- Ground decorations -->
      <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-400 to-transparent opacity-50"></div>
    </div>
  </div>
</template>

<style scoped>
.animate-cloud-right {
  animation: cloudRight 20s linear infinite;
}
@keyframes cloudRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(100px); }
}
.animate-cloud-left {
  animation: cloudLeft 25s linear infinite;
}
@keyframes cloudLeft {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-80px); }
}
.animate-bounce-gentle {
  animation: bounceGentle 0.5s ease-in-out infinite;
}
@keyframes bounceGentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
