<script setup>
import DexTokenView from '../dex_frontend/src/views/TokenView.vue'

defineProps({
  address: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="dex-token-page">
    <DexTokenView :address="address" />
  </section>
</template>

<style scoped>
.dex-token-page {
  width: 100%;
  max-width: 1280px;
  margin: 32px auto;
  padding: 0 16px 40px;
  box-sizing: border-box;
}
</style>
