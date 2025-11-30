<script setup>
import Search from '../components/Search.vue'
import SearchedProjects from '../components/SearchedProject.vue'
import SearchUsers from '../components/SearchUsers.vue'
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchResults = ref([])
const userResults = ref([])
const searchKeyword = ref('')
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

// 执行一次搜索
const fetchSearchResults = async () => {
  if (!searchKeyword.value) return

  try {
    // 并行搜索模因和用户
    const [memeRes, userRes] = await Promise.all([
      fetch(
        `${server_ip}/api/search-meme?q=${encodeURIComponent(searchKeyword.value)}&sortBy=time&sortOrder=des`
      ),
      fetch(
        `${server_ip}/api/search-user?q=${encodeURIComponent(searchKeyword.value)}`
      )
    ])

    const memeData = await memeRes.json()
    const userData = await userRes.json()

    searchResults.value = memeData.memeIds || []

    // console.log("userResponse:", userRes)
    // console.log("用户搜索数据:", userData)
    // 获取用户详细信息
    if (userData.userIds && userData.userIds.length > 0) {
      const userDetails = await Promise.all(
        userData.userIds.map(username =>
          fetch(`${server_ip}/api/user/${username}`)
            .then(res => res.json())
            .then(userResponse => {
              // 后端返回格式: { code: 0, data: { ... }, message: "获取用户信息成功" }
              if (userResponse.code === 0 && userResponse.data) {
                return {
                  username: userResponse.data.username,
                  nickname: userResponse.data.nickname,
                  avatarUrl: userResponse.data.avatar,
                  bio: userResponse.data.bio,
                  followersCount: userResponse.data.followers?.length || 0,
                  followingCount: userResponse.data.following?.length || 0,
                  memesCount: userResponse.data.memesData?.我创作的模因?.length || 0,
                  isFollowing: userResponse.data.isFollowing || false,
                  id: userResponse.data.id
                }
              }
              return null
            })
            .catch(err => {
              console.error('获取用户信息失败:', username, err)
              return null
            })
        )
      )
        // console.log("处理后的用户详细信息:", userDetails)
      userResults.value = userDetails.filter(user => user !== null)
      // console.log("最终用户结果:", userResults.value)
    } else {
      userResults.value = []
    }

    // console.log("模因结果:", searchResults.value)
    // console.log("用户结果:", userResults.value)
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
    userResults.value = []
  }
}

const goBack = () => {
  router.push('/')
}

// 首次进入页面
onMounted(() => {
  searchKeyword.value = route.query.keyword || ''
  fetchSearchResults()
})

// 监听路由 keyword 变化 → 自动重新搜索
watch(
  () => route.query.keyword,
  (newVal) => {
    searchKeyword.value = newVal || ''
    fetchSearchResults()
  }
)
</script>



<template>
  <main>
    <!-- <TheWelcome /> -->
     <header class="content-header">
        <h1>搜索结果</h1>
        <p>发现有趣的模因和创作者</p>
      </header>
      <div class="search-wrapper">
        <Search />
      </div>
      <div class="content-card">
        <!-- 用户搜索结果 -->
        <SearchUsers :users="userResults" />

        <!-- 模因搜索结果 -->
        <div v-if="userResults.length > 0" class="section-divider">
          <div class="divider-line"></div>
          <div class="divider-text">模因</div>
          <div class="divider-line"></div>
        </div>

        <SearchedProjects :results="searchResults" />

        <!-- 未找到搜索结果时的提示 -->
        <div v-if="searchKeyword && searchResults.length === 0 && userResults.length === 0" class="no-results">
          <div class="no-results-icon">🔍</div>
          <h2>未找到相关内容</h2>
          <p>没有找到与 "<strong>{{ searchKeyword }}</strong>" 相关的用户或模因</p>
          <p class="no-results-suggestion">试试其他关键词或检查拼写</p>
          <button @click="goBack" class="back-button">
            ← 返回主页
          </button>
        </div>

        <!-- 找到用户但未找到模因时的提示 -->
        <div v-if="searchKeyword && searchResults.length === 0 && userResults.length > 0" class="no-results">
          <div class="no-results-icon">🖼️</div>
          <h2>未找到相关模因</h2>
          <p>没有找到与 "<strong>{{ searchKeyword }}</strong>" 相关的模因</p>
          <p class="no-results-suggestion">试试其他关键词或查看上方找到的用户</p>
        </div>
      </div>
  </main>
</template>

<style scoped>

.search-wrapper {
  width: 100%;
  max-width: 500px;
  display: flex;
  margin: 0 auto;
}

.content-header {
  text-align: center;
  margin-bottom: 30px;
}

.content-header h1 {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.content-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.content-card {
  /* width: 100%; */
  width: 1250px;
  /* max-width: 1200px;  */
  margin: 0 auto;    
  box-sizing: border-box;
  background-color: #000000;
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.no-results h2 {
  font-size: 28px;
  margin-bottom: 15px;
  color: #e0e0e0;
}

.no-results p {
  font-size: 16px;
  color: #b0b0b0;
  margin-bottom: 10px;
  line-height: 1.5;
}

.no-results-suggestion {
  font-size: 14px;
  color: #888;
  margin-top: 20px;
  margin-bottom: 30px;
}

.back-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.back-button:hover {
  background-color: #45a049;
}

.back-button:active {
  transform: translateY(1px);
}

.section-divider {
  display: flex;
  align-items: center;
  margin: 32px 0 24px 0;
  gap: 16px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.divider-text {
  color: #888;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  background: linear-gradient(135deg, #65c281, #4caf50);
  color: white;
  border-radius: 12px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }

  .no-results {
    padding: 40px 15px;
  }

  .no-results-icon {
    font-size: 36px;
  }

  .no-results h2 {
    font-size: 24px;
  }

  .no-results p {
    font-size: 14px;
  }
}
</style>