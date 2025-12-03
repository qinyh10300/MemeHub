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
    <div class="stat-item coins-item">
      <p class="stat-value coins-value">
        <span class="coin-icon">🪙</span>
        {{ formatCoins(userData.coins) }}
      </p>
      <p class="stat-label">金币</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  userData: Object,
})

// 格式化金币数量
const formatCoins = (coins) => {
  if (coins === undefined || coins === null) return '0'
  if (coins >= 10000) {
    return (coins / 10000).toFixed(1) + 'w'
  }
  if (coins >= 1000) {
    return (coins / 1000).toFixed(1) + 'k'
  }
  return Math.floor(coins).toLocaleString()
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

/* 金币特殊样式 */
.coins-item {
  background: linear-gradient(135deg, rgba(255, 209, 102, 0.06), rgba(249, 200, 14, 0.03));
  border: 1px solid rgba(255, 209, 102, 0.12);
  border-radius: 8px;
}

.coins-value {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffd166 !important;
}

.coin-icon {
  font-size: 1rem;
}
</style>
