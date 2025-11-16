<!-- <template>
    <button class="label"><slot /></button>
</template>


<script setup>

</script>


<style scoped>
.label {
  background: var(--my-c-button);
  color: #06241a;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  cursor:pointer;
}
</style> -->

<template>
    <button class="label" @click="$emit('click')">
        <slot />
    </button>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.label {
  background: var(--my-c-button);
  color: #06241a;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  cursor:pointer;
  border: none;
}
</style>