<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { GAMIFICATION_TASK_EVENT, drainQueuedTaskProgress, setGamificationListenerActive } from '@/utils/gamificationEvents'

const STORAGE_KEY_PREFIX = 'memehub_gamification_state_v1'
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX
const authStore = useAuthStore()
const router = useRouter()
const storageKey = computed(() => `${STORAGE_KEY_PREFIX}_${authStore.username || 'guest'}`)
const listenerUser = ref(authStore.username || 'guest')
const getListenerUser = () => listenerUser.value || 'guest'

const defaultTasks = [
  {
    id: 'daily-share',
    title: '分享一个模因',
    description: '在社区推荐页发布你今日最看好的模因/币种',
    rewardXp: 40,
    rewardCopper: 15,
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
    rewardCopper: 20,
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
    rewardCopper: 10,
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
    rewardCopper: 30,
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
    rewardCopper: 60,
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
    rewardCopper: 120,
    progress: 0,
    target: 7,
    type: 'milestone',
    tag: '里程碑',
  },
]

const cloneTasks = (tasks) => tasks.map((task) => ({ ...task }))

const GOLD_TO_USDT_RATE = 50
const server_ip = authStore.server_ip || 'http://localhost:3000'

const createDefaultState = () => ({
  xp: 1860,
  copper: 520, // 金币
  usdt: 0, // USDT（游戏化内的展示用余额）
  badges: 6,
  energy: 78,
  streak: 0,
  lastCheckIn: null,
  checkIns: [],
  lastReward: null,
  tasks: cloneTasks(defaultTasks),
  // 24点游戏每日奖励上限
  game24DailyWins: 0,
  game24LastDate: null,
})

const gamificationState = ref(createDefaultState())

const adjustCopper = (delta = 0) => {
  const current = Number(gamificationState.value.copper) || 0
  const next = Math.max(0, current + Number(delta || 0))
  gamificationState.value.copper = Math.round(next)
  return gamificationState.value.copper
}

const adjustUsdt = (delta = 0) => {
  const current = Number(gamificationState.value.usdt) || 0
  const next = Math.max(0, current + Number(delta || 0))
  gamificationState.value.usdt = Math.round(next * 10000) / 10000
  return gamificationState.value.usdt
}

const getUsdtBalance = () => {
  const v = Number(gamificationState.value.usdt)
  return Number.isFinite(v) ? v : 0
}

const setUsdtBalance = (value = 0) => {
  const v = Number(value)
  const safe = Number.isFinite(v) ? Math.max(0, v) : 0
  gamificationState.value.usdt = Math.round(safe * 10000) / 10000
  return gamificationState.value.usdt
}

const persistCoins = async () => {
  if (!authStore.username) return
  try {
    await fetch(`${server_ip}/api/user/coins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: authStore.username || authStore.token || '',
      },
      body: JSON.stringify({ coins: getUsdtBalance() })
    })
  } catch (err) {
    console.warn('同步 USDT 到服务器失败', err)
  }
}

const goldExchangeMessage = ref('')
const goldToUsdtInput = ref('')
const usdtToGoldInput = ref('')
const maxUsdtExchange = computed(() => Math.floor((Number(gamificationState.value.copper) || 0) / GOLD_TO_USDT_RATE))
const syncUsdtFromProfile = async () => {
  if (!authStore.username) return
  try {
    const res = await fetch(`${server_ip}/api/user/${authStore.username}`, {
      headers: {
        'Content-Type': 'application/json',
        token: authStore.username || authStore.token || ''
      }
    })
    const data = await res.json()
    if (res.ok && data?.code === 0) {
      const coins = Number(data.data?.coins)
      setUsdtBalance(Number.isFinite(coins) ? coins : 0)
    }
  } catch (err) {
    console.warn('同步账户 USDT 失败', err)
  }
}

const exchangeGoldToUsdt = () => {
  const amountGold = Number(goldToUsdtInput.value || 0)
  if (!Number.isFinite(amountGold) || amountGold <= 0) {
    goldExchangeMessage.value = '请输入兑换的金币数量'
    return
  }
  if (amountGold > gamificationState.value.copper) {
    goldExchangeMessage.value = '金币不足'
    return
  }
  const usdtGain = Math.round((amountGold / GOLD_TO_USDT_RATE) * 10000) / 10000
  adjustCopper(-amountGold)
  adjustUsdt(usdtGain)
  goldExchangeMessage.value = `已兑换 ${usdtGain} USDT，消耗 ${amountGold} 金币`
  pushActivity(`兑换 ${usdtGain} USDT（耗费 ${amountGold} 金币）`, 'exchange')
  persistCoins()
  goldToUsdtInput.value = ''
}

const exchangeUsdtToGold = () => {
  const amountUsdt = Number(usdtToGoldInput.value || 0)
  if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) {
    goldExchangeMessage.value = '请输入兑换的 USDT 数量'
    return
  }
  const balance = getUsdtBalance()
  const epsilon = 1e-6
  if (amountUsdt - balance > epsilon) {
    goldExchangeMessage.value = `USDT 余额不足，可用 ${balance.toFixed(4)}`
    return
  }
  const goldGain = Math.round(amountUsdt * GOLD_TO_USDT_RATE)
  adjustUsdt(-amountUsdt)
  adjustCopper(goldGain)
  goldExchangeMessage.value = `已兑换 ${goldGain} 金币，消耗 ${amountUsdt} USDT`
  pushActivity(`兑换 ${goldGain} 金币（耗费 ${amountUsdt} USDT）`, 'exchange')
  persistCoins()
  usdtToGoldInput.value = ''
}
const activeTaskFilter = ref('daily')
const isDrawing = ref(false)
const xpPerLevel = 600

// 页面分栏 Tab
const activeMainTab = ref('overview') // 'overview' | 'tasks' | 'games' | 'achievements'

// 成就系统
const activeAchCat = ref('all')
const achievementCategories = [
  { id: 'all', name: '全部', icon: '🎯' },
  { id: 'trading', name: '交易', icon: '💰' },
  { id: 'social', name: '社交', icon: '👥' },
  { id: 'creation', name: '创作', icon: '🎨' },
  { id: 'collection', name: '收藏', icon: '📦' }
]

const achievements = ref([])
const achievementStats = ref({ unlockedCount: 0, totalCount: 0, totalPoints: 0, completionRate: 0 })

// 从API获取成就数据
const fetchAchievements = async () => {
  try {
    const response = await fetch(`${authStore.server_ip}/api/achievements`, {
      headers: { 'token': authStore.username }
    })
    const data = await response.json()
    if (data.code === 0) {
      achievements.value = data.data.achievements || []
      achievementStats.value = data.data.stats || { unlockedCount: 0, totalCount: 0, totalPoints: 0, completionRate: 0 }
    }
  } catch (error) {
    console.error('获取成就数据失败:', error)
  }
}

const filteredAchievements = computed(() => {
  if (activeAchCat.value === 'all') return achievements.value
  return achievements.value.filter(a => a.category === activeAchCat.value)
})

const unlockedAchievements = computed(() => achievementStats.value.unlockedCount)
const totalAchievements = computed(() => achievementStats.value.totalCount || achievements.value.length)
const achievementPoints = computed(() => achievementStats.value.totalPoints)
const achievementRate = computed(() => achievementStats.value.completionRate)
const activeGameTab = ref('game24') // 'game24' | 'memory' | 'coinflip' | 'slots'

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
        adjustCopper(Math.round(bonus / 2))
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
  if (gamificationState.value.copper < coinFlipBet.value) {
    coinFlipMessage.value = '金币不足！'
    return
  }
  adjustCopper(-coinFlipBet.value)
  coinFlipSpinning.value = true
  coinFlipResult.value = null
  coinFlipMessage.value = ''

  setTimeout(() => {
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    coinFlipResult.value = result
    coinFlipSpinning.value = false
    if (result === coinFlipChoice.value) {
      const winnings = coinFlipBet.value * 2
      adjustCopper(winnings)
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
  if (gamificationState.value.copper < slotCost) {
    slotMessage.value = '金币不足！'
    return
  }
  adjustCopper(-slotCost)
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
    adjustCopper(winnings)
    gamificationState.value.xp += multiplier * 5
    slotMessage.value = `🎰 大奖！+${winnings} 金币`
    pushActivity(`老虎机中奖 ${winnings} 金币！`, 'game')
  } else if (a === b || b === c || a === c) {
    const winnings = slotCost
    adjustCopper(winnings)
    slotMessage.value = `✨ 两个相同！+${winnings} 金币`
  } else {
    slotMessage.value = '再接再厉！'
  }
}

// --- 24点计算游戏 (经典交互模式) ---
const GAME24_DAILY_LIMIT = 5
const GAME24_REWARD_XP = 80
const GAME24_REWARD_COPPER = 40

// 当前卡片数组，每张卡片有 id 和 value
const game24Cards = ref([])
// 选中的两张卡片索引
const game24Selected = ref([])
// 当前选中的运算符
const game24Operator = ref(null)
// 操作历史，用于撤销
const game24History = ref([])
const game24Message = ref('')
const game24GameActive = ref(false)
const game24Won = ref(false)

const game24DailyWinsToday = computed(() => {
  const today = getDayKey()
  if (gamificationState.value.game24LastDate !== today) {
    return 0
  }
  return gamificationState.value.game24DailyWins || 0
})

const game24CanEarnReward = computed(() => game24DailyWinsToday.value < GAME24_DAILY_LIMIT)

// ========== 24点求解器：确保生成的数字有解 ==========
const solve24 = (nums) => {
  const ops = ['+', '-', '*', '/']
  const calc = (a, op, b) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : NaN
    }
  }

  const tryAll = (arr) => {
    if (arr.length === 1) {
      return Math.abs(arr[0] - 24) < 0.0001
    }
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue
        const rest = arr.filter((_, idx) => idx !== i && idx !== j)
        for (const op of ops) {
          const result = calc(arr[i], op, arr[j])
          if (!isFinite(result)) continue
          if (tryAll([...rest, result])) {
            return true
          }
        }
      }
    }
    return false
  }

  return tryAll(nums)
}

// 生成保证有解的4个数字
const generateGame24Numbers = () => {
  let nums
  let attempts = 0
  const maxAttempts = 500

  do {
    nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1)
    attempts++
  } while (!solve24(nums) && attempts < maxAttempts)

  // 初始化卡片
  game24Cards.value = nums.map((val, idx) => ({ id: idx, value: val }))
  game24Selected.value = []
  game24Operator.value = null
  game24History.value = []
  game24Message.value = ''
  game24GameActive.value = true
  game24Won.value = false
}

// 选择/取消选择卡片
const selectGame24Card = (cardIdx) => {
  if (!game24GameActive.value || game24Won.value) return

  const selected = game24Selected.value
  const idx = selected.indexOf(cardIdx)

  if (idx !== -1) {
    // 取消选择
    game24Selected.value = selected.filter((i) => i !== cardIdx)
  } else if (selected.length < 2) {
    // 选择卡片
    game24Selected.value = [...selected, cardIdx]

    // 如果已选2张卡片且有运算符，执行计算
    if (game24Selected.value.length === 2 && game24Operator.value) {
      performGame24Calc()
    }
  }
}

// 选择运算符
const selectGame24Op = (op) => {
  if (!game24GameActive.value || game24Won.value) return
  game24Operator.value = op

  // 如果已选2张卡片，执行计算
  if (game24Selected.value.length === 2) {
    performGame24Calc()
  }
}

// 执行计算：合并两张卡片
const performGame24Calc = () => {
  const [idx1, idx2] = game24Selected.value
  const card1 = game24Cards.value[idx1]
  const card2 = game24Cards.value[idx2]
  const op = game24Operator.value

  if (!card1 || !card2 || !op) return

  let result
  switch (op) {
    case '+': result = card1.value + card2.value; break
    case '-': result = card1.value - card2.value; break
    case '*': result = card1.value * card2.value; break
    case '/':
      if (card2.value === 0) {
        game24Message.value = '❌ 不能除以0'
        game24Selected.value = []
        game24Operator.value = null
        return
      }
      result = card1.value / card2.value
      break
  }

  // 保存历史用于撤销
  game24History.value.push({
    cards: [...game24Cards.value],
    selected: [...game24Selected.value],
    operator: game24Operator.value,
  })

  // 创建新卡片数组：移除两张旧卡，添加结果卡
  const newCards = game24Cards.value.filter((_, i) => i !== idx1 && i !== idx2)
  newCards.push({ id: Date.now(), value: result })
  game24Cards.value = newCards

  // 重置选择状态
  game24Selected.value = []
  game24Operator.value = null
  game24Message.value = `${card1.value} ${op} ${card2.value} = ${Number.isInteger(result) ? result : result.toFixed(2)}`

  // 检查是否只剩一张卡片
  if (newCards.length === 1) {
    checkGame24Win(newCards[0].value)
  }
}

// 检查胜利
const checkGame24Win = (finalValue) => {
  if (Math.abs(finalValue - 24) < 0.0001) {
    game24Won.value = true
    game24GameActive.value = false
    const today = getDayKey()

    if (gamificationState.value.game24LastDate !== today) {
      gamificationState.value.game24DailyWins = 0
      gamificationState.value.game24LastDate = today
    }

    if (gamificationState.value.game24DailyWins < GAME24_DAILY_LIMIT) {
      gamificationState.value.game24DailyWins++
      gamificationState.value.xp += GAME24_REWARD_XP
      adjustCopper(GAME24_REWARD_COPPER)
      game24Message.value = `🎉 正确！+${GAME24_REWARD_XP} XP / +${GAME24_REWARD_COPPER} 金币 (今日 ${gamificationState.value.game24DailyWins}/${GAME24_DAILY_LIMIT})`
      pushActivity(`24点计算成功 +${GAME24_REWARD_XP} XP`, 'game')
    } else {
      game24Message.value = `🎉 正确！但今日奖励已达上限 (${GAME24_DAILY_LIMIT}次)`
    }
  } else {
    game24Message.value = `❌ 结果是 ${Number.isInteger(finalValue) ? finalValue : finalValue.toFixed(2)}，不是24。点击撤销重试`
  }
}

// 撤销上一步
const undoGame24 = () => {
  if (game24History.value.length === 0) return
  const last = game24History.value.pop()
  game24Cards.value = last.cards
  game24Selected.value = []
  game24Operator.value = null
  game24Message.value = '已撤销'
  game24Won.value = false
  game24GameActive.value = true
}

// 重置当前题目
const resetGame24 = () => {
  if (game24History.value.length === 0) return
  const first = game24History.value[0]
  game24Cards.value = first.cards
  game24History.value = []
  game24Selected.value = []
  game24Operator.value = null
  game24Message.value = '已重置'
  game24Won.value = false
  game24GameActive.value = true
}

// 跳过换题
const skipGame24 = () => {
  game24Message.value = '已跳过，换一组数字'
  generateGame24Numbers()
}

const rewardPool = [
  { id: 'xp-small', label: '+50 XP', type: 'xp', value: 50, rarity: '常规', weight: 30, accent: '#5ef38c' },
  { id: 'coin-mid', label: '+80 金币', type: 'copper', value: 80, rarity: '常规', weight: 26, accent: '#f9c80e' },
  { id: 'energy', label: '+15 体力', type: 'energy', value: 15, rarity: '稀有', weight: 16, accent: '#f18701' },
  { id: 'xp-large', label: '+150 XP', type: 'xp', value: 150, rarity: '稀有', weight: 12, accent: '#7f5af0' },
  { id: 'badge', label: '限定徽章', type: 'badge', value: 1, rarity: '传说', weight: 6, accent: '#ff5d8f' },
  { id: 'coin-big', label: '+200 金币', type: 'copper', value: 200, rarity: '史诗', weight: 10, accent: '#ffd166' },
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
    const defaults = createDefaultState()
    const safeCopper = Number(parsed.copper)
    const safeXp = Number(parsed.xp)
    const safeUsdt = Number(parsed.usdt)
    gamificationState.value = {
      ...defaults,
      ...parsed,
      xp: Number.isFinite(safeXp) ? safeXp : defaults.xp,
      copper: Number.isFinite(safeCopper) ? Math.max(0, Math.round(safeCopper)) : defaults.copper,
      usdt: Number.isFinite(safeUsdt) ? Math.max(0, Math.round(safeUsdt * 10000) / 10000) : defaults.usdt,
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

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDayKey = (offset = 0) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return formatDateKey(date)
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

const applyTaskProgress = (taskId, increment = 1) => {
  if (!taskId || increment <= 0) return
  let completedTask = null

  gamificationState.value.tasks = gamificationState.value.tasks.map((task) => {
    if (task.id !== taskId) return task
    if (task.progress >= task.target) return task

    const nextProgress = Math.min(task.target, task.progress + increment)
    const justCompleted = task.progress < task.target && nextProgress >= task.target
    if (justCompleted) {
      completedTask = task
    }
    return { ...task, progress: nextProgress }
  })

  if (completedTask) {
    gamificationState.value.xp += completedTask.rewardXp
    adjustCopper(completedTask.rewardCopper)
    pushActivity(
      `完成「${completedTask.title}」 +${completedTask.rewardXp} XP / +${completedTask.rewardCopper} 金币`,
      'task'
    )
  }
}

const flushQueuedProgress = () => {
  const queued = drainQueuedTaskProgress(getListenerUser())
  if (!queued.length) return
  queued.forEach(({ taskId, increment }) => {
    if (taskId) {
      applyTaskProgress(taskId, increment || 1)
    }
  })
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
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const key = formatDateKey(date)
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
const displayCopper = computed(() => {
  const value = Number(gamificationState.value.copper)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
})
const displayUsdt = computed(() => {
  const value = Number(gamificationState.value.usdt)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value * 10000) / 10000)
})

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
    case 'copper':
      adjustCopper(reward.value)
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
  adjustCopper(coins)
  gamificationState.value.energy = Math.min(100, gamificationState.value.energy + 6)
  applyTaskProgress('milestone-checkin', 1)
  pushActivity(`签到成功：+${xp} XP / +${coins} 金币`, 'checkin')
}

const taskRoutes = {
  'daily-share': { path: '/create-meme' },
  'daily-comment': { path: '/discover', query: { tab: 'leaderboard' } },
  'daily-like': { path: '/', hash: '#home' },
  'growth-follow': { path: '/discover', query: { tab: 'leaderboard' } },
  'growth-trade': { path: '/chat' },
  'milestone-checkin': { action: 'scroll', selector: '.checkin-card' },
}

const handleTaskAction = (task) => {
  if (task.progress >= task.target) return
  const target = taskRoutes[task.id]
  if (!target) return

  if (target.action === 'scroll') {
    activeMainTab.value = 'overview'
    nextTick(() => {
      const el = document.querySelector(target.selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
    return
  }

  if (target.path) {
    router.push({ path: target.path, query: target.query, hash: target.hash })
    return
  }

  if (target.external) {
    window.open(target.external, '_blank')
  }
}

const handleExternalTaskEvent = (event) => {
  const detail = event?.detail || {}
  if (!detail.taskId) return
  const increment = typeof detail.increment === 'number' && detail.increment > 0 ? detail.increment : 1
  applyTaskProgress(detail.taskId, increment)
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
  flushQueuedProgress()
  syncUsdtFromProfile()
  fetchAchievements()
  if (typeof window !== 'undefined') {
    window.addEventListener(GAMIFICATION_TASK_EVENT, handleExternalTaskEvent)
  }
  setGamificationListenerActive(getListenerUser(), true)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener(GAMIFICATION_TASK_EVENT, handleExternalTaskEvent)
  }
  setGamificationListenerActive(getListenerUser(), false)
})

watch(storageKey, (newKey, oldKey) => {
  if (newKey && newKey !== oldKey) {
    setGamificationListenerActive(getListenerUser(), false)
    listenerUser.value = authStore.username || 'guest'
    loadStateForKey(newKey)
    flushQueuedProgress()
    syncUsdtFromProfile()
    setGamificationListenerActive(getListenerUser(), true)
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
    <!-- 页面顶部统计栏（始终可见） -->
    <header class="page-header glass-border">
      <div>
        <p class="eyebrow">游戏化中心</p>
        <h1>保持活跃，持续解锁模因玩家荣誉</h1>
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

    <!-- 顶部统计卡片（始终可见） -->
    <section class="stats-row">
      <article class="glass-card mini-stat">
        <div class="card-header">
          <p>等级</p>
          <span>Lv {{ playerLevel }}</span>
        </div>
        <h2>{{ gamificationState.xp }} XP</h2>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: `${levelProgress}%` }"></div>
        </div>
      </article>

      <article class="glass-card mini-stat">
        <div class="card-header">
          <p>金币</p>
          <span>{{ gamificationState.badges }} 徽章</span>
        </div>
        <h2>{{ displayCopper }}</h2>
        <div class="energy-track">
          <div class="energy-fill" :style="{ width: `${energyPercent}%` }"></div>
        </div>
      </article>

      <article class="glass-card mini-stat">
        <div class="card-header">
          <p>签到</p>
          <span>{{ gamificationState.streak }} 天</span>
        </div>
        <h2>{{ hasCheckedInToday ? '已完成' : `+${checkInRewardPreview.xp}` }}</h2>
        <div class="pill-row compact">
          <span class="pill highlight">连击 x{{ previewStreak }}</span>
        </div>
      </article>

      <article class="glass-card mini-stat">
        <div class="card-header">
          <p>任务</p>
          <span>{{ completedTaskCount }}/{{ gamificationState.tasks.length }}</span>
        </div>
        <h2>{{ totalTaskProgress }}%</h2>
        <div class="chip secondary compact">势能 +{{ weekMomentum }}</div>
      </article>
    </section>

    <section class="exchange-row glass-card">
      <div>
        <p class="eyebrow">金币兑换 USDT</p>
        <h3>汇率 50:1</h3>
        <p class="muted">当前：{{ displayCopper }} 金币 / {{ displayUsdt }} USDT</p>
        <p class="muted" v-if="goldExchangeMessage">{{ goldExchangeMessage }}</p>
      </div>
      <div class="exchange-controls">
        <div class="field-group">
          <label>金币 → USDT</label>
          <div class="input-row">
            <input v-model.number="goldToUsdtInput" type="number" min="0" placeholder="输入金币数量" />
            <button class="primary-btn" @click="exchangeGoldToUsdt">兑换</button>
          </div>
          <p class="muted">最多可兑换 {{ maxUsdtExchange }} USDT（基于当前金币）</p>
        </div>
        <div class="field-group">
          <label>USDT → 金币</label>
          <div class="input-row">
            <input v-model.number="usdtToGoldInput" type="number" min="0" step="0.0001" placeholder="输入 USDT 数量" />
            <button class="primary-btn" @click="exchangeUsdtToGold">兑换</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 主分栏导航 -->
    <nav class="main-tabs">
      <button
        class="main-tab"
        :class="{ active: activeMainTab === 'overview' }"
        @click="activeMainTab = 'overview'"
      >
        📊 总览
      </button>
      <button
        class="main-tab"
        :class="{ active: activeMainTab === 'tasks' }"
        @click="activeMainTab = 'tasks'"
      >
        📋 任务
      </button>
      <button
        class="main-tab"
        :class="{ active: activeMainTab === 'games' }"
        @click="activeMainTab = 'games'"
      >
        🎮 小游戏
      </button>
      <button
        class="main-tab"
        :class="{ active: activeMainTab === 'achievements' }"
        @click="activeMainTab = 'achievements'"
      >
        🏅 成就
      </button>
    </nav>

    <!-- ===================== 总览 Tab ===================== -->
    <div v-if="activeMainTab === 'overview'" class="tab-content">
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

      <section class="grid-two">
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

    <!-- ===================== 任务 Tab ===================== -->
    <div v-if="activeMainTab === 'tasks'" class="tab-content">
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
                <span>+{{ task.rewardCopper }} 金币</span>
              </div>
            </div>
            <div class="task-footer">
              <div class="progress-track thin">
                <div class="progress-bar accent" :style="{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }" />
              </div>
              <span class="progress-tip">
                {{ task.progress }}/{{ task.target }}
              </span>
              <button class="ghost-btn" :disabled="task.progress >= task.target" @click="handleTaskAction(task)">
                {{ task.progress >= task.target ? '已完成' : '去完成' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- ===================== 小游戏 Tab ===================== -->
    <div v-if="activeMainTab === 'games'" class="tab-content">
      <!-- 游戏子导航 -->
      <nav class="game-tabs">
        <button
          class="game-tab"
          :class="{ active: activeGameTab === 'game24' }"
          @click="activeGameTab = 'game24'"
        >
          🔢 24点
        </button>
        <button
          class="game-tab"
          :class="{ active: activeGameTab === 'memory' }"
          @click="activeGameTab = 'memory'"
        >
          🧠 翻牌
        </button>
        <button
          class="game-tab"
          :class="{ active: activeGameTab === 'coinflip' }"
          @click="activeGameTab = 'coinflip'"
        >
          🪙 硬币
        </button>
        <button
          class="game-tab"
          :class="{ active: activeGameTab === 'slots' }"
          @click="activeGameTab = 'slots'"
        >
          🎰 老虎机
        </button>
      </nav>

      <!-- 24点计算游戏 (经典交互模式) -->
      <article v-if="activeGameTab === 'game24'" class="glass-card game-card game24-card-full">
        <div class="game-header">
          <h4>🔢 24点计算</h4>
          <span class="game-badge">每日 {{ game24DailyWinsToday }}/{{ GAME24_DAILY_LIMIT }}</span>
        </div>
        <p class="muted">选择两张卡片和一个运算符，合并计算直到得出24。所有题目保证有解！</p>

        <div v-if="!game24GameActive && !game24Won" class="game-start">
          <button class="primary-btn" @click="generateGame24Numbers">
            {{ game24CanEarnReward ? '开始挑战' : '继续练习（无奖励）' }}
          </button>
        </div>

        <div v-else class="game24-board">
          <!-- 提示信息 -->
          <div class="game24-hint-bar">
            <span v-if="game24Selected.length === 0">👆 选择第一张卡片</span>
            <span v-else-if="game24Selected.length === 1 && !game24Operator">👆 选择运算符或第二张卡片</span>
            <span v-else-if="game24Selected.length === 1 && game24Operator">👆 选择第二张卡片</span>
            <span v-else-if="game24Selected.length === 2 && !game24Operator">👆 选择运算符完成计算</span>
            <span v-else>✨ 即将计算...</span>
          </div>

          <!-- 数字卡片区 -->
          <div class="game24-cards">
            <button
              v-for="(card, idx) in game24Cards"
              :key="card.id"
              class="game24-card"
              :class="{ selected: game24Selected.includes(idx) }"
              @click="selectGame24Card(idx)"
            >
              {{ Number.isInteger(card.value) ? card.value : card.value.toFixed(2) }}
            </button>
          </div>

          <!-- 运算符选择区 -->
          <div class="game24-ops">
            <button
              v-for="op in ['+', '-', '*', '/']"
              :key="op"
              class="game24-op"
              :class="{ selected: game24Operator === op }"
              @click="selectGame24Op(op)"
            >
              {{ op === '*' ? '×' : op === '/' ? '÷' : op }}
            </button>
          </div>

          <!-- 操作按钮 -->
          <div class="game24-actions">
            <button class="ghost-btn" :disabled="game24History.length === 0" @click="undoGame24">
              ↩ 撤销
            </button>
            <button class="ghost-btn" :disabled="game24History.length === 0" @click="resetGame24">
              🔄 重置
            </button>
            <button class="ghost-btn" @click="skipGame24">
              ⏭ 换题
            </button>
          </div>

          <!-- 消息提示 -->
          <p v-if="game24Message" class="game-message" :class="{ win: game24Message.includes('🎉') }">
            {{ game24Message }}
          </p>

          <!-- 胜利后再来一题 -->
          <div v-if="game24Won" class="game-result win">
            <button class="primary-btn" @click="generateGame24Numbers">再来一题</button>
          </div>
        </div>
      </article>

      <!-- 翻牌配对 -->
      <article v-if="activeGameTab === 'memory'" class="glass-card game-card">
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

      <!-- 硬币翻转 -->
      <article v-if="activeGameTab === 'coinflip'" class="glass-card game-card">
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

      <!-- 老虎机 -->
      <article v-if="activeGameTab === 'slots'" class="glass-card game-card">
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

    <!-- ===================== 成就 Tab ===================== -->
    <div v-if="activeMainTab === 'achievements'" class="tab-content">
      <section class="glass-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">成就中心</p>
            <h3>完成挑战，解锁徽章</h3>
          </div>
        </header>

        <!-- 成就统计 -->
        <div class="achievement-stats">
          <div class="ach-stat">
            <span class="ach-stat-value">{{ unlockedAchievements }}/{{ totalAchievements }}</span>
            <span class="ach-stat-label">已解锁</span>
          </div>
          <div class="ach-stat">
            <span class="ach-stat-value">{{ achievementPoints }}</span>
            <span class="ach-stat-label">成就点数</span>
          </div>
          <div class="ach-stat">
            <span class="ach-stat-value">{{ achievementRate }}%</span>
            <span class="ach-stat-label">完成率</span>
          </div>
        </div>

        <!-- 成就分类 -->
        <div class="ach-categories">
          <button
            v-for="cat in achievementCategories"
            :key="cat.id"
            :class="['ach-cat-btn', { active: activeAchCat === cat.id }]"
            @click="activeAchCat = cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>

        <!-- 成就列表 -->
        <div class="achievements-grid">
          <div
            v-for="ach in filteredAchievements"
            :key="ach.id"
            :class="['achievement-item', { unlocked: ach.unlocked, rare: ach.rarity === 'rare' }]"
          >
            <div class="ach-icon">{{ ach.icon }}</div>
            <div class="ach-content">
              <h4 class="ach-title">{{ ach.title }}</h4>
              <p class="ach-desc">{{ ach.description }}</p>
              <div v-if="ach.progress !== undefined" class="ach-progress">
                <div class="ach-progress-bar">
                  <div class="ach-progress-fill" :style="{ width: `${ach.progress}%` }"></div>
                </div>
                <span class="ach-progress-text">{{ ach.current }}/{{ ach.target }}</span>
              </div>
            </div>
            <div class="ach-reward">+{{ ach.points }}</div>
          </div>
        </div>
      </section>
    </div>
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

.exchange-row {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.exchange-row .muted {
  margin-top: 4px;
}

.exchange-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  width: 100%;
}

.exchange-controls .field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exchange-controls .input-row {
  display: flex;
  gap: 8px;
}

.exchange-controls input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.exchange-controls .primary-btn {
  min-width: 100px;
  white-space: nowrap;
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

/* 24点游戏 */
.game24-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game24-numbers {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

/* 24点经典交互样式 */
.game24-hint-bar {
  text-align: center;
  padding: 10px 16px;
  background: rgba(127, 90, 240, 0.12);
  border-radius: 12px;
  color: #caa8ff;
  font-size: 14px;
  margin-bottom: 8px;
}

.game24-cards {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 16px 0;
}

.game24-card {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #2a3550, #1a2540);
  color: #f7f9ff;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.game24-card:hover {
  border-color: rgba(127, 90, 240, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(127, 90, 240, 0.3);
}

.game24-card.selected {
  background: linear-gradient(135deg, #7f5af0, #5a3fd6);
  border-color: #9d7aff;
  transform: scale(1.08);
  box-shadow: 0 8px 30px rgba(127, 90, 240, 0.5);
}

.game24-ops {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
}

.game24-op {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: bold;
  background: linear-gradient(135deg, rgba(94, 243, 140, 0.15), rgba(46, 196, 182, 0.1));
  color: #5ef38c;
  border: 2px solid rgba(94, 243, 140, 0.3);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game24-op:hover {
  background: linear-gradient(135deg, rgba(94, 243, 140, 0.25), rgba(46, 196, 182, 0.2));
  transform: scale(1.05);
}

.game24-op.selected {
  background: linear-gradient(135deg, #5ef38c, #2ec4b6);
  color: #011627;
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(94, 243, 140, 0.4);
}

.game24-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.game24-actions .ghost-btn {
  min-width: 90px;
  font-size: 13px;
}

/* ===================== 主分栏 Tab ===================== */
.main-tabs {
  display: flex;
  gap: 8px;
  margin: 24px 0 20px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.main-tab {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #a9b3c7;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-tab:hover {
  color: #f7f9ff;
  background: rgba(255, 255, 255, 0.05);
}

.main-tab.active {
  background: linear-gradient(135deg, rgba(94, 243, 140, 0.15), rgba(46, 196, 182, 0.12));
  color: #5ef38c;
  box-shadow: 0 4px 15px rgba(94, 243, 140, 0.15);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 游戏子 Tab */
.game-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.game-tab {
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: transparent;
  color: #a9b3c7;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-tab:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: #f7f9ff;
}

.game-tab.active {
  background: linear-gradient(135deg, #7f5af0, #5a3fd6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 15px rgba(127, 90, 240, 0.35);
}

/* 统计卡片紧凑版 */
.mini-stat {
  padding: 16px 18px;
}

.mini-stat h2 {
  margin: 8px 0 6px;
  font-size: 22px;
}

.pill-row.compact {
  margin-top: 6px;
}

.chip.secondary.compact {
  padding: 4px 10px;
  font-size: 11px;
}

/* 24点游戏容器 */
.game24-card-full {
  max-width: 480px;
  margin: 0 auto;
}

@media (max-width: 480px) {
  .game24-num {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }

  .game24-input {
    font-size: 16px;
    padding: 12px 14px;
  }

  .game24-keypad {
    max-width: 280px;
  }

  .key-btn {
    padding: 12px;
    font-size: 18px;
  }

  .main-tab {
    padding: 12px 14px;
    font-size: 13px;
  }

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

/* 成就系统样式 */
.achievement-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(127, 90, 240, 0.08);
  border-radius: 16px;
}

.ach-stat {
  text-align: center;
}

.ach-stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #5ef38c;
}

.ach-stat-label {
  font-size: 13px;
  color: #a9b3c7;
}

.ach-categories {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.ach-cat-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #a9b3c7;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.ach-cat-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.ach-cat-btn.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.3), rgba(94, 243, 140, 0.15));
  border-color: rgba(127, 90, 240, 0.5);
  color: #fff;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  opacity: 0.6;
  transition: all 0.2s;
}

.achievement-item.unlocked {
  opacity: 1;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(94, 243, 140, 0.2);
}

.achievement-item.rare.unlocked {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(94, 243, 140, 0.05));
  border-color: rgba(127, 90, 240, 0.3);
}

.ach-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 24px;
  flex-shrink: 0;
}

.ach-content {
  flex: 1;
  min-width: 0;
}

.ach-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #f7f9ff;
}

.ach-desc {
  font-size: 12px;
  color: #a9b3c7;
  margin: 0 0 8px;
}

.ach-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ach-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.ach-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7f5af0, #5ef38c);
  border-radius: 3px;
}

.ach-progress-text {
  font-size: 11px;
  color: #a9b3c7;
}

.ach-reward {
  font-size: 14px;
  font-weight: 600;
  color: #f9c80e;
  white-space: nowrap;
}
</style>
