<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="avatar-selector-container">
        <button class="close-button" @click="closeModal">×</button>

        <div class="form-header">
          <h2>Select Avatar</h2>
          <p>Choose from the following avatars or upload a local image</p>
        </div>

        <!-- Local upload avatar -->
        <div class="upload-section">
          <label class="upload-label">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              style="display: none"
            />
            <div class="upload-button">
              <span class="upload-icon">📷</span>
              <span>Upload local image</span>
            </div>
          </label>
          <div v-if="uploadedImagePreview" class="uploaded-preview">
            <img :src="uploadedImagePreview" alt="Upload preview" class="preview-image" />
            <div class="preview-overlay">
              <span class="preview-text">Selected</span>
            </div>
          </div>
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
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="confirm-btn" @click="handleConfirm" :disabled="!selectedAvatar && !uploadedFile">
            {{ saving ? 'Saving...' : 'Confirm' }}
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
  currentAvatar: String, // Current avatar URL
})

const emit = defineEmits(['close', 'save'])

const authStore = useAuthStore();
const server_ip = authStore.server_ip // Backend server address
const user_token = authStore.user_token // user token

const errorMsg = ref('')
const saving = ref(false)
const selectedAvatar = ref(props.currentAvatar || '')
const uploadedFile = ref(null)
const uploadedImagePreview = ref(null)
const fileInput = ref(null)
const isUploadedFile = ref(false)

// Default avatar list (changed to project-relative paths for local packaging)
const localAvatarFiles = [
  'avatar1.svg',
  'avatar2.svg',
  'avatar3.svg',
  'avatar4.svg',
  'avatar5.svg',
  'avatar6.svg',
  'avatar7.svg',
  'avatar8.svg',
  'avatar9.svg',
  'avatar10.svg'
]

const defaultAvatars = ref(
  localAvatarFiles.map(name =>
    new URL(`../../assets/avatars/${name}`, import.meta.url).href
  )
)

onMounted(() => {
  // 如果当前有头像，设置为选中状态
  if (props.currentAvatar) {
    selectedAvatar.value = props.currentAvatar
  }
})

const selectAvatar = (avatar) => {
  console.log('选择默认头像:', avatar)
  selectedAvatar.value = avatar
  uploadedFile.value = null
  uploadedImagePreview.value = null
  isUploadedFile.value = false
  errorMsg.value = ''
  // 重置文件输入
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  console.log('选择后状态 - selectedAvatar:', selectedAvatar.value, 'isUploadedFile:', isUploadedFile.value)
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errorMsg.value = '只支持上传图片文件（jpeg, jpg, png, gif, webp）'
    return
  }

  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    errorMsg.value = '图片大小不能超过5MB'
    return
  }

  uploadedFile.value = file
  isUploadedFile.value = true
  errorMsg.value = ''

  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImagePreview.value = e.target.result
    selectedAvatar.value = e.target.result // 设置为预览URL，用于显示选中状态
  }
  reader.readAsDataURL(file)
}

const closeModal = () => {
  emit('close')
}

const handleConfirm = async () => {
  console.log('确认保存 - selectedAvatar:', selectedAvatar.value)
  console.log('确认保存 - uploadedFile:', uploadedFile.value)
  console.log('确认保存 - isUploadedFile:', isUploadedFile.value)

  if (!selectedAvatar.value && !uploadedFile.value) {
    errorMsg.value = '请选择一个头像或上传图片'
    return
  }

  try {
    saving.value = true
    errorMsg.value = ''

    // 如果是上传的文件，调用上传接口
    if (isUploadedFile.value && uploadedFile.value) {
      console.log('走上传文件逻辑')
      const formData = new FormData()
      formData.append('avatar', uploadedFile.value)

      // 获取 token（优先使用 username，因为后端当前使用 username 作为 token）
      const token = authStore.username || authStore.token || ''
      console.log('上传头像 - 前端发送的token:', token)
      console.log('上传头像 - authStore:', { username: authStore.username, token: authStore.token })

      // 也将 token 添加到 FormData 中作为备选方案（某些情况下 headers 可能无法正确传递）
      if (token) {
        formData.append('token', token)
      }

      const response = await fetch(`${server_ip}/api/upload-avatar`, {
        method: 'POST',
        headers: {
          'token': token,
        },
        body: formData,
      })

      const result = await response.json()
      console.log('上传头像 - 后端返回结果:', result)

      if (response.ok && result.code === 0) {
        console.log('上传头像 - 成功，返回的头像URL:', result.avatar)
        // 确保返回的avatar不为空
        if (result.avatar) {
          emit('save', {
            avatar: result.avatar,
          })
          emit('close')
        } else {
          errorMsg.value = '上传成功但未返回头像URL'
          console.error('上传头像 - 后端未返回头像URL')
        }
      } else {
        errorMsg.value = result.message || '上传失败，请稍后重试'
      }
    } else {
      // 如果是选择默认头像，调用更新接口
      console.log('走默认头像逻辑，选择的头像URL:', selectedAvatar.value)

      // 确保 selectedAvatar 是默认头像列表中的一个
      if (!selectedAvatar.value || !defaultAvatars.value.includes(selectedAvatar.value)) {
        // 如果 selectedAvatar 不是默认头像（可能是 base64 预览），尝试从预览中恢复
        if (uploadedImagePreview.value) {
          errorMsg.value = '请先确认上传文件或选择默认头像'
          saving.value = false
          return
        }
        errorMsg.value = '请选择一个有效的头像'
        saving.value = false
        return
      }

      const headerToken = authStore.username || authStore.token || authStore.user_token || ''
      if (!headerToken) {
        errorMsg.value = '请先登录后再保存头像'
        saving.value = false
        return
      }

      const response = await fetch(`${server_ip}/api/update-nickname`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': headerToken,
        },
        body: JSON.stringify({
          avatar: selectedAvatar.value,
        }),
      })

      const result = await response.json()
      console.log('默认头像更新 - 后端返回:', result)

      if (response.ok && result.code === 0) {
        console.log('默认头像更新成功，返回的头像URL:', result.avatar || selectedAvatar.value)
        emit('save', {
          avatar: result.avatar || selectedAvatar.value,
        })
        emit('close')
      } else {
        errorMsg.value = result.message || '保存失败，请稍后重试'
      }
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

.upload-section {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.upload-label {
  display: block;
  cursor: pointer;
}

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: linear-gradient(to right, #378f60, #1b784c);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(55, 143, 96, 0.3);
}

.upload-icon {
  font-size: 20px;
}

.uploaded-preview {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 15px auto 0;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #67bb6e;
  box-shadow: 0 0 15px rgba(103, 187, 110, 0.5);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(103, 187, 110, 0.9);
  padding: 5px;
  text-align: center;
}

.preview-text {
  color: white;
  font-size: 12px;
  font-weight: bold;
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

