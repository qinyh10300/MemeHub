<template>
    <div class="coin-details">
        <h2>模因币详情</h2>
        <p class="sub">请谨慎选择，这些在创建币种后无法更改</p>


        <div class="row">
            <field-input label="名称" placeholder="命名你的币种" class="half" />
            <field-input label="代号" placeholder="添加币种代号（例如：DOGE）" class="half" />
        </div>


        <text-area label="描述（可选）" placeholder="写一个简短的描述" />


        <expandable-section title="添加社交链接">
            <div class="social-grid">
                <field-input label="个人网站" placeholder="添加网址" />
                <field-input label="X" placeholder="添加网址" />
                <field-input label="Telegram" placeholder="添加网址" />
            </div>
        </expandable-section>
    </div>
</template>


<script setup>
import FieldInput from './FieldInput.vue'
import TextArea from './TextArea.vue'
import ExpandableSection from './ExpandableSection.vue'
</script>


<style scoped>
.coin-details{ padding:18px }
.coin-details h2{ margin:0; font-size:16px }
.sub{ color:var(--muted); margin-top:6px; font-size:13px }
.row{ display:flex; gap:20px; margin-top:16px }
.row .half{ flex:1 }
.social-toggle{ margin-top:12px; background:rgba(255,255,255,0.02); padding:10px; border-radius:8px }
.social-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px }
</style>
