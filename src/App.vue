<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, ListTodo, TrendingUp, Vault, Users } from 'lucide-vue-next'
import { Toaster, toast } from 'vue-sonner'
import WalletConnectModal from './components/WalletConnectModal.vue'
import { useWallet } from './composables/useWallet'

const route = useRoute()
const router = useRouter()
const { isConnected, isLoading, showConnectModal, connect, closeConnectModal } = useWallet()

// 新增：Dex 链接（把这里换成你的指定网页）
const DEX_URL = 'http://localhost:5173/'

function goToDex() {
  // 新标签页打开，避免影响当前 SPA 状态；noopener 更安全
  window.open(DEX_URL, '_blank', 'noopener,noreferrer')
}

const showBottomNav = computed(() => {
  return isConnected.value && route.name !== 'landing'
})

const currentSection = computed(() => {
  const name = route.name
  if (name === 'dashboard') return 'dashboard'
  if (name?.startsWith('task')) return 'tasks'
  if (name?.startsWith('prediction')) return 'predictions'
  if (name === 'vault') return 'vault'
  if (name === 'community') return 'community'
  return ''
})

async function handleWalletConnect(method) {
  await connect(method)
  closeConnectModal()
  router.push('/dashboard')
  toast.success(`Connected with ${method}!`, {
    description: 'Welcome to Black Horse Guild',
  })
}
</script>

<template>
  <div class="dark min-h-screen bg-background text-foreground">
    <!-- Top Bar -->
    <header class="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur">
      <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-end">
        <!-- 改：移除这里的按钮，避免占位影响排布 -->
        <!-- ...existing code... -->
      </div>
    </header>

    <!-- 新增：悬浮 Dex 按钮（不占布局） -->
    <button type="button" class="dex-fab" @click="goToDex" aria-label="切换到Dex">
      <span class="dex-fab__shine" aria-hidden="true"></span>
      <span class="dex-fab__text">DardHorse Dex</span>
      <!-- <span class="dex-fab__tag">DEX</span> -->
    </button>

    <!-- Main Content -->
    <main :class="showBottomNav ? 'pb-20 lg:pb-0' : ''">
      <router-view />
    </main>

    <!-- ...existing code... -->
  </div>
</template>

<style scoped>
/* ...existing code... */

/* Web3 悬浮按钮：玻璃拟态 + 霓虹描边 + 丝滑交互 */
.dex-fab {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 60; /* 在 header(50) 之上，但低于 modal/overlay 自己的层级即可 */
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);

  /* glass */
  background: radial-gradient(120% 180% at 20% 0%, rgba(0, 209, 255, 0.18), transparent 55%),
    radial-gradient(120% 180% at 90% 20%, rgba(138, 92, 255, 0.16), transparent 55%),
    rgba(12, 16, 24, 0.58);

  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.38),
    0 0 0 1px rgba(0, 209, 255, 0.08) inset;
  cursor: pointer;
  user-select: none;

  transition:
    transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1),
    box-shadow 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
  will-change: transform;
}

.dex-fab:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 209, 255, 0.26);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(0, 209, 255, 0.14) inset,
    0 0 24px rgba(0, 209, 255, 0.10);
}

.dex-fab:active {
  transform: translateY(0);
}

.dex-fab:focus-visible {
  outline: none;
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(0, 209, 255, 0.14) inset,
    0 0 0 3px rgba(0, 209, 255, 0.22);
}

.dex-fab__text {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.dex-fab__tag {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}

/* 轻微流光（不夸张） */
.dex-fab__shine {
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  pointer-events: none;
  background: linear-gradient(110deg, transparent 0%, rgba(0, 209, 255, 0.20) 40%, rgba(138, 92, 255, 0.18) 60%, transparent 100%);
  opacity: 0;
  filter: blur(10px);
  transition: opacity 180ms ease;
}
.dex-fab:hover .dex-fab__shine {
  opacity: 1;
}

/* 移动端避免挡住内容：当底部导航存在时，按钮稍微上移/更小 */
@media (max-width: 640px) {
  .dex-fab {
    top: 12px;
    right: 12px;
    padding: 9px 11px;
  }
  .dex-fab__text {
    font-size: 12px;
  }
}

/* ...existing code... */
</style>