<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>📂 Категории</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Название</th><th>Slug</th><th>Скидка</th><th>Активна</th><th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in items" :key="c.id">
          <td>{{ c.id }}</td>
          <td>{{ c.name }}</td>
          <td>{{ c.slug }}</td>
          <td>{{ c.discount_percent }}%</td>
          <td>{{ c.is_active ? '✅' : '⛔' }}</td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="openViewModal(c)">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(c)">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(c.id)">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="showViewModal && selectedItem" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>Категория: {{ selectedItem.name }}</h3>
          
          <!-- Фото категории -->
          <div class="modal-img-container" v-if="selectedItem.image_url">
            <img :src="selectedItem.image_url" class="modal-img" alt="Фото категории">
          </div>

          <div class="details-grid">
            <p><strong>ID:</strong> {{ selectedItem.id }}</p>
            <p><strong>Slug (URL):</strong> {{ selectedItem.slug }}</p>
            <p><strong>Родитель ID:</strong> {{ selectedItem.parent_id || 'Нет' }}</p>
            <p><strong>Скидка:</strong> {{ selectedItem.discount_percent }}%</p>
            <p><strong>Сортировка:</strong> {{ selectedItem.sort_order }}</p>
            <p><strong>Meta Title:</strong> {{ selectedItem.meta_title || '-' }}</p>
            <p><strong>Активна:</strong> {{ selectedItem.is_active ? 'Да' : 'Нет' }}</p>
            <p class="full-width"><strong>Описание:</strong> {{ selectedItem.description || '-' }}</p>
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
              <label>Название</label>
              <input v-model="form.name" class="form-input" required>
            </div>
            <div class="form-group">
              <label>Slug (URL)</label>
              <input v-model="form.slug" class="form-input">
            </div>
            <div class="form-group">
              <label>Ссылка на картинку</label>
              <input v-model="form.image_url" class="form-input">
            </div>
            <div class="form-group">
              <label>Скидка (%)</label>
              <input v-model="form.discount_percent" type="number" class="form-input">
            </div>
            <div class="form-group">
              <label>Родитель ID</label>
              <input v-model="form.parent_id" type="number" class="form-input">
            </div>
            <div class="form-group">
              <label>Meta Title (SEO)</label>
              <input v-model="form.meta_title" class="form-input">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-input"></textarea>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="act" v-model="form.is_active">
              <label for="act">Активна</label>
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
export default { setup() { return useCrud('categories'); } }
</script>