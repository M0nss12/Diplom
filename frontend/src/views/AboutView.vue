<template>
  <div class="container animate-fade-in about-view-page">
    
    <div class="about-hero">
      <div class="hero-content">
        <h1>О компании <span class="text-primary">AutoParts Pro</span></h1>
        <p class="lead-text">
          Ваш надежный партнер в мире автозапчастей с {{ yearsOfOperation }}+ лет опыта. 
          Мы предлагаем только сертифицированные детали и экспертную поддержку 24/7.
        </p>
        <router-link to="/catalog" class="btn btn-primary mt-4 btn-lg">
          Перейти в каталог
        </router-link>
      </div>
      <div class="hero-image-placeholder">
        <div class="icon-car">⚙️</div>
        <p>Квалификация и надёжность</p>
      </div>
    </div>
    
    <div v-if="loadingStats" class="text-center p-8">
        <div class="loader"></div>
        <p>Загрузка статистики...</p>
    </div>
    <div v-else class="stats-counter-section">
      <div v-for="(stat, index) in stats" :key="index" class="stat-item">
        <div class="stat-number-animated" :data-target="stat.value" :data-duration="2000">
          {{ stat.value.toLocaleString('ru-RU') }}
        </div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title text-center">Почему нам доверяют тысячи клиентов?</h2>
      <div class="about-features-grid">
        
        <div class="feature-card-new">
          <div class="icon-wrapper">🚀</div>
          <h3>Огромный Ассортимент</h3>
          <p>Более {{ stats[1].value.toLocaleString('ru-RU') }} уникальных товаров в наличии и под заказ для любых марок автомобилей.</p>
        </div>
        
        <div class="feature-card-new">
          <div class="icon-wrapper">🔒</div>
          <h3>Гарантия Качества</h3>
          <p>Работаем только с официальными поставщиками. Все товары сертифицированы и имеют полную гарантию.</p>
        </div>
        
        <div class="feature-card-new">
          <div class="icon-wrapper">👨‍🔧</div>
          <h3>Экспертная Поддержка</h3>
          <p>Наши специалисты с многолетним опытом помогут подобрать нужную деталь и проконсультируют по установке.</p>
        </div>
        
        <div class="feature-card-new">
          <div class="icon-wrapper">💰</div>
          <h3>Выгодные Цены</h3>
          <p>Прямые поставки позволяют нам предлагать конкурентные цены и регулярные акции для наших клиентов.</p>
        </div>
        
      </div>
    </div>

    <div class="section contacts-section">
      <h2 class="section-title text-center">Всегда на связи и готовы помочь</h2>
      <div class="contact-cards-grid">
          
        <div class="contact-card-item">
          <div class="icon-wrapper">📞</div>
          <h3>Горячая линия</h3>
          <p class="text-xl font-bold">{{ contacts.phone || '+7 (XXX) XXX-XX-XX' }}</p>
          <p>Звоните нам в любое время. Консультации бесплатны.</p>
        </div>

        <div class="contact-card-item">
          <div class="icon-wrapper">⏳</div>
          <h3>График работы</h3>
          <p class="text-xl font-bold">{{ contacts.workHours || 'Пн-Вс: 9:00 - 21:00' }}</p>
          <p>Мы работаем, когда это нужно вам. Без выходных.</p>
        </div>

        <div class="contact-card-item">
          <div class="icon-wrapper">📍</div>
          <h3>Наш адрес</h3>
          <p class="text-xl font-bold">{{ contacts.address || 'г. Москва, ул. Примерная, д. 1' }}</p>
          <p>Приезжайте за самовывозом или для личной консультации.</p>
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
    const yearsOfOperation = 2024 - 2010; 
    const loadingStats = ref(true);
    const contacts = ref({}); // Новый state для контактов
    
    const stats = ref([
      { label: 'Лет на рынке', value: yearsOfOperation },
      { label: 'Товаров в каталоге', value: 0 },
      { label: 'Довольных клиентов', value: 0 },
      { label: 'Отгруженных заказов', value: 0 },
    ]);

    // ДАННЫЕ ДЛЯ КОМАНДЫ УДАЛЕНЫ (teamMembers)
    const teamMembers = ref([]); 

    // Функция для анимации счетчиков (без изменений)
    const runCountUp = () => {
      const duration = 2000;
      document.querySelectorAll('.stat-number-animated').forEach(el => {
        const target = parseInt(el.dataset.target);
        const start = 0;
        let startTime = null;

        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const percentage = Math.min(progress / duration, 1);
          const interpolatedValue = percentage < 0.5 ? 2 * percentage * percentage : -1 + (4 - 2 * percentage) * percentage;
          const currentValue = Math.floor(interpolatedValue * target);

          el.textContent = currentValue.toLocaleString('ru-RU');

          if (percentage < 1) {
            window.requestAnimationFrame(step);
          } else {
            el.textContent = target.toLocaleString('ru-RU');
          }
        };

        window.requestAnimationFrame(step);
      });
    };

    // ФУНКЦИЯ ЗАГРУЗКИ СТАТИСТИКИ
    const fetchStats = async () => {
      loadingStats.value = true;
      try {
        const response = await fetch('/api/stats');
        
        if (response.ok) {
          const apiStats = await response.json();
          stats.value = [
            { label: 'Лет на рынке', value: yearsOfOperation },
            { label: 'Товаров в каталоге', value: apiStats.total_products || 0 },
            { label: 'Довольных клиентов', value: apiStats.unique_customers || 0 }, 
            { label: 'Отгруженных заказов', value: apiStats.shipped_orders || 0 }, 
          ];
        } else {
            stats.value[1].value = 54000;
            stats.value[2].value = 125800;
            stats.value[3].value = 380000;
        }

      } catch (error) {
        stats.value[1].value = 54000;
        stats.value[2].value = 125800;
        stats.value[3].value = 380000;
      } finally {
        loadingStats.value = false;
        setTimeout(runCountUp, 50); 
      }
    };
    
    // НОВАЯ ФУНКЦИЯ: ЗАГРУЗКА КОНТАКТОВ
    const fetchContacts = async () => {
        try {
            const response = await fetch('/api/contacts');
            if (response.ok) {
                contacts.value = await response.json();
            }
        } catch (error) {
            console.error('Ошибка при загрузке контактов:', error);
        }
    };

    onMounted(async () => {
      await Promise.all([
          fetchStats(), 
          fetchContacts() // Загружаем контакты при монтировании
      ]);
    });

    return {
      yearsOfOperation,
      stats,
      contacts, // Возвращаем контакты
      teamMembers, 
      loadingStats,
    }
  }
}
</script>

<style scoped>
/* ПРЕДПОЛАГАЕМЫЕ ОСНОВНЫЕ ПЕРЕМЕННЫЕ */
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

/* --- ОСНОВНЫЕ СТИЛИ СЕКЦИЙ --- */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
.section {
  margin-top: 4rem;
  margin-bottom: 4rem;
}
.section-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2rem;
}
.text-primary {
    color: var(--primary);
}
.lead-text {
    font-size: 1.15rem;
    color: var(--gray);
    max-width: 800px;
    margin: 1rem auto 0;
}
.btn {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-small);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
}
.btn-primary {
    background-color: var(--primary);
    color: var(--white);
    border: 1px solid var(--primary);
}
.btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
}
.btn-lg {
    font-size: 1.1rem;
}

/* --- HERO SECTION --- */
.about-hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--gray-light);
    border-radius: var(--radius);
    padding: 3rem 2rem;
    text-align: left;
}
.hero-content {
    max-width: 60%;
}
.hero-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 250px;
    height: 200px;
    background-color: var(--white);
    border-radius: var(--radius);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.icon-car {
    font-size: 4rem;
    line-height: 1;
    margin-bottom: 0.5rem;
}
.hero-image-placeholder p {
    font-weight: 600;
    color: var(--primary);
}

/* --- STATS COUNTER SECTION --- */
.stats-counter-section {
    display: flex;
    justify-content: space-around;
    gap: 1.5rem;
    margin-top: 3rem;
    padding: 2rem 0;
    text-align: center;
    background-color: var(--white);
    border-radius: var(--radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.stat-item {
    flex-basis: 25%;
}
.stat-number-animated {
    font-size: 2.8rem;
    font-weight: 800;
    color: var(--primary-dark);
    line-height: 1.1;
}
.stat-label {
    font-size: 1rem;
    color: var(--gray);
    margin-top: 0.5rem;
}

/* --- FEATURES GRID --- */
.about-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.feature-card-new {
    padding: 1.5rem;
    background-color: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s;
}
.feature-card-new:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.icon-wrapper {
    font-size: 2rem;
    margin-bottom: 1rem;
}
.feature-card-new h3 {
    font-size: 1.25rem;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
}
.feature-card-new p {
    color: var(--gray);
    font-size: 0.95rem;
}

/* --- НОВЫЕ СТИЛИ: КОНТАКТЫ И ДОСТУПНОСТЬ --- */
.contacts-section {
    background-color: #fcfcfc;
    padding: 2rem 1rem;
    border-radius: var(--radius);
}
.contact-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}
.contact-card-item {
    background-color: var(--white);
    padding: 2rem;
    border-radius: var(--radius);
    text-align: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    border-top: 4px solid var(--primary);
}
.contact-card-item h3 {
    font-size: 1.4rem;
    color: var(--primary-dark);
    margin: 1rem 0 0.5rem;
}
.contact-card-item p {
    color: var(--gray);
    margin-bottom: 0;
}
.contact-card-item .icon-wrapper {
    background-color: var(--gray-light);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin: 0 auto;
}

/* --- Адаптивность --- */
@media (max-width: 900px) {
    .about-hero {
        flex-direction: column;
        text-align: center;
        padding: 2rem 1rem;
    }
    .hero-content {
        max-width: 100%;
        margin-bottom: 1.5rem;
    }
    .stats-counter-section {
        flex-wrap: wrap;
    }
    .stat-item {
        flex-basis: 45%;
        margin-bottom: 1rem;
    }
}
@media (max-width: 500px) {
    .stat-number-animated {
        font-size: 2rem;
    }
    .contact-cards-grid {
        grid-template-columns: 1fr;
    }
}
</style>