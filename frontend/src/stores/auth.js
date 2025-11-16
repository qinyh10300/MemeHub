// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    username: '',
  }),
  actions: {
    setToken(newToken) {
      this.token = newToken;
    },
    setUsername(newUsername) {
      this.username = newUsername;
    },
    clearAuth() {
      this.token = '';
      this.username = '';
    },
  },
});