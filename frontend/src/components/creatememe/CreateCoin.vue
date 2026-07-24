<template>
    <div class="create-coin-card">
        <coin-details-form
            :key="formKey"
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

const formKey = ref(0)

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

// Watch form changes and notify parent component
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

// Reset form method
function resetForm() {
    coinForm.value = {
        coinname: '',
        ticker: '',
        description: '',
        social: { website: '', weibo: '', xiaohongshu: '' }
    }
}

// Set form data (for data echo)
function setForm(data) {
    coinForm.value = {
        ...coinForm.value,
        ...data,
        social: { ...coinForm.value.social, ...(data.social || {}) }
    }
    formKey.value++ // Force re-render child components for data echo
}

defineExpose({
    resetForm,
    setForm
})
</script>

<style scoped>
.create-coin-card{ background:var(--panel); padding:0 0 0 18px; border-radius:12px; box-shadow:var(--shadow); }
</style>

