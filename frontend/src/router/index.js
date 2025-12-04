import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', component: () => import('../views/AboutView.vue') },
  { path: '/contacts', component: () => import('../views/ContactsView.vue') },
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/register', component: () => import('../views/RegisterView.vue') },

  // АДМИН ПАНЕЛЬ
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/admin/products' },
      // Доступны всем (кто зашел в админку)
      { path: 'products', component: () => import('../views/admin/AdminProducts.vue') },
      { path: 'categories', component: () => import('../views/admin/AdminCategories.vue') },
      { path: 'brands', component: () => import('../views/admin/AdminBrands.vue') },
      
      // Доступны ТОЛЬКО АДМИНУ
      { 
        path: 'users', 
        component: () => import('../views/admin/AdminUsers.vue'),
        meta: { onlyAdmin: true } 
      },
      { 
        path: 'orders', 
        component: () => import('../views/admin/AdminOrders.vue'),
        meta: { onlyAdmin: true } 
      },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// ЗАЩИТА МАРШРУТОВ
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Если маршрут требует прав админа
  if (to.meta.onlyAdmin) {
    if (!user || user.role !== 'admin') {
      // Если не админ - на главную админки или сайта
      return next('/admin/products'); 
    }
  }
  
  next();
})

export default router