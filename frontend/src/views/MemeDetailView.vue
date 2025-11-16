<template>
<div class="meme-detail-page">
    <div class="container">
    <!-- 左半边：模因信息 + K 线图 -->
    <div class="left-side">
        <MemeCard :meme="meme" />
        <!-- 这里可以加 KlineChart 组件 -->
        <KlineChart/>
    </div>

    <!-- 右半边：评论区 -->
    <div class="right-side">
        <CommentSection />
    </div>
    </div>
</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import MemeCard from '@/components/meme_detail_view/MemeInfo.vue'
import CommentSection from '@/components/meme_detail_view/Comments.vue'
import KlineChart from '@/components/meme_detail_view/KlineChart.vue'

// 父组件传入模因数据
const meme = reactive({
image: new URL('@/assets/pepe.avif', import.meta.url).href,
title: 'Just a chill guy 2',
code: 'CHILLGUY2',
author: 'chillguydev',
avatar: 'https://i.pravatar.cc/150?img=12', // 用户头像
username: 'user001', // 用户名
nickname: '有趣的用户', // 昵称
desc: '这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...这是一个轻松随意的模因示例...',
time: '2 小时前',
likes: 12,
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
top: 50px;
flex: 2; /* 左半边占 2 份 */
display: flex;
flex-direction: column;
gap: 24px;
overflow-y: auto; /* 左边可滚动 */
}

/* 右半边 */
.right-side {
  position: sticky; /* 设置为 sticky 定位 */
  top: 50px; /* 距离视口顶部 50px */
  flex: 1;
  overflow-y: auto; /* 右边独立滚动 */
  height: calc(100vh - 50px); /* 设置高度为视口高度减去顶部偏移 */
}
</style>