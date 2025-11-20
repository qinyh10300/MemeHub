<template>
  <div class="app-root">
    <main class="container">

      <section class="left">
        <h1>创建新的模因币</h1>
        <create-coin 
          ref="createCoinRef"
          @form-data="handleFormData"
          @file-selected="handleFileSelected"
        />
        <div class="notice">模因币数据只能在此时添加，创建后无法更改或编辑</div>
        <primary-button class="create-btn" @click="handleCreateMeme">
          创建模因
        </primary-button>
      </section>

      <aside class="right">
        <div class="preview">
          <div class="panel-title">预览</div>
          <div class="preview-box">
            <template v-if="selectedFile">
              <!-- 图片/GIF 预览 -->
              <img 
                v-if="isImage || isGif" 
                :src="filePreviewUrl" 
                class="preview-img" 
                alt="Preview" 
              />
              <!-- 视频预览 -->
              <video 
                v-else-if="isVideo" 
                :src="filePreviewUrl" 
                class="preview-img" 
                controls
              ></video>
              <div v-else class="unsupported-file">
                不支持的文件类型
              </div>
            </template>
            <template v-else>
              这是对该币种外观的预览
            </template>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>



<script setup>
import CreateCoin from '../components/creatememe/CreateCoin.vue'
import PrimaryButton from '../components/creatememe/PrimaryButton.vue'
import { ref, computed, watch } from 'vue'

const createCoinRef = ref(null)
const formData = ref(null)
const selectedFile = ref(null)
const filePreviewUrl = ref('') // 新增：用于存储文件预览URL

// 计算文件类型
const isImage = computed(() => selectedFile.value?.type?.startsWith('image/'))
const isVideo = computed(() => selectedFile.value?.type?.startsWith('video/'))
const isGif = computed(() => selectedFile.value?.type === 'image/gif')

// 监听文件变化，创建预览URL
watch(selectedFile, (newFile) => {
  // 清理之前的URL
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
  
  // 创建新的预览URL
  if (newFile) {
    filePreviewUrl.value = URL.createObjectURL(newFile)
  } else {
    filePreviewUrl.value = ''
  }
})

// 组件卸载时清理URL
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
})

// 接收表单数据
function handleFormData(data) {
  formData.value = data
}

// 接收文件数据
function handleFileSelected(file) {
  selectedFile.value = file
}

// 处理创建模因币
async function handleCreateMeme() {
  // console.log('Creating meme with data:', formData.value, 'and file:', selectedFile.value)
  if (!selectedFile.value) {
    alert('请先选择文件')
    return
  }
  if (!formData.value?.coinname || !formData.value?.ticker) {
    alert('请填写币种名称和代号')
    return
  }

  const uploadData = new FormData()
  uploadData.append('title', formData.value.coinname)
  uploadData.append('ticker', formData.value.ticker)
  uploadData.append('description', formData.value.description || '')
  uploadData.append('website', formData.value.social?.website || '')
  uploadData.append('weibo', formData.value.social?.weibo || '')
  uploadData.append('xiaohongshu', formData.value.social?.xiaohongshu || '')
  uploadData.append('file', selectedFile.value)

  try {
    const res = await fetch('/api/upload-meme', {
      method: 'POST',
      body: uploadData
    })
    console.log(`response: ${res}`)
    if (res.ok) {
      alert('上传成功')
      // 清空表单
      createCoinRef.value?.resetForm()
      formData.value = null
      selectedFile.value = null
    } else {
      alert('上传失败')
    }
  } catch (err) {
    alert('上传出错')
  }
}
</script>


<style scoped>
.app-root{ min-height:100vh; background:var(--bg); color:var(--fg); overflow-y: auto; font-family:Inter,system-ui,Arial; background: var(--my-bg-soft); width:100%}
.topbar{ padding:24px 40px; border-bottom:1px solid rgba(255, 255, 255, 0.03)}
.container{ display:flex; gap:28px; padding:28px 40px; width:100%; margin:0 auto;  }
.container h1{ display:flex; margin:0; font-size:20px; font-weight:600; padding:36px 0 0 36px;}
.left{ flex:1; min-width:0 }
.right{ width:320px; padding:48px; }
.notice{ padding:36px; background:var(--panel); border-radius:10px; color:var(--my-c-text-soft); font-size:13px }
.create-btn{ margin-left:36px }
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
.unsupported-file {
  color: var(--muted);
  text-align: center;
  padding: 20px;
}

@media (max-width:900px){ .container{flex-direction:column} .right{width:100%} }
</style>