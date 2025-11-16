// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '', // 登录后的 token
    username: '', // 登录的用户名
    my_username: '', // 兼容 qyh 版本的字段名
  }),
  actions: {
    // 设置 token
    setToken(newToken) {
      this.token = newToken;
    },
    // 设置用户名（同时设置两个字段以保持兼容）
    setUsername(newUsername) {
      this.username = newUsername;
      this.my_username = newUsername;
    },
    // 清除登录状态
    clearAuth() {
      this.token = '';
      this.username = '';
      this.my_username = '';
    },
  },
});