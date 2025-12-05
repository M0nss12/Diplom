<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Категории</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <!-- Видно ВСЕМ -->
          <th>ID</th>
          <th>Фото</th>
          <th>Название</th>
          <th>Скидка</th>
          
          <!-- ТОЛЬКО АДМИН -->
          <template v-if="isAdmin">
            <th>Slug</th>
            <th>Родитель</th>
            <th>Сортировка</th>
            <th>Meta Title</th>
            <th>Активна</th>
          </template>
          
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="c in paginatedItems" :key="c.id">
          <!-- Скрываем категорию, если она неактивна и пользователь не админ -->
          <tr v-if="isAdmin || c.is_active">
            
            <!-- Видно ВСЕМ -->
            <td>{{ c.id }}</td>
            <td>
              <img v-if="c.image_url" :src="c.image_url" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
              <span v-else>-</span>
            </td>
            <td>{{ c.name }}</td>
            <td>{{ c.discount_percent }}%</td>

            <!-- ТОЛЬКО АДМИН -->
            <template v-if="isAdmin">
              <td>{{ c.slug }}</td>
              <td>{{ c.parent_id || 'Нет' }}</td>
              <td>{{ c.sort_order }}</td>
              <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">{{ c.meta_title || '-' }}</td>
              <td>
                <span :class="c.is_active ? 'badge-green' : 'badge-red'">
                  {{ c.is_active ? 'Да' : 'Нет' }}
                </span>
              </td>
            </template>
            
            <td class="actions-cell">
              <button class="btn-sm view" @click="$router.push(`/catalog/categories/${c.id}`)" title="Просмотр">👁️</button>
              <template v-if="isAdmin">
                <button class="btn-sm edit" @click="openEditModal(c)" title="Редактировать">✏️</button>
                <button class="btn-sm delete" @click="deleteItem(c.id)" title="Удалить">🗑️</button>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div class="pagination mt-4" v-if="totalPages > 1">
      <button class="btn btn-outline" :disabled="page === 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ totalPages }}</span>
      <button class="btn btn-outline" :disabled="page === totalPages" @click="nextPage">Вперед</button>
    </div>

    <!-- МОДАЛКА (ТОЛЬКО ДЛЯ АДМИНА - ВСЕ ПОЛЯ) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать категорию' : 'Создать категорию' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group"><label>Название *</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Slug (URL)</label><input v-model="form.slug" class="form-input"></div>
              <div class="form-group"><label>Родитель ID</label><input v-model="form.parent_id" type="number" class="form-input"></div>
              <div class="form-group"><label>Сортировка</label><input v-model="form.sort_order" type="number" class="form-input"></div>
              <div class="form-group"><label>Скидка (%)</label><input v-model="form.discount_percent" type="number" class="form-input"></div>
              <div class="form-group"><label>Meta Title</label><input v-model="form.meta_title" class="form-input"></div>
              <div class="form-group"><label>URL Картинки</label><input v-model="form.image_url" class="form-input"></div>
            </div>
            
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-textarea"></textarea>
            </div>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="act" v-model="form.is_active">
              <label for="act">Активна (Is Active)</label>
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
export default { setup() { return useCrud('categories'); } }
</script>

<style scoped>
.pagination { display: flex; justify-content: center; gap: 15px; padding-top: 10px; }
</style>