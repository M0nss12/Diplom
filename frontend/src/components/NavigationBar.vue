<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="logo">
        <div class="logo-icon">AP</div>
        <div class="logo-text">{{ storeName }}</div>
      </router-link>

      <button class="nav-toggle" @click="toggleMenu">☰</button>

      <ul class="nav-links" :class="{ active: isMenuOpen }">
        <li><router-link to="/" class="nav-link" @click="closeMenu">Главная</router-link></li>
        <li><router-link to="/about" class="nav-link" @click="closeMenu">О нас</router-link></li>

        <li v-if="!isAdmin">
          <router-link to="/catalog/products" class="nav-link" @click="closeMenu">📦 Товары</router-link>
        </li>
        
        <li v-if="isAdmin">
          <router-link to="/catalog/products" class="nav-link admin-link" @click="closeMenu">⚙️ Админ Панель</router-link>
        </li>
        
        <li><router-link to="/contacts" class="nav-link" @click="closeMenu">Контакты</router-link></li>

        <template v-if="!user">
          <li class="auth-divider">|</li>
          <li><router-link to="/login" class="nav-link" @click="closeMenu">Вход</router-link></li>
          <li><router-link to="/register" class="nav-link" @click="closeMenu">Регистрация</router-link></li>
        </template>

        <template v-else>
          <li class="dropdown-container">
            <span class="nav-link dropdown-trigger" @click="toggleUserDropdown">
              <span class="username">👤 {{ user.username }} ▼</span>
            </span>
            <ul class="dropdown-menu" :class="{ 'show': isUserOpen }">
              <li><router-link to="/my-orders" class="dropdown-item" @click="closeAll">📦 Мои заказы</router-link></li>
              <li style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 5px;"></li>
              <li><a href="#" @click.prevent="logout" class="dropdown-item logout-item">Выход</a></li>
            </ul>
          </li>
        </template>
      </ul>

      <button class="cart-btn" @click="toggleCart">
        <span class="icon-cart"></span>
        <span class="cart-label-wrapper">
          <span>Корзина</span>
          <span v-if="cartCount > 0" class="cart-price">{{ cartPrice }} ₽</span>
        </span>
        <span class="cart-count">{{ cartCount }}</span>
      </button>
      </div>
  </nav>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
// ИЗМЕНЕНИЕ 1: Добавляем totalPrice
import { useCart } from '@/composables/useCart' 

export default {
  name: 'NavigationBar',
  setup() {
    const storeName = ref('AutoParts Pro')
    // ИЗМЕНЕНИЕ 2: Получаем totalCount и totalPrice
    const { totalCount, totalPrice, refreshCart } = useCart() 
    const isMenuOpen = ref(false)
    const isUserOpen = ref(false)
    const user = ref(null)
    const isAdmin = ref(false)
    const router = useRouter()
    
    // ИЗМЕНЕНИЕ 3: Вычисляемая стоимость для отображения (с форматированием)
    const cartPrice = computed(() => {
        // Используем toLocaleString для форматирования числа
        return totalPrice.value.toLocaleString('ru-RU');
    });

    const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value }
    const closeMenu = () => { closeAll() } 
    
    const toggleUserDropdown = () => { 
      isUserOpen.value = !isUserOpen.value; 
    }
    
    const closeAll = () => { 
      isMenuOpen.value = false; 
      isUserOpen.value = false; 
    }
    
    const toggleCart = () => { router.push('/cart') }
    
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      user.value = null;
      refreshCart(); 
      closeAll();
      router.push('/');
      setTimeout(() => window.location.reload(), 100); 
    }

    onMounted(async () => {
      // 1. Получение данных пользователя из localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          user.value = JSON.parse(userData);
          isAdmin.value = user.value.role === 'admin';
        } catch(e) {
          console.error("Ошибка парсинга данных пользователя:", e);
        }
      }
      
      // 2. Получение названия магазина с API
      try {
        const response = await fetch('/api/store-info');
        if (response.ok) {
          const data = await response.json();
          storeName.value = data.name;
        }
      } catch (error) {
        console.log('Не удалось получить данные магазина с API, используется локальное название.');
      }
    })

    return {
      storeName, 
      cartCount: totalCount, 
      cartPrice, // ВОЗВРАЩАЕМ отформатированную цену
      isMenuOpen, 
      isUserOpen, 
      user, 
      isAdmin,
      toggleMenu, 
      closeMenu, 
      toggleUserDropdown, 
      closeAll, 
      closeDropdownAndMenu: closeAll,
      toggleCart, 
      logout
    }
  }
}
</script>