import { ref, computed, watch } from 'vue';

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
const cartItems = ref([]);
const currentUserKey = ref('cart_guest');

// Определяем ключ для localStorage (user_ID или guest)
const getStorageKey = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return `cart_${user.id}`;
    } catch (e) {
      console.error('Ошибка чтения пользователя', e);
      return 'cart_guest';
    }
  }
  return 'cart_guest';
};

// Загрузка корзины
const loadCart = () => {
  currentUserKey.value = getStorageKey();
  const stored = localStorage.getItem(currentUserKey.value);
  
  if (stored) {
    try {
      cartItems.value = JSON.parse(stored);
    } catch (e) {
      console.error('Ошибка парсинга корзины, сброс', e);
      cartItems.value = [];
    }
  } else {
    cartItems.value = [];
  }
  console.log(`Корзина загружена [${currentUserKey.value}]:`, cartItems.value);
};

// Инициализация при первом запуске
loadCart();

// Сохранение при любых изменениях
watch(cartItems, (newVal) => {
  console.log('Сохранение корзины...', newVal.length, 'товаров');
  localStorage.setItem(currentUserKey.value, JSON.stringify(newVal));
}, { deep: true });

// --- ХУК ---
export function useCart() {
  
  // Принудительное обновление (при входе/выходе)
  const refreshCart = () => {
    console.log('Смена пользователя, перезагрузка корзины...');
    loadCart();
  };

  const addToCart = (product) => {
    if (!product || !product.id) return console.error('Ошибка: невалидный товар', product);

    // Используем == для сравнения (чтобы '5' == 5 работало)
    const existing = cartItems.value.find(item => item.id == product.id);

    if (existing) {
      existing.quantity++;
      console.log('Увеличено количество:', existing.name);
    } else {
      // Создаем ЧИСТЫЙ объект, приводим типы
      const newItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price), // Гарантируем число
        image_url: product.image_url,
        quantity: 1
      };
      cartItems.value.push(newItem);
      console.log('Добавлен новый товар:', newItem.name);
    }
  };

  const removeFromCart = (productId) => {
    cartItems.value = cartItems.value.filter(item => item.id != productId);
  };

  const updateQuantity = (productId, amount) => {
    const item = cartItems.value.find(i => i.id == productId);
    if (item) {
      item.quantity += amount;
      if (item.quantity <= 0) {
        removeFromCart(productId);
      }
    }
  };

  const clearCart = () => {
    cartItems.value = [];
  };

  // Вычисляемые свойства
  const totalCount = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));
  
  const totalPrice = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  });

  return {
    cartItems,
    totalCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart
  };
}