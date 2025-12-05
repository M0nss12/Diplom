<template>
  <div class="container animate-fade-in" style="margin-top: 2rem;">
    <h1 class="mb-6">📦 Мои заказы</h1>

    <div v-if="loading" class="text-center p-8"><div class="loader"></div></div>

    <div v-else-if="orders.length === 0" class="text-center p-8 card">
      <p>У вас пока нет заказов.</p>
      <router-link to="/" class="btn btn-primary mt-4">В каталог</router-link>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="card p-6 mb-4 order-card">
        
        <div class="order-header">
          <div>
            <h3>Заказ #{{ order.id }}</h3>
          </div>
          <div class="order-status">
            <span class="status-badge" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="order-details">
          <p><strong>Адрес:</strong> {{ order.delivery_address }}</p>
          <p><strong>Сумма:</strong> <span class="price">{{ order.total_amount }} ₽</span></p>
        </div>

        <div class="order-actions mt-4 text-right">
          <!-- ЕСЛИ СТАТУС PENDING (ОЖИДАЕТ ОПЛАТЫ) -->
          <template v-if="order.status === 'pending'">
            <!-- Кнопка Отмены -->
            <button 
              class="btn btn-outline-danger btn-sm"
              style="margin-right: 10px;"
              @click="cancelOrder(order.id)"
              :disabled="actionId === order.id"
            >
              {{ actionId === order.id ? '...' : '❌ Отменить' }}
            </button>

            <!-- Кнопка Оплаты -->
            <button 
              class="btn btn-primary btn-sm"
              @click="payOrder(order.id)"
              :disabled="actionId === order.id"
            >
              {{ actionId === order.id ? 'Обработка...' : '💳 Оплатить' }}
            </button>
          </template>
          
          <span v-else style="font-weight: bold;" :style="{ color: order.status === 'cancelled' ? 'var(--danger)' : 'var(--success)' }">
            {{ order.status === 'cancelled' ? '⛔ Заказ отменен' : '✅ Оплачено / В работе' }}
          </span>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const actionId = ref(null); // ID заказа, над которым сейчас идет действие

    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/orders/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          orders.value = await res.json();
        }
      } catch (e) { console.error(e); } 
      finally { loading.value = false; }
    };

    const payOrder = async (orderId) => {
      actionId.value = orderId;
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(`/api/orders/${orderId}/pay`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          await fetchOrders();
          alert('Оплата прошла успешно! (Тестовый режим)');
        } else {
          alert('Ошибка оплаты');
        }
      } catch (e) {
        alert('Ошибка сети');
      } finally {
        actionId.value = null;
      }
    };

    const cancelOrder = async (orderId) => {
      if(!confirm('Вы уверены, что хотите отменить этот заказ?')) return;

      actionId.value = orderId;
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();

        if (res.ok) {
          await fetchOrders();
        } else {
          alert(data.error || 'Ошибка отмены');
        }
      } catch (e) {
        alert('Ошибка сети');
      } finally {
        actionId.value = null;
      }
    };

    const getStatusText = (status) => {
      const map = {
        'pending': 'Ожидает оплаты',
        'paid': 'Оплачен',
        'processing': 'В обработке',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
      };
      return map[status] || status;
    };

    const getStatusClass = (status) => {
      if (status === 'pending') return 'pending';
      if (status === 'cancelled') return 'cancelled';
      if (['paid', 'processing', 'shipped', 'delivered'].includes(status)) return 'delivered';
      return 'cancelled';
    };

    onMounted(fetchOrders);

    return { orders, loading, actionId, payOrder, cancelOrder, getStatusText, getStatusClass };
  }
}
</script>

<style scoped>
.order-header { display: flex; justify-content: space-between; align-items: center; }
.price { font-weight: bold; font-size: 1.2rem; color: var(--dark); }
.divider { margin: 1rem 0; height: 1px; background: var(--gray-light); }

.btn-outline-danger {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  cursor: pointer;
}
.btn-outline-danger:hover {
  background: var(--danger);
  color: white;
}
</style>