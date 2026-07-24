<template>
  <div class="page">
    <FrontierBar>
      <div class="top-actions">
        <Wallet />
        <!-- 返回 DarkHorse 按钮 -->
        <!-- <button type="button" class="darkhorse-fab" @click="goToDarkHorse" aria-label="返回 DarkHorse">
          <span class="darkhorse-fab__shine" aria-hidden="true"></span>
          <span class="darkhorse-fab__text">DarkHorse Community</span>
        </button> -->
      </div>
    </FrontierBar>

    <RouterView />
  </div>
</template>

<script setup>
import Wallet from "./components/Wallet.vue";
import FrontierBar from "./components/FrontierBar.vue";
import { RouterView } from "vue-router";

// 新增：返回 DarkHorse 链接（把这里换成你的指定网页）
const DARKHORSE_URL = "http://localhost:3000/";
const DARKHORSE_WINDOW_NAME = "darkhorse-app";

if (typeof window !== "undefined") {
  window.name = "darkhorse-dex";
}
function goToDarkHorse() {
  const darkhorseWindow = window.open(DARKHORSE_URL, DARKHORSE_WINDOW_NAME, "noopener,noreferrer");
  if (darkhorseWindow) darkhorseWindow.focus();
}
</script>

<style scoped>
.page {
	padding: 72px 16px 16px;
  min-height: 100vh;
  background: #070b10;
  color: rgba(255, 255, 255, 0.9);
}

.top-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* Web3 悬浮按钮：玻璃拟态 + 霓虹描边 + 丝滑交互 */
.darkhorse-fab {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);

  background: radial-gradient(120% 180% at 20% 0%, rgba(0, 209, 255, 0.18), transparent 55%),
    radial-gradient(120% 180% at 90% 20%, rgba(138, 92, 255, 0.16), transparent 55%),
    rgba(12, 16, 24, 0.58);

  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.38),
    0 0 0 1px rgba(0, 209, 255, 0.08) inset;
  cursor: pointer;
  user-select: none;

  transition:
    transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1),
    box-shadow 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
  will-change: transform;
}

.darkhorse-fab:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 209, 255, 0.26);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(0, 209, 255, 0.14) inset,
    0 0 24px rgba(0, 209, 255, 0.10);
}

.darkhorse-fab:active {
  transform: translateY(0);
}

.darkhorse-fab:focus-visible {
  outline: none;
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(0, 209, 255, 0.14) inset,
    0 0 0 3px rgba(0, 209, 255, 0.22);
}

.darkhorse-fab__text {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.darkhorse-fab__shine {
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  pointer-events: none;
  background: linear-gradient(110deg, transparent 0%, rgba(0, 209, 255, 0.20) 40%, rgba(138, 92, 255, 0.18) 60%, transparent 100%);
  opacity: 0;
  filter: blur(10px);
  transition: opacity 180ms ease;
}
.darkhorse-fab:hover .darkhorse-fab__shine {
  opacity: 1;
}

@media (max-width: 640px) {
  .darkhorse-fab {
    padding: 9px 11px;
  }
  .darkhorse-fab__text {
    font-size: 12px;
  }
}
</style>
