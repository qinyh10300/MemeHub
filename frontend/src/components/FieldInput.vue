<template>
    <div class="field">
        <label>{{ label }}</label>
        <input :placeholder="placeholder" />
    </div>
</template>


<script setup>
defineProps({ label: { type: String, default: '' }, placeholder: { type: String, default: '' } })
</script>


<style scoped>
.field{ display:flex; flex-direction:column }
.field label{ font-size:13px; color:var(--muted); margin-bottom:6px }
.field input{ background:transparent; border:1px solid rgba(255,255,255,0.25); padding:10px 12px; border-radius:8px; color:var(--fg) }
.field input::placeholder{ color:rgba(255, 255, 255, 0.7) }
</style>