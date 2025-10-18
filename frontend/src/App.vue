<script setup>
import { ref } from 'vue'
import LoginModal from './components/LoginModal.vue'

const showLogin = ref(false)
</script>

<template>
  <button @click="showLogin = true" class="fixed-button">登录</button>
  <LoginModal v-if="showLogin" @close="showLogin = false" />
</template>

<style scoped>
.fixed-button {    /* 一个固定在页面右上角的按钮 */
  position: fixed;    /* 固定定位 */
  top: 20px;      /* 离浏览器窗口顶部 20 像素 */
  right: 20px;     /* 离浏览器窗口右边 20 像素 */
  background-color: #42b983; /* Vue 绿色 */
  color: black;    /* 按钮文字颜色是黑色 */
  border: none;    /* 去掉默认的按钮边框 */
  border-radius: 6px;    /* 让按钮的边角变得 圆润，半径是 6px */
  padding: 0.6rem 1rem;    /* 按钮内部的内边距：上下 0.6rem（约 10px），左右 1rem（约 16px）。使得按钮内容不贴边，看起来更舒展。 */
  font-size: 1.0rem;    /* 设置文字大小，大约相当于 14–15px */
  cursor: pointer;    /* 鼠标悬停在按钮上时，显示手型光标 */
  z-index: 1000;    /* 让按钮浮在最上层，避免被其他元素遮挡 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);    /* 给按钮添加一个柔和的阴影，提升立体感；阴影向下偏移 2px，模糊程度 5px，颜色是半透明黑 */
}

.fixed-button:hover {    /* 当鼠标悬停在按钮上时的样式 */
  background-color: #2c9c6a;    /* 悬停时背景变为更深的绿色，让用户有交互反馈 */
}
</style>