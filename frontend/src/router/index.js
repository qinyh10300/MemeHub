import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateMemeView from '../views/CreateMeme.vue';
import ProfileView from '../views/ProfileView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/create-meme',
      name: 'CreateMeme',
      component: CreateMemeView,
    },
    {
      path: '/profile/:id', // 动态路由，:id 表示用户的唯一标识
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'), // 懒加载 ProfileView
    },
    {
      path: '/meme/:id', // 动态路由，:id 表示模因的唯一标识
      name: 'MemeDetail',
      component: () => import('../views/MemeDetailView.vue'),   // 动态导入（懒加载）
    },
  ],
})

export default router
