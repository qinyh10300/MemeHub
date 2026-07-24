<template>
  <div class="leaderboard-page">
    <header class="page-header">
      <h1 class="title">🏆 Meme Leaderboard</h1>
      <p class="subtitle">Track the hottest, top gainers, and most active meme coins in real time</p>
    </header>

    <!-- 时间范围选择 -->
    <div class="time-filter">
      <button
        v-for="range in timeRanges"
        :key="range.value"
        :class="['time-btn', { active: selectedTimeRange === range.value }]"
        @click="selectedTimeRange = range.value"
      >
        {{ range.label }}
      </button>
    </div>

    <!-- 排行榜类型标签 -->
    <div class="tabs-container">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
      <button class="refresh-btn" @click="fetchLeaderboard" :disabled="loading">
        <span :class="['refresh-icon', { spinning: loading }]">↻</span>
      </button>
    </div>

    <!-- 排行榜内容 -->
    <div class="leaderboard-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>

      <div v-else-if="leaderboardData.length === 0" class="empty-state">
        <span class="empty-icon">📊</span>
        <p>No data</p>
      </div>

      <div v-else class="leaderboard-list">
        <!-- 前三名特殊展示 -->
        <div class="top-three">
          <div
            v-for="(item, index) in leaderboardData.slice(0, 3)"
            :key="item.id"
            :class="['top-card', `rank-${index + 1}`]"
            @click="goToMeme(item.id)"
          >
            <div class="rank-badge">{{ index + 1 }}</div>
            <img :src="getImageUrl(item.imageUrl)" :alt="item.title" class="meme-image" />
            <div class="meme-info">
              <h3 class="meme-title">{{ item.title }}</h3>
              <span class="meme-ticker">${{ item.ticker }}</span>
            </div>
            <div class="stats">
              <div class="stat-item main-stat">
                <span class="stat-value" :class="getValueClass(item)">
                  {{ formatMainStat(item) }}
                </span>
                <span class="stat-label">{{ getMainStatLabel() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${{ formatPrice(item.price) }}</span>
                <span class="stat-label">Current Price</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 其余排名列表 -->
        <div class="rank-list">
          <div class="list-header">
            <span class="col rank">Rank</span>
            <span class="col meme">Meme</span>
            <span class="col price">Price</span>
            <span class="col change">{{ getMainStatLabel() }}</span>
            <span class="col volume">24h Volume</span>
            <span class="col holders">Holders</span>
          </div>
          <div
            v-for="(item, index) in leaderboardData.slice(3)"
            :key="item.id"
            class="list-item"
            @click="goToMeme(item.id)"
          >
            <span class="col rank">{{ index + 4 }}</span>
            <div class="col meme">
              <img :src="getImageUrl(item.imageUrl)" :alt="item.title" class="mini-image" />
              <div class="meme-text">
                <span class="name">{{ item.title }}</span>
                <span class="ticker">${{ item.ticker }}</span>
              </div>
            </div>
            <span class="col price">${{ formatPrice(item.price) }}</span>
            <span class="col change" :class="getValueClass(item)">
              {{ formatMainStat(item) }}
            </span>
            <span class="col volume">${{ formatVolume(item.volume24h) }}</span>
            <span class="col holders">{{ item.holders || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 市场统计概览 -->
    <div class="market-overview">
      <h2 class="section-title">📈 Market Overview</h2>
      <div class="overview-grid">
        <div class="overview-card">
          <span class="overview-icon">💰</span>
          <div class="overview-content">
            <span class="overview-value">${{ formatVolume(marketStats.totalVolume) }}</span>
            <span class="overview-label">24h Total Volume</span>
          </div>
        </div>
        <div class="overview-card">
          <span class="overview-icon">📊</span>
          <div class="overview-content">
            <span class="overview-value">{{ marketStats.totalMemes }}</span>
            <span class="overview-label">Total Memes</span>
          </div>
        </div>
        <div class="overview-card">
          <span class="overview-icon">👥</span>
          <div class="overview-content">
            <span class="overview-value">{{ marketStats.totalTraders }}</span>
            <span class="overview-label">Active Traders</span>
          </div>
        </div>
        <div class="overview-card">
          <span class="overview-icon">🔥</span>
          <div class="overview-content">
            <span class="overview-value">{{ marketStats.totalTrades }}</span>
            <span class="overview-label">24h Trades</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const serverIp = authStore.server_ip

// 状态
const loading = ref(false)
const activeTab = ref('hot')
const selectedTimeRange = ref('24h')
const leaderboardData = ref([])
const marketStats = ref({
  totalVolume: 0,
  totalMemes: 0,
  totalTraders: 0,
  totalTrades: 0
})

// 配置
const tabs = [
  { id: 'hot', label: 'Hot', icon: '🔥' },
  { id: 'gainers', label: 'Top Gainers', icon: '📈' },
  { id: 'losers', label: 'Top Losers', icon: '📉' },
  { id: 'volume', label: 'Volume', icon: '💎' },
  { id: 'new', label: 'New', icon: '✨' }
]

const timeRanges = [
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' }
]

// 获取排行榜数据
const fetchLeaderboard = async () => {
  loading.value = true
  try {
    const res = await fetch(
      `${serverIp}/api/leaderboard?type=${activeTab.value}&timeRange=${selectedTimeRange.value}`
    )
    const data = await res.json()
    if (res.ok && data.code === 0) {
      leaderboardData.value = data.data.list || []
      marketStats.value = data.data.stats || marketStats.value
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化函数
const formatPrice = (price) => {
  if (!price) return '0.000000'
  if (price < 0.000001) return price.toExponential(2)
  if (price < 1) return price.toFixed(6)
  return price.toFixed(2)
}

const formatVolume = (volume) => {
  if (!volume) return '0'
  if (volume >= 1000000) return (volume / 1000000).toFixed(2) + 'M'
  if (volume >= 1000) return (volume / 1000).toFixed(2) + 'K'
  return volume.toFixed(2)
}

const formatMainStat = (item) => {
  switch (activeTab.value) {
    case 'hot':
      return item.hotScore?.toFixed(0) || '0'
    case 'gainers':
    case 'losers':
      const change = item.priceChange || 0
      return (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
    case 'volume':
      return '$' + formatVolume(item.volume24h)
    case 'new':
      return formatTimeAgo(item.createdAt)
    default:
      return ''
  }
}

const getMainStatLabel = () => {
  switch (activeTab.value) {
    case 'hot': return 'Heat Index'
    case 'gainers':
    case 'losers': return 'Price Change'
    case 'volume': return 'Volume'
    case 'new': return 'Created'
    default: return ''
  }
}

const getValueClass = (item) => {
  if (activeTab.value === 'gainers' || activeTab.value === 'losers') {
    return item.priceChange >= 0 ? 'positive' : 'negative'
  }
  return ''
}

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${serverIp}${url.startsWith('/') ? '' : '/'}${url}`
}

const goToMeme = (id) => {
  router.push(`/meme/${id}`)
}

// 监听标签和时间范围变化
watch([activeTab, selectedTimeRange], () => {
  fetchLeaderboard()
})

onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.leaderboard-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700, #ff6b35, #ff3b69);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.subtitle {
  color: #888;
  font-size: 16px;
}

/* 时间范围选择 */
.time-filter {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.time-btn {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.time-btn.active {
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

/* 标签容器 */
.tabs-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 10px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px;
  border-radius: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.3), rgba(46, 196, 182, 0.3));
  color: #fff;
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
}

.refresh-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #888;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(127, 90, 240, 0.2);
  border-top-color: #7f5af0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 前三名卡片 */
.top-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.top-card {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.top-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.top-card.rank-1::before {
  background: linear-gradient(90deg, #ffd700, #ffaa00);
}

.top-card.rank-2::before {
  background: linear-gradient(90deg, #c0c0c0, #a0a0a0);
}

.top-card.rank-3::before {
  background: linear-gradient(90deg, #cd7f32, #b87333);
}

.top-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(127, 90, 240, 0.2);
  border-color: rgba(127, 90, 240, 0.3);
}

.rank-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
}

.rank-1 .rank-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #000;
}

.rank-2 .rank-badge {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #000;
}

.rank-3 .rank-badge {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.meme-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
}

.meme-info {
  margin-bottom: 16px;
}

.meme-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meme-ticker {
  font-size: 13px;
  color: #7f5af0;
  font-weight: 500;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.stat-value.positive {
  color: #00d084;
}

.stat-value.negative {
  color: #ff3b69;
}

.stat-label {
  font-size: 11px;
  color: #888;
}

.main-stat .stat-value {
  font-size: 20px;
}

/* 排名列表 */
.rank-list {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.list-item {
  display: grid;
  grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr;
  padding: 14px 20px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: rgba(127, 90, 240, 0.05);
}

.col.rank {
  font-weight: 600;
  color: #888;
}

.col.meme {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.meme-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meme-text .name {
  font-weight: 600;
  font-size: 14px;
}

.meme-text .ticker {
  font-size: 12px;
  color: #7f5af0;
}

.col.price {
  font-weight: 600;
}

.col.change {
  font-weight: 600;
}

.col.change.positive {
  color: #00d084;
}

.col.change.negative {
  color: #ff3b69;
}

.col.volume,
.col.holders {
  color: #888;
}

/* 市场概览 */
.market-overview {
  margin-top: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(46, 196, 182, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 12px;
}

.overview-icon {
  font-size: 32px;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.overview-label {
  font-size: 13px;
  color: #888;
}

/* 响应式 */
@media (max-width: 1200px) {
  .top-three {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }

  .list-header,
  .list-item {
    grid-template-columns: 40px 1.5fr 1fr 1fr;
  }

  .col.volume,
  .col.holders {
    display: none;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>

