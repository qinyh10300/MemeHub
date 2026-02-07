<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const variantStyles: Record<string, string> = {
  primary: 'bg-[#00D1FF] text-[#0A0E17] hover:bg-[#00B8E6] hover:shadow-[0_0_20px_rgba(0,209,255,0.5)]',
  secondary: 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
  outline: 'border-2 border-[#00D1FF] text-[#00D1FF] hover:bg-[#00D1FF] hover:text-[#0A0E17]',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-lg',
}
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      'relative overflow-hidden transition-all duration-300 rounded-lg font-medium',
      variantStyles[variant],
      sizeStyles[size],
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
  >
    <slot />
  </button>
</template>
