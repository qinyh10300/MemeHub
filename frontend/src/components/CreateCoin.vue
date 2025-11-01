<template>
    <div class="create-coin-card">
        <coin-details-form />


        <upload-box />
    </div>
</template>


<script setup>
import CoinDetailsForm from './CoinDetailsForm.vue'
import UploadBox from './UploadBox.vue'
</script>


<style scoped>
.create-coin-card{ background:var(--panel); padding:18px; border-radius:12px; box-shadow:var(--shadow); }
</style>