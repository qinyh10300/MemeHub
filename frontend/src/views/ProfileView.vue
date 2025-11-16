<template>
  <div>
    <!-- 加载中 -->
    <div v-if="loading" style="text-align: center; padding: 50px; color: #fff;">
      加载中...
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" style="text-align: center; padding: 50px; color: #f56c6c;">
      {{ error }}
    </div>

    <!-- 正常显示 -->
    <div v-else>
      <ProfileHeader
        :avatar="user.avatar"
        :nickname="user.nickname"
        :username="user.username"
        :bio="user.bio"
      />

      <ProfileStats
        :followers="user.followers"
        :following="user.following"
        :likes="user.likes"
        :collections="user.collections"
      />

      <Tabs :memesData="memesData" />
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

// 用户数据
const user = ref({
  id: '',
  avatar: '',
  nickname: '',
  username: '',
  bio: '',
  followers: 0,
  following: 0,
  likes: 0,
  collections: 0,
})

// 模因数据
const memesData = ref({
  '我创作的模因': [],
  '我的模因币': [],
  '我的收藏': [],
  '粉丝': [],
})

// 加载状态
const loading = ref(true)
const error = ref('')

// 从后端获取用户数据
const fetchUserProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await fetch(`${server_ip}/api/user/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.token || '', // 传递token（如果需要）
      },
    })

    const result = await response.json()

    if (response.ok && result.code === 0) {
      // 更新用户数据
      const userData = result.data
      user.value = {
        id: userData.id,
        avatar: userData.avatar,
        nickname: userData.nickname,
        username: userData.username,
        bio: userData.bio,
        followers: userData.followers,
        following: userData.following,
        likes: userData.likes,
        collections: userData.memesData['我的收藏']?.length || 0,
      }

      // 更新模因数据
      memesData.value = userData.memesData || {
        '我创作的模因': [],
        '我的模因币': [],
        '我的收藏': [],
        '粉丝': [],
      }
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