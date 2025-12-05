<template>
  <div class="container animate-fade-in">
    
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

    <div class="hero text-center-wrapper">
      <div class="hero-content">
        <h1>{{ storeInfo.name || 'AutoParts Pro' }}</h1>
        <p>{{ storeInfo.description || 'Лучшие автозапчасти и аксессуары' }}</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total_products || '0' }}</div>
            <div class="stat-label">Товаров в каталоге</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.unique_customers || '0' }}</div>
            <div class="stat-label">Довольных клиентов</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.shipped_orders || '0' }}</div>
            <div class="stat-label">Выполненных заказов</div>
          </div>
        </div>
      </div>
    </div>

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
    
    <div v-if="selectedCategoryId" class="section" id="catalog" ref="catalogSection">
      
      <h2 class="section-title">
        <span>Категория: {{ selectedCategoryName }}</span>
        <button @click="resetFilter" class="btn btn-outline" style="margin-left: 1rem; font-size: 0.8rem;">
          ✕ Закрыть
        </button>
      </h2>

      <div v-if="loading" class="text-center p-8">
        <div class="loader"></div>
      </div>

      <div v-else-if="products.length === 0" class="text-center p-8 card">
        <p>В этой категории товары закончились.</p>
        <button @click="resetFilter" class="btn btn-primary mt-4">Выбрать другую</button>
      </div>

      <div v-else class="products-grid animate-fade-in">
        <div v-for="product in products" :key="product.id" class="product-card" @click="$router.push(`/catalog/products/${product.id}`)">
          <div class="product-image">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" style="width:100%; height:100%; object-fit:contain;">
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
              <span 
                v-if="getDiscountedPrice(product).oldPrice" 
                style="text-decoration: line-through; color: var(--gray); font-size: 0.9rem; margin-right: 5px;"
              >
                {{ getDiscountedPrice(product).oldPrice }} ₽
              </span>
              
              {{ getDiscountedPrice(product).currentPrice }} ₽
            </div>
            
            <button class="add-to-cart" @click.stop="handleAddToCart(product)">
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
import { useCart } from '@/composables/useCart';
import { useRouter } from 'vue-router'; // Добавим router

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter() // Инициализируем router
    const storeInfo = ref({})
    const products = ref([]) 
    const categories = ref([])
    const stats = ref({}) // Для хранения статистики
    const loading = ref(false)
    const selectedCategoryId = ref(null)
    const newsItems = ref([
      { date: 'NEW', text: 'Поступление зимней резины Michelin и Nokian!' },
      { date: 'SALE', text: 'Скидка 20% на все моторные масла Mobil 1.' },
      { date: 'INFO', text: 'График работы в праздники: с 10:00 до 18:00.' },
      { date: 'AUTO', text: 'Бесплатная диагностика подвески при покупке от 5000р.' }
    ])
    const currentNewsIndex = ref(0)
    let newsInterval = null

    const { addToCart } = useCart();

    // --- Логика News Ticker ---
    const startNewsTicker = () => {
        newsInterval = setInterval(() => {
            currentNewsIndex.value = (currentNewsIndex.value + 1) % newsItems.value.length
        }, 5000)
    }

    const stopNewsTicker = () => {
        if (newsInterval) clearInterval(newsInterval)
    }

    // --- Логика Категорий и Скидок ---
    const getCategoryName = (id) => {
      const cat = categories.value.find(c => c.id === id)
      return cat ? cat.name : ''
    }
    
    const getCategoryById = (id) => {
      return categories.value.find(c => c.id === id) || { discount_percent: 0 };
    }

    const getDiscountedPrice = (product) => {
      const originalPrice = Number(product.price);
      // Определяем базовую старую цену (либо старая цена с сервера, либо оригинальная цена)
      const baseOldPrice = product.old_price ? Number(product.old_price) : originalPrice; 

      // Получаем скидку из выбранной категории
      const category = getCategoryById(product.category_id || selectedCategoryId.value);
      const discount = Number(category.discount_percent || 0);
      
      if (discount > 0) {
        // Применяем скидку категории к оригинальной цене продукта
        const discountedPrice = originalPrice * (1 - discount / 100);
        return {
          oldPrice: baseOldPrice.toLocaleString('ru-RU'),
          currentPrice: discountedPrice.toLocaleString('ru-RU')
        };
      }
      
      // Если скидки категории нет
      if (!product.old_price || product.old_price <= originalPrice) {
          return {
              oldPrice: null,
              currentPrice: originalPrice.toLocaleString('ru-RU')
          };
      }
      
      // Если скидки категории нет, но есть old_price с сервера, которая выше текущей price
      return {
          oldPrice: baseOldPrice.toLocaleString('ru-RU'),
          currentPrice: originalPrice.toLocaleString('ru-RU')
      };
    };

    const selectedCategoryName = computed(() => {
      if (!selectedCategoryId.value) return null
      return getCategoryName(selectedCategoryId.value)
    })

    const discountedCategories = computed(() => {
      return categories.value.filter(c => Number(c.discount_percent) > 0)
    })
    
    // --- Логика Загрузки Продуктов ---
    const fetchProducts = async (catId) => {
      loading.value = true
      products.value = [] 
      try {
        const url = `/api/products?category_id=${catId}`
        const response = await fetch(url)
        if (response.ok) {
          const rawProducts = await response.json()
          // API может возвращать просто массив, или объект с полем data
          products.value = Array.isArray(rawProducts) ? rawProducts : (rawProducts.data || [])
        }
      } catch (e) {
        console.error("Ошибка при загрузке продуктов:", e)
      } finally {
        loading.value = false
      }
    }

    const filterByCategory = (id) => {
      selectedCategoryId.value = id
      fetchProducts(id)
      setTimeout(() => {
        // Прокрутка к каталогу
        const el = document.getElementById('catalog')
        if(el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }

    const resetFilter = () => {
      selectedCategoryId.value = null
      products.value = []
    }

    // --- Логика Корзины ---
    const handleAddToCart = (product) => {
      const prices = getDiscountedPrice(product);

      // Чистим строку от пробелов и заменяем запятую на точку для Number()
      const parsePrice = (priceStr) => Number(priceStr.replace(/\s/g, '').replace(',', '.'));

      const itemToAdd = {
        ...product,
        // Цена, по которой товар добавляется в корзину
        price: parsePrice(prices.currentPrice), 
        old_price: prices.oldPrice ? parsePrice(prices.oldPrice) : null
      };
      
      addToCart(itemToAdd);
      
      // Уведомление
      alert(`Товар "${product.name}" добавлен в корзину!`);
    }

    // --- Жизненный цикл ---
    onMounted(async () => {
      startNewsTicker()

      try {
        const [storeRes, categoriesRes, statsRes] = await Promise.all([
          fetch('/api/store-info').catch(() => ({ ok: false })),
          fetch('/api/categories').catch(() => ({ ok: false })),
          fetch('/api/stats').catch(() => ({ ok: false })) // Загружаем статистику
        ])
        
        if (storeRes.ok) storeInfo.value = await storeRes.json()
        if (categoriesRes.ok) categories.value = await categoriesRes.json()
        if (statsRes.ok) stats.value = await statsRes.json()
        
      } catch (error) {
        console.log('Ошибка загрузки данных', error)
      }
    })

    onUnmounted(() => {
      stopNewsTicker()
    })

    return {
      storeInfo, products, categories, stats, loading,
      selectedCategoryId, selectedCategoryName, discountedCategories,
      newsItems, currentNewsIndex,
      router, // Добавляем router
      getCategoryName, filterByCategory, resetFilter, 
      handleAddToCart,
      getDiscountedPrice 
    }
  }
}
</script>

<style scoped>
/* --- ЦВЕТА (Предполагаемые переменные) --- */
:root {
  --primary: #c0392b; /* Красный */
  --primary-dark: #a5281b; 
  --text-dark: #333;
  --gray: #666;
  --gray-light: #f4f4f4;
  --white: #fff;
  --border: #ddd;
  --radius: 8px;
  --radius-small: 4px;
}

/* --- ОСНОВНЫЕ СЕКЦИИ --- */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.section {
  margin-top: 3rem;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

/* --- HERO BLOCK (ОСВЕТЛЕННЫЙ И ЦЕНТРИРОВАННЫЙ) --- */
.hero {
    /* 1. СДЕЛАТЬ БЛОК СВЕТЛЕЕ */
    background-color: var(--gray-light); 
    color: var(--text-dark);           
    padding: 4rem 1rem;
    margin-bottom: 2rem;
    border-radius: var(--radius);
}

.text-center-wrapper {
    /* 2. ЦЕНТРИРОВАНИЕ КОНТЕНТА ВНУТРИ HERO */
    text-align: center; 
}

.hero h1 {
    font-size: 3rem;
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
}

.hero p {
    font-size: 1.2rem;
    color: var(--gray);
    margin-bottom: 2rem;
}
</style>