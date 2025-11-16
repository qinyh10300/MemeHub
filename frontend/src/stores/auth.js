// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null, // 登录后的 token
    my_username: null, // 登录的用户名
  }),
  actions: {
    // 设置用户名
    setUsername(username) {
      this.my_username = username;
    },
    // 设置 token
    setToken(token) {
      this.token = token;
    },
    // 清除登录状态
    clearAuth() {
      this.token = null;
      this.my_username = null;
    },
  },
});