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

        <!-- ВЫПАДАЮЩИЙ СПИСОК -->
        <li class="dropdown-container">
          <span class="nav-link dropdown-trigger" @click="toggleDropdown">
            Каталог данных ▼
          </span>
          <ul class="dropdown-menu" :class="{ 'show': isDropdownOpen }">
            <!-- ДОСТУПНО ВСЕМ -->
            <li><router-link to="/admin/products" class="dropdown-item" @click="closeDropdownAndMenu">📦 Товары</router-link></li>
            <li><router-link to="/admin/categories" class="dropdown-item" @click="closeDropdownAndMenu">📂 Категории</router-link></li>
            <li><router-link to="/admin/brands" class="dropdown-item" @click="closeDropdownAndMenu">🏷️ Бренды</router-link></li>
            
            <!-- ДОСТУПНО ТОЛЬКО АДМИНУ -->
            <template v-if="isAdmin">
              <li style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 5px;"></li>
              <li><router-link to="/admin/users" class="dropdown-item" @click="closeDropdownAndMenu">👥 Пользователи</router-link></li>
              <li><router-link to="/admin/orders" class="dropdown-item" @click="closeDropdownAndMenu">🛒 Заказы</router-link></li>
            </template>
          </ul>
        </li>

        <li><router-link to="/contacts" class="nav-link" @click="closeMenu">Контакты</router-link></li>

        <template v-if="!user">
          <li class="auth-divider">|</li>
          <li><router-link to="/login" class="nav-link" @click="closeMenu">Вход</router-link></li>
          <li><router-link to="/register" class="nav-link" @click="closeMenu">Регистрация</router-link></li>
        </template>

        <template v-else>
          <li class="user-info"><span class="username">👤 {{ user.username }}</span></li>
          <li><a href="#" @click.prevent="logout" class="nav-link logout-btn">Выход</a></li>
        </template>
      </ul>

      <button class="cart-btn" @click="toggleCart">
        <span class="icon-cart"></span><span>Корзина</span>
        <span class="cart-count">{{ cartCount }}</span>
      </button>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'NavigationBar',
  setup() {
    const storeName = ref('AutoParts Pro')
    const cartCount = ref(0)
    const isMenuOpen = ref(false)
    const isDropdownOpen = ref(false)
    const user = ref(null)
    const isAdmin = ref(false) // Флаг админа

    const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; if (!isMenuOpen.value) isDropdownOpen.value = false }
    const closeMenu = () => { isMenuOpen.value = false; isDropdownOpen.value = false }
    const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value }
    const closeDropdownAndMenu = () => { isDropdownOpen.value = false; isMenuOpen.value = false }
    const toggleCart = () => { alert(`В корзине ${cartCount.value} товара(ов)`) }
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      user.value = null
      window.location.href = '/'
    }

    onMounted(async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        user.value = JSON.parse(userData)
        isAdmin.value = user.value.role === 'admin' // Проверка роли
      }

      try {
        const response = await fetch('/api/store-info')
        if (response.ok) {
          const data = await response.json()
          storeName.value = data.name
        }
      } catch (error) { console.log('Локальное имя') }
    })

    return {
      storeName, cartCount, isMenuOpen, isDropdownOpen, user, isAdmin,
      toggleMenu, closeMenu, toggleDropdown, closeDropdownAndMenu, toggleCart, logout
    }
  }
}
</script>

