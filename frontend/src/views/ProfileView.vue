<template>
  <div>
    <!-- 错误提示 -->
    <div v-if="error" style="text-align: center; padding: 50px; color: #f56c6c;">
      {{ error }}
    </div>

    <!-- 正常显示（包括加载时也显示默认头像） -->
    <div v-else>
      <ProfileHeader :userData="userData" @update:userData="handleUserDataUpdate" />

      <ProfileStats :userData="userData" :isOwnProfile="isOwnProfile" />

      <Tabs 
        :userData="userData" 
        :isOwnProfile="isOwnProfile" 
        @refresh="fetchUserProfile"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import Tabs from '@/components/profile/Tabs.vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

const route = useRoute() // 获取路由实例
const username = ref(route.params.id) // 获取动态路由参数 :id（用户名或用户ID）
const authStore = useAuthStore()

// 判断是否是当前用户自己的主页
const isOwnProfile = computed(() => {
  const currentUsername = authStore.username
  const profileUsername = username.value
  return currentUsername === profileUsername
})

const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

const createDefaultMemesData = () => ({
  '我创作的模因': [],
  '我的模因币': [],
  '我的收藏': [],
  '粉丝': [],
  '关注': [],
})

// 用户数据（包含所有信息）
const userData = ref({
  id: '',
  avatar: defaultAvatar, // 默认头像
  nickname: '',
  username: '',
  email: '',
  bio: '',
  followers: 0,
  following: 0,
  likes: 0,
  collections: 0,
  isFollowing: false,
  memesData: createDefaultMemesData()
})

// 加载状态
const loading = ref(true)
const error = ref('')

// 从后端获取用户数据
const fetchUserProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const currentUsername = username.value // 使用 ref 的值
    console.log('正在获取用户信息，用户名/ID:', currentUsername)
    const url = `${server_ip}/api/user/${currentUsername}`
    console.log('请求URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username || authStore.token || '', // 传递用户名作为token（后端当前使用用户名作为token）
      },
    })

    console.log('响应状态:', response.status, response.statusText)
    const result = await response.json()
    console.log('API返回结果:', result)

    if (response.ok && result.code === 0) {
      // 更新用户数据（包含所有信息）
      const data = result.data
      console.log('用户数据:', data)
      console.log('粉丝列表数据:', data.memesData?.['粉丝'])
      console.log('当前登录用户:', authStore.username, '查看的用户:', username.value, '是否自己的主页:', isOwnProfile.value)
      const normalizedMemesData = {
        ...createDefaultMemesData(),
        ...(data.memesData || {})
      }

      userData.value = {
        id: data.id,
        avatar: data.avatar || defaultAvatar, // 如果没有头像，使用默认头像
        nickname: data.nickname,
        username: data.username,
        email: data.email || '',
        bio: data.bio,
        followers: data.followers,
        following: data.following,
        likes: data.likes,
        coins: data.coins || 0, // 用户 USDT 余额
        collections: normalizedMemesData['我的收藏']?.length || 0,
        isFollowing: Boolean(data.isFollowing),
        memesData: normalizedMemesData
      }
      console.log('更新后的userData:', userData.value)
      console.log('更新后的粉丝列表:', userData.value.memesData['粉丝'])
    } else {
      error.value = result.message || '获取用户信息失败'
      console.error('获取用户信息失败:', result)
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取用户信息时发生错误:', err)
  } finally {
    loading.value = false
  }
  // console.log("111111111111111", userData.value.memesData['我创建的模因'])
}

// 处理用户数据更新
const buildAvatarUrlWithTimestamp = (url) => {
  if (!url) return url

  // data/blob URL 不需要额外处理
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  const timestamp = Date.now().toString()

  try {
    const [base, ...rest] = url.split('?')
    const originalQuery = rest.join('?')
    const params = new URLSearchParams(originalQuery)
    params.set('t', timestamp)
    const queryString = params.toString()
    return queryString ? `${base}?${queryString}` : `${base}?t=${timestamp}`
  } catch (error) {
    console.warn('构建头像URL失败，返回原始URL:', error)
    return url
  }
}

const handleUserDataUpdate = (updatedData) => {
  console.log('ProfileView - 收到用户数据更新:', updatedData)
  // 更新本地数据
  if (updatedData) {
    if (updatedData.nickname !== undefined) {
      userData.value.nickname = updatedData.nickname
    }
    if (updatedData.bio !== undefined) {
      userData.value.bio = updatedData.bio
    }
    if (updatedData.email !== undefined) {
      userData.value.email = updatedData.email
    }
    if (updatedData.avatar !== undefined && updatedData.avatar) {
      // 如果头像URL更新了，确保使用新的URL，同时保留原有查询参数
      userData.value.avatar = buildAvatarUrlWithTimestamp(updatedData.avatar)
      console.log('ProfileView - 更新头像URL:', userData.value.avatar)
    }
    if (typeof updatedData.followers === 'number') {
      userData.value.followers = Math.max(0, updatedData.followers)
    }
    if (updatedData.isFollowing !== undefined) {
      userData.value.isFollowing = updatedData.isFollowing
    }
  }
  console.log('ProfileView - 更新后的userData:', userData.value)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUserProfile()
})

// 监听路由参数变化，当用户名变化时重新获取数据
watch(() => route.params.id, (newId) => {
  if (newId) {
    username.value = newId
    fetchUserProfile()
  }
})
</script>