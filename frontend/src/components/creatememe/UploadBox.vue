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
        <div class="title">Select video or image to upload</div>
        <div class="sub">or drag and drop it here</div>

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
          <label class="login" style="cursor:pointer;">Select File</label>
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

// Trigger file selection
function triggerInput() {
  fileInput.value?.click()
}

// Drag-related events
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

// -------------------- File Processing --------------------
// TODO: Is the processing correct?
async function handleFile(file) {
  let processedBlob
  if (file.type.startsWith('video/')) {
    processedBlob = await videoToGif(file)
  } else if (file.type.startsWith('image/')) {
    processedBlob = await processImage(file)
  } else {
    alert('Unsupported file type')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    previewFile.value = reader.result
  }
  reader.readAsDataURL(processedBlob)

  emit('file-change', processedBlob)
}

// Image crop to 1:1 and at least 1000×1000
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

// Video to GIF (first frame example, can extend with library for multiple frames)
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
/* Fullscreen layout */
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
  max-height: 80vh;        /* Avoid exceeding screen height */
  overflow-y: auto;        /* Scrollable */
  border: 2px dashed rgba(255, 255, 255, 0.15);
}

/* drop-area default style */
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

/* Drag animation effects */
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

/* Icon animation */
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
