<template>
    <div class="meme-card">
        <img class="meme-image" :src="meme.image" alt="meme" />

        <div>
            <h2 class="meme-title">{{ meme.title }}</h2>

            <span class="code"> Meme Coin Code：{{ meme.code }}</span>

    <div class="meme-meta">
        <span class="author">
            <img
                class="author-avatar"
                :src="getAvatarUrl(meme.author?.avatar)"
                alt="Author Avatar"
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

            <!-- Like and collect -->
            <div class="meme-actions">
                <button
                    class="like-button"
                    :class="{ liked: isLiked }"
                    @click="toggleLike"
                >
                    ❤ Like <span>{{ likes }}</span>
                </button>

                <button
                    class="collect-button"
                    :class="{ collected: isCollected  }"
                    @click="toggleCollect"
                >
                    ★ Collect <span>{{ collections }}</span>
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

// Local state initialization
const likes = ref(props.meme.likes || 0);
const collections = ref(props.meme.favorites || 0);
const isLiked = ref(props.meme.is_liked || false)
// console.log(isLiked.value)
const isCollected = ref(props.meme.is_favorited || false)
// console.log(isCollected.value)

// Use watchEffect or watch to monitor props, ensuring async loading can properly display like and collect status
watchEffect(() => {
    if (props.meme) {
        likes.value = props.meme.likes || 0
        collections.value = props.meme.favorites || 0
        isLiked.value = !!props.meme.is_liked
        isCollected.value = !!props.meme.is_favorited
    }
})

const router = useRouter();

// Navigate to user profile page
const goToProfile = (authorId) => {
    router.push(`/profile/${authorId}`);
};

const getAvatarUrl = (url) => {
    if (!url) return 'https://i.pravatar.cc/150?img=1'; // Default avatar
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${server_ip}/${url.replace(/^\/+/, '')}`;
};

/* ----------------- Like / Unlike ----------------- */
const toggleLike = async () => {
    const oldLiked = isLiked.value;
    const oldLikes = likes.value;

    // Optimistic update
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
            // Rollback
            isLiked.value = oldLiked;
            likes.value = oldLikes;
            alert(data.message || "Like failed");
        } else if (!oldLiked && isLiked.value) {
            emitTaskProgress('daily-like', 1, { username: authStore.username || 'guest' });
        }
    } catch (err) {
        console.error("Like failed:", err);
        isLiked.value = oldLiked;
        likes.value = oldLikes;
        alert("Network error, please try again later");
    }
};


/* ----------------- Collect / Uncollect ----------------- */
const toggleCollect = async () => {
    const oldCollected = isCollected.value;
    const oldCollections = collections.value;

    // Optimistic update
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
            // Rollback
            isCollected.value = oldCollected;
            collections.value = oldCollections;
            alert(data.message || "Collect failed");
        }
    } catch (err) {
        console.error("Collect failed:", err);
        isCollected.value = oldCollected;
        collections.value = oldCollections;
        alert("Network error, please try again later");
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