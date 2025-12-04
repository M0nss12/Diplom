<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>📦 Товары</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Фото</th><th>Название</th><th>Цена</th><th>Остаток</th><th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in items" :key="p.id">
          <td>{{ p.id }}</td>
          <td>
            <img v-if="p.image_url" :src="p.image_url" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
            <span v-else>-</span>
          </td>
          <td>{{ p.name }}</td>
          <td>{{ p.price }} ₽</td>
          <td>{{ p.quantity_in_stock }}</td>
          <td class="actions-cell">
            <button class="btn-sm view" @click="openViewModal(p)">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(p)">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(p.id)">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- VIEW MODAL (ПОЛНЫЙ ПРОСМОТР) -->
    <Teleport to="body">
      <div v-if="showViewModal && selectedItem" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card">
          <h3>{{ selectedItem.name }}</h3>
          
          <!-- Блок с фото -->
          <div class="modal-img-container">
            <img v-if="selectedItem.image_url" :src="selectedItem.image_url" class="modal-img" alt="Фото товара">
            <div v-else class="no-image">Нет изображения</div>
          </div>

          <div class="details-grid">
            <p><strong>ID:</strong> {{ selectedItem.id }}</p>
            <p><strong>Артикул (SKU):</strong> {{ selectedItem.sku || '-' }}</p>
            <p><strong>Цена:</strong> {{ selectedItem.price }} ₽</p>
            <p><strong>Старая цена:</strong> {{ selectedItem.old_price ? selectedItem.old_price + ' ₽' : '-' }}</p>
            <p><strong>Вес:</strong> {{ selectedItem.weight ? selectedItem.weight + ' кг' : '-' }}</p>
            <p><strong>Остаток:</strong> {{ selectedItem.quantity_in_stock }} шт.</p>
            <p><strong>Категория ID:</strong> {{ selectedItem.category_id }}</p>
            <p><strong>Бренд ID:</strong> {{ selectedItem.brand_id }}</p>
            <p><strong>Рейтинг:</strong> ⭐ {{ selectedItem.rating }}</p>
            <p><strong>Популярный:</strong> {{ selectedItem.is_featured ? 'Да ✅' : 'Нет ❌' }}</p>
            <p class="full-width"><strong>Описание:</strong><br>{{ selectedItem.description || 'Нет описания' }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModals">Закрыть</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- EDIT MODAL (РЕДАКТИРОВАНИЕ) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать' : 'Создать' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group">
                <label>Название</label>
                <input v-model="form.name" class="form-input" required>
              </div>
              <div class="form-group">
                <label>Артикул</label>
                <input v-model="form.sku" class="form-input">
              </div>
              <div class="form-group">
                <label>Цена</label>
                <input v-model="form.price" type="number" step="0.01" class="form-input" required>
              </div>
              <div class="form-group">
                <label>Старая цена</label>
                <input v-model="form.old_price" type="number" step="0.01" class="form-input">
              </div>
              <div class="form-group">
                <label>Вес (кг)</label>
                <input v-model="form.weight" type="number" step="0.001" class="form-input">
              </div>
              <div class="form-group">
                <label>Количество</label>
                <input v-model="form.quantity_in_stock" type="number" class="form-input">
              </div>
              <div class="form-group">
                <label>Ссылка на фото</label>
                <input v-model="form.image_url" class="form-input" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>Категория ID</label>
                <input v-model="form.category_id" type="number" class="form-input">
              </div>
              <div class="form-group">
                <label>Бренд ID</label>
                <input v-model="form.brand_id" type="number" class="form-input">
              </div>
              <div class="form-group">
                <label>Рейтинг</label>
                <input v-model="form.rating" type="number" step="0.1" max="5" class="form-input">
              </div>
            </div>
            <div class="form-group">
               <label>Описание</label>
               <textarea v-model="form.description" class="form-input"></textarea>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="feat" v-model="form.is_featured">
              <label for="feat">Популярный товар</label>
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
export default { setup() { return useCrud('products'); } }
</script>