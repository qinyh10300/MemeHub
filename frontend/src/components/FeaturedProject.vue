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
        <!-- <button class="refresh-price-btn" @click="updatePrices" :disabled="loading">
          <span class="refresh-icon">🔄</span>
          刷新价格
        </button> -->
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
          <img :src="getImageUrl(item.image)" alt="project" />
        </div>

        <div class="info">
          <div class="card-header">
            <div class="title-section">
              <h3>{{ item.name }}</h3>
              <span class="ticker">${{ item.symbol }}</span>
            </div>
            <div class="user-info">
              <img :src="getUserAvatar(item.userAvatar)" :alt="item.creator" class="user-avatar" />
              <span class="creator-name">{{ item.creator }}</span>
            </div>
          </div>

          <div class="meta">
            <span class="time">{{ formatTimeAgo(item.createdAt) }}</span>
            <span class="likes">❤️ {{ item.likes || 0 }}</span>
          </div>

          <div class="price-stats">
            <div class="price-info">
              <span class="price">${{ formatPrice(item.price) }}</span>
              <span :class="['price-change', item.priceChange >= 0 ? 'positive' : 'negative']">
                {{ item.priceChange >= 0 ? '+' : '' }}{{ item.priceChange }}%
              </span>
            </div>
            <div class="market-progress">
              <span class="market-cap-label">MC</span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(item.likes * 2, 100) + '%',
                    background: item.priceChange >= 0 ?
                      'linear-gradient(90deg, #00d084, #00a868)' :
                      'linear-gradient(90deg, #ff3b69, #e74c3c)'
                  }"
                ></div>
              </div>
              <span class="market-cap-value">${{ formatMarketCap(item.likes) }}</span>
            </div>
          </div>

          <p class="desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

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

// 格式化价格显示
const formatPrice = (price) => {
  if (!price) return '0.000000'
  if (price < 0.000001) return price.toExponential(2)
  if (price < 1) return price.toFixed(6)
  return price.toFixed(2)
}

// 格式化市值显示
const formatMarketCap = (likes) => {
  if (!likes) return '0'
  if (likes >= 1000000) {
    return (likes / 1000000).toFixed(2) + 'M'
  } else if (likes >= 1000) {
    return (likes / 1000).toFixed(2) + 'K'
  }
  return likes.toString()
}

// 格式化时间显示
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// 获取图片URL
const getImageUrl = (url) => {
  console.log("getImageUrl url:", url)
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${server_ip}${url.startsWith('/') ? '' : '/'}${url}`
}

// 获取用户头像URL
const getUserAvatar = (avatarUrl) => {
  if (!avatarUrl) return DEFAULT_AVATAR;

  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${server_ip}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
};

// 异步获取用户详细信息（包括头像）
const fetchUserDetails = async (username) => {
  if (!username) return DEFAULT_AVATAR;

  try {
    const res = await axios.get(`${server_ip}/api/user/${username}`, {
      headers: { 'token': authStore.username || '' }
    });
    const avatar = res.data?.data?.avatar;
    if (avatar) {
      return avatar.startsWith('http') ? avatar : `${server_ip}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    }
    return DEFAULT_AVATAR;
  } catch (error) {
    console.error("获取用户头像失败:", error);
    return DEFAULT_AVATAR;
  }
};

const DEFAULT_AVATAR ='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MENEQzYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNSIgcj0iNyIgZmlsbD0iI0ZGRkZGRiIvPgo8ZWxsaXBzZSBjeD0iMjAiIGN5PSIzMCIgcng9IjEwIiByeT0iNyIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K'

/* 获取项目数据 */
const fetchProjects = async () => {
  loading.value = true;
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

    // 第三步：适配字段并获取真实的价格数据
    const processedProjects = await Promise.all(
      memeDetails.map(async (item) => {
        console.log("meme item:", item);

        // 检查是否有代币
        const withToken = item.userinfo?.withToken;
        if (withToken === false) {
          return null; // 跳过没有代币的模因
        }

        try {
          // 并发获取价格和用户头像
          const [priceRes, userAvatarUrl] = await Promise.all([
            axios.get(`${server_ip}/api/meme/${item._id}/token/price`),
            fetchUserDetails(item.author?.username)
          ]);

          console.log("price_res:", priceRes.data);

          const priceData = priceRes.data.data || priceRes.data;
          const currentPrice = priceData.price || (Math.random() * 0.001 + 0.000001);

          // 计算价格变化（模拟历史数据对比）
          const previousPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1);
          const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

          return {
            memeId: item._id,
            name: item.title,
            symbol: item.ticker,
            creator: item.author?.username || "未知",
            userAvatar: userAvatarUrl,
            createdAt: item.createdAt,
            price: Number(currentPrice),
            priceChange: Number(priceChange.toFixed(2)),
            likes: item.likes || 0,
            image: item.imageUrl ? `${server_ip}/${item.imageUrl.replace(/^\/+/, '')}` : '',
            desc: item.description
          };
        } catch (priceError) {
          console.warn(`获取数据失败，使用模拟数据: ${priceError.message}`);
          // 如果获取价格失败，使用模拟数据
          const basePrice = Math.random() * 0.001 + 0.000001;
          const priceChange = (Math.random() - 0.5) * 20;
          const userAvatarUrl = await fetchUserDetails(item.author?.username);

          return {
            memeId: item._id,
            name: item.title,
            symbol: item.ticker,
            creator: item.author?.username || "未知",
            userAvatar: userAvatarUrl,
            createdAt: item.createdAt,
            price: Number(basePrice),
            priceChange: Number(priceChange.toFixed(2)),
            likes: item.likes || 0,
            image: item.imageUrl ? `${server_ip}/${item.imageUrl.replace(/^\/+/, '')}` : '',
            desc: item.description
          };
        }
      })
    );

    // 过滤掉null值并设置projects
    projects.value = processedProjects.filter(project => project !== null);

  } 
  // 测试用例数据
  catch (err) {
    console.error("后端请求失败，使用预定义数据:", err);
    
    // 使用预定义数据作为后备方案 - 添加模拟的完整数据
    projects.value = [
      {
        memeId: "1",
        name: "Dogecoin",
        symbol: "DOGE",
        creator: "Elon Musk",
        userAvatar: null,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
        price: 0.07234,
        priceChange: +5.67,
        likes: 18200,
        image: new URL('@/assets/doge.png', import.meta.url).href,
        desc: "Dogecoin（狗狗币）是一种以Doge表情包为灵感的加密货币，以社区驱动和趣味性著称，旨在让数字货币变得更加亲民有趣。"
      },
      {
        memeId: "2",
        name: "Pepe the Frog",
        symbol: "PEPE",
        creator: "Matt Furie",
        userAvatar: null,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2小时前
        price: 0.00001234,
        priceChange: +8.91,
        likes: 6530,
        image: new URL('@/assets/pepe.avif', import.meta.url).href,
        desc: "Pepe the Frog（青蛙佩佩）起源于网络漫画，是网络文化中最具影响力的表情之一，后来被加密社区赋予象征幽默与团结的精神。"
      },
      {
        memeId: "3",
        name: "Bored Ape Yacht Club",
        symbol: "BAYC",
        creator: "Yuga Labs",
        userAvatar: null,
        createdAt: new Date(Date.now() - 10800000).toISOString(), // 3小时前
        price: 12.45,
        priceChange: -3.28,
        likes: 5900,
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
  console.log("item: ", item)
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

// 价格更新定时器
let priceUpdateInterval = null;

// 更新价格数据的函数
const updatePrices = async () => {
  if (projects.value.length === 0) return;

  try {
    const updatedProjects = await Promise.all(
      projects.value.map(async (project) => {
        try {
          // 获取最新价格
          const priceRes = await axios.get(`${server_ip}/api/meme/${project.memeId}/token/price`);
          const priceData = priceRes.data.data || priceRes.data;
          const currentPrice = priceData.price || project.price;

          // 计算价格变化
          const previousPrice = project.price;
          const priceChange = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

          return {
            ...project,
            price: Number(currentPrice),
            priceChange: Number(priceChange.toFixed(2))
          };
        } catch (error) {
          console.warn(`更新项目 ${project.memeId} 价格失败:`, error);
          return project; // 保持原有数据
        }
      })
    );

    projects.value = updatedProjects;
    console.log('价格数据已更新');
  } catch (error) {
    console.error('批量更新价格失败:', error);
  }
};

// 启动价格更新定时器
const startPriceUpdate = () => {
  // 每30秒更新一次价格
  priceUpdateInterval = setInterval(updatePrices, 30000);
};

// 停止价格更新定时器
const stopPriceUpdate = () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
};

onMounted(() => {
  fetchProjects();
  startPriceUpdate(); // 启动价格更新
});

onUnmounted(() => {
  stopPriceUpdate(); // 组件卸载时清理定时器
});
</script>


<style scoped>
/* 右上角按钮组 */
.filter-right {
  /* margin-right: 16px; */
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
  gap: 16px;
}

.card-grid.list .project-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: linear-gradient(135deg, rgba(27, 27, 27, 0.9), rgba(36, 36, 36, 0.8));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
  padding: 20px;
}

.card-grid.list .thumb {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-grid.list .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.card-grid.list .info {
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-grid.list .card-header {
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-grid.list .user-info {
  flex-direction: column;
  align-items: center;
}

.card-grid.list .title-section h3 {
  font-size: 20px;
  line-height: 1.3;
}

.card-grid.list .ticker {
  font-size: 15px;
  margin-top: 4px;
}

.card-grid.list .desc {
  font-size: 14px;
  line-height: 1.5;
  -webkit-line-clamp: 3;
}

.card-grid.list .price {
  font-size: 22px;
}

.card-grid.list .price-change {
  font-size: 16px;
  padding: 4px 8px;
}

.card-grid.list .market-progress {
  font-size: 14px;
}

/* 列表模式下的 hover 效果 */
.card-grid.list .project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(127, 90, 240, 0.2);
  border-color: rgba(127, 90, 240, 0.4);
}

/* 列表模式下的响应式设计 */
@media (max-width: 600px) {
  .card-grid.list .project-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 16px;
  }

  .card-grid.list .thumb {
    width: 120px;
    height: 120px;
  }

  .card-grid.list .card-header {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .card-grid.list .user-info {
    flex-direction: row;
    justify-content: center;
  }
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

/* 刷新价格按钮 */
.refresh-price-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #42b983, #2c9c6a);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-price-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2c9c6a, #238055);
  transform: translateY(-1px);
}

.refresh-price-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.refresh-price-btn:hover:not(:disabled) .refresh-icon {
  transform: rotate(180deg);
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.project-card {
  background: linear-gradient(135deg, rgba(27, 27, 27, 0.9), rgba(36, 36, 36, 0.8));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  gap: 16px;
}

.project-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(127, 90, 240, 0.15);
  border-color: rgba(127, 90, 240, 0.3);
  background: linear-gradient(135deg, rgba(27, 27, 27, 0.95), rgba(36, 36, 36, 0.9));
}

.thumb img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.info {
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.title-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #fff;
  line-height: 1.2;
}

.ticker {
  font-size: 13px;
  color: #7f5af0;
  font-weight: 500;
  display: inline-block;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-direction: column;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(127, 90, 240, 0.3);
  background: #2a2a2a;
}

.creator-name {
  font-size: 11px;
  color: #888;
  max-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 元数据 */
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.likes {
  color: #ff3b69;
  font-weight: 500;
}

/* 价格统计 */
.price-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.price-change {
  font-size: 14px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.price-change.positive {
  color: #00d084;
  background: rgba(0, 208, 132, 0.1);
}

.price-change.negative {
  color: #ff3b69;
  background: rgba(255, 59, 105, 0.1);
}

/* 市值进度条 */
.market-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.market-cap-label {
  color: #888;
  font-weight: 600;
  min-width: 20px;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  flex: 1;
  height: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.market-cap-value {
  color: #fff;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 描述 */
.desc {
  font-size: 12px;
  color: #bbb;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
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

  .project-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .user-info {
    flex-direction: row;
    justify-content: center;
  }

  .creator-name {
    max-width: 120px;
  }
}
</style>
