<template>
  <div class="app-root">
    <main class="container">

      <section class="left">
        <h1>{{ isEditMode ? '编辑模因（重新提交审核）' : '创建新的模因币' }}</h1>
        <create-coin 
          ref="createCoinRef"
          @form-data="handleFormData"
          @file-selected="handleFileSelected"
        />
        <div class="notice">
          {{ isEditMode ? '修改后模因将重新进入待审核状态' : '模因币数据只能在此时添加，创建后无法更改或编辑' }}
        </div>
        <primary-button class="create-btn" @click="handleCreateMeme">
          {{ isEditMode ? '提交修改（仅创建模因）' : '仅创建模因' }}
        </primary-button>
        <primary-button class="create-btn" @click="handleCreateMemeCoin">
          {{ isEditMode ? '提交修改（创建模因与模因币）' : '创建模因与模因币' }}
        </primary-button>
      </section>

      <aside class="right">
        <div class="preview">
          <div class="panel-title">预览</div>
          <div class="preview-box">
            <template v-if="filePreviewUrl">
              <!-- 图片/GIF 预览 (默认) -->
              <img 
                v-if="isImage || isGif || (!selectedFile && filePreviewUrl)" 
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
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { emitTaskProgress } from '@/utils/gamificationEvents'

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
  // 清理之前的URL (如果是 Blob URL)
  if (filePreviewUrl.value && filePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
  
  // 创建新的预览URL
  if (newFile) {
    filePreviewUrl.value = URL.createObjectURL(newFile)
  } else if (!isEditMode.value) {
    filePreviewUrl.value = ''
  }
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const server_ip = authStore.server_ip || 'http://localhost:3000' // 后端服务器地址

const isEditMode = computed(() => !!route.query.id)

// 组件卸载时清理URL
onUnmounted(() => {
  if (filePreviewUrl.value && filePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
})

onMounted(async () => {
  if (isEditMode.value) {
    const id = route.query.id
    try {
      const res = await fetch(`${server_ip}/api/meme/${id}`, {
        headers: {
          'token': authStore.token || ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (createCoinRef.value) {
          createCoinRef.value.setForm({
            coinname: data.title,
            ticker: data.ticker,
            description: data.description,
            social: data.social
          })
          // 手动更新 formData，因为 setForm 不会触发 CreateCoin 的 emit
          formData.value = {
            coinname: data.title,
            ticker: data.ticker,
            description: data.description,
            social: data.social
          }
        }
        if (data.imageUrl) {
          filePreviewUrl.value = `${server_ip}${data.imageUrl}`
        }
      }
    } catch (e) {
      console.error('获取模因详情失败', e)
    }
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

// 处理创建/更新模因币
async function handleCreateMeme() {
  // 检查是否登录
  if (!authStore.username) {
    alert('请先登录')
    router.push('/')
    return
  }

  // 编辑模式下，文件是可选的；创建模式下必选
  if (!isEditMode.value && !selectedFile.value) {
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
  
  if (selectedFile.value) {
    uploadData.append('file', selectedFile.value)
  }

  const url = isEditMode.value 
    ? `${server_ip}/api/meme/${route.query.id}`
    : `${server_ip}/api/upload-meme`
    
  const method = isEditMode.value ? 'PUT' : 'POST'

  try {
    console.log(`${isEditMode.value ? '更新' : '创建'}模因请求:`, {
      url,
      method,
      username: authStore.username,
      hasFile: !!selectedFile.value,
      formData: formData.value
    })

    const res = await fetch(url, {
      method: method,
      headers: {
        'token': authStore.username || authStore.token || '' // 传递用户名作为token
      },
      body: uploadData
    })
    
    let result
    try {
      const text = await res.text()
      result = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      throw new Error(`服务器响应格式错误: ${res.statusText}`)
    }
    
    if (res.ok || res.status === 201) {
      if (result.code === 0) {
        alert(isEditMode.value ? '更新模因成功，已提交审核！' : '创建模因成功！')
        
        // 如果是创建，清空表单；更新则不用
        if (!isEditMode.value) {
          emitTaskProgress('daily-share', 1, { username: authStore.username || 'guest' })
          createCoinRef.value?.resetForm()
          formData.value = null
          selectedFile.value = null
          if (filePreviewUrl.value) {
            URL.revokeObjectURL(filePreviewUrl.value)
            filePreviewUrl.value = ''
          }
        }
        
        // 跳转到创建的模因详情页 (或者列表页)
        // 这里改为跳转到个人主页
        const newId = result.data?._id || route.query.id
        if (newId) {
          // router.push(`/meme/${newId}`)
          router.push(`/profile/${authStore.username}`)
        } else {
          router.push('/')
        }
      } else {
        // 处理业务错误
        const errorMsg = result.message || '操作失败'
        alert(errorMsg)
      }
    } else {
      // 处理HTTP错误响应
      const errorMsg = result.message || `操作失败 (${res.status})`
      alert(errorMsg)
    }
  } catch (err) {
    console.error('操作时发生错误:', err)
    alert(`错误: ${err.message || '未知错误，请查看控制台'}`)
  }
}

// 处理创建/更新模因币
async function handleCreateMemeCoin() {
  // 检查是否登录
  if (!authStore.username) {
    alert('请先登录')
    router.push('/')
    return
  }

  // 编辑模式下，文件是可选的；创建模式下必选
  if (!isEditMode.value && !selectedFile.value) {
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
  
  if (selectedFile.value) {
    uploadData.append('file', selectedFile.value)
  }

  uploadData.append('withToken', true);

  const url = isEditMode.value 
    ? `${server_ip}/api/meme/${route.query.id}`
    : `${server_ip}/api/upload-meme`
    
  const method = isEditMode.value ? 'PUT' : 'POST'

  try {
    console.log(`${isEditMode.value ? '更新' : '创建'}模因请求:`, {
      url,
      method,
      username: authStore.username,
      hasFile: !!selectedFile.value,
      formData: formData.value
    })

    const res = await fetch(url, {
      method: method,
      headers: {
        'token': authStore.username || authStore.token || '' // 传递用户名作为token
      },
      body: uploadData
    })
    
    let result
    try {
      const text = await res.text()
      result = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      throw new Error(`服务器响应格式错误: ${res.statusText}`)
    }
    
    if (res.ok || res.status === 201) {
      if (result.code === 0) {
        alert(isEditMode.value ? '更新模因成功，已提交审核！' : '创建模因成功！')
        
        // 如果是创建，清空表单；更新则不用
        if (!isEditMode.value) {
          emitTaskProgress('daily-share', 1, { username: authStore.username || 'guest' })
          createCoinRef.value?.resetForm()
          formData.value = null
          selectedFile.value = null
          if (filePreviewUrl.value) {
            URL.revokeObjectURL(filePreviewUrl.value)
            filePreviewUrl.value = ''
          }
        }
        
        // 跳转到创建的模因详情页 (或者列表页)
        // 这里改为跳转到个人主页
        const newId = result.data?._id || route.query.id
        if (newId) {
          // router.push(`/meme/${newId}`)
          router.push(`/profile/${authStore.username}`)
        } else {
          router.push('/')
        }
      } else {
        // 处理业务错误
        const errorMsg = result.message || '操作失败'
        alert(errorMsg)
      }
    } else {
      // 处理HTTP错误响应
      const errorMsg = result.message || `操作失败 (${res.status})`
      alert(errorMsg)
    }
  } catch (err) {
    console.error('操作时发生错误:', err)
    alert(`错误: ${err.message || '未知错误，请查看控制台'}`)
  }
}
</script>


<style scoped>
.app-root{ height:100vh; background:var(--bg); color:var(--fg); font-family:Inter,system-ui,Arial; overflow: hidden; background: var(--muted); width:100%; display:flex; flex-direction: column;}
.topbar{ padding:24px 40px; border-bottom:1px solid rgba(255, 255, 255, 0.03)}
.container{ flex:1; display:flex; gap:28px; padding:28px 40px; width:100%; margin:0 auto; overflow-y: auto; background: var(--muted); }
.container h1{ display:flex; margin:0; font-size:20px; font-weight:600; padding:36px 0 0 36px;}
.left{ flex:1; min-width:0; background: var(--muted); }
.right{ width:320px; padding:48px; background: var(--muted); }
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

/* 自定义滚动条样式 */
.container::-webkit-scrollbar {
  width: 8px;
}

.container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>