<template>
<div class="viewport">
    <!-- Fullscreen Content (doesn't get affected by tabs) -->
    <div class="stage">
    <AppAEntry v-if="tab === 'A'" />
    <AppBEntry v-else />
    </div>

    <!-- Floating Tabs (top-left, out of layout flow) -->
    <div class="floating-tabs" role="tablist" aria-label="Switch workspace">
    <div class="tabs-track">
        <div class="tabs-indicator" :class="tab === 'A' ? 'is-a' : 'is-b'"></div>

        <button
        class="tab-btn"
        :class="{ active: tab === 'A' }"
        @click="tab = 'A'"
        role="tab"
        :aria-selected="tab === 'A'"
        >
        <span class="tab-text">Community</span>
        </button>

        <button
        class="tab-btn"
        :class="{ active: tab === 'B' }"
        @click="tab = 'B'"
        role="tab"
        :aria-selected="tab === 'B'"
        >
        <span class="tab-text">Dex</span>
        </button>
    </div>

    </div>
</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppAEntry from "@/AppAEntry.vue";
import AppBEntry from "@/apps/appB/AppBEntry.vue";

const tab = ref<"A" | "B">("A");
</script>

<style scoped>
/* ========= Layout: content fullscreen, tabs floating ========= */
.viewport {
position: relative;
min-height: 100vh;
background: #050913; /* 深蓝黑底 */
color: rgba(255, 255, 255, 0.92);
overflow: hidden;
}

/* 全屏内容层：完全铺满，不受 tabs 影响 */
.stage {
position: fixed;
inset: 0;
width: 100vw;
height: 100vh;
/* 如果 App 内部要滚动，让 App 自己控制；你也可以把 overflow 放到 App 内 */
overflow: hidden;
z-index: 0;
}

/* 让 tabs 永远浮在左上角，不参与布局 */
.floating-tabs {
position: fixed;
top: 14px;
left: 14px;
z-index: 9999;

width: 280px;
padding: 10px;
border-radius: 16px;

/* 深蓝 web3 玻璃 */
background: linear-gradient(
    180deg,
    rgba(9, 18, 40, 0.62),
    rgba(5, 10, 22, 0.40)
);
border: 1px solid rgba(120, 170, 255, 0.16);
box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 0, 0, 0.25) inset;
backdrop-filter: blur(14px);
-webkit-backdrop-filter: blur(14px);
}

/* ========= Tabs track ========= */
.tabs-track {
position: relative;
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
padding: 5px;
border-radius: 14px;

background: rgba(0, 0, 0, 0.32);
border: 1px solid rgba(140, 190, 255, 0.10);
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* 更丝滑：弹簧感 + 微发光 + 更清晰的“选中态” */
.tabs-indicator {
position: absolute;
top: 5px;
bottom: 5px;
left: 5px;
width: calc(50% - 4px);
border-radius: 12px;

background: linear-gradient(
    135deg,
    rgba(46, 125, 255, 0.28),
    rgba(0, 255, 209, 0.14)
);
border: 1px solid rgba(120, 200, 255, 0.20);

box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(46, 125, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.10);

transform: translate3d(0, 0, 0);
will-change: transform;

/* “贴手”的切换：快进慢出 + 轻微回弹感 */
transition:
    transform 340ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 240ms ease,
    background 240ms ease,
    border-color 240ms ease;
}

.tabs-indicator.is-b {
transform: translate3d(calc(100% + 8px), 0, 0);
}

/* ========= Buttons ========= */
.tab-btn {
position: relative;
z-index: 1;
display: inline-flex;
align-items: center;
justify-content: center;
gap: 10px;

padding: 10px 12px;
border: 0;
border-radius: 12px;
background: transparent;

cursor: pointer;
user-select: none;

color: rgba(200, 220, 255, 0.70);
font-weight: 850;
letter-spacing: 0.01em;

transition:
    transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
    color 160ms ease,
    filter 160ms ease;
}

.tab-btn:hover {
color: rgba(235, 245, 255, 0.92);
transform: translateY(-1px);
filter: drop-shadow(0 0 10px rgba(46, 125, 255, 0.18));
}

.tab-btn:active {
transform: translateY(0);
}

.tab-btn.active {
color: rgba(245, 250, 255, 0.98);
}

.tab-text {
font-size: 13px;
}

.tab-sub {
font-size: 11px;
font-weight: 900;
padding: 3px 8px;
border-radius: 999px;

background: rgba(46, 125, 255, 0.14);
border: 1px solid rgba(140, 200, 255, 0.16);
color: rgba(220, 240, 255, 0.80);
}

/* ========= Meta ========= */
.tabs-meta {
margin-top: 10px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 10px;
padding: 0 2px;
}

.pill {
display: inline-flex;
align-items: center;
gap: 8px;
padding: 6px 10px;
border-radius: 999px;

font-size: 11px;
font-weight: 900;
letter-spacing: 0.14em;

color: rgba(210, 230, 255, 0.72);
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(140, 200, 255, 0.10);
}

.dot {
width: 8px;
height: 8px;
border-radius: 999px;

background: rgba(46, 125, 255, 0.95);
box-shadow:
    0 0 14px rgba(46, 125, 255, 0.35),
    0 0 30px rgba(0, 255, 209, 0.10);
}

.meta-text {
font-size: 12px;
color: rgba(190, 210, 255, 0.55);
font-weight: 700;
}

/* ========= Optional: mobile-friendly smaller ========= */
@media (max-width: 520px) {
.floating-tabs {
    width: 250px;
    top: 10px;
    left: 10px;
    padding: 9px;
}
}

/* 无障碍：减少动态效果 */
@media (prefers-reduced-motion: reduce) {
.tabs-indicator,
.tab-btn {
    transition: none !important;
}
}
</style>
