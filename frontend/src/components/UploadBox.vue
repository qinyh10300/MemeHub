<template>
    <div class="upload-card">
        <div class="upload-inner">
            <div
                class="drop-area"
                role="button"
                tabindex="0"
                aria-label="Upload or drag and drop files"
            >
                <div class="icon" aria-hidden="true">🖼️</div>
                <div class="title">Select video or image to upload</div>
                <div class="sub">or drag and drop it here</div>

                <input
                    id="fileInput"
                    class="file-input"
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    ref="fileInputRef"
                    @change="handleFileChange"
                />
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <label for="fileInput" class="login" style="cursor:pointer;">Choose files</label>
                    <button class="login" type="button" @click="handleUpload">Upload</button>
                </div>
            </div>

            <div class="hints" style="margin-top:18px; display:grid; grid-template-columns:1fr 1fr; gap:18px;">
                <div class="hint">
                    <strong>File size and type</strong>
                    <ul>
                        <li>Image - max 15 MB. .jpg, .gif, .png recommended</li>
                        <li>Video - max 30 MB. .mp4 recommended</li>
                    </ul>
                </div>

                <div class="hint">
                    <strong>Resolution and aspect ratio</strong>
                    <ul>
                        <li>Image - min. 1000×1000 px; 1:1 square recommended</li>
                        <li>Video - 16:9 or 9:16; 1080p+ recommended</li>
                    </ul>
                </div>
            </div>

            <div class="add-banner">Add banner (optional)</div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-change', 'upload'])
const fileInputRef = ref(null)

function handleFileChange(event) {
    const files = event.target.files
    emit('file-change', files && files.length > 0 ? files[0] : null)
}

function handleUpload() {
    emit('upload')
}
</script>


<style scoped>
.upload-card{ margin-top:18px; background:linear-gradient(180deg, rgba(255,255,255,0.01), transparent); border-radius:12px; padding:18px }
.drop-area{ border:2px dashed rgba(255,255,255,0.04); border-radius:10px; padding:36px; text-align:center; min-height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center }
.icon{ font-size:28px; margin-bottom:8px }
.title{ font-weight:600; margin-bottom:6px }
.sub{ color:var(--muted); margin-bottom:10px }
.login{ background:var(--accent); border:none; padding:8px 14px; border-radius:8px; cursor:pointer; color:#06241a }
.hints{ display:flex; gap:18px; margin-top:14px }
.hint{ flex:1; font-size:13px; color:var(--muted) }
.hint ul{ margin:6px 0 0 18px }
.add-banner{ margin-top:10px; color:var(--muted); font-size:13px }
</style>