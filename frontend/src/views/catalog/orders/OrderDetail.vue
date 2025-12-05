<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/orders')" class="btn btn-outline mb-4">← Назад</button>
    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="item" class="card p-6">
      <h2>Заказ #{{ item.id }}</h2>
      <div class="details-grid mt-4">
        <p><strong>Статус:</strong> <span class="status-badge" :class="item.status">{{ item.status }}</span></p>
        <p><strong>Сумма товаров:</strong> {{ item.total_amount }} ₽</p>
        <p><strong>Доставка:</strong> {{ item.shipping_cost }} ₽</p>
        <p><strong>Итого:</strong> {{ Number(item.total_amount) + Number(item.shipping_cost) }} ₽</p>
        <p><strong>Получатель:</strong> {{ item.recipient_name }}</p>
        <p><strong>Телефон:</strong> {{ item.recipient_phone }}</p>
        <p class="full-width"><strong>Адрес:</strong> {{ item.delivery_address }}</p>

        <!-- ТОЛЬКО ДЛЯ АДМИНА -->
        <template v-if="isAdmin">
          <p><strong>User ID:</strong> {{ item.user_id }}</p>
          <p><strong>Метод оплаты:</strong> {{ item.payment_method }}</p>
          <p><strong>Трек-номер:</strong> {{ item.tracking_number || 'Не присвоен' }}</p>
          <p class="full-width"><strong>Комментарий пользователя:</strong> {{ item.user_comment || 'Нет' }}</p>
        </template>
      </div>
    </div>
    <div v-else class="message error">Не найдено</div>
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
    const isAdmin = ref(false);

    onMounted(async () => {
      const userStr = localStorage.getItem('user');
      isAdmin.value = userStr && JSON.parse(userStr).role === 'admin';
      
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${route.params.id}`, { headers: {'Authorization': `Bearer ${token}`} });
      if (res.ok) item.value = await res.json();
      loading.value = false;
    });
    return { item, loading, isAdmin };
  }
}
</script>