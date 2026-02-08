import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/components/LandingPage.vue'
import Dashboard from '@/components/Dashboard.vue'
import TaskFeedPage from '@/components/TaskFeedPage.vue'
import TaskCreationPage from '@/components/TaskCreationPage.vue'
import TaskDetailPage from '@/components/TaskDetailPage.vue'
import PredictionMarketsPage from '@/components/PredictionMarketsPage.vue'
import PredictionDetailPage from '@/components/PredictionDetailPage.vue'
import VaultPage from '@/components/VaultPage.vue'
import CommunityPage from '@/components/CommunityPage.vue'
import GamePage from '@/components/game/GamePage.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingPage },
  { path: '/dashboard', name: 'dashboard', component: Dashboard },
  { path: '/tasks', name: 'tasks', component: TaskFeedPage },
  { path: '/tasks/create', name: 'task-create', component: TaskCreationPage },
  { path: '/tasks/:id', name: 'task-detail', component: TaskDetailPage, props: true },
  { path: '/predictions', name: 'predictions', component: PredictionMarketsPage },
  { path: '/predictions/:id', name: 'prediction-detail', component: PredictionDetailPage, props: true },
  { path: '/vault', name: 'vault', component: VaultPage },
  { path: '/community', name: 'community', component: CommunityPage },
  { path: '/game', name: 'game', component: GamePage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
