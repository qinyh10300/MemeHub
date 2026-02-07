<script setup lang="ts">
withDefaults(defineProps<{
  hover?: boolean
}>(), {
  hover: false,
})
</script>

<template>
  <div
    class="glass rounded-xl p-6"
    :class="hover ? 'hover:bg-[rgba(26,31,46,0.8)] transition-all duration-300 hover:scale-[1.02]' : ''"
  >
    <slot />
  </div>
</template>
