<template>
  <div class="search-container">
    <div class="search-box">
      <div class="input-wrapper">
        <img class="search-icon" src="@/assets/search.png" alt="Search"/>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="请输入关键词..."
        />
      </div>
      <span class="search-label">搜索</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
</script>

<style scoped>
.search-container {
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
}

.search-input:focus {
  border-color: #65c281;
}

.search-input::placeholder {
  color: #9ca3af;
}
</style>