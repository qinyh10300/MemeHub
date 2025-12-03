<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const STORAGE_KEY = 'memehub_gamification_state_v1'

const defaultTasks = [
  {
    id: 'daily-share',
    title: '分享一个模因',
    description: '在社区推荐页发布你今日最看好的模因/币种',
    rewardXp: 40,
    rewardCoins: 15,
    progress: 0,
    target: 1,
    type: 'daily',
    tag: '社交',
  },
  {
    id: 'daily-comment',
    title: '发布 3 条高质量评论',
    description: '与不同创作者互动，保持讨论热度',
    rewardXp: 55,
    rewardCoins: 20,
    progress: 0,
    target: 3,
    type: 'daily',
    tag: '互动',
  },
  {
    id: 'daily-like',
    title: '为 5 个模因点赞',
    description: '帮助社区发现宝藏项目',
    rewardXp: 35,
    rewardCoins: 10,
    progress: 0,
    target: 5,
    type: 'daily',
    tag: '轻松',
  },
  {
    id: 'growth-follow',
    title: '关注 2 名创作者',
    description: '构建你的模因情报网络',
    rewardXp: 80,
    rewardCoins: 30,
    progress: 0,
    target: 2,
    type: 'growth',
    tag: '成长',
  },
  {
    id: 'growth-trade',
    title: '完成 1 笔 C2C 交易',
    description: '在私信页完成一次安全交易',
    rewardXp: 120,
    rewardCoins: 60,
    progress: 0,
    target: 1,
    type: 'growth',
    tag: '价值',
  },
  {
    id: 'milestone-checkin',
    title: '连续签到 7 天',
    description: '每天登录，坚持活跃即可解锁徽章',
    rewardXp: 200,
    rewardCoins: 120,
    progress: 0,
    target: 7,
    type: 'milestone',
    tag: '里程碑',
  },
]

const cloneTasks = (tasks) => tasks.map((task) => ({ ...task }))

const createDefaultState = () => ({
  xp: 1860,
  coins: 520,
  badges: 6,
  energy: 78,
  streak: 0,
  lastCheckIn: null,
  checkIns: [],
  lastReward: null,
  tasks: cloneTasks(defaultTasks),
})

const gamificationState = ref(createDefaultState())
const activeTaskFilter = ref('daily')
const isDrawing = ref(false)
const xpPerLevel = 600

const rewardPool = [
  { id: 'xp-small', label: '+50 XP', type: 'xp', value: 50, rarity: '常规', weight: 30, accent: '#5ef38c' },
  { id: 'coin-mid', label: '+80 金币', type: 'coins', value: 80, rarity: '常规', weight: 26, accent: '#f9c80e' },
  { id: 'energy', label: '+15 体力', type: 'energy', value: 15, rarity: '稀有', weight: 16, accent: '#f18701' },
  { id: 'xp-large', label: '+150 XP', type: 'xp', value: 150, rarity: '稀有', weight: 12, accent: '#7f5af0' },
  { id: 'badge', label: '限定徽章', type: 'badge', value: 1, rarity: '传说', weight: 6, accent: '#ff5d8f' },
  { id: 'coin-big', label: '+200 金币', type: 'coins', value: 200, rarity: '史诗', weight: 10, accent: '#ffd166' },
]

const activityFeed = ref([
  { id: 'seed-1', label: '完成「分享模因」任务，获得 40 XP', time: '1 小时前', type: 'task' },
  { id: 'seed-2', label: '签到成功：+60 XP / +18 金币', time: '昨天', type: 'checkin' },
  { id: 'seed-3', label: '抽奖抽中 +80 金币', time: '2 天前', type: 'lottery' },
])

const snapshotStateToStorage = (state) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const hydrateState = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    gamificationState.value = {
      ...createDefaultState(),
      ...parsed,
      tasks: parsed.tasks ? parsed.tasks.map((task) => ({ ...task })) : cloneTasks(defaultTasks),
      checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : [],
    }
  } catch (error) {
    console.error('加载游戏化数据失败', error)
  }
}

const getDayKey = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

const pushActivity = (text, type) => {
  activityFeed.value.unshift({
    id: `${type}-${Date.now()}`,
    label: text,
    time: '刚刚',
    type,
  })
  if (activityFeed.value.length > 6) {
    activityFeed.value.pop()
  }
}

const hasCheckedInToday = computed(() => gamificationState.value.lastCheckIn === getDayKey())

const previewStreak = computed(() => {
  if (hasCheckedInToday.value) {
    return gamificationState.value.streak
  }
  return gamificationState.value.lastCheckIn === getDayKey(-1) ? gamificationState.value.streak + 1 : 1
})

const checkInRewardPreview = computed(() => ({
  streak: previewStreak.value,
  xp: 40 + previewStreak.value * 5,
  coins: 12 + Math.min(18, previewStreak.value * 3),
}))

const checkInTimeline = computed(() => {
  const labels = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      label: `周${labels[date.getDay()]}`,
      checked: gamificationState.value.checkIns?.includes(key),
      isToday: key === getDayKey(),
    }
  })
})

const playerLevel = computed(() => Math.floor(gamificationState.value.xp / xpPerLevel) + 1)
const levelProgress = computed(() => {
  const remainder = gamificationState.value.xp % xpPerLevel
  return Math.min(100, (remainder / xpPerLevel) * 100)
})
const nextLevelXp = computed(() => {
  const remainder = gamificationState.value.xp % xpPerLevel
  return remainder === 0 ? xpPerLevel : xpPerLevel - remainder
})

const completedTaskCount = computed(() => gamificationState.value.tasks.filter((task) => task.progress >= task.target).length)

const totalTaskProgress = computed(() => {
  const total = gamificationState.value.tasks.reduce((sum, task) => sum + task.target, 0)
  if (!total) return 0
  const done = gamificationState.value.tasks.reduce((sum, task) => sum + Math.min(task.progress, task.target), 0)
  return Math.round((done / total) * 100)
})

const filteredTasks = computed(() =>
  gamificationState.value.tasks.filter((task) => (activeTaskFilter.value ? task.type === activeTaskFilter.value : true))
)

const energyPercent = computed(() => Math.min(100, gamificationState.value.energy))

const weekMomentum = computed(() => Math.min(100, Math.round(previewStreak.value * 12 + completedTaskCount.value * 8)))

const lastReward = computed(() => gamificationState.value.lastReward)

const weightedRewardPick = () => {
  const totalWeight = rewardPool.reduce((sum, reward) => sum + reward.weight, 0)
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const reward of rewardPool) {
    cumulative += reward.weight
    if (roll <= cumulative) {
      return reward
    }
  }
  return rewardPool[0]
}

const applyReward = (reward) => {
  switch (reward.type) {
    case 'xp':
      gamificationState.value.xp += reward.value
      break
    case 'coins':
      gamificationState.value.coins += reward.value
      break
    case 'energy':
      gamificationState.value.energy = Math.min(100, gamificationState.value.energy + reward.value)
      break
    case 'badge':
      gamificationState.value.badges += reward.value
      break
    default:
      break
  }
}

const handleCheckIn = () => {
  if (hasCheckedInToday.value) return
  const todayKey = getDayKey()
  const { xp, coins, streak } = checkInRewardPreview.value
  if (!gamificationState.value.checkIns.includes(todayKey)) {
    gamificationState.value.checkIns.push(todayKey)
  }
  gamificationState.value.lastCheckIn = todayKey
  gamificationState.value.streak = streak
  gamificationState.value.xp += xp
  gamificationState.value.coins += coins
  gamificationState.value.energy = Math.min(100, gamificationState.value.energy + 6)
  gamificationState.value.tasks = gamificationState.value.tasks.map((task) =>
    task.id === 'milestone-checkin' && task.progress < task.target ? { ...task, progress: task.progress + 1 } : task
  )
  pushActivity(`签到成功：+${xp} XP / +${coins} 金币`, 'checkin')
}

const handleTaskProgress = (taskId) => {
  gamificationState.value.tasks = gamificationState.value.tasks.map((task) => {
    if (task.id !== taskId || task.progress >= task.target) {
      return task
    }
    const updatedProgress = task.progress + 1
    const updatedTask = { ...task, progress: updatedProgress }
    if (updatedProgress >= task.target) {
      gamificationState.value.xp += task.rewardXp
      gamificationState.value.coins += task.rewardCoins
      pushActivity(`完成「${task.title}」 +${task.rewardXp} XP / +${task.rewardCoins} 金币`, 'task')
    }
    return updatedTask
  })
}

const drawReward = () => {
  if (isDrawing.value) return
  isDrawing.value = true
  setTimeout(() => {
    const reward = weightedRewardPick()
    applyReward(reward)
    gamificationState.value.lastReward = reward
    pushActivity(`抽中 ${reward.label}`, 'lottery')
    isDrawing.value = false
  }, 1200)
}

onMounted(() => {
  hydrateState()
})

watch(
  gamificationState,
  (state) => {
    snapshotStateToStorage(state)
  },
  { deep: true }
)
</script>

<template>
  <div class="gamification-page">
    <header class="page-header glass-border">
      <div>
        <p class="eyebrow">游戏化中心</p>
        <h1>保持活跃，持续解锁模因玩家荣誉</h1>
        <p class="subtitle">
          签到、做任务、参与抽奖即可积累 XP 与社群金币，推进等级与徽章进度。所有记录都会为你的玩家身份背书。
        </p>
      </div>
      <div class="header-actions">
        <div class="chip">
          <span class="dot live"></span>
          连续签到 {{ gamificationState.streak }} 天
        </div>
        <button class="primary-btn" @click="handleCheckIn" :disabled="hasCheckedInToday">
          {{ hasCheckedInToday ? '今天已签到' : `立即签到 +${checkInRewardPreview.xp} XP` }}
        </button>
      </div>
    </header>

    <section class="stats-row">
      <article class="glass-card">
        <div class="card-header">
          <p>等级进度</p>
          <span>Lv {{ playerLevel }}</span>
        </div>
        <h2>{{ gamificationState.xp }} XP</h2>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: `${levelProgress}%` }"></div>
        </div>
        <p class="progress-tip">距离下一级还需 {{ nextLevelXp }} XP</p>
      </article>

      <article class="glass-card">
        <div class="card-header">
          <p>连续签到</p>
          <span>{{ gamificationState.streak }} 天</span>
        </div>
        <h2>{{ hasCheckedInToday ? '今日已完成' : `解锁 +${checkInRewardPreview.xp} XP` }}</h2>
        <p class="muted">下一次签到奖励 +{{ checkInRewardPreview.coins }} 金币</p>
        <div class="pill-row">
          <span class="pill">每日 +{{ checkInRewardPreview.xp }} XP</span>
          <span class="pill highlight">连击 x{{ previewStreak }}</span>
        </div>
      </article>

      <article class="glass-card">
        <div class="card-header">
          <p>社群金币</p>
          <span>可用于抽奖/加速</span>
        </div>
        <h2>{{ gamificationState.coins }}</h2>
        <p class="muted">徽章：{{ gamificationState.badges }} 枚</p>
        <div class="energy-track">
          <div class="energy-fill" :style="{ width: `${energyPercent}%` }"></div>
        </div>
        <p class="progress-tip">活跃度 {{ energyPercent }} / 100</p>
      </article>

      <article class="glass-card">
        <div class="card-header">
          <p>今日任务</p>
          <span>{{ completedTaskCount }}/{{ gamificationState.tasks.length }}</span>
        </div>
        <h2>{{ totalTaskProgress }}%</h2>
        <p class="muted">完成任务即可获得更多抽奖次数</p>
        <div class="chip secondary">周势能 +{{ weekMomentum }}</div>
      </article>
    </section>

    <section class="grid-two">
      <article class="glass-card checkin-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">签到日历</p>
            <h3>保持节奏，累积 streak</h3>
          </div>
          <button class="ghost-btn" @click="handleCheckIn" :disabled="hasCheckedInToday">
            {{ hasCheckedInToday ? '今日已签到' : '补上今天' }}
          </button>
        </header>
        <div class="checkin-calendar">
          <div
            v-for="day in checkInTimeline"
            :key="day.key"
            class="checkin-cell"
            :class="{ active: day.checked, today: day.isToday }"
          >
            <span>{{ day.label }}</span>
            <div class="dot" />
          </div>
        </div>
        <p class="muted calendar-tip">
          连续签到越久，奖励越高。满 {{ checkInRewardPreview.streak }} 天时解锁额外抽奖机会。
        </p>
      </article>

      <article class="glass-card lottery-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">命运抽奖</p>
            <h3>用人品赢取额外奖励</h3>
          </div>
          <span class="chip">消耗 50 金币</span>
        </header>
        <div class="lottery-body">
          <div class="wheel" :class="{ spinning: isDrawing }">
            <div class="wheel-center">
              <p>幸运值</p>
              <strong>{{ checkInRewardPreview.streak * 8 + completedTaskCount * 5 }}</strong>
            </div>
          </div>
          <div class="lottery-info">
            <p class="muted">奖池展示</p>
            <div class="reward-grid">
              <div v-for="reward in rewardPool" :key="reward.id" class="reward-chip" :style="{ borderColor: reward.accent }">
                <span class="dot" :style="{ background: reward.accent }"></span>
                <div>
                  <strong>{{ reward.label }}</strong>
                  <p>{{ reward.rarity }}</p>
                </div>
              </div>
            </div>
            <button class="primary-btn stretch" :disabled="isDrawing" @click="drawReward">
              {{ isDrawing ? '抽奖中...' : '现在抽一发' }}
            </button>
            <p v-if="lastReward" class="muted recent-reward">
              上次抽中：<span>{{ lastReward.label }}</span>
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="tasks-section glass-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">任务中心</p>
          <h3>完成任务即可翻倍成长</h3>
        </div>
        <div class="filter-row">
          <button
            v-for="type in ['daily', 'growth', 'milestone']"
            :key="type"
            class="filter-chip"
            :class="{ active: activeTaskFilter === type }"
            @click="activeTaskFilter = type"
          >
            {{ type === 'daily' ? '每日任务' : type === 'growth' ? '成长任务' : '里程碑' }}
          </button>
        </div>
      </header>

      <div class="task-list">
        <article v-for="task in filteredTasks" :key="task.id" class="task-item">
          <div class="task-main">
            <div>
              <div class="task-meta">
                <span class="task-tag">{{ task.tag }}</span>
                <span class="task-type">{{ task.type === 'daily' ? '每日' : task.type === 'growth' ? '成长' : '里程碑' }}</span>
              </div>
              <h4>{{ task.title }}</h4>
              <p class="muted">{{ task.description }}</p>
            </div>
            <div class="task-reward">
              <span>+{{ task.rewardXp }} XP</span>
              <span>+{{ task.rewardCoins }} 金币</span>
            </div>
          </div>
          <div class="task-footer">
            <div class="progress-track thin">
              <div class="progress-bar accent" :style="{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }" />
            </div>
            <span class="progress-tip">
              {{ task.progress }}/{{ task.target }}
            </span>
            <button class="ghost-btn" :disabled="task.progress >= task.target" @click="handleTaskProgress(task.id)">
              {{ task.progress >= task.target ? '已完成' : '去完成' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="grid-two last-row">
      <article class="glass-card activity-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">动态记录</p>
            <h3>最近的活跃轨迹</h3>
          </div>
        </header>
        <ul class="activity-feed">
          <li v-for="item in activityFeed" :key="item.id">
            <div class="timeline-dot" :class="item.type" />
            <div>
              <p>{{ item.label }}</p>
              <span class="muted">{{ item.time }}</span>
            </div>
          </li>
        </ul>
      </article>

      <article class="glass-card milestone-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">周势能</p>
            <h3>冲刺奖励预览</h3>
          </div>
        </header>
        <div class="milestone-body">
          <div class="radial-meter">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" />
              <circle
                class="progress"
                cx="60"
                cy="60"
                r="52"
                :stroke-dasharray="2 * Math.PI * 52"
                :stroke-dashoffset="2 * Math.PI * 52 * (1 - weekMomentum / 100)"
              />
            </svg>
            <div class="radial-label">
              <strong>{{ weekMomentum }}%</strong>
              <span>完成度</span>
            </div>
          </div>
          <ul class="milestone-list">
            <li>
              <span>50%+</span>
              <p>额外 1 次抽奖机会</p>
            </li>
            <li>
              <span>80%+</span>
              <p>双倍签到奖励</p>
            </li>
            <li>
              <span>100%</span>
              <p>限定动态相框 + 随机徽章</p>
            </li>
          </ul>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
:global(body) {
  background: #02040a;
}

.gamification-page {
  width: 100%;
  max-width: 1200px;
  padding: 32px 40px 80px;
  margin: 0 auto;
  color: #f7f9ff;
  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
}

.glass-border {
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.page-header {
  width: 100%;
  background: linear-gradient(135deg, rgba(46, 64, 89, 0.65), rgba(9, 16, 32, 0.9));
  border-radius: 24px;
  padding: 28px 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 12px;
  color: #8ea0c2;
  margin-bottom: 6px;
}

.subtitle {
  color: #a6b4ce;
  max-width: 620px;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: #d7e0ff;
}

.chip.secondary {
  background: rgba(157, 114, 255, 0.15);
  color: #caa8ff;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #60f2a3;
}

.dot.live {
  box-shadow: 0 0 10px rgba(96, 242, 163, 0.8);
}

.primary-btn {
  background: linear-gradient(135deg, #5ef38c, #2ec4b6);
  color: #011627;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(46, 196, 182, 0.35);
}

.ghost-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: border 0.2s ease, color 0.2s ease;
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-row {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.glass-card {
  background: linear-gradient(145deg, rgba(9, 14, 25, 0.92), rgba(7, 8, 15, 0.9));
  border-radius: 22px;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #a9b3c7;
  font-size: 14px;
}

.card-header span {
  color: #f1f5ff;
  font-weight: 600;
}

.glass-card h2 {
  margin: 16px 0 10px;
  font-size: 28px;
  letter-spacing: 0.5px;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-track.thin {
  height: 6px;
  flex: 1;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #5ef38c, #2ec4b6);
  border-radius: 999px;
}

.progress-bar.accent {
  background: linear-gradient(90deg, #7f5af0, #2cb67d);
}

.progress-tip {
  margin-top: 8px;
  color: #9aa7c2;
  font-size: 13px;
}

.muted {
  color: #7f8aa5;
  font-size: 13px;
}

.pill-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
}

.pill.highlight {
  background: rgba(94, 243, 140, 0.18);
  color: #7fffd4;
}

.energy-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.08);
}

.energy-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd166, #ff6b6b);
}

.grid-two {
  margin-top: 28px;
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.checkin-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
}

.checkin-cell {
  padding: 14px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  text-align: center;
  color: #8996b2;
  border: 1px solid transparent;
  transition: border 0.2s ease, background 0.2s ease;
}

.checkin-cell .dot {
  margin: 8px auto 0;
  background: rgba(255, 255, 255, 0.12);
}

.checkin-cell.active {
  border-color: rgba(94, 243, 140, 0.5);
  color: #e9ffe2;
}

.checkin-cell.active .dot {
  background: #5ef38c;
  box-shadow: 0 0 8px rgba(94, 243, 140, 0.6);
}

.checkin-cell.today {
  background: rgba(94, 243, 140, 0.1);
}

.calendar-tip {
  margin-top: 16px;
}

.lottery-body {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.wheel {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: conic-gradient(#5ef38c, #2ec4b6, #7f5af0, #ff5d8f, #ffd166, #5ef38c);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.wheel.spinning {
  transform: rotate(695deg);
}

.wheel-center {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: rgba(2, 5, 12, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin: 10px 0 14px;
}

.reward-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.reward-chip strong {
  display: block;
  color: #f7f9ff;
}

.reward-chip p {
  margin: 0;
  font-size: 12px;
  color: #9eb2d0;
}

.lottery-info .primary-btn.stretch {
  width: 100%;
  margin-top: 8px;
}

.recent-reward span {
  color: #f9c80e;
}

.tasks-section {
  margin-top: 28px;
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #d8e2ff;
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.filter-chip.active {
  background: linear-gradient(135deg, rgba(94, 243, 140, 0.18), rgba(46, 196, 182, 0.2));
  color: #5ef38c;
  border-color: transparent;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 18px;
}

.task-item {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.task-main {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.task-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.task-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(94, 243, 140, 0.12);
  color: #7fffce;
}

.task-type {
  font-size: 12px;
  color: #8ea0c2;
}

.task-reward {
  display: flex;
  flex-direction: column;
  text-align: right;
  color: #ffe066;
}

.task-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.task-footer .ghost-btn {
  white-space: nowrap;
}

.last-row {
  margin-top: 28px;
}

.activity-feed {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.activity-feed li {
  display: flex;
  gap: 14px;
  align-items: center;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4dabf7;
  flex-shrink: 0;
}

.timeline-dot.task {
  background: #5ef38c;
}

.timeline-dot.checkin {
  background: #ffd166;
}

.timeline-dot.lottery {
  background: #ff5d8f;
}

.milestone-body {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.radial-meter {
  position: relative;
  width: 140px;
  height: 140px;
}

.radial-meter svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.radial-meter circle {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 6;
}

.radial-meter circle.progress {
  stroke: #5ef38c;
  stroke-linecap: round;
}

.radial-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.milestone-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.milestone-list li {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.milestone-list span {
  color: #ffd166;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .gamification-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .gamification-page {
    padding: 18px;
  }

  .grid-two {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .lottery-body {
    flex-direction: column;
  }
}
</style>
