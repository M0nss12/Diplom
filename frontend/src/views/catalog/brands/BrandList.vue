// CatalogBrandList.vue

<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Бренды</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <p v-if="paginatedItems.length === 0" class="no-results-message text-center p-4">
      Нет брендов для отображения.
    </p>

    <table v-else class="admin-table">
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
          
          <td>
            <a v-if="b.website_url" :href="b.website_url" target="_blank" class="text-link">
              {{ b.website_url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] }}
            </a>
            <span v-else>-</span>
          </td>

          <td>{{ b.year_founded || '-' }}</td>
          <td>{{ b.contact_email || '-' }}</td>
          
          <td>
            <span :class="b.is_popular ? 'badge-green' : ''">
              {{ b.is_popular ? 'Да' : 'Нет' }}
            </span>
          </td>

          <td>{{ b.status }}</td>

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

    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать бренд' : 'Создать бренд' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group"><label>Название *</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Страна</label><input v-model="form.country" class="form-input"></div>
              
              <div class="form-group full-width">
                  <label>Логотип (URL / Загрузка)</label>
                  <input v-model="form.logo_url" class="form-input mb-2" placeholder="Вставьте URL или загрузите файл">
                  <input type="file" ref="fileInput" @change="handleFileChange" class="form-input" accept="image/*">
                  <div v-if="form.logo_url" class="mt-2 text-center">
                      <img :src="form.logo_url" style="max-height: 80px; max-width: 150px; border: 1px solid #ccc; padding: 5px; border-radius: 4px; object-fit: contain;">
                  </div>
              </div>
              <div class="form-group"><label>Сайт (URL)</label><input v-model="form.website_url" class="form-input"></div>
              <div class="form-group"><label>Год основания</label><input v-model="form.year_founded" type="number" class="form-input"></div>
              <div class="form-group"><label>Email контактов</label><input v-model="form.contact_email" class="form-input"></div>
              <div class="form-group"><label>Meta Keywords</label><input v-model="form.meta_keywords" class="form-input"></div>
              <div class="form-group"><label>Статус</label>
                <select v-model="form.status" class="form-input">
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-textarea"></textarea>
            </div>

            <div class="form-group checkbox-group full-width">
              <input type="checkbox" id="pop" v-model="form.is_popular">
              <label for="pop">Популярный бренд (Is Popular)</label>
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
import { onMounted, ref } from 'vue';
import { useCrud } from '@/composables/useCrud';

export default { 
    name: 'CatalogBrandList',
    setup() { 
        const crud = useCrud('brands');
        // ⭐️ НОВЫЙ ref для доступа к инпуту файла
        const fileInput = ref(null); 
        // ⭐️ НОВЫЙ ref для хранения файла
        const uploadedFile = ref(null); 
        
        // ⭐️ НОВАЯ ЛОГИКА: Просто сохраняем выбранный файл
        const handleFileChange = (event) => {
            uploadedFile.value = event.target.files[0];
            // Немедленно показываем превью, если файл выбран (но это не его URL)
            if (uploadedFile.value) {
                // Временно устанавливаем Blob URL для предпросмотра
                crud.form.value.logo_url = URL.createObjectURL(uploadedFile.value);
            }
        };

        // ⭐️ ПЕРЕОПРЕДЕЛЕНИЕ: Теперь saveItem отправляет FormData
        const originalSaveItem = crud.saveItem;
        crud.saveItem = async () => {
            const token = localStorage.getItem('token');
            const url = crud.isEdit.value ? `/api/brands/${crud.form.value.id}` : '/api/brands';
            const method = crud.isEdit.value ? 'PUT' : 'POST';

            // 1. Создаем FormData
            const formData = new FormData();

            // 2. Добавляем все текстовые поля формы
            for (const key in crud.form.value) {
                // Если это файл, пропустим его, мы добавим его ниже
                if (key === 'file' || key === 'logo_url') continue; 
                
                // Обрабатываем булевы значения
                const value = typeof crud.form.value[key] === 'boolean' 
                    ? (crud.form.value[key] ? 'true' : 'false') 
                    : crud.form.value[key] || '';
                
                formData.append(key, value);
            }

            // 3. Добавляем файл, если он есть
            if (uploadedFile.value) {
                // ⭐️ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Имя поля должно быть 'image'
                formData.append('image', uploadedFile.value); 
            } else if (crud.form.value.logo_url) {
                // 4. Если URL введен вручную (не через загрузку), передаем его как текст
                formData.append('logo_url', crud.form.value.logo_url);
            } else if (crud.isEdit.value && !crud.form.value.logo_url) {
                // 5. Если лого удалено (URL сброшен), отправляем пустое поле, чтобы сервер установил NULL
                formData.append('logo_url', '');
            }

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        // Content-Type НЕ нужен, браузер сам установит 'multipart/form-data' с boundary
                    },
                    body: formData
                });

                if (response.ok) {
                    await crud.fetchItems();
                    crud.closeModals();
                    // Сбрасываем refs после успешной операции
                    uploadedFile.value = null; 
                    if (fileInput.value) fileInput.value.value = ''; 
                } else {
                    const errorData = await response.json();
                    alert(`Ошибка сохранения: ${errorData.error || response.statusText}`);
                }
            } catch (error) {
                console.error('Network Error:', error);
                alert('Сетевая ошибка при сохранении данных.');
            }
        };
        // -----------------------------

        // Кастомная логика: установка статуса 'active' по умолчанию при создании и сброс файла
        const originalOpenEdit = crud.openEditModal;
        crud.openEditModal = (item) => {
            originalOpenEdit(item);
            
            // Сброс загрузки файла при открытии модала
            uploadedFile.value = null; 
            if (fileInput.value) fileInput.value.value = ''; 

            if (!item) {
                // Только при создании
                crud.form.value.status = 'active'; 
            }
        };

        // --- Добавляем вызов fetchItems при монтировании ---
        onMounted(() => {
            crud.fetchItems(); 
        });
        
        return {
          // ⭐️ Добавляем refs
          fileInput,
          handleFileChange,
          
          ...crud,
        };
    } 
}
</script>