<template>
  <div class="upload-card">
    <div class="upload-inner">
      <div
        class="drop-area"
        :class="{ 'drag-over': isDragging }"
        role="button"
        tabindex="0"
        aria-label="Upload or drag and drop files"
        @click="triggerInput"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <div class="icon" aria-hidden="true">🖼️</div>
        <div class="title">选择要上传的视频或图片</div>
        <div class="sub">或将其拖放到此处</div>

        <input
          ref="fileInput"
          id="fileInput"
          class="file-input"
          type="file"
          accept="image/*,video/*"
          hidden
          @change="onFileChange"
        />

        <div style="display:flex;gap:8px;margin-top:12px;">
          <label class="login" style="cursor:pointer;">选择文件</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
const emit = defineEmits(['file-change'])

const previewFile = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)

// 触发文件选择
function triggerInput() {
  fileInput.value?.click()
}

// 拖拽相关事件
function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

async function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (!file) return
  await handleFile(file)
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  await handleFile(file)
  emit('file-change', file)
}

// -------------------- 文件处理 --------------------
// TODO: 处理过程对吗
async function handleFile(file) {
  let processedBlob
  if (file.type.startsWith('video/')) {
    processedBlob = await videoToGif(file)
  } else if (file.type.startsWith('image/')) {
    processedBlob = await processImage(file)
  } else {
    alert('不支持的文件类型')
    return
  }

  if (!processedBlob) {
    alert('文件处理失败，请重试')
    return
  }

  // 将 Blob 包装为带扩展名的 File，避免后端拿到奇怪的 originalname（例如 .html）
  const mime = processedBlob.type || 'image/png'
  const extMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  }
  const ext = extMap[mime] || 'png'
  const safeFile = new File([processedBlob], `upload-${Date.now()}.${ext}`, { type: mime })

  const reader = new FileReader()
  reader.onload = () => {
    previewFile.value = reader.result
  }
  reader.readAsDataURL(processedBlob)

  emit('file-change', safeFile)
}

// 图片裁剪 1:1 并至少 1000×1000
async function processImage(file) {
  const img = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const size = Math.max(img.width, img.height, 1000)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const minSide = Math.min(img.width, img.height)
  const sx = (img.width - minSide) / 2
  const sy = (img.height - minSide) / 2
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
  return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

// 视频转 GIF (首帧示例，可扩展库处理多帧)
async function videoToGif(file) {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(file)
  await video.play().catch(()=>{})
  await new Promise(resolve => video.onloadeddata = resolve)
  const canvas = document.createElement('canvas')
  const size = Math.max(video.videoWidth, video.videoHeight, 1000)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const minSide = Math.min(video.videoWidth, video.videoHeight)
  const sx = (video.videoWidth - minSide) / 2
  const sy = (video.videoHeight - minSide) / 2
  ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, size, size)
  return await new Promise(resolve => canvas.toBlob(resolve, 'image/gif'))
}

</script>

<style scoped>
/* 页面占满全屏 */
.upload-card{
  padding: 18px;
  width: 100%;
  background: var(--my-c-bg);
  /* min-height: 100vh; */
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.upload-inner {
  width: 100%;
  border-radius:12px;
  /* max-width: 600px; */
  padding: 18px;
  max-height: 80vh;        /* 避免超过屏幕高度 */
  overflow-y: auto;        /* 可滚动 */
  border: 2px dashed rgba(255, 255, 255, 0.15);
}

/* drop-area 默认样式 */
.drop-area{
  border:2px dashed rgba(255,255,255,0.04);
  border-radius:10px;
  padding:24px 36px;
  text-align:center;
  min-height:150px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.drop-area * {
  pointer-events: auto;
}

/* 拖拽炫酷动画 */
.drop-area.drag-over {
  animation: pulse-border 1.2s infinite alternate;
  border-color: var(--my-c-button);
  background: linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1));
  transform: scale(1.03);
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
  50% { box-shadow: 0 0 20px rgba(255,255,255,0.5); }
  100% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
}

/* 图标动画 */
.drop-area.drag-over .icon {
  animation: pop-icon 0.6s ease-in-out infinite alternate;
}

@keyframes pop-icon {
  0% { transform: scale(1); }
  100% { transform: scale(1.3); }
}

.icon{ font-size:28px; margin-bottom:8px }
.title{ font-weight:600; margin-bottom:6px }
.sub{ color:var(--muted); margin-bottom:10px }
.login{ background:var(--my-c-button); border:none; padding:8px 14px; border-radius:8px; cursor:pointer; color: var(--vt-c-black); }
</style>
