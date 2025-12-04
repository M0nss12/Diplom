<template>
  <div class="container animate-fade-in">
    
    <!-- 1. ЛЕНТА НОВОСТЕЙ -->
    <div class="news-ticker">
      <div class="ticker-label">НОВОСТИ</div>
      <div class="ticker-viewport">
        <div 
          class="ticker-track"
          :style="{ transform: `translateY(-${currentNewsIndex * 50}px)` }"
        >
          <div v-for="(item, index) in newsItems" :key="index" class="ticker-item">
            <span class="ticker-date">{{ item.date }}</span>
            <span class="ticker-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. ГЕРОЙ СЕКЦИЯ -->
    <div class="hero">
      <div class="hero-content">
        <h1>{{ storeInfo.name || 'AutoParts Pro' }}</h1>
        <p>{{ storeInfo.description || 'Лучшие автозапчасти и аксессуары' }}</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ categories.length }}</div>
            <div class="stat-label">Категорий</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">-15%</div>
            <div class="stat-label">На первый заказ</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Поддержка</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ (Выбор категории) -->
    <div v-if="discountedCategories.length > 0" class="section">
      <h2 class="section-title">🔥 Акции по категориям</h2>
      <div class="discount-categories">
        <div 
          v-for="cat in discountedCategories" 
          :key="cat.id" 
          class="discount-card"
          :class="{ active: selectedCategoryId === cat.id }"
          @click="filterByCategory(cat.id)"
        >
          <div class="discount-badge">-{{ cat.discount_percent }}%</div>
          <div class="text-3xl mb-2">🏷️</div>
          <h3>{{ cat.name }}</h3>
          <p class="mb-0 text-sm text-gray">Показать товары</p>
        </div>
      </div>
    </div>
    
    <!-- 4. СПИСОК ТОВАРОВ -->
    <!-- Секция отображается ТОЛЬКО если выбрана категория -->
    <div v-if="selectedCategoryId" class="section" id="catalog" ref="catalogSection">
      
      <h2 class="section-title">
        <span>Категория: {{ selectedCategoryName }}</span>
        <button @click="resetFilter" class="btn btn-outline" style="margin-left: 1rem; font-size: 0.8rem;">
          ✕ Закрыть
        </button>
      </h2>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center p-8">
        <div class="loader"></div>
      </div>

      <!-- Если в категории нет товаров -->
      <div v-else-if="products.length === 0" class="text-center p-8 card">
        <p>В этой категории товары закончились.</p>
        <button @click="resetFilter" class="btn btn-primary mt-4">Выбрать другую</button>
      </div>

      <!-- Товары -->
      <div v-else class="products-grid animate-fade-in">
        <div v-for="product in products" :key="product.id" class="product-card">
          <div class="product-image">
            <img v-if="product.image_url" :src="product.image_url" alt="" style="width:100%; height:100%; object-fit:contain;">
            <div v-else class="text-center">
              <div class="text-5xl mb-2">🚗</div>
            </div>
          </div>
          
          <div class="product-content">
            <h3 class="product-title">{{ product.name }}</h3>
            
            <div class="product-rating">
              <div class="stars">★★★★★</div>
              <span class="rating-value">{{ product.rating }}</span>
            </div>
            
            <div class="product-price">
              <span v-if="product.old_price" style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 5px;">
                {{ product.old_price }}
              </span>
              {{ product.price.toLocaleString() }} ₽
            </div>
            
            <button class="add-to-cart" @click="addToCart(product)">
              <span>🛒</span> В корзину
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue'

export default {
  name: 'HomeView',
  setup() {
    const storeInfo = ref({})
    const products = ref([]) 
    const categories = ref([])
    const loading = ref(false)
    const selectedCategoryId = ref(null)

    // Лента новостей
    const currentNewsIndex = ref(0)
    const newsItems = ref([
      { date: 'NEW', text: 'Поступление зимней резины Michelin и Nokian!' },
      { date: 'SALE', text: 'Скидка 20% на все моторные масла Mobil 1.' },
      { date: 'INFO', text: 'График работы в праздники: с 10:00 до 18:00.' },
      { date: 'AUTO', text: 'Бесплатная диагностика подвески при покупке от 5000р.' }
    ])
    let newsInterval = null

    // --- ЛОГИКА ---

    const getCategoryName = (id) => {
      const cat = categories.value.find(c => c.id === id)
      return cat ? cat.name : ''
    }

    const selectedCategoryName = computed(() => {
      if (!selectedCategoryId.value) return null
      return getCategoryName(selectedCategoryId.value)
    })

    const discountedCategories = computed(() => {
      return categories.value.filter(c => c.discount_percent > 0)
    })

    const fetchProducts = async (catId) => {
      loading.value = true
      products.value = [] 
      try {
        const url = `/api/products?category_id=${catId}`
        const response = await fetch(url)
        if (response.ok) {
          products.value = await response.json()
        }
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    const filterByCategory = (id) => {
      selectedCategoryId.value = id
      fetchProducts(id)
      setTimeout(() => {
        const el = document.getElementById('catalog')
        if(el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }

    const resetFilter = () => {
      selectedCategoryId.value = null
      products.value = []
    }

    const addToCart = (product) => {
      alert(`Товар "${product.name}" добавлен в корзину!`)
    }

    onMounted(async () => {
      // Запуск таймера новостей (5 сек)
      newsInterval = setInterval(() => {
        currentNewsIndex.value = (currentNewsIndex.value + 1) % newsItems.value.length
      }, 5000)

      try {
        const [storeRes, categoriesRes] = await Promise.all([
          fetch('/api/store-info'),
          fetch('/api/categories')
        ])
        
        if (storeRes.ok) storeInfo.value = await storeRes.json()
        if (categoriesRes.ok) categories.value = await categoriesRes.json()
      } catch (error) {
        console.log('Ошибка загрузки данных')
      }
    })

    onUnmounted(() => {
      if (newsInterval) clearInterval(newsInterval)
    })

    return {
      storeInfo, products, categories, loading,
      selectedCategoryId, selectedCategoryName, discountedCategories,
      newsItems, currentNewsIndex,
      getCategoryName, filterByCategory, resetFilter, addToCart
    }
  }
}
</script>
