<template>
  <div class="achievements-page">
    <header class="page-header">
      <h1 class="title">🏅 成就中心</h1>
      <p class="subtitle">完成挑战，解锁徽章，展示你的模因实力</p>
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
          <span>距离下一级还需 {{ nextLevelExp - currentExp }} EXP</span>
        </div>
      </div>
      <div class="level-perks">
        <h4>当前等级特权</h4>
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
          <span class="stat-label">已解锁成就</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⭐</span>
        <div class="stat-content">
          <span class="stat-value">{{ totalPoints }}</span>
          <span class="stat-label">成就点数</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔥</span>
        <div class="stat-content">
          <span class="stat-value">{{ rareCount }}</span>
          <span class="stat-label">稀有成就</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📈</span>
        <div class="stat-content">
          <span class="stat-value">{{ completionRate }}%</span>
          <span class="stat-label">完成率</span>
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
            <span class="points">+{{ achievement.points }} 点</span>
          </div>
        </div>
        <div v-if="achievement.unlocked" class="unlock-time">
          {{ formatUnlockTime(achievement.unlockedAt) }}
        </div>
      </div>
    </div>

    <!-- 称号系统 -->
    <div class="titles-section">
      <h2 class="section-title">🎖️ 我的称号</h2>
      <div class="titles-grid">
        <div
          v-for="title in userTitles"
          :key="title.id"
          :class="['title-card', { active: title.isActive, locked: !title.unlocked }]"
          @click="title.unlocked && setActiveTitle(title.id)"
        >
          <span class="title-text" :style="{ color: title.color }">{{ title.name }}</span>
          <p class="title-desc">{{ title.description }}</p>
          <span v-if="title.isActive" class="active-badge">使用中</span>
          <span v-else-if="!title.unlocked" class="locked-badge">未解锁</span>
        </div>
      </div>
    </div>

    <!-- 最近解锁 -->
    <div class="recent-section">
      <h2 class="section-title">🆕 最近解锁</h2>
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
  { id: 'all', name: '全部', icon: '🎯' },
  { id: 'trading', name: '交易', icon: '💰' },
  { id: 'social', name: '社交', icon: '👥' },
  { id: 'creation', name: '创作', icon: '🎨' },
  { id: 'collection', name: '收藏', icon: '📦' },
  { id: 'special', name: '特殊', icon: '⭐' }
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
  if (userLevel.value >= 1) perks.push('🎁 每日签到奖励 +10%')
  if (userLevel.value >= 3) perks.push('💬 评论区专属标识')
  if (userLevel.value >= 5) perks.push('🎨 自定义个人主页背景')
  if (userLevel.value >= 8) perks.push('⚡ 交易手续费 -5%')
  if (userLevel.value >= 10) perks.push('👑 VIP专属称号')
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
  if (level >= 10) return '模因大师'
  if (level >= 8) return '资深玩家'
  if (level >= 5) return '进阶玩家'
  if (level >= 3) return '活跃用户'
  return '新手玩家'
}

const getLevelDescription = (level) => {
  if (level >= 10) return '你已经是模因社区的传奇人物！'
  if (level >= 8) return '你的模因眼光独到，令人敬佩'
  if (level >= 5) return '你正在成为模因高手的路上'
  if (level >= 3) return '继续努力，你会变得更强'
  return '欢迎来到模因世界，开始你的冒险吧！'
}

const getRarityText = (rarity) => {
  const map = {
    common: '普通',
    uncommon: '稀有',
    rare: '史诗',
    legendary: '传说'
  }
  return map[rarity] || '普通'
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
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
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
    { id: 'first_trade', title: '初次交易', description: '完成第一笔交易', icon: '🎉', category: 'trading', rarity: 'common', points: 10, unlocked: true, unlockedAt: '2024-01-15' },
    { id: 'trade_10', title: '交易新手', description: '完成10笔交易', icon: '📊', category: 'trading', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-20', progress: 100, current: 10, target: 10 },
    { id: 'trade_100', title: '交易达人', description: '完成100笔交易', icon: '💹', category: 'trading', rarity: 'uncommon', points: 50, unlocked: false, progress: 45, current: 45, target: 100 },
    { id: 'trade_1000', title: '交易大师', description: '完成1000笔交易', icon: '🏆', category: 'trading', rarity: 'rare', points: 200, unlocked: false, progress: 4.5, current: 45, target: 1000 },
    { id: 'profit_100', title: '小赚一笔', description: '单笔交易盈利超过100 USDT', icon: '💰', category: 'trading', rarity: 'uncommon', points: 30, unlocked: true, unlockedAt: '2024-02-01' },
    { id: 'profit_1000', title: '大赚特赚', description: '单笔交易盈利超过1000 USDT', icon: '💎', category: 'trading', rarity: 'rare', points: 100, unlocked: false },
    
    // 社交类
    { id: 'first_follow', title: '结交好友', description: '关注第一个用户', icon: '👋', category: 'social', rarity: 'common', points: 10, unlocked: true, unlockedAt: '2024-01-10' },
    { id: 'followers_10', title: '小有名气', description: '获得10个粉丝', icon: '👥', category: 'social', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-25', progress: 100, current: 10, target: 10 },
    { id: 'followers_100', title: '社区明星', description: '获得100个粉丝', icon: '⭐', category: 'social', rarity: 'uncommon', points: 50, unlocked: false, progress: 35, current: 35, target: 100 },
    { id: 'followers_1000', title: '模因网红', description: '获得1000个粉丝', icon: '🌟', category: 'social', rarity: 'rare', points: 200, unlocked: false, progress: 3.5, current: 35, target: 1000 },
    { id: 'comment_king', title: '评论之王', description: '发表100条评论', icon: '💬', category: 'social', rarity: 'uncommon', points: 40, unlocked: false, progress: 62, current: 62, target: 100 },
    
    // 创作类
    { id: 'first_meme', title: '创作者', description: '创建第一个模因', icon: '🎨', category: 'creation', rarity: 'common', points: 15, unlocked: true, unlockedAt: '2024-01-12' },
    { id: 'meme_approved', title: '审核通过', description: '模因通过官方审核', icon: '✅', category: 'creation', rarity: 'common', points: 20, unlocked: true, unlockedAt: '2024-01-13' },
    { id: 'meme_popular', title: '人气模因', description: '单个模因获得100个点赞', icon: '❤️', category: 'creation', rarity: 'uncommon', points: 50, unlocked: false, progress: 78, current: 78, target: 100 },
    { id: 'meme_viral', title: '病毒传播', description: '单个模因获得1000个点赞', icon: '🔥', category: 'creation', rarity: 'rare', points: 150, unlocked: false, progress: 7.8, current: 78, target: 1000 },
    
    // 收藏类
    { id: 'collector_start', title: '收藏家', description: '收藏10个模因', icon: '📦', category: 'collection', rarity: 'common', points: 15, unlocked: true, unlockedAt: '2024-01-18', progress: 100, current: 10, target: 10 },
    { id: 'collector_pro', title: '专业收藏家', description: '收藏50个模因', icon: '🗃️', category: 'collection', rarity: 'uncommon', points: 40, unlocked: false, progress: 56, current: 28, target: 50 },
    { id: 'diverse_holder', title: '多元持有', description: '同时持有10种不同模因币', icon: '🌈', category: 'collection', rarity: 'uncommon', points: 35, unlocked: false, progress: 70, current: 7, target: 10 },
    
    // 特殊类
    { id: 'early_bird', title: '早期用户', description: '在平台上线首月注册', icon: '🐦', category: 'special', rarity: 'rare', points: 100, unlocked: true, unlockedAt: '2024-01-01' },
    { id: 'lucky_draw', title: '幸运儿', description: '在抽奖中获得传说奖励', icon: '🍀', category: 'special', rarity: 'legendary', points: 300, unlocked: false },
    { id: 'whale', title: '巨鲸', description: '持有价值超过10000 USDT的模因币', icon: '🐋', category: 'special', rarity: 'legendary', points: 500, unlocked: false },
    { id: 'diamond_hands', title: '钻石手', description: '持有同一模因币超过30天', icon: '💎', category: 'special', rarity: 'rare', points: 100, unlocked: false, progress: 60, current: 18, target: 30 }
  ]
  
  userTitles.value = [
    { id: 'default', name: '模因玩家', description: '默认称号', color: '#888', unlocked: true, isActive: false },
    { id: 'trader', name: '交易达人', description: '完成100笔交易解锁', color: '#00d084', unlocked: false, isActive: false },
    { id: 'creator', name: '创作大师', description: '创建10个模因解锁', color: '#7f5af0', unlocked: true, isActive: true },
    { id: 'collector', name: '收藏大亨', description: '收藏100个模因解锁', color: '#ffd700', unlocked: false, isActive: false },
    { id: 'influencer', name: '社区领袖', description: '获得1000粉丝解锁', color: '#ff6b35', unlocked: false, isActive: false },
    { id: 'whale', name: '模因巨鲸', description: '持有价值超过10000 USDT解锁', color: '#00bfff', unlocked: false, isActive: false },
    { id: 'legend', name: '传奇玩家', description: '解锁所有传说成就', color: '#ff3b69', unlocked: false, isActive: false }
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

