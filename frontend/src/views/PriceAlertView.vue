<template>
  <div class="price-alert-page">
    <header class="page-header">
      <h1 class="title">🔔 价格预警</h1>
      <p class="subtitle">设置目标价格，第一时间获取市场变动通知</p>
    </header>

    <!-- 快速添加预警 -->
    <div class="add-alert-section">
      <h2 class="section-title">➕ 添加新预警</h2>
      <div class="add-alert-form">
        <div class="form-row">
          <div class="form-group">
            <label>选择模因币</label>
            <div class="meme-selector" @click="openMemeSelector">
              <template v-if="selectedMeme">
                <img :src="getImageUrl(selectedMeme.imageUrl)" class="selected-meme-img" />
                <span class="selected-meme-ticker">${{ selectedMeme.ticker }}</span>
                <span class="selected-meme-title">{{ selectedMeme.title }}</span>
              </template>
              <template v-else>
                <span class="placeholder-text">点击选择模因币</span>
              </template>
              <span class="selector-arrow">▼</span>
            </div>
          </div>
          
          <!-- 模因选择弹窗 -->
          <div v-if="showMemeSelector" class="meme-selector-modal" @click.self="showMemeSelector = false">
            <div class="modal-content">
              <div class="modal-header">
                <h3>选择模因币</h3>
                <button class="close-btn" @click="showMemeSelector = false">×</button>
              </div>
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  v-model="memeSearchQuery"
                  type="text"
                  placeholder="搜索模因名称或代号..."
                  class="search-input"
                />
                <span v-if="searchingMemes" class="search-loading">⏳</span>
              </div>
              <div class="meme-list">
                <div v-if="searchingMemes" class="search-status">
                  <span class="loading-spinner">⏳</span>
                  <span>搜索中...</span>
                </div>
                <div v-else-if="filteredMemeList.length === 0" class="search-status">
                  <span class="empty-icon">📭</span>
                  <span>{{ memeSearchQuery ? '未找到相关模因' : '暂无可选模因' }}</span>
                </div>
                <div
                  v-else
                  v-for="meme in filteredMemeList"
                  :key="meme.id"
                  class="meme-option"
                  :class="{ selected: meme.id === newAlert.memeId }"
                  @click="selectMeme(meme)"
                >
                  <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="option-image" />
                  <div class="option-info">
                    <span class="option-ticker">${{ meme.ticker }}</span>
                    <span class="option-title">{{ meme.title }}</span>
                  </div>
                  <span class="option-price">${{ (meme.currentPrice || meme.price || 0).toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>预警类型</label>
            <div class="type-buttons">
              <button
                :class="['type-btn', { active: newAlert.type === 'above' }]"
                @click="newAlert.type = 'above'"
              >
                <span class="type-icon">📈</span>
                涨到
              </button>
              <button
                :class="['type-btn', { active: newAlert.type === 'below' }]"
                @click="newAlert.type = 'below'"
              >
                <span class="type-icon">📉</span>
                跌到
              </button>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>目标价格 (USDT)</label>
            <div class="price-input-group">
              <span class="input-prefix">$</span>
              <input
                v-model.number="newAlert.targetPrice"
                type="number"
                step="0.000001"
                placeholder="0.000000"
                class="form-input"
              />
            </div>
            <p v-if="selectedMemePrice" class="current-price-hint">
              当前价格: ${{ selectedMemePrice.toFixed(6) }}
              <span v-if="priceChangePercent !== 0" :class="priceChangePercent > 0 ? 'positive' : 'negative'">
                ({{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%)
              </span>
            </p>
          </div>
          <div class="form-group">
            <label>通知方式</label>
            <div class="notify-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAlert.notifyInApp" />
                <span class="checkbox-custom"></span>
                站内通知
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAlert.notifyEmail" />
                <span class="checkbox-custom"></span>
                邮件通知
              </label>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label>备注（可选）</label>
            <input
              v-model="newAlert.note"
              type="text"
              placeholder="添加备注，如：抄底信号、止盈点位..."
              class="form-input"
            />
          </div>
        </div>
        <button class="add-btn" @click="addAlert" :disabled="!canAddAlert">
          <span class="btn-icon">🔔</span>
          创建预警
        </button>
      </div>
    </div>

    <!-- 活跃预警列表 -->
    <div class="alerts-section">
      <div class="section-header">
        <h2 class="section-title">📋 我的预警 ({{ activeAlerts.length }})</h2>
        <div class="filter-buttons">
          <button
            :class="['filter-btn', { active: alertFilter === 'all' }]"
            @click="alertFilter = 'all'"
          >
            全部
          </button>
          <button
            :class="['filter-btn', { active: alertFilter === 'active' }]"
            @click="alertFilter = 'active'"
          >
            进行中
          </button>
          <button
            :class="['filter-btn', { active: alertFilter === 'triggered' }]"
            @click="alertFilter = 'triggered'"
          >
            已触发
          </button>
        </div>
      </div>

      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <span class="empty-icon">🔕</span>
        <p>暂无预警</p>
        <p class="empty-hint">添加你的第一个价格预警吧！</p>
      </div>

      <div v-else class="alerts-list">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          :class="['alert-card', { triggered: alert.status === 'triggered', expired: alert.status === 'expired' }]"
        >
          <div class="alert-left">
            <img :src="getImageUrl(alert.memeImage)" :alt="alert.memeTicker" class="meme-thumb" />
            <div class="alert-info">
              <div class="alert-header">
                <span class="meme-ticker">${{ alert.memeTicker }}</span>
                <span :class="['alert-type', alert.type]">
                  {{ alert.type === 'above' ? '涨到' : '跌到' }}
                </span>
                <span class="target-price">${{ alert.targetPrice.toFixed(6) }}</span>
              </div>
              <div class="alert-meta">
                <span class="current">当前: ${{ alert.currentPrice.toFixed(6) }}</span>
                <span class="distance" :class="getDistanceClass(alert)">
                  {{ formatDistance(alert) }}
                </span>
              </div>
              <p v-if="alert.note" class="alert-note">📝 {{ alert.note }}</p>
            </div>
          </div>
          <div class="alert-right">
            <div class="alert-status">
              <span v-if="alert.status === 'active'" class="status-badge active">
                <span class="pulse"></span>
                监控中
              </span>
              <span v-else-if="alert.status === 'triggered'" class="status-badge triggered">
                ✅ 已触发
              </span>
              <span v-else class="status-badge expired">
                ⏰ 已过期
              </span>
            </div>
            <div class="alert-actions">
              <button
                v-if="alert.status === 'active'"
                class="action-btn pause"
                @click="toggleAlert(alert.id)"
                title="暂停"
              >
                ⏸️
              </button>
              <button
                v-if="alert.status === 'triggered'"
                class="action-btn reset"
                @click="resetAlert(alert.id)"
                title="重新启用"
              >
                🔄
              </button>
              <button
                class="action-btn delete"
                @click="deleteAlert(alert.id)"
                title="删除"
              >
                🗑️
              </button>
            </div>
            <span class="created-time">{{ formatTime(alert.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 预警历史 -->
    <div class="history-section">
      <h2 class="section-title">📜 触发历史</h2>
      <div class="history-list">
        <div v-for="record in alertHistory" :key="record.id" class="history-item">
          <div class="history-icon">{{ record.type === 'above' ? '📈' : '📉' }}</div>
          <div class="history-content">
            <span class="history-ticker">${{ record.memeTicker }}</span>
            <span class="history-text">
              {{ record.type === 'above' ? '涨到' : '跌到' }} ${{ record.triggeredPrice.toFixed(6) }}
            </span>
          </div>
          <span class="history-time">{{ formatTime(record.triggeredAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 预警统计 -->
    <div class="stats-section">
      <div class="stat-card">
        <span class="stat-icon">🔔</span>
        <div class="stat-content">
          <span class="stat-value">{{ alertStats.total }}</span>
          <span class="stat-label">总预警数</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <div class="stat-content">
          <span class="stat-value">{{ alertStats.triggered }}</span>
          <span class="stat-label">已触发</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-content">
          <span class="stat-value">{{ alertStats.accuracy }}%</span>
          <span class="stat-label">预测准确率</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⏱️</span>
        <div class="stat-content">
          <span class="stat-value">{{ alertStats.avgTime }}</span>
          <span class="stat-label">平均触发时间</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const serverIp = authStore.server_ip
const route = useRoute()

// 新预警表单
const newAlert = ref({
  memeId: '',
  type: 'above',
  targetPrice: null,
  notifyInApp: true,
  notifyEmail: false,
  note: ''
})

// 可选模因列表
const availableMemes = ref([])
const selectedMemeData = ref(null)
const showMemeSelector = ref(false)
const memeSearchQuery = ref('')
const searchingMemes = ref(false)
const memeSearchTimer = ref(null)

// 预警列表
const alerts = ref([])
const alertFilter = ref('all')
const alertHistory = ref([])
const loading = ref(false)

// 统计数据
const alertStats = computed(() => {
  const total = alerts.value.length
  const triggered = alerts.value.filter(a => a.status === 'triggered').length
  const accuracy = total > 0 ? Math.round((triggered / total) * 100) : 0
  return {
    total,
    triggered,
    accuracy,
    avgTime: '24h'
  }
})

// 计算属性
const selectedMeme = computed(() => 
  availableMemes.value.find(m => m.id === newAlert.value.memeId) || selectedMemeData.value
)

const selectedMemePrice = computed(() => selectedMeme.value?.currentPrice || selectedMeme.value?.price || 0)
const filteredMemeList = computed(() => availableMemes.value)

const priceChangePercent = computed(() => {
  if (!selectedMemePrice.value || !newAlert.value.targetPrice) return 0
  return ((newAlert.value.targetPrice - selectedMemePrice.value) / selectedMemePrice.value) * 100
})

const canAddAlert = computed(() => {
  return newAlert.value.memeId && 
         newAlert.value.targetPrice > 0 && 
         (newAlert.value.notifyInApp || newAlert.value.notifyEmail)
})

const activeAlerts = computed(() => alerts.value.filter(a => a.status === 'active'))

const filteredAlerts = computed(() => {
  if (alertFilter.value === 'all') return alerts.value
  return alerts.value.filter(a => a.status === alertFilter.value)
})

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${serverIp}${url.startsWith('/') ? '' : '/'}${url}`
}

// 搜索模因列表
const searchMemes = async (overrideQuery = null) => {
  searchingMemes.value = true
  try {
    const queryValue = overrideQuery !== null ? overrideQuery : memeSearchQuery.value
    const query = encodeURIComponent(queryValue || '')
    const response = await fetch(`${serverIp}/api/memes/search-for-compare?q=${query}`)
    const data = await response.json()
    if (data.code === 0) {
      availableMemes.value = (data.data || []).map(m => ({
        id: m.id,
        ticker: m.ticker,
        title: m.title,
        currentPrice: m.price,
        imageUrl: m.imageUrl
      }))
      syncSelectedMeme()
    }
  } catch (error) {
    console.error('获取模因列表失败:', error)
    availableMemes.value = []
  } finally {
    searchingMemes.value = false
  }
}

const debouncedMemeSearch = () => {
  if (memeSearchTimer.value) {
    clearTimeout(memeSearchTimer.value)
  }
  memeSearchTimer.value = setTimeout(() => {
    searchMemes()
  }, 300)
}

const syncSelectedMeme = () => {
  if (!newAlert.value.memeId) return
  const matched = availableMemes.value.find(m => m.id === newAlert.value.memeId)
  if (matched) {
    selectedMemeData.value = matched
  }
}

const fetchMemeById = async (memeId) => {
  try {
    const response = await fetch(`${serverIp}/api/memes/search-for-compare?ids=${memeId}`)
    const data = await response.json()
    if (data.code === 0 && Array.isArray(data.data) && data.data.length > 0) {
      const meme = data.data[0]
      selectedMemeData.value = {
        id: meme.id,
        ticker: meme.ticker,
        title: meme.title,
        currentPrice: meme.price,
        imageUrl: meme.imageUrl
      }
      if (!availableMemes.value.find(m => m.id === meme.id)) {
        availableMemes.value.unshift(selectedMemeData.value)
      }
    }
  } catch (error) {
    console.error('按ID获取模因失败:', error)
  }
}

// 从API获取可选模因列表
const fetchAvailableMemes = async () => {
  memeSearchQuery.value = ''
  await searchMemes()
}

// 从API获取预警列表
const fetchAlerts = async () => {
  loading.value = true
  try {
    const response = await fetch(`${serverIp}/api/price-alerts`, {
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      alerts.value = data.data || []
      // 构建历史记录（已触发的预警）
      alertHistory.value = alerts.value
        .filter(a => a.status === 'triggered')
        .map(a => ({
          id: a.id,
          memeTicker: a.memeTicker,
          type: a.type,
          triggeredPrice: a.currentPrice,
          triggeredAt: a.triggeredAt
        }))
    }
  } catch (error) {
    console.error('获取预警列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加预警
const addAlert = async () => {
  if (!canAddAlert.value) return
  
  try {
    const response = await fetch(`${serverIp}/api/price-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username
      },
      body: JSON.stringify({
        memeId: newAlert.value.memeId,
        type: newAlert.value.type,
        targetPrice: newAlert.value.targetPrice,
        notifyInApp: newAlert.value.notifyInApp,
        notifyEmail: newAlert.value.notifyEmail,
        note: newAlert.value.note
      })
    })
    
    const data = await response.json()
    if (data.code === 0) {
      // 重置表单
      newAlert.value = {
        memeId: '',
        type: 'above',
        targetPrice: null,
        notifyInApp: true,
        notifyEmail: false,
        note: ''
      }
      selectedMemeData.value = null
      await fetchAlerts()
    } else {
      alert(data.message || '添加预警失败')
    }
  } catch (error) {
    console.error('添加预警失败:', error)
    alert('添加预警失败，请重试')
  }
}

const toggleAlert = (alertId) => {
  // 暂不支持暂停功能
}

const resetAlert = (alertId) => {
  // 暂不支持重置功能
}

const deleteAlert = async (alertId) => {
  try {
    const response = await fetch(`${serverIp}/api/price-alerts/${alertId}`, {
      method: 'DELETE',
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      await fetchAlerts()
    }
  } catch (error) {
    console.error('删除预警失败:', error)
  }
}

const formatDistance = (alert) => {
  const current = alert.currentPrice || 0
  const target = alert.targetPrice || 0
  if (current === 0) return '加载中...'
  const diff = target - current
  const percent = (diff / current) * 100
  if (alert.type === 'above') {
    return percent > 0 ? `还差 ${percent.toFixed(2)}%` : '已达到'
  } else {
    return percent < 0 ? `还差 ${Math.abs(percent).toFixed(2)}%` : '已达到'
  }
}

const getDistanceClass = (alert) => {
  const current = alert.currentPrice || 0
  const target = alert.targetPrice || 0
  if (current === 0) return 'far'
  const diff = target - current
  const percent = Math.abs((diff / current) * 100)
  if (percent < 5) return 'close'
  if (percent < 20) return 'medium'
  return 'far'
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const openMemeSelector = () => {
  showMemeSelector.value = true
  memeSearchQuery.value = ''
  searchMemes()
}

const selectMeme = (meme) => {
  newAlert.value.memeId = meme.id
  selectedMemeData.value = meme
  if (!availableMemes.value.find(m => m.id === meme.id)) {
    availableMemes.value.unshift(meme)
  }
  showMemeSelector.value = false
}

// 处理URL中的meme参数
watch(() => route.query.meme, (memeId) => {
  if (memeId) {
    newAlert.value.memeId = memeId
    const matched = availableMemes.value.find(m => m.id === memeId)
    if (matched) {
      selectedMemeData.value = matched
    } else {
      fetchMemeById(memeId)
    }
  }
}, { immediate: true })

watch(memeSearchQuery, () => {
  if (!showMemeSelector.value) return
  debouncedMemeSearch()
})

onMounted(async () => {
  await fetchAvailableMemes()
  await fetchAlerts()
  
  if (route.query.meme && !selectedMemeData.value) {
    await fetchMemeById(route.query.meme)
  }
})
</script>

<style scoped>
.price-alert-page {
  max-width: 1100px;
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
  background: linear-gradient(135deg, #ff6b35, #ffd700);
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

/* 添加预警表单 */
.add-alert-section {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 215, 0, 0.05));
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
}

.add-alert-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.meme-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.meme-selector:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
}

.selected-meme-img {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: cover;
}

.selected-meme-ticker {
  font-weight: 600;
  color: #ff6b35;
}

.selected-meme-title {
  color: #888;
  font-size: 13px;
}

.placeholder-text {
  color: #666;
  font-size: 14px;
}

.selector-arrow {
  margin-left: auto;
  color: #666;
}

.meme-selector-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.meme-selector-modal .modal-content {
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.meme-list {
  max-height: 360px;
  overflow-y: auto;
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

.meme-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.meme-option:hover,
.meme-option.selected {
  background: rgba(255, 107, 53, 0.12);
}

.option-image {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
}

.option-info {
  flex: 1;
}

.option-ticker {
  display: block;
  font-weight: 600;
  color: #ff6b35;
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

.empty-icon {
  font-size: 32px;
}

.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
}

.form-select:focus {
  outline: none;
  border-color: #ff6b35;
}

.type-buttons {
  display: flex;
  gap: 10px;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.type-btn.active {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 215, 0, 0.1));
  border-color: #ff6b35;
  color: #fff;
}

.type-icon {
  font-size: 18px;
}

.price-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 14px;
  color: #888;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px 12px 28px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #ff6b35;
}

.current-price-hint {
  font-size: 12px;
  color: #888;
  margin: 4px 0 0;
}

.current-price-hint .positive {
  color: #00d084;
}

.current-price-hint .negative {
  color: #ff3b69;
}

.notify-options {
  display: flex;
  gap: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkbox-custom {
  background: #ff6b35;
  border-color: #ff6b35;
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #ff6b35, #ffd700);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 预警列表 */
.alerts-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: #fff;
}

.filter-btn.active {
  background: rgba(255, 107, 53, 0.2);
  border-color: #ff6b35;
  color: #fff;
}

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

.empty-hint {
  font-size: 13px;
  color: #555;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.2s;
}

.alert-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.alert-card.triggered {
  background: rgba(0, 208, 132, 0.05);
  border-color: rgba(0, 208, 132, 0.2);
}

.alert-card.expired {
  opacity: 0.6;
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meme-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.meme-ticker {
  font-weight: 700;
  font-size: 16px;
  color: #7f5af0;
}

.alert-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.alert-type.above {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.alert-type.below {
  background: rgba(255, 59, 105, 0.2);
  color: #ff3b69;
}

.target-price {
  font-weight: 600;
  font-size: 15px;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.current {
  color: #888;
}

.distance {
  font-weight: 600;
}

.distance.close {
  color: #00d084;
}

.distance.medium {
  color: #ffd700;
}

.distance.far {
  color: #888;
}

.alert-note {
  margin: 8px 0 0;
  font-size: 12px;
  color: #888;
}

.alert-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(0, 208, 132, 0.15);
  color: #00d084;
}

.status-badge .pulse {
  width: 8px;
  height: 8px;
  background: #00d084;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.status-badge.triggered {
  background: rgba(127, 90, 240, 0.15);
  color: #7f5af0;
}

.status-badge.expired {
  background: rgba(136, 136, 136, 0.15);
  color: #888;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.delete:hover {
  background: rgba(255, 59, 105, 0.2);
  border-color: #ff3b69;
}

.created-time {
  font-size: 11px;
  color: #666;
}

/* 历史记录 */
.history-section {
  margin-bottom: 30px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.history-icon {
  font-size: 20px;
}

.history-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-ticker {
  font-weight: 600;
  color: #7f5af0;
}

.history-text {
  color: #888;
  font-size: 14px;
}

.history-time {
  font-size: 12px;
  color: #666;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.stat-icon {
  font-size: 28px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

/* 响应式 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .alert-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .alert-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

