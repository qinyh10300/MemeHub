<template>
<div class="meme-detail-page">
    <div class="container">
    <!-- 左侧：模因信息 + K线图 + 订单簿 + 评论区 -->
    <div class="left-side">
        <MemeCard :meme="meme" />
        <div v-if="meme.withToken" class="trading-section">
          <KlineChart v-if="meme.id" :meme-id="meme.id" />
        </div>
        <div v-else class="no-token-card">
          <p class="title">尚未开启行情</p>
          <p>该模因目前仅发布图文内容，还没有发行代币，因此无法展示 K 线图、MA、VOL、MACD、RSI 等指标。</p>
          <p class="hint">当作者发布代币后，此处会自动显示完整行情面板。</p>
        </div>
        <!-- <div class="orderbook-section">
          <OrderBook @orderSelected="handleOrderSelected" />
        </div> -->
        <div class="comments-section">
          <CommentSection v-if="meme.id" :meme_id="meme.id" />
        </div>
    </div>

    <!-- 右侧：交易面板 -->
    <div class="right-side">
      <TradingPanel v-if="meme.withToken" :selectedOrder="selectedOrder" :memeId="meme.id" />
      <div v-else class="no-token-panel">
        <h3>交易功能未开启</h3>
        <p>作者尚未为该模因创建代币，暂无法下单交易或查看订单簿。</p>
      </div>
    </div>
    </div>
</div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import MemeCard from '@/components/meme_detail_view/MemeInfo.vue'
import CommentSection from '@/components/meme_detail_view/Comments.vue'
import KlineChart from '@/components/meme_detail_view/KlineChart.vue'
import OrderBook from '@/components/meme_detail_view/OrderBook.vue'
import TradingPanel from '@/components/meme_detail_view/TradingPanel.vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

// 模因数据
const meme = reactive({
  image: '',
  title: '',
  code: '',
  author: '',
  avatar: '',
  username: '',
  nickname: '',
  desc: '',
  time: '',
  likes: 0,
  id: '',
  withToken: false,
})

const route = useRoute() // 获取路由实例
const memeId = ref(route.params.id).value // 获取动态路由参数 :id（模因ID）

// 选中的订单（来自订单簿点击）
const selectedOrder = ref(null)

// 处理订单簿中的订单选择
const handleOrderSelected = (order) => {
  selectedOrder.value = order
}

// 从API加载模因数据
const fetchMemeData = async () => {
    try {
    // const currentUsername = username.value // 使用 ref 的值
    // console.log('正在获取用户信息，用户名/ID:', currentUsername)
    const url = `${server_ip}/api/meme/${memeId}`
    // console.log('请求URL:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': user_token
      },
    })

    // console.log('响应状态:', response.status, response.statusText)
    const result = await response.json()
    // console.log('API返回结果:', result)

    if (response.status === 200) {
      // meme.image = result.imageUrl
      meme.image = `/api/${result.imageUrl}` ? `${server_ip}/api/${result.imageUrl.replace(/^\/+/, '')}` : '',
      meme.title = result.title
      meme.code = result.ticker
      meme.author = result.author
      meme.desc = result.description || '暂无描述'
      meme.time = new Date(result.createdAt).toLocaleString()
      meme.likes = result.likes
      meme.favorites = result.favorites
      meme.id = result._id
      meme.is_liked = result.userinfo.is_liked
      meme.is_favorited = result.userinfo.is_favorited
      meme.withToken = Boolean(result.withToken)
    } else if (response.status == 404){
      console.error('该模因不存在', response.status)
    } else {
      console.error('模因数据加载失败：', response.status)
    }
  } catch (error) {
    console.error('模因数据加载错误：', error)
    }
  // console.log(meme.image)
  // console.log("meme.id: ", meme.id)
}

// 组件挂载时获取数据
onMounted(() => {
    fetchMemeData()
})
</script>

<style scoped>
.meme-detail-page {
margin: 0 auto;
padding: 20px;
color: #eeeeee;
background: black;
/* 为什么加入下面的代码，背景问题就解决了？ */
min-height: 100vh;
background: var(--bg);
color: var(--fg);
font-family: Inter, system-ui, Arial;
overflow-y: auto;  
}

.container {
display: flex;
gap: 16px;
height: auto;
width: 1250px; /* 扩大宽度以适应交易系统 */
max-width: 100%;
}

/* 左侧：模因信息 + K线图 + 订单簿 + 评论区 */
.left-side {
position: relative;
top: 0px;
flex: 8; /* 左侧占 8 份，为评论区留出更多空间 */
display: flex;
flex-direction: column;
gap: 24px; /* 增加间距，提升视觉层次 */
max-height: calc(100vh - 40px);
  overflow-y: auto;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .trading-section {
    order: 2; /* K线图排在第二位 */
  }

  .orderbook-section {
    order: 3; /* 订单簿排在第三位 */
  }

  .comments-section {
    order: 4; /* 评论区排在第四位 */
    /* min-height: 400px; */
    background: rgba(255, 255, 255, 0.02); /* 现代半透明背景 */
    border-radius: 12px; /* 圆角设计 */
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1); /* 细微边框 */
    backdrop-filter: blur(10px); /* 毛玻璃效果 */

    /* 现代化悬停效果 */
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }
}

.no-token-card {
  order: 2;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  color: #d1d5db;
  line-height: 1.6;

  .title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .hint {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 6px;
  }
}

.no-token-panel {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 24px;
  color: #d1d5db;
  line-height: 1.6;

  h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #9ca3af;
  }
}

/* 右侧：交易面板 */
.right-side {
  position: sticky; /* 设置为 sticky 定位 */
  top: 20px; /* 距离视口顶部 20px */
  flex: 4; /* 右侧占 4 份 */
  display: flex;
  flex-direction: column;
  gap: 24px; /* 与左侧间距保持一致 */
  overflow-y: auto;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  height: calc(100vh - 40px);

  /* 现代化右侧面板设计 */
  background: rgba(255, 255, 255, 0.015);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);

  /* 添加细微阴影增强层次感 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .container {
    width: 1100px;
  }

  .left-side {
    flex: 7;
  }

  .right-side {
    flex: 3;
  }
}

@media (max-width: 1200px) {
  .container {
    width: 95%;
    flex-direction: column;
    gap: 24px;
  }

  .left-side,
  .right-side {
    flex: 1;
    position: static;
    height: auto;
    max-height: none;
  }

  .right-side {
    order: 2; /* 在移动端将交易面板放在评论下方 */
  }

  .left-side .comments-section {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .meme-detail-page {
    padding: 16px;
  }

  .container {
    width: 100%;
    padding: 0;
  }

  .left-side,
  .right-side {
    gap: 16px;
    padding: 16px;
  }

  .left-side .comments-section {
    padding: 16px;
    min-height: 250px;
  }
}
</style>