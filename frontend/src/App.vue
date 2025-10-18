<script setup>
import { ref } from 'vue'
import LoginModal from './components/LoginModal.vue'
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import HomeView from './views/HomeView.vue';
import Search from './components/Search.vue';

const showLogin = ref(false)
</script>

<template>
  <button @click="showLogin = true" class="fixed-button">登录</button>
  <LoginModal v-if="showLogin" @close="showLogin = false" />

  <div class="app-container">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="logo-container">
        <img class="logo" src="@/assets/pumpfun.png" alt="Pumpfun Logo" />
        <span class="logo-text">Pump.fun</span>
      </div>
      
      <nav class="nav-container">
        <RouterLink to="/" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/home.png" alt="Home"/>
          <span class="nav-text">Home</span>
        </RouterLink>
        <RouterLink to="/about" class="nav-item" active-class="active">
          <img class="nav-icon" src="@/assets/profile.png" alt="Profile"/>
          <span class="nav-text">Profile</span>
        </RouterLink>
        <RouterLink to="/login" class="nav-item" active-class="active">
          <span class="nav-icon">🔑</span>
          <span class="nav-text">Login</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <header class="content-header">
        <h1>Welcome to Vue App</h1>
        <p>Manage your application from here</p>
      </header>
      66666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666
      <Search />
      <!-- 路由视图 -->
      <!-- <RouterView /> -->
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
  flex: 1;
  margin-left: 220px;
  padding: 40px;
  min-height: 100vh;
}

.content-header {
  margin-bottom: 30px;
}

.content-header h1 {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.content-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.content-card {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
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
  
  .fixed-button {    /* 一个固定在页面右上角的按钮 */
    position: fixed;    /* 固定定位 */
    top: 20px;      /* 离浏览器窗口顶部 20 像素 */
    right: 20px;     /* 离浏览器窗口右边 20 像素 */
    background-color: #42b983; /* Vue 绿色 */
    color: black;    /* 按钮文字颜色是黑色 */
    border: none;    /* 去掉默认的按钮边框 */
    border-radius: 6px;    /* 让按钮的边角变得 圆润，半径是 6px */
    padding: 0.6rem 1rem;    /* 按钮内部的内边距：上下 0.6rem（约 10px），左右 1rem（约 16px）。使得按钮内容不贴边，看起来更舒展。 */
    font-size: 1.0rem;    /* 设置文字大小，大约相当于 14–15px */
    cursor: pointer;    /* 鼠标悬停在按钮上时，显示手型光标 */
    z-index: 1000;    /* 让按钮浮在最上层，避免被其他元素遮挡 */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);    /* 给按钮添加一个柔和的阴影，提升立体感；阴影向下偏移 2px，模糊程度 5px，颜色是半透明黑 */
  }

  .fixed-button:hover {    /* 当鼠标悬停在按钮上时的样式 */
    background-color: #2c9c6a;    /* 悬停时背景变为更深的绿色，让用户有交互反馈 */
  }
</style>