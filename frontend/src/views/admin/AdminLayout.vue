<template>
  <div class="admin-container">
    <aside class="sidebar">
      <div class="admin-logo">
        <span v-if="isAdmin">Панель Админа</span>
        <span v-else>Каталог данных</span>
      </div>
      
      <nav class="admin-nav">
        <!-- Доступно всем -->
        <router-link to="/admin/products">📦 Товары</router-link>
        <router-link to="/admin/categories">📂 Категории</router-link>
        <router-link to="/admin/brands">🏷️ Бренды</router-link>
        
        <!-- Доступно только Админу -->
        <template v-if="isAdmin">
          <div class="divider"></div>
          <router-link to="/admin/users">👥 Пользователи</router-link>
          <router-link to="/admin/orders">🛒 Заказы</router-link>
        </template>
        
        <div class="divider"></div>
        <router-link to="/">🏠 На сайт</router-link>
      </nav>
    </aside>

    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const isAdmin = ref(false);

    onMounted(() => {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      isAdmin.value = user && user.role === 'admin';
    });

    return { isAdmin };
  }
}
</script>
