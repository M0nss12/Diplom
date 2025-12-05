<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Категории</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <p v-if="paginatedItems.length === 0" class="no-results-message text-center p-4">
        Нет категорий для отображения.
    </p>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Фото</th>
          <th>Название</th>
          <th>Скидка</th>
          
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
          <tr v-if="isAdmin || c.is_active">
            
            <td>{{ c.id }}</td>
            <td>
              <img v-if="c.image_url" :src="c.image_url" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
              <span v-else>-</span>
            </td>
            <td>{{ c.name }}</td>
            <td>{{ c.discount_percent || 0 }}%</td>

            <template v-if="isAdmin">
              <td>{{ c.slug }}</td>
              <td>{{ c.parent_id || 'Нет' }}</td>
              <td>{{ c.sort_order }}</td>
              <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ c.meta_title || '-' }}</td>
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

              <div class="form-group full-width">
                  <label>URL Картинки / Загрузка фото</label>
                  <input v-model="form.image_url" class="form-input mb-2" placeholder="Вставьте URL или загрузите файл">
                  <input type="file" @change="handleFileUpload" class="form-input" accept="image/*">
                  <div v-if="form.image_url" class="mt-2 text-center">
                      <img :src="form.image_url" style="max-height: 100px; border: 1px solid #ccc; border-radius: 4px;">
                  </div>
              </div>
              </div>
            
            <div class="form-group full-width">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-textarea"></textarea>
            </div>

            <div class="form-group checkbox-group full-width">
              <input type="checkbox" id="act" v-model="form.is_active">
              <label for="act">Активна (Is Active)</label>
            </div>

            <div class="modal-actions full-width">
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
import { onMounted } from 'vue'; 
import { useCrud } from '@/composables/useCrud';

export default { 
    name: 'CatalogCategoryList',
    setup() { 
      const crud = useCrud('categories');
        
      // --- ЛОГИКА ЗАГРУЗКИ ФАЙЛА (ВЗЯТАЯ ИЗ ProductList) ---
      const handleFileUpload = async (event) => {
          const file = event.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('image', file);

          try {
              const token = localStorage.getItem('token');
              const res = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
              });

              if (res.ok) {
                  const data = await res.json();
                  // Обновляем image_url категории
                  crud.form.value.image_url = data.url; 
              } else {
                  alert('Ошибка загрузки фото');
              }
          } catch (e) {
              console.error(e);
              alert('Ошибка сети при загрузке');
          }
      };
      // ----------------------------------------------------

      onMounted(() => {
          crud.fetchItems(); 
      });

      return { 
        ...crud,
        handleFileUpload // Добавляем функцию в контекст
      }; 
    } 
}
</script>