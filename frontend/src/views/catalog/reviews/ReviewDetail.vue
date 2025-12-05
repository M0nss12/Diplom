<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/reviews')" class="btn btn-outline mb-4">← Назад к списку</button>

    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="item" class="card p-6">
      <div class="header-actions">
        <h2>Отзыв #{{ item.id }}</h2>
      </div>

      <div class="details-grid mt-4">
        <p><strong>ID Пользователя:</strong> 
          <router-link :to="`/catalog/users/${item.user_id}`" class="text-link">
            {{ item.user_id }}
          </router-link>
        </p>
        
        <p><strong>ID Товара:</strong> 
          <router-link :to="`/catalog/products/${item.product_id}`" class="text-link">
            {{ item.product_id }}
          </router-link>
        </p>
        
        <p><strong>Рейтинг:</strong> 
          <span style="color: gold; font-size: 1.2rem;">{{ '★'.repeat(item.rating) }}</span> 
          ({{ item.rating }} из 5)
        </p>

        <div style="grid-column: 1 / -1; margin-top: 1rem;">
          <strong>Текст отзыва:</strong>
          <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; border: 1px solid #e5e7eb;">
            {{ item.comment }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="message error">Отзыв не найден</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const item = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      try {
        const res = await fetch(`/api/reviews/${route.params.id}`);
        if (res.ok) item.value = await res.json();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    return { item, loading };
  }
}
</script>