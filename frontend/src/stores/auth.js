// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '', // 登录后的 token
    username: '', // 登录的用户名
    nickname: '', // 登录的昵称
    avatar: '', // 登录的头像
    // server_ip: import.meta.env.VITE_SERVER_IP || 'http://localhost:3000', // 后端服务器地址
    server_ip: 'http://localhost:3000', // 后端服务器地址
    // server_ip: '',
    user_token: '', // 用户 token
    user_role: '', // 用户身份
  }),
  actions: {
    // 设置 token
    setToken(newToken) {
      this.token = newToken;
    },
    // 设置用户名
    setUsername(newUsername) {
      this.username = newUsername;
    },
    // 设置昵称
    setNickname(newNickname) {
      this.nickname = newNickname;
    },
    // 设置头像
    setAvatar(newAvatar) {
      this.avatar = newAvatar;
    },
    // 设置 server_ip
    setServerIp(newServerIp) {
      this.server_ip = newServerIp;
    },
    // 设置 user_token
    setUserToken(newUserToken) {
      this.user_token = newUserToken;
    },
    // 设置身份
    setUserRole(newUserRole) {
      this.user_role = newUserRole;
    },
    // 清除登录状态
    clearAuth() {
      this.token = '';
      this.username = '';
      this.nickname = '';
      this.avatar = '';
      this.user_token = '';
      this.user_role = '';
    },
  },
});

// export searchValue