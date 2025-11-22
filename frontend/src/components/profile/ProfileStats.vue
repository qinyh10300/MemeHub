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
  </div>
</template>

<script setup>
defineProps({
  userData: Object,
})
</script>

<style scoped>
.profile-stats {
  position: absolute;
  top: 160px; /* 控制距离顶部的高度，根据你的头像区域调整 */
  left: 65px;
  
  width: 300px;  /* 固定宽度 */
  height: 80px;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
</style>
