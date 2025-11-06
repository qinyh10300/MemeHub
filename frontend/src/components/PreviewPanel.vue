<template>
    <div class="preview">
        <div class="panel-title">Preview</div>
        <div class="preview-box">A preview of how the coin will look like</div>
    </div>
</template>


<script setup>
</script>


<style scoped>
.preview{ background:transparent }
.panel-title{ color:var(--muted); margin-bottom:8px }
.preview-box{ height:300px; border-radius:12px; background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; color:var(--muted); padding:12px }
</style>