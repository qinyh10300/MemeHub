<template>
  <div class="featured-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <button
          class="filter-btn"
          :class="{ active: currentFilter === 'featured' }"
          @click="changeFilter('featured')"
        >
          热门 🔥
        </button>
        <!-- <label class="toggle">
          <input type="checkbox" v-model="nsfw" @change="fetchProjects" />
          <span>NSFW</span>
        </label> -->
        <label class="toggle">
          <input type="checkbox" v-model="animations" @change="fetchProjects" />
          <span>动画</span>
        </label>
      </div>

      <div class="filter-right">

         <!-- Grid视图按钮 -->
        <button
          class="view-btn"
          :class="{ active: isGridView }"
          @click="isGridView = true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
          </svg>
        </button>

        <!-- List视图按钮 -->
        <button
          class="view-btn"
          :class="{ active: !isGridView }"
          @click="isGridView = false"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <circle cx="4" cy="6" r="1.5" />
            <rect x="8" y="5" width="12" height="2" rx="1" />
            <circle cx="4" cy="12" r="1.5" />
            <rect x="8" y="11" width="12" height="2" rx="1" />
            <circle cx="4" cy="18" r="1.5" />
            <rect x="8" y="17" width="12" height="2" rx="1" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 卡片展示区 -->
    <div v-else :class="['card-grid', { list: !isGridView }]">
      <div v-for="(item, index) in projects" :key="index" class="project-card">
        <div class="thumb">
          <img :src="item.image" alt="project" />
        </div>

        <div class="info">
          <h3>{{ item.name }}</h3>
          <p class="symbol">{{ item.symbol }}</p>
          <div class="meta">
            <span class="user">🧠 {{ item.creator }}</span>
            <span class="time">{{ item.time }}</span>
          </div>
          <div class="mc-line">
            <span class="mc-label">MC</span>
            <span class="mc-value">${{ item.mc }}</span>
            <div class="bar">
              <div
                class="fill"
                :style="{
                  width: item.mcPercent + '%',
                  backgroundColor: item.change > 0 ? '#3fd67d' : '#e74c3c'
                }"
              ></div>
            </div>
            <span :class="['change', item.change > 0 ? 'up' : 'down']">
              {{ item.change > 0 ? '↑' : '↓' }}{{ Math.abs(item.change) }}%
            </span>
          </div>
          <p class="desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const nsfw = ref(false);
const animations = ref(true);
const currentFilter = ref("featured");
const isGridView = ref(true);

const loading = ref(false);
const error = ref(null);
const projects = ref([]);

/* 模拟数据请求 */
const fetchProjects = async () => {
  loading.value = true;
  error.value = null;

  try {
    const res = {
      data: [
        {
          name: "Dogecoin",
          symbol: "DOGE",
          creator: "2r5Vfc",
          time: "1h ago",
          mc: "18.2B",
          mcPercent: 80,
          change: +2.34,
          image: new URL('@/assets/doge.png', import.meta.url).href,
          desc: "Dogecoin（狗狗币）是一种以Doge表情包为灵感的加密货币，以社区驱动和趣味性著称，旨在让数字货币变得更加亲民有趣。"
        },
        {
          name: "Pepe the Frog",
          symbol: "PEPE",
          creator: "Matt Furie",
          time: "1h ago",
          mc: "653M",
          mcPercent: 91,
          change: +3.17,
          image: new URL('@/assets/pepe.avif', import.meta.url).href,
          desc: "Pepe the Frog（青蛙佩佩）起源于网络漫画，是网络文化中最具影响力的表情之一，后来被加密社区赋予象征幽默与团结的精神。"
        },
        {
          name: "Bored Ape Yacht Club",
          symbol: "BAYC",
          creator: "Yuga Labs",
          time: "3h ago",
          mc: "590M",
          mcPercent: 89,
          change: -1.24,
          image: new URL('@/assets/bayc.webp', import.meta.url).href,
          desc: "Bored Ape Yacht Club（无聊猿游艇俱乐部）是由Yuga Labs推出的知名NFT系列，共有1万只独特猿猴形象，象征数字身份、艺术品位与专属社群。"
        }

      ]
    };
    projects.value = res.data;
  } catch (err) {
    console.error(err);
    error.value = "Failed to load project data.";
  } finally {
    loading.value = false;
  }
};

const changeFilter = (type) => {
  currentFilter.value = type;
  fetchProjects();
};

onMounted(() => {
  fetchProjects();
});
</script>


<style scoped>
/* 右上角按钮 */
.view-btn {
  background-color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  color: #fff;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: background-color 0.2s, color 0.2s;
}

.view-btn.active {
  background-color: #65c281;
  color: #000;
}

.view-btn .icon {
  font-size: 16px;
  text-align: center;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card-grid.list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

.card-grid.list .project-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: var(--my-bg-soft);
  gap: 20px;
  width: 100%; /* ✅ 占据整个主页面宽度 */
  box-sizing: border-box;
}

.card-grid.list .thumb {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  display: flex;              /* ✅ 启用flex布局 */
  align-items: center;        /* ✅ 垂直居中 */
  justify-content: center;    /* ✅ 水平居中 */
}


.card-grid.list .thumb img {
  width: 70%;     /* ✅ 缩放为原图大小的 70% */
  height: auto;   /* ✅ 保持比例 */
  object-fit: contain;  /* ✅ 不裁剪原图 */
  border-radius: 8px;
}

.card-grid.list .info {
  flex: 1;
  margin-top: 0;
}

/* 在列表模式下，卡片的 hover 效果保持一致 */
.card-grid.list .project-card:hover {
  transform: translateY(-3px);
}

.featured-container {
    position: relative;
    background-color: #000000;
    color: white;
    /* padding: 20px 30px; */
    border-radius: 12px;
    width: 100%;
}

/* 顶部过滤栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-btn {
  background-color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filter-btn.active {
  background-color: #65c281;
  color: #000;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #ccc;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-icon,
.filter-grid {
  background-color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  color: #fff;
}

.filter-grid.active {
  background-color: #65c281;
  color: #000;
}

/* 加载与错误提示 */
.loading,
.error {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

/* 卡片区 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 始终3列 */
  gap: 20px;
  width: 100%;
}

.project-card {
  background-color: #1b1b1b;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: row; 
  align-items: center;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  gap: 12px; 
}


.project-card:hover {
  transform: translateY(-4px);
  background-color: #242424;
}

.thumb img {
  width: 90px; 
  height: 90px;
  object-fit: cover;
  border-radius: 10px;
}

.info {
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info h3 {
  font-size: 16px;
  margin-bottom: 2px;
}

.symbol {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 4px;
}

.desc {
  margin-top: 4px;
  font-size: 12px;
  color: #bbb;
  line-height: 1.4;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #888;
}

.mc-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
}

.mc-value {
  font-weight: bold;
}

.bar {
  background-color: #333;
  border-radius: 6px;
  flex: 1;
  height: 6px;
  overflow: hidden;
}

.fill {
  height: 6px;
  border-radius: 6px;
  transition: width 0.3s;
}

.change.up {
  color: #3fd67d;
}

.change.down {
  color: #e74c3c;
}


@media (max-width: 1000px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
