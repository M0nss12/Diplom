<template>
  <div class="container animate-fade-in">
    <div class="about-section">
      <h1 class="text-center">О нашем магазине</h1>
      
      <div v-if="aboutData.title" class="about-content">
        <h2>{{ aboutData.title }}</h2>
        <p class="mb-8">{{ aboutData.description }}</p>

        <div class="about-features">
          <div v-for="(feature, index) in aboutData.features" :key="index" class="feature-card">
            <div class="feature-icon">✓</div>
            <h3 class="feature-title">Преимущество {{ index + 1 }}</h3>
            <p class="feature-text">{{ feature }}</p>
          </div>
        </div>

        <div class="mt-8">
          <h3>Наша миссия</h3>
          <p>Мы стремимся сделать покупку автозапчастей максимально простой, удобной и выгодной для каждого автовладельца.</p>
        </div>

        <div class="mt-8">
          <h3>Наши ценности</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div class="card p-4 text-center">
              <div class="text-3xl mb-2">🔧</div>
              <h4>Качество</h4>
              <p>Только оригинальные и сертифицированные товары</p>
            </div>
            <div class="card p-4 text-center">
              <div class="text-3xl mb-2">🚚</div>
              <h4>Скорость</h4>
              <p>Быстрая доставка по всей России</p>
            </div>
            <div class="card p-4 text-center">
              <div class="text-3xl mb-2">💯</div>
              <h4>Надежность</h4>
              <p>Гарантия на все товары и возврат в течение 30 дней</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="about-content">
          <h2>AutoParts Pro - Ваш надежный партнер</h2>
          <p class="mb-8">Мы работаем на рынке автозапчастей с 2010 года и за это время заслужили доверие тысяч автомобилистов по всей России.</p>

          <div class="about-features">
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title">Качество</h3>
              <p class="feature-text">Только оригинальные и сертифицированные товары от проверенных производителей</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title">Доставка</h3>
              <p class="feature-text">Быстрая доставка по всей России от 1 дня в зависимости от региона</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title">Гарантия</h3>
              <p class="feature-text">Гарантия на все товары и возможность возврата в течение 30 дней</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👨‍🔧</div>
              <h3 class="feature-title">Экспертиза</h3>
              <p class="feature-text">Профессиональные консультации от наших специалистов</p>
            </div>
          </div>

          <div class="mt-8">
            <h3>Почему выбирают нас?</h3>
            <ul class="mt-4" style="list-style: none; padding-left: 0;">
              <li class="mb-2">✅ Более 50,000 товаров в каталоге</li>
              <li class="mb-2">✅ Официальные поставщики ведущих брендов</li>
              <li class="mb-2">✅ Собственный склад и служба доставки</li>
              <li class="mb-2">✅ Техническая поддержка 24/7</li>
              <li class="mb-2">✅ Система скидок для постоянных клиентов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'AboutView',
  setup() {
    const aboutData = ref({})

    onMounted(async () => {
      try {
        const response = await fetch('/api/about')
        if (response.ok) {
          aboutData.value = await response.json()
        }
      } catch (error) {
        console.log('Используются локальные данные')
      }
    })

    return {
      aboutData
    }
  }
}
</script>