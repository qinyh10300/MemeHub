<script setup>
import { ref, watch, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])

const dialogueLines = [
  "Welcome to Web3 University! 🎓",
  "I'm your guide on this exciting journey! 🧙‍♂️",
  "This campus has many amazing places to explore!",
  "Let me show you around! Head to the Interest & Social Clubs first - that's where the fun begins! 🎉",
  "Go ahead and click on the purple building at the top! I'll be here if you need me.",
]

const currentLine = ref(0)
const displayedText = ref('')
const isTyping = ref(true)
let typingInterval = null

function startTyping() {
  const text = dialogueLines[currentLine.value]
  let charIndex = 0
  displayedText.value = ''
  isTyping.value = true

  clearInterval(typingInterval)
  typingInterval = setInterval(() => {
    if (charIndex < text.length) {
      displayedText.value = text.slice(0, charIndex + 1)
      charIndex++
    } else {
      isTyping.value = false
      clearInterval(typingInterval)
    }
  }, 50)
}

// Start typing the first line
startTyping()

watch(currentLine, () => {
  if (currentLine.value < dialogueLines.length) {
    startTyping()
  }
})

onUnmounted(() => {
  clearInterval(typingInterval)
})

function handleNext() {
  if (isTyping.value) {
    clearInterval(typingInterval)
    displayedText.value = dialogueLines[currentLine.value]
    isTyping.value = false
  } else if (currentLine.value < dialogueLines.length - 1) {
    currentLine.value++
  } else {
    emit('complete')
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
    @click="handleNext"
  >
    <div class="relative max-w-2xl w-full mx-4 animate-scale-in">
      <!-- NPC Character -->
      <div class="absolute -top-32 left-1/2 transform -translate-x-1/2 animate-float-npc">
        <div class="bg-white rounded-full p-4 shadow-2xl">
          <svg viewBox="0 0 200 200" class="w-24 h-24">
            <circle cx="100" cy="70" r="45" fill="#ffd4a3" />
            <path d="M 60 50 L 100 10 L 140 50 L 130 55 L 100 25 L 70 55 Z" fill="#6b21a8" />
            <ellipse cx="100" cy="52" rx="50" ry="8" fill="#6b21a8" />
            <circle cx="100" cy="15" r="6" fill="#fbbf24" />
            <path d="M 70 80 Q 100 100, 130 80 L 125 95 Q 100 105, 75 95 Z" fill="#e5e7eb" />
            <circle cx="85" cy="70" r="6" fill="#2c1810" />
            <circle cx="115" cy="70" r="6" fill="#2c1810" />
            <circle cx="87" cy="68" r="2" fill="white" />
            <circle cx="117" cy="68" r="2" fill="white" />
            <path d="M 65 120 L 70 180 L 130 180 L 135 120 Q 100 125, 65 120" fill="#7c3aed" />
            <ellipse cx="100" cy="120" rx="40" ry="30" fill="#7c3aed" />
            <text x="90" y="140" fill="#fbbf24" font-size="20">⭐</text>
            <text x="105" y="160" fill="#fbbf24" font-size="15">✨</text>
          </svg>
        </div>
      </div>

      <!-- Dialogue Box -->
      <div class="bg-white rounded-3xl p-8 shadow-2xl border-4 border-purple-400">
        <div class="mb-6">
          <h3 class="text-2xl font-bold text-purple-600 mb-2">Guide Wizard</h3>
          <div class="h-32 flex items-center">
            <p class="text-xl text-gray-800 leading-relaxed">
              {{ displayedText }}<span v-if="isTyping" class="animate-pulse">▊</span>
            </p>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            {{ currentLine + 1 }} / {{ dialogueLines.length }}
          </div>
          <button
            @click.stop="handleNext"
            class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            {{ currentLine === dialogueLines.length - 1 ? "Let's Go! 🚀" : "Next →" }}
          </button>
        </div>
      </div>

      <p class="text-center text-white mt-4 text-sm opacity-75">
        Click anywhere or press Next to continue
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-scale-in {
  animation: scaleIn 0.4s ease-out;
}
@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-float-npc {
  animation: floatNpc 2s ease-in-out infinite;
}
@keyframes floatNpc {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -10px); }
}
</style>
