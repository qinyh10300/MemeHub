<template>
  <div>
    <!-- 错误提示 -->
    <div v-if="error" style="text-align: center; padding: 50px; color: #f56c6c;">
      {{ error }}
    </div>

    <!-- 正常显示（包括加载时也显示默认头像） -->
    <div v-else>
      <ProfileHeader :userData="userData" />

      <ProfileStats :userData="userData" />

      <Tabs :userData="userData" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import Tabs from '@/components/profile/Tabs.vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

const route = useRoute() // 获取路由实例
const username = route.params.id // 获取动态路由参数 :id（用户名或用户ID）
const authStore = useAuthStore()

const server_ip = 'http://localhost:3000' // 后端服务器地址

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 用户数据（包含所有信息）
const userData = ref({
  id: '',
  avatar: defaultAvatar, // 默认头像
  nickname: '',
  username: '',
  bio: '',
  followers: 0,
  following: 0,
  likes: 0,
  collections: 0,
  memesData: {
    '我创作的模因': [],
    '我的模因币': [],
    '我的收藏': [],
    '粉丝': [],
  }
})

// 加载状态
const loading = ref(true)
const error = ref('')

// 从后端获取用户数据
const fetchUserProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('正在获取用户信息，用户名/ID:', username)
    const url = `${server_ip}/api/user/${username}`
    console.log('请求URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.token || '', // 传递token（如果需要）
      },
    })

    console.log('响应状态:', response.status, response.statusText)
    const result = await response.json()
    console.log('API返回结果:', result)

    if (response.ok && result.code === 0) {
      // 更新用户数据（包含所有信息）
      const data = result.data
      console.log('用户数据:', data)
      userData.value = {
        id: data.id,
        avatar: data.avatar || defaultAvatar, // 如果没有头像，使用默认头像
        nickname: data.nickname,
        username: data.username,
        bio: data.bio,
        followers: data.followers,
        following: data.following,
        likes: data.likes,
        collections: data.memesData['我的收藏']?.length || 0,
        memesData: data.memesData || {
          '我创作的模因': [],
          '我的模因币': [],
          '我的收藏': [],
          '粉丝': [],
        }
      }
      console.log('更新后的userData:', userData.value)
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
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUserProfile()
})
</script>