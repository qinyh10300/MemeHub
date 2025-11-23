<script setup>
import Search from '../components/Search.vue'
import SearchedProjects from '../components/SearchedProject.vue'
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const searchResults = ref([])
const searchKeyword = ref('')
const server_ip = 'http://localhost:3000'

// 执行一次搜索
const fetchSearchResults = async () => {
  if (!searchKeyword.value) return

  const res = await fetch(
    `${server_ip}/api/search-meme?keyword=${encodeURIComponent(searchKeyword.value)}&sortBy=time&sortOrder=des`
  )
  const data = await res.json()

  searchResults.value = data.memeIds || []
  // console.log("结果更新:", searchResults.value)
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
        <h1>Welcome to our platform</h1>
        <p>Explore and discover amazing projects</p>
      </header>
      <div class="search-wrapper">
        <Search />
      </div>
      <div class="content-card">
        <SearchedProjects :results="searchResults" />
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

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }
}
</style>