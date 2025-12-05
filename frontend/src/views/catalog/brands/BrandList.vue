<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Бренды</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Лого</th>
          <th>Название</th>
          <th>Страна</th>
          <th>Сайт</th>
          <th>Год</th>
          <th>Email</th>
          <th>Популярный</th>
          <th>Статус</th>
          
          <!-- Только для админа -->
          <template v-if="isAdmin">
            <th>Meta Keys</th>
          </template>
          
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in paginatedItems" :key="b.id">
          <td>{{ b.id }}</td>
          <td>
             <img v-if="b.logo_url" :src="b.logo_url" style="width: 40px; height: 40px; object-fit: contain;">
             <span v-else>-</span>
          </td>
          <td>{{ b.name }}</td>
          <td>{{ b.country || '-' }}</td>
          
          <!-- Ссылка вместо слова Link -->
          <td>
            <a v-if="b.website_url" :href="b.website_url" target="_blank" class="text-link">
              {{ b.website_url }}
            </a>
            <span v-else>-</span>
          </td>

          <td>{{ b.year_founded || '-' }}</td>
          <td>{{ b.contact_email || '-' }}</td>
          
          <!-- Популярный: Да/Нет -->
          <td>
            <span :class="b.is_popular ? 'badge-green' : ''">
              {{ b.is_popular ? 'Да' : 'Нет' }}
            </span>
          </td>

          <td>{{ b.status }}</td>

          <!-- Только для админа -->
          <template v-if="isAdmin">
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ b.meta_keywords || '-' }}
            </td>
          </template>

          <td class="actions-cell">
            <button class="btn-sm view" @click="$router.push(`/catalog/brands/${b.id}`)" title="Просмотр">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(b)" title="Редактировать">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(b.id)" title="Удалить">🗑️</button>
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

    <!-- МОДАЛКА (РЕДАКТИРОВАНИЕ) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать бренд' : 'Создать бренд' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group"><label>Название *</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Страна</label><input v-model="form.country" class="form-input"></div>
              <div class="form-group"><label>Сайт (URL)</label><input v-model="form.website_url" class="form-input"></div>
              <div class="form-group"><label>Логотип (URL)</label><input v-model="form.logo_url" class="form-input"></div>
              <div class="form-group"><label>Год основания</label><input v-model="form.year_founded" type="number" class="form-input"></div>
              <div class="form-group"><label>Email контактов</label><input v-model="form.contact_email" class="form-input"></div>
              <div class="form-group"><label>Meta Keywords</label><input v-model="form.meta_keywords" class="form-input"></div>
              <div class="form-group"><label>Статус</label>
                <select v-model="form.status" class="form-input">
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-textarea"></textarea>
            </div>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="pop" v-model="form.is_popular">
              <label for="pop">Популярный бренд (Is Popular)</label>
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
export default { 
  setup() { 
    const crud = useCrud('brands');
    const originalOpenEdit = crud.openEditModal;
    crud.openEditModal = (item) => {
      originalOpenEdit(item);
      if (!item) crud.form.value.status = 'active';
    };
    return crud;
  } 
}
</script>

<style scoped>
.pagination { display: flex; justify-content: center; gap: 15px; padding-top: 10px; }
.text-link { color: var(--primary); text-decoration: underline; }
</style>