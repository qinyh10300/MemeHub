<template>
<div class="meme-detail-page">
    <div class="container">
    <!-- 左半边：模因信息 + K 线图 -->
    <div class="left-side">
        <MemeCard :meme="meme" />
        <!-- 这里可以加 KlineChart 组件 -->
        <KlineChart/>
    </div>

    <!-- 右半边：评论区（异步等待） -->
    <div class="right-side">
      <CommentSection v-if="meme.id" :meme_id="meme.id" />
    </div>
    </div>
</div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import MemeCard from '@/components/meme_detail_view/MemeInfo.vue'
import CommentSection from '@/components/meme_detail_view/Comments.vue'
import KlineChart from '@/components/meme_detail_view/KlineChart.vue'
import { useRoute } from 'vue-router'

const server_ip = 'http://localhost:3000' // 后端服务器地址

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
})

const route = useRoute() // 获取路由实例
const memeId = ref(route.params.id).value // 获取动态路由参数 :id（模因ID）
// console.log('memeId:', memeId)

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
        'token': "12345678"
      },
    })

    // console.log('响应状态:', response.status, response.statusText)
    const result = await response.json()
    // console.log('API返回结果:', result)

    if (response.status === 200) {
      // meme.image = result.imageUrl
      meme.image = result.imageUrl ? `http://localhost:3000/${result.imageUrl.replace(/^\/+/, '')}` : '',
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
gap: 10px;
height: auto;
width: 1200px; /* 设置固定宽度 */
}

/* 左半边 */
.left-side {
position: relative;
top: 0px;
flex: 3; /* 左半边占 2 份 */
display: flex;
flex-direction: column;
gap: 24px;
overflow-y: auto; /* 左边可滚动 */
}

/* 右半边 */
.right-side {
  position: sticky; /* 设置为 sticky 定位 */
  top: 0px; /* 距离视口顶部 50px */
  flex: 2;
  overflow-y: auto; /* 右边独立滚动 */
  height: calc(100vh - 50px); /* 设置高度为视口高度减去顶部偏移 */
}
</style>