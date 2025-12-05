<template>
  <div class="catalog-wrapper">
    <!-- Боковая панель -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">🗂️</span>
        <span>Каталог данных</span>
      </div>
      
      <nav class="sidebar-nav">
        <!-- Общий раздел -->
        <div class="nav-section">
          <span class="nav-label">Магазин</span>
          <router-link to="/catalog/products" class="nav-item">📦 Товары</router-link>
          <router-link to="/catalog/categories" class="nav-item">📂 Категории</router-link>
          <router-link to="/catalog/brands" class="nav-item">🏷️ Бренды</router-link>
          <!-- ДОБАВИЛ ССЫЛКУ НА КОРЗИНУ -->
          <router-link to="/cart" class="nav-item">🛒 Корзина</router-link>
        </div>
        
        <!-- Раздел Администратора -->
        <template v-if="isAdmin">
          <div class="nav-divider"></div>
          <div class="nav-section">
            <span class="nav-label">Администрирование</span>
            <router-link to="/catalog/users" class="nav-item">👥 Клиенты</router-link>
            <router-link to="/catalog/orders" class="nav-item">🛒 Заказы</router-link>
            <router-link to="/catalog/reviews" class="nav-item">💬 Отзывы</router-link>
          </div>
        </template>
        
        <div class="nav-divider"></div>
        <router-link to="/" class="nav-item back-link">🏠 На сайт</router-link>
      </nav>
    </aside>

    <!-- Основной контент -->
    <main class="catalog-content">
      <header class="content-header">
        <div class="user-info">
          Пользователь: <strong>{{ username }}</strong>
        </div>
      </header>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';

export default {
  name: 'CatalogLayout',
  setup() {
    const user = ref(null);

    onMounted(() => {
      const userStr = localStorage.getItem('user');
      user.value = userStr ? JSON.parse(userStr) : null;
    });

    const isAdmin = computed(() => user.value && user.value.role === 'admin');
    const username = computed(() => user.value ? user.value.username : 'Гость');

    return { isAdmin, username };
  }
}
</script>