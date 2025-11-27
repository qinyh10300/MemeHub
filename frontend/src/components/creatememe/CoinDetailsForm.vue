<template> 
  <div class="coin-details">
    <h2>模因币详情</h2>
    <p class="sub">请谨慎选择，这些在创建币种后无法更改</p>

    <div class="row">
      <field-input 
        label="名称" 
        placeholder="命名你的币种"
        class="half"
        v-model="localForm.name"
      />
      <field-input 
        label="代号" 
        placeholder="添加币种代号（例如：DOGE）"
        class="half"
        v-model="localForm.symbol"
      />
    </div>

    <text-area 
      label="描述（可选）" 
      placeholder="写一个简短的描述"
      v-model="localForm.description"
    />

    <expandable-section title="添加社交链接">
      <div class="social-grid">
        <field-input 
          label="个人网站" 
          placeholder="添加网址"
          v-model="localForm.social.website"
        />
        <field-input 
          label="微博" 
          placeholder="添加网址"
          v-model="localForm.social.weibo"
        />
        <field-input 
          label="小红书" 
          placeholder="添加网址"
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

// 本地表单数据
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

// 监听 props 变化，回显数据
watch(() => props.modelValue, (newVal) => {
  // console.log('CoinDetailsForm props changed:', newVal)
  if (newVal) {
    // 只有当新值与当前值不同时才更新，防止光标跳动或死循环
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

// 监听本地数据变化，通知父组件
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