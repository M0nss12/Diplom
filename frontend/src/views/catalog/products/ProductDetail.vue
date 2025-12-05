<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/products')" class="btn btn-outline mb-4">← Назад</button>
    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="product" class="detail-page">
      <div class="card p-6 mb-6">
        <div class="header-actions">
          <h2>{{ product.name }}</h2>
          <span v-if="product.is_featured" class="badge-green">Featured</span>
        </div>
        
        <div class="grid-2 mt-4" style="grid-template-columns: 1fr 2fr;">
          <div class="img-container text-center">
             <img v-if="product.image_url" :src="product.image_url" class="w-100 rounded" style="max-height: 300px; object-fit: contain;">
             <div v-else class="p-4 bg-gray-100 rounded text-gray">Нет фото</div>
          </div>
          
          <div class="info-list">
            <!-- ВИДНО ВСЕМ -->
            <p><strong>Цена:</strong> <span style="font-size: 1.2em; color: var(--primary); font-weight: bold;">{{ product.price }} ₽</span></p>
            <p v-if="product.old_price"><strong>Старая цена:</strong> <span style="text-decoration: line-through;">{{ product.old_price }}</span></p>
            <p><strong>Остаток:</strong> {{ product.quantity_in_stock }} шт.</p>
            <p><strong>Вес:</strong> {{ product.weight || '-' }} кг</p>
            <p><strong>Рейтинг:</strong> ⭐ {{ product.rating }}</p>
            <p><strong>Описание:</strong> {{ product.description }}</p>

            <button class="btn btn-primary mt-4" @click="handleAddToCart">🛒 В корзину</button>

            <!-- ТОЛЬКО ДЛЯ АДМИНА -->
            <template v-if="isAdmin">
              <hr class="my-4">
              <h3 class="text-sm text-gray-500">Техническая информация (Админ):</h3>
              <p><strong>ID:</strong> {{ product.id }}</p>
              <p><strong>SKU:</strong> {{ product.sku }}</p>
              <p><strong>Cat ID:</strong> {{ product.category_id }}</p>
              <p><strong>Brand ID:</strong> {{ product.brand_id }}</p>
            </template>
          </div>
        </div>
      </div>
      <!-- Отзывы (оставляем как есть) -->
    </div>
    <div v-else class="message error">Не найдено</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCart } from '@/composables/useCart';

export default {
  setup() {
    const route = useRoute();
    const product = ref(null);
    const reviews = ref([]);
    const loading = ref(true);
    const isAdmin = ref(false);
    const { addToCart } = useCart();

    const handleAddToCart = () => {
      if(product.value) {
        addToCart(product.value);
        alert('Добавлено в корзину');
      }
    };

    onMounted(async () => {
      const userStr = localStorage.getItem('user');
      isAdmin.value = userStr && JSON.parse(userStr).role === 'admin';

      try {
        const prodRes = await fetch(`/api/products/${route.params.id}`);
        if (prodRes.ok) product.value = await prodRes.json();
        // Загрузку отзывов можно добавить сюда
      } catch (e) { console.error(e); } 
      finally { loading.value = false; }
    });

    return { product, reviews, loading, handleAddToCart, isAdmin };
  }
}
</script>