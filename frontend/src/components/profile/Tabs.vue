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

    <!-- Tab 内容 -->
    <div class="tab-content">
      

      <!-- 创作者数据 -->
      <template v-if="activeTab === '创作者数据'">
        <div class="creator-dashboard-section">
          <div class="dashboard-header">
            <h3>📊 创作者数据概览</h3>
            <router-link to="/creator-dashboard" class="view-all-btn">查看详情 →</router-link>
          </div>
          <div class="dashboard-stats">
            <div class="stat-card">
              <span class="stat-icon">💰</span>
              <div class="stat-content">
                <span class="stat-value">${{ creatorStats.totalEarnings?.toFixed(2) || '0.00' }}</span>
                <span class="stat-label">总收益</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📈</span>
              <div class="stat-content">
                <span class="stat-value">{{ creatorStats.totalMemes || 0 }}</span>
                <span class="stat-label">创建模因</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">👥</span>
              <div class="stat-content">
                <span class="stat-value">{{ creatorStats.totalHolders || 0 }}</span>
                <span class="stat-label">持有人数</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">💎</span>
              <div class="stat-content">
                <span class="stat-value">${{ formatVolume(creatorStats.totalVolume) }}</span>
                <span class="stat-label">交易量</span>
              </div>
            </div>
          </div>
          <div class="quick-link-hint">
            <p>点击"查看详情"获取完整的收益分析、粉丝统计和交易明细</p>
          </div>
        </div>
      </template>

      <!-- 粉丝 / 关注列表：仅自己可见 -->
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

      <!-- 模因币列表：显示持仓信息 -->
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
                <span class="amount-label">持有数量</span>
                <span class="amount-value">{{ formatNumber(token.amount) }}</span>
              </div>
              <div class="token-value">
                <span class="value-label">估值</span>
                <span class="value-number">{{ formatCurrency(token.value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="pagedMemes.length === 0" class="empty-state">
          <p>🪙 暂无持有的模因币</p>
          <p class="empty-hint">去交易页面购买你看好的模因币吧！</p>
        </div>
      </template>

      <!-- 模因列表：显示模因信息 -->
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
            <p class="meme-code">代号: {{ meme.code }}</p>
            <p class="meme-desc">{{ meme.description }}</p>
            
            <div v-if="isOwnProfile && activeTab.includes('创作的模因')" class="status-bar">
               <span v-if="meme.status === 'pending'" class="status-tag pending">⏳ 审核中</span>
               <span v-if="meme.status === 'banned'" class="status-tag banned">❌ 已拒绝</span>
               
               <button 
                 v-if="meme.status === 'banned'" 
                 class="action-btn edit-btn"
                 @click.stop="goToEdit(meme.id)"
               >
                 重新修改
               </button>
               <button 
                 v-if="meme.status === 'banned'" 
                 class="action-btn delete-btn"
                 @click.stop="deleteMeme(meme.id)"
               >
                 删除
               </button>
            </div>
          </div>
        </button>
        </div>
      </template>

      <!-- 分页按钮 -->
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
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
const server_ip = authStore.server_ip

const emit = defineEmits(['refresh'])

// ✅ 接收 props
const props = defineProps({
  userData: Object,
  isOwnProfile: {
    type: Boolean,
    default: true
  }
})

// 在模板中使用 isOwnProfile
const isOwnProfile = computed(() => props.isOwnProfile)

const userOnlyTabs = ['关注', '粉丝', '创作者数据']

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
    console.error('获取自选列表失败:', error)
  }
}

// 从API获取创作者数据
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
    console.error('获取创作者数据失败:', error)
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

// 根据性别获取代词
const getPronoun = (user) => {
  if (!user) return '他'

  // 如果后端有性别字段，优先使用
  if (user.gender) {
    return user.gender === 'female' ? '她' : '他'
  }

  // 简单的昵称启发式检测（可根据需要扩展）
  const nickname = user.nickname || user.username || ''

  // 常见女性昵称后缀
  const femaleSuffixes = ['妹', '姐', '妈', '婆', '娘', '女', '仙子', '公主']
  const femalePrefixes = ['小', '美', '甜']

  // 检查是否包含女性标识词
  const hasFemaleIndicator =
    femaleSuffixes.some(suffix => nickname.includes(suffix)) ||
    femalePrefixes.some(prefix => nickname.includes(prefix)) ||
    nickname.includes('girl') || nickname.includes('women') ||
    nickname.match(/[♀♀]/)

  // 检查是否包含男性标识词
  const maleSuffixes = ['哥', '弟', '爸', '叔', '爷', '男', '先生', '帅哥']
  const hasMaleIndicator =
    maleSuffixes.some(suffix => nickname.includes(suffix)) ||
    nickname.includes('boy') || nickname.includes('man') ||
    nickname.match(/[♂♂]/)

  // 如果检测到女性标识，使用"她"
  if (hasFemaleIndicator && !hasMaleIndicator) {
    return '她'
  }

  // 默认使用"他"
  return '他'
}

// Tabs - 如果是自己的主页，显示"我"；如果不是，显示"他/她"
const tabs = computed(() => {
  const pronoun = props.isOwnProfile ? '我' : getPronoun(props.userData)
  const baseTabs = [`${pronoun}创作的模因`, `${pronoun}的模因币`, `${pronoun}的收藏`]
  if (props.isOwnProfile) {
    return [...baseTabs, ...userOnlyTabs]
  }
  return baseTabs
})

// 获取当前标签页的正确代词
const getCurrentPronoun = () => {
  return props.isOwnProfile ? '我' : getPronoun(props.userData)
}

// 获取初始标签
const getInitialTab = () => {
  const pronoun = getCurrentPronoun()
  return `${pronoun}创作的模因`
}

// 初始激活标签需要根据 isOwnProfile 动态设置
const activeTab = ref(getInitialTab())

// 监听变化并更新标签
watch(() => [props.isOwnProfile, props.userData], () => {
  const newTab = getInitialTab()
  if (activeTab.value && (activeTab.value.includes('创作的模因') || activeTab.value.includes('的模因币') || activeTab.value.includes('的收藏'))) {
    // 如果当前标签是包含代词的标签，更新代词部分
    const tabType = activeTab.value.replace(/[我他她]创作的模因|[我他她]的模因币|[我他她]的收藏/g, '')
    const pronoun = getCurrentPronoun()

    // 根据标签类型重新构建标签名
    if (activeTab.value.includes('模因币')) {
      activeTab.value = `${pronoun}的模因币`
    } else if (activeTab.value.includes('收藏')) {
      activeTab.value = `${pronoun}的收藏`
    } else {
      activeTab.value = newTab
    }
  }
}, { immediate: true })

// 初始化数据
onMounted(() => {
  if (props.isOwnProfile) {
    fetchWatchlist()
    fetchCreatorStats()
  }
})

// 监听是否是自己的主页，变化时重新加载
watch(() => props.isOwnProfile, (newVal) => {
  if (newVal) {
    fetchWatchlist()
    fetchCreatorStats()
  }
})

const isUserListTab = computed(() => isOwnProfile.value && ['关注', '粉丝'].includes(activeTab.value))

// 判断是否是模因币标签页
const isTokenTab = computed(() => activeTab.value.includes('模因币'))

// 格式化数字（千分位）
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 格式化货币
const formatCurrency = (num) => {
  if (num === undefined || num === null) return '¥0.00'
  return '¥' + Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 当前页
const currentPage = ref(1)
const itemsPerPage = 4

// 每次切换 tab，重置分页
watch(activeTab, () => {
  currentPage.value = 1
})

// ✅ 点击跳转函数
const goToMemeDetail = (id) => {
  router.push(`/meme/${id}`)
}

// 跳转到用户个人主页
const goToUserProfile = (username) => {
  // 移除 @ 符号（如果有）
  const cleanUsername = username.replace('@', '')
  router.push(`/profile/${cleanUsername}`)
}

// 跳转到编辑页面
const goToEdit = (id) => {
  router.push(`/create-meme?id=${id}`)
}

// 删除模因
const deleteMeme = async (id) => {
  if (!confirm('确定要删除这个模因吗？此操作无法撤销。')) return

  try {
    const res = await fetch(`${server_ip}/api/meme/${id}`, {
      method: 'DELETE',
      headers: {
        'token': authStore.username || authStore.token || ''
      }
    })
    
    // 尝试解析 JSON
    let data = {}
    try {
      data = await res.json()
    } catch (e) {}

    if (res.ok) {
      alert('删除成功')
      emit('refresh')
    } else {
      alert(data.message || '删除失败')
    }
  } catch (e) {
    console.error(e)
    alert('网络错误，请稍后重试')
  }
}

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 获取头像URL，如果为空则使用默认头像
const getAvatarUrl = (avatar, id) => {
  if (avatar && avatar.trim() !== '') {
    return avatar
  }
  // 如果avatar为空，使用ID生成一个简单的头像
  // 将ID转换为数字用于pravatar.cc
  if (id) {
    // 使用ID的hash值生成一个1-70之间的数字
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

// 头像加载失败时的处理
const handleAvatarError = (event) => {
  // 如果当前不是默认头像，则切换到默认头像
  if (event.target.src !== defaultAvatar) {
    event.target.src = defaultAvatar
  }
}

// 计算当前页数据
const pagedMemes = computed(() => {
  if (!props.userData || !props.userData.memesData) return []
  const allMemes = props.userData.memesData[activeTab.value] || []
  console.log('当前标签页:', activeTab.value, '数据:', allMemes)
  const start = (currentPage.value - 1) * itemsPerPage
  return allMemes.slice(start, start + itemsPerPage)
})

// 总页数
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
