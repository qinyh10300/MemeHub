import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateMemeView from '../views/CreateMeme.vue';
import ProfileView from '../views/ProfileView.vue';
import SearchView from '../views/SearchView.vue';
import AuditView from '../views/AuditMeme.vue';
import NotificationView from '../views/NotificationView.vue'
import ChatView from '../views/ChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/search',
      name: 'SearchView',
      component: SearchView,
    },
    {
      path: '/audit',
      name: 'AuditView',
      component: AuditView,
    },
    {
      path: '/create-meme',
      name: 'CreateMeme',
      component: CreateMemeView,
    },
    {
      path: '/notification',
      name: 'Notification',
      component: NotificationView,
    },
    {
      path: '/chat',
      name: 'Chat',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/gamification',
      name: 'GamificationCenter',
      component: () => import('../views/CheckView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/:id', // 动态路由，:id 表示用户的唯一标识
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'), // 懒加载 ProfileView
      meta: { requiresAuth: true },
    },
    {
      path: '/meme/:id', // 动态路由，:id 表示模因的唯一标识
      name: 'MemeDetail',
      component: () => import('../views/MemeDetailView.vue'),   // 动态导入（懒加载）
      meta: { requiresAuth: true },
    },
    {
      path: '/discover',
      name: 'Discover',
      component: () => import('../views/DiscoverView.vue'),
      meta: { title: '发现' },
    },
    {
      path: '/leaderboard',
      name: 'Leaderboard',
      component: () => import('../views/LeaderboardView.vue'),
      meta: { title: '排行榜' },
    },
    {
      path: '/achievements',
      name: 'Achievements',
      component: () => import('../views/AchievementsView.vue'),
      meta: { requiresAuth: true, title: '成就中心' },
    },
    {
      path: '/price-alert',
      name: 'PriceAlert',
      component: () => import('../views/PriceAlertView.vue'),
      meta: { requiresAuth: true, title: '价格预警' },
    },
    {
      path: '/compare',
      name: 'Compare',
      component: () => import('../views/CompareView.vue'),
      meta: { title: '对比分析' },
    },
    {
      path: '/voting',
      name: 'Voting',
      component: () => import('../views/VotingView.vue'),
      meta: { title: '社区投票' },
    },
    {
      path: '/creator-dashboard',
      name: 'CreatorDashboard',
      component: () => import('../views/CreatorDashboard.vue'),
      meta: { requiresAuth: true, title: '创作者面板' },
    },
    {
      path: '/watchlist',
      name: 'Watchlist',
      component: () => import('../views/WatchlistView.vue'),
      meta: { requiresAuth: true, title: '我的自选' },
    },
  ],
})

import { useAuthStore } from '@/stores/auth';

// 全局导航守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(); // 获取 Pinia 的 authStore
  const isLoggedIn = !!authStore.token; // 检查是否已登录

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 如果路由需要登录且用户未登录
    console.log('未登录，跳转到登录弹窗');
    authStore.setToken(''); // 确保 token 清空
    next(false); // 阻止导航
    const loginModal = document.querySelector('.login-btn'); // 找到登录按钮
    // 👉 在整个 HTML 文档中
    // 👉 找到 class="fixed-button" 的第一个元素
    // 👉 返回它的 DOM 节点，并赋给 loginModal
    if (loginModal) {
      loginModal.click(); // 触发登录弹窗
    }
  } else {
    next(); // 允许导航
  }
});

export default router
