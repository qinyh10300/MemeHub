<template>
  <div class="coin-details">
    <h2>Meme Coin Details</h2>
    <p class="sub">Please choose carefully, these cannot be changed after creating the coin</p>

    <div class="row">
      <field-input
        label="Name"
        placeholder="Name your coin"
        class="half"
        v-model="localForm.name"
      />
      <field-input
        label="Symbol"
        placeholder="Add coin symbol (e.g., DOGE)"
        class="half"
        v-model="localForm.symbol"
      />
    </div>

    <text-area
      label="Description (Optional)"
      placeholder="Write a brief description"
      v-model="localForm.description"
    />

    <expandable-section title="Add Social Links">
      <div class="social-grid">
        <field-input
          label="Website"
          placeholder="Add URL"
          v-model="localForm.social.website"
        />
        <field-input
          label="Weibo"
          placeholder="Add URL"
          v-model="localForm.social.weibo"
        />
        <field-input
          label="Xiaohongshu"
          placeholder="Add URL"
          v-model="localForm.social.xiaohongshu"
        />
      </div>
    </expandable-section>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import FieldInput from './FieldInput.vue'
import TextArea from './TextArea.vue'
import ExpandableSection from './ExpandableSection.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

// Local form data
const localForm = reactive({
  name: '',
  symbol: '',
  description: '',
  social: {
    website: '',
    weibo: '',
    xiaohongshu: ''
  }
})

// Watch props changes for data echo
watch(() => props.modelValue, (newVal) => {
  // console.log('CoinDetailsForm props changed:', newVal)
  if (newVal) {
    // Only update if new value is different from current, prevents cursor jump or infinite loop
    if (newVal.coinname !== undefined && newVal.coinname !== localForm.name) {
      localForm.name = newVal.coinname
    }
    if (newVal.ticker !== undefined && newVal.ticker !== localForm.symbol) {
      localForm.symbol = newVal.ticker
    }
    if (newVal.description !== undefined && newVal.description !== localForm.description) {
      localForm.description = newVal.description
    }
    if (newVal.social) {
      if (newVal.social.website !== undefined && newVal.social.website !== localForm.social.website) {
        localForm.social.website = newVal.social.website
      }
      if (newVal.social.weibo !== undefined && newVal.social.weibo !== localForm.social.weibo) {
        localForm.social.weibo = newVal.social.weibo
      }
      if (newVal.social.xiaohongshu !== undefined && newVal.social.xiaohongshu !== localForm.social.xiaohongshu) {
        localForm.social.xiaohongshu = newVal.social.xiaohongshu
      }
    }
  }
}, { immediate: true, deep: true })

// Watch local data changes, notify parent component
watch(localForm, () => {
  emit("update:modelValue", {
    coinname: localForm.name,
    ticker: localForm.symbol,
    description: localForm.description,
    social: { ...localForm.social }
  })
}, { deep: true })
</script>

<style scoped>
.coin-details { padding:18px; }
.coin-details h2 { margin:0; font-size:16px; }
.sub { color:var(--my-c-text-soft); margin-top:6px; font-size:13px; }
.row { display:flex; gap:20px; margin-top:16px; }
.row .half { flex:1; }
.social-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px; }
</style>