<template>
    <div class="meme-card">
        <img class="meme-image" :src="meme.image" alt="meme" />
    
        <div>
            <h2 class="meme-title">{{ meme.title }}</h2>
    
            <span class="code"> 模因币代号：{{ meme.code }}</span>
    
    <div class="meme-meta">
        <span class="author">
            <img
                class="author-avatar"
                :src="getAvatarUrl(meme.author?.avatar)"
                alt="作者头像"
                @click="goToProfile(meme.author?.username)"
            />
            <span class="author-nickname" @click="goToProfile(meme.author?.username)">
                {{ meme.author?.nickname }}
            </span>
            <span class="author-username" @click="goToProfile(meme.author?.username)">
                @{{ meme.author?.username }}
            </span>
        </span>

        <span class="dot"></span>
        <span class="time">{{ meme.time }}</span>
    </div>
    
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
                    :class="{ collected: isCollected  }"
                    @click="toggleCollect"
                >
                    ★ 收藏 <span>{{ collections }}</span>
                </button>
            </div>
        </div>
    </div>
    </template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { emitTaskProgress } from '@/utils/gamificationEvents';

const props = defineProps({
    meme: Object,
});

// console.log("props.meme: ", props.meme)
// console.log("props.meme.is_liked: ", props.meme.is_liked)
// console.log("props.meme.is_favorited: ", props.meme.is_favorited)

// auth store
const authStore = useAuthStore();
const server_ip = authStore.server_ip;
const user_token = authStore.user_token;

// 本地状态初始化
const likes = ref(props.meme.likes || 0);
const collections = ref(props.meme.favorites || 0);
const isLiked = ref(props.meme.is_liked || false)
// console.log(isLiked.value)
const isCollected = ref(props.meme.is_favorited || false)
// console.log(isCollected.value)

// 使用 watchEffect 或 watch 监听 props，保证异步加载也能正常显示是否已经进行了 点赞 收藏
watchEffect(() => {
    if (props.meme) {
        likes.value = props.meme.likes || 0
        collections.value = props.meme.favorites || 0
        isLiked.value = !!props.meme.is_liked
        isCollected.value = !!props.meme.is_favorited
    }
})

const router = useRouter();

// 跳转到用户主页
const goToProfile = (authorId) => {
    router.push(`/profile/${authorId}`);
};

const getAvatarUrl = (url) => {
    if (!url) return 'https://i.pravatar.cc/150?img=1'; // Default avatar
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${server_ip}/${url.replace(/^\/+/, '')}`;
};

/* ----------------- 点赞 / 取消点赞 ----------------- */
const toggleLike = async () => {
    const oldLiked = isLiked.value;
    const oldLikes = likes.value;

    // 乐观更新
    isLiked.value = !isLiked.value;
    likes.value += isLiked.value ? 1 : -1;

    try {
        console.log(`${server_ip}/api/meme/${props.meme.id}/like`);
        const response = await fetch(`${server_ip}/api/meme/${props.meme.id}/like`, {
            method: "POST",
            headers: {
                "token": user_token,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // 回滚
            isLiked.value = oldLiked;
            likes.value = oldLikes;
            alert(data.message || "点赞失败");
        } else if (!oldLiked && isLiked.value) {
            emitTaskProgress('daily-like', 1, { username: authStore.username || 'guest' });
        }
    } catch (err) {
        console.error("点赞失败:", err);
        isLiked.value = oldLiked;
        likes.value = oldLikes;
        alert("网络错误，稍后重试");
    }
};


/* ----------------- 收藏 / 取消收藏 ----------------- */
const toggleCollect = async () => {
    const oldCollected = isCollected.value;
    const oldCollections = collections.value;

    // 乐观更新
    isCollected.value = !isCollected.value;
    collections.value += isCollected.value ? 1 : -1;

    try {
        const response = await fetch(`${server_ip}/api/meme/${props.meme.id}/favorite`, {
            method: "POST",
            headers: {
                "token": user_token,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // 回滚
            isCollected.value = oldCollected;
            collections.value = oldCollections;
            alert(data.message || "收藏失败");
        }
    } catch (err) {
        console.error("收藏失败:", err);
        isCollected.value = oldCollected;
        collections.value = oldCollections;
        alert("网络错误，稍后重试");
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
    font-weight: bold;
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
    color: #e9efea;
}

.author-username {
  cursor: pointer; /* 鼠标悬浮时显示手型 */
  color: #5c9fc8;
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
    color: #e4e4db; /* 悬停时颜色变化 */
}
</style>