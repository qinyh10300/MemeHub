<template>
  <div v-if="userData" class="profile-header">
    <div class="avatar-wrapper" @click="openAvatarModal">
      <img 
        :src="avatarUrl" 
        alt="avatar" 
        class="avatar" 
        @error="handleAvatarError"
      />
      <div class="avatar-overlay">
        <span class="avatar-hint">点击更换头像</span>
      </div>
    </div>
    <div class="user-info">
      <h2 class="nickname">{{ userData.nickname }}</h2>
      <p class="username">{{ userData.username }}</p>
      <p class="bio">{{ userData.bio }}</p>
    </div>
    <button class="config-button" @click="openModal">编辑</button>

    <!-- 编辑资料弹窗 -->
    <EditModal
      v-if="isModalOpen"
      :nickname="userData?.nickname || ''"
      :bio="userData?.bio || ''"
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
import EditModal from './EditModal.vue'
import AvatarModal from './AvatarModal.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  userData: Object,
})

const emit = defineEmits(['update:userData'])

const authStore = useAuthStore()

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 计算头像URL，如果为空或加载失败则使用默认头像
const avatarUrl = computed(() => {
  return props.userData?.avatar || defaultAvatar
})

// 头像加载失败时的处理
const handleAvatarError = (event) => {
  // 如果当前不是默认头像，则切换到默认头像
  if (event.target.src !== defaultAvatar) {
    event.target.src = defaultAvatar
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
  })
  closeModal()
}

const handleAvatarSave = (data) => {
  // 通知父组件头像已更新
  emit('update:userData', {
    ...props.userData,
    avatar: data.avatar,
  })
  closeAvatarModal()
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
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-wrapper:hover .avatar-overlay {
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
  margin-bottom: 10px;   /* 顶部距离 */
  margin-left: 30px;   /* 顶部距离 */
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
</style>
