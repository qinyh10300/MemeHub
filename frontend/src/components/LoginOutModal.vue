<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <button class="close-button" @click="closeModal">×</button>

        <!-- 登录表单 -->
        <div class="form-header">
          <h2>退出登录</h2>
          <p>您确认要退出当前的登录账号吗？</p>
        </div>
        
        <button class="submit-btn" @click="logout">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const emit = defineEmits(['close']);

// 关闭弹窗
const closeModal = () => emit('close');

// 手动退出登录
const logout = () => {
  authStore.clearAuth(); // 清除 Pinia 中的登录状态
  localStorage.removeItem('auth_token'); // 清除本地存储的 token
  localStorage.removeItem('auth_username');
  localStorage.removeItem('login_time');
  alert('已退出登录');
  emit('close');
  router.push('/'); // 跳转到首页或登录页
};
</script>

<style scoped>
/* 背景遮罩 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* 模态框容器 */
.modal-container {
  animation: fadeIn 0.35s ease;
  transform: scale(1);
  position: relative;
}

.login-container {
  width: 400px;
  background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%);
  /* 深黑渐变 */
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 255, 0, 0.4);
  /* 绿色边框 */
  color: #00ff00;
  /* 默认字体绿色 */
  font-family: 'Arial', sans-serif;
  /* 可换成你喜欢的字体 */
  border: 1px solid rgba(255, 255, 255, 0.5);
  /* 白色半透明边框 */
}

/* ✨ 右上角关闭按钮 */
.close-button {
  position: absolute;
  top: 16px;
  right: 18px;
  background: transparent;
  border: none;
  color: #7f8c8d;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 500;
}

.close-button:hover {
  color: #3498db;
  transform: rotate(90deg);
}

/* 标题 */
.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  color: #f3f4f5;
  font-size: 32px;
  margin-bottom: 10px;
  font-weight: 700;
}

.form-header p {
  color: #eaf0f0;
  font-size: 16px;
}

/* 表单输入 */
.floating-form .input-group {
  position: relative;
  margin-bottom: 30px;
}

.input-group input {
  color: white;
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: transparent;
}

.input-group label {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  padding: 0 5px;
  color: #95a5a6;
  font-size: 16px;
  transition: all 0.3s ease;
  pointer-events: none;
}

.input-group input:focus,
.input-group input:valid {
  border-color: #34db71;
}

.input-group input:focus+label,
.input-group input:valid+label {
  top: -20%;
  left: 1px;
  font-size: 14px;
  color: #aceab5;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(to right, #378f60, #1b784c);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

/* 箭头图标 */
.arrow-icon {
  border: solid white;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(-45deg);
}

/* 底部链接 */
.form-footer {
  text-align: center;
  margin-top: 20px;
  color: #95a5a6;
}

.form-footer a {
  color: #5a9d76;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 600;
}

.form-footer a:hover {
  text-decoration: underline;
}

/* 错误提示 */
.error-message {
  position: absolute; /* 绝对定位，脱离文档流 */
  bottom: 10px; /* 错误提示固定在容器底部 */
  left: 50%; /* 水平居中 */
  transform: translateX(-50%); /* 修正水平居中偏移 */
  color: #f56c6c; /* 错误提示颜色 */
  font-size: 14px; /* 字体大小 */
  text-align: center; /* 居中对齐 */
  white-space: nowrap; /* 防止文字换行 */
}

.error-message1 {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #ae0707;
  font-size: 17px;
  text-align: center;
  white-space: nowrap;
  animation: shake 0.3s ease-in-out; /* 震动动画持续 0.3 秒 */
}

.error-message.shake {
  animation: shake 0.3s ease-in-out; /* 震动动画持续 0.3 秒 */
}

@keyframes shake {
  0%, 100% {
    transform: translateX(-50%);
  }
  25% {
    transform: translateX(-55%);
  }
  50% {
    transform: translateX(-45%);
  }
  75% {
    transform: translateX(-50%);
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>