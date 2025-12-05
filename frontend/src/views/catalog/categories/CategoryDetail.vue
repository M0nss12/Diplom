<template>
  <div class="container animate-fade-in">
    <button @click="$router.push('/catalog/categories')" class="btn btn-outline mb-4">← Назад</button>
    <div v-if="loading" class="text-center p-4">Загрузка...</div>
    
    <div v-else-if="item" class="card p-6">
      <div class="header-actions">
        <h2>{{ item.name }}</h2>
        <span v-if="item.discount_percent > 0" class="badge-red">-{{ item.discount_percent }}%</span>
      </div>

      <div class="grid-2 mt-4" style="grid-template-columns: 1fr 2fr;">
        <div class="img-container text-center">
           <img v-if="item.image_url" :src="item.image_url" class="w-100 rounded" style="max-height: 300px; object-fit: contain;">
           <div v-else class="p-4 bg-gray-100 rounded text-gray">Нет фото</div>
        </div>

        <div class="details-grid">
          <!-- Видно ВСЕМ -->
          <p><strong>ID:</strong> {{ item.id }}</p>
          <p><strong>Родитель ID:</strong> {{ item.parent_id || 'Нет' }}</p>
          <p class="full-width"><strong>Описание:</strong> {{ item.description || 'Нет описания' }}</p>
          
          <!-- ТОЛЬКО ДЛЯ АДМИНА -->
          <template v-if="isAdmin">
            <hr class="full-width my-2" style="border:0; border-top:1px dashed #ccc">
            <p><strong>Slug:</strong> {{ item.slug }}</p>
            <p><strong>Sort Order:</strong> {{ item.sort_order }}</p>
            <p><strong>Meta Title:</strong> {{ item.meta_title }}</p>
            <p><strong>Is Active:</strong> {{ item.is_active }}</p>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="message error">Не найдено</div>
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
      const userStr = localStorage.getItem('user');
      isAdmin.value = userStr && JSON.parse(userStr).role === 'admin';

      try {
        const res = await fetch(`/api/categories/${route.params.id}`);
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