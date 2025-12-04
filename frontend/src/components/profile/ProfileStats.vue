<template>
  <div v-if="userData" class="profile-stats">
    <div class="stat-item">
      <p class="stat-value">{{ userData.followers }}</p>
      <p class="stat-label">粉丝</p>
    </div>
    <div class="stat-item">
      <p class="stat-value">{{ userData.following }}</p>
      <p class="stat-label">关注</p>
    </div>
    <div class="stat-item">
      <p class="stat-value">{{ userData.likes }}</p>
      <p class="stat-label">获赞</p>
    </div>
    <div v-if="isOwnProfile" class="stat-item usdt-item">
      <p class="stat-value usdt-value">
        <span class="usdt-icon">💵</span>
        {{ formatUsdt(userData.coins) }}
      </p>
      <p class="stat-label">USDT 余额</p>
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

// 格式化 USDT 数量
const formatUsdt = (amount) => {
  if (amount === undefined || amount === null) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + 'w'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'k'
  }
  return Math.floor(amount).toLocaleString()
}
</script>

<style scoped>
.profile-stats {
  position: absolute;
  top: 160px; /* 控制距离顶部的高度，根据你的头像区域调整 */
  left: 65px;
  
  width: 400px;  /* 增加宽度以容纳4项 */
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
  font-size: 1.25rem; /* 约等于 text-2xl */
  font-weight: 600;
  color: #ecf3ee;
}

.stat-label {
  font-size: 0.875rem;
  color: #ecf2ee;
  margin-top: -2px;
}

/* USDT 特殊样式 */
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
