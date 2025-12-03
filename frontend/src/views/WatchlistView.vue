<template>
  <div class="watchlist-page">
    <header class="page-header">
      <h1 class="title">📌 我的自选</h1>
      <p class="subtitle">一站式管理你关注的模因币</p>
    </header>

    <!-- 快捷统计 -->
    <div class="quick-stats">
      <div class="stat-item">
        <span class="stat-value">{{ watchlist.length }}</span>
        <span class="stat-label">关注数量</span>
      </div>
      <div class="stat-item positive">
        <span class="stat-value">{{ gainersCount }}</span>
        <span class="stat-label">今日上涨</span>
      </div>
      <div class="stat-item negative">
        <span class="stat-value">{{ losersCount }}</span>
        <span class="stat-label">今日下跌</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatVolume(totalVolume) }}</span>
        <span class="stat-label">总交易量</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索自选..."
          class="search-input"
        />
      </div>
      <div class="toolbar-actions">
        <select v-model="sortBy" class="sort-select">
          <option value="name">按名称</option>
          <option value="price">按价格</option>
          <option value="change">按涨跌幅</option>
          <option value="volume">按交易量</option>
          <option value="addedAt">按添加时间</option>
        </select>
        <button class="view-btn" @click="toggleViewMode">
          {{ viewMode === 'list' ? '🔲' : '📋' }}
        </button>
        <button class="add-btn" @click="showAddModal = true">
          + 添加
        </button>
      </div>
    </div>

    <!-- 自选列表 - 列表视图 -->
    <div v-if="viewMode === 'list'" class="watchlist-table">
      <div class="table-header">
        <span class="col check"></span>
        <span class="col name">名称</span>
        <span class="col price">价格</span>
        <span class="col change">24h涨跌</span>
        <span class="col volume">24h交易量</span>
        <span class="col holders">持有人</span>
        <span class="col chart">走势</span>
        <span class="col actions">操作</span>
      </div>
      <div v-if="filteredWatchlist.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无自选</p>
        <button class="add-first-btn" @click="showAddModal = true">添加第一个</button>
      </div>
      <div
        v-for="item in filteredWatchlist"
        :key="item.id"
        class="table-row"
        @click="goToMeme(item.id)"
      >
        <span class="col check">
          <input type="checkbox" v-model="selectedItems" :value="item.id" @click.stop />
        </span>
        <div class="col name">
          <img :src="item.imageUrl" :alt="item.title" class="meme-thumb" />
          <div class="meme-info">
            <span class="meme-title">{{ item.title }}</span>
            <span class="meme-ticker">${{ item.ticker }}</span>
          </div>
        </div>
        <span class="col price">${{ formatPrice(item.price) }}</span>
        <span class="col change" :class="item.change >= 0 ? 'positive' : 'negative'">
          {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
        </span>
        <span class="col volume">${{ formatVolume(item.volume) }}</span>
        <span class="col holders">{{ item.holders }}</span>
        <div class="col chart">
          <div class="mini-chart">
            <svg viewBox="0 0 60 20" class="sparkline">
              <polyline
                :points="getSparklinePoints(item.sparkline)"
                :stroke="item.change >= 0 ? '#00d084' : '#ff3b69'"
                fill="none"
                stroke-width="1.5"
              />
            </svg>
          </div>
        </div>
        <div class="col actions" @click.stop>
          <button class="action-btn trade" @click="quickTrade(item)" title="快捷交易">
            💱
          </button>
          <button class="action-btn alert" @click="setAlert(item)" title="设置提醒">
            🔔
          </button>
          <button class="action-btn remove" @click="removeFromWatchlist(item.id)" title="移除">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 自选列表 - 卡片视图 -->
    <div v-if="viewMode === 'grid'" class="watchlist-grid">
      <div v-if="filteredWatchlist.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无自选</p>
        <button class="add-first-btn" @click="showAddModal = true">添加第一个</button>
      </div>
      <div
        v-for="item in filteredWatchlist"
        :key="item.id"
        class="watchlist-card"
        @click="goToMeme(item.id)"
      >
        <div class="card-header">
          <img :src="item.imageUrl" :alt="item.title" class="card-image" />
          <button class="remove-btn" @click.stop="removeFromWatchlist(item.id)">✕</button>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ item.title }}</h3>
          <span class="card-ticker">${{ item.ticker }}</span>
          <div class="card-price">
            <span class="price-value">${{ formatPrice(item.price) }}</span>
            <span class="price-change" :class="item.change >= 0 ? 'positive' : 'negative'">
              {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
            </span>
          </div>
          <div class="card-chart">
            <svg viewBox="0 0 100 30" class="sparkline-large">
              <polyline
                :points="getSparklinePointsLarge(item.sparkline)"
                :stroke="item.change >= 0 ? '#00d084' : '#ff3b69'"
                fill="none"
                stroke-width="2"
              />
            </svg>
          </div>
          <div class="card-actions">
            <button class="card-btn trade" @click.stop="quickTrade(item)">交易</button>
            <button class="card-btn alert" @click.stop="setAlert(item)">提醒</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedItems.length > 0" class="batch-actions">
      <span class="selected-count">已选择 {{ selectedItems.length }} 项</span>
      <button class="batch-btn" @click="batchSetAlert">批量设置提醒</button>
      <button class="batch-btn remove" @click="batchRemove">批量移除</button>
      <button class="batch-btn cancel" @click="selectedItems = []">取消选择</button>
    </div>

    <!-- 添加自选弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加自选</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <input
          v-model="addSearchQuery"
          type="text"
          placeholder="搜索模因名称或代号..."
          class="modal-search"
        />
        <div class="meme-options">
          <div
            v-for="meme in searchResults"
            :key="meme.id"
            class="meme-option"
            @click="addToWatchlist(meme)"
          >
            <img :src="meme.imageUrl" :alt="meme.title" class="option-image" />
            <div class="option-info">
              <span class="option-title">{{ meme.title }}</span>
              <span class="option-ticker">${{ meme.ticker }}</span>
            </div>
            <span class="option-price">${{ formatPrice(meme.price) }}</span>
            <span v-if="isInWatchlist(meme.id)" class="added-badge">已添加</span>
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
const server_ip = authStore.server_ip

// 状态
const watchlist = ref([])
const searchQuery = ref('')
const addSearchQuery = ref('')
const sortBy = ref('addedAt')
const viewMode = ref('list')
const selectedItems = ref([])
const showAddModal = ref(false)
const availableMemes = ref([])
const loading = ref(false)

// 计算属性
const filteredWatchlist = computed(() => {
  let list = [...watchlist.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.ticker?.toLowerCase().includes(query)
    )
  }
  
  // 排序
  switch (sortBy.value) {
    case 'name':
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case 'price':
      list.sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'change':
      list.sort((a, b) => (b.change || 0) - (a.change || 0))
      break
    case 'volume':
      list.sort((a, b) => (b.volume || 0) - (a.volume || 0))
      break
    case 'addedAt':
      list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      break
  }
  
  return list
})

const gainersCount = computed(() => watchlist.value.filter(item => (item.change || 0) > 0).length)
const losersCount = computed(() => watchlist.value.filter(item => (item.change || 0) < 0).length)
const totalVolume = computed(() => watchlist.value.reduce((sum, item) => sum + (item.volume || 0), 0))

const searchResults = computed(() => {
  if (!addSearchQuery.value) return availableMemes.value.slice(0, 10)
  const query = addSearchQuery.value.toLowerCase()
  return availableMemes.value.filter(m => 
    m.title?.toLowerCase().includes(query) ||
    m.ticker?.toLowerCase().includes(query)
  ).slice(0, 10)
})

// 方法
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

const getSparklinePoints = (data) => {
  if (!data || data.length === 0) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 60
    const y = 20 - ((v - min) / range) * 18
    return `${x},${y}`
  }).join(' ')
}

const getSparklinePointsLarge = (data) => {
  if (!data || data.length === 0) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 100
    const y = 28 - ((v - min) / range) * 26
    return `${x},${y}`
  }).join(' ')
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
}

const goToMeme = (id) => {
  router.push(`/meme/${id}`)
}

const quickTrade = (item) => {
  router.push(`/meme/${item.id}`)
}

const setAlert = (item) => {
  router.push(`/discover?tab=alert&meme=${item.id}`)
}

const isInWatchlist = (id) => {
  return watchlist.value.some(item => item.id === id)
}

// 从API获取自选列表
const fetchWatchlist = async () => {
  loading.value = true
  try {
    const response = await fetch(`${server_ip}/api/watchlist`, {
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      watchlist.value = data.data || []
    }
  } catch (error) {
    console.error('获取自选列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索可添加的模因
const searchMemes = async () => {
  try {
    const response = await fetch(`${server_ip}/api/memes/search-for-compare?q=${addSearchQuery.value}`)
    const data = await response.json()
    if (data.code === 0) {
      availableMemes.value = data.data || []
    }
  } catch (error) {
    console.error('搜索模因失败:', error)
  }
}

// 添加到自选列表
const addToWatchlist = async (meme) => {
  if (isInWatchlist(meme.id)) return
  try {
    const response = await fetch(`${server_ip}/api/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username
      },
      body: JSON.stringify({ memeId: meme.id })
    })
    const data = await response.json()
    if (data.code === 0) {
      await fetchWatchlist()
      showAddModal.value = false
    } else {
      alert(data.message || '添加失败')
    }
  } catch (error) {
    console.error('添加自选失败:', error)
    alert('添加失败，请重试')
  }
}

// 从自选列表移除
const removeFromWatchlist = async (id) => {
  try {
    const response = await fetch(`${server_ip}/api/watchlist/${id}`, {
      method: 'DELETE',
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      watchlist.value = watchlist.value.filter(item => item.id !== id)
      selectedItems.value = selectedItems.value.filter(itemId => itemId !== id)
    }
  } catch (error) {
    console.error('移除自选失败:', error)
  }
}

const batchSetAlert = () => {
  router.push(`/discover?tab=alert`)
}

const batchRemove = async () => {
  for (const id of selectedItems.value) {
    await removeFromWatchlist(id)
  }
  selectedItems.value = []
}

// 监听搜索词变化
watch(addSearchQuery, () => {
  searchMemes()
})

// 打开弹窗时加载数据
watch(showAddModal, (val) => {
  if (val) {
    searchMemes()
  }
})

onMounted(() => {
  fetchWatchlist()
})
</script>

<style scoped>
.watchlist-page {
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
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.subtitle {
  color: #888;
  font-size: 16px;
}

/* 快捷统计 */
.quick-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}

.stat-item.positive .stat-value {
  color: #00d084;
}

.stat-item.negative .stat-value {
  color: #ff3b69;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  flex: 1;
  max-width: 300px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.sort-select {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.view-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
}

/* 表格视图 */
.watchlist-table {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 1fr 1fr 80px 100px 120px;
  gap: 16px;
  padding: 14px 20px;
  align-items: center;
}

.table-header {
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(127, 90, 240, 0.05);
}

.col.name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meme-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.meme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meme-title {
  font-weight: 600;
  font-size: 14px;
}

.meme-ticker {
  font-size: 12px;
  color: #7f5af0;
}

.col.change.positive {
  color: #00d084;
}

.col.change.negative {
  color: #ff3b69;
}

.mini-chart {
  width: 60px;
  height: 20px;
}

.col.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.remove:hover {
  background: rgba(255, 59, 105, 0.2);
  border-color: #ff3b69;
}

/* 卡片视图 */
.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.watchlist-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.watchlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(127, 90, 240, 0.2);
  border-color: rgba(127, 90, 240, 0.4);
}

.card-header {
  position: relative;
}

.card-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ff3b69;
}

.card-body {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.card-ticker {
  font-size: 13px;
  color: #7f5af0;
}

.card-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
}

.price-value {
  font-size: 18px;
  font-weight: 700;
}

.price-change {
  font-size: 14px;
  font-weight: 600;
}

.price-change.positive {
  color: #00d084;
}

.price-change.negative {
  color: #ff3b69;
}

.card-chart {
  height: 30px;
  margin-bottom: 12px;
}

.sparkline-large {
  width: 100%;
  height: 100%;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.card-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.card-btn.trade:hover {
  background: rgba(0, 208, 132, 0.2);
  border-color: #00d084;
}

/* 批量操作栏 */
.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  z-index: 100;
}

.selected-count {
  font-size: 14px;
  color: #888;
}

.batch-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.batch-btn.remove {
  background: rgba(255, 59, 105, 0.2);
  border-color: rgba(255, 59, 105, 0.4);
  color: #ff3b69;
}

.batch-btn.cancel {
  color: #888;
}

/* 弹窗 */
.modal-overlay {
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

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
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

.modal-search {
  width: 100%;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
}

.meme-options {
  max-height: 400px;
  overflow-y: auto;
}

.meme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.meme-option:hover {
  background: rgba(127, 90, 240, 0.1);
}

.option-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.option-info {
  flex: 1;
}

.option-title {
  display: block;
  font-weight: 600;
}

.option-ticker {
  font-size: 12px;
  color: #7f5af0;
}

.option-price {
  font-weight: 600;
  color: #00d084;
}

.added-badge {
  padding: 4px 10px;
  background: rgba(127, 90, 240, 0.2);
  border-radius: 20px;
  font-size: 11px;
  color: #7f5af0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.add-first-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 40px 2fr 1fr 1fr 100px;
  }
  
  .col.volume,
  .col.holders,
  .col.chart {
    display: none;
  }
}

@media (max-width: 768px) {
  .quick-stats {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .toolbar-actions {
    justify-content: flex-end;
  }
}
</style>

