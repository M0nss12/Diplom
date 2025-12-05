<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Заказы</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Создать</button>
    </div>
    
    <p v-if="paginatedItems.length === 0" class="no-results-message text-center p-4">
        {{ isAdmin ? 'Нет заказов в системе' : 'Нет ваших заказов' }}
    </p>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Клиент (User ID)</th>
          <th>Сумма</th>
          <th>Статус</th>
          
          <template v-if="isAdmin">
            <th>Оплата</th>
            <th>Доставка (цена)</th>
            <th>Трек-номер</th>
            <th>Комментарий</th>
          </template>
          
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in paginatedItems" :key="o.id">
          <td>{{ o.id }}</td>
          <td>{{ o.recipient_name || '—' }} (ID: {{ o.user_id }})</td>
          <td>{{ o.total_amount }} ₽</td>
          <td>
            <span class="status-badge" 
                  :class="{ 
                      'status-pending': o.status === 'pending',
                      'status-paid': o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered',
                      'status-cancelled': o.status === 'cancelled',
                  }">
                  {{ o.status }}
            </span>
          </td>

          <template v-if="isAdmin">
            <td>{{ o.payment_method }}</td>
            <td>{{ o.shipping_cost }} ₽</td>
            <td>{{ o.tracking_number || '-' }}</td>
            <td>{{ o.user_comment ? 'Есть' : '-' }}</td>
          </template>

          <td class="actions-cell">
            <button class="btn-sm view" @click="$router.push(`/catalog/orders/${o.id}`)" title="Просмотр">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(o)" title="Ред">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(o.id)" title="Удал">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination mt-4" v-if="totalPages > 1">
      <button class="btn btn-outline" :disabled="page === 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ totalPages }}</span>
      <button class="btn btn-outline" :disabled="page === totalPages" @click="nextPage">Вперед</button>
    </div>

    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать заказ' : 'Создать заказ' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group"><label>User ID</label><input v-model="form.user_id" type="number" class="form-input" required></div>
              <div class="form-group"><label>Сумма</label><input v-model="form.total_amount" type="number" step="0.01" class="form-input" required></div>
              <div class="form-group"><label>Статус</label>
                <select v-model="form.status" class="form-input">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="form-group"><label>Метод оплаты</label><input v-model="form.payment_method" class="form-input"></div>
              <div class="form-group"><label>Стоимость доставки</label><input v-model="form.shipping_cost" type="number" step="0.01" class="form-input"></div>
              <div class="form-group"><label>Трек-номер</label><input v-model="form.tracking_number" class="form-input"></div>
              <div class="form-group"><label>Имя получателя</label><input v-model="form.recipient_name" class="form-input"></div>
              <div class="form-group"><label>Телефон</label><input v-model="form.recipient_phone" class="form-input"></div>
            </div>
            <div class="form-group"><label>Адрес доставки</label><input v-model="form.delivery_address" class="form-input" required></div>
            <div class="form-group"><label>Комментарий пользователя</label><textarea v-model="form.user_comment" class="form-textarea"></textarea></div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeModals">Отмена</button>
              <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { onMounted } from 'vue'; // <--- Импортируем onMounted
import { useCrud } from '@/composables/useCrud';

export default { 
    name: 'CatalogOrderList',
    setup() { 
        const crud = useCrud('orders');
        
        // --- Добавляем вызов fetchItems при монтировании ---
        onMounted(() => {
            crud.fetchItems(); 
        });

        return { ...crud }; 
    } 
}
</script>