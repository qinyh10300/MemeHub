<template>
  <div class="chat-view-container">
    <!-- 左侧：聊天窗口 -->
    <div class="left-panel">
      <ChatWindow @loaded="onLoaded" />
    </div>

    <!-- 右侧：C2C 区域 -->
    <div class="right-panel">
      <C2C />
    </div>
  </div>
</template>

<script setup>
import ChatWindow from "@/components/chat/ChatWindow.vue";
import C2C from "@/components/chat/C2C.vue"; // 你自己创建的组件

function onLoaded() {
  console.log("聊天组件加载完成");
}
</script>

<style scoped>
.chat-view-container {
  display: flex;
  width: 100%;
  height: 100vh; /* 占满屏幕 */
  background: #000;
}

/* 左边聊天组件占 50% */
.left-panel {
  flex: 2;
  border-right: 1px solid #222;
  display: flex;
}

/* 右边 C2C 占 50% */
.right-panel {
  flex: 1;
  display: flex;
  background: #111;
}
</style>