<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Клиенты</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>
    <table class="admin-table">
      <thead>
        <tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Действия</th></tr>
      </thead>
      <tbody>
        <!-- Проверка на наличие данных -->
        <tr v-if="paginatedItems.length === 0">
          <td colspan="5" class="text-center p-4">Нет данных или недостаточно прав</td>
        </tr>
        
        <tr v-for="u in paginatedItems" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td><span :class="u.role === 'admin' ? 'badge-red' : 'badge-green'">{{ u.role }}</span></td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="$router.push(`/catalog/users/${u.id}`)">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(u)">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(u.id)">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ПАГИНАЦИЯ -->
    <div class="pagination mt-4" v-if="totalPages > 1">
      <button class="btn btn-outline" :disabled="page === 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ totalPages }}</span>
      <button class="btn btn-outline" :disabled="page === totalPages" @click="nextPage">Вперед</button>
    </div>
    
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>{{ isEdit ? 'Редактировать' : 'Создать' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="form-group"><label>Имя</label><input v-model="form.username" class="form-input" required></div>
            <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="form-input" required></div>
            <div class="form-group"><label>Роль</label>
              <select v-model="form.role" class="form-input"><option value="client">Client</option><option value="admin">Admin</option></select>
            </div>
            <div class="form-group"><label>Телефон</label><input v-model="form.phone" class="form-input"></div>
            <div class="form-group"><label>Адрес</label><input v-model="form.address" class="form-input"></div>
            
            <div class="form-group">
                <label>Пароль</label>
                <input v-model="form.password" type="password" class="form-input" :placeholder="isEdit ? 'Оставьте пустым, если не меняете' : 'Обязательно для новых'">
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
import { useCrud } from '@/composables/useCrud';
export default { setup() { return useCrud('users'); } }
</script>