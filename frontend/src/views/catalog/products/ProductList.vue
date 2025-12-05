<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>Список товаров</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Фото</th>
          <th>Название</th>
          <th>Цена</th>
          
          <!-- ВИДНО ВСЕМ -->
          <th>Остаток</th>
          <th>Вес</th>

          <!-- ТОЛЬКО АДМИН -->
          <template v-if="isAdmin">
            <th>Артикул (SKU)</th>
            <th>Категория ID</th>
            <th>Бренд ID</th>
            <th>Топ?</th>
          </template>
          
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paginatedItems" :key="p.id">
          <td>{{ p.id }}</td>
          <td>
            <img v-if="p.image_url" :src="p.image_url" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
            <span v-else>-</span>
          </td>
          <td>{{ p.name }}</td>
          <td>
            {{ p.price }} ₽ 
            <span v-if="p.old_price && isAdmin" style="text-decoration: line-through; color: #999; font-size: 0.8em;">{{ p.old_price }}</span>
          </td>

          <!-- ВИДНО ВСЕМ -->
          <td>{{ p.quantity_in_stock }}</td>
          <td>{{ p.weight }}</td>

          <!-- ТОЛЬКО АДМИН -->
          <template v-if="isAdmin">
            <td>{{ p.sku || '-' }}</td>
            <td>{{ p.category_id }}</td>
            <td>{{ p.brand_id }}</td>
            <td>{{ p.is_featured ? '★' : '' }}</td>
          </template>

          <td class="actions-cell">
            <button class="btn-sm cart-add" @click="handleAddToCart(p)" title="В корзину">🛒</button>
            <button class="btn-sm view" @click="$router.push(`/catalog/products/${p.id}`)" title="Просмотр">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm edit" @click="openEditModal(p)" title="Ред">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(p.id)" title="Удал">🗑️</button>
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

    <!-- МОДАЛКА (ПОЛНАЯ) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content card large-modal">
          <h3>{{ isEdit ? 'Редактировать товар' : 'Создать товар' }}</h3>
          <form @submit.prevent="saveItem">
            <div class="grid-2">
              <div class="form-group"><label>Название *</label><input v-model="form.name" class="form-input" required></div>
              <div class="form-group"><label>Артикул (SKU)</label><input v-model="form.sku" class="form-input"></div>
              <div class="form-group"><label>Цена *</label><input v-model="form.price" type="number" step="0.01" class="form-input" required></div>
              <div class="form-group"><label>Старая цена</label><input v-model="form.old_price" type="number" step="0.01" class="form-input"></div>
              <div class="form-group"><label>Количество (Stock)</label><input v-model="form.quantity_in_stock" type="number" class="form-input"></div>
              <div class="form-group"><label>Вес (кг)</label><input v-model="form.weight" type="number" step="0.001" class="form-input"></div>
              <div class="form-group"><label>Категория ID</label><input v-model="form.category_id" type="number" class="form-input"></div>
              <div class="form-group"><label>Бренд ID</label><input v-model="form.brand_id" type="number" class="form-input"></div>
              <div class="form-group"><label>Рейтинг (0-5)</label><input v-model="form.rating" type="number" step="0.1" max="5" class="form-input"></div>
              <div class="form-group"><label>Фото URL</label><input v-model="form.image_url" class="form-input"></div>
            </div>
            
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="form.description" class="form-textarea"></textarea>
            </div>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="feat" v-model="form.is_featured">
              <label for="feat">Популярный (Featured)</label>
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
import { useCart } from '@/composables/useCart';

export default { 
  setup() { 
    const crud = useCrud('products');
    const { addToCart } = useCart();

    const handleAddToCart = (product) => {
      const itemToAdd = { ...product, price: Number(product.price) };
      addToCart(itemToAdd);
      alert(`Товар "${product.name}" добавлен в корзину!`);
    };

    return { ...crud, handleAddToCart }; 
  } 
}
</script>

<style scoped>
.pagination { display: flex; justify-content: center; gap: 15px; padding-top: 10px; }
</style>