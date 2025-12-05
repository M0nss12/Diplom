import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  // --- ПУБЛИЧНЫЕ СТРАНИЦЫ ---
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', component: () => import('../views/AboutView.vue') },
  { path: '/contacts', component: () => import('../views/ContactsView.vue') },
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/register', component: () => import('../views/RegisterView.vue') },

  // --- КОРЗИНА И ЗАКАЗЫ ---
  { path: '/cart', component: () => import('../views/CartView.vue') },
  { path: '/success', component: () => import('../views/SuccessView.vue') },
  { path: '/my-orders', component: () => import('../views/MyOrdersView.vue') }, // Добавлен маршрут

  // --- ПАНЕЛЬ УПРАВЛЕНИЯ (CATALOG) ---
  {
    path: '/catalog',
    component: () => import('../views/catalog/CatalogLayout.vue'),
    children: [
      { path: '', redirect: '/catalog/products' },

      // ТОВАРЫ
      { 
        path: 'products', 
        component: () => import('../views/catalog/products/ProductList.vue') 
      },
      { 
        path: 'products/:id', 
        component: () => import('../views/catalog/products/ProductDetail.vue') 
      },

      // КАТЕГОРИИ
      { 
        path: 'categories', 
        component: () => import('../views/catalog/categories/CategoryList.vue') 
      },
      { 
        path: 'categories/:id', 
        component: () => import('../views/catalog/categories/CategoryDetail.vue') 
      },

      // БРЕНДЫ
      { 
        path: 'brands', 
        component: () => import('../views/catalog/brands/BrandList.vue') 
      },
      { 
        path: 'brands/:id', 
        component: () => import('../views/catalog/brands/BrandDetail.vue') 
      },
      
      // ПОЛЬЗОВАТЕЛИ (Только админ)
      { 
        path: 'users', 
        component: () => import('../views/catalog/users/UserList.vue'),
        meta: { onlyAdmin: true } 
      },
      { 
        path: 'users/:id', 
        component: () => import('../views/catalog/users/UserDetail.vue'),
        meta: { onlyAdmin: true } 
      },

      // ЗАКАЗЫ (Только админ - управление всеми заказами)
      { 
        path: 'orders', 
        component: () => import('../views/catalog/orders/OrderList.vue'),
        meta: { onlyAdmin: true } 
      },
      { 
        path: 'orders/:id', 
        component: () => import('../views/catalog/orders/OrderDetail.vue'),
        meta: { onlyAdmin: true } 
      },

      // ОТЗЫВЫ (Только админ)
      { 
        path: 'reviews', 
        component: () => import('../views/catalog/reviews/ReviewList.vue'),
        meta: { onlyAdmin: true } 
      },
      { 
        path: 'reviews/:id', 
        component: () => import('../views/catalog/reviews/ReviewDetail.vue'),
        meta: { onlyAdmin: true } 
      },
    ]
  },
  
  // Редирект для несуществующих страниц
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (to.meta.onlyAdmin) {
    if (!user || user.role !== 'admin') {
      // Если нет прав, отправляем на список товаров (он доступен всем авторизованным в админке)
      return next('/catalog/products'); 
    }
  }
  next();
})

export default router