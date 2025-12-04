<template>
  <div class="container animate-fade-in">
    <h1 class="text-center">Контакты</h1>
    <p class="text-center mb-8">Свяжитесь с нами любым удобным способом</p>

    <div class="contacts-section">
      <!-- Контактная информация -->
      <div class="contact-info">
        <h2 class="mb-6">Контактная информация</h2>
        
        <div v-for="(value, key) in contacts" :key="key" class="contact-item">
          <div class="contact-icon">
            {{ getContactIcon(key) }}
          </div>
          <div class="contact-details">
            <h3>{{ getContactLabel(key) }}</h3>
            <p>{{ value }}</p>
          </div>
        </div>

        <div class="mt-8">
          <h3 class="mb-4">График работы</h3>
          <div class="contact-item">
            <div class="contact-icon">⏰</div>
            <div class="contact-details">
              <h3>Часы работы</h3>
              <p>{{ contacts.workHours || 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00' }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8">
          <h3 class="mb-4">Мы в социальных сетях</h3>
          <div class="social-links">
            <a href="#" class="social-link">VK</a>
            <a href="#" class="social-link">TG</a>
            <a href="#" class="social-link">YT</a>
            <a href="#" class="social-link">WA</a>
          </div>
        </div>
      </div>

      <!-- Форма обратной связи -->
      <div class="contact-form">
        <h2 class="mb-6">Обратная связь</h2>
        
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label" for="name">Ваше имя</label>
            <input type="text" id="name" class="form-input" v-model="form.name" 
                   placeholder="Иван Иванов" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input type="email" id="email" class="form-input" v-model="form.email" 
                   placeholder="example@mail.com" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Телефон</label>
            <input type="tel" id="phone" class="form-input" v-model="form.phone" 
                   placeholder="+7 (999) 123-45-67">
          </div>

          <div class="form-group">
            <label class="form-label" for="subject">Тема</label>
            <input type="text" id="subject" class="form-input" v-model="form.subject" 
                   placeholder="Вопрос о товаре" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Сообщение</label>
            <textarea id="message" class="form-textarea" v-model="form.message" 
                      placeholder="Ваше сообщение..." required></textarea>
          </div>

          <button type="submit" class="btn btn-primary w-100">
            Отправить сообщение
          </button>
        </form>

        <div v-if="formMessage" class="message" :class="formMessage.type">
          {{ formMessage.text }}
        </div>
      </div>
    </div>

    <!-- Карта -->
    <div class="card mt-8 p-8">
      <h2 class="text-center mb-6">Как нас найти</h2>
      <div style="height: 300px; background: var(--gray-light); border-radius: var(--radius); 
                  display: flex; align-items: center; justify-content: center; color: var(--gray);">
        [Здесь будет карта]
        <br>
        {{ contacts.address || 'г. Москва, ул. Автозаводская, д. 15' }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'ContactsView',
  setup() {
    const contacts = ref({})
    const form = ref({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
    const formMessage = ref(null)

    const getContactIcon = (key) => {
      const icons = {
        phone: '📞',
        email: '✉️',
        address: '📍',
        workHours: '⏰'
      }
      return icons[key] || '📱'
    }

    const getContactLabel = (key) => {
      const labels = {
        phone: 'Телефон',
        email: 'Email',
        address: 'Адрес',
        workHours: 'Часы работы'
      }
      return labels[key] || key
    }

    const submitForm = () => {
      if (!form.value.name || !form.value.email || !form.value.message) {
        formMessage.value = {
          type: 'error',
          text: 'Пожалуйста, заполните все обязательные поля'
        }
        return
      }

      console.log('Форма отправлена:', form.value)
      formMessage.value = {
        type: 'success',
        text: 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.'
      }

      // Очистка формы
      form.value = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      }

      // Автоматическое скрытие сообщения
      setTimeout(() => {
        formMessage.value = null
      }, 5000)
    }

    onMounted(async () => {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          contacts.value = await response.json()
        }
      } catch (error) {
        console.log('Используются локальные данные')
        contacts.value = {
          phone: '+7 (999) 123-45-67',
          email: 'info@autoparts.ru',
          address: 'г. Москва, ул. Автозаводская, д. 15',
          workHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00'
        }
      }
    })

    return {
      contacts,
      form,
      formMessage,
      getContactIcon,
      getContactLabel,
      submitForm
    }
  }
}
</script>

