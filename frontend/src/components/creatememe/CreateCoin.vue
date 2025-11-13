<template>
    <div class="create-coin-card">

        <coin-details-form v-model="coinForm" />

        <upload-box
            @file-change="onFileChange"
            @upload="onUpload"
        />
    </div>
</template>

<script setup>
import CoinDetailsForm from './CoinDetailsForm.vue'
import UploadBox from './UploadBox.vue'
import { ref } from 'vue'

const coinForm = ref({
    coinname: '',
    ticker: ''
})
const selectedFile = ref(null)

function onFileChange(file) {
    selectedFile.value = file
}

async function onUpload() {
    if (!selectedFile.value) {
        alert('Please select a file first.')
        return
    }
    if (!coinForm.value.coinname || !coinForm.value.ticker) {
        alert('请填写 coinname 和 ticker')
        return
    }
    const formData = new FormData()
    formData.append('title', coinForm.value.coinname)
    formData.append('ticker', coinForm.value.ticker)
    formData.append('file', selectedFile.value)

    try {
        const res = await fetch('/api/upload-meme', {
            method: 'POST',
            body: formData
        })
        if (res.ok) {
            alert('上传成功')
        } else {
            alert('上传失败')
        }
    } catch (err) {
        alert('上传出错')
    }
    selectedFile.value = null
}
</script>

<style scoped>
.create-coin-card{ background:var(--panel); padding:0 0 0 18px; border-radius:12px; box-shadow:var(--shadow); }
</style>

