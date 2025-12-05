<template>
  <div class="container animate-fade-in contacts-page">
    <h1 class="text-center">Контакты</h1>
    <p class="text-center mb-8 sub-header">Свяжитесь с нами любым удобным способом</p>

    <div class="contacts-section">
      <div class="contact-info card">
        <h2 class="section-title">Контактная информация</h2>
        
        <div v-for="(value, key) in filteredContacts" :key="key" class="contact-item">
          <div class="contact-icon">
            {{ getContactIcon(key) }}
          </div>
          <div class="contact-details">
            <h3>{{ getContactLabel(key) }}</h3>
            <p v-if="key === 'phone'"><a :href="'tel:' + value.replace(/\D/g, '')">{{ value }}</a></p>
            <p v-else-if="key === 'email'"><a :href="'mailto:' + value">{{ value }}</a></p>
            <p v-else>{{ value }}</p>
          </div>
        </div>

        <div class="mt-8 schedule-block">
          <h3 class="section-subtitle">График работы</h3>
          <div class="contact-item">
            <div class="contact-icon">⏰</div>
            <div class="contact-details">
              <h3>Часы работы</h3>
              <p>{{ contacts.workHours || 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00' }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 social-block">
          <h3 class="section-subtitle">Мы в социальных сетях</h3>
          <div class="social-links">
            <a :href="contacts.social_vk || '#'" target="_blank" class="social-link vk">VK</a>
            <a :href="contacts.social_tg || '#'" target="_blank" class="social-link tg">TG</a>
            <a href="#" class="social-link yt">YT</a>
            <a href="#" class="social-link wa">WA</a>
          </div>
        </div>
      </div>

      <div class="contact-form card">
        <h2 class="section-title">Обратная связь</h2>
        
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label" for="name">Ваше имя *</label>
            <input type="text" id="name" class="form-input" v-model="form.name" 
                   placeholder="Иван Иванов" required :disabled="loading">
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email *</label>
            <input type="email" id="email" class="form-input" v-model="form.email" 
                   placeholder="example@mail.com" required :disabled="loading">
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Телефон</label>
            <input type="tel" id="phone" class="form-input" v-model="form.phone" 
                   placeholder="+7 (999) 123-45-67" :disabled="loading">
          </div>

          <div class="form-group">
            <label class="form-label" for="subject">Тема *</label>
            <input type="text" id="subject" class="form-input" v-model="form.subject" 
                   placeholder="Вопрос о товаре или сотрудничестве" required :disabled="loading">
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Сообщение *</label>
            <textarea id="message" class="form-textarea" v-model="form.message" 
                      placeholder="Ваше сообщение..." required :disabled="loading"></textarea>
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading">Отправка...</span>
            <span v-else>Отправить сообщение</span>
          </button>
        </form>

        <div v-if="formMessage" class="message mt-4" :class="formMessage.type">
          {{ formMessage.text }}
        </div>
      </div>
    </div>

    <div class="card map-section mt-8">
      <h2 class="text-center mb-6 section-title">Как нас найти</h2>
      
      <div class="map-container-iframe"> 
        
        <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d562.0164761135363!2d37.63275911526149!3d55.70522618631699!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54b48bb6ff89f%3A0x482d1bbef28a4af5!2z0JDQstGC0L7Qt9Cw0LLQvtC00YHQutCw0Y8g0YPQuy4sIDE1LCDQnNC-0YHQutCy0LAsINCg0L7RgdGB0LjRjywgMTE1Mjgw!5e0!3m2!1sru!2slv!4v1765186356407!5m2!1sru!2slv" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"
            class="google-iframe"
        ></iframe>
        
        <p class="map-address-overlay static-address-label">
          <span class="location-icon">📍</span> 
          {{ contacts.address || 'г. Москва, ул. Автозаводская, д. 15' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'ContactsView',
  setup() {
    const contacts = ref({})
    const form = ref({
      name: '', email: '', phone: '', subject: '', message: ''
    })
    const formMessage = ref(null)
    const loading = ref(false) 
    
    const filteredContacts = computed(() => {
        const { workHours, social_vk, social_tg, social_yt, social_wa, ...rest } = contacts.value;
        return rest;
    });

    const getContactIcon = (key) => {
      const icons = { phone: '📞', email: '✉️', address: '📍' }
      return icons[key] || '📝'
    }

    const getContactLabel = (key) => {
      const labels = { phone: 'Телефон', email: 'Email', address: 'Адрес' }
      return labels[key] || key
    }

    const submitForm = async () => {
      if (loading.value) return;

      if (!form.value.name || !form.value.email || !form.value.subject || !form.value.message) {
        formMessage.value = { type: 'error', text: 'Пожалуйста, заполните все поля, отмеченные *' }
        return
      }
      
      loading.value = true;
      formMessage.value = null; 

      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.value)
        });

        const data = await response.json();

        if (response.ok) {
          formMessage.value = {
            type: 'success',
            text: data.message || 'Спасибо! Ваше сообщение отправлено.'
          }
          form.value = { name: '', email: '', phone: '', subject: '', message: '' }
        } else {
          formMessage.value = {
            type: 'error',
            text: data.error || 'Ошибка при отправке сообщения.'
          }
        }
      } catch (error) {
        console.error('Ошибка сети/сервера:', error);
        formMessage.value = { text: 'Ошибка подключения к серверу.', type: 'error' }
      } finally {
        loading.value = false;
        setTimeout(() => { formMessage.value = null }, 5000)
      }
    }
    
    onMounted(async () => {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          contacts.value = await response.json()
        } else {
             contacts.value = {
                 phone: '+7 (999) 123-45-67', email: 'info@autoparts.ru',
                 address: 'г. Москва, ул. Автозаводская, д. 15', workHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00',
                 social_vk: '#', social_tg: '#'
               }
        }
      } catch (error) {
         contacts.value = {
            phone: '+7 (999) 123-45-67', email: 'info@autoparts.ru',
            address: 'г. Москва, ул. Автозаводская, д. 15', workHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00',
            social_vk: '#', social_tg: '#'
         }
      }
    })

    return {
      contacts,
      filteredContacts,
      form,
      formMessage,
      loading,
      getContactIcon,
      getContactLabel,
      submitForm
    }
  }
}
</script>

<style scoped>

/* 💥 СТИЛИ ДЛЯ IFRAME КАРТЫ */
.map-section { padding: 2rem; }

.map-container-iframe {
    width: 100%;
    /* КРИТИЧНО! Задаем высоту для контейнера iframe */
    height: 400px; 
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    display: flex; /* Для корректного заполнения iframe */
}

.google-iframe {
    border: none;
    flex-grow: 1; /* Гарантируем, что iframe займет 100% высоты и ширины родителя */
}


</style>