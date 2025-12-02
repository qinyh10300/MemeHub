<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

const searchQuery = ref('')
const router = useRouter()
const isLoading = ref(false)

// 点击"搜索"按钮后的处理逻辑
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isLoading.value = true
  try {
    // 调用搜索 API
    // const res = await fetch(`${server_ip}/api/search-meme?keyword=${encodeURIComponent(searchQuery.value.trim())}&sortBy=time&sortOrder=des`)
    // // const res = await fetch(`${server_ip}/api/search-meme?`, {
    // //   method: 'POST',
    // //   headers: {
    // //     'token': authStore.username || authStore.token || '' // 传递用户名作为token
    // //     // 注意：不要设置 Content-Type，让浏览器自动设置（包含 boundary）
    // //   }
    // // })
    // console.log('搜索请求发送:', {
    //   url: `${server_ip}/api/search-meme`,
    //   keyword: searchQuery.value.trim(),
    //   response: res
    // })
    // if (!res.ok) {
    //   throw new Error('搜索失败')
    // }
    
    // const searchResults = await res.json()
    // console.log('搜索结果:', searchResults.memeIds)
    // 将搜索结果通过路由跳转传递到 SearchView
    // await router.push({
    //   name: 'SearchView',
    //   query: { 
    //     keyword: searchQuery.value.trim(),
    //     // memeIds: searchResults.memeIds 
    //   },
    //   state: { 
    //     searchResults: searchResults.memeIds
    //   }
    // })
    await router.push({
      name: 'SearchView',
      query: { 
        keyword: searchQuery.value.trim()
      }
    })
    
    
  } catch (error) {
    console.error('搜索错误:', error)
    alert('搜索失败，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="search-container">
    <div class="search-box">
      <div class="input-wrapper">
        <img class="search-icon" src="@/assets/search.png" alt="Search" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索模因、用户或关键词..."
          @keyup.enter="handleSearch"
        />
      </div>
      <span class="search-label" @click="handleSearch">搜索</span>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  /* background: 000; */
  width: 100%;
  max-width: 500px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-label {
  background: #65c281;
  color: black;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.3s ease;
}

.search-label:hover {
  background: #4fad6e;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  width: 10%;
  height: 100%;
  position: absolute;
  left: 0px;
  top: 50%;
  transform: translateY(-50%) scale(0.6);
  font-size: 16px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #3a3b3b;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
  background: rgb(0, 0, 0);
  color: white;
}

.search-input:focus {
  border-color: #65c281;
}

.search-input::placeholder {
  color: #9ca3af;
}
</style>
