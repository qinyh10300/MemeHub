<template>
  <div v-if="userData" class="profile-header">
    <div 
      :class="['avatar-wrapper', { 'clickable': isOwnProfile }]"
      @click="isOwnProfile ? openAvatarModal() : null"
    >
      <img 
        :key="avatarUrl"
        :src="avatarUrl" 
        alt="avatar" 
        class="avatar" 
        @error="handleAvatarError"
      />
      <div v-if="isOwnProfile" class="avatar-overlay">
        <span class="avatar-hint">点击更换头像</span>
      </div>
    </div>
    <div class="user-info">
      <h2 class="nickname">{{ userData.nickname }}</h2>
      <p class="username">{{ userData.username }}</p>
      <p class="bio">{{ userData.bio }}</p>
    </div>
    <div class="action-container">
      <button v-if="isOwnProfile" class="config-button" @click="openModal">编辑</button>
      <div v-else class="follow-wrapper">
        <div class="user-actions">
          <button
            class="follow-button"
            :class="{ following: userData?.isFollowing }"
            :disabled="followLoading || !isLoggedIn"
            @click="handleFollowToggle"
          >
            {{ followLoading ? '处理中...' : followButtonLabel }}
          </button>
          <button class="message-button" @click="handleSendMessage">
            私信
          </button>
        </div>
        <p v-if="followError" class="follow-error">{{ followError }}</p>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <EditModal
      v-if="isModalOpen"
      :nickname="userData?.nickname || ''"
      :bio="userData?.bio || ''"
      :email="userData?.email || ''"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- 头像选择弹窗 -->
    <AvatarModal
      v-if="isAvatarModalOpen"
      :currentAvatar="userData?.avatar || ''"
      @close="closeAvatarModal"
      @save="handleAvatarSave"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import EditModal from './EditModal.vue'
import AvatarModal from './AvatarModal.vue'
import { useAuthStore } from '@/stores/auth'
import { emitTaskProgress } from '@/utils/gamificationEvents'

const props = defineProps({
  userData: Object,
})

const emit = defineEmits(['update:userData'])

const router = useRouter()
const authStore = useAuthStore()

// 判断是否是当前用户自己的主页
const isOwnProfile = computed(() => {
  const currentUsername = authStore.username
  const profileUsername = props.userData?.username?.replace('@', '')
  return currentUsername === profileUsername
})

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 计算头像URL，如果为空或加载失败则使用默认头像
const avatarUrl = computed(() => {
  return props.userData?.avatar || defaultAvatar
})

const serverIp = authStore.server_ip // 后端服务器地址
// const serverIp = computed(() => authStore.server_ip || 'http://localhost:3000')
const storedUserToken = computed(() => authStore.user_token || authStore.username || authStore.token || '')
const isLoggedIn = computed(() => !!storedUserToken.value)
const followLoading = ref(false)
const followError = ref('')
const followButtonLabel = computed(() => (props.userData?.isFollowing ? '取消关注' : '关注'))

// 头像加载失败时的处理
const handleAvatarError = (event) => {
  console.log('头像加载失败 - 当前URL:', event.target.src)
  // 如果当前不是默认头像，且不是刚上传的头像，则切换到默认头像
  // 避免刚上传的头像因为加载延迟而被误判为失败
  const currentSrc = event.target.src
  if (currentSrc !== defaultAvatar && !currentSrc.includes('/avatars/')) {
    console.log('切换到默认头像')
    event.target.src = defaultAvatar
  } else if (currentSrc.includes('/avatars/')) {
    // 如果是上传的头像加载失败，可能是URL问题，尝试重新加载
    console.log('上传的头像加载失败，尝试重新加载')
    // 添加时间戳强制重新加载
    const urlWithTimestamp = currentSrc.includes('?') 
      ? currentSrc.split('?')[0] + '?t=' + Date.now()
      : currentSrc + '?t=' + Date.now()
    event.target.src = urlWithTimestamp
  }
}

const isModalOpen = ref(false)
const isAvatarModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const openAvatarModal = () => {
  // 只有当前用户才能更换头像
  const currentUsername = authStore.username
  const profileUsername = props.userData?.username?.replace('@', '')
  
  if (currentUsername === profileUsername) {
    isAvatarModalOpen.value = true
  }
}

const closeAvatarModal = () => {
  isAvatarModalOpen.value = false
}

const handleSave = (data) => {
  // 通知父组件数据已更新
  emit('update:userData', {
    ...props.userData,
    nickname: data.nickname,
    bio: data.bio,
    email: data.email,
  })
  closeModal()
}

const handleAvatarSave = (data) => {
  console.log('ProfileHeader - 收到头像更新:', data)
  // 确保avatar存在且不为空
  if (!data || !data.avatar) {
    console.error('ProfileHeader - 收到的头像数据无效:', data)
    return
  }
  // 通知父组件头像已更新
  const updatedData = {
    ...props.userData,
    avatar: data.avatar,
  }
  console.log('ProfileHeader - 发送更新数据，新头像URL:', updatedData.avatar)
  emit('update:userData', updatedData)
  closeAvatarModal()
}

const handleFollowToggle = async () => {
  if (!props.userData) {
    return
  }
  if (!isLoggedIn.value) {
    followError.value = '请先登录后再关注用户'
    return
  }

  const targetUsername = props.userData.username?.replace('@', '')
  if (!targetUsername) {
    followError.value = '无法获取用户信息'
    return
  }

  followLoading.value = true
  followError.value = ''
  const wasFollowing = !!props.userData?.isFollowing
  try {
    const response = await fetch(`${serverIp}/api/user/${targetUsername}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: storedUserToken.value
      }
    })
    const result = await response.json()
    if (!response.ok || result.code !== 0) {
      throw new Error(result.message || '操作失败，请稍后重试')
    }
    const isFollowing = !!result.isFollowing
    const followerDelta = isFollowing ? 1 : -1
    const nextFollowers = Math.max(0, (props.userData.followers || 0) + followerDelta)
    emit('update:userData', {
      ...props.userData,
      isFollowing,
      followers: nextFollowers
    })
    if (isFollowing && !wasFollowing) {
      emitTaskProgress('growth-follow', 1, { username: authStore.username || 'guest' })
    }
  } catch (error) {
    console.error('关注/取消关注失败:', error)
    followError.value = error.message || '操作失败，请稍后重试'
  } finally {
    followLoading.value = false
  }
}

const handleSendMessage = () => {
  if (!isLoggedIn.value) {
    alert('请先登录')
    return
  }
  if (props.userData && props.userData.id) {
    router.push(`/chat?target=${props.userData.id}`)
  }
}
</script>

<style scoped>
.profile-header {
  position: absolute;
  display: flex;
  align-items: center;
  top: 70px;
  left: 100px;
  /* transform: translateX(-50%); */
}

.avatar-wrapper {
  position: relative;
  transition: transform 0.3s ease;
}

.avatar-wrapper.clickable {
  cursor: pointer;
}

.avatar-wrapper.clickable:hover {
  transform: scale(1.05);
}

.avatar-wrapper.clickable:hover .avatar-overlay {
  opacity: 1;
}

.avatar {
  width: 100px; /* w-20 */
  height: 100px; /* h-20 */
  border-radius: 50%; /* rounded-full */
  border: 1px solid #d1d5db; /* border-gray-300 */
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-hint {
  color: white;
  font-size: 12px;
  text-align: center;
  padding: 5px;
}

.user-info {
  margin-bottom: 10px;   /* 顶部距离 */
  margin-left: 15px;   /* 顶部距离 */
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600;  /* font-semibold */
  color: #4b9c6b;    /* 默认深色字体 */
  margin: 0;
}

.username {
  font-size: 0.875rem; /* 默认 Tailwind text-sm */
  color: #6b7280;      /* text-gray-500 */
  margin: 0;
}

.bio {
  display: flex;
  margin-bottom: 200px;   /* 顶部距离 */
  font-size: 1rem; /* 默认 Tailwind text-sm */
  color: #5c7a64;      /* text-gray-500 */
  margin: 0;
}

.config-button {
  margin-bottom: 10px;
  display: flex;
  background-color: #67bb6e;
  color: black;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1rem;
  font-size: 1.0rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.action-container {
  margin-left: 30px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.follow-wrapper {
  display: flex;
  flex-direction: column;
}

.user-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}

.follow-button {
  background-color: #34a853;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.follow-button.following {
  background-color: #6b7280;
}

.follow-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-button {
  background-color: #4285f4;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.message-button:hover {
  background-color: #3367d6;
}

.follow-error {
  margin: 0;
  font-size: 0.85rem;
  color: #f87171;
}
</style>

