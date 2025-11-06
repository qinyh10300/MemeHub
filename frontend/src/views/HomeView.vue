<script setup>
import Search from '../components/Search.vue'
import FeaturedProjects from '../components/FeaturedProject.vue'
</script>

<template>
  <main>
    <!-- <TheWelcome /> -->
     <header class="content-header">
        <h1>Welcome to our platform</h1>
        <p>Explore and discover amazing projects</p>
      </header>
      <div class="search-wrapper">
        <Search />
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

.content-header {
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
  width: 100%;
  max-width: 1200px; 
  margin: 0 auto;    
  box-sizing: border-box;
  background-color: #0b0b0b;
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }
}
</style>