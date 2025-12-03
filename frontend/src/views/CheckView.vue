<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY_PREFIX = 'memehub_gamification_state_v1'
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX
const authStore = useAuthStore()
const storageKey = computed(() => `${STORAGE_KEY_PREFIX}_${authStore.username || 'guest'}`)

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

// ===================== MINI-GAMES =====================

// --- Memory Match Game ---
const memoryCards = ref([])
const memoryFlipped = ref([])
const memoryMatched = ref([])
const memoryMoves = ref(0)
const memoryGameActive = ref(false)
const memoryGameWon = ref(false)
const memoryIcons = ['🚀', '🌙', '💎', '🔥', '⚡', '🎯', '🍀', '🎲']

const initMemoryGame = () => {
  const icons = [...memoryIcons, ...memoryIcons]
  memoryCards.value = icons
    .map((icon, idx) => ({ id: idx, icon, matched: false }))
    .sort(() => Math.random() - 0.5)
  memoryFlipped.value = []
  memoryMatched.value = []
  memoryMoves.value = 0
  memoryGameActive.value = true
  memoryGameWon.value = false
}

const flipMemoryCard = (card) => {
  if (!memoryGameActive.value) return
  if (memoryFlipped.value.length >= 2) return
  if (memoryFlipped.value.includes(card.id)) return
  if (memoryMatched.value.includes(card.id)) return

  memoryFlipped.value.push(card.id)

  if (memoryFlipped.value.length === 2) {
    memoryMoves.value++
    const [first, second] = memoryFlipped.value
    const cardA = memoryCards.value.find((c) => c.id === first)
    const cardB = memoryCards.value.find((c) => c.id === second)
    if (cardA.icon === cardB.icon) {
      memoryMatched.value.push(first, second)
      memoryFlipped.value = []
      if (memoryMatched.value.length === memoryCards.value.length) {
        memoryGameWon.value = true
        memoryGameActive.value = false
        const bonus = Math.max(10, 50 - memoryMoves.value * 2)
        gamificationState.value.xp += bonus
        gamificationState.value.coins += Math.round(bonus / 2)
        pushActivity(`翻牌配对完成！+${bonus} XP`, 'game')
      }
    } else {
      setTimeout(() => {
        memoryFlipped.value = []
      }, 800)
    }
  }
}

const isMemoryCardVisible = (card) => memoryFlipped.value.includes(card.id) || memoryMatched.value.includes(card.id)

// --- Coin Flip Game ---
const coinFlipBet = ref(10)
const coinFlipChoice = ref('heads')
const coinFlipResult = ref(null)
const coinFlipSpinning = ref(false)
const coinFlipMessage = ref('')

const flipCoin = () => {
  if (coinFlipSpinning.value) return
  if (gamificationState.value.coins < coinFlipBet.value) {
    coinFlipMessage.value = '金币不足！'
    return
  }
  gamificationState.value.coins -= coinFlipBet.value
  coinFlipSpinning.value = true
  coinFlipResult.value = null
  coinFlipMessage.value = ''

  setTimeout(() => {
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    coinFlipResult.value = result
    coinFlipSpinning.value = false
    if (result === coinFlipChoice.value) {
      const winnings = coinFlipBet.value * 2
      gamificationState.value.coins += winnings
      gamificationState.value.xp += 15
      coinFlipMessage.value = `🎉 赢了！+${winnings} 金币`
      pushActivity(`硬币翻转赢得 ${winnings} 金币`, 'game')
    } else {
      coinFlipMessage.value = '😢 输了，再试一次！'
      pushActivity(`硬币翻转输掉 ${coinFlipBet.value} 金币`, 'game')
    }
  }, 1500)
}

// --- Slot Machine Game ---
const slotReels = ref(['🍒', '🍒', '🍒'])
const slotSpinning = ref(false)
const slotMessage = ref('')
const slotSymbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣']
const slotCost = 20

const spinSlots = () => {
  if (slotSpinning.value) return
  if (gamificationState.value.coins < slotCost) {
    slotMessage.value = '金币不足！'
    return
  }
  gamificationState.value.coins -= slotCost
  slotSpinning.value = true
  slotMessage.value = ''

  let spins = 0
  const maxSpins = 20
  const interval = setInterval(() => {
    slotReels.value = slotReels.value.map(() => slotSymbols[Math.floor(Math.random() * slotSymbols.length)])
    spins++
    if (spins >= maxSpins) {
      clearInterval(interval)
      slotSpinning.value = false
      checkSlotWin()
    }
  }, 80)
}

const checkSlotWin = () => {
  const [a, b, c] = slotReels.value
  if (a === b && b === c) {
    let multiplier = 5
    if (a === '7️⃣') multiplier = 20
    else if (a === '💎') multiplier = 15
    else if (a === '⭐') multiplier = 10
    const winnings = slotCost * multiplier
    gamificationState.value.coins += winnings
    gamificationState.value.xp += multiplier * 5
    slotMessage.value = `🎰 大奖！+${winnings} 金币`
    pushActivity(`老虎机中奖 ${winnings} 金币！`, 'game')
  } else if (a === b || b === c || a === c) {
    const winnings = slotCost
    gamificationState.value.coins += winnings
    slotMessage.value = `✨ 两个相同！+${winnings} 金币`
  } else {
    slotMessage.value = '再接再厉！'
  }
}

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

const snapshotStateToStorage = (key, state) => {
  if (typeof window === 'undefined' || !key) return
  window.localStorage.setItem(key, JSON.stringify(state))
}

const loadStateForKey = (key) => {
  if (typeof window === 'undefined' || !key) return
  let usedLegacy = false
  let raw = window.localStorage.getItem(key)
  if (!raw) {
    raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    usedLegacy = !!raw
  }
  if (!raw) {
    gamificationState.value = createDefaultState()
    return
  }
  try {
    const parsed = JSON.parse(raw)
    gamificationState.value = {
      ...createDefaultState(),
      ...parsed,
      tasks: parsed.tasks ? parsed.tasks.map((task) => ({ ...task })) : cloneTasks(defaultTasks),
      checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : [],
    }
    if (usedLegacy) {
      snapshotStateToStorage(key, gamificationState.value)
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  } catch (error) {
    console.error('加载游戏化数据失败', error)
    gamificationState.value = createDefaultState()
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
  loadStateForKey(storageKey.value)
})

watch(storageKey, (newKey, oldKey) => {
  if (newKey && newKey !== oldKey) {
    loadStateForKey(newKey)
  }
})

watch(
  gamificationState,
  (state) => {
    snapshotStateToStorage(storageKey.value, state)
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

    <!-- ===================== MINI-GAMES SECTION ===================== -->
    <section class="mini-games-section">
      <header class="section-header">
        <div>
          <p class="eyebrow">休闲小游戏</p>
          <h3>轻松一下，赢取额外奖励</h3>
        </div>
      </header>

      <div class="games-grid">
        <!-- Memory Match Game -->
        <article class="glass-card game-card memory-game">
          <div class="game-header">
            <h4>🧠 翻牌配对</h4>
            <span class="game-badge">+XP +金币</span>
          </div>
          <p class="muted">找到所有配对，步数越少奖励越高</p>

          <div v-if="!memoryGameActive && !memoryGameWon" class="game-start">
            <button class="primary-btn" @click="initMemoryGame">开始游戏</button>
          </div>

          <div v-else class="memory-board">
            <div class="memory-stats">
              <span>步数：{{ memoryMoves }}</span>
              <span>配对：{{ memoryMatched.length / 2 }}/{{ memoryCards.length / 2 }}</span>
            </div>
            <div class="memory-grid">
              <div
                v-for="card in memoryCards"
                :key="card.id"
                class="memory-card"
                :class="{ flipped: isMemoryCardVisible(card), matched: memoryMatched.includes(card.id) }"
                @click="flipMemoryCard(card)"
              >
                <div class="card-inner">
                  <div class="card-front">❓</div>
                  <div class="card-back">{{ card.icon }}</div>
                </div>
              </div>
            </div>
            <div v-if="memoryGameWon" class="game-result win">
              <p>🎉 恭喜完成！用了 {{ memoryMoves }} 步</p>
              <button class="ghost-btn" @click="initMemoryGame">再来一局</button>
            </div>
          </div>
        </article>

        <!-- Coin Flip Game -->
        <article class="glass-card game-card coin-flip-game">
          <div class="game-header">
            <h4>🪙 硬币翻转</h4>
            <span class="game-badge">2x 赔率</span>
          </div>
          <p class="muted">猜对正反面，赢取双倍金币</p>

          <div class="coin-flip-body">
            <div class="coin" :class="{ spinning: coinFlipSpinning, heads: coinFlipResult === 'heads', tails: coinFlipResult === 'tails' }">
              <div class="coin-face front">正</div>
              <div class="coin-face back">反</div>
            </div>

            <div class="bet-controls">
              <label>下注金币</label>
              <div class="bet-row">
                <button @click="coinFlipBet = Math.max(5, coinFlipBet - 5)">-</button>
                <span>{{ coinFlipBet }}</span>
                <button @click="coinFlipBet = Math.min(100, coinFlipBet + 5)">+</button>
              </div>
            </div>

            <div class="choice-row">
              <button
                class="choice-btn"
                :class="{ active: coinFlipChoice === 'heads' }"
                @click="coinFlipChoice = 'heads'"
              >
                正面
              </button>
              <button
                class="choice-btn"
                :class="{ active: coinFlipChoice === 'tails' }"
                @click="coinFlipChoice = 'tails'"
              >
                反面
              </button>
            </div>

            <button class="primary-btn stretch" :disabled="coinFlipSpinning" @click="flipCoin">
              {{ coinFlipSpinning ? '翻转中...' : '开始翻转' }}
            </button>

            <p v-if="coinFlipMessage" class="game-message" :class="{ win: coinFlipMessage.includes('赢') }">
              {{ coinFlipMessage }}
            </p>
          </div>
        </article>

        <!-- Slot Machine Game -->
        <article class="glass-card game-card slot-machine-game">
          <div class="game-header">
            <h4>🎰 幸运老虎机</h4>
            <span class="game-badge">最高 20x</span>
          </div>
          <p class="muted">消耗 {{ slotCost }} 金币，三个相同赢大奖</p>

          <div class="slot-body">
            <div class="slot-display">
              <div v-for="(symbol, idx) in slotReels" :key="idx" class="slot-reel" :class="{ spinning: slotSpinning }">
                {{ symbol }}
              </div>
            </div>

            <div class="slot-legend">
              <span>7️⃣ x20</span>
              <span>💎 x15</span>
              <span>⭐ x10</span>
              <span>其他 x5</span>
            </div>

            <button class="primary-btn stretch" :disabled="slotSpinning" @click="spinSlots">
              {{ slotSpinning ? '转动中...' : `投币 ${slotCost} 开始` }}
            </button>

            <p v-if="slotMessage" class="game-message" :class="{ win: slotMessage.includes('奖') || slotMessage.includes('相同') }">
              {{ slotMessage }}
            </p>
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

/* ===================== MINI-GAMES STYLES ===================== */

.mini-games-section {
  margin-top: 32px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.game-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-header h4 {
  margin: 0;
  font-size: 18px;
}

.game-badge {
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.25), rgba(255, 93, 143, 0.2));
  color: #e0c3ff;
  font-size: 12px;
  font-weight: 600;
}

.game-start {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.game-message {
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ff6b6b;
  font-weight: 600;
}

.game-message.win {
  color: #5ef38c;
  background: rgba(94, 243, 140, 0.1);
}

.game-result {
  text-align: center;
  padding: 16px;
  border-radius: 14px;
  background: rgba(94, 243, 140, 0.1);
  margin-top: 12px;
}

.game-result.win p {
  color: #5ef38c;
  font-size: 16px;
  margin-bottom: 12px;
}

/* Memory Match */
.memory-board {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.memory-stats {
  display: flex;
  justify-content: space-between;
  color: #a9b3c7;
  font-size: 14px;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.memory-card {
  aspect-ratio: 1;
  perspective: 600px;
  cursor: pointer;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.memory-card.flipped .card-inner,
.memory-card.matched .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: 12px;
  backface-visibility: hidden;
}

.card-front {
  background: linear-gradient(135deg, #2a2f4a, #1a1f35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-back {
  background: linear-gradient(135deg, #3a4a6a, #2a3550);
  border: 1px solid rgba(94, 243, 140, 0.3);
  transform: rotateY(180deg);
}

.memory-card.matched .card-back {
  background: linear-gradient(135deg, rgba(94, 243, 140, 0.3), rgba(46, 196, 182, 0.25));
  box-shadow: 0 0 20px rgba(94, 243, 140, 0.3);
}

/* Coin Flip */
.coin-flip-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.coin {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.coin.spinning {
  animation: coinSpin 0.3s linear infinite;
}

.coin.heads {
  transform: rotateY(0deg);
}

.coin.tails {
  transform: rotateY(180deg);
}

@keyframes coinSpin {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

.coin-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  border-radius: 50%;
  backface-visibility: hidden;
}

.coin-face.front {
  background: linear-gradient(135deg, #ffd166, #f9c80e);
  color: #1a1a2e;
  border: 4px solid #e6b800;
}

.coin-face.back {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #1a1a2e;
  border: 4px solid #888;
  transform: rotateY(180deg);
}

.bet-controls {
  text-align: center;
}

.bet-controls label {
  display: block;
  color: #a9b3c7;
  font-size: 13px;
  margin-bottom: 8px;
}

.bet-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bet-row button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.bet-row button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.bet-row span {
  font-size: 24px;
  font-weight: bold;
  color: #ffd166;
  min-width: 50px;
  text-align: center;
}

.choice-row {
  display: flex;
  gap: 12px;
}

.choice-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: #d8e2ff;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.choice-btn.active {
  border-color: #5ef38c;
  background: rgba(94, 243, 140, 0.15);
  color: #5ef38c;
}

/* Slot Machine */
.slot-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.slot-display {
  display: flex;
  gap: 12px;
  padding: 20px 30px;
  background: linear-gradient(145deg, #1a1f35, #0d1020);
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.5);
}

.slot-reel {
  width: 70px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  background: linear-gradient(180deg, #2a2f4a, #1a1f35);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.slot-reel.spinning {
  animation: slotBlur 0.08s linear infinite;
}

@keyframes slotBlur {
  0%, 100% { filter: blur(0); }
  50% { filter: blur(2px); }
}

.slot-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  color: #8ea0c2;
  font-size: 13px;
}

.slot-legend span {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stretch {
  width: 100%;
}

@media (max-width: 480px) {
  .memory-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .card-front,
  .card-back {
    font-size: 20px;
  }

  .slot-reel {
    width: 55px;
    height: 65px;
    font-size: 32px;
  }
}
</style>
