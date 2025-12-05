<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/orders')" class="btn btn-outline mb-4">← Назад</button>
    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="item" class="card p-6">
      <h2>Заказ #{{ item.id }}</h2>
      <div class="details-grid mt-4">
        <p>
          <strong>Статус:</strong> 
          <span class="status-badge" 
                :class="{ 
                    'status-pending': item.status === 'pending',
                    'status-paid': item.status === 'paid',
                    'status-shipped': item.status === 'shipped' || item.status === 'delivered',
                    'status-cancelled': item.status === 'cancelled',
                }">
            {{ item.status }}
          </span>
        </p>
        
        <p><strong>Сумма товаров:</strong> {{ (parseFloat(item.total_amount) - parseFloat(item.shipping_cost)).toFixed(2) }} ₽</p>
        <p><strong>Доставка:</strong> {{ parseFloat(item.shipping_cost).toFixed(2) }} ₽</p>
        <p><strong>Итого к оплате:</strong> {{ parseFloat(item.total_amount).toFixed(2) }} ₽</p>
        
        <p><strong>Получатель:</strong> {{ item.recipient_name || '—' }}</p>
        <p><strong>Телефон:</strong> {{ item.recipient_phone || '—' }}</p>
        <p class="full-width"><strong>Адрес:</strong> {{ item.delivery_address }}</p>

        <template v-if="isAdmin">
          <p><strong>User ID:</strong> {{ item.user_id }}</p>
          <p><strong>Метод оплаты:</strong> {{ item.payment_method || 'Не указан' }}</p>
          <p><strong>Трек-номер:</strong> {{ item.tracking_number || 'Не присвоен' }}</p>
          <p class="full-width"><strong>Комментарий пользователя:</strong> {{ item.user_comment || 'Нет' }}</p>
        </template>
      </div>
    </div>
    <div v-else class="message error">Заказ не найден</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
// Импортируем authService или просто используем localStorage, как в вашем примере
export default {
    setup() {
        const route = useRoute();
        const item = ref(null);
        const loading = ref(true);
        const isAdmin = ref(false);

        onMounted(async () => {
            // Проверка роли админа
            const userStr = localStorage.getItem('user');
            try {
                 isAdmin.value = userStr && JSON.parse(userStr).role === 'admin';
            } catch (e) {
                 isAdmin.value = false;
            }
           
            // Загрузка данных заказа
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/orders/${route.params.id}`, { 
                headers: {'Authorization': `Bearer ${token}`} 
            });
            
            if (res.ok) {
                item.value = await res.json();
                // Преобразуем числовые поля в числа, если они приходят как строки
                item.value.total_amount = parseFloat(item.value.total_amount);
                item.value.shipping_cost = parseFloat(item.value.shipping_cost);
            }
            loading.value = false;
        });

        return { item, loading, isAdmin };
    }
}
</script>