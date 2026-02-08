<template>
    <div class="shell">
      <!-- Top Tabs -->
      <div class="top-tabs">
        <div class="top-tabs-inner">
          <div class="tabs-track">
            <div class="tabs-indicator" :class="tab === 'A' ? 'is-a' : 'is-b'"></div>
  
            <button class="tab-btn" :class="{ active: tab === 'A' }" @click="tab = 'A'">
              <span class="tab-text">App A</span>
            </button>
  
            <button class="tab-btn" :class="{ active: tab === 'B' }" @click="tab = 'B'">
              <span class="tab-text">App B</span>
            </button>
          </div>
  
        </div>
      </div>
  
      <!-- Content：让子应用全屏展示 -->
      <div class="content">
        <AppAEntry v-if="tab === 'A'" />
        <AppBEntry v-else />
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
/* ...existing code... */
.shell {
  min-height: 100vh;
  padding: 18px;
  background:
    radial-gradient(900px 520px at 10% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
    radial-gradient(820px 520px at 95% 0%, rgba(255, 59, 105, 0.10), transparent 60%),
    radial-gradient(700px 520px at 55% 100%, rgba(86, 195, 255, 0.08), transparent 60%),
    #0b0f14;
  color: rgba(255, 255, 255, 0.92);
}

/* 顶部 tabs：更简约的玻璃条 */
.top-tabs {
  position: sticky;
  top: 0;
  z-index: 50;
  margin: 0 auto 16px;
  max-width: 980px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

/* 轨道：更干净，降低对比与噪点 */
.tabs-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* 核心：丝滑滑块（更轻、更快、更“贴手”） */
.tabs-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 3px);
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.10);

  /* subtle highlight */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 6px 16px rgba(0, 0, 0, 0.22);

  transform: translate3d(0, 0, 0);
  will-change: transform;

  transition:
    transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.tabs-indicator.is-b {
  transform: translate3d(calc(100% + 6px), 0, 0);
}

/* Tab 按钮：更极简 */
.tab-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px;

  border: none;
  border-radius: 10px;
  background: transparent;

  cursor: pointer;
  user-select: none;

  color: rgba(255, 255, 255, 0.70);
  font-weight: 800;
  letter-spacing: 0.01em;

  transition:
    color 160ms ease,
    transform 140ms ease,
    opacity 140ms ease;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.tab-btn:active {
  transform: translateY(0);
}

.tab-btn.active {
  color: rgba(255, 255, 255, 0.96);
}

/* 更克制的文字与 badge */
.tab-text {
  font-size: 13px;
}

.tab-sub {
  font-size: 11px;
  font-weight: 850;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.75);
}

/* meta 保留，但更轻 */
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
  font-weight: 850;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(86, 195, 255, 0.9);
  box-shadow: 0 0 10px rgba(86, 195, 255, 0.22);
}

.meta-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 650;
}

.content {
  max-width: 980px;
  margin: 0 auto;
}

/* 无障碍：减少动态效果 */
@media (prefers-reduced-motion: reduce) {
  .tabs-indicator,
  .tab-btn {
    transition: none !important;
  }
}
/* ...existing code... */

.shell {
  min-height: 100vh;
  /* 关键：不要再给整个页面 padding，否则会“压缩”子应用 */
  padding: 0;

  background:
    radial-gradient(900px 520px at 10% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
    radial-gradient(820px 520px at 95% 0%, rgba(255, 59, 105, 0.10), transparent 60%),
    radial-gradient(700px 520px at 55% 100%, rgba(86, 195, 255, 0.08), transparent 60%),
    #0b0f14;
  color: rgba(255, 255, 255, 0.92);

  /* 让内容可以“铺满” */
  display: flex;
  flex-direction: column;
}

/* 顶部 tabs：变小 + 只负责自身 */
.top-tabs {
  position: sticky;
  top: 0;
  z-index: 50;

  /* 关键：顶栏自己有 padding，用来离边界留白 */
  padding: 10px 12px;
}

/* 新增：只让顶栏内容居中/限宽，不影响下面内容 */
.top-tabs-inner {
  margin: 0 auto;
  max-width: 980px;

  /* 顶栏更小一点 */
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

/* 轨道略微缩小 */
.tabs-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 3px;              /* 原来 4px -> 3px */
  border-radius: 10px;       /* 原来 12px -> 10px */
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tabs-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  border-radius: 8px;        /* 原来 10px -> 8px */

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.10);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 6px 16px rgba(0, 0, 0, 0.22);

  transform: translate3d(0, 0, 0);
  will-change: transform;

  transition:
    transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.tabs-indicator.is-b {
  transform: translate3d(calc(100% + 6px), 0, 0);
}

.tab-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 10px;         /* 变小 */
  border: none;
  border-radius: 8px;        /* 变小 */
  background: transparent;
  cursor: pointer;
  user-select: none;

  color: rgba(255, 255, 255, 0.70);
  font-weight: 800;
  letter-spacing: 0.01em;

  transition:
    color 160ms ease,
    transform 140ms ease,
    opacity 140ms ease;
}

.tab-text { font-size: 12px; }  /* 变小 */
.tab-sub {
  font-size: 10px;
  font-weight: 850;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.75);
}

.tabs-meta {
  margin-top: 8px;           /* 变小 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
}

.pill {
  padding: 5px 9px;          /* 变小 */
  font-size: 10px;
  border-radius: 999px;
  font-weight: 850;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(86, 195, 255, 0.9);
  box-shadow: 0 0 10px rgba(86, 195, 255, 0.22);
}

.meta-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 650;
}

/* 关键：内容区全宽全高，不再限宽，不再居中，不再被 padding 影响 */
.content {
  flex: 1;
  width: 100%;
  min-height: 0; /* 防止内部滚动时高度计算问题 */
  margin: 0;     /* 原来 auto 会居中 */
  max-width: none;
  padding: 0;
}

/* 无障碍 */
@media (prefers-reduced-motion: reduce) {
  .tabs-indicator,
  .tab-btn {
    transition: none !important;
  }
}

.content {
  padding-top: 0; /* 默认不加 */
}
</style>