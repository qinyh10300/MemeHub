<template>
    <div class="create-coin-card">
        <coin-details-form 
            v-model="coinForm"
            @update:modelValue="onFormUpdate"
        />

        <upload-box
            v-model="file"
            @file-change="onFileChange"
        />
    </div>
</template>

<script setup>
import CoinDetailsForm from './CoinDetailsForm.vue'
import UploadBox from './UploadBox.vue'
import { ref, watch } from 'vue'

const emit = defineEmits(['form-data', 'file-selected'])

const coinForm = ref({
    coinname: '',
    ticker: '',
    description: '',
    social: {
        website: '',
        weibo: '',
        xiaohongshu: ''
    }
})

const file = ref(null)

// 监听表单变化并通知父组件
watch(coinForm, (newVal) => {
    emit('form-data', newVal)
}, { deep: true })

watch(file, (newFile) => {
    emit('file-selected', newFile)
})

function onFormUpdate(newForm) {
    coinForm.value = newForm
    // console.log('111 Creating meme with data:', newForm, 'and file:', coinForm.value)
    emit('form-data', newForm)
}

function onFileChange(file) {
    emit('file-selected', file)
}

// 重置表单的方法
 function resetForm() {
     coinForm.value = {
         coinname: '',
         ticker: '',
         description: '',
         social: { website: '', weibo: '', xiaohongshu: '' }
     }
 }

 defineExpose({
     resetForm
 })
</script>

<style scoped>
.create-coin-card{ background:var(--panel); padding:0 0 0 18px; border-radius:12px; box-shadow:var(--shadow); }
</style>

