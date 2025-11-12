<template> 
  <div class="coin-details">
    <h2>模因币详情</h2>
    <p class="sub">请谨慎选择，这些在创建币种后无法更改</p>

    <!-- 基本信息 -->
    <div class="row">
      <field-input 
        label="名称" 
        placeholder="命名你的币种"
        class="half"
        v-model="coinForm.name"
        @input="onFormChange"
      />
      <field-input 
        label="代号" 
        placeholder="添加币种代号（例如：DOGE）"
        class="half"
        v-model="coinForm.symbol"
        @input="onFormChange"
      />
    </div>

    <!-- 描述 -->
    <text-area 
      label="描述（可选）" 
      placeholder="写一个简短的描述"
      v-model="coinForm.description"
      @input="onFormChange"
    />

    <!-- 社交链接 -->
    <expandable-section title="添加社交链接">
      <div class="social-grid">
        <field-input 
          label="个人网站" 
          placeholder="添加网址"
          v-model="coinForm.social.website"
          @input="onFormChange"
        />
        <field-input 
          label="微博" 
          placeholder="添加网址"
          v-model="coinForm.social.weibo"
          @input="onFormChange"
        />
        <field-input 
          label="小红书" 
          placeholder="添加网址"
          v-model="coinForm.social.xiaohongshu"
          @input="onFormChange"
        />
      </div>
    </expandable-section>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import FieldInput from './FieldInput.vue'
import TextArea from './TextArea.vue'
import ExpandableSection from './ExpandableSection.vue'

const router = useRouter()

// ✅ 定义统一的表单对象
const coinForm = reactive({
  name: '',
  symbol: '',
  description: '',
  social: {
    website: '',
    weibo: '',
    xiaohongshu: ''
  }
})

// TODO: 公共回调
function onFormChange() {
  console.log('表单更新:', JSON.parse(JSON.stringify(coinForm)))
  // 你可以选择在此处更新路由或触发其他逻辑
  // router.replace({ name: 'CoinCreate', query: coinForm })
}

// TODO: 如果想要自动监听变化，也可以使用 watch
watch(coinForm, (val) => {
  console.log('检测到表单变化:', val)
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
