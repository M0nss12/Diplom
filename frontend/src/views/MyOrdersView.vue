<template>
  <div class="container animate-fade-in" style="margin-top: 2rem;">
    <h1 class="mb-6">📦 Мои заказы</h1>

    <div v-if="loading" class="text-center p-8">
      <div class="loader"></div>
    </div>
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
          <p><strong>Трекинг:</strong> {{ order.tracking_number }}</p>
          <p><strong>Адрес:</strong> {{ order.delivery_address }}</p>
          <p><strong>Получатель:</strong> {{ order.recipient_name }} ({{ order.recipient_phone }})</p>
          <p><strong>Оплата:</strong> {{ order.payment_method }}</p>
          <p><strong>Сумма:</strong> <span class="price">{{ (order.total_amount * 1).toLocaleString() }} ₽</span></p>
        </div>

        <div class="order-actions mt-4 text-right">
          
          <template v-if="order.status === 'pending'">
            <button 
              class="btn btn-outline-danger btn-lg"
              style="margin-right: 15px;"
              @click="cancelOrder(order.id)"
              :disabled="actionId === order.id"
            >
              {{ actionId === order.id ? 'Отменяем...' : '❌ Отменить заказ' }}
            </button>

            <button 
              v-if="order.payment_method !== 'Наличными'"
              class="btn btn-primary btn-lg"
              @click="payOrder(order.id)"
              :disabled="actionId === order.id"
            >
              {{ actionId === order.id ? 'Обработка...' : '💳 Оплатить онлайн' }}
            </button>

            <span v-else class="text-sm" style="color: var(--secondary);">
              Оплата: {{ order.payment_method }}. 
            </span>
          </template>
          
          <span v-else style="font-weight: bold;" :style="{ color: order.status === 'cancelled' ? 'var(--danger)' : 'var(--success)' }">
            {{ order.status === 'cancelled' ? '⛔ Заказ отменен' : '✅ В работе / Получен' }}
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
    const actionId = ref(null);

    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        loading.value = false;
        return;
      }

      try {
        const res = await fetch('/api/orders/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          orders.value = await res.json();
        } else if (res.status === 401) {
          console.warn("Пользователь не авторизован");
        }
      } catch (e) { 
        console.error("Ошибка при получении заказов:", e); 
      } 
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
        
        const data = await res.json();
        
        if (res.ok) {
          await fetchOrders(); 
          alert(`Заказ #${orderId} успешно оплачен! (Тестовый режим)`);
        } else {
          alert(data.error || 'Ошибка оплаты');
        }
      } catch (e) {
        alert('Ошибка сети при оплате');
      } finally {
        actionId.value = null;
      }
    };

    const cancelOrder = async (orderId) => {
      if(!confirm('Вы уверены, что хотите отменить этот заказ? Отмена может быть невозможна, если заказ уже в сборке.')) return;

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
          alert(`Заказ #${orderId} отменен.`);
        } else {
          alert(data.error || 'Ошибка отмены. Возможно, заказ уже в работе.');
        }
      } catch (e) {
        alert('Ошибка сети при отмене');
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
      return 'unknown';
    };

    onMounted(fetchOrders);

    return { 
      orders, 
      loading, 
      actionId, 
      payOrder, 
      cancelOrder, 
      getStatusText, 
      getStatusClass 
    };
  }
}
</script>