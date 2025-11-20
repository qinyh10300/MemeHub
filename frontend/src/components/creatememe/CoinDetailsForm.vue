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
console.log('init localForm')

// 监听父组件传入的数据变化
watch(localForm, () => {
  emit("update:modelValue", {
    coinname: localForm.name,
    ticker: localForm.symbol,
    description: localForm.description,
    social: { ...localForm.social }
  },)
}, { deep: true })
// 调试
// watch(localForm, () => {
//   console.log("[CoinDetailsForm] emit update:modelValue:", {
//     coinname: localForm.name,
//     ticker: localForm.symbol,
//     description: localForm.description,
//     social: { ...localForm.social }
//   })

//   emit("update:modelValue", {
//     coinname: localForm.name,
//     ticker: localForm.symbol,
//     description: localForm.description,
//     social: { ...localForm.social }
//   })
// }, { deep: true })

// 表单变化时通知父组件
// function onFormChange() {
//   const formData = {
//     coinname: localForm.name,
//     ticker: localForm.symbol,
//     description: localForm.description,
//     social: { ...localForm.social }
//   }
//   emit('update:modelValue', formData)
// }
</script>

<style scoped>
.coin-details { padding:18px; }
.coin-details h2 { margin:0; font-size:16px; }
.sub { color:var(--my-c-text-soft); margin-top:6px; font-size:13px; }
.row { display:flex; gap:20px; margin-top:16px; }
.row .half { flex:1; }
.social-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px; }
</style>
