<template>
  <div class="app-root">

    <main class="container">

      <section class="left">
        <h1>创建新的模因币</h1>
        <create-coin />
        <div class="notice">模因币数据只能在此时添加，创建后无法更改或编辑</div>
        <primary-button class="create-btn">创建模因</primary-button>
      </section>

      <aside class="right">
        <preview-panel />
      </aside>
    </main>
  </div>
</template>


<script setup>
import CreateCoin from '../components/creatememe/CreateCoin.vue'
import PreviewPanel from '../components/creatememe/PreviewPanel.vue'
import PrimaryButton from '../components/creatememe/PrimaryButton.vue'
</script>


<style scoped>
.app-root{ min-height:100vh; background:var(--bg); color:var(--fg); overflow-y: auto; font-family:Inter,system-ui,Arial; background: var(--my-bg-soft); width:100%}
.topbar{ padding:24px 40px; border-bottom:1px solid rgba(255, 255, 255, 0.03)}
.container{ display:flex; gap:28px; padding:28px 40px; width:100%; margin:0 auto;  }
.container h1{ display:flex; margin:0; font-size:20px; font-weight:600; padding:36px 0 0 36px;}
.left{ flex:1; min-width:0 }
.right{ width:320px; padding:48px; }
.notice{ padding:36px; background:var(--panel); border-radius:10px; color:var(--my-c-text-soft); font-size:13px }
.create-btn{ margin-left:36px }


@media (max-width:900px){ .container{flex-direction:column} .right{width:100%} }
</style>