<template>
  <div class="profile-section">
    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-button', activeTab === tab ? 'active' : '']"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">


      <!-- Creator data -->
      <template v-if="activeTab === 'Creator Data'">
        <div class="creator-dashboard-section">
          <div class="dashboard-header">
            <h3>📊 Creator Data Overview</h3>
            <router-link to="/creator-dashboard" class="view-all-btn">View Details →</router-link>
          </div>
          <div class="dashboard-stats">
            <div class="stat-card">
              <span class="stat-icon">💰</span>
              <div class="stat-content">
                <span class="stat-value">${{ creatorStats.totalEarnings?.toFixed(2) || '0.00' }}</span>
                <span class="stat-label">Total Earnings</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📈</span>
              <div class="stat-content">
                <span class="stat-value">{{ creatorStats.totalMemes || 0 }}</span>
                <span class="stat-label">Memes Created</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">👥</span>
              <div class="stat-content">
                <span class="stat-value">{{ creatorStats.totalHolders || 0 }}</span>
                <span class="stat-label">Total Holders</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">💎</span>
              <div class="stat-content">
                <span class="stat-value">${{ formatVolume(creatorStats.totalVolume) }}</span>
                <span class="stat-label">Trading Volume</span>
              </div>
            </div>
          </div>
          <div class="quick-link-hint">
            <p>Click "View Details" to get complete earnings analysis, fan statistics and transaction details</p>
          </div>
        </div>
      </template>

      <!-- Followers / Following list: only visible to self -->
      <template v-else-if="isUserListTab">
        <button
          v-for="user in pagedMemes"
          :key="user.id"
          class="meme-item"
          @click="goToUserProfile(user.username)"
        >
          <img
            :src="getAvatarUrl(user.avatar, user.id)"
            alt="avatar"
            class="meme-image"
            @error="handleAvatarError"
          />
          <div class="meme-info">
            <h3 class="meme-name">{{ user.nickname }}</h3>
            <p class="meme-code">{{ user.username }}</p>
            <p class="meme-desc">{{ activeTab }}</p>
          </div>
        </button>
      </template>

      <!-- Meme coin list: display holdings info -->
      <template v-else-if="isTokenTab">
        <div class="token-list">
          <div
            v-for="token in pagedMemes"
            :key="token.id || token.code"
            class="token-card"
            @click="goToMemeDetail(token.memeId || token.id)"
          >
            <div class="token-left">
              <img :src="getImageUrl(token.imageUrl || token.image)" alt="token" class="token-image" />
              <div class="token-basic">
                <h3 class="token-name">{{ token.name }}</h3>
                <p class="token-ticker">${{ token.code }}</p>
              </div>
            </div>
            <div class="token-right">
              <div class="token-amount">
                <span class="amount-label">Holdings</span>
                <span class="amount-value">{{ formatNumber(token.amount) }}</span>
              </div>
              <div class="token-value">
                <span class="value-label">Valuation</span>
                <span class="value-number">{{ formatCurrency(token.value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="pagedMemes.length === 0" class="empty-state">
          <p>🪙 No meme coins held yet</p>
          <p class="empty-hint">Go to the trading page to buy meme coins you're bullish on!</p>
        </div>
      </template>

      <!-- Meme list: display meme info -->
      <template v-else>
        <div
          v-for="meme in pagedMemes"
          :key="meme.id || meme.code"
          class="meme-item-container"
        >
        <button
          class="meme-item"
          :disabled="meme.status === 'banned' || meme.status === 'pending'"
          @click="goToMemeDetail(meme.id)"
        >
          <img :src="meme.image" alt="meme" class="meme-image" />
          <div class="meme-info">
            <h3 class="meme-name">{{ meme.name }}</h3>
            <p class="meme-code">Code: {{ meme.code }}</p>
            <p class="meme-desc">{{ meme.description }}</p>

            <div v-if="isOwnProfile && activeTab.includes('My Memes')" class="status-bar">
               <span v-if="meme.status === 'pending'" class="status-tag pending">⏳ Under Review</span>
               <span v-if="meme.status === 'banned'" class="status-tag banned">❌ Rejected</span>

               <button
                 v-if="meme.status === 'banned'"
                 class="action-btn edit-btn"
                 @click.stop="goToEdit(meme.id)"
               >
                 Edit Again
               </button>
               <button
                 v-if="meme.status === 'banned'"
                 class="action-btn delete-btn"
                 @click.stop="deleteMeme(meme.id)"
               >
                 Delete
               </button>
            </div>
          </div>
        </button>
        </div>
      </template>

      <!-- Pagination buttons -->
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="currentPage--">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ✅ 使用 Vue Router
const router = useRouter()
const authStore = useAuthStore()
const server_ip = authStore.server_ip || 'http://localhost:3000'

const emit = defineEmits(['refresh'])

// ✅ Receive props
const props = defineProps({
  userData: Object,
  isOwnProfile: {
    type: Boolean,
    default: true
  }
})

// 在模板中使用 isOwnProfile
const isOwnProfile = computed(() => props.isOwnProfile)

const userOnlyTabs = ['Following', 'Followers', 'Creator Data']

// 自选列表数据
const watchlist = ref([])

// 创作者数据
const creatorStats = ref({
  totalEarnings: 0,
  totalMemes: 0,
  totalHolders: 0,
  totalVolume: 0
})

// 从API获取自选列表
const fetchWatchlist = async () => {
  if (!props.isOwnProfile) return
  try {
    const response = await fetch(`${server_ip}/api/watchlist`, {
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      watchlist.value = (data.data || []).map((item) => ({
        ...item,
        imageUrl: getImageUrl(item.imageUrl || item.image),
      }))
    }
  } catch (error) {
    console.error('Failed to fetch watchlist:', error)
  }
}

// Fetch creator data from API
const fetchCreatorStats = async () => {
  if (!props.isOwnProfile) return
  try {
    const response = await fetch(`${server_ip}/api/creator-stats`, {
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0 && data.data?.overview) {
      creatorStats.value = {
        totalEarnings: data.data.overview.totalEarnings || 0,
        totalMemes: data.data.overview.totalMemes || 0,
        totalHolders: data.data.overview.totalHolders || 0,
        totalVolume: data.data.overview.totalVolume || 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch creator stats:', error)
  }
}

const defaultMemeCover = 'https://placehold.co/160x160?text=Meme'

const getImageUrl = (url) => {
  if (!url) return defaultMemeCover
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return `${server_ip}${url.startsWith('/') ? '' : '/'}${url}`
}

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

// Get pronoun based on gender
const getPronoun = (user) => {
  if (!user) return 'Their'

  // Prioritize backend gender field if available
  if (user.gender) {
    return user.gender === 'female' ? 'Her' : 'His'
  }

  // Simple heuristic detection based on nickname (can be extended as needed)
  const nickname = user.nickname || user.username || ''

  // Common female nickname suffixes (Chinese)
  const femaleSuffixes = ['妹', '姐', '妈', '婆', '娘', '女', '仙子', '公主']
  const femalePrefixes = ['小', '美', '甜']

  // Check if it contains female indicators
  const hasFemaleIndicator =
    femaleSuffixes.some(suffix => nickname.includes(suffix)) ||
    femalePrefixes.some(prefix => nickname.includes(prefix)) ||
    nickname.includes('girl') || nickname.includes('women') ||
    nickname.match(/[♀♀]/)

  // Check if it contains male indicators (Chinese)
  const maleSuffixes = ['哥', '弟', '爸', '叔', '爷', '男', '先生', '帅哥']
  const hasMaleIndicator =
    maleSuffixes.some(suffix => nickname.includes(suffix)) ||
    nickname.includes('boy') || nickname.includes('man') ||
    nickname.match(/[♂♂]/)

  // If female indicator detected, use "Her"
  if (hasFemaleIndicator && !hasMaleIndicator) {
    return 'Her'
  }

  // Default to "His"
  return 'His'
}

// Tabs - if own profile, show "My"; otherwise, show "His/Her"
const tabs = computed(() => {
  const pronoun = props.isOwnProfile ? 'My' : getPronoun(props.userData)
  const baseTabs = [`${pronoun} Created Memes`, `${pronoun} Meme Coins`, `${pronoun} Favorites`]
  if (props.isOwnProfile) {
    return [...baseTabs, ...userOnlyTabs]
  }
  return baseTabs
})

// Get current tab's correct pronoun
const getCurrentPronoun = () => {
  return props.isOwnProfile ? 'My' : getPronoun(props.userData)
}

// Get initial tab
const getInitialTab = () => {
  const pronoun = getCurrentPronoun()
  return `${pronoun} Created Memes`
}

// Initial active tab needs to be dynamically set based on isOwnProfile
const activeTab = ref(getInitialTab())

// Watch for changes and update tabs
watch(() => [props.isOwnProfile, props.userData], () => {
  const newTab = getInitialTab()
  if (activeTab.value && (activeTab.value.includes('Created Memes') || activeTab.value.includes('Meme Coins') || activeTab.value.includes('Favorites'))) {
    // If current tab contains pronoun, update pronoun part
    const tabType = activeTab.value.replace(/My Created Memes|His Created Memes|Her Created Memes|My Meme Coins|His Meme Coins|Her Meme Coins|My Favorites|His Favorites|Her Favorites/g, '')
    const pronoun = getCurrentPronoun()

    // Rebuild tab name based on tab type
    if (activeTab.value.includes('Meme Coins')) {
      activeTab.value = `${pronoun} Meme Coins`
    } else if (activeTab.value.includes('Favorites')) {
      activeTab.value = `${pronoun} Favorites`
    } else {
      activeTab.value = newTab
    }
  }
}, { immediate: true })

// Initialize data
onMounted(() => {
  if (props.isOwnProfile) {
    fetchWatchlist()
    fetchCreatorStats()
  }
})

// Watch if it's own profile, reload when changed
watch(() => props.isOwnProfile, (newVal) => {
  if (newVal) {
    fetchWatchlist()
    fetchCreatorStats()
  }
})

const isUserListTab = computed(() => isOwnProfile.value && ['Following', 'Followers'].includes(activeTab.value))

// Check if it's meme coin tab
const isTokenTab = computed(() => activeTab.value.includes('Meme Coins'))

// Format numbers (with thousands separator)
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// Format currency
const formatCurrency = (num) => {
  if (num === undefined || num === null) return '¥0.00'
  return '¥' + Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Current page
const currentPage = ref(1)
const itemsPerPage = 4

// Reset pagination when switching tabs
watch(activeTab, () => {
  currentPage.value = 1
})

// ✅ Click navigation function
const goToMemeDetail = (id) => {
  router.push(`/meme/${id}`)
}

// Navigate to user profile page
const goToUserProfile = (username) => {
  // Remove @ symbol if present
  const cleanUsername = username.replace('@', '')
  router.push(`/profile/${cleanUsername}`)
}

// Navigate to edit page
const goToEdit = (id) => {
  router.push(`/create-meme?id=${id}`)
}

// Delete meme
const deleteMeme = async (id) => {
  if (!confirm('Are you sure you want to delete this meme? This action cannot be undone.')) return

  try {
    const res = await fetch(`${server_ip}/api/meme/${id}`, {
      method: 'DELETE',
      headers: {
        'token': authStore.username || authStore.token || ''
      }
    })

    // Try to parse JSON
    let data = {}
    try {
      data = await res.json()
    } catch (e) {}

    if (res.ok) {
      alert('Deleted successfully')
      emit('refresh')
    } else {
      alert(data.message || 'Deletion failed')
    }
  } catch (e) {
    console.error(e)
    alert('Network error, please try again later')
  }
}

// Default avatar URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// Get avatar URL, use default avatar if empty
const getAvatarUrl = (avatar, id) => {
  if (avatar && avatar.trim() !== '') {
    return avatar
  }
  // If avatar is empty, use ID to generate a simple avatar
  // Convert ID to number for pravatar.cc
  if (id) {
    // Use ID's hash value to generate a number between 1-70
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }
    const imgNum = Math.abs(hash % 70) + 1
    return `https://i.pravatar.cc/150?img=${imgNum}`
  }
  return defaultAvatar
}

// Handle avatar loading failure
const handleAvatarError = (event) => {
  // If not currently the default avatar, switch to default avatar
  if (event.target.src !== defaultAvatar) {
    event.target.src = defaultAvatar
  }
}

// Calculate current page data
const pagedMemes = computed(() => {
  if (!props.userData || !props.userData.memesData) return []
  const allMemes = props.userData.memesData[activeTab.value] || []
  console.log('Current tab:', activeTab.value, 'Data:', allMemes)
  const start = (currentPage.value - 1) * itemsPerPage
  return allMemes.slice(start, start + itemsPerPage)
})

// Total pages
const totalPages = computed(() => {
  if (!props.userData || !props.userData.memesData) return 0
  const allMemes = props.userData.memesData[activeTab.value] || []
  return Math.ceil(allMemes.length / itemsPerPage)
})
</script>

<style scoped>
.profile-section {
  position: absolute;
  top: 230px;
  left: 100px;
  width: 600px;
}

.tabs {
  display: flex;
  gap: 50px;
  border-bottom: 1px solid #817f7f;
  margin-bottom: 12px;
}

.tab-button {
  background: none;
  border: none;
  padding: 10px 0;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.tab-button.active {
  color: #4b9c6b;
  border-bottom: 2px solid #4b9c6b;
}

.tab-content {
  padding: 10px 0;
}

/* ✅ 模因按钮去除默认按钮样式 */
.meme-item {
  all: unset; /* ← 移除所有默认样式 */
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #edecef;
  padding-bottom: 8px;
  cursor: pointer;
  width: 600px;
}

/* ✅ 鼠标悬停效果（可选） */
.meme-item:hover {
  background: #6cc648;
}

.meme-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.meme-info {
  flex: 1;
}

.meme-name {
  font-weight: 600;
  margin: 0;
}

.meme-code {
  font-size: 12px;
  color: #999;
  margin: 2px 0;
}

.meme-desc {
  font-size: 14px;
  color: #555;
  margin: 0;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.pagination button {
  padding: 4px 12px;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Status Styles */
.status-bar {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.status-tag.pending {
  background: #e6a23c;
  color: #fff;
}

.status-tag.banned {
  background: #f56c6c;
  color: #fff;
}

.action-btn {
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn {
  background: #409eff;
}
.edit-btn:hover {
  background: #66b1ff;
}

.delete-btn {
  background: #f56c6c;
}
.delete-btn:hover {
  background: #ff7875;
}

/* ===================== 模因币列表样式 ===================== */
.token-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.08), rgba(94, 243, 140, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.token-card:hover {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.15), rgba(94, 243, 140, 0.1));
  border-color: rgba(127, 90, 240, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(127, 90, 240, 0.2);
}

.token-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.token-image {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(127, 90, 240, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.token-basic {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f7f9ff;
}

.token-ticker {
  margin: 0;
  font-size: 13px;
  color: #7f5af0;
  font-weight: 500;
}

.token-right {
  display: flex;
  gap: 24px;
  align-items: center;
}

.token-amount,
.token-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.amount-label,
.value-label {
  font-size: 11px;
  color: #8ea0c2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: #5ef38c;
}

.value-number {
  font-size: 16px;
  font-weight: 600;
  color: #ffd166;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #8ea0c2;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .empty-hint {
  font-size: 13px;
  color: #6b7a99;
}

/* ===================== 自选列表样式 ===================== */
.watchlist-section,
.creator-dashboard-section {
  padding: 20px;
}

.watchlist-header,
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.watchlist-header h3,
.dashboard-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #f7f9ff;
  margin: 0;
}

.view-all-btn {
  color: #7f5af0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #5ef38c;
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.watchlist-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.watchlist-card:hover {
  background: rgba(127, 90, 240, 0.1);
  border-color: rgba(127, 90, 240, 0.3);
}

.watchlist-image {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
}

.watchlist-info {
  flex: 1;
  min-width: 0;
}

.watchlist-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.watchlist-info .ticker {
  font-size: 12px;
  color: #7f5af0;
}

.watchlist-price {
  text-align: right;
}

.watchlist-price .price {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.watchlist-price .change {
  font-size: 12px;
}

.watchlist-price .change.positive {
  color: #5ef38c;
}

.watchlist-price .change.negative {
  color: #ff5d8f;
}

/* ===================== 创作者数据样式 ===================== */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(94, 243, 140, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 14px;
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
  font-size: 20px;
  font-weight: 700;
  color: #f7f9ff;
}

.stat-label {
  font-size: 12px;
  color: #8ea0c2;
}

.quick-link-hint {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.quick-link-hint p {
  margin: 0;
  font-size: 13px;
  color: #8ea0c2;
}
</style>
