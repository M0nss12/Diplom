<template>
  <div class="success-page animate-fade-in">
    <div class="success-card card">
      <div class="icon-wrapper">✅</div>
      <h1>Оплата прошла успешно!</h1>
      <p>Спасибо за ваш заказ. Мы уже начали его собирать.</p>
      
      <div class="info-box">
        <p>Менеджер свяжется с вами в ближайшее время для уточнения деталей доставки.</p>
      </div>

      <button @click="$router.push('/')" class="btn btn-primary mt-6 w-100">
        Вернуться в магазин
      </button>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useCart } from '@/composables/useCart';

export default {
  setup() {
    const { clearCart } = useCart();

    onMounted(() => {
      // Как только пользователь попал сюда — очищаем корзину
      clearCart();
    });
  }
}
</script>