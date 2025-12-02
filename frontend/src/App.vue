<script setup>
import { ref, computed } from 'vue'
import LoginModal from './components/LoginModal.vue'
import LoginOutModal from './components/LoginOutModal.vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const server_ip = authStore.server_ip // 后端服务器地址

// 默认头像URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 用户数据（包含所有信息）
const userData = ref({
  avatar: defaultAvatar, // 默认头像
  nickname: '',
  username: '',
})

// 从后端获取用户数据
const fetchUserData = async (user_token) => {
  try {    
    const currentUsername = user_token
    const url = `${server_ip}/api/user/${currentUsername}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username || authStore.token || '', // 传递用户名作为token（后端当前使用用户名作为token）
      },
    })

    const result = await response.json()
    if (response.ok && result.code === 0) {
      const data = result.data
      console.log("data: ", data)
      userData.value = {
        avatar: data.avatar || defaultAvatar, // 如果没有头像，使用默认头像
        nickname: data.nickname,
        username: data.username,
      }
    } else {
      console.error('获取用户信息失败:', result)
    }
  } catch (err) {
    console.error('获取用户信息时发生错误:', err)
  }
}

// 检查登录状态，1小时内不用重复登录
const checkLoginStatus = async () => {
  const token = localStorage.getItem('auth_token');
  const username = localStorage.getItem('auth_username');
  const userrole = localStorage.getItem('auth_role');
  const loginTime = localStorage.getItem('login_time');

  if (token && username && loginTime) {
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000; // 一小时的毫秒数

    // 如果登录时间未超过一小时，则恢复登录状态
    if (currentTime - loginTime < oneHour) {
      authStore.setToken(token);
      authStore.setUsername(username);
      authStore.setUserToken(username);
      authStore.setUserRole(userrole);
      await fetchUserData(username);
      authStore.setNickname(userData.value.nickname); // 保存昵称
      authStore.setAvatar(userData.value.avatar); // 保存头像
      console.log('登录状态已恢复');
    } else {
      // 登录时间已过期，清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('login_time');
      localStorage.removeItem('auth_role');
      console.log('登录状态已过期');
    }
  }
};
// 在应用初始化时调用
checkLoginStatus();

const showLogin = ref(false)
const showLoginOut = ref(false)

// 计算登录状态和用户名
const isLoggedIn = computed(() => !!authStore.token)
const username = computed(() => authStore.username)

// 登录成功后的回调
const handleLoginSuccess = (userName) => {
  showLogin.value = false   // ✅ 同时关闭登录弹窗
}

// 退出登录成功后的回调
const handleLoginOutOutSuccess = (userName) => {
  showLoginOut.value = false   // ✅ 同时关闭退出登录弹窗
}

import { useRouter } from 'vue-router';

const router = useRouter();

// 路由至个人主页
const goToProfile = (username) => {
  if (username) {
    router.push(`/profile/${username}`);
  } else {
    console.error('用户名不存在，无法跳转到个人主页');
  }
};
</script>

<template>
  <!-- 登录弹窗 -->
  <LoginModal v-if="showLogin" @close="showLogin = false" @login-success="handleLoginSuccess" />
  <LoginOutModal v-else-if="showLoginOut" @close="showLoginOut = false" @login-success="handleLoginOutOutSuccess" />

  <div class="app-container">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="logo-container">
        <img class="logo" src="@/assets/pumpfun.png" alt="Pumpfun Logo" />
        <span class="logo-text">中文模因社区</span>
      </div>

      <nav class="nav-container">
        <RouterLink to="/" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/home.png" alt="Home" />
          <span class="nav-text">主页面</span>
        </RouterLink>
        <RouterLink v-if="isLoggedIn" :to="`/profile/${username}`" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/profile.png" alt="Profile" />
          <span class="nav-text">个人主页</span>
        </RouterLink>
        <RouterLink v-if="isLoggedIn" :to="`/create-meme`" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/doge.png" alt="Profile" />
          <span class="nav-text">创建模因</span>
        </RouterLink>
        <RouterLink v-if="isLoggedIn" :to="`/notification`" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/pumpfun.png" alt="Profile" />
          <span class="nav-text">消息通知</span>
        </RouterLink>
        <RouterLink v-if="isLoggedIn" :to="`/chat`" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/pepe.avif" alt="Profile" />
          <span class="nav-text">私信、C2C交易</span>
        </RouterLink>
        <RouterLink 
          v-if="isLoggedIn && authStore.user_role === 'reviewer'" 
          :to="`/audit`" 
          class="nav-item" 
          active-class="active"
        >
          <img class="nav-icon" src="@/assets/search.png" alt="Profile" />
          <span class="nav-text">审核模因</span>
        </RouterLink>
        <div v-if="!isLoggedIn" @click="showLogin = true" class="nav-item" active-class="active">
          <span class="nav-icon">🔑</span>
          <span class="nav-text">登录</span>
        </div>
        <div v-if="isLoggedIn" @click="showLoginOut = true" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/logo.svg" alt="Profile" />
          <span class="nav-text">退出登录</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- ⭐ 新增这一行 -->
      <!-- 顶部栏 -->
      <div class="top-bar">
        <!-- 未登录按钮 -->
        <button v-if="!isLoggedIn" @click="showLogin = true" class="login-btn">
          登录
        </button>

        <!-- 已登录按钮 -->
        <div v-else class="top-buttons">
          <!-- 左侧的头像 + 昵称 + 用户名 -->
          <div class="user-info" @click="goToProfile(authStore.username)" style="cursor: pointer;">
            <img :src="authStore.avatar" alt="avatar" class="user-avatar" />
            <div class="user-text">
              <span class="nickname">{{ authStore.nickname }}</span>
              <span class="username">@{{ authStore.username }}</span>
            </div>
            <div v-if="authStore.user_role === 'reviewer'" class="reviewer-badge">
              审核员
            </div>
            <div v-else class="reviewer-badge">
              普通用户
            </div>
          </div>

          <div class="button-group">
            <RouterLink to="/create-meme" class="top-button">创建模因</RouterLink>
            <button @click="showLoginOut = true" class="top-button">退出登录</button>
          </div>
        </div>
      </div>

      <!-- 路由视图 -->
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #000000;
  color: #333;
}

/* 左侧导航栏样式 */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 220px;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a, #040404);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  z-index: 1000;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3498db, #9b59b6);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.logo-text {
  color: white;
  font-weight: bold;
  font-size: 18px;
  margin-left: 12px;
} 

.nav-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 15px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #ecf0f1;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.nav-item.active {
  background-color: rgba(52, 152, 219, 0.2);
  border-left: 4px solid #046e36;
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

/* 主内容区域样式 */
.main-content {
  position: absolute;
  left: 220px;
  right: 0;
  top: 0;
  bottom: 0;
  padding: 0px;
  min-height: 100vh;
  background-color: #000000; 
  color: #ffffff; 
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
    overflow: hidden;
  }

  .logo-text {
    display: none;
  }

  .nav-text {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 15px 0;
  }

  .nav-icon {
    margin-right: 0;
    font-size: 20px;
  }

  .main-content {
    margin-left: 70px;
    padding: 20px;
  }

  .content-header h1 {
    font-size: 24px;
  }
}

.fixed-buttons {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px; /* 控制两个按钮之间的间距 */
  z-index: 1000;
}

.fixed-button2 {
  background-color: #42b983;
  color: black;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s;
}

.fixed-button {
  /* 一个固定在页面右上角的按钮 */
  position: fixed;
  /* 固定定位 */
  top: 20px;
  /* 离浏览器窗口顶部 20 像素 */
  right: 20px;
  /* 离浏览器窗口右边 20 像素 */
  background-color: #42b983;
  /* Vue 绿色 */
  color: black;
  /* 按钮文字颜色是黑色 */
  border: none;
  /* 去掉默认的按钮边框 */
  border-radius: 6px;
  /* 让按钮的边角变得 圆润，半径是 6px */
  padding: 0.6rem 1rem;
  /* 按钮内部的内边距：上下 0.6rem（约 10px），左右 1rem（约 16px）。使得按钮内容不贴边，看起来更舒展。 */
  font-size: 1.0rem;
  /* 设置文字大小，大约相当于 14–15px */
  cursor: pointer;
  /* 鼠标悬停在按钮上时，显示手型光标 */
  z-index: 1000;
  /* 让按钮浮在最上层，避免被其他元素遮挡 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  /* 给按钮添加一个柔和的阴影，提升立体感；阴影向下偏移 2px，模糊程度 5px，颜色是半透明黑 */
}

.fixed-button:hover {
  /* 当鼠标悬停在按钮上时的样式 */
  background-color: #2c9c6a;
  /* 悬停时背景变为更深的绿色，让用户有交互反馈 */
}

/* 顶部工具栏，占据主区域最上方一行 */
.top-bar {
  width: 100%;
  height: 60px;
  padding: 10px 20px;

  display: flex;
  justify-content: flex-end; /* 按钮靠右 */
  align-items: center;

  background: #000000; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 顶部按钮统一样式 */
.top-button {
  background-color: #42b983;
  color: black;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 10px;
}

.top-button:hover {
  background-color: #2c9c6a;
}

.login-btn {
  background-color: #42b983;
  color: black;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 10px;
}

.login-btn:hover {
  background-color: #2c9c6a;
}

.top-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: center;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 10px;   /* 控制两个按钮的间距 */
}

/* 左侧用户信息容器 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 圆形头像 */
.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #42b983;
}

/* 用户名+昵称文本区域 */
.user-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

/* 昵称：正常大小、白色 */
.nickname {
  font-size: 18px;
  color: white;
  font-weight: 600;
}

/* @用户名：更小、蓝色 */
.username {
  font-size: 14px;
  color: #3498db;
  font-weight: 500;
}

.reviewer-badge {
  margin-left: 10px;
  padding: 4px 8px;
  background-color: #3498db; /* 蓝色背景 */
  color: white; /* 白色文字 */
  border-radius: 4px; /* 圆角 */
  font-size: 12px; /* 字体大小 */
  font-weight: bold; /* 加粗 */
  display: inline-block; /* 内联块元素 */
}
</style>