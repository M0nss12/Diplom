<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>🛒 Заказы</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Клиент</th><th>Товары</th><th>Доставка</th><th>Статус</th><th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in items" :key="o.id">
          <td>{{ o.id }}</td>
          <td>{{ o.recipient_name || o.user_id }}</td>
          <td>{{ o.total_amount }} ₽</td>
          <td>{{ o.shipping_cost }} ₽</td>
          <td>
            <span class="status-badge" :class="o.status">{{ o.status }}</span>
          </td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="openViewModal(o)">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(o)">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(o.id)">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="showViewModal && selectedItem" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>Заказ #{{ selectedItem.id }}</h3>
          <div class="details-grid">
            <p><strong>Получатель:</strong> {{ selectedItem.recipient_name }}</p>
            <p><strong>Сумма товаров:</strong> {{ selectedItem.total_amount }} ₽</p>
            <p><strong>Доставка:</strong> {{ selectedItem.shipping_cost }} ₽</p>
            <p><strong>ИТОГО:</strong> {{ Number(selectedItem.total_amount) + Number(selectedItem.shipping_cost) }} ₽</p>
            <p><strong>Статус:</strong> {{ selectedItem.status }}</p>
            <p class="full-width"><strong>Адрес:</strong> {{ selectedItem.delivery_address }}</p>
          </div>
          <div class="modal-actions">
             <button class="btn btn-secondary" @click="closeModals">Закрыть</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>{{ isEdit ? 'Редактировать' : 'Создать' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="form-group">
              <label>ID Пользователя</label>
              <input v-model="form.user_id" type="number" class="form-input" required>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Сумма товаров</label>
                <input v-model="form.total_amount" type="number" step="0.01" class="form-input" required>
              </div>
              <div class="form-group">
                <label>Стоимость доставки</label>
                <input v-model="form.shipping_cost" type="number" step="0.01" class="form-input">
              </div>
            </div>
            <div class="form-group">
              <label>Статус</label>
              <select v-model="form.status" class="form-input">
                <option value="pending">Ожидает</option>
                <option value="processing">В обработке</option>
                <option value="shipped">Отправлен</option>
                <option value="delivered">Доставлен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            <div class="form-group">
              <label>Адрес доставки</label>
              <input v-model="form.delivery_address" class="form-input" required>
            </div>
            <div class="form-group">
              <label>Получатель</label>
              <input v-model="form.recipient_name" class="form-input">
            </div>
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
import { useCrud } from './useCrud';
export default { setup() { return useCrud('orders'); } }
</script>
