<template>
  <div v-if="users.length > 0" class="search-users-container">
    <div class="section-header">
      <h3>相关用户</h3>
      <div class="scroll-hint">← 滑动查看更多 →</div>
    </div>

    <div class="users-scroll-container">
      <div class="users-list">
        <div
          v-for="user in users"
          :key="user.username"
          class="user-card"
          @click="goToUserProfile(user.username)"
        >
          <div class="user-avatar">
            <img
              :src="getUserAvatar(user.avatarUrl)"
              :alt="user.nickname"
              @error="handleAvatarError"
            />
          </div>
          <div class="user-info">
            <h4 class="user-name">{{ user.nickname || user.username }}</h4>
            <p class="user-username">{{ user.username.startsWith('@') ? user.username : '@' + user.username }}</p>
            <p class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</p>
            <div class="user-stats">
              <span class="stat">
                <span class="stat-number">{{ formatNumber(user.followersCount || 0) }}</span>
                <span class="stat-label">关注者</span>
              </span>
              <span class="stat">
                <span class="stat-number">{{ formatNumber(user.memesCount || 0) }}</span>
                <span class="stat-label">模因</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  users: {
    type: Array,
    default: () => []
  }
})

const goToUserProfile = (username) => {
  // Remove @ prefix if exists, then navigate to profile
  const cleanUsername = username.replace('@', '')
  router.push(`/profile/${cleanUsername}`)
}

const handleAvatarError = (event) => {
  // Try default avatars first
  if (!event.target.src.includes('/avatars/default')) {
    event.target.src = `${import.meta.env.VITE_SERVER_IP || 'http://localhost:3000'}/avatars/default.png`
  } else {
    // If even default fails, use a remote avatar service
    event.target.src = 'https://i.pravatar.cc/150?img=1'
  }
}

const getUserAvatar = (avatarUrl) => {
  if (!avatarUrl) return `${import.meta.env.VITE_SERVER_IP || 'http://localhost:3000'}/avatars/default.png`
  // 如果是完整URL（如 https://i.pravatar.cc/150?img=61），直接使用
  if (avatarUrl.startsWith('http')) {
    return avatarUrl
  }
  // 如果是相对路径，添加服务器地址
  const server_ip = import.meta.env.VITE_SERVER_IP || 'http://localhost:3000'
  return `${server_ip}/${avatarUrl.replace(/^\/+/, '')}`
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}
</script>

<style scoped>
.search-users-container {
  width: 100%;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #65c281, #4caf50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scroll-hint {
  color: #888;
  font-size: 12px;
  opacity: 0.7;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.users-scroll-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #444 #222;
  border-radius: 12px;
  padding: 4px 0;
}

.users-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.users-scroll-container::-webkit-scrollbar-track {
  background: #222;
  border-radius: 3px;
}

.users-scroll-container::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.users-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.users-list {
  display: flex;
  gap: 16px;
  padding: 8px 4px;
  min-width: min-content;
}

.user-card {
  flex: 0 0 auto;
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(101, 194, 129, 0.2);
  border-color: rgba(101, 194, 129, 0.3);
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #65c281, #4caf50);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(101, 194, 129, 0.2);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-info {
  text-align: center;
}

.user-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.user-username {
  color: #888;
  font-size: 14px;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.user-bio {
  color: #aaa;
  font-size: 13px;
  line-height: 1.4;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.8em;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  color: #65c281;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  color: #888;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .search-users-container {
    padding: 16px;
    margin-bottom: 24px;
  }

  .user-card {
    width: 240px;
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .scroll-hint {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .users-list {
    gap: 12px;
  }

  .user-card {
    width: 200px;
    padding: 14px;
  }

  .user-avatar {
    width: 56px;
    height: 56px;
  }

  .user-name {
    font-size: 15px;
  }

  .user-bio {
    font-size: 12px;
  }
}
</style>