<script setup>
import { ref } from 'vue'
import CharacterSelection from './CharacterSelection.vue'
import CampusMap from './CampusMap.vue'
import NPCDialogue from './NPCDialogue.vue'
import DanceGame from './DanceGame.vue'
import EndingScreen from './EndingScreen.vue'

const gameState = ref('character-selection')
const selectedCharacter = ref('male')
const coins = ref(0)

function handleCharacterSelect(character) {
  selectedCharacter.value = character
  gameState.value = 'campus-map'
  setTimeout(() => {
    gameState.value = 'tutorial'
  }, 500)
}

function handleTutorialComplete() {
  gameState.value = 'campus-map'
}

function handleEnterBuilding(building) {
  if (building === 'clubs') {
    gameState.value = 'dance-game'
  }
}

function handleDanceGameComplete() {
  coins.value += 1
  gameState.value = 'ending'
}

function handlePlayAgain() {
  coins.value = 0
  gameState.value = 'character-selection'
}
</script>

<template>
  <div class="w-full h-screen">
    <CharacterSelection
      v-if="gameState === 'character-selection'"
      @character-select="handleCharacterSelect"
    />

    <CampusMap
      v-if="gameState === 'campus-map'"
      :selected-character="selectedCharacter"
      @enter-building="handleEnterBuilding"
    />

    <NPCDialogue
      v-if="gameState === 'tutorial'"
      @complete="handleTutorialComplete"
    />

    <DanceGame
      v-if="gameState === 'dance-game'"
      :selected-character="selectedCharacter"
      @complete="handleDanceGameComplete"
    />

    <EndingScreen
      v-if="gameState === 'ending'"
      @play-again="handlePlayAgain"
    />
  </div>
</template>
