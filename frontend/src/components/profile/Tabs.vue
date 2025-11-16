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
      <!-- 粉丝列表：显示用户信息 -->
      <template v-if="activeTab === '粉丝'">
        <button
          v-for="follower in pagedMemes"
          :key="follower.id"
          class="meme-item"
          @click="goToUserProfile(follower.username)"
        >
          <img 
            :src="getAvatarUrl(follower.avatar, follower.id)" 
            alt="avatar" 
            class="meme-image"
            @error="handleAvatarError"
          />
          <div class="meme-info">
            <h3 class="meme-name">{{ follower.nickname }}</h3>
            <p class="meme-code">{{ follower.username }}</p>
            <p class="meme-desc">粉丝</p>
          </div>
        </button>
      </template>

      <!-- 模因列表：显示模因信息 -->
      <template v-else>
        <button
          v-for="meme in pagedMemes"
          :key="meme.id || meme.code"
          class="meme-item"
          @click="goToMemeDetail(meme.id)"
        >
          <img :src="meme.image" alt="meme" class="meme-image" />
          <div class="meme-info">
            <h3 class="meme-name">{{ meme.name }}</h3>
            <p class="meme-code">代号: {{ meme.code }}</p>
            <p class="meme-desc">{{ meme.description }}</p>
          </div>
        </button>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// ✅ 使用 Vue Router
const router = useRouter()

// ✅ 接收 props
const props = defineProps({
  userData: Object,
})

// Tabs
const tabs = ['我创作的模因', '我的模因币', '我的收藏', '粉丝']
const activeTab = ref('我创作的模因')

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
</style>
