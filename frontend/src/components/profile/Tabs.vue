<template>
  <div class="profile-section">
    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-button', activeTab === tab ? 'active' : '']"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- ✅ 模因项改为按钮，但外观保持不变 -->
      <button
        v-for="meme in pagedMemes"
        :key="meme.code"
        class="meme-item"
        @click="goToMemeDetail(meme.code)"
      >
        <img :src="meme.image" alt="meme" class="meme-image" />
        <div class="meme-info">
          <h3 class="meme-name">{{ meme.name }}</h3>
          <p class="meme-code">代号: {{ meme.code }}</p>
          <p class="meme-desc">{{ meme.description }}</p>
        </div>
      </button>

      <!-- 分页按钮 -->
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// ✅ 使用 Vue Router
const router = useRouter()

// ✅ 接收 props
const props = defineProps({
  userData: Object,
})

// Tabs
const tabs = ['我创作的模因', '我的模因币', '我的收藏', '粉丝']
const activeTab = ref('我创作的模因')

// 当前页
const currentPage = ref(1)
const itemsPerPage = 4

// 每次切换 tab，重置分页
watch(activeTab, () => {
  currentPage.value = 1
})

// ✅ 点击跳转函数
const goToMemeDetail = (id) => {
  router.push(`/meme/${id}`)
}

// 计算当前页数据
const pagedMemes = computed(() => {
  if (!props.userData || !props.userData.memesData) return []
  const allMemes = props.userData.memesData[activeTab.value] || []
  const start = (currentPage.value - 1) * itemsPerPage
  return allMemes.slice(start, start + itemsPerPage)
})

// 总页数
const totalPages = computed(() => {
  if (!props.userData || !props.userData.memesData) return 0
  const allMemes = props.userData.memesData[activeTab.value] || []
  return Math.ceil(allMemes.length / itemsPerPage)
})
</script>

<style scoped>
.profile-section {
  position: absolute;
  top: 230px;
  left: 100px;
  width: 600px;
}

.tabs {
  display: flex;
  gap: 50px;
  border-bottom: 1px solid #817f7f;
  margin-bottom: 12px;
}

.tab-button {
  background: none;
  border: none;
  padding: 10px 0;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.tab-button.active {
  color: #4b9c6b;
  border-bottom: 2px solid #4b9c6b;
}

.tab-content {
  padding: 10px 0;
}

/* ✅ 模因按钮去除默认按钮样式 */
.meme-item {
  all: unset; /* ← 移除所有默认样式 */
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #edecef;
  padding-bottom: 8px;
  cursor: pointer;
  width: 600px;
}

/* ✅ 鼠标悬停效果（可选） */
.meme-item:hover {
  background: #6cc648;
}

.meme-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.meme-info {
  flex: 1;
}

.meme-name {
  font-weight: 600;
  margin: 0;
}

.meme-code {
  font-size: 12px;
  color: #999;
  margin: 2px 0;
}

.meme-desc {
  font-size: 14px;
  color: #555;
  margin: 0;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.pagination button {
  padding: 4px 12px;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
