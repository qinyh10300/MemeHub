<template>
  <div class="creator-dashboard">
    <header class="page-header">
      <h1 class="title">📊 Creator Dashboard</h1>
      <p class="subtitle">Understand your meme performance and earnings at a glance</p>
    </header>

    <!-- 核心指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card primary">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <span class="metric-value">${{ formatNumber(totalEarnings) }}</span>
          <span class="metric-label">Total Earnings (USDT)</span>
          <span class="metric-change positive">+{{ earningsChange }}% this month</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <span class="metric-value">{{ totalMemes }}</span>
          <span class="metric-label">Memes Created</span>
          <span class="metric-change">{{ approvedMemes }} approved</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <span class="metric-value">{{ formatNumber(totalHolders) }}</span>
          <span class="metric-label">Total Holders</span>
          <span class="metric-change positive">+{{ holdersChange }}% this week</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">💎</div>
        <div class="metric-content">
          <span class="metric-value">${{ formatNumber(totalVolume) }}</span>
          <span class="metric-label">Total Volume</span>
          <span class="metric-change">Past 30 days</span>
        </div>
      </div>
    </div>

    <!-- 收益图表 -->
    <div class="chart-section">
      <div class="section-header">
        <h2 class="section-title">💵 Earnings Trend</h2>
        <div class="time-selector">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            :class="['time-btn', { active: selectedTimeRange === range.value }]"
            @click="selectedTimeRange = range.value"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="mock-chart">
            <div
              v-for="(bar, index) in mockChartData"
              :key="index"
              class="chart-bar"
              :style="{ height: `${bar.value}%` }"
            >
              <span class="bar-label">{{ bar.label }}</span>
            </div>
          </div>
        </div>
        <div class="chart-summary">
          <div class="summary-item">
            <span class="summary-label">Period Earnings</span>
            <span class="summary-value positive">${{ formatNumber(periodEarnings) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Period Change</span>
            <span class="summary-value" :class="periodChange >= 0 ? 'positive' : 'negative'">
              {{ periodChange >= 0 ? '+' : '' }}{{ periodChange }}%
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Daily Average</span>
            <span class="summary-value">${{ formatNumber(dailyAverage) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模因表现排名 -->
    <div class="memes-section">
      <div class="section-header">
        <h2 class="section-title">🏆 My Meme Performance</h2>
        <select v-model="memeSort" class="sort-select">
          <option value="earnings">Sort by earnings</option>
          <option value="volume">Sort by volume</option>
          <option value="holders">Sort by holders</option>
          <option value="price">Sort by price</option>
        </select>
      </div>
      <div class="memes-list">
        <div v-for="(meme, index) in sortedMemes" :key="meme.id" class="meme-row">
          <div class="meme-rank">{{ index + 1 }}</div>
          <img :src="meme.imageUrl" :alt="meme.title" class="meme-image" />
          <div class="meme-info">
            <h3 class="meme-title">{{ meme.title }}</h3>
            <span class="meme-ticker">${{ meme.ticker }}</span>
          </div>
          <div class="meme-stats">
            <div class="stat-col">
              <span class="stat-value">${{ formatPrice(meme.price) }}</span>
              <span class="stat-label">Current Price</span>
            </div>
            <div class="stat-col">
              <span class="stat-value" :class="meme.priceChange >= 0 ? 'positive' : 'negative'">
                {{ meme.priceChange >= 0 ? '+' : '' }}{{ meme.priceChange }}%
              </span>
              <span class="stat-label">24h Change</span>
            </div>
            <div class="stat-col">
              <span class="stat-value">{{ meme.holders }}</span>
              <span class="stat-label">Holders</span>
            </div>
            <div class="stat-col">
              <span class="stat-value">${{ formatNumber(meme.volume) }}</span>
              <span class="stat-label">Volume</span>
            </div>
            <div class="stat-col highlight">
              <span class="stat-value">${{ formatNumber(meme.earnings) }}</span>
              <span class="stat-label">My Earnings</span>
            </div>
          </div>
          <button class="detail-btn" @click="goToMeme(meme.id)">View Details</button>
        </div>
      </div>
    </div>

    <!-- 粉丝分析 -->
    <div class="fans-section">
      <div class="section-header">
        <h2 class="section-title">👥 Follower Analytics</h2>
      </div>
      <div class="fans-grid">
        <div class="fans-card">
          <h3 class="card-title">Follower Growth</h3>
          <div class="fans-stats">
            <div class="fans-stat">
              <span class="fans-value">{{ totalFollowers }}</span>
              <span class="fans-label">Total Followers</span>
            </div>
            <div class="fans-stat">
              <span class="fans-value positive">+{{ newFollowers }}</span>
              <span class="fans-label">New This Week</span>
            </div>
            <div class="fans-stat">
              <span class="fans-value negative">-{{ unfollowers }}</span>
              <span class="fans-label">Unfollows This Week</span>
            </div>
          </div>
          <div class="fans-chart">
            <div
              v-for="(day, index) in fansGrowthData"
              :key="index"
              class="growth-bar"
              :class="{ negative: day.value < 0 }"
              :style="{ height: `${Math.abs(day.value) * 3}px` }"
            >
              <span class="growth-label">{{ day.label }}</span>
            </div>
          </div>
        </div>
        <div class="fans-card">
          <h3 class="card-title">Follower Activity</h3>
          <div class="activity-list">
            <div class="activity-item">
              <span class="activity-label">Highly Active</span>
              <div class="activity-bar">
                <div class="activity-fill high" :style="{ width: `${highActivity}%` }"></div>
              </div>
              <span class="activity-value">{{ highActivity }}%</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Moderately Active</span>
              <div class="activity-bar">
                <div class="activity-fill medium" :style="{ width: `${mediumActivity}%` }"></div>
              </div>
              <span class="activity-value">{{ mediumActivity }}%</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Low Activity</span>
              <div class="activity-bar">
                <div class="activity-fill low" :style="{ width: `${lowActivity}%` }"></div>
              </div>
              <span class="activity-value">{{ lowActivity }}%</span>
            </div>
          </div>
        </div>
        <div class="fans-card">
          <h3 class="card-title">Follower Engagement</h3>
          <div class="interaction-stats">
            <div class="interaction-item">
              <span class="interaction-icon">❤️</span>
              <span class="interaction-value">{{ totalLikes }}</span>
              <span class="interaction-label">Likes</span>
            </div>
            <div class="interaction-item">
              <span class="interaction-icon">💬</span>
              <span class="interaction-value">{{ totalComments }}</span>
              <span class="interaction-label">Comments</span>
            </div>
            <div class="interaction-item">
              <span class="interaction-icon">⭐</span>
              <span class="interaction-value">{{ totalFavorites }}</span>
              <span class="interaction-label">Favorites</span>
            </div>
            <div class="interaction-item">
              <span class="interaction-icon">🔄</span>
              <span class="interaction-value">{{ totalShares }}</span>
              <span class="interaction-label">Shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 收益明细 -->
    <div class="earnings-section">
      <div class="section-header">
        <h2 class="section-title">📝 Earnings Details</h2>
        <button class="export-btn">Export Report</button>
      </div>
      <div class="earnings-table">
        <div class="table-header">
          <span class="col">Time</span>
          <span class="col">Type</span>
          <span class="col">Meme</span>
          <span class="col">Amount</span>
          <span class="col">Status</span>
        </div>
        <div v-for="record in earningsRecords" :key="record.id" class="table-row">
          <span class="col">{{ formatDate(record.time) }}</span>
          <span class="col">
            <span :class="['type-badge', record.type]">{{ getTypeText(record.type) }}</span>
          </span>
          <span class="col">${{ record.ticker }}</span>
          <span class="col" :class="record.amount >= 0 ? 'positive' : 'negative'">
            {{ record.amount >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(record.amount)) }}
          </span>
          <span class="col">
            <span :class="['status-badge', record.status]">{{ getStatusText(record.status) }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 核心指标
const totalEarnings = ref(12580.45)
const earningsChange = ref(23.5)
const totalMemes = ref(8)
const approvedMemes = ref(6)
const totalHolders = ref(3250)
const holdersChange = ref(12.3)
const totalVolume = ref(85600)

// 时间选择
const selectedTimeRange = ref('30d')
const timeRanges = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' }
]

// 收益数据
const periodEarnings = ref(3250.80)
const periodChange = ref(18.5)
const dailyAverage = ref(108.36)

// 模拟图表数据
const mockChartData = ref([
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 62 },
  { label: 'Wed', value: 38 },
  { label: 'Thu', value: 75 },
  { label: 'Fri', value: 88 },
  { label: 'Sat', value: 52 },
  { label: 'Sun', value: 68 }
])

// 模因数据
const memeSort = ref('earnings')
const myMemes = ref([])

// 粉丝数据
const totalFollowers = ref(1580)
const newFollowers = ref(125)
const unfollowers = ref(23)
const highActivity = ref(35)
const mediumActivity = ref(45)
const lowActivity = ref(20)
const totalLikes = ref(8520)
const totalComments = ref(1250)
const totalFavorites = ref(3200)
const totalShares = ref(680)

const fansGrowthData = ref([
  { label: 'Mon', value: 15 },
  { label: 'Tue', value: 22 },
  { label: 'Wed', value: -5 },
  { label: 'Thu', value: 18 },
  { label: 'Fri', value: 32 },
  { label: 'Sat', value: 28 },
  { label: 'Sun', value: 15 }
])

// 收益记录
const earningsRecords = ref([])

// 计算属性
const sortedMemes = computed(() => {
  const memes = [...myMemes.value]
  switch (memeSort.value) {
    case 'earnings':
      return memes.sort((a, b) => b.earnings - a.earnings)
    case 'volume':
      return memes.sort((a, b) => b.volume - a.volume)
    case 'holders':
      return memes.sort((a, b) => b.holders - a.holders)
    case 'price':
      return memes.sort((a, b) => b.price - a.price)
    default:
      return memes
  }
})

// 方法
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatPrice = (price) => {
  if (price < 0.000001) return price.toExponential(2)
  if (price < 1) return price.toFixed(6)
  return price.toFixed(2)
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeText = (type) => {
  const map = {
    trade: 'Trading Revenue Share',
    creation: 'Creation Reward',
    airdrop: 'Airdrop',
    referral: 'Referral Bonus'
  }
  return map[type] || type
}

const getStatusText = (status) => {
  const map = {
    completed: 'Completed',
    pending: 'Processing',
    failed: 'Failed'
  }
  return map[status] || status
}

const goToMeme = (id) => {
  router.push(`/meme/${id}`)
}

// 初始化数据
const initData = () => {
  myMemes.value = [
    {
      id: '1',
      title: 'Doge to the Moon',
      ticker: 'DOGE',
      imageUrl: 'https://i.pravatar.cc/100?img=1',
      price: 0.000256,
      priceChange: 15.8,
      holders: 1250,
      volume: 32500,
      earnings: 4580.25
    },
    {
      id: '2',
      title: 'Pepe Classic',
      ticker: 'PEPE',
      imageUrl: 'https://i.pravatar.cc/100?img=2',
      price: 0.000089,
      priceChange: -3.2,
      holders: 850,
      volume: 18200,
      earnings: 2350.80
    },
    {
      id: '3',
      title: 'Wojak Feels',
      ticker: 'WOJAK',
      imageUrl: 'https://i.pravatar.cc/100?img=3',
      price: 0.000045,
      priceChange: 8.5,
      holders: 420,
      volume: 8500,
      earnings: 1250.40
    },
    {
      id: '4',
      title: 'Chad Energy',
      ticker: 'CHAD',
      imageUrl: 'https://i.pravatar.cc/100?img=4',
      price: 0.000123,
      priceChange: 22.3,
      holders: 680,
      volume: 15800,
      earnings: 3150.00
    }
  ]

  earningsRecords.value = [
    { id: 1, time: '2024-03-03T14:30:00Z', type: 'trade', ticker: 'DOGE', amount: 125.50, status: 'completed' },
    { id: 2, time: '2024-03-03T10:15:00Z', type: 'creation', ticker: 'PEPE', amount: 50.00, status: 'completed' },
    { id: 3, time: '2024-03-02T18:45:00Z', type: 'trade', ticker: 'CHAD', amount: 88.25, status: 'completed' },
    { id: 4, time: '2024-03-02T09:00:00Z', type: 'referral', ticker: '-', amount: 25.00, status: 'pending' },
    { id: 5, time: '2024-03-01T16:20:00Z', type: 'trade', ticker: 'WOJAK', amount: 45.80, status: 'completed' }
  ]
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.creator-dashboard {
  max-width: 1300px;
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
  background: linear-gradient(135deg, #00d084, #7f5af0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.subtitle {
  color: #888;
  font-size: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 核心指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.metric-card.primary {
  background: linear-gradient(135deg, rgba(0, 208, 132, 0.15), rgba(127, 90, 240, 0.1));
  border-color: rgba(0, 208, 132, 0.3);
}

.metric-icon {
  font-size: 36px;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
}

.metric-label {
  font-size: 13px;
  color: #888;
}

.metric-change {
  font-size: 12px;
  color: #888;
}

.metric-change.positive {
  color: #00d084;
}

.metric-change.negative {
  color: #ff3b69;
}

/* 图表区域 */
.chart-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
}

.time-selector {
  display: flex;
  gap: 8px;
}

.time-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  color: #fff;
}

.time-btn.active {
  background: #00d084;
  border-color: #00d084;
  color: #000;
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 24px;
}

.chart-placeholder {
  height: 250px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.mock-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  gap: 12px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #00d084, rgba(0, 208, 132, 0.3));
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 20px;
  transition: height 0.3s;
}

.bar-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #666;
}

.chart-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 13px;
  color: #888;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
}

.summary-value.positive {
  color: #00d084;
}

.summary-value.negative {
  color: #ff3b69;
}

/* 模因列表 */
.memes-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
}

.sort-select {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.memes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meme-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.2s;
}

.meme-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.meme-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(127, 90, 240, 0.2);
  border-radius: 8px;
  font-weight: 700;
  color: #7f5af0;
}

.meme-image {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
}

.meme-info {
  min-width: 150px;
}

.meme-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
}

.meme-ticker {
  font-size: 13px;
  color: #7f5af0;
}

.meme-stats {
  flex: 1;
  display: flex;
  gap: 24px;
}

.stat-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}

.stat-col.highlight {
  padding: 8px 12px;
  background: rgba(0, 208, 132, 0.1);
  border-radius: 8px;
}

.stat-col .stat-value {
  font-size: 15px;
  font-weight: 600;
}

.stat-col .stat-value.positive {
  color: #00d084;
}

.stat-col .stat-value.negative {
  color: #ff3b69;
}

.stat-col .stat-label {
  font-size: 11px;
  color: #888;
}

.detail-btn {
  padding: 8px 16px;
  background: rgba(127, 90, 240, 0.2);
  border: 1px solid rgba(127, 90, 240, 0.3);
  border-radius: 8px;
  color: #7f5af0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: #7f5af0;
  color: #fff;
}

/* 粉丝分析 */
.fans-section {
  margin-bottom: 30px;
}

.fans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.fans-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.fans-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.fans-stat {
  text-align: center;
}

.fans-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.fans-value.positive {
  color: #00d084;
}

.fans-value.negative {
  color: #ff3b69;
}

.fans-label {
  font-size: 12px;
  color: #888;
}

.fans-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 80px;
  gap: 8px;
}

.growth-bar {
  flex: 1;
  background: linear-gradient(180deg, #00d084, rgba(0, 208, 132, 0.3));
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 4px;
}

.growth-bar.negative {
  background: linear-gradient(180deg, #ff3b69, rgba(255, 59, 105, 0.3));
}

.growth-label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-label {
  width: 80px;
  font-size: 12px;
  color: #888;
}

.activity-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.activity-fill {
  height: 100%;
  border-radius: 4px;
}

.activity-fill.high {
  background: #00d084;
}

.activity-fill.medium {
  background: #ffd700;
}

.activity-fill.low {
  background: #ff6b35;
}

.activity-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #888;
}

.interaction-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.interaction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.interaction-icon {
  font-size: 20px;
}

.interaction-value {
  font-size: 18px;
  font-weight: 700;
}

.interaction-label {
  font-size: 11px;
  color: #888;
}

/* 收益明细 */
.earnings-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
}

.export-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.earnings-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 150px 120px 100px 120px 100px;
  gap: 16px;
  padding: 12px 16px;
}

.table-header {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 14px;
}

.table-row:last-child {
  border-bottom: none;
}

.col.positive {
  color: #00d084;
}

.col.negative {
  color: #ff3b69;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.trade {
  background: rgba(127, 90, 240, 0.2);
  color: #7f5af0;
}

.type-badge.creation {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.type-badge.airdrop {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.type-badge.referral {
  background: rgba(255, 107, 53, 0.2);
  color: #ff6b35;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.status-badge.completed {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.status-badge.pending {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.status-badge.failed {
  background: rgba(255, 59, 105, 0.2);
  color: #ff3b69;
}

/* 响应式 */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .fans-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .meme-stats {
    display: none;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .table-header .col:nth-child(4),
  .table-header .col:nth-child(5),
  .table-row .col:nth-child(4),
  .table-row .col:nth-child(5) {
    display: none;
  }
}
</style>

