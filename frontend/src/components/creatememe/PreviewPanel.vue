<template>
  <div class="preview">
    <div class="panel-title">预览</div>
    <div class="preview-box">
      <template v-if="file">
        <!-- 图片/GIF 预览 -->
        <img v-if="isImage || isGif" :src="file" class="preview-img" alt="Preview" />
        <!-- 未来可扩展视频预览 -->
        <video v-else-if="isVideo" :src="file" class="preview-img" controls></video>
      </template>
      <template v-else>
        这是对该币种外观的预览
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: { type: String, required: false } // DataURL，可为空
})

// 判断文件类型
const isImage = computed(() => props.file?.startsWith('data:image') && !props.file?.startsWith('data:image/gif'))
const isGif   = computed(() => props.file?.startsWith('data:image/gif'))
const isVideo = computed(() => props.file?.startsWith('data:video'))
</script>

<style scoped>
.preview{ background:transparent }
.panel-title{ color:var(--muted); margin-bottom:8px }
.preview-box{ 
  height:300px; 
  border-radius:12px; 
  background:rgba(255, 255, 255, 0.08); 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  color:var(--muted); 
  padding:12px;
  overflow:hidden; /* 保证内容不会溢出 */
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  object-fit: contain;
}
</style>
