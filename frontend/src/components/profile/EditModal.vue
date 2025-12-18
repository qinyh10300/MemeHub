<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <!-- 关闭按钮 -->
        <button class="close-button" @click="$emit('close')">×</button>

        <div class="form-header">
          <h2>编辑资料</h2>
          <p>修改您的昵称和个人简介</p>
        </div>

        <!-- 编辑表单 -->
        <form @submit.prevent="handleSave" class="floating-form">
          <!-- 昵称 -->
          <div class="input-group">
            <input
              id="editNickname"
              type="text"
              v-model="form.nickname"
              required
            />
            <label for="editNickname" :class="{ 'label-up': form.nickname }">昵称</label>
          </div>

          <!-- 个人简介 -->
          <div class="input-group textarea-group">
            <textarea
              id="editBio"
              v-model="form.bio"
              rows="4"
            ></textarea>
            <label for="editBio" :class="{ 'label-up': form.bio }">个人简介（可选，最多200字）</label>
          </div>

          <!-- 邮箱 -->
          <div class="input-group">
            <input
              id="editEmail"
              type="email"
              v-model="form.email"
              placeholder="邮箱（用于邮件通知，可选）"
            />
            <label for="editEmail" :class="{ 'label-up': form.email }">邮箱（可选，用于邮件通知）</label>
          </div>

          <button type="submit" class="submit-btn" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </form>

        <!-- 错误提示 -->
        <div class="error-message1" v-if="errorMsg">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

// 接收父组件传递的初始值
const props = defineProps({
  nickname: String,
  bio: String,
  email: String,
});

const emit = defineEmits(['close', 'save']);

const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

const errorMsg = ref('');
const saving = ref(false);

// 表单数据（使用reactive以便修改）
const form = reactive({
  nickname: props.nickname || '',
  bio: props.bio || '',
  email: props.email || '',
});

// 监听props变化，更新表单数据
watch(() => [props.nickname, props.bio, props.email], ([newNickname, newBio, newEmail]) => {
  form.nickname = newNickname || '';
  form.bio = newBio || '';
  form.email = newEmail || '';
}, { immediate: true });

// 验证正则
const nicknameRegex = /^[\u4e00-\u9fa5\w]{3,10}$/; // 汉字、英文、数字、下划线，3-10个字符
const bioRegex = /^[\s\S]{0,200}$/; // 允许所有字符（包括换行、空格、标点等），0-200个字符
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 实时清空错误提示
watch(() => [form.nickname, form.bio, form.email], () => {
  errorMsg.value = '';
});

// 保存
const handleSave = async () => {
  // 验证昵称
  if (!nicknameRegex.test(form.nickname)) {
    errorMsg.value = '昵称必须为3-10个字符，只能包含汉字、英文、数字或下划线';
    return;
  }

  // 验证个人简介
  if (!bioRegex.test(form.bio)) {
    errorMsg.value = '个人简介不能超过200个字符';
    return;
  }
  
  // 验证邮箱（可选）
  if (form.email && !emailRegex.test(form.email)) {
    errorMsg.value = '邮箱格式不正确';
    return;
  }
  
  // 检查是否只包含空白字符（如果用户只输入空格或换行）
  if (form.bio && form.bio.trim().length === 0) {
    errorMsg.value = '个人简介不能只包含空格';
    return;
  }

  try {
    saving.value = true;
    errorMsg.value = '';

    // 调用后端 API 更新用户信息
    const response = await fetch(`${server_ip}/api/update-nickname`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.token || authStore.username || '',
      },
      body: JSON.stringify({
        nickname: form.nickname,
        bio: form.bio,
        email: form.email,
      }),
    });

    const result = await response.json();

    if (response.ok && result.code === 0) {
      // 保存成功，将更新后的数据传递给父组件
      emit('save', {
        nickname: result.nickname || form.nickname,
        bio: result.bio || form.bio,
        email: result.email ?? form.email,
      });
      // 关闭弹窗
      emit('close');
    } else {
      // 保存失败，显示错误信息
      errorMsg.value = result.message || '保存失败，请稍后重试';
    }
  } catch (err) {
    console.error('保存用户信息时发生错误:', err);
    errorMsg.value = '网络错误，请稍后重试';
  } finally {
    saving.value = false;
  }
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
  width: 500px;
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

.input-group input,
.input-group textarea {
  color: white;
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: transparent;
  font-family: inherit;
}

.input-group textarea {
  resize: vertical;
  min-height: 100px;
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

/* textarea 的 label 在顶部 */
.textarea-group label {
  top: 20px;
  transform: translateY(0);
}

.input-group input:focus,
.input-group input:valid,
.input-group textarea:focus,
.input-group textarea:valid {
  border-color: #34db71;
}

.input-group input:focus+label,
.input-group input:valid+label,
.input-group .label-up {
  top: -20%;
  left: 1px;
  font-size: 14px;
  color: #aceab5;
}

.textarea-group textarea:focus+label,
.textarea-group textarea:valid+label,
.textarea-group .label-up {
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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