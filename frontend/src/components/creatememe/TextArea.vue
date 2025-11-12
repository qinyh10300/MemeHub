<template>
    <div class="textarea">
        <label>{{ label }}</label>
        <textarea :placeholder="placeholder" rows="4"></textarea>
    </div>
</template>


<script setup>
defineProps({ label: { type: String, default: '' }, placeholder: { type: String, default: '' } })
</script>


<style scoped>
.textarea label{ font-size:13px; color:var(--muted); margin-bottom:6px; display:block }
.textarea textarea{ width:100%; background:transparent; border:1px solid rgba(255,255,255,0.25); padding:12px; border-radius:8px; color:var(--fg); font-family:inherit; font-size:14px; resize:vertical }
.textarea textarea::placeholder{ color:rgba(255,255,255,0.7); font-family:inherit; font-size:14px }
</style>