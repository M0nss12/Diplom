<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/users')" class="btn btn-outline mb-4">← Назад</button>
    
    <div v-if="loading" class="text-center p-4">
        <div class="loader"></div>
    </div>
    
    <div v-else-if="item" class="card p-6">
      <h2>Пользователь: {{ item.username }}</h2>
      <div class="details-grid mt-4">
        <p><strong>ID:</strong> {{ item.id }}</p>
        <p><strong>Email:</strong> {{ item.email }}</p>
        <p><strong>Роль:</strong> 
            <span :class="item.role === 'admin' ? 'badge-red' : 'badge-green'">{{ item.role }}</span>
        </p>
        <p><strong>Телефон:</strong> {{ item.phone || 'Не указан' }}</p>
        <p style="grid-column: 1/-1;"><strong>Адрес:</strong> {{ item.address || 'Не указан' }}</p>
      </div>
    </div>
    
    <div v-else class="message error">
        <p>Пользователь не найден или у вас нет прав на просмотр.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const item = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Нет токена авторизации");
            loading.value = false;
            return;
        }

        const res = await fetch(`/api/users/${route.params.id}`, { 
            headers: {
                'Authorization': `Bearer ${token}`
            } 
        });
        
        if (res.ok) {
            item.value = await res.json();
        } else {
            console.error("Ошибка сервера:", res.status);
        }
      } catch (e) {
        console.error("Ошибка сети:", e);
      } finally {
        loading.value = false;
      }
    });

    return { item, loading };
  }
}
</script>