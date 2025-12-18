<script setup>
import Search from '../components/Search.vue'
import FeaturedProjects from '../components/FeaturedProject.vue'
import SmartRecommend from '../components/home/SmartRecommend.vue'
</script>

<template>
  <main>
    <header class="content-header">
      <h1 class="fancy-title">欢迎来到MemeHub🤗🤗🤗</h1>
      <p class="fancy-subtitle">进行愉快的模因创作和模因币交易吧！</p>
    </header>
      <div class="search-wrapper">
        <Search />
      </div>
      <div class="recommend-section">
        <SmartRecommend />
      </div>
      <div class="content-card">
        <FeaturedProjects />
      </div>
  </main>
</template>

<style scoped>

.search-wrapper {
  width: 100%;
  max-width: 500px;
  display: flex;
  margin: 0 auto;
}

.recommend-section {
  width: 1250px;
  max-width: 100%;
  margin: 30px auto;
  padding: 0 20px;
  box-sizing: border-box;
}

/* .content-header {
  text-align: center;
  margin-bottom: 30px;
}

.content-header h1 {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.content-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.content-card {
  width: 1250px;
  margin: 0 auto;    
  box-sizing: border-box;
  background-color: #000000;
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }
} */

.content-header {
  text-align: center;
  margin-bottom: 30px;
}

/* 主标题样式 */
.fancy-title {
  font-size: 36px; /* 增大字体 */
  color: #80da80; /* 暗绿色 */
  font-weight: bold; /* 加粗字体 */
  letter-spacing: 2px; /* 增加字间距 */
  margin-bottom: 10px;
}

/* 副标题样式 */
.fancy-subtitle {
  font-size: 20px; /* 调整字体大小 */
  color: #4b8966; /* 浅暗绿色 */
  font-family: 'Arial', sans-serif; /* 改为无衬线字体 */
  font-style: italic; /* 添加斜体 */
  margin-top: 5px;
}
</style>