<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/products')" class="btn btn-outline mb-4">← Назад к списку</button>

    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    <div v-else-if="product" class="detail-page">
      <div class="card p-6 mb-6">
        <h2>{{ product.name }} (ID: {{ product.id }})</h2>
        
        <div class="grid-2 mt-4" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
          
          <div class="img-container text-center">
            <img v-if="product.image_url" :src="product.image_url" class="w-100 rounded" style="max-height: 300px; object-fit: contain;">
            <div v-else class="p-4 bg-gray-100 rounded text-gray">Нет фото</div>
          </div>
          
          <div class="info-list">
            <p><strong>Цена:</strong> 
              <span class="text-xl" style="color: var(--primary)">{{ product.price }} ₽</span>
              <span v-if="product.old_price" style="text-decoration: line-through; color: #999; margin-left: 10px;">{{ product.old_price }} ₽</span>
            </p>
            <p><strong>Остаток:</strong> {{ product.quantity_in_stock }} шт.</p>
            <p><strong>Вес:</strong> {{ product.weight || '-' }} кг</p>
            <p><strong>Рейтинг:</strong> ⭐ {{ product.rating }}</p>
            
            <p><strong>Категория:</strong> {{ getCategoryName(product.category_id) }}</p>
            
            <div class="brand-block mt-2 mb-2" style="display: flex; align-items: center; gap: 10px;">
              <strong>Бренд:</strong>
              <img 
                v-if="getBrandLogo(product.brand_id)" 
                :src="getBrandLogo(product.brand_id)" 
                alt="Logo" 
                style="height: 70px; width: auto; object-fit: contain;"
              >
              <span>{{ getBrandName(product.brand_id) }}</span>
            </div>
            
            <p><strong>Популярный (Топ):</strong> {{ product.is_featured ? '✅ Да' : '❌ Нет' }}</p>

            <p class="mt-4"><strong>Описание:</strong><br>{{ product.description }}</p>
            
            <template v-if="isAdmin">
              <h4 class="mt-4" style="border-top: 1px solid #eee; padding-top: 10px;">📊 Данные для Админа</h4>
              <p><strong>SKU (Артикул):</strong> {{ product.sku || '-' }}</p> 
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="message error">Товар не найден</div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

// Асинхронная функция для загрузки справочников
async function fetchReferenceData(endpoint) {
    try {
        const res = await fetch(`/api/${endpoint}`);
        return res.ok ? await res.json() : [];
    } catch (e) {
        console.error(`Ошибка загрузки ${endpoint}:`, e);
        return [];
    }
}

export default {
  setup() {
    const route = useRoute();
    const product = ref(null);
    const loading = ref(true);
    const user = ref(null);
    
    // Новые реактивные переменные для справочников
    const categories = ref([]);
    const brands = ref([]);

    const isAdmin = computed(() => user.value && user.value.role === 'admin');

    // Вспомогательная функция для получения названия категории
    const getCategoryName = (id) => {
        const category = categories.value.find(c => c.id === id);
        return category ? category.name : 'Неизвестно';
    };

    // Вспомогательная функция для получения названия бренда
    const getBrandName = (id) => {
        const brand = brands.value.find(b => b.id === id);
        return brand ? brand.name : 'Неизвестно';
    };

    // НОВАЯ ФУНКЦИЯ: Получение логотипа бренда по ID
    const getBrandLogo = (id) => {
        const brand = brands.value.find(b => b.id === id);
        // Возвращаем logo_url, если он есть
        return brand ? brand.logo_url : null;
    };

    onMounted(async () => {
      loading.value = true;
      
      // 1. Загрузка данных пользователя
      const userStr = localStorage.getItem('user');
      user.value = userStr ? JSON.parse(userStr) : null;

      // 2. Загрузка справочных данных (категорий и брендов)
      const [categoriesData, brandsData] = await Promise.all([
          fetchReferenceData('categories'),
          fetchReferenceData('brands')
      ]);
      categories.value = categoriesData;
      brands.value = brandsData;

      // 3. Загрузка данных продукта
      try {
        const prodRes = await fetch(`/api/products/${route.params.id}`);
        if (prodRes.ok) {
          product.value = await prodRes.json();
        }
      } catch (e) { 
        console.error("Ошибка загрузки продукта:", e); 
      } finally { 
        loading.value = false; 
      }
    });

    return { 
        product, 
        loading, 
        isAdmin,
        getCategoryName, 
        getBrandName,
        getBrandLogo // Не забываем вернуть новую функцию
    };
  }
}
</script>