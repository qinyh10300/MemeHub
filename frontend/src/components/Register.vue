<template>
  <div>
    <h1>用户注册</h1>
    <form @submit.prevent="registerUser">
      <div>
        <label for="username">用户名：</label>
        <input type="text" id="username" v-model="form.username" required />
      </div>
      <div>
        <label for="phoneNumber">手机号：</label>
        <input type="text" id="phoneNumber" v-model="form.phoneNumber" required />
      </div>
      <div>
        <label for="password">密码：</label>
        <input type="password" id="password" v-model="form.password" required />
      </div>
      <button type="submit">注册</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        phoneNumber: '',
        password: ''
      },
      message: ''
    };
  },
  methods: {
    async registerUser() {
      try {
        const response = await fetch(`${server_ip}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.form)
        });

        const data = await response.json();

        if (response.ok) {
          this.message = data.message; // 注册成功
        } else {
          this.message = data.message; // 错误信息
        }
      } catch (error) {
        console.error('调用后端 API 时出错:', error);
        this.message = '服务器连接失败，请稍后再试。';
      }
    }
  }
};
</script>

<style>
/* 添加一些简单的样式 */
form {
  max-width: 400px;
  margin: 0 auto;
}
div {
  margin-bottom: 10px;
}
button {
  padding: 5px 10px;
}
</style>