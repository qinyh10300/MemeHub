<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <!-- Close button -->
        <button class="close-button" @click="$emit('close')">×</button>

        <div class="form-header">
          <h2>Edit Profile</h2>
          <p>Modify your nickname and bio</p>
        </div>

        <!-- Edit form -->
        <form @submit.prevent="handleSave" class="floating-form">
          <!-- Nickname -->
          <div class="input-group">
            <input
              id="editNickname"
              type="text"
              v-model="form.nickname"
              required
            />
            <label for="editNickname" :class="{ 'label-up': form.nickname }">Nickname</label>
          </div>

          <!-- Bio -->
          <div class="input-group textarea-group">
            <textarea
              id="editBio"
              v-model="form.bio"
              rows="4"
            ></textarea>
            <label for="editBio" :class="{ 'label-up': form.bio }">Bio (optional, max 200 characters)</label>
          </div>

          <!-- Email -->
          <div class="input-group">
            <input
              id="editEmail"
              type="email"
              v-model="form.email"
              placeholder="Email (for notifications, optional)"
            />
            <label for="editEmail" :class="{ 'label-up': form.email }">Email (optional, for notifications)</label>
          </div>

          <button type="submit" class="submit-btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </form>

        <!-- Error message -->
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

// Receive initial values from parent component
const props = defineProps({
  nickname: String,
  bio: String,
  email: String,
});

const emit = defineEmits(['close', 'save']);

const authStore = useAuthStore();
const server_ip = authStore.server_ip // Backend server address
const user_token = authStore.user_token // user token

const errorMsg = ref('');
const saving = ref(false);

// Form data (use reactive for modification)
const form = reactive({
  nickname: props.nickname || '',
  bio: props.bio || '',
  email: props.email || '',
});

// Watch props changes, update form data
watch(() => [props.nickname, props.bio, props.email], ([newNickname, newBio, newEmail]) => {
  form.nickname = newNickname || '';
  form.bio = newBio || '';
  form.email = newEmail || '';
}, { immediate: true });

// Validation regex
const nicknameRegex = /^[\u4e00-\u9fa5\w]{3,10}$/; // Chinese, English, numbers, underscore, 3-10 characters
const bioRegex = /^[\s\S]{0,200}$/; // Allow all characters (including newlines, spaces, punctuation), 0-200 characters
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Clear error message in real-time
watch(() => [form.nickname, form.bio, form.email], () => {
  errorMsg.value = '';
});

// Save
const handleSave = async () => {
  // Validate nickname
  if (!nicknameRegex.test(form.nickname)) {
    errorMsg.value = 'Nickname must be 3-10 characters, only Chinese, English, numbers or underscores allowed';
    return;
  }

  // Validate bio
  if (!bioRegex.test(form.bio)) {
    errorMsg.value = 'Bio cannot exceed 200 characters';
    return;
  }

  // Validate email (optional)
  if (form.email && !emailRegex.test(form.email)) {
    errorMsg.value = 'Invalid email format';
    return;
  }

  // Check if only whitespace characters (if user only enters spaces or newlines)
  if (form.bio && form.bio.trim().length === 0) {
    errorMsg.value = 'Bio cannot contain only spaces';
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
      // Save successful, pass updated data to parent component
      emit('save', {
        nickname: result.nickname || form.nickname,
        bio: result.bio || form.bio,
        email: result.email ?? form.email,
      });
      // Close modal
      emit('close');
    } else {
      // Save failed, display error message
      errorMsg.value = result.message || 'Save failed, please try again later';
    }
  } catch (err) {
    console.error('Error saving user info:', err);
    errorMsg.value = 'Network error, please try again later';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
/* Background overlay */
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

/* Modal container */
.modal-container {
  animation: fadeIn 0.35s ease;
  transform: scale(1);
  position: relative;
}

.login-container {
  width: 500px;
  background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%);
  /* Deep black gradient */
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