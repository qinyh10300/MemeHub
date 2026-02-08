<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, BarChart3, Target, TrendingUp, Users } from 'lucide-vue-next'
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
  const name = route.name
  if (name === 'dashboard') return 'dashboard'
  if (name?.startsWith('dex')) return 'dex'
  if (name?.startsWith('task') || name === 'game') return 'quests'
  if (name?.startsWith('prediction') || name === 'vault') return 'earn'
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
    <!-- Main Content -->
    <main :class="showBottomNav ? 'pb-20 lg:pb-0' : ''">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation — clean 5-tab layout -->
    <nav v-if="showBottomNav" class="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10" style="background: rgba(10, 14, 23, 0.92); backdrop-filter: blur(20px) saturate(1.8);">
      <div class="grid grid-cols-5 px-1 py-2">
        <button
          @click="router.push('/dashboard')"
          :class="[
            'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200',
            currentSection === 'dashboard'
              ? 'text-[#00D1FF]'
              : 'text-white/40 hover:text-white/70',
          ]"
        >
          <div :class="['p-1.5 rounded-lg transition-all duration-200', currentSection === 'dashboard' ? 'bg-[#00D1FF]/15' : '']">
            <Home class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-semibold">Home</span>
        </button>

        <button
          @click="router.push('/dex')"
          :class="[
            'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200',
            currentSection === 'dex'
              ? 'text-[#00D084]'
              : 'text-white/40 hover:text-white/70',
          ]"
        >
          <div :class="['p-1.5 rounded-lg transition-all duration-200', currentSection === 'dex' ? 'bg-[#00D084]/15' : '']">
            <BarChart3 class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-semibold">Trade</span>
        </button>

        <button
          @click="router.push('/tasks')"
          :class="[
            'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200',
            currentSection === 'quests'
              ? 'text-[#FFA500]'
              : 'text-white/40 hover:text-white/70',
          ]"
        >
          <div :class="['p-1.5 rounded-lg transition-all duration-200', currentSection === 'quests' ? 'bg-[#FFA500]/15' : '']">
            <Target class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-semibold">Quests</span>
        </button>

        <button
          @click="router.push('/predictions')"
          :class="[
            'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200',
            currentSection === 'earn'
              ? 'text-[#7C3AED]'
              : 'text-white/40 hover:text-white/70',
          ]"
        >
          <div :class="['p-1.5 rounded-lg transition-all duration-200', currentSection === 'earn' ? 'bg-[#7C3AED]/15' : '']">
            <TrendingUp class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-semibold">Predict</span>
        </button>

        <button
          @click="router.push('/community')"
          :class="[
            'flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200',
            currentSection === 'community'
              ? 'text-[#FF6B6B]'
              : 'text-white/40 hover:text-white/70',
          ]"
        >
          <div :class="['p-1.5 rounded-lg transition-all duration-200', currentSection === 'community' ? 'bg-[#FF6B6B]/15' : '']">
            <Users class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-semibold">Social</span>
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
