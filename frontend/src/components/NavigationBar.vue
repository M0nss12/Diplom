<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- ЛОГОТИП -->
      <router-link to="/" class="logo">
        <div class="logo-icon">AP</div>
        <div class="logo-text">{{ storeName }}</div>
      </router-link>

      <!-- МОБИЛЬНОЕ МЕНЮ -->
      <button class="nav-toggle" @click="toggleMenu">☰</button>

      <!-- ССЫЛКИ -->
      <ul class="nav-links" :class="{ active: isMenuOpen }">
        <li><router-link to="/" class="nav-link" @click="closeMenu">Главная</router-link></li>
        <li><router-link to="/about" class="nav-link" @click="closeMenu">О нас</router-link></li>

        <!-- ВЫПАДАЮЩИЙ СПИСОК КАТАЛОГА -->
        <li class="dropdown-container">
          <span class="nav-link dropdown-trigger" @click="toggleCatalogDropdown">
            Каталог ▼
          </span>
          <ul class="dropdown-menu" :class="{ 'show': isCatalogOpen }">
            <!-- Публичные -->
            <li><router-link to="/catalog/products" class="dropdown-item" @click="closeAll">📦 Товары</router-link></li>
            <li><router-link to="/catalog/categories" class="dropdown-item" @click="closeAll">📂 Категории</router-link></li>
            <li><router-link to="/catalog/brands" class="dropdown-item" @click="closeAll">🏷️ Бренды</router-link></li>
            
            <!-- Только для Админа -->
            <template v-if="isAdmin">
              <li style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 5px;"></li>
              <li><router-link to="/catalog/users" class="dropdown-item" @click="closeAll">👥 Пользователи</router-link></li>
              <li><router-link to="/catalog/orders" class="dropdown-item" @click="closeAll">🛒 Заказы (Админ)</router-link></li>
              <li><router-link to="/catalog/reviews" class="dropdown-item" @click="closeAll">💬 Отзывы</router-link></li>
            </template>
          </ul>
        </li>

        <li><router-link to="/contacts" class="nav-link" @click="closeMenu">Контакты</router-link></li>

        <!-- ГОСТЬ (Вход/Регистрация) -->
        <template v-if="!user">
          <li class="auth-divider">|</li>
          <li><router-link to="/login" class="nav-link" @click="closeMenu">Вход</router-link></li>
          <li><router-link to="/register" class="nav-link" @click="closeMenu">Регистрация</router-link></li>
        </template>

        <!-- АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ (Dropdown) -->
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

      <!-- КНОПКА КОРЗИНЫ -->
      <button class="cart-btn" @click="toggleCart">
        <span class="icon-cart"></span><span>Корзина</span>
        <span class="cart-count">{{ cartCount }}</span>
      </button>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart' // Подключаем хук корзины

export default {
  name: 'NavigationBar',
  setup() {
    const storeName = ref('AutoParts Pro')
    
    // Получаем счетчик и функцию обновления корзины
    const { totalCount, refreshCart } = useCart()
    
    // Состояния меню
    const isMenuOpen = ref(false)
    const isCatalogOpen = ref(false) 
    const isUserOpen = ref(false)
    
    const user = ref(null)
    const isAdmin = ref(false)
    const router = useRouter()

    // --- Управление меню ---
    const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value }
    
    // Открытие каталога (закрывает юзера)
    const toggleCatalogDropdown = () => { 
      isCatalogOpen.value = !isCatalogOpen.value; 
      isUserOpen.value = false; 
    }
    
    // Открытие юзера (закрывает каталог)
    const toggleUserDropdown = () => { 
      isUserOpen.value = !isUserOpen.value; 
      isCatalogOpen.value = false; 
    }

    // Закрыть всё (при клике на ссылку)
    const closeAll = () => {
      isMenuOpen.value = false;
      isCatalogOpen.value = false;
      isUserOpen.value = false;
    }

    // Алиас для обратной совместимости в шаблоне (если использовался ранее)
    const closeMenu = closeAll;

    // Переход в корзину
    const toggleCart = () => { 
      router.push('/cart') 
    }
    
    // Выход из системы
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      user.value = null
      
      // Сбрасываем корзину на гостевую (пустую)
      refreshCart();
      
      closeAll()
      router.push('/')
      
      // Небольшая задержка перед перезагрузкой для очистки состояний
      setTimeout(() => window.location.reload(), 100) 
    }

    onMounted(async () => {
      // Проверка авторизации при загрузке
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          user.value = JSON.parse(userData)
          isAdmin.value = user.value.role === 'admin'
        } catch (e) {
          console.error("Ошибка чтения пользователя", e)
        }
      }

      // Получение названия магазина
      try {
        const response = await fetch('/api/store-info')
        if (response.ok) {
          const data = await response.json()
          storeName.value = data.name
        }
      } catch (error) { 
        console.log('Используется локальное название магазина') 
      }
    })

    return {
      storeName, 
      cartCount: totalCount, // Связываем реактивное количество
      isMenuOpen, isCatalogOpen, isUserOpen, 
      user, isAdmin,
      toggleMenu, closeMenu, toggleCatalogDropdown, toggleUserDropdown, closeAll, closeDropdownAndMenu: closeAll,
      toggleCart, logout
    }
  }
}
</script>

<style scoped>
/* Локальные стили, которых нет в глобальном файле */
.logout-item { 
  color: #fca5a5; 
}
.logout-item:hover { 
  background: rgba(239, 68, 68, 0.2); 
  color: #fee2e2; 
}
</style>