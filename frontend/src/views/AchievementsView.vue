<template>
  <div class="achievements-page">
    <header class="page-header">
      <h1 class="title">🏅 Achievements Center</h1>
      <p class="subtitle">Complete challenges, unlock badges, and showcase your meme prowess</p>
    </header>

    <!-- 用户等级卡片 -->
    <div class="level-card">
      <div class="level-info">
        <div class="level-badge">
          <span class="level-icon">{{ getLevelIcon(userLevel) }}</span>
          <span class="level-number">Lv.{{ userLevel }}</span>
        </div>
        <div class="level-details">
          <h2 class="level-title">{{ getLevelTitle(userLevel) }}</h2>
          <p class="level-desc">{{ getLevelDescription(userLevel) }}</p>
        </div>
      </div>
      <div class="exp-progress">
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: `${expProgress}%` }"></div>
        </div>
        <div class="exp-text">
          <span>{{ currentExp }} / {{ nextLevelExp }} EXP</span>
          <span>{{ nextLevelExp - currentExp }} EXP to next level</span>
        </div>
      </div>
      <div class="level-perks">
        <h4>Current Level Perks</h4>
        <ul class="perks-list">
          <li v-for="perk in currentPerks" :key="perk">{{ perk }}</li>
        </ul>
      </div>
    </div>

    <!-- 成就统计 -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-icon">🏆</span>
        <div class="stat-content">
          <span class="stat-value">{{ unlockedCount }}/{{ totalAchievements }}</span>
          <span class="stat-label">Achievements Unlocked</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⭐</span>
        <div class="stat-content">
          <span class="stat-value">{{ totalPoints }}</span>
          <span class="stat-label">Achievement Points</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔥</span>
        <div class="stat-content">
          <span class="stat-value">{{ rareCount }}</span>
          <span class="stat-label">Rare Achievements</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📈</span>
        <div class="stat-content">
          <span class="stat-value">{{ completionRate }}%</span>
          <span class="stat-label">Completion Rate</span>
        </div>
      </div>
    </div>

    <!-- 成就分类 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['cat-btn', { active: activeCategory === cat.id }]"
        @click="activeCategory = cat.id"
      >
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-name">{{ cat.name }}</span>
        <span class="cat-count">{{ getCategoryCount(cat.id) }}</span>
      </button>
    </div>

    <!-- 成就列表 -->
    <div class="achievements-grid">
      <div
        v-for="achievement in filteredAchievements"
        :key="achievement.id"
        :class="['achievement-card', { unlocked: achievement.unlocked, rare: achievement.rarity === 'rare', legendary: achievement.rarity === 'legendary' }]"
      >
        <div class="achievement-icon">
          <span class="icon">{{ achievement.icon }}</span>
          <span v-if="!achievement.unlocked" class="lock-overlay">🔒</span>
        </div>
        <div class="achievement-content">
          <h3 class="achievement-title">{{ achievement.title }}</h3>
          <p class="achievement-desc">{{ achievement.description }}</p>
          <div v-if="achievement.progress !== undefined" class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${achievement.progress}%` }"></div>
            </div>
            <span class="progress-text">{{ achievement.current }}/{{ achievement.target }}</span>
          </div>
          <div class="achievement-meta">
            <span :class="['rarity-badge', achievement.rarity]">{{ getRarityText(achievement.rarity) }}</span>
            <span class="points">+{{ achievement.points }} pts</span>
          </div>
        </div>
        <div v-if="achievement.unlocked" class="unlock-time">
          {{ formatUnlockTime(achievement.unlockedAt) }}
        </div>
      </div>
    </div>

    <!-- 称号系统 -->
    <div class="titles-section">
      <h2 class="section-title">🎖️ My Titles</h2>
      <div class="titles-grid">
        <div
          v-for="title in userTitles"
          :key="title.id"
          :class="['title-card', { active: title.isActive, locked: !title.unlocked }]"
          @click="title.unlocked && setActiveTitle(title.id)"
        >
          <span class="title-text" :style="{ color: title.color }">{{ title.name }}</span>
          <p class="title-desc">{{ title.description }}</p>
          <span v-if="title.isActive" class="active-badge">Active</span>
          <span v-else-if="!title.unlocked" class="locked-badge">Locked</span>
        </div>
      </div>
    </div>

    <!-- 最近解锁 -->
    <div class="recent-section">
      <h2 class="section-title">🆕 Recently Unlocked</h2>
      <div class="recent-list">
        <div v-for="item in recentUnlocks" :key="item.id" class="recent-item">
          <span class="recent-icon">{{ item.icon }}</span>
          <div class="recent-info">
            <span class="recent-title">{{ item.title }}</span>
            <span class="recent-time">{{ formatUnlockTime(item.unlockedAt) }}</span>
          </div>
          <span class="recent-points">+{{ item.points }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const serverIp = authStore.server_ip

// 用户等级数据
const userLevel = ref(5)
const currentExp = ref(2350)
const nextLevelExp = ref(3000)
const expProgress = computed(() => (currentExp.value / nextLevelExp.value) * 100)

// 成就数据
const achievements = ref([])
const activeCategory = ref('all')
const userTitles = ref([])

// 成就分类
const categories = [
  { id: 'all', name: 'All', icon: '🎯' },
  { id: 'trading', name: 'Trading', icon: '💰' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'creation', name: 'Creation', icon: '🎨' },
  { id: 'collection', name: 'Collection', icon: '📦' },
  { id: 'special', name: 'Special', icon: '⭐' }
]

// 计算属性
const filteredAchievements = computed(() => {
  if (activeCategory.value === 'all') return achievements.value
  return achievements.value.filter(a => a.category === activeCategory.value)
})

const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length)
const totalAchievements = computed(() => achievements.value.length)
const totalPoints = computed(() =>
  achievements.value.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)
)
const rareCount = computed(() =>
  achievements.value.filter(a => a.unlocked && (a.rarity === 'rare' || a.rarity === 'legendary')).length
)
const completionRate = computed(() =>
  totalAchievements.value > 0 ? Math.round((unlockedCount.value / totalAchievements.value) * 100) : 0
)

const recentUnlocks = computed(() =>
  achievements.value
    .filter(a => a.unlocked)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 5)
)

const currentPerks = computed(() => {
  const perks = []
  if (userLevel.value >= 1) perks.push('🎁 Daily check-in bonus +10%')
  if (userLevel.value >= 3) perks.push('💬 Comment section badge')
  if (userLevel.value >= 5) perks.push('🎨 Custom profile background')
  if (userLevel.value >= 8) perks.push('⚡ Trading fee -5%')
  if (userLevel.value >= 10) perks.push('👑 VIP exclusive title')
  return perks
})

// 方法
const getLevelIcon = (level) => {
  if (level >= 10) return '👑'
  if (level >= 8) return '💎'
  if (level >= 5) return '🌟'
  if (level >= 3) return '⭐'
  return '🌱'
}

const getLevelTitle = (level) => {
  if (level >= 10) return 'Meme Master'
  if (level >= 8) return 'Veteran Player'
  if (level >= 5) return 'Advanced Player'
  if (level >= 3) return 'Active User'
  return 'Newcomer'
}

const getLevelDescription = (level) => {
  if (level >= 10) return 'You are a legend in the meme community!'
  if (level >= 8) return 'Your meme instincts are impressive.'
  if (level >= 5) return 'You are on the path to becoming a meme pro.'
  if (level >= 3) return 'Keep going — you are getting stronger.'
  return 'Welcome to the meme world. Start your adventure!'
}

const getRarityText = (rarity) => {
  const map = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Epic',
    legendary: 'Legendary'
  }
  return map[rarity] || 'Common'
}

const getCategoryCount = (catId) => {
  if (catId === 'all') {
    return `${unlockedCount.value}/${totalAchievements.value}`
  }
  const catAchievements = achievements.value.filter(a => a.category === catId)
  const unlocked = catAchievements.filter(a => a.unlocked).length
  return `${unlocked}/${catAchievements.length}`
}

const formatUnlockTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US')
}

const setActiveTitle = async (titleId) => {
  // TODO: 调用API设置当前称号
  userTitles.value = userTitles.value.map(t => ({
    ...t,
    isActive: t.id === titleId
  }))
}

// 初始化数据
const initAchievements = () => {
  achievements.value = [
    // 交易类
    { id: 'first_trade', title: 'First Trade', description: 'Complete your first trade', icon: '🎉', category: 'trading', rarity: 'common', points: 10, unlocked: true, unlockedAt: '2024-01-15' },
    { id: 'trade_10', title: 'Trading Novice', description: 'Complete 10 trades', icon: '📊', category: 'trading', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-20', progress: 100, current: 10, target: 10 },
    { id: 'trade_100', title: 'Trading Enthusiast', description: 'Complete 100 trades', icon: '💹', category: 'trading', rarity: 'uncommon', points: 50, unlocked: false, progress: 45, current: 45, target: 100 },
    { id: 'trade_1000', title: 'Trading Master', description: 'Complete 1000 trades', icon: '🏆', category: 'trading', rarity: 'rare', points: 200, unlocked: false, progress: 4.5, current: 45, target: 1000 },
    { id: 'profit_100', title: 'Nice Profit', description: 'Earn over 100 USDT in a single trade', icon: '💰', category: 'trading', rarity: 'uncommon', points: 30, unlocked: true, unlockedAt: '2024-02-01' },
    { id: 'profit_1000', title: 'Big Winner', description: 'Earn over 1000 USDT in a single trade', icon: '💎', category: 'trading', rarity: 'rare', points: 100, unlocked: false },

    // 社交类
    { id: 'first_follow', title: 'Make a Friend', description: 'Follow your first user', icon: '👋', category: 'social', rarity: 'common', points: 10, unlocked: true, unlockedAt: '2024-01-10' },
    { id: 'followers_10', title: 'Rising Star', description: 'Reach 10 followers', icon: '👥', category: 'social', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-25', progress: 100, current: 10, target: 10 },
    { id: 'followers_100', title: 'Community Star', description: 'Reach 100 followers', icon: '⭐', category: 'social', rarity: 'uncommon', points: 50, unlocked: false, progress: 35, current: 35, target: 100 },
    { id: 'followers_1000', title: 'Meme Influencer', description: 'Reach 1000 followers', icon: '🌟', category: 'social', rarity: 'rare', points: 200, unlocked: false, progress: 3.5, current: 35, target: 1000 },
    { id: 'comment_king', title: 'Comment King', description: 'Post 100 comments', icon: '💬', category: 'social', rarity: 'uncommon', points: 40, unlocked: false, progress: 62, current: 62, target: 100 },

    // 创作类
    { id: 'first_meme', title: 'Creator', description: 'Create your first meme', icon: '🎨', category: 'creation', rarity: 'common', points: 15, unlocked: true, unlockedAt: '2024-01-12' },
    { id: 'meme_approved', title: 'Approved', description: 'A meme passes official review', icon: '✅', category: 'creation', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-13' },
    { id: 'meme_popular', title: 'Popular Meme', description: 'One meme reaches 100 likes', icon: '❤️', category: 'creation', rarity: 'uncommon', points: 50, unlocked: false, progress: 78, current: 78, target: 100 },
    { id: 'meme_viral', title: 'Goes Viral', description: 'One meme reaches 1000 likes', icon: '🔥', category: 'creation', rarity: 'rare', points: 150, unlocked: false, progress: 7.8, current: 78, target: 1000 },

    // 收藏类
    { id: 'collector_start', title: 'Collector', description: 'Collect 10 memes', icon: '📦', category: 'collection', rarity: 'common', points: 15, unlocked: true, unlockedAt: '2024-01-18', progress: 100, current: 10, target: 10 },
    { id: 'collector_pro', title: 'Pro Collector', description: 'Collect 50 memes', icon: '🗃️', category: 'collection', rarity: 'uncommon', points: 40, unlocked: false, progress: 56, current: 28, target: 50 },
    { id: 'diverse_holder', title: 'Diverse Holder', description: 'Hold 10 different meme coins', icon: '🌈', category: 'collection', rarity: 'uncommon', points: 35, unlocked: false, progress: 70, current: 7, target: 10 },

    // 特殊类
    { id: 'early_bird', title: 'Early Bird', description: 'Register in the first month after launch', icon: '🐦', category: 'special', rarity: 'rare', points: 100, unlocked: true, unlockedAt: '2024-01-01' },
    { id: 'lucky_draw', title: 'Lucky One', description: 'Win a legendary reward in a draw', icon: '🍀', category: 'special', rarity: 'legendary', points: 300, unlocked: false },
    { id: 'whale', title: 'Whale', description: 'Hold over 10,000 USDT worth of meme coins', icon: '🐋', category: 'special', rarity: 'legendary', points: 500, unlocked: false },
    { id: 'diamond_hands', title: 'Diamond Hands', description: 'Hold the same meme coin for 30+ days', icon: '💎', category: 'special', rarity: 'rare', points: 100, unlocked: false, progress: 60, current: 18, target: 30 }
  ]

  userTitles.value = [
    { id: 'default', name: 'Meme Player', description: 'Default title', color: '#888', unlocked: true, isActive: false },
    { id: 'trader', name: 'Trading Expert', description: 'Unlock by completing 100 trades', color: '#00d084', unlocked: false, isActive: false },
    { id: 'creator', name: 'Creation Master', description: 'Unlock by creating 10 memes', color: '#7f5af0', unlocked: true, isActive: true },
    { id: 'collector', name: 'Collector Tycoon', description: 'Unlock by collecting 100 memes', color: '#ffd700', unlocked: false, isActive: false },
    { id: 'influencer', name: 'Community Leader', description: 'Unlock by reaching 1000 followers', color: '#ff6b35', unlocked: false, isActive: false },
    { id: 'whale', name: 'Meme Whale', description: 'Unlock by holding over 10,000 USDT value', color: '#00bfff', unlocked: false, isActive: false },
    { id: 'legend', name: 'Legendary Player', description: 'Unlock all legendary achievements', color: '#ff3b69', unlocked: false, isActive: false }
  ]
}

onMounted(() => {
  initAchievements()
  // TODO: 从API获取用户成就数据
})
</script>

<style scoped>
.achievements-page {
  max-width: 1200px;
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

/* 等级卡片 */
.level-card {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.15), rgba(46, 196, 182, 0.1));
  border: 1px solid rgba(127, 90, 240, 0.3);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #7f5af0, #2ec4b6);
  border-radius: 16px;
}

.level-icon {
  font-size: 36px;
}

.level-number {
  font-size: 18px;
  font-weight: 700;
}

.level-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
}

.level-desc {
  color: #888;
  margin: 0;
}

.exp-progress {
  margin-bottom: 20px;
}

.exp-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #7f5af0, #2ec4b6);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.exp-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #888;
}

.level-perks h4 {
  font-size: 14px;
  color: #888;
  margin: 0 0 10px;
}

.perks-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.perks-list li {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 13px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
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

/* 分类标签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.cat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.cat-btn.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.2), rgba(46, 196, 182, 0.1));
  border-color: rgba(127, 90, 240, 0.4);
  color: #fff;
}

.cat-count {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
}

/* 成就网格 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.achievement-card {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.3s;
}

.achievement-card:not(.unlocked) {
  opacity: 0.6;
}

.achievement-card.unlocked {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(127, 90, 240, 0.2);
}

.achievement-card.rare.unlocked {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(255, 107, 53, 0.05));
  border-color: rgba(127, 90, 240, 0.4);
}

.achievement-card.legendary.unlocked {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 59, 105, 0.05));
  border-color: rgba(255, 215, 0, 0.4);
}

.achievement-icon {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-shrink: 0;
}

.achievement-icon .icon {
  font-size: 28px;
}

.lock-overlay {
  position: absolute;
  font-size: 16px;
  bottom: -4px;
  right: -4px;
}

.achievement-content {
  flex: 1;
  min-width: 0;
}

.achievement-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.achievement-desc {
  font-size: 13px;
  color: #888;
  margin: 0 0 10px;
}

.achievement-progress {
  margin-bottom: 10px;
}

.achievement-progress .progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.achievement-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7f5af0, #2ec4b6);
  border-radius: 3px;
}

.achievement-progress .progress-text {
  font-size: 11px;
  color: #666;
}

.achievement-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rarity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.rarity-badge.common {
  background: rgba(136, 136, 136, 0.2);
  color: #888;
}

.rarity-badge.uncommon {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.rarity-badge.rare {
  background: rgba(127, 90, 240, 0.2);
  color: #7f5af0;
}

.rarity-badge.legendary {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.points {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
}

.unlock-time {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 11px;
  color: #666;
}

/* 称号系统 */
.titles-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.titles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.title-card {
  position: relative;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.title-card:not(.locked):hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.title-card.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.15), rgba(46, 196, 182, 0.1));
  border-color: rgba(127, 90, 240, 0.4);
}

.title-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.title-text {
  font-size: 16px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

.title-desc {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.active-badge,
.locked-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.active-badge {
  background: #00d084;
  color: #000;
}

.locked-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
}

/* 最近解锁 */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.recent-icon {
  font-size: 24px;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-title {
  font-weight: 600;
}

.recent-time {
  font-size: 12px;
  color: #666;
}

.recent-points {
  color: #ffd700;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .level-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>

