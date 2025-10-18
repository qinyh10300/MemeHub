<template>
<div class="modal-overlay" @click.self="closeModal">
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
        <input id="loginUsername" v-model.trim="loginForm.username" type="text" required />
        <label for="loginUsername">用户名</label>
      </div>
      <div class="input-group">
        <input id="loginPassword" v-model.trim="loginForm.password" type="password" required />
        <label for="loginPassword">密码</label>
      </div>
      <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
      <button type="submit" class="submit-btn" :disabled="!isFormValid">登录</button>

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
        <input id="regPassword" v-model="registerForm.password" type="password" required minlength="6" />
        <label for="regPassword">密码</label>
      </div>
      <button type="submit" class="submit-btn">立即注册</button>

      <div class="form-footer">
        <span>已有账号？</span>
        <a href="javascript:;" @click.prevent="switchForm">立即登录</a>
      </div>
    </form>
  </div>
</div>
    </div>
</div>
</template>
  
<!-- <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  
  const emit = defineEmits(['close'])
  const router = useRouter()
  
  const loginForm = reactive({
    username: '',
    password: ''
  })
  const errorMsg = ref('')
  const isFormValid = ref(false)
  
  const validateInput = () => {
    if (loginForm.username && loginForm.password) {
      isFormValid.value = true
      errorMsg.value = ''
    } else {
      isFormValid.value = false
    }
  }
  
  const handleLogin = async () => {
    const xssPattern = /(~|\{|\}|"|'|<|>|\?)/
    if (xssPattern.test(loginForm.username) || xssPattern.test(loginForm.password)) {
      return errorMessage('警告: 输入内容包含非法字符')
    }
  
    try {
      const safeUsername = encodeURIComponent(loginForm.username)
      const safePassword = encodeURIComponent(loginForm.password)
      console.log('登录请求:', { username: safeUsername, password: safePassword })
  
      const expires = new Date(Date.now() + 3600 * 1000).toUTCString()
      document.cookie = `authToken=yourAuthToken; path=/; expires=${expires}`
  
      router.push('/home')
    } catch (error) {
      errorMessage('登录失败，请稍后重试')
    }
  }
  
  const errorMessage = (text) => {
    errorMsg.value = text
    setTimeout(() => (errorMsg.value = ''), 3000)
  }
  
  const closeModal = () => emit('close')
  
  onMounted(validateInput)
</script> -->

<script setup>
    import { ref, reactive, onMounted } from 'vue'

    const emit = defineEmits(['close'])

    const isLogin = ref(true) // true=登录, false=注册

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

    // 验证登录表单
    const validateInput = () => {
    isFormValid.value = loginForm.username && loginForm.password
    if (isFormValid.value) errorMsg.value = ''
    }

    // 登录提交
    const handleLogin = () => {
    console.log('登录', loginForm)
    // 登录逻辑，比如发送请求
    }

    // 注册提交
    const handleRegister = () => {
    console.log('注册', registerForm)
    // 注册逻辑，比如发送请求
    }

    // 切换登录/注册表单
    const switchForm = () => {
    isLogin.value = !isLogin.value
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
    width: 420px;
    background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%); /* 深黑渐变 */
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(0, 255, 0, 0.4); /* 绿色边框 */
    color: #00ff00; /* 默认字体绿色 */
    font-family: 'Arial', sans-serif; /* 可换成你喜欢的字体 */
    border: 1px solid rgba(255, 255, 255, 0.5); /* 白色半透明边框 */
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
  .input-group input:focus + label,
  .input-group input:valid + label {
    top: 0;
    font-size: 14px;
    color: #aceab5;
  }
  
  /* 提交按钮 */
  .submit-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(to right, #3498db, #2980b9);
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
    color: #3498db;
    text-decoration: none;
    margin-left: 5px;
    font-weight: 600;
  }
  .form-footer a:hover {
    text-decoration: underline;
  }
  
  /* 错误提示 */
  .error-message {
    color: #f56c6c;
    font-size: 14px;
    text-align: center;
    margin-bottom: 20px;
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