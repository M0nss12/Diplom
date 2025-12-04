<template>
  <div class="container animate-fade-in" style="max-width: 400px; margin-top: 3rem;">
    <div class="card p-4">
      <h2 class="text-center mb-4">Вход</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Пароль</label>
          <input v-model="password" type="password" class="form-input" required>
        </div>
        
        <div v-if="error" class="message error">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary w-100">Войти</button>
      </form>
      <p class="text-center mt-4">
        Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const router = useRouter();

    const handleLogin = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.value, password: password.value })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        // Сохраняем токен и данные
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Редирект на главную (перезагрузка чтобы обновить меню)
        window.location.href = '/'; 
      } catch (e) {
        error.value = e.message;
      }
    };

    return { email, password, error, handleLogin };
  }
}
</script>