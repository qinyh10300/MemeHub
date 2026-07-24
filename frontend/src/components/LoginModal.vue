<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <button class="close-button" @click="closeModal">×</button>

        <!-- Login Form -->
        <div v-if="isLogin">
          <div class="form-header">
            <h2>User Login</h2>
            <p>Welcome back, please login to your account</p>
          </div>

          <form @submit.prevent="handleLogin" class="floating-form">
            <div class="input-group">
              <input id="loginUsername" v-model="loginForm.username" type="text" required />
              <label for="loginUsername">Username</label>
            </div>
            <div class="input-group">
              <input id="loginPassword" v-model="loginForm.password" type="password" required />
              <label for="loginPassword">Password</label>
            </div>
            <button type="submit" class="submit-btn">Login</button>

            <div class="form-footer">
              <span>Don't have an account?</span>
              <a href="javascript:;" @click.prevent="switchForm">Register Now</a>
            </div>
          </form>
        </div>

        <!-- Register Form -->
        <div v-else>
          <div class="form-header">
            <h2 v-if="!isAuditor">Create Regular User Account</h2>
            <h2 v-else>Create Reviewer Account</h2>
            <p>Start your wonderful journey</p>
          </div>

          <form @submit.prevent="handleRegister" class="floating-form">
            <div class="input-group">
              <input id="regUsername" v-model="registerForm.username" type="text" required />
              <label for="regUsername">Username</label>
            </div>

            <div class="input-group">
              <input id="regPassword" v-model="registerForm.password" type="password" required />
              <label for="regPassword">Password</label>
            </div>

            <!-- Invitation code input, only shown for reviewer registration -->
            <div class="input-group" v-if="isAuditor">
              <input id="invitationCode" v-model="registerForm.invitationCode" type="text" required />
              <label for="invitationCode">Invitation Code</label>
            </div>

            <button type="submit" class="submit-btn">
              {{ isAuditor ? 'Register as Reviewer' : 'Register Now' }}
            </button>

            <div class="form-footer">
              <span>Already have an account?</span>
              <a href="javascript:;" @click.prevent="switchForm">Login Now</a>
            </div>

            <!-- Reviewer registration prompt -->
            <div class="auditor-register" v-if="!isAuditor">
              <span>Click here to register as reviewer, invitation code required:</span>
              <a href="javascript:;" @click.prevent="registerAsAuditor">Register as Reviewer</a>
            </div>

            <!-- Regular user registration prompt -->
            <div class="auditor-register" v-if="isAuditor">
              <span>Click here to register as regular user:</span>
              <a href="javascript:;" @click.prevent="registerAsNormer">Register as Regular User</a>
            </div>
          </form>
        </div>

        <!-- Error messages -->
        <div
          v-if="registerForm.username && !isUsernameValid"
          class="error-message"
          :class="{ shake: isShaking }"
        >
          Username must be 7-18 characters, containing uppercase and lowercase letters and numbers, no other symbols!
        </div>
        <div
          v-else-if="registerForm.password && !isPasswordValid"
          class="error-message"
          :class="{ shake: isShaking }"
        >
          Password must be 8-15 characters, containing uppercase and lowercase letters, numbers and valid (-_*^#) symbols!
        </div>

        <div class="error-message1" v-else-if="errorMsg">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const isAuditor = ref(false) // Whether registering as reviewer

// Real-time username validation
const isUsernameValid = computed(() => usernameRegex.test(registerForm.username));
// Real-time password validation
const isPasswordValid = computed(() => passwordRegex.test(registerForm.password));

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // Backend server address

const emit = defineEmits(['close'])

const isLogin = ref(true) // true=login, false=register

const isShaking = ref(false); // Control shake animation state

// Login form
const loginForm = reactive({
  username: '',
  password: ''
})
const errorMsg = ref('')

const isFormValid = ref(false)

// Register form
const registerForm = reactive({
  username: '',
  password: ''
})

// 🔍Watch input changes to clear error messages
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

// Validate login form
const validateInput = () => {
  isFormValid.value = loginForm.username && loginForm.password
  if (isFormValid.value) errorMsg.value = ''
}

// Default avatar URL
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// User data (including all information)
const userData = ref({
  avatar: defaultAvatar, // 默认头像
  nickname: '',
  username: '',
})

// Fetch user data from backend
const fetchUserData = async (user_token) => {
  try {
    const currentUsername = user_token
    const url = `${server_ip}/api/user/${currentUsername}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.username || authStore.token || '', // Pass username as token (backend currently uses username as token)
      },
    })

    const result = await response.json()
    if (response.ok && result.code === 0) {
      const data = result.data
      console.log("data: ", data)
      userData.value = {
        avatar: data.avatar || defaultAvatar, // If no avatar, use default avatar
        nickname: data.nickname,
        username: data.username,
      }
    } else {
      console.error('Failed to fetch user info:', result)
    }
  } catch (err) {
    console.error('Error occurred while fetching user info:', err)
  }
}

// Login submission
const handleLogin = async () => {
  // alert('Login successful!');
  // emit('login-success'); // ✅ Notify parent component of successful login
  // closeModal();
  // return;
  try {
    console.log('Login', loginForm)
    // Login logic, such as sending request
    const response = await fetch(`${server_ip}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginForm)
    });
    const data = await response.json();
    // if (response.ok) {
    if (response.status == 201) {
      alert('Login successful!');
      authStore.setToken(data.token); // Set global token
      authStore.setUserRole(data.user.role); // Save user role
      authStore.setUsername(loginForm.username); // Save username
      authStore.setUserToken(loginForm.username); // Save user token, currently username
      await fetchUserData(loginForm.username);
      authStore.setNickname(userData.value.nickname); // Save nickname
      authStore.setAvatar(userData.value.avatar); // Save avatar

      // Save token and login time to localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_username', loginForm.username);
      localStorage.setItem('auth_role', data.user.role);
      localStorage.setItem('login_time', Date.now()); // Save current timestamp

      // console.log("data.user.role: ", data.user.role)
      console.log("data: ", data)

      emit('login-success', loginForm.username); // ✅ Notify parent component of successful login, pass username
      closeModal();
      console.log('Login info:', data);

      // // Auto-redirect to current user's profile page after login
      // router.push(`/profile/${loginForm.username}`);
    } else if (response.status == 500){
      errorMsg.value = 'Server error';
    } else {
      // errorMsg.value = data.message || 'Incorrect username or password';
      errorMsg.value = 'Incorrect username or password';
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
    alert('Server connection failed, please try again later!');
  }
}

const usernameRegex = /^[a-zA-Z0-9]{7,18}$/; // Username regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-_*^#])[A-Za-z\d-_*^#]{8,15}$/; // Password regex

const registerAsNormer = async () => {
  isAuditor.value = false
  errorMsg.value = '';
}

const registerAsAuditor = async () => {
  isAuditor.value = true
  // Validate username and password
  if (!isUsernameValid.value || !isPasswordValid.value) {
    triggerShake();
    return;
  }

  // Invitation code cannot be empty for reviewer registration
  if (!registerForm.invitationCode) {
    errorMsg.value = 'Please enter invitation code';
    triggerShake();
    return;
  }

  try {
    // Call reviewer registration API
    const url = `${server_ip}/api/reviewer/register`;

    const bodyData = {
      username: registerForm.username,
      password: registerForm.password,
      reviewerCode: registerForm.invitationCode,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (response.status === 201) {
      alert('Reviewer registration successful!');
      switchForm(); // Switch back to login form
    } else if (response.status === 400) {
      errorMsg.value = 'Username or password missing';
    } else if (response.status === 403) {
      errorMsg.value = 'Invalid invitation code';
    } else {
      errorMsg.value = 'Server error';
    }
  } catch (error) {
    console.error('Error occurred during registration:', error);
    alert('Server connection failed, please try again later!');
  }
}

// Register submission
const handleRegister = async () => {
  // Validate username and password
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

    // if (response.ok) {
    if (response.status == 201) {
      alert('Registration successful!');
      switchForm(); // Switch back to login form
    } else if (response.status == 400){
      errorMsg.value = 'Username already registered';
    } else {
      // errorMsg.value = data.message || 'Incorrect username or password';
      errorMsg.value = 'Server error';
    }
  } catch (error) {
    console.error('Error occurred during registration:', error);
    alert('Server connection failed, please try again later!');
  }
};

// Trigger shake animation
const triggerShake = () => {
  isShaking.value = true; // Enable shake animation
  setTimeout(() => {
    isShaking.value = false; // Disable shake animation after 0.3 seconds
  }, 300);
};

// Switch between login/register forms
const switchForm = () => {
  isLogin.value = !isLogin.value
  isAuditor.value = false
  loginForm.username = ''
  loginForm.password = ''
  registerForm.username = ''
  registerForm.password = ''
  registerForm.invitationCode = ''
}

// Close modal
const closeModal = () => emit('close')

onMounted(validateInput)
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
  /* Green border */
  color: #00ff00;
  /* Default green font */
  font-family: 'Arial', sans-serif;
  /* Can change to your preferred font */
  border: 1px solid rgba(255, 255, 255, 0.5);
  /* White semi-transparent border */
}

/* ✨ Top-right close button */
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

/* Title */
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

/* Form input */
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

/* Submit button */
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

/* Arrow icon */
.arrow-icon {
  border: solid white;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(-45deg);
}

/* Footer links */
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

/* Error message */
.error-message {
  position: absolute; /* Absolute positioning, removed from document flow */
  bottom: 10px; /* Error message fixed at container bottom */
  left: 50%; /* Horizontal center */
  transform: translateX(-50%); /* Correct horizontal center offset */
  color: #f56c6c; /* Error message color */
  font-size: 14px; /* Font size */
  text-align: center; /* Center alignment */
  white-space: nowrap; /* Prevent text wrapping */
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
  animation: shake 0.3s ease-in-out; /* Shake animation lasts 0.3 seconds */
}

.error-message.shake {
  animation: shake 0.3s ease-in-out; /* Shake animation lasts 0.3 seconds */
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

/* Animation */
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

.auditor-register {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  color: #95a5a6;
}

.auditor-register a {
  color: #5a9d76;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 600;
}

.auditor-register a:hover {
  text-decoration: underline;
}
</style>