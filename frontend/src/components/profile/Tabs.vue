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
      <!-- 粉丝 / 关注列表：仅自己可见 -->
      <template v-if="isUserListTab">
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

      <!-- 模因列表：显示模因信息 -->
      <template v-else>
        <div
          v-for="meme in pagedMemes"
          :key="meme.id || meme.code"
          class="meme-item-container"
        >
        <button
          class="meme-item"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ✅ 使用 Vue Router
const router = useRouter()
const authStore = useAuthStore()
const server_ip = authStore.server_ip || 'http://localhost:3000'

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

const userOnlyTabs = ['关注', '粉丝']

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

const isUserListTab = computed(() => isOwnProfile.value && userOnlyTabs.includes(activeTab.value))

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
</style>
