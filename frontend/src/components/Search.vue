<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const searchQuery = ref('')
const router = useRouter()

// 点击“搜索”按钮后的处理逻辑
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
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
          placeholder="请输入关键词..."
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
