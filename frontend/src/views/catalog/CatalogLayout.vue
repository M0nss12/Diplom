<template>
  <div class="catalog-wrapper">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">🛍️</span>
        <span>Магазин</span>
      </div>
      
      <nav class="sidebar-nav">
        
        <div class="nav-section">

                <div class="nav-divider"></div>
        <router-link to="/" class="nav-item back-link">
            <span class="nav-icon">🏠</span> Главная
        </router-link>
          
          <router-link to="/catalog/products" class="nav-item">
            <span class="nav-icon">📦</span> Товары
          </router-link>
          
          <router-link to="/cart" class="nav-item cart-link-sidebar">
            <div>
              <span class="nav-icon">🛒</span> Корзина
            </div>
            <div v-if="cartItemCount > 0" class="cart-details-wrapper">
              <span class="sidebar-cart-count">{{ cartItemCount }} шт.</span>
              <span class="sidebar-cart-price">{{ formatPrice(totalPrice) }} ₽</span>
            </div>
          </router-link>
          <div v-if="isAdmin" class="nav-divider"></div>

          <template v-if="isAdmin">
            <router-link to="/catalog/categories" class="nav-item">
              <span class="nav-icon">📂</span> Категории
            </router-link>
            <router-link to="/catalog/brands" class="nav-item">
              <span class="nav-icon">🏷️</span> Бренды
            </router-link>
            
            <router-link to="/catalog/users" class="nav-item">
              <span class="nav-icon">👥</span> Клиенты
            </router-link>
            <router-link to="/catalog/orders" class="nav-item">
              <span class="nav-icon">📝</span> Заказы
            </router-link>
            <router-link to="/catalog/logs" class="nav-item">
              <span class="nav-icon">📜</span> Логи
            </router-link>
          </template>
        </div>
        
        <template v-if="!isAdmin && $route.path === '/catalog/products'">
          <div class="nav-divider"></div>
          <div class="nav-section filter-section">
            <h4 class="nav-title-visible">🔎 Фильтр и Сортировка</h4> 

            <div class="form-group-compact">
              <label for="sort-filter">Сортировка:</label>
              <select id="sort-filter" v-model="filters.sortValue" class="form-select">
                <option value="">По умолчанию</option>
                <option value="price_asc">Сначала недорогие (↑)</option>
                <option value="price_desc">Сначала дорогие (↓)</option>
              </select>
            </div>


            <div class="form-group-compact">
              <label for="cat-filter">Категория:</label>
              <select id="cat-filter" v-model="filters.selectedCategory" class="form-select">
                <option value="">Все</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div class="form-group-compact">
              <label for="brand-filter">Бренд:</label>
              <select id="brand-filter" v-model="filters.selectedBrand" class="form-select">
                <option value="">Все</option>
                <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
              </select>
            </div>
            
            <div class="form-group-compact">
              <label for="discount-filter">Скидки:</label>
              <select id="discount-filter" v-model="filters.hasDiscount" class="form-select">
                  <option value="">Все</option>
                  <option :value="true">Только со скидкой</option>
              </select>
            </div>

            <div class="form-group-compact price-filter-group">
              <label>Цена (₽):</label>
              <div class="price-range-inputs">
                  <input type="number" 
                       v-model.number="localPriceMin" 
                       placeholder="Мин" 
                       class="form-input" 
                       :key="'min' + maxPrice">
                <input type="number" 
                       v-model.number="localPriceMax" 
                       :placeholder="`Макс (${formatPrice(initialMaxPrice)})`" 
                       class="form-input"
                       :key="'max' + maxPrice">
              </div>
            </div>

            <div class="filter-actions mt-2">
              <button class="btn btn-primary btn-sm w-100" @click="triggerFilterAction(true)">Применить</button>
              <button class="btn btn-outline btn-sm w-100 mt-1" @click="resetFilters">Сбросить</button>
            </div>
          </div>
        </template>
        
      </nav>
    </aside>

    <main class="catalog-content">
      <header class="content-header">
        <div class="content-header-inner" style="display: flex; align-items: center; justify-content: flex-start; width: 100%;">
          <div class="user-info">Пользователь: <strong>{{ username }}</strong></div>
        </div>
      </header>
      
      <div class="content-body">
          <router-view 
          :filters="filters" 
          :categories="categories" 
          :brands="brands"
          :maxPrice="initialMaxPrice" 
          @update:items="updateFilterOptions"
          @trigger-filter="applyFilters" 
        />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed, provide, watch } from 'vue'; 
import { useCart } from '@/composables/useCart'; 

export default {
  name: 'CatalogLayout',
  setup() {
    const user = ref(null);
    const categories = ref([]);
    const brands = ref([]);
    
    // Исходная (глобальная) максимальная цена
    const initialMaxPrice = ref(10000); 
    // Текущая максимальная цена (для плейсхолдера)
    const maxPrice = ref(initialMaxPrice.value); 
    
    // Локальные переменные для ввода цены (отвязаны от основного фильтра)
    const localPriceMin = ref(0);
    const localPriceMax = ref(initialMaxPrice.value);
    
    // Получаем данные корзины
    const { totalItems: cartItemCount, totalPrice } = useCart();
    
    const filters = ref({
      selectedCategory: '',
      selectedBrand: '',
      priceMin: 0,
      priceMax: initialMaxPrice.value, 
      hasDiscount: '',
      sortValue: '', 
    });
    
    // Эмиттер для связи с дочерним компонентом
    const filterEventEmitter = ref(null);
    provide('filterEventEmitter', filterEventEmitter);
    
    const formatPrice = (value) => {
        if (typeof value !== 'number') return value;
        return Math.floor(value).toLocaleString('ru-RU'); 
    };
    
    const fetchFilterOptions = async () => {
      try {
        const [catRes, brandRes, priceRes] = await Promise.all([
          fetch('/api/categories'), 
          fetch('/api/brands'),
          fetch('/api/products/max-price') 
        ]);
        
        if (catRes.ok) categories.value = await catRes.json();
        if (brandRes.ok) brands.value = await brandRes.json();
        
        if (priceRes.ok) {
            const data = await priceRes.json();
            const globalMax = Math.ceil(data.max_price / 100) * 100;
            initialMaxPrice.value = globalMax;
            maxPrice.value = globalMax;
            
            // Установка значений по умолчанию, если они еще не установлены
            if (filters.value.priceMax === 10000) { 
                filters.value.priceMax = globalMax;
                localPriceMax.value = globalMax;
            }
            localPriceMin.value = filters.value.priceMin;
        }

      } catch (e) {
        console.error("Ошибка загрузки опций фильтра:", e);
      }
    };
    
    // Наблюдение за изменениями в фильтрах, кроме цены (которая теперь запускается вручную)
    // чтобы сортировка и остальные фильтры срабатывали сразу.
    watch(() => filters.value.sortValue, () => triggerFilterAction(false));
    watch(() => filters.value.selectedCategory, () => triggerFilterAction(false));
    watch(() => filters.value.selectedBrand, () => triggerFilterAction(false));
    watch(() => filters.value.hasDiscount, () => triggerFilterAction(false));
    
    const updateFilterOptions = (items) => {
        if (items && items.length > 0) {
            const prices = items.map(p => Number(p.price)).filter(p => !isNaN(p));
            if (prices.length === 0) return;
            
            const currentMax = Math.max(...prices);
            
            // Обновляем maxPrice только для отображения в плейсхолдере
            maxPrice.value = Math.ceil(currentMax / 100) * 100; 
        } else {
            maxPrice.value = initialMaxPrice.value;
        }
    }
    
    // isManualTrigger = true, если нажата кнопка "Применить"
    const triggerFilterAction = (isManualTrigger = true) => {
        // Синхронизируем цену только при нажатии кнопки "Применить" (true) или "Сбросить"
        if (isManualTrigger) {
            filters.value.priceMin = localPriceMin.value;
            filters.value.priceMax = localPriceMax.value;
        }

      if (filterEventEmitter.value) {
        filterEventEmitter.value('applyFilters');
      }
    };
    
    const resetFilters = () => {
      filters.value.selectedCategory = '';
      filters.value.selectedBrand = '';
      filters.value.hasDiscount = ''; 
      filters.value.sortValue = '';
      
      // Восстанавливаем цену в основном фильтре и локальных переменных
      filters.value.priceMin = 0;
      filters.value.priceMax = initialMaxPrice.value; 
      
      localPriceMin.value = 0;
      localPriceMax.value = initialMaxPrice.value;
      
      // Запускаем фильтрацию
      triggerFilterAction(false);
    };

    // Метод для компонента ProductList, который может его вызвать
    const applyFilters = () => {
        triggerFilterAction();
    }
    
    onMounted(() => {
      const userStr = localStorage.getItem('user');
      user.value = userStr ? JSON.parse(userStr) : null;
      fetchFilterOptions();
    });

    const isAdmin = computed(() => user.value && user.value.role === 'admin');
    const username = computed(() => user.value ? user.value.username : 'Гость');
    
    // Предоставляем фильтры для ProductList
    provide('filters', filters); 

    return { 
      isAdmin, 
      username,
      categories,
      brands,
      initialMaxPrice,
      maxPrice,
      filters,
      localPriceMin, 
      localPriceMax, 
      updateFilterOptions,
      triggerFilterAction, 
      resetFilters, 
      applyFilters,
      cartItemCount,
      totalPrice, 
      formatPrice, 
    };
  }
}
</script>