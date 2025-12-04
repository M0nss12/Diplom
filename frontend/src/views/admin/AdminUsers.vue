<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>👥 Пользователи</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in items" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td>
            <span :class="u.role === 'admin' ? 'badge-red' : 'badge-green'">{{ u.role }}</span>
          </td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="openViewModal(u)" title="Просмотр">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(u)" title="Редактировать">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(u.id)" title="Удалить">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- VIEW -->
    <div v-if="showViewModal && selectedItem" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content card">
        <h3>Пользователь #{{ selectedItem.id }}</h3>
        <div class="details-grid">
          <p><strong>Имя:</strong> {{ selectedItem.username }}</p>
          <p><strong>Email:</strong> {{ selectedItem.email }}</p>
          <p><strong>Роль:</strong> {{ selectedItem.role }}</p>
          <p><strong>Телефон:</strong> {{ selectedItem.phone || '-' }}</p>
          <p class="full-width"><strong>Адрес:</strong> {{ selectedItem.address || '-' }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModals">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- EDIT -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content card">
        <h3>{{ isEdit ? 'Редактировать' : 'Создать' }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label>Имя</label>
            <input v-model="form.username" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Роль</label>
            <select v-model="form.role" class="form-input">
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Телефон</label>
            <input v-model="form.phone" class="form-input">
          </div>
          <div class="form-group">
            <label>Адрес</label>
            <input v-model="form.address" class="form-input">
          </div>
          <div class="form-group">
            <label>Пароль {{ isEdit ? '(оставьте пустым если не меняете)' : '' }}</label>
            <input v-model="form.password" type="password" class="form-input">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeModals">Отмена</button>
            <button type="submit" class="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useCrud } from './useCrud';
export default { setup() { return useCrud('users'); } }
</script>