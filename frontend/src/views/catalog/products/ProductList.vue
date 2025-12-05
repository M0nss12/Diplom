<template>
  <div class="card p-4">
    
    <div class="header-actions">
      <h2>Список товаров</h2>
      <p v-if="paginatedItems.length === 0" class="no-results-message">
        Товары по заданным фильтрам не найдены.
      </p>
      <button v-if="isAdmin" class="btn btn-primary" @click="openEditModal()">+ Добавить</button>
    </div>

    <template v-if="isAdmin">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Фото</th>
            <th>Название</th>
            <th>Цена</th>
            <th>Остаток</th>
            <th>Вес</th>
            <th>Артикул (SKU)</th> 
            <th>Категория</th> 
            <th>Бренд</th>      
            <th>Топ?</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0 && paginatedItems.length === 0">
            <td colspan="11" class="text-center p-4">Нет товаров для отображения.</td>
          </tr>
          <tr v-for="p in paginatedItems" :key="p.id"> 
            <td>{{ p.id }}</td>
            <td>
              <img v-if="p.image_url" :src="p.image_url" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
              <span v-else>-</span>
            </td>
            <td>{{ p.name }}</td>
            <td>
              {{ p.price }} ₽ 
              <span v-if="p.old_price && p.old_price > p.price" style="text-decoration: line-through; color: #999; font-size: 0.8em;">{{ p.old_price }}</span>
            </td>
            <td>{{ p.quantity_in_stock }}</td>
            <td>{{ p.weight }}</td>
            <td>{{ p.sku || '-' }}</td> 
            <td>{{ getCategoryName(p.category_id) }}</td> 
            <td>{{ getBrandName(p.brand_id) }}</td>       
            <td>{{ p.is_featured ? '★' : '' }}</td>
            
            <td class="actions-cell">
              <button class="btn-sm cart-add" @click="handleAddToCart(p)" title="В корзину">🛒</button>
              <button class="btn-sm view" @click="$router.push(`/catalog/products/${p.id}`)" title="Просмотр">👁️</button>
              <button class="btn-sm edit" @click="openEditModal(p)" title="Ред">✏️</button>
              <button class="btn-sm delete" @click="deleteItem(p.id)" title="Удал">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    
    <template v-else>
      <div class="product-card-grid">
          <div class="product-card" v-for="p in paginatedItems" :key="p.id">
              <div class="card-image-wrapper" @click="$router.push(`/catalog/products/${p.id}`)">
                  <img :src="p.image_url || '/placeholder.jpg'" alt="Изображение товара" class="card-image">
                  <span v-if="p.old_price && p.old_price > p.price" class="discount-badge">Скидка!</span>
                  <span v-if="p.is_featured" class="featured-badge">Топ</span>
              </div>
              
              <div class="card-body">
                  <div class="card-meta">
                      <span class="meta-item category">{{ getCategoryName(p.category_id) }}</span>
                      <span class="meta-item brand">{{ getBrandName(p.brand_id) }}</span>
                  </div>

                  <div class="product-details-short">
                      <span v-if="p.rating > 0">⭐ {{ p.rating }}</span>
                      <span v-if="p.weight > 0">| {{ p.weight }} кг</span>
                  </div>

                  <h3 class="card-title" @click="$router.push(`/catalog/products/${p.id}`)">{{ p.name }}</h3>
                  
                  <div class="card-price-section">
                      <span class="current-price">{{ p.price }} ₽</span>
                      <span v-if="p.old_price && p.old_price > p.price" class="old-price">{{ p.old_price }} ₽</span>
                  </div>
              </div>

              <div class="card-actions">
                  <button 
                      class="btn btn-outline btn-sm" 
                      @click="$router.push(`/catalog/products/${p.id}`)"
                      style="width: 48%; margin-right: 4%;"
                  >
                      Подробнее
                  </button>
                  <button 
                      class="btn btn-primary btn-sm" 
                      :disabled="p.quantity_in_stock <= 0" 
                      @click="handleAddToCart(p)"
                      style="width: 48%;"
                  >
                      {{ p.quantity_in_stock > 0 ? 'В корзину' : 'Нет в наличии' }}
                  </button>
              </div>
          </div>
      </div>
    </template>

    <div class="pagination mt-4" v-if="totalPages > 1">
      <button class="btn btn-outline" :disabled="page === 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ totalPages }}</span>
      <button class="btn btn-outline" :disabled="page === totalPages" @click="nextPage">Вперед</button>
    </div>

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
              <div class="form-group"><label>Количество</label><input v-model="form.quantity_in_stock" type="number" class="form-input"></div>
              <div class="form-group"><label>Вес (кг)</label><input v-model="form.weight" type="number" step="0.001" class="form-input"></div>
              <div class="form-group"><label>Категория ID</label><input v-model="form.category_id" type="number" class="form-input"></div>
              <div class="form-group"><label>Бренд ID</label><input v-model="form.brand_id" type="number" class="form-input"></div>
              <div class="form-group"><label>Рейтинг (0-5)</label><input v-model="form.rating" type="number" step="0.1" max="5" class="form-input"></div>
              
              <div class="form-group">
                  <label>Фото товара</label>
                  <input v-model="form.image_url" class="form-input mb-2" placeholder="Вставьте URL или загрузите файл">
                  <input type="file" @change="handleFileUpload" class="form-input" accept="image/*">
                  <div v-if="form.image_url" class="mt-2 text-center">
                      <img :src="form.image_url" style="max-height: 100px; border: 1px solid #ccc; border-radius: 4px;">
                  </div>
              </div>
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
import { onMounted, inject, watch } from 'vue';
import { useCrud } from '@/composables/useCrud'; 
import { useCart } from '@/composables/useCart';

export default { 
  name: 'ProductList',
  props: {
      maxPrice: { type: Number, default: 0 },
      categories: { type: Array, default: () => [] },
      brands: { type: Array, default: () => [] },
  }, 
  emits: ['update:items'], 
  setup(props, { emit }) { 
    const crud = useCrud('products');
    const { addToCart } = useCart();
    
    // Получение общих фильтров из контекста
    const sharedFilters = inject('filters'); 
    
    // --- ЛОГИКА ЗАГРУЗКИ ФАЙЛА ---
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
                crud.form.value.image_url = data.url;
            } else {
                alert('Ошибка загрузки фото');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети при загрузке');
        }
    };

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    const getCategoryName = (id) => {
        const category = props.categories?.find(c => c.id === id);
        return category ? category.name : 'Неизвестно';
    };

    const getBrandName = (id) => {
        const brand = props.brands?.find(b => b.id === id);
        return brand ? brand.name : 'Неизвестно';
    };
    
    const getFilterParams = () => {
        const params = {};
        const filters = sharedFilters.value;

        if (filters) {
            if (filters.selectedCategory) params.category_id = filters.selectedCategory;
            if (filters.selectedBrand) params.brand_id = filters.selectedBrand;
            if (filters.hasDiscount === true) params.has_discount = true;
            if (filters.priceMin > 0) params.price_min = filters.priceMin;
            if (filters.priceMax && filters.priceMax < props.maxPrice) params.price_max = filters.priceMax;
            
            // СОРТИРОВКА
            if (filters.sortValue) {
                params.sort = filters.sortValue;
            }
        }
        return params;
    };
    
    // --- ЛОГИКА ФИЛЬТРАЦИИ И ЗАГРУЗКИ ---
    const applyFilters = async () => {
        const params = getFilterParams();
        crud.page.value = 1; 
        const query = Object.keys(params)
             .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
             .join('&');
        let url = `/api/products`;
        if (query) url += `?${query}`;
        
        await crud.fetchItems(url); 
        emit('update:items', crud.items.value); 
    };

    // Следим за изменениями фильтров
    watch(sharedFilters, applyFilters, { deep: true });

    // Следим за максимальной ценой (устанавливаем начальное значение для ползунка)
    watch(() => props.maxPrice, (newMax) => {
        if (sharedFilters.value && sharedFilters.value.priceMax === 0) {
            sharedFilters.value.priceMax = newMax;
        }
        applyFilters(); 
    }, { immediate: true });

    // --- ЛОГИКА КОРЗИНЫ ---
    const handleAddToCart = (product) => {
      const itemToAdd = { ...product, price: Number(product.price) }; 
      addToCart(itemToAdd);
      alert(`Товар "${product.name}" добавлен в корзину!`);
    };

    onMounted(() => {
        if (sharedFilters.value) applyFilters();
        else crud.fetchItems();
    });

    return { 
      // Экспортируем все из useCrud (items, page, totalPages, isAdmin, showEditModal, openEditModal, closeModals, saveItem, deleteItem, prevPage, nextPage, form, isEdit)
      ...crud, 
      sharedFilters, 
      handleAddToCart,
      getCategoryName,
      getBrandName,
      handleFileUpload 
    }; 
  } 
}
</script>