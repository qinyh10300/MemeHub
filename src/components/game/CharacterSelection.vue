<script setup>
import { ref } from 'vue'

const emit = defineEmits(['characterSelect'])

const selectedCharacter = ref(null)

function handleSelect(character) {
  selectedCharacter.value = character
}

function handleEnter() {
  if (selectedCharacter.value) {
    emit('characterSelect', selectedCharacter.value)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-blue-300 flex flex-col items-center justify-center p-8">
    <div class="text-center mb-12 animate-slide-down">
      <h1 class="text-6xl font-bold text-white mb-4 drop-shadow-lg">
        Hello Web3! 🌟
      </h1>
      <p class="text-2xl text-white drop-shadow">
        Choose your Magical Baby-style protagonist
      </p>
    </div>

    <div class="flex gap-12 mb-12">
      <!-- Male Character -->
      <button
        @click="handleSelect('male')"
        :class="[
          'relative bg-white rounded-3xl p-8 shadow-2xl transition-all hover:scale-105 active:scale-95',
          selectedCharacter === 'male'
            ? 'ring-8 ring-yellow-400 ring-offset-4'
            : 'hover:shadow-3xl',
        ]"
      >
        <div class="w-48 h-48 mb-4 flex items-center justify-center">
          <svg viewBox="0 0 200 200" class="w-full h-full">
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
        </div>
        <p class="text-xl font-bold text-gray-800">Brave Boy</p>
        <div
          v-if="selectedCharacter === 'male'"
          class="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 animate-pop-in"
        >
          <span class="text-2xl">✓</span>
        </div>
      </button>

      <!-- Female Character -->
      <button
        @click="handleSelect('female')"
        :class="[
          'relative bg-white rounded-3xl p-8 shadow-2xl transition-all hover:scale-105 active:scale-95',
          selectedCharacter === 'female'
            ? 'ring-8 ring-yellow-400 ring-offset-4'
            : 'hover:shadow-3xl',
        ]"
      >
        <div class="w-48 h-48 mb-4 flex items-center justify-center">
          <svg viewBox="0 0 200 200" class="w-full h-full">
            <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
            <path d="M 55 50 Q 50 30, 70 25 Q 90 20, 100 22 Q 110 20, 130 25 Q 150 30, 145 50 L 140 70 Q 130 35, 100 35 Q 70 35, 60 70 Z" fill="#8b4513" />
            <circle cx="50" cy="70" r="18" fill="#8b4513" />
            <circle cx="150" cy="70" r="18" fill="#8b4513" />
            <path d="M 40 65 L 35 70 L 40 75 M 60 65 L 65 70 L 60 75" fill="#ff69b4" />
            <path d="M 140 65 L 135 70 L 140 75 M 160 65 L 165 70 L 160 75" fill="#ff69b4" />
            <circle cx="85" cy="70" r="8" fill="#2c1810" />
            <circle cx="115" cy="70" r="8" fill="#2c1810" />
            <circle cx="87" cy="68" r="3" fill="white" />
            <circle cx="117" cy="68" r="3" fill="white" />
            <path d="M 78 62 L 75 58 M 82 60 L 80 55" stroke="#2c1810" stroke-width="2" stroke-linecap="round" />
            <path d="M 122 62 L 125 58 M 118 60 L 120 55" stroke="#2c1810" stroke-width="2" stroke-linecap="round" />
            <path d="M 80 85 Q 100 95, 120 85" stroke="#ff69b4" stroke-width="3" fill="none" stroke-linecap="round" />
            <path d="M 65 120 L 100 185 L 135 120 Q 118 120, 100 125 Q 82 120, 65 120" fill="#ec4899" />
            <ellipse cx="100" cy="130" rx="35" ry="25" fill="#ec4899" />
            <ellipse cx="70" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(-20 70 135)" />
            <ellipse cx="130" cy="135" rx="12" ry="30" fill="#ffd4a3" transform="rotate(20 130 135)" />
          </svg>
        </div>
        <p class="text-xl font-bold text-gray-800">Cute Girl</p>
        <div
          v-if="selectedCharacter === 'female'"
          class="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 animate-pop-in"
        >
          <span class="text-2xl">✓</span>
        </div>
      </button>
    </div>

    <button
      @click="handleEnter"
      :disabled="!selectedCharacter"
      :class="[
        'px-12 py-4 rounded-full text-2xl font-bold shadow-xl transition-all',
        selectedCharacter
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white cursor-pointer hover:shadow-2xl hover:scale-105 active:scale-95'
          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50',
      ]"
    >
      Enter Web3 University 🎓
    </button>
  </div>
</template>

<style scoped>
.animate-slide-down {
  animation: slideDown 0.8s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-50px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-pop-in {
  animation: popIn 0.3s ease-out;
}
@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
</style>
