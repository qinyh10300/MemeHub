<template>
  <div class="smart-recommend">
    <div class="recommend-header">
      <h2 class="recommend-title">
        <span class="title-icon">✨</span>
        为你推荐
      </h2>
      <div class="recommend-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="recommend-content">
      <!-- 热门推荐 -->
      <div v-if="activeTab === 'hot'" class="recommend-list">
        <div
          v-for="meme in hotMemes"
          :key="meme.id"
          class="recommend-card hot"
          @click="goToMeme(meme.id)"
        >
          <div class="card-badge">🔥 热门</div>
          <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">{{ meme.title }}</h3>
            <span class="card-ticker">${{ meme.ticker }}</span>
            <div class="card-stats">
              <span class="stat price">${{ formatPrice(meme.price) }}</span>
              <span class="stat change" :class="meme.change >= 0 ? 'positive' : 'negative'">
                {{ meme.change >= 0 ? '+' : '' }}{{ meme.change }}%
              </span>
            </div>
            <div class="card-reason">
              <span class="reason-icon">💡</span>
              {{ meme.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- 新上线 -->
      <div v-if="activeTab === 'new'" class="recommend-list">
        <div
          v-for="meme in newMemes"
          :key="meme.id"
          class="recommend-card new"
          @click="goToMeme(meme.id)"
        >
          <div class="card-badge">✨ 新上线</div>
          <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">{{ meme.title }}</h3>
            <span class="card-ticker">${{ meme.ticker }}</span>
            <div class="card-stats">
              <span class="stat price">${{ formatPrice(meme.price) }}</span>
              <span class="stat time">{{ formatTimeAgo(meme.createdAt) }}</span>
            </div>
            <div class="card-reason">
              <span class="reason-icon">🚀</span>
              {{ meme.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- 潜力股 -->
      <div v-if="activeTab === 'potential'" class="recommend-list">
        <div
          v-for="meme in potentialMemes"
          :key="meme.id"
          class="recommend-card potential"
          @click="goToMeme(meme.id)"
        >
          <div class="card-badge">💎 潜力</div>
          <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">{{ meme.title }}</h3>
            <span class="card-ticker">${{ meme.ticker }}</span>
            <div class="card-stats">
              <span class="stat price">${{ formatPrice(meme.price) }}</span>
              <span class="stat score">评分: {{ meme.score }}/100</span>
            </div>
            <div class="card-reason">
              <span class="reason-icon">📈</span>
              {{ meme.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- 你可能喜欢 -->
      <div v-if="activeTab === 'like'" class="recommend-list">
        <div
          v-for="meme in likedMemes"
          :key="meme.id"
          class="recommend-card like"
          @click="goToMeme(meme.id)"
        >
          <div class="card-badge">❤️ 猜你喜欢</div>
          <img :src="getImageUrl(meme.imageUrl)" :alt="meme.title" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">{{ meme.title }}</h3>
            <span class="card-ticker">${{ meme.ticker }}</span>
            <div class="card-stats">
              <span class="stat price">${{ formatPrice(meme.price) }}</span>
              <span class="stat match">匹配度: {{ meme.match }}%</span>
            </div>
            <div class="card-reason">
              <span class="reason-icon">🎯</span>
              {{ meme.reason }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="recommend-footer">
      <button class="refresh-btn" @click="refreshRecommend" :disabled="loading">
        <span :class="['refresh-icon', { spinning: loading }]">↻</span>
        换一批
      </button>
      <button class="more-btn" @click="goToLeaderboard">
        查看更多 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const serverIp = authStore.server_ip

const loading = ref(false)
const activeTab = ref('hot')

const tabs = [
  { id: 'hot', label: '热门', icon: '🔥' },
  { id: 'new', label: '新上线', icon: '✨' },
  { id: 'potential', label: '潜力股', icon: '💎' },
  { id: 'personalized', label: '猜你喜欢', icon: '❤️' }
]

// 推荐数据
const hotMemes = ref([])
const newMemes = ref([])
const potentialMemes = ref([])
const likedMemes = ref([])

const formatPrice = (price) => {
  if (!price) return '0.000000'
  if (price < 0.000001) return price.toExponential(2)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${serverIp}${url.startsWith('/') ? '' : '/'}${url}`
}

const goToMeme = (id) => {
  router.push(`/meme/${id}`)
}

const goToLeaderboard = () => {
  router.push('/discover?tab=leaderboard')
}

// 从API获取推荐数据
const fetchRecommendations = async (type) => {
  try {
    const response = await fetch(`${serverIp}/api/recommendations?type=${type}`, {
      headers: { 'token': authStore.username || '' }
    })
    const data = await response.json()
    console.log(`Fetched ${type} recommendations:`, data)
    if (data.code === 0) {
      return (data.data || []).map(item => {
        if (!item.imageUrl) return item

        const url = item.imageUrl.replace(/^\/+/, '')
        const base = url.includes('api/') ? serverIp : `${serverIp}/api`

        return {
          ...item,
          imageUrl: `${base}/${url}`
        }
      })
    }
    return []
  } catch (error) {
    console.error(`获取${type}推荐失败:`, error)
    return []
  }
}

const loadAllRecommendations = async () => {
  loading.value = true
  try {
    const [hot, newList, potential, personalized] = await Promise.all([
      fetchRecommendations('hot'),
      fetchRecommendations('new'),
      fetchRecommendations('potential'),
      fetchRecommendations('personalized')
    ])
    
    hotMemes.value = hot.map(m => ({
      ...m,
      change: m.token?.priceChange ? m.token.priceChange.toFixed(4) : "0"
    }))
    
    newMemes.value = newList
    
    potentialMemes.value = potential.map(m => ({
      ...m,
      change: m.token?.priceChange ? m.token.priceChange.toFixed(4) : "0",
      score: m.hotScore ? Math.min(100, Math.round(m.hotScore / 10)) : 50
    }))
    
    likedMemes.value = personalized.map(m => ({
      ...m,
      match: Math.floor(Math.random() * 20 + 80) // 简单模拟匹配度
    }))
  } catch (error) {
    console.error('加载推荐失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshRecommend = async () => {
  await loadAllRecommendations()
}

// 监听标签切换，确保有数据
watch(activeTab, async (newTab) => {
  if (newTab === 'hot' && hotMemes.value.length === 0) {
    hotMemes.value = await fetchRecommendations('hot')
  } else if (newTab === 'new' && newMemes.value.length === 0) {
    newMemes.value = await fetchRecommendations('new')
  } else if (newTab === 'potential' && potentialMemes.value.length === 0) {
    potentialMemes.value = await fetchRecommendations('potential')
  } else if (newTab === 'personalized' && likedMemes.value.length === 0) {
    likedMemes.value = await fetchRecommendations('personalized')
  }
})

onMounted(() => {
  loadAllRecommendations()
})
</script>

<style scoped>
.smart-recommend {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.08), rgba(46, 196, 182, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 30px;
}

.recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recommend-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.title-icon {
  font-size: 24px;
}

.recommend-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

.recommend-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.recommend-card {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(127, 90, 240, 0.25);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.recommend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(127, 90, 240, 0.2);
  border-color: rgba(127, 90, 240, 0.4);
}

.card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  z-index: 1;
}

.recommend-card.hot .card-badge {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.8), rgba(255, 59, 105, 0.8));
}

.recommend-card.new .card-badge {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.8), rgba(46, 196, 182, 0.8));
}

.recommend-card.potential .card-badge {
  background: linear-gradient(135deg, rgba(0, 208, 132, 0.8), rgba(46, 196, 182, 0.8));
}

.recommend-card.like .card-badge {
  background: linear-gradient(135deg, rgba(255, 59, 105, 0.8), rgba(255, 107, 53, 0.8));
}

.card-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-ticker {
  font-size: 13px;
  color: #7f5af0;
  font-weight: 500;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
}

.stat {
  font-size: 14px;
}

.stat.price {
  font-weight: 700;
}

.stat.change {
  font-weight: 600;
}

.stat.change.positive {
  color: #00d084;
}

.stat.change.negative {
  color: #ff3b69;
}

.stat.time,
.stat.score,
.stat.match {
  color: #888;
  font-size: 12px;
}

.card-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #aaa;
}

.reason-icon {
  font-size: 14px;
}

.recommend-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.refresh-btn,
.more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled),
.more-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 16px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.more-btn {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.2), rgba(46, 196, 182, 0.1));
  border-color: rgba(127, 90, 240, 0.3);
  color: #fff;
}

.more-btn:hover {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.3), rgba(46, 196, 182, 0.2));
}

@media (max-width: 1024px) {
  .recommend-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .recommend-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .recommend-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .recommend-list {
    grid-template-columns: 1fr;
  }
}
</style>

