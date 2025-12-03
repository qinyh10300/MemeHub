<script setup>
import { ref, onMounted, computed } from 'vue'
import Search from '../components/Search.vue'
import FeaturedProjects from '../components/FeaturedProject.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const serverIp = authStore.server_ip || 'http://localhost:3000'

const messageAlerts = ref({ total: 0, previews: [] })
const tradeAlerts = ref({ total: 0, previews: [] })
const alertsLoading = ref(false)

const getToken = () => authStore.token || localStorage.getItem('auth_token') || authStore.username || ''
const isLoggedIn = computed(() => !!getToken())

const fetchAlerts = async () => {
  if (!isLoggedIn.value) return
  alertsLoading.value = true
  const token = getToken()
  try {
    const [messageRes, tradeRes] = await Promise.all([
      fetch(`${serverIp}/api/message/unread-count`, { headers: { token } }),
      fetch(`${serverIp}/api/c2c/incoming/pending-count`, { headers: { token } })
    ])

    const messageData = await messageRes.json()
    const tradeData = await tradeRes.json()

    if (messageData.code === 0) {
      messageAlerts.value = {
        total: messageData.data.total || 0,
        previews: messageData.data.previews || []
      }
    }

    if (tradeData.code === 0) {
      tradeAlerts.value = {
        total: tradeData.data.total || 0,
        previews: tradeData.data.previews || []
      }
    }
  } catch (error) {
    console.error('获取提醒失败', error)
  } finally {
    alertsLoading.value = false
  }
}

const refreshAlerts = () => {
  fetchAlerts()
}

onMounted(() => {
  fetchAlerts()
})
</script>

<template>
  <main>
     <header class="content-header">
        <h1>Welcome to our platform</h1>
        <p>Explore and discover amazing projects</p>
      </header>
      <section v-if="isLoggedIn" class="alerts-wrapper">
        <div class="alerts-header">
          <h2>提醒中心</h2>
          <button class="refresh-btn" :disabled="alertsLoading" @click="refreshAlerts">
            {{ alertsLoading ? '更新中...' : '刷新' }}
          </button>
        </div>
        <div class="alerts-grid">
          <div class="alert-card">
            <div class="alert-card-header">
              <div>
                <p class="alert-label">未读私信</p>
                <h3>{{ messageAlerts.total }}</h3>
              </div>
              <RouterLink to="/chat" class="alert-link">前往消息 →</RouterLink>
            </div>
            <ul v-if="messageAlerts.previews.length > 0" class="alert-list">
              <li v-for="item in messageAlerts.previews" :key="item.messageId">
                <span class="alert-user">{{ item.sender.nickname || item.sender.username }}</span>
                <span class="alert-preview">{{ item.preview }}</span>
                <span class="alert-time">{{ new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </li>
            </ul>
            <p v-else class="alert-empty">最近没有新私信</p>
          </div>
          <div class="alert-card">
            <div class="alert-card-header">
              <div>
                <p class="alert-label">待处理交易</p>
                <h3>{{ tradeAlerts.total }}</h3>
              </div>
              <RouterLink to="/chat" class="alert-link">查看 C2C →</RouterLink>
            </div>
            <ul v-if="tradeAlerts.previews.length > 0" class="alert-list">
              <li v-for="item in tradeAlerts.previews" :key="item.id">
                <span class="alert-user">{{ item.from }}</span>
                <span class="alert-preview">向你发起 {{ item.amount }} {{ item.token }}</span>
                <span class="alert-time">{{ new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </li>
            </ul>
            <p v-else class="alert-empty">暂无新的 C2C 请求</p>
          </div>
        </div>
      </section>
      <div class="search-wrapper">
        <Search />
      </div>
      <div class="content-card">
        <FeaturedProjects />
      </div>
  </main>
</template>

<style scoped>

.search-wrapper {
  width: 100%;
  max-width: 500px;
  display: flex;
  margin: 0 auto;
}

.content-header {
  text-align: center;
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

.alerts-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 30px;
  background: #111;
  padding: 20px 30px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.alert-card {
  background: #1c1c1c;
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.alert-label {
  margin: 0;
  font-size: 14px;
  color: #a5a5a5;
}

.alert-card h3 {
  margin: 4px 0 0;
  font-size: 32px;
  color: #fff;
}

.alert-link {
  color: #42b983;
  font-size: 14px;
  text-decoration: none;
}

.alert-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-list li {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 10px;
}

.alert-user {
  font-weight: 600;
  margin-bottom: 2px;
}

.alert-preview {
  color: #cfcfcf;
}

.alert-time {
  margin-top: 4px;
  font-size: 11px;
  color: #8e8e8e;
}

.alert-empty {
  margin: 0;
  color: #8e8e8e;
  font-size: 13px;
}

.refresh-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #42b983;
  color: #42b983;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-card {
  /* width: 100%; */
  width: 1250px;
  /* max-width: 1200px;  */
  margin: 0 auto;    
  box-sizing: border-box;
  background-color: #000000;
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }
}
</style>