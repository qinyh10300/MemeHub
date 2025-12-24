<template>
  <div class="featured-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="sort-group">
          <button
            class="sort-btn"
            :class="{ active: sortBy === 'hot' }"
            @click="changeSortBy('hot')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            热门
          </button>
          <button
            class="sort-btn"
            :class="{ active: sortBy === 'time' }"
            @click="changeSortBy('time')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            时间
          </button>
        </div>
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
      <div 
        v-for="(item, index) in projects" 
        :key="index" 
        class="project-card"
        @click="goToMemeDetail(item)"
      >
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
import axios from "axios";
import { useRouter } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";

const lastMemeCount = ref(0);      // ⬅️ 记录上一次 memeDetails 长度
let pollTimer = null;              // ⬅️ 5s 轮询定时器

// ✅ 使用 Vue Router
const router = useRouter();

const nsfw = ref(false);
const animations = ref(true);
const sortBy = ref("hot"); // 新增排序状态：'hot' 或 'time'
const isGridView = ref(true);

const loading = ref(false);
const error = ref(null);
const projects = ref([]);

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

/* 模拟数据请求 */
const fetchProjects = async () => {
  // loading.value = true;
  error.value = null;

  try {
    // 根据选择的方式获取 memeIds 列表
    const sortParam = sortBy.value === 'hot' ? 'hot' : 'time';
    const sortOrder = sortBy.value === 'hot' ? 'desc' : 'desc';
    const res = await axios.get(`${server_ip}/api/meme-list?sortBy=${sortParam}&sortOrder=${sortOrder}`);
    const memeIds = Array.isArray(res.data.memeIds) ? res.data.memeIds : [];

    // 第二步：并发获取每个 meme 的详细信息
    const memeDetails = await Promise.all(
      memeIds.slice(0, 10).map(id =>
        axios.get(`${server_ip}/api/meme/${id}`).then(r => r.data)
      )
    );
    if (memeDetails.length === lastMemeCount.value) {
      // loading.value = false;
      return;
    }
    lastMemeCount.value = memeDetails.length;
    loading.value = true; // 仅在数据变化时设置 loading 状态。TODO：较难测试。有问题修改上述一小段逻辑改为不更新即可

    // console.log("Fetched meme details:", memeDetails);

    // 第三步：适配字段
    projects.value = memeDetails.map((item) => ({
      memeId: item._id, // 新增：保存 memeId
      name: item.title,
      symbol: item.ticker,
      creator: item.author?.username || "未知",
      time: new Date(item.createdAt).toLocaleString(),
      mc: item.token?.price ? (item.token.price).toFixed(4) : 0,
      mcPercent: item.token?.changeRate? item.token.changeRate.toFixed(4) : 0,
      change: item.token?.changeRate ? parseFloat(item.token.changeRate.toFixed(4)) : 0,
      image: item.imageUrl
        ? (() => {
            const url = item.imageUrl.replace(/^\/+/, '');
            const base = url.includes('api') ? server_ip : `${server_ip}/api`;
            return `${base}/${url}`;
          })()
        : '',
      desc: item.description
    }));


  } 
  // 测试用例数据
  catch (err) {
    console.error("后端请求失败，使用预定义数据:", err);
    
    // 使用预定义数据作为后备方案 - 添加模拟的 memeId
    projects.value = [
      {
        memeId: "1", 
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
        memeId: "2", // 新增模拟ID
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
        memeId: "3", // 新增模拟ID
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
    ];
  } finally {
    loading.value = false;
  }
  // 部署用
  // catch (err) {
  //   console.error(err);
  //   error.value = "Failed to load project data.";
  // } finally {
  //   loading.value = false;
  // }
};

const goToMemeDetail = (item) => {
  // console.log("item: ", item)
  router.push(`/meme/${item.memeId}`);
};

const changeSortBy = (type) => {
  sortBy.value = type;
  fetchProjects();
};

const changeFilter = (type) => {
  currentFilter.value = type;
  fetchProjects();
};

onMounted(() => {
  fetchProjects();

  pollTimer = setInterval(() => {
    fetchProjects(); // 每 5s 检查一次
  }, 5000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>


<style scoped>
/* 右上角按钮组 */
.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 4px;
}

.view-btn {
  background-color: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: #888;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;
}

.view-btn:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.view-btn.active {
  background-color: #65c281;
  color: #000;
  box-shadow: 0 2px 8px rgba(101, 194, 129, 0.3);
}

.view-btn .icon {
  font-size: 16px;
  text-align: center;
}


.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  cursor: pointer;
}

.card-grid .thumb img{
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  /* display: flex;        */
  align-items: center;      
  justify-content: center;   
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
  gap: 16px;
}

/* 排序按钮组 */
.sort-group {
  display: flex;
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: #888;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.sort-btn:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.sort-btn.active {
  background-color: #65c281;
  color: #000;
  box-shadow: 0 2px 8px rgba(101, 194, 129, 0.3);
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
  gap: 8px;
  font-size: 14px;
  color: #ccc;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.toggle:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.toggle input[type="checkbox"] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #444;
  border-radius: 4px;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.toggle input[type="checkbox"]:checked {
  background-color: #65c281;
  border-color: #65c281;
}

.toggle input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: #000;
  font-size: 12px;
  font-weight: bold;
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
  margin-top: 0px;
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

  /* ✅ 限制最多显示两行，超出部分显示省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 2;   /* 限制显示 2 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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