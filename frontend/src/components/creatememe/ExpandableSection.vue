<template>
    <div class="expandable-section">
        <button class="header" @click="toggle">
            <span class="icon">🔗</span>
            <span class="title">{{ title }}</span>
            <span class="optional">(Optional)</span>
            <span class="arrow">{{ isOpen ? '▴' : '▾' }}</span>
        </button>
        <transition name="fade">
        <div v-if="isOpen" class="content">
            <slot></slot>
        </div>
        </transition>
    </div>
</template>


<script setup>
import { ref } from 'vue'
const props = defineProps({ title: String })
const isOpen = ref(false)
const toggle = () => { isOpen.value = !isOpen.value }
</script>


<style scoped>
.expandable-section{ margin-top:12px }
.header{ width:24%; display:flex; justify-content:space-between; background:transparent; color:var(--fg); border:none; font-size:14px; padding:6px 0; cursor:pointer }
/* .icon{ margin-right:6px } */
.title{ font-weight:500 }
/* .optional{ color:var(--muted); font-size:13px; margin-left:4px } */
.arrow{ font-size:14px }
.content{ margin-top:12px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px }
.fade-enter-active,.fade-leave-active{ transition:opacity 0.2s ease }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>