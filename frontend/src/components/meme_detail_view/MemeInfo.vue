<template>
<div class="meme-card">
    <!-- 模因图片 -->
    <img class="meme-image" :src=meme.image alt="meme" />

    <div>
        <!-- 模因标题 -->
        <h2 class="meme-title">{{ meme.title }}</h2>

        <span class="code"> {{ meme.code }}</span>

        <!-- 模因元信息 -->
        <div class="meme-meta">
            <span class="author">
                <img
                    class="author-avatar"
                    :src="meme.avatar"
                    alt="作者头像"
                    @click="goToProfile(meme.authorId)"
                />
                <span
                    class="author-nickname"
                    @click="goToProfile(meme.authorId)"
                >
                    {{ meme.nickname }}
                </span>
                <span
                    class="author-username"
                    @click="goToProfile(meme.authorId)"
                >
                    @{{ meme.author.username }}
                </span>
            </span>
            <span class="dot"></span>
            <span class="time">{{ meme.time }}</span>
        </div>

        <!-- 模因描述 -->
        <p class="meme-desc">{{ meme.desc }}</p>

        <!-- 点赞和收藏 -->
        <div class="meme-actions">
            <button
                class="like-button"
                :class="{ liked: isLiked }"
                @click="toggleLike"
            >
                ❤ 点赞 <span>{{ likes }}</span>
            </button>
            <button
                class="collect-button"
                :class="{ collected: isCollected }"
                @click="toggleCollect"
            >
                ★ 收藏 <span>{{ collections }}</span>
            </button>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 接收父组件传入的模因数据
defineProps({
    meme: Object, // 包含模因的所有信息
});

// 本地状态
const likes = ref(0); // 点赞数量
const collections = ref(0); // 收藏数量
const isLiked = ref(false); // 是否已点赞
const isCollected = ref(false); // 是否已收藏
const router = useRouter(); // 获取路由实例

// 跳转到创作者的个人主页
const goToProfile = (authorId) => {
    router.push(`/profile/${authorId}`);
};

// 点赞功能
const toggleLike = () => {
    if (isLiked.value) {
        likes.value -= 1; // 取消点赞
    } else {
        likes.value += 1; // 点赞
    }
    isLiked.value = !isLiked.value;
};

// 收藏功能
const toggleCollect = async () => {
    if (isCollected.value) {
        collections.value -= 1; // 取消收藏
    } else {
        collections.value += 1; // 收藏
        // 发送收藏请求到后端
        await sendCollectRequest();
    }
    isCollected.value = !isCollected.value;
};

// 模拟发送收藏请求到后端
const sendCollectRequest = async () => {
    try {
        // 假设后端接口为 /api/collect
        const response = await fetch('/api/collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                memeId: meme.id, // 模因的唯一 ID
                userId: 'current_user_id', // 当前用户的 ID
            }),
        });
        if (!response.ok) {
            throw new Error('收藏失败');
        }
    } catch (error) {
        console.error(error);
    }
};
</script>

<style scoped>
.meme-card {
    display: flex;
    gap: 16px;
    background: #705757;
    padding: 18px;
    border-radius: 12px;
    align-items: flex-start;
}

.meme-image {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
}

.meme-title {
    margin: 0;
    font-size: 22px;
}

.meme-meta {
    display: flex;
    align-items: center;
    margin-top: 6px;
    font-size: 14px;
    color: #bbb;
}

.author {
    display: flex;
    align-items: center;
    gap: 8px;
}

.author-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
}

.author-nickname {
    cursor: pointer;
    color: #5c9fc8;
    font-weight: bold;
}

.author-username {
  cursor: pointer; /* 鼠标悬浮时显示手型 */
  color: #76b17a;
  font-size: 14px;
}

.dot {
    width: 4px;
    height: 4px;
    background: #666;
    border-radius: 50%;
    margin: 0 8px;
}

.meme-desc {
    margin-top: 12px;
    font-size: 15px;
    color: #ccc;
}

.meme-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
}

.like-button,
.collect-button {
    background: none;
    border: none;
    color: #888; /* 默认灰色 */
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.3s;
}

.like-button.liked {
    color: #ff6b6b; /* 点赞后显示红色 */
}

.collect-button.collected {
    color: #ffd700; /* 收藏后显示金色 */
}

.like-button:hover,
.collect-button:hover {
    color: #ff6b6b; /* 悬停时颜色变化 */
}
</style>