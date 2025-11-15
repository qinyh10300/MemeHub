<template>
  <div class="app-root">
    <header class="topbar">
      <h1>创建新的模因币</h1>
    </header>

    <main class="container">
      <section class="left">
        <create-coin />
        <div class="notice">模因币数据（社交链接、横幅等）只能在此时添加，创建后无法更改或编辑</div>
        <primary-button class="create-btn">登录以创建模因</primary-button>
      </section>

      <aside class="right">
        <preview-panel />
      </aside>
    </main>
  </div>
</template>


<script setup>
import CreateCoin from '../components/CreateCoin.vue'
import PreviewPanel from '../components/PreviewPanel.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
</script>


<style scoped>
.app-root{ min-height:100vh; background:var(--bg); color:var(--fg); font-family:Inter,system-ui,Arial; overflow-y: auto;  }
.topbar{ padding:24px 40px; border-bottom:1px solid rgba(255, 255, 255, 0.03)}
.topbar h1{ margin:0; font-size:20px; font-weight:600}
.container{ display:flex; gap:28px; padding:28px 40px; max-width:1200px; margin:0 auto }
.left{ flex:1 }
.right{ width:320px }
.notice{ margin-top:20px; padding:14px; background:var(--panel); border-radius:10px; color:var(--muted); font-size:13px }
.create-btn{ margin-top:18px }


@media (max-width:900px){ .container{flex-direction:column} .right{width:100%} }
</style>