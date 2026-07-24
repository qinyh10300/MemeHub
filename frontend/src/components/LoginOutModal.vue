<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="login-container">
        <button class="close-button" @click="closeModal">×</button>

        <!-- Login Form -->
        <div class="form-header">
          <h2>Logout</h2>
          <p>Are you sure you want to logout from your current account?</p>
        </div>

        <button class="submit-btn" @click="logout">Confirm</button>
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

// Close modal
const closeModal = () => emit('close');

// Manual logout
const logout = () => {
  authStore.clearAuth(); // Clear login state in Pinia
  localStorage.removeItem('auth_token'); // Clear token from local storage
  localStorage.removeItem('auth_username');
  localStorage.removeItem('login_time');
  alert('Logged out successfully');
  emit('close');
  router.push('/'); // Redirect to homepage or login page
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
  width: 400px;
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
</style>