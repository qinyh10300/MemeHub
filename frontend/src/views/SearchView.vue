<script setup>
import Search from '../components/Search.vue'
import SearchedProjects from '../components/SearchedProject.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const searchResults = ref([])
const searchKeyword = ref('')

onMounted(() => {
  // 获取 params 中的 keyword
  searchKeyword.value = route.query.keyword
  
  // 获取 state 中的 searchResults
  if (route.state && route.state.searchResults) {
    searchResults.value = route.state.searchResults
  }

  // 打印所有信息
  console.log('搜索ID:', searchKeyword.value)
  console.log('搜索结果:', searchResults.value)
  console.log('完整路由信息:', route)
})
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