<template>
  <div class="discover-page">
    <header class="page-header">
      <h1 class="title">🔍 Discover</h1>
      <p class="subtitle">Explore the meme world and find opportunities</p>
    </header>

    <!-- 功能导航 -->
    <div class="feature-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['feature-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="feature-icon">{{ tab.icon }}</span>
        <span class="feature-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 排行榜 -->
      <div v-if="activeTab === 'leaderboard'" class="tab-content">
        <LeaderboardContent />
      </div>

      <!-- 对比分析 -->
      <div v-if="activeTab === 'compare'" class="tab-content">
        <CompareContent />
      </div>

      <!-- 社区投票 -->
      <div v-if="activeTab === 'voting'" class="tab-content">
        <VotingContent />
      </div>

      <!-- 价格预警 -->
      <div v-if="activeTab === 'alert'" class="tab-content">
        <AlertContent />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 动态导入组件
import { defineAsyncComponent } from 'vue'

const LeaderboardContent = defineAsyncComponent(() => import('./LeaderboardView.vue'))
const CompareContent = defineAsyncComponent(() => import('./CompareView.vue'))
const VotingContent = defineAsyncComponent(() => import('./VotingView.vue'))
const AlertContent = defineAsyncComponent(() => import('./PriceAlertView.vue'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('leaderboard')

const tabs = [
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'compare', label: 'Comparisons', icon: '📊' },
  { id: 'voting', label: 'Community Voting', icon: '🗳️' },
  { id: 'alert', label: 'Price Alerts', icon: '🔔', requiresAuth: true }
]

// 根据路由参数设置初始标签
onMounted(() => {
  if (route.query.tab) {
    activeTab.value = route.query.tab
  }
})

// 监听标签变化，更新URL
watch(activeTab, (newTab) => {
  router.replace({ query: { tab: newTab } })
})
</script>

<style scoped>
.discover-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.subtitle {
  color: #888;
  font-size: 15px;
}

/* 功能导航 */
.feature-nav {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
}

.feature-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.feature-btn.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.2), rgba(46, 196, 182, 0.1));
  border-color: rgba(127, 90, 240, 0.4);
  color: #fff;
  font-weight: 600;
}

.feature-icon {
  font-size: 18px;
}

/* 内容区域 */
.content-area {
  min-height: 500px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

.tab-content :deep(.page-header) {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .feature-nav {
    flex-wrap: wrap;
  }

  .feature-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}
</style>

