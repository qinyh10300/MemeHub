<template>
  <div v-if="userData">
    <ProfileHeader :userData="userData" />
    <ProfileStats :userData="userData" />
    <Tabs :userData="userData" />
  </div>
  <div v-else>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import Tabs from '@/components/profile/Tabs.vue'

import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';

const route = useRoute(); // 获取路由实例
const userId = route.params.id; // 获取动态路由参数 :id

// 使用 store
const authStore = useAuthStore();
// authStore.token获取token

// 获取全局用户名
const myUsername = authStore.my_username;

// 模拟加载用户数据
const userData = {
  id: userId,
  avatar: `https://i.pravatar.cc/150?img=12`, // 根据用户 ID 动态生成头像
  nickname: `用户${userId}`,  // TODO: 查询这个用户id的个人信息并显示
  username: `@${myUsername}`,
  bio: `这是用户 ${userId} 的个人简介。`,
  followers: 123,
  following: 456,
  likes: 789,
  memesData: {
  '我创作的模因': Array.from({ length: 23 }, (_, i) => ({
    image: `https://placekitten.com/100/100?image=${i}`,
    name: `模因名称 ${i + 1}`,
    code: `M${i + 1}`,
    description: `这是模因 ${i + 1} 的描述信息。`,
    id: `模因id ${i + 1}`,
  })),
  '我的模因币': Array.from({ length: 8 }, (_, i) => ({
    image: `https://placekitten.com/100/100?image=${i + 50}`,
    name: `模因币 ${i + 1}`,
    code: `C${i + 1}`,
    description: `模因币 ${i + 1} 描述。`,
    id: `模因id ${i + 1}`,
  })),
  '我的收藏': Array.from({ length: 15 }, (_, i) => ({
    image: `https://placekitten.com/100/100?image=${i + 100}`,
    name: `收藏模因 ${i + 1}`,
    code: `S${i + 1}`,
    description: `收藏模因 ${i + 1} 描述。`,
    id: `模因id ${i + 1}`,
  })),
  '粉丝': Array.from({ length: 23 }, (_, i) => ({
    image: `https://placekitten.com/100/100?image=${i}`,
    name: `粉丝名称 ${i + 1}`,
    code: `粉丝代号${i + 1}`,
    description: `这是粉丝 ${i + 1} 的描述信息。`,
    id: `模因id ${i + 1}`,
  })),
}
};

</script>