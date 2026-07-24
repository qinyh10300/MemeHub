<template>
  <div class="compare-page">
    <header class="page-header">
      <h1 class="title">📊 Meme Comparison</h1>
      <p class="subtitle">Compare across dimensions to spot opportunities</p>
    </header>

    <!-- 选择对比模因 -->
    <div class="selector-section">
      <div class="selector-grid">
        <div
          v-for="(slot, index) in compareSlots"
          :key="index"
          :class="['selector-slot', { filled: slot.meme, active: activeSlot === index }]"
          @click="openSelector(index)"
        >
          <template v-if="slot.meme">
            <img :src="getImageUrl(slot.meme.imageUrl)" :alt="slot.meme.title" class="slot-image" />
            <div class="slot-info">
              <span class="slot-ticker">${{ slot.meme.ticker }}</span>
              <span class="slot-title">{{ slot.meme.title }}</span>
            </div>
            <button class="remove-btn" @click.stop="removeSlot(index)">×</button>
          </template>
          <template v-else>
            <span class="add-icon">+</span>
            <span class="add-text">Add Meme</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 模因选择弹窗 -->
    <div v-if="showSelector" class="selector-modal" @click.self="showSelector = false">
      <div class="selector-content">
        <div class="selector-header">
          <h3>Select Meme</h3>
          <button class="close-btn" @click="showSelector = false">×</button>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search meme name or ticker..."
            class="search-input"
          />
          <span v-if="searching" class="search-loading">⏳</span>
        </div>
        <div class="meme-list">
          <!-- 加载中 -->
          <div v-if="searching" class="search-status">
            <span class="loading-spinner">⏳</span>
            <span>Searching...</span>
          </div>
          <!-- 无结果 -->
          <div v-else-if="availableMemes.length === 0" class="search-status">
            <span class="empty-icon">📭</span>
            <span>{{ searchQuery ? 'No related memes found' : 'Enter a keyword to search' }}</span>
          </div>
          <!-- 结果列表 -->
          <div
            v-else
            v-for="meme in filteredMemes"
            :key="meme.id"
            class="meme-option"
            @click="selectMeme(meme)"
          >
            <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="option-image" />
            <div class="option-info">
              <span class="option-ticker">${{ meme.ticker }}</span>
              <span class="option-title">{{ meme.title }}</span>
            </div>
            <span class="option-price">${{ (meme.price || 0).toFixed(6) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比内容 -->
    <div v-if="hasComparison" class="compare-content">
      <!-- 价格走势对比 -->
      <div class="chart-section">
        <div class="section-header">
          <h2 class="section-title">📈 Price Trend Comparison</h2>
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
            <canvas ref="priceChartCanvas"></canvas>
          </div>
          <div class="chart-legend">
            <div
              v-for="(slot, index) in filledSlots"
              :key="index"
              class="legend-item"
            >
              <span class="legend-color" :style="{ background: chartColors[index] }"></span>
              <span class="legend-ticker">${{ slot.meme.ticker }}</span>
              <span class="legend-change" :class="(slot.meme.priceChange || 0) >= 0 ? 'positive' : 'negative'">
                {{ (slot.meme.priceChange || 0) >= 0 ? '+' : '' }}{{ (slot.meme.priceChange || 0).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 关键指标对比表 -->
      <div class="metrics-section">
        <h2 class="section-title">📋 Key Metrics Comparison</h2>
        <div class="metrics-table">
          <div class="table-header">
            <div class="table-cell metric-name">Metric</div>
            <div
              v-for="(slot, index) in filledSlots"
              :key="index"
              class="table-cell"
              :style="{ borderTopColor: chartColors[index] }"
            >
              <img :src="getImageUrl(slot.meme.imageUrl)" class="header-image" />
              <span>${{ slot.meme.ticker }}</span>
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Current Price</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              ${{ (slot.meme.price || 0).toFixed(6) }}
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">24h Change</div>
            <div
              v-for="(slot, index) in filledSlots"
              :key="index"
              class="table-cell"
              :class="(slot.meme.priceChange || 0) >= 0 ? 'positive' : 'negative'"
            >
              {{ (slot.meme.priceChange || 0) >= 0 ? '+' : '' }}{{ (slot.meme.priceChange || 0).toFixed(2) }}%
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">24h Volume</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              ${{ formatVolume(slot.meme.volume24h) }}
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Holders</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              {{ slot.meme.holders }}
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Market Cap</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              ${{ formatVolume(slot.meme.marketCap) }}
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Heat Index</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              <div class="heat-bar">
                <div class="heat-fill" :style="{ width: `${slot.meme.hotScore}%` }"></div>
              </div>
              <span class="heat-value">{{ slot.meme.hotScore }}</span>
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Community Activity</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              <div class="stars">
                <span v-for="i in 5" :key="i" :class="['star', { filled: i <= slot.meme.communityScore }]">★</span>
              </div>
            </div>
          </div>
          <div class="table-row">
            <div class="table-cell metric-name">Created At</div>
            <div v-for="(slot, index) in filledSlots" :key="index" class="table-cell">
              {{ formatDate(slot.meme.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 雷达图对比 -->
      <div class="radar-section">
        <h2 class="section-title">🎯 Overall Score Comparison</h2>
        <div class="radar-container">
          <div class="radar-chart">
            <canvas ref="radarChartCanvas"></canvas>
          </div>
          <div class="radar-scores">
            <div
              v-for="(slot, index) in filledSlots"
              :key="index"
              class="score-card"
              :style="{ borderLeftColor: chartColors[index] }"
            >
              <div class="score-header">
                <img :src="getImageUrl(slot.meme.imageUrl)" class="score-image" />
                <span class="score-ticker">${{ slot.meme.ticker }}</span>
              </div>
              <div class="score-value">{{ calculateOverallScore(slot.meme) }}</div>
              <div class="score-label">Overall Score</div>
              <div class="score-breakdown">
                <div class="breakdown-item">
                  <span class="breakdown-label">Liquidity</span>
                  <span class="breakdown-value">{{ slot.meme.liquidityScore }}/100</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">Growth Potential</span>
                  <span class="breakdown-value">{{ slot.meme.growthScore }}/100</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">Community Buzz</span>
                  <span class="breakdown-value">{{ slot.meme.communityScore * 20 }}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 分析建议 -->
      <div class="ai-section">
        <h2 class="section-title">🤖 AI Insights</h2>
        <div class="ai-content">
          <div class="ai-summary">
            <p>Based on current data, here is a summary of the selected meme coins:</p>
          </div>
          <div class="ai-cards">
            <div
              v-for="(slot, index) in filledSlots"
              :key="index"
              class="ai-card"
            >
              <div class="ai-header">
                <img :src="getImageUrl(slot.meme.imageUrl)" class="ai-image" />
                <span class="ai-ticker">${{ slot.meme.ticker }}</span>
                <span :class="['ai-rating', getAIRating(slot.meme).class]">
                  {{ getAIRating(slot.meme).text }}
                </span>
              </div>
              <div class="ai-analysis">
                <p class="ai-text">{{ getAIAnalysis(slot.meme) }}</p>
              </div>
              <div class="ai-tags">
                <span v-for="tag in getAITags(slot.meme)" :key="tag" class="ai-tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon">📊</span>
      <h3>Start Comparing</h3>
      <p>Select 2–4 meme coins to compare across dimensions</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const serverIp = authStore.server_ip

// 对比槽位
const compareSlots = ref([
  { meme: null },
  { meme: null },
  { meme: null },
  { meme: null }
])

// 选择器状态
const showSelector = ref(false)
const activeSlot = ref(0)
const searchQuery = ref('')
const loading = ref(false)
const searching = ref(false)
const searchTimer = ref(null)

// 可选模因列表
const availableMemes = ref([])

// 时间范围
const selectedTimeRange = ref('7d')
const timeRanges = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' }
]

// 图表颜色
const chartColors = ['#7f5af0', '#00d084', '#ff6b35', '#ffd700']

// 图表引用
const priceChartCanvas = ref(null)
const radarChartCanvas = ref(null)

// 计算属性
const filteredMemes = computed(() => {
  if (!searchQuery.value) return availableMemes.value
  const query = searchQuery.value.toLowerCase()
  return availableMemes.value.filter(m =>
    m.ticker?.toLowerCase().includes(query) ||
    m.title?.toLowerCase().includes(query)
  )
})

const filledSlots = computed(() => compareSlots.value.filter(s => s.meme))

const hasComparison = computed(() => filledSlots.value.length >= 2)

// 从API搜索模因
const searchMemes = async () => {
  searching.value = true
  try {
    const query = encodeURIComponent(searchQuery.value || '')
    const response = await fetch(`${serverIp}/api/memes/search-for-compare?q=${query}`)
    const data = await response.json()
    if (data.code === 0) {
      availableMemes.value = (data.data || []).map(m => ({
        id: m.id,
        ticker: m.ticker,
        title: m.title,
        imageUrl: m.imageUrl,
        price: m.price || 0,
        priceChange: 0,
        volume24h: 0,
        holders: 0,
        marketCap: 0,
        hotScore: 50,
        communityScore: 3,
        liquidityScore: 50,
        growthScore: 50,
        createdAt: null
      }))
    }
  } catch (error) {
    console.error('Failed to search memes:', error)
    availableMemes.value = []
  } finally {
    searching.value = false
  }
}

// 防抖搜索
const debouncedSearch = () => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  searchTimer.value = setTimeout(() => {
    searchMemes()
  }, 300)
}

// 获取详细对比数据
const fetchCompareData = async () => {
  const selectedIds = filledSlots.value.map(s => s.meme.id).filter(Boolean)
  if (selectedIds.length < 2) return

  loading.value = true
  try {
    const response = await fetch(`${serverIp}/api/memes/compare?ids=${selectedIds.join(',')}`)
    const data = await response.json()
    if (data.code === 0 && data.data) {
      // 更新槽位中的模因数据
      data.data.forEach(memeData => {
        const slotIndex = compareSlots.value.findIndex(s => s.meme?.id === memeData.id)
        if (slotIndex !== -1) {
          compareSlots.value[slotIndex].meme = {
            ...compareSlots.value[slotIndex].meme,
            id: memeData.id,
            ticker: memeData.ticker,
            title: memeData.title,
            imageUrl: memeData.imageUrl,
            price: memeData.metrics?.price || 0,
            priceChange: memeData.metrics?.change24h || 0,
            volume24h: memeData.metrics?.volume24h || 0,
            holders: memeData.metrics?.holders || 0,
            marketCap: memeData.metrics?.marketCap || 0,
            hotScore: Math.min(100, Math.round((memeData.metrics?.volume24h || 0) / 100)),
            communityScore: Math.min(5, Math.ceil((memeData.metrics?.likes || 0) / 20)),
            liquidityScore: Math.min(100, Math.round((memeData.metrics?.volume24h || 0) / 500)),
            growthScore: memeData.metrics?.change24h > 0 ? Math.min(100, 50 + memeData.metrics.change24h) : Math.max(0, 50 + memeData.metrics?.change24h || 0),
            createdAt: memeData.createdAt,
            sparkline: memeData.sparkline || []
          }
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch comparison data:', error)
  } finally {
    loading.value = false
  }
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${serverIp}${url.startsWith('/') ? '' : '/'}${url}`
}

// 方法
const openSelector = (index) => {
  activeSlot.value = index
  showSelector.value = true
  searchQuery.value = ''
  searchMemes()
}

const selectMeme = async (meme) => {
  compareSlots.value[activeSlot.value].meme = meme
  showSelector.value = false

  // 选择后立即获取详细对比数据
  if (filledSlots.value.length >= 2) {
    await fetchCompareData()
  }
}

const removeSlot = (index) => {
  compareSlots.value[index].meme = null
}

const formatVolume = (volume) => {
  if (!volume) return '0'
  if (volume >= 1000000) return (volume / 1000000).toFixed(2) + 'M'
  if (volume >= 1000) return (volume / 1000).toFixed(2) + 'K'
  return volume.toFixed(2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US')
}

const calculateOverallScore = (meme) => {
  if (!meme) return 0
  const liquidityWeight = 0.3
  const growthWeight = 0.4
  const communityWeight = 0.3

  const score = (
    (meme.liquidityScore || 50) * liquidityWeight +
    (meme.growthScore || 50) * growthWeight +
    ((meme.communityScore || 3) * 20) * communityWeight
  )

  return Math.round(score)
}

const getAIRating = (meme) => {
  const score = calculateOverallScore(meme)
  if (score >= 80) return { text: 'Strong Buy', class: 'excellent' }
  if (score >= 60) return { text: 'Worth Watching', class: 'good' }
  if (score >= 40) return { text: 'Cautious', class: 'neutral' }
  return { text: 'High Risk', class: 'risky' }
}

const getAIAnalysis = (meme) => {
  if (!meme) return ''
  const score = calculateOverallScore(meme)
  if (score >= 80) {
    return `${meme.ticker} shows strong market performance, high trading activity, and solid community engagement. Consider a measured allocation.`
  }
  if (score >= 60) {
    return `${meme.ticker} performs well overall with room to improve. Keep an eye on its progress.`
  }
  if (score >= 40) {
    return `${meme.ticker} is in a consolidation phase with neutral sentiment. Consider waiting for a better entry.`
  }
  return `${meme.ticker} carries higher risk, with liquidity and community activity needing improvement. Proceed with caution.`
}

const getAITags = (meme) => {
  if (!meme) return []
  const tags = []
  if ((meme.priceChange || 0) > 10) tags.push('🚀 Strong Uptrend')
  if ((meme.priceChange || 0) < -10) tags.push('📉 Sharp Pullback')
  if ((meme.volume24h || 0) > 100000) tags.push('💎 High Volume')
  if ((meme.holders || 0) > 1000) tags.push('👥 Large Community')
  if ((meme.hotScore || 0) > 80) tags.push('🔥 Hot')
  if ((meme.communityScore || 0) >= 4) tags.push('⭐ High Rating')
  if (tags.length === 0) tags.push('📊 Stable Growth')
  return tags.slice(0, 3)
}

// 监听搜索词变化（防抖）
watch(searchQuery, () => {
  debouncedSearch()
})

// 初始化
onMounted(async () => {
  await searchMemes()
})
</script>

<style scoped>
.compare-page {
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
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
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
  margin-bottom: 20px;
}

/* 选择器区域 */
.selector-section {
  margin-bottom: 30px;
}

.selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.selector-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 140px;
}

.selector-slot:hover {
  border-color: rgba(127, 90, 240, 0.4);
  background: rgba(127, 90, 240, 0.05);
}

.selector-slot.filled {
  border-style: solid;
  border-color: rgba(127, 90, 240, 0.3);
  background: rgba(127, 90, 240, 0.08);
}

.slot-image {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
}

.slot-info {
  text-align: center;
}

.slot-ticker {
  display: block;
  font-weight: 700;
  font-size: 16px;
  color: #7f5af0;
}

.slot-title {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 59, 105, 0.2);
  border: none;
  border-radius: 50%;
  color: #ff3b69;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ff3b69;
  color: #fff;
}

.add-icon {
  font-size: 32px;
  color: #555;
}

.add-text {
  font-size: 14px;
  color: #666;
}

/* 选择器弹窗 */
.selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.selector-content {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.selector-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #888;
  font-size: 20px;
  cursor: pointer;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  padding: 14px 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
}

.search-loading {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.search-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #666;
}

.loading-spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 32px;
}

.meme-list {
  max-height: 400px;
  overflow-y: auto;
}

.meme-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.meme-option:hover {
  background: rgba(127, 90, 240, 0.1);
}

.option-image {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
}

.option-info {
  flex: 1;
}

.option-ticker {
  display: block;
  font-weight: 600;
  color: #7f5af0;
}

.option-title {
  display: block;
  font-size: 12px;
  color: #888;
}

.option-price {
  font-weight: 600;
  color: #00d084;
}

/* 图表区域 */
.chart-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  background: #7f5af0;
  border-color: #7f5af0;
  color: #fff;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-placeholder {
  height: 300px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-ticker {
  font-weight: 600;
}

.legend-change {
  font-size: 13px;
}

.legend-change.positive {
  color: #00d084;
}

.legend-change.negative {
  color: #ff3b69;
}

/* 指标表格 */
.metrics-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.metrics-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 150px repeat(4, 1fr);
  gap: 1px;
}

.table-header {
  margin-bottom: 2px;
}

.table-header .table-cell {
  background: rgba(127, 90, 240, 0.1);
  border-top: 3px solid transparent;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.header-image {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.table-row .table-cell {
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-cell.metric-name {
  color: #888;
  font-weight: 500;
}

.table-cell.positive {
  color: #00d084;
}

.table-cell.negative {
  color: #ff3b69;
}

.heat-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.heat-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b35, #ffd700);
  border-radius: 4px;
}

.heat-value {
  font-size: 12px;
  color: #888;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #333;
  font-size: 14px;
}

.star.filled {
  color: #ffd700;
}

/* 雷达图区域 */
.radar-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.radar-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.radar-chart {
  height: 300px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid;
  border-radius: 10px;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.score-image {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.score-ticker {
  font-weight: 600;
  color: #7f5af0;
}

.score-value {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.breakdown-label {
  color: #888;
}

.breakdown-value {
  color: #fff;
}

/* AI 分析 */
.ai-section {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(46, 196, 182, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.ai-summary {
  margin-bottom: 20px;
  color: #888;
}

.ai-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.ai-card {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.ai-image {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.ai-ticker {
  flex: 1;
  font-weight: 600;
  color: #7f5af0;
}

.ai-rating {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.ai-rating.excellent {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.ai-rating.good {
  background: rgba(127, 90, 240, 0.2);
  color: #7f5af0;
}

.ai-rating.neutral {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.ai-rating.risky {
  background: rgba(255, 59, 105, 0.2);
  color: #ff3b69;
}

.ai-text {
  font-size: 13px;
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 12px;
}

.ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 11px;
  color: #888;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #888;
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .selector-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .radar-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .selector-grid {
    grid-template-columns: 1fr 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 100px repeat(4, 1fr);
    font-size: 12px;
  }
}
</style>

