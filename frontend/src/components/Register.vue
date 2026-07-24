<template>
  <div>
    <h1>User Registration</h1>
    <form @submit.prevent="registerUser">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="form.username" required />
      </div>
      <div>
        <label for="phoneNumber">Phone Number:</label>
        <input type="text" id="phoneNumber" v-model="form.phoneNumber" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="form.password" required />
      </div>
      <button type="submit">Register</button>
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
          this.message = data.message; // Registration successful
        } else {
          this.message = data.message; // Error message
        }
      } catch (error) {
        console.error('Error calling backend API:', error);
        this.message = 'Server connection failed, please try again later.';
      }
    }
  }
};
</script>

<style>
/* Add some simple styles */
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