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
        <CommentSection :comments="comments" @submit-comment="submitComment" />
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

const comments = reactive([
  {
    id: 1, // 当前评论的唯一 ID
    userId: 'u001', // 用户的唯一 ID
    avatar: 'https://i.pravatar.cc/150?img=12', // 用户头像
    username: 'user001', // 用户名
    nickname: '有趣的用户', // 昵称
    content: '这个模因好有趣！', // 评论内容
    time: '1 小时前', // 评论时间
    likes: 12, // 点赞数量
    replyTo: null, // 引用的评论 ID（null 表示不是回复）
  },
  {
    id: 2,
    userId: 'u002',
    avatar: 'https://i.pravatar.cc/50?img=2',
    username: 'user002',
    nickname: '模因爱好者',
    content: '哈哈哈，这个模因太搞笑了！',
    time: '2 小时前',
    likes: 8,
    replyTo: null,
  },
  {
    id: 3,
    userId: 'u003',
    avatar: 'https://i.pravatar.cc/50?img=3',
    username: 'user003',
    nickname: '评论达人',
    content: '确实很搞笑！确实很搞笑！确实很搞笑！确实很搞笑！确实很搞笑！确实很搞笑！',
    time: '30 分钟前',
    likes: 5,
    replyTo: 2, // 表示这是对 ID 为 2 的评论的回复
  },
  {
    id: 4,
    userId: 'u004',
    avatar: 'https://i.pravatar.cc/50?img=4',
    username: 'user004',
    nickname: '评论达人',
    content: '哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈',
    time: '30 分钟前',
    likes: 5,
    replyTo: 3, // 表示这是对 ID 为 3 的评论的回复
  },
]);

// 提交评论
const submitComment = (newComment) => {
if (!newComment.trim()) return
comments.push({ author: '你', content: newComment, time: '刚刚' })
}
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