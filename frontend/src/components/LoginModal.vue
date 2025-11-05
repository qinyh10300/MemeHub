<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <button class="close-button" @click="closeModal">×</button>

        <!-- 登录表单 -->
        <div v-if="isLogin">
          <div class="form-header">
            <h2>用户登录</h2>
            <p>欢迎回来，请登录您的账号</p>
          </div>

          <form @submit.prevent="handleLogin" class="floating-form">
            <div class="input-group">
              <input id="loginUsername" v-model="loginForm.username" type="text" required />
              <label for="loginUsername">用户名</label>
            </div>
            <div class="input-group">
              <input id="loginPassword" v-model="loginForm.password" type="password" required />
              <label for="loginPassword">密码</label>
            </div>
            <button type="submit" class="submit-btn">登录</button>

            <div class="form-footer">
              <span>还没有账号？</span>
              <a href="javascript:;" @click.prevent="switchForm">立即注册</a>
            </div>
          </form>
        </div>

        <!-- 注册表单 -->
        <div v-else>
          <div class="form-header">
            <h2>创建账号</h2>
            <p>开启您的美好旅程</p>
          </div>

          <form @submit.prevent="handleRegister" class="floating-form">
            <div class="input-group">
              <input id="regUsername" v-model="registerForm.username" type="text" required />
              <label for="regUsername">用户名</label>
            </div>

            <div class="input-group">
              <input id="regPassword" v-model="registerForm.password" type="password" required />
              <label for="regPassword">密码</label>
            </div>
            <button type="submit" class="submit-btn">立即注册</button>

            <div class="form-footer">
              <span>已有账号？</span>
              <a href="javascript:;" @click.prevent="switchForm">立即登录</a>
            </div>
          </form>
        </div>
        
        <div
          v-if="registerForm.username && !isUsernameValid"
          class="error-message"
          :class="{ shake: isShaking }"
        >
          用户名必须为7到18个字符，包含大小写字母、数字，不能包含其他符号！
        </div>
        <div
          v-else-if="registerForm.password && !isPasswordValid"
          class="error-message"
          :class="{ shake: isShaking }"
        >
          密码必须为8到15个字符，包含大小写字母、数字和有效（-_*^#）符号！
        </div>

        <div class="error-message1" v-else-if="errorMsg">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { computed } from 'vue';
import { watch } from 'vue'

// 实时验证用户名
const isUsernameValid = computed(() => usernameRegex.test(registerForm.username));
// 实时验证密码
const isPasswordValid = computed(() => passwordRegex.test(registerForm.password));

const server_ip = 'http://localhost:3000' // 后端服务器地址

const emit = defineEmits(['close'])

const isLogin = ref(true) // true=登录, false=注册

const isShaking = ref(false); // 控制震动动画的状态

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})
const errorMsg = ref('')

const isFormValid = ref(false)

// 注册表单
const registerForm = reactive({
  username: '',
  password: ''
})

// 🔍监听输入变化清空错误信息
watch(
  () => [registerForm.username, registerForm.password],
  () => {
    errorMsg.value = ''
  }
)

// 🔍监听输入变化清空错误信息
watch(
  () => [loginForm.username, loginForm.password],
  () => {
    errorMsg.value = ''
  }
)

// 验证登录表单
const validateInput = () => {
  isFormValid.value = loginForm.username && loginForm.password
  if (isFormValid.value) errorMsg.value = ''
}

// 登录提交
const handleLogin = async () => {
  alert('登录成功！');
  emit('login-success'); // ✅ 通知父组件登录成功
  closeModal();
  return;
  try {
    console.log('登录', loginForm)
    // 登录逻辑，比如发送请求
    const response = await fetch(`${server_ip}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginForm)
    });
    const data = await response.json();
    if (response.ok) {
      alert('登录成功！');
      emit('login-success'); // ✅ 通知父组件登录成功
      closeModal();
    } else {
      // errorMsg.value = data.message || '用户名或密码错误';
      errorMsg.value = '用户名或密码错误';
    }
  } catch (error) {
    console.error('登录时发生错误:', error);
    alert('服务器连接失败，请稍后再试！');
  }
}

const usernameRegex = /^[a-zA-Z0-9]{7,18}$/; // 用户名正则
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-_*^#])[A-Za-z\d-_*^#]{8,15}$/; // 密码正则

// 注册提交
const handleRegister = async () => {
  // 2.3 秒后清空错误信息
  errorMsg.value = '用户名已被占用';
  return;
  // 验证用户名和密码
  if (!isUsernameValid.value || !isPasswordValid.value) {
    triggerShake();
    return;
  }
  try {
    const response = await fetch(`${server_ip}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerForm),
    });

    const data = await response.json();

    if (response.ok) {
      alert('注册成功！');
      switchForm(); // 切换回登录表单
    } else {
      // alert(data.message || '注册失败，请重试！');
      // errorMsg.value = data.message || '用户名已被占用';
      errorMsg.value = '用户名已被占用';
    }
  } catch (error) {
    console.error('注册时发生错误:', error);
    alert('服务器连接失败，请稍后再试！');
  }
};

// 触发震动动画
const triggerShake = () => {
  isShaking.value = true; // 开启震动动画
  setTimeout(() => {
    isShaking.value = false; // 0.3 秒后关闭震动动画
  }, 300);
};

// 切换登录/注册表单
const switchForm = () => {
  isLogin.value = !isLogin.value
  // 清空表单数据
  loginForm.username = '';
  loginForm.password = '';
  registerForm.username = '';
  registerForm.password = '';
}

// 关闭弹窗
const closeModal = () => emit('close')

onMounted(validateInput)
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