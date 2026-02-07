<script setup lang="ts">
import { X, Wallet, Mail, Link2 } from 'lucide-vue-next'
import NeonButton from './NeonButton.vue'

defineProps<{
  isOpen: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  close: []
  connect: [method: 'metamask' | 'email' | 'walletconnect']
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="relative w-full max-w-md glass rounded-2xl p-8 animate-fade-in-zoom">
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          :disabled="isLoading"
        >
          <X class="w-6 h-6" />
        </button>

        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center">
            <Wallet class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-2xl mb-2">Welcome to Black Horse Guild</h2>
          <p class="text-muted-foreground">Connect your wallet to start earning DHC tokens</p>
        </div>

        <div class="space-y-3">
          <button
            @click="emit('connect', 'metamask')"
            :disabled="isLoading"
            class="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Wallet class="w-6 h-6 text-orange-500" />
            </div>
            <div class="text-left flex-1">
              <div>MetaMask</div>
              <div class="text-sm text-muted-foreground">Connect with MetaMask wallet</div>
            </div>
          </button>

          <button
            @click="emit('connect', 'email')"
            :disabled="isLoading"
            class="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div class="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
              <Mail class="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div class="text-left flex-1">
              <div>Email / WeChat</div>
              <div class="text-sm text-muted-foreground">Gasless login (EIP-7702)</div>
            </div>
          </button>

          <button
            @click="emit('connect', 'walletconnect')"
            :disabled="isLoading"
            class="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div class="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
              <Link2 class="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div class="text-left flex-1">
              <div>WalletConnect</div>
              <div class="text-sm text-muted-foreground">Connect with any wallet</div>
            </div>
          </button>
        </div>

        <div v-if="isLoading" class="mt-6 text-center">
          <div class="inline-block w-6 h-6 border-2 border-[#00D1FF] border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-2 text-sm text-muted-foreground">Connecting...</p>
        </div>

        <p class="mt-6 text-xs text-center text-muted-foreground">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  </Teleport>
</template>
