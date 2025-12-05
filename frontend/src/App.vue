<template>
  <div id="app">
    <!-- Показываем хедер только если мы НЕ в панели каталога -->
    <NavigationBar v-if="!isCatalogMode" />
    
    <main :class="{ 'main-content': !isCatalogMode }">
      <!-- АНИМАЦИЯ ПЕРЕХОДА МЕЖДУ СТРАНИЦАМИ -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Показываем футер только если мы НЕ в панели каталога -->
    <footer v-if="!isCatalogMode" class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>{{ storeName }}</h3>
            <p>Лучшие автозапчасти и аксессуары по выгодным ценам. Работаем с 2010 года.</p>
            <div class="social-links">
              <a href="#" class="social-link">VK</a>
              <a href="#" class="social-link">TG</a>
              <a href="#" class="social-link">YT</a>
            </div>
          </div>

          <div class="footer-section">
            <h3>Навигация</h3>
            <ul class="footer-links">
              <li><router-link to="/">Главная</router-link></li>
              <li><router-link to="/about">О нас</router-link></li>
              <li><router-link to="/contacts">Контакты</router-link></li>
              <li><a href="#">Каталог</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h3>Контакты</h3>
            <ul class="footer-links">
              <li><a href="tel:+79991234567">📞 +7 (999) 123-45-67</a></li>
              <li><a href="mailto:info@autoparts.ru">✉️ info@autoparts.ru</a></li>
              <li>📍 г. Москва, ул. Автозаводская, д. 15</li>
              <li>⏰ Пн-Пт: 9:00-21:00</li>
              <li>⏰ Сб-Вс: 10:00-20:00</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2024 {{ storeName }}. Все права защищены.</p>
          <p class="mt-2">Дипломный проект</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import NavigationBar from './components/NavigationBar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  components: {
    NavigationBar
  },
  setup() {
    const storeName = ref('AutoParts Pro')
    const route = useRoute()

    const isCatalogMode = computed(() => {
      return route.path.startsWith('/catalog')
    })

    onMounted(async () => {
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
      isCatalogMode
    }
  }
}
</script>