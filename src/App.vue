<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, ListTodo, TrendingUp, Vault, Users } from 'lucide-vue-next'
import { Toaster, toast } from 'vue-sonner'
import WalletConnectModal from './components/WalletConnectModal.vue'
import { useWallet } from './composables/useWallet'

const route = useRoute()
const router = useRouter()
const { isConnected, isLoading, showConnectModal, connect, closeConnectModal } = useWallet()

const showBottomNav = computed(() => {
  return isConnected.value && route.name !== 'landing'
})

const currentSection = computed(() => {
  const name = route.name as string
  if (name === 'dashboard') return 'dashboard'
  if (name?.startsWith('task')) return 'tasks'
  if (name?.startsWith('prediction')) return 'predictions'
  if (name === 'vault') return 'vault'
  if (name === 'community') return 'community'
  return ''
})

async function handleWalletConnect(method: 'metamask' | 'email' | 'walletconnect') {
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
    <!-- Main Content -->
    <main :class="showBottomNav ? 'pb-20 lg:pb-0' : ''">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav v-if="showBottomNav" class="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-40">
      <div class="grid grid-cols-5 gap-1 px-2 py-3">
        <button
          @click="router.push('/dashboard')"
          :class="[
            'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
            currentSection === 'dashboard'
              ? 'text-[#00D1FF] bg-[#00D1FF]/10'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <Home class="w-5 h-5" />
          <span class="text-xs">Home</span>
        </button>
        <button
          @click="router.push('/tasks')"
          :class="[
            'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
            currentSection === 'tasks'
              ? 'text-[#00D1FF] bg-[#00D1FF]/10'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <ListTodo class="w-5 h-5" />
          <span class="text-xs">Tasks</span>
        </button>
        <button
          @click="router.push('/predictions')"
          :class="[
            'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
            currentSection === 'predictions'
              ? 'text-[#00D1FF] bg-[#00D1FF]/10'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <TrendingUp class="w-5 h-5" />
          <span class="text-xs">Markets</span>
        </button>
        <button
          @click="router.push('/vault')"
          :class="[
            'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
            currentSection === 'vault'
              ? 'text-[#00D1FF] bg-[#00D1FF]/10'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <Vault class="w-5 h-5" />
          <span class="text-xs">Vault</span>
        </button>
        <button
          @click="router.push('/community')"
          :class="[
            'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
            currentSection === 'community'
              ? 'text-[#00D1FF] bg-[#00D1FF]/10'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <Users class="w-5 h-5" />
          <span class="text-xs">Social</span>
        </button>
      </div>
    </nav>

    <!-- Wallet Connect Modal -->
    <WalletConnectModal
      :is-open="showConnectModal"
      :is-loading="isLoading"
      @close="closeConnectModal"
      @connect="handleWalletConnect"
    />

    <!-- Toast Notifications -->
    <Toaster
      position="top-right"
      :toast-options="{
        style: {
          background: '#1a1f2e',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }"
    />
  </div>
</template>
