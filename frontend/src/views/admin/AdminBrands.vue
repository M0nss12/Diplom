<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>🏷️ Бренды</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Лого</th><th>Название</th><th>Страна</th><th>Статус</th><th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in items" :key="b.id">
          <td>{{ b.id }}</td>
          <td>
             <img v-if="b.logo_url" :src="b.logo_url" alt="" style="width: 30px; height: 30px; object-fit: contain;">
             <span v-else>-</span>
          </td>
          <td>{{ b.name }}</td>
          <td>{{ b.country || '-' }}</td>
          <td>{{ b.status }}</td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="openViewModal(b)">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(b)">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(b.id)">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="showViewModal && selectedItem" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>Бренд: {{ selectedItem.name }}</h3>
          
          <!-- Логотип -->
          <div class="modal-img-container">
            <img v-if="selectedItem.logo_url" :src="selectedItem.logo_url" class="modal-img" alt="Логотип">
            <div v-else class="no-image">Нет логотипа</div>
          </div>

          <div class="details-grid">
            <p><strong>Страна:</strong> {{ selectedItem.country }}</p>
            <p><strong>Статус:</strong> {{ selectedItem.status }}</p>
            <p><strong>Год основания:</strong> {{ selectedItem.year_founded || '-' }}</p>
            <p><strong>Сайт:</strong> <a :href="selectedItem.website_url" target="_blank">{{ selectedItem.website_url }}</a></p>
            <p><strong>Email:</strong> {{ selectedItem.contact_email || '-' }}</p>
            <p><strong>Популярный:</strong> {{ selectedItem.is_popular ? 'Да ⭐' : 'Нет' }}</p>
            <p class="full-width"><strong>SEO Keywords:</strong> {{ selectedItem.meta_keywords || '-' }}</p>
            <p class="full-width"><strong>Описание:</strong> {{ selectedItem.description }}</p>
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
              <label>Страна</label>
              <input v-model="form.country" class="form-input">
            </div>
            <div class="form-group">
              <label>Ссылка на логотип</label>
              <input v-model="form.logo_url" class="form-input">
            </div>
            <div class="form-group">
              <label>Статус</label>
              <select v-model="form.status" class="form-input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="form-group">
              <label>Сайт</label>
              <input v-model="form.website_url" class="form-input">
            </div>
            <div class="form-group">
              <label>Год основания</label>
              <input v-model="form.year_founded" type="number" class="form-input">
            </div>
            <div class="form-group">
              <label>Email контактов</label>
              <input v-model="form.contact_email" type="email" class="form-input">
            </div>
            <div class="form-group">
              <label>SEO Keywords</label>
              <input v-model="form.meta_keywords" class="form-input">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-input"></textarea>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="pop" v-model="form.is_popular">
              <label for="pop">Популярный</label>
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