<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/brands')" class="btn btn-outline mb-4">← Назад</button>
    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="item" class="card p-6">
      <div class="header-actions">
        <h2>{{ item.name }}</h2>
        <!-- Бейдж популярости (виден всем, если true) -->
        <span v-if="item.is_popular" class="badge-green">Популярный бренд ⭐</span>
      </div>

      <div class="grid-2 mt-4" style="grid-template-columns: 1fr 2fr;">
        <div class="img-container text-center">
           <img v-if="item.logo_url" :src="item.logo_url" style="max-height: 200px; object-fit: contain;">
           <div v-else class="p-4 bg-gray-100 rounded text-gray">Нет логотипа</div>
        </div>

        <div class="details-grid">
          <!-- Видно всем -->
          <p><strong>Страна:</strong> {{ item.country || 'Не указана' }}</p>
          <p><strong>Сайт:</strong> 
            <a v-if="item.website_url" :href="item.website_url" target="_blank" class="text-link">{{ item.website_url }}</a>
            <span v-else>-</span>
          </p>
          <p><strong>Год основания:</strong> {{ item.year_founded || '-' }}</p>
          <p><strong>Email:</strong> {{ item.contact_email || '-' }}</p>
          <p><strong>Статус:</strong> {{ item.status }}</p>
          <p><strong>Популярный:</strong> {{ item.is_popular ? 'Да' : 'Нет' }}</p>
          
          <p class="full-width"><strong>Описание:</strong><br>{{ item.description || 'Нет описания' }}</p>

          <!-- ТОЛЬКО ДЛЯ АДМИНА -->
          <template v-if="isAdmin">
            <hr class="full-width my-4" style="border: 0; border-top: 1px dashed #ccc;">
            <p><strong>ID (System):</strong> {{ item.id }}</p>
            <p class="full-width"><strong>SEO Keywords:</strong> {{ item.meta_keywords || '-' }}</p>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="message error">Бренд не найден</div>
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
    const isAdmin = ref(false);

    onMounted(async () => {
      // Проверка прав
      const userStr = localStorage.getItem('user');
      isAdmin.value = userStr && JSON.parse(userStr).role === 'admin';
      
      try {
        const res = await fetch(`/api/brands/${route.params.id}`);
        if (res.ok) item.value = await res.json();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    });

    return { item, loading, isAdmin };
  }
}
</script>