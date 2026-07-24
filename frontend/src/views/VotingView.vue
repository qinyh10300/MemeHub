<template>
  <div class="voting-page">
    <header class="page-header">
      <h1 class="title">🗳️ Community Voting</h1>
      <p class="subtitle">Join governance and vote for the memes you love</p>
    </header>

    <!-- 投票统计 -->
    <div class="stats-section">
      <div class="stat-card highlight">
        <span class="stat-icon">🔥</span>
        <div class="stat-content">
          <span class="stat-value">{{ activePolls.length }}</span>
          <span class="stat-label">Active Polls</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <div class="stat-content">
          <span class="stat-value">{{ userVoteCount }}</span>
          <span class="stat-label">Polls I Voted In</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-content">
          <span class="stat-value">{{ totalVoters }}</span>
          <span class="stat-label">Total Participants</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🎁</span>
        <div class="stat-content">
          <span class="stat-value">{{ votingRewards }}</span>
          <span class="stat-label">Voting Rewards</span>
        </div>
      </div>
    </div>

    <!-- 投票类型标签 -->
    <div class="tabs-container">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- 投票列表 -->
    <div class="polls-list">
      <div v-if="filteredPolls.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No polls yet</p>
      </div>

      <div
        v-for="poll in filteredPolls"
        :key="poll.id"
        :class="['poll-card', { ended: poll.status === 'ended', voted: poll.hasVoted }]"
      >
        <div class="poll-header">
          <div class="poll-type-badge" :class="poll.type">
            {{ getPollTypeText(poll.type) }}
          </div>
          <div class="poll-status">
            <span v-if="poll.status === 'active'" class="status-active">
              <span class="pulse"></span>
              Active
            </span>
            <span v-else class="status-ended">Ended</span>
          </div>
        </div>

        <h3 class="poll-title">{{ poll.title }}</h3>
        <p class="poll-description">{{ poll.description }}</p>

        <!-- 投票选项 -->
        <div class="poll-options">
          <div
            v-for="option in poll.options"
            :key="option.id"
            :class="['option-item', { selected: poll.userVote === option.id, winning: isWinningOption(poll, option) }]"
            @click="vote(poll, option)"
          >
            <div class="option-content">
              <img v-if="option.imageUrl" :src="getImageUrl(option.imageUrl)" class="option-image" />
              <div class="option-info">
                <span class="option-name">{{ option.name }}</span>
                <span v-if="option.ticker" class="option-ticker">${{ option.ticker }}</span>
              </div>
            </div>
            <div class="option-stats">
              <div class="vote-bar">
                <div
                  class="vote-fill"
                  :style="{ width: `${getVotePercent(poll, option)}%` }"
                ></div>
              </div>
              <div class="vote-info">
                <span class="vote-count">{{ option.votes }} votes</span>
                <span class="vote-percent">{{ getVotePercent(poll, option).toFixed(1) }}%</span>
              </div>
            </div>
            <div v-if="poll.userVote === option.id" class="voted-badge">✓ Voted</div>
          </div>
        </div>

        <!-- 投票信息 -->
        <div class="poll-footer">
          <div class="poll-meta">
            <span class="meta-item">
              <span class="meta-icon">👥</span>
              {{ poll.totalVotes }} participants
            </span>
            <span class="meta-item">
              <span class="meta-icon">⏰</span>
              {{ poll.status === 'active' ? `Time left: ${formatTimeLeft(poll.endTime)}` : formatDate(poll.endTime) + ' ended' }}
            </span>
          </div>
          <div class="poll-rewards" v-if="poll.rewards">
            <span class="reward-icon">🎁</span>
            <span class="reward-text">Participation reward: {{ poll.rewards }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建投票 -->
    <div v-if="canCreatePoll" class="create-section">
      <h2 class="section-title">📝 Create a Poll</h2>
      <div class="create-form">
        <div class="form-group">
          <label>Poll Title</label>
          <input
            v-model="newPoll.title"
            type="text"
            placeholder="Enter poll title..."
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Poll Description</label>
          <textarea
            v-model="newPoll.description"
            placeholder="Describe the poll in detail..."
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Poll Type</label>
          <div class="type-selector">
            <button
              v-for="type in pollTypes"
              :key="type.id"
              :class="['type-btn', { active: newPoll.type === type.id }]"
              @click="newPoll.type = type.id"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Poll Options</label>
          <div class="options-editor">
            <div
              v-for="(option, index) in newPoll.options"
              :key="index"
              class="option-input-row"
            >
              <input
                v-model="option.name"
                type="text"
                :placeholder="`Option ${index + 1}`"
                class="form-input"
              />
              <button
                v-if="newPoll.options.length > 2"
                class="remove-option-btn"
                @click="removeOption(index)"
              >
                ×
              </button>
            </div>
            <button
              v-if="newPoll.options.length < 6"
              class="add-option-btn"
              @click="addOption"
            >
              + Add option
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Duration</label>
          <select v-model="newPoll.duration" class="form-select">
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
          </select>
        </div>
        <button class="create-btn" @click="createPoll" :disabled="!canSubmitPoll">
          Create Poll
        </button>
      </div>
    </div>

    <!-- 历史投票 -->
    <div class="history-section">
      <h2 class="section-title">📜 Poll History</h2>
      <div class="history-list">
        <div v-for="poll in endedPolls.slice(0, 5)" :key="poll.id" class="history-item">
          <div class="history-info">
            <span class="history-title">{{ poll.title }}</span>
            <span class="history-result">
              Winner: {{ getWinningOption(poll)?.name }}
            </span>
          </div>
          <div class="history-stats">
            <span>{{ poll.totalVotes }} votes</span>
            <span>{{ formatDate(poll.endTime) }}</span>
          </div>
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

// 状态
const activeTab = ref('active')
const polls = ref([])
const userVoteCount = ref(0)
const totalVoters = ref(0)
const votingRewards = ref('0 Copper')
const loading = ref(false)

// 新投票表单
const newPoll = ref({
  title: '',
  description: '',
  type: 'rating',
  options: [{ name: '' }, { name: '' }],
  duration: '3'
})

// 配置
const tabs = ref([
  { id: 'active', label: 'Active', icon: '🔥', count: 0 },
  { id: 'ended', label: 'Ended', icon: '✅', count: 0 },
  { id: 'my', label: 'Voted', icon: '👤', count: 0 }
])

const pollTypes = [
  { id: 'rating', label: 'Meme Rating', icon: '⭐' },
  { id: 'feature', label: 'Feature Request', icon: '💡' },
  { id: 'event', label: 'Event Poll', icon: '🎉' },
  { id: 'other', label: 'Other', icon: '📋' }
]

// 计算属性
const activePolls = computed(() => polls.value.filter(p => p.status === 'active'))
const endedPolls = computed(() => polls.value.filter(p => p.status === 'ended'))

const filteredPolls = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return activePolls.value
    case 'ended':
      return endedPolls.value
    case 'my':
      return polls.value.filter(p => p.hasVoted)
    default:
      return polls.value
  }
})

const canCreatePoll = computed(() => !!authStore.username)

const canSubmitPoll = computed(() => {
  return newPoll.value.title.trim() &&
         newPoll.value.options.filter(o => o.name.trim()).length >= 2
})

// 从API获取投票列表
const fetchPolls = async () => {
  loading.value = true
  try {
    const response = await fetch(`${serverIp}/api/polls`, {
      headers: { 'token': authStore.username || '' }
    })
    const data = await response.json()
    if (data.code === 0) {
      polls.value = data.data || []
      updateTabCounts()
    }
  } catch (error) {
    console.error('获取投票列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await fetch(`${serverIp}/api/polls/stats`)
    const data = await response.json()
    if (data.code === 0) {
      totalVoters.value = data.data.totalVoters || 0
      userVoteCount.value = polls.value.filter(p => p.hasVoted).length
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 更新标签计数
const updateTabCounts = () => {
  tabs.value[0].count = activePolls.value.length
  tabs.value[1].count = endedPolls.value.length
  tabs.value[2].count = polls.value.filter(p => p.hasVoted).length
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${serverIp}${url.startsWith('/') ? '' : '/'}${url}`
}

// 方法
const getPollTypeText = (type) => {
  const map = {
    rating: '⭐ Meme Rating',
    feature: '💡 Feature Request',
    event: '🎉 Event Poll',
    other: '📋 Other'
  }
  return map[type] || type
}

const getVotePercent = (poll, option) => {
  if (poll.totalVotes === 0) return 0
  return (option.votes / poll.totalVotes) * 100
}

const isWinningOption = (poll, option) => {
  if (poll.status !== 'ended') return false
  const maxVotes = Math.max(...poll.options.map(o => o.votes))
  return option.votes === maxVotes
}

const getWinningOption = (poll) => {
  if (!poll.options || poll.options.length === 0) return null
  const maxVotes = Math.max(...poll.options.map(o => o.votes))
  return poll.options.find(o => o.votes === maxVotes)
}

const formatTimeLeft = (endTime) => {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end - now

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return 'Ending soon'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US')
}

const vote = async (poll, option) => {
  if (poll.status !== 'active' || poll.hasVoted) return
  if (!authStore.username) {
    alert('Please log in first')
    return
  }

  try {
    const response = await fetch(`${serverIp}/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username
      },
      body: JSON.stringify({ optionIndex: option.id })
    })

    const data = await response.json()
    if (data.code === 0) {
      // 更新本地状态
      poll.userVote = option.id
      poll.hasVoted = true
      poll.totalVotes = data.data.totalVotes
      poll.options = data.data.options || poll.options
      updateTabCounts()
    } else {
      alert(data.message || 'Voting failed')
    }
  } catch (error) {
    console.error('Voting failed:', error)
    alert('Voting failed. Please try again.')
  }
}

const addOption = () => {
  if (newPoll.value.options.length < 6) {
    newPoll.value.options.push({ name: '' })
  }
}

const removeOption = (index) => {
  if (newPoll.value.options.length > 2) {
    newPoll.value.options.splice(index, 1)
  }
}

const createPoll = async () => {
  if (!canSubmitPoll.value) return
  if (!authStore.username) {
    alert('Please log in first')
    return
  }

  try {
    const response = await fetch(`${serverIp}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username
      },
      body: JSON.stringify({
        title: newPoll.value.title,
        description: newPoll.value.description,
        type: newPoll.value.type,
        options: newPoll.value.options.filter(o => o.name.trim()),
        duration: newPoll.value.duration
      })
    })

    const data = await response.json()
    if (data.code === 0) {
      // 重置表单
      newPoll.value = {
        title: '',
        description: '',
        type: 'rating',
        options: [{ name: '' }, { name: '' }],
        duration: '3'
      }
      await fetchPolls()
      alert('Poll created successfully!')
    } else {
      alert(data.message || 'Creation failed')
    }
  } catch (error) {
    console.error('Failed to create poll:', error)
    alert('Creation failed. Please try again.')
  }
}

onMounted(async () => {
  await fetchPolls()
  await fetchStats()
})
</script>

<style scoped>
.voting-page {
  max-width: 1000px;
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
  background: linear-gradient(135deg, #7f5af0, #ff6b35);
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

/* 统计卡片 */
.stats-section {
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

.stat-card.highlight {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.15), rgba(255, 107, 53, 0.1));
  border-color: rgba(127, 90, 240, 0.3);
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

/* 标签 */
.tabs-container {
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px;
  border-radius: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #fff;
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.3), rgba(255, 107, 53, 0.2));
  color: #fff;
  font-weight: 600;
}

.tab-count {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
}

/* 投票卡片 */
.polls-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.poll-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s;
}

.poll-card:hover {
  border-color: rgba(127, 90, 240, 0.3);
}

.poll-card.ended {
  opacity: 0.8;
}

.poll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.poll-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.poll-type-badge.rating {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.poll-type-badge.feature {
  background: rgba(0, 208, 132, 0.2);
  color: #00d084;
}

.poll-type-badge.event {
  background: rgba(255, 107, 53, 0.2);
  color: #ff6b35;
}

.poll-type-badge.other {
  background: rgba(127, 90, 240, 0.2);
  color: #7f5af0;
}

.poll-status {
  font-size: 13px;
}

.status-active {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #00d084;
}

.status-active .pulse {
  width: 8px;
  height: 8px;
  background: #00d084;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-ended {
  color: #888;
}

.poll-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
}

.poll-description {
  color: #888;
  font-size: 14px;
  margin: 0 0 20px;
}

/* 投票选项 */
.poll-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.option-item.selected {
  background: rgba(127, 90, 240, 0.1);
  border-color: rgba(127, 90, 240, 0.4);
}

.option-item.winning {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.4);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.option-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-weight: 600;
}

.option-ticker {
  font-size: 12px;
  color: #7f5af0;
}

.option-stats {
  flex: 1;
}

.vote-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.vote-fill {
  height: 100%;
  background: linear-gradient(90deg, #7f5af0, #2ec4b6);
  border-radius: 4px;
  transition: width 0.3s;
}

.option-item.winning .vote-fill {
  background: linear-gradient(90deg, #ffd700, #ff6b35);
}

.vote-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.voted-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: #7f5af0;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

/* 投票底部 */
.poll-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.poll-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #888;
}

.poll-rewards {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #ffd700;
}

/* 创建投票 */
.create-section {
  background: linear-gradient(135deg, rgba(127, 90, 240, 0.1), rgba(255, 107, 53, 0.05));
  border: 1px solid rgba(127, 90, 240, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #7f5af0;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-btn {
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.type-btn.active {
  background: rgba(127, 90, 240, 0.2);
  border-color: #7f5af0;
  color: #fff;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-input-row {
  display: flex;
  gap: 10px;
}

.remove-option-btn {
  width: 40px;
  background: rgba(255, 59, 105, 0.2);
  border: 1px solid rgba(255, 59, 105, 0.3);
  border-radius: 8px;
  color: #ff3b69;
  font-size: 18px;
  cursor: pointer;
}

.add-option-btn {
  padding: 10px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-option-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.create-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, #7f5af0, #ff6b35);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(127, 90, 240, 0.3);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 历史记录 */
.history-section {
  margin-bottom: 40px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-title {
  font-weight: 600;
}

.history-result {
  font-size: 13px;
  color: #ffd700;
}

.history-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #888;
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

/* 响应式 */
@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs {
    flex-wrap: wrap;
  }

  .poll-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>

