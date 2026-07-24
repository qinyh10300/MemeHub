<template>
  <div v-if="userData" class="profile-stats">
    <div class="stat-item">
      <p class="stat-value">{{ userData.followers }}</p>
      <p class="stat-label">Followers</p>
    </div>
    <div class="stat-item">
      <p class="stat-value">{{ userData.following }}</p>
      <p class="stat-label">Following</p>
    </div>
    <div class="stat-item">
      <p class="stat-value">{{ userData.likes }}</p>
      <p class="stat-label">Likes</p>
    </div>
    <div v-if="isOwnProfile" class="stat-item usdt-item">
      <p class="stat-value usdt-value">
        <span class="usdt-icon">💵</span>
        {{ formatUsdt(userData.coins) }}
      </p>
      <p class="stat-label">USDT Balance</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userData: Object,
  isOwnProfile: {
    type: Boolean,
    default: true
  }
})

const isOwnProfile = computed(() => props.isOwnProfile)

// Format USDT amount, keep up to 4 decimal places
const stripTrailingZeros = (value = '') => value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')

const formatWithSuffix = (value, divisor, suffix) => {
  const scaled = Number(value) / divisor
  if (!Number.isFinite(scaled)) return `0${suffix}`
  return `${stripTrailingZeros(scaled.toFixed(2))}${suffix}`
}

const formatUsdt = (amount) => {
  if (amount === undefined || amount === null) return '0'
  // if (amount >= 10000) {
  //   return (amount / 10000).toFixed(1) + 'w'
  // }
  // if (amount >= 1000) {
  //   return (amount / 1000).toFixed(1) + 'k'
  // }
  return amount.toFixed(4);
}
</script>

<style scoped>
.profile-stats {
  position: absolute;
  top: 160px; /* Control the distance from the top, adjust according to your avatar area */
  left: 65px;

  width: 400px;  /* Increase width to accommodate 4 items */
  height: 80px;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.stat-value {
  font-size: 1.25rem; /* Approximately text-2xl */
  font-weight: 600;
  color: #ecf3ee;
}

.stat-label {
  font-size: 0.875rem;
  color: #ecf2ee;
  margin-top: -2px;
}

/* USDT special styles */
.usdt-item {
  background: linear-gradient(135deg, rgba(102, 212, 255, 0.08), rgba(14, 142, 249, 0.04));
  border: 1px solid rgba(102, 212, 255, 0.15);
  border-radius: 8px;
}

.usdt-value {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6ec1ff !important;
}

.usdt-icon {
  font-size: 1rem;
}
</style>
