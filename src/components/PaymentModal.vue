<script setup lang="ts">
import { ref } from 'vue'
import { X, DollarSign, Shield, Zap } from 'lucide-vue-next'
import NeonButton from './NeonButton.vue'

const props = defineProps<{
  isOpen: boolean
  amount: number
  currency: 'USDC' | 'USDT' | 'DHC'
  purpose: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const isProcessing = ref(false)

async function handleConfirm() {
  isProcessing.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isProcessing.value = false
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="relative w-full max-w-md glass rounded-2xl p-8 animate-fade-in-zoom">
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          :disabled="isProcessing"
        >
          <X class="w-6 h-6" />
        </button>

        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center">
            <DollarSign class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-2xl mb-2">Payment Required</h2>
          <p class="text-muted-foreground">{{ purpose }}</p>
        </div>

        <div class="space-y-4 mb-8">
          <div class="glass p-6 rounded-xl">
            <div class="flex justify-between items-center mb-4">
              <span class="text-muted-foreground">Amount</span>
              <span class="text-3xl">{{ amount }} {{ currency }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground">Network Fee</span>
              <span class="text-[#00FF9D]">0 CFX (Gasless)</span>
            </div>
          </div>

          <div class="flex items-start gap-3 p-4 bg-[#00D1FF]/10 border border-[#00D1FF]/30 rounded-lg">
            <Zap class="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
            <div class="text-sm">
              <div class="text-[#00D1FF] mb-1">Powered by x402 Micro-Payments</div>
              <div class="text-muted-foreground">Instant, secure, gasless transactions on Conflux eSpace</div>
            </div>
          </div>

          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield class="w-4 h-4" />
            <span>Secured by smart contract escrow</span>
          </div>
        </div>

        <div class="flex gap-3">
          <NeonButton @click="handleConfirm" :disabled="isProcessing" class="flex-1">
            <span v-if="isProcessing" class="flex items-center gap-2 justify-center">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
            <span v-else>Pay {{ amount }} {{ currency }}</span>
          </NeonButton>
          <NeonButton variant="outline" @click="emit('close')" :disabled="isProcessing">
            Cancel
          </NeonButton>
        </div>

        <p class="mt-4 text-xs text-center text-muted-foreground">
          By confirming, you authorize this transaction
        </p>
      </div>
    </div>
  </Teleport>
</template>
