<template>
  <div class="container animate-fade-in" style="margin-top: 2rem; margin-bottom: 4rem;">
    <h1>🛒 Оформление заказа</h1>

    <div v-if="cartItems.length === 0" class="text-center p-8 card">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🛍️</div>
      <p>Ваша корзина пуста.</p>
      <button @click="$router.push('/')" class="btn btn-primary mt-4">Перейти в каталог</button>
    </div>

    <div v-else class="cart-layout">
      
      <div class="cart-left-column">
        <div class="cart-items-list mb-6">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="item-img-wrapper">
              <img :src="item.image_url || 'https://via.placeholder.com/100'" alt="Товар">
            </div>
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="price-single">{{ item.price.toLocaleString() }} ₽</p>
            </div>
            <div class="item-controls">
              <button class="qty-btn" @click="updateQuantity(item.id, -1)">−</button>
              <span class="qty-val">{{ item.quantity }}</span>
              <button class="qty-btn" @click="updateQuantity(item.id, 1)">+</button>
            </div>
            <div class="item-total-price">
              {{ (item.price * item.quantity).toLocaleString() }} ₽
            </div>
            <button class="remove-btn" @click="removeFromCart(item.id)">✕</button>
          </div>
        </div>

        <div class="card p-6" v-if="user">
          <h2 class="mb-4">📋 Данные получателя</h2>
          
          <div class="form-group">
            <label class="form-label">Способ получения</label>
            <div class="delivery-options">
              <label class="radio-label">
                <input type="radio" value="pickup" v-model="form.deliveryType">
                <span class="radio-custom"></span>
                🏃 Самовывоз (Бесплатно)
              </label>
              <label class="radio-label">
                <input type="radio" value="delivery" v-model="form.deliveryType">
                <span class="radio-custom"></span>
                🚚 Доставка курьером ({{ SHIPPING_DELIVERY }} ₽)
              </label>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Имя</label>
              <input v-model="form.name" class="form-input" placeholder="Ваше имя">
            </div>
            <div class="form-group">
              <label class="form-label">Телефон</label>
              <input v-model="form.phone" class="form-input" placeholder="+7 (999) 000-00-00">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="example@mail.ru" disabled>
          </div>

          <div v-if="form.deliveryType === 'delivery'" class="animate-fade-in">
            <div class="form-group">
              <label class="form-label">Адрес доставки</label>
              <input v-model="form.address" class="form-input" placeholder="Город, улица, дом, квартира">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Комментарий</label>
            <textarea v-model="form.comment" class="form-textarea" placeholder="Комментарий курьеру, код домофона, этаж..."></textarea>
          </div>

          <div class="form-group checkbox-group mt-4" style="background: none; padding: 0;">
            <input type="checkbox" id="saveDetails" v-model="saveDetails">
            <label for="saveDetails" style="cursor: pointer; user-select: none;">
              Сохранить мои данные (телефон и адрес) для будущих заказов
            </label>
          </div>
        </div>

        <div class="card p-6 mt-4" v-if="user">
          <h2 class="mb-4">💳 Способ оплаты</h2>
          
          <div class="delivery-options">
            <label class="radio-label">
              <input type="radio" value="Онлайн-платеж" v-model="form.paymentMethod">
              <span class="radio-custom"></span>
              Онлайн-платеж (Картой на сайте)
            </label>
            <label class="radio-label">
              <input type="radio" value="Оплата картой" v-model="form.paymentMethod">
              <span class="radio-custom"></span>
              Оплата картой при получении
            </label>
            <label class="radio-label">
              <input type="radio" value="Наличными" v-model="form.paymentMethod">
              <span class="radio-custom"></span>
              Наличными при получении
            </label>
          </div>
        </div>
      </div>

      <div class="cart-summary card">
        <h2>Итого</h2>
        <div class="summary-line">
          <span>Товары ({{ totalCount }})</span>
          <span>{{ totalPrice.toLocaleString() }} ₽</span>
        </div>
        <div class="summary-line">
          <span>Доставка</span>
          <span v-if="form.deliveryType === 'pickup'" style="color: var(--secondary);">0 ₽</span>
          <span v-else>{{ shippingCost.toLocaleString() }} ₽</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="summary-total">
          <span>Всего:</span>
          <span>{{ (totalPrice + shippingCost).toLocaleString() }} ₽</span>
        </div>
        
        <div v-if="user" class="mt-4">
          <button @click="createOrder" class="btn btn-primary w-100 pay-btn" :disabled="isLoading">
             {{ isLoading ? 'Создание...' : '📝 Оформить заказ' }}
          </button>
          <div v-if="errorMsg" class="message error mt-2">{{ errorMsg }}</div>
        </div>
        
        <div v-else class="text-center mt-4">
          <p class="mb-2 text-sm" style="color: var(--danger);">Войдите, чтобы оформить заказ</p>
          <router-link to="/login" class="btn btn-outline w-100">Войти</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCart } from '@/composables/useCart';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const SHIPPING_DELIVERY = 500.00;

export default {
  setup() {
    const { cartItems, removeFromCart, updateQuantity, totalCount, totalPrice, clearCart } = useCart();
    const user = ref(null);
    const isLoading = ref(false);
    const errorMsg = ref('');
    const router = useRouter();
    const saveDetails = ref(false); 
    
    const form = ref({
      deliveryType: 'pickup',
      paymentMethod: 'Онлайн-платеж', 
      name: '',
      phone: '',
      email: '', 
      address: '',
      comment: ''
    });

    const shippingCost = computed(() => form.value.deliveryType === 'delivery' ? SHIPPING_DELIVERY : 0.00);

    const isFormValid = computed(() => {
      if (!form.value.name || form.value.name.length < 2) return false;
      if (!form.value.phone || form.value.phone.length < 5) return false;
      if (!form.value.paymentMethod) return false;
      // Если доставка, адрес обязателен
      if (form.value.deliveryType === 'delivery' && (!form.value.address || form.value.address.length < 5)) return false;
      return true;
    });

    onMounted(async () => {
      const u = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (u && token) {
        try {
          const localUserData = JSON.parse(u);
          user.value = localUserData;
          form.value.name = localUserData.username || '';
          form.value.email = localUserData.email || '';

          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const freshData = await res.json();
            if (freshData.phone) form.value.phone = freshData.phone;
            if (freshData.address) form.value.address = freshData.address;
            
            if (!freshData.phone || !freshData.address) {
                saveDetails.value = true;
            }
          }
        } catch (e) {
          console.error("Ошибка загрузки профиля", e);
        }
      }
    });

    const createOrder = async () => {
      errorMsg.value = '';

      if (!isFormValid.value) {
        errorMsg.value = 'Пожалуйста, заполните все обязательные поля (Имя, Телефон, Адрес при доставке).';
        return;
      }

      isLoading.value = true;
      const token = localStorage.getItem('token');

      // Формируем данные в формате, который ждет сервер
      const orderDetailsPayload = {
        // Если самовывоз, отправляем фиксированную строку, чтобы не было ошибки валидации
        delivery_address: form.value.deliveryType === 'delivery' 
          ? form.value.address 
          : 'Самовывоз: г. Москва, ул. Примерная, д. 1', 
        
        recipient_name: form.value.name,
        recipient_phone: form.value.phone,
        payment_method: form.value.paymentMethod, 
        user_comment: form.value.comment,
        shipping_cost: shippingCost.value,
        
        // Добавляем сырой адрес для обновления профиля (если сервер это использует)
        address: form.value.address 
      };

      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            cartItems: cartItems.value,
            orderDetails: orderDetailsPayload,
            saveDetails: saveDetails.value
          })
        });

        const data = await res.json();

        if (!res.ok) {
            // Выводим точную ошибку от сервера
            throw new Error(data.error || data.message || 'Не удалось создать заказ');
        }

        // Успех
        alert(`🎉 Заказ #${data.orderId} успешно оформлен!\nВаш трекинг-номер: ${data.trackingNumber}`);
        clearCart();
        router.push('/my-orders');
        
      } catch (err) {
        console.error(err);
        errorMsg.value = err.message || 'Ошибка при создании заказа';
      } finally {
        isLoading.value = false;
      }
    };

    return { 
      cartItems, removeFromCart, updateQuantity, totalCount, totalPrice, 
      user, createOrder, form, shippingCost, isLoading, errorMsg, saveDetails,
      SHIPPING_DELIVERY
    };
  }
}
</script>