import { ref } from 'vue'
import { mockUser, type User } from '@/lib/mockData'

// Module-level state — shared across all components that call useWallet()
const isConnected = ref(false)
const user = ref<User | null>(null)
const isLoading = ref(false)
const showConnectModal = ref(false)

// Check localStorage on module load
const wasConnected = localStorage.getItem('wallet_connected')
if (wasConnected === 'true') {
  isConnected.value = true
  user.value = { ...mockUser }
}

export function useWallet() {
  const connect = async (method: 'metamask' | 'email' | 'walletconnect') => {
    isLoading.value = true
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    isConnected.value = true
    user.value = { ...mockUser }
    localStorage.setItem('wallet_connected', 'true')
    isLoading.value = false
  }

  const disconnect = () => {
    isConnected.value = false
    user.value = null
    localStorage.removeItem('wallet_connected')
  }

  const openConnectModal = () => {
    showConnectModal.value = true
  }

  const closeConnectModal = () => {
    showConnectModal.value = false
  }

  return {
    isConnected,
    user,
    isLoading,
    showConnectModal,
    connect,
    disconnect,
    openConnectModal,
    closeConnectModal,
  }
}
