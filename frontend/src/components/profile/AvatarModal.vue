<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="avatar-selector-container">
        <button class="close-button" @click="closeModal">×</button>

        <div class="form-header">
          <h2>选择头像</h2>
          <p>从以下头像中选择一个</p>
        </div>

        <div class="avatar-grid">
          <div
            v-for="(avatar, index) in defaultAvatars"
            :key="index"
            :class="['avatar-item', { 'selected': selectedAvatar === avatar }]"
            @click="selectAvatar(avatar)"
          >
            <img :src="avatar" alt="avatar" class="avatar-preview" />
            <div v-if="selectedAvatar === avatar" class="checkmark">✓</div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="handleConfirm" :disabled="!selectedAvatar">
            确认
          </button>
        </div>

        <div class="error-message" v-if="errorMsg">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  currentAvatar: String, // 当前头像URL
})

const emit = defineEmits(['close', 'save'])

const authStore = useAuthStore()
const server_ip = 'http://localhost:3000'

const errorMsg = ref('')
const saving = ref(false)
const selectedAvatar = ref(props.currentAvatar || '')

// 默认头像列表（使用pravatar.cc提供的头像）
const defaultAvatars = ref([
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=10',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=16',
  'https://i.pravatar.cc/150?img=17',
  'https://i.pravatar.cc/150?img=18',
  'https://i.pravatar.cc/150?img=19',
  'https://i.pravatar.cc/150?img=20',
])

onMounted(() => {
  // 如果当前有头像，设置为选中状态
  if (props.currentAvatar) {
    selectedAvatar.value = props.currentAvatar
  }
})

const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
  errorMsg.value = ''
}

const closeModal = () => {
  emit('close')
}

const handleConfirm = async () => {
  if (!selectedAvatar.value) {
    errorMsg.value = '请选择一个头像'
    return
  }

  try {
    saving.value = true
    errorMsg.value = ''

    const response = await fetch(`${server_ip}/api/update-nickname`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'token': authStore.token || authStore.username || '',
      },
      body: JSON.stringify({
        avatar: selectedAvatar.value,
      }),
    })

    const result = await response.json()

    if (response.ok && result.code === 0) {
      emit('save', {
        avatar: result.avatar || selectedAvatar.value,
      })
      emit('close')
    } else {
      errorMsg.value = result.message || '保存失败，请稍后重试'
    }
  } catch (err) {
    console.error('保存头像时发生错误:', err)
    errorMsg.value = '网络错误，请稍后重试'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
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

.modal-container {
  animation: fadeIn 0.35s ease;
  transform: scale(1);
  position: relative;
}

.avatar-selector-container {
  width: 600px;
  max-height: 80vh;
  background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #00ff00;
  font-family: 'Arial', sans-serif;
  overflow-y: auto;
}

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

.form-header {
  text-align: center;
  margin-bottom: 30px;
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

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 30px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.avatar-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.avatar-item:hover {
  border-color: #34db71;
  transform: scale(1.05);
}

.avatar-item.selected {
  border-color: #67bb6e;
  box-shadow: 0 0 15px rgba(103, 187, 110, 0.5);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkmark {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background: #67bb6e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #95a5a6;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.confirm-btn {
  background: linear-gradient(to right, #378f60, #1b784c);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
}

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

