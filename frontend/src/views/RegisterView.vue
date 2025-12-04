<template>
  <div class="container animate-fade-in" style="max-width: 400px; margin-top: 3rem;">
    <div class="card p-4">
      <h2 class="text-center mb-4">Регистрация</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Имя пользователя</label>
          <input v-model="username" type="text" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Пароль</label>
          <input v-model="password" type="password" class="form-input" required>
        </div>
        
        <div v-if="error" class="message error">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary w-100">Создать аккаунт</button>
      </form>
      <p class="text-center mt-4">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const router = useRouter();

    const handleRegister = async () => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: username.value, 
            email: email.value, 
            password: password.value 
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        alert('Регистрация успешна! Теперь войдите.');
        router.push('/login');
      } catch (e) {
        error.value = e.message;
      }
    };

    return { username, email, password, error, handleRegister };
  }
}
</script>