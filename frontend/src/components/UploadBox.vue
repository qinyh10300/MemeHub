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
                <div class="title">选择要上传的视频或图片</div>
                <div class="sub">或将其拖放到此处</div>

                <input
                    id="fileInput"
                    class="file-input"
                    type="file"
                    accept="image/*,video/*"
                    hidden
                />
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <label for="fileInput" class="login" style="cursor:pointer;">选择文件</label>
                    <button class="login" type="button">登录</button>
                </div>
            </div>

            <div class="hints" style="margin-top:18px; display:grid; grid-template-columns:1fr 1fr; gap:18px;">
                <div class="hint">
                    <strong>文件大小和类型</strong>
                    <ul>
                        <li>图片 - 最大 15 MB。推荐使用 .jpg, .gif, .png 格式</li>
                        <li>视频 - 最大 30 MB。推荐使用 .mp4 格式</li>
                    </ul>
                </div>

                <div class="hint">
                    <strong>分辨率和纵横比</strong>
                    <ul>
                        <li>图片 - 最小 1000×1000 px; 推荐使用 1:1 正方形</li>
                        <li>视频 - 16:9 或 9:16; 推荐使用 1080p 及以上</li>
                    </ul>
                </div>
            </div>

            <div class="add-banner">添加横幅（可选）</div>
        </div>
    </div>
</template>


<script setup>
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