import { ref, computed, onMounted } from 'vue';

export function useCrud(endpoint) {
  // Хранит ВСЕ записи, полученные с сервера
  const items = ref([]);
  
  const showEditModal = ref(false);
  const showViewModal = ref(false);
  const isEdit = ref(false);
  const form = ref({});
  const selectedItem = ref(null);
  const isAdmin = ref(false);
  
  // Получаем токен сразу
  const token = localStorage.getItem('token');

  // --- ЛОГИКА ПАГИНАЦИИ (Клиентская) ---
  const page = ref(1);
  const pageSize = 10; // Количество записей на странице

  // Возвращает только те записи, которые нужны для текущей страницы
  const paginatedItems = computed(() => {
    // Защита от null/undefined
    if (!items.value || !Array.isArray(items.value)) return [];
    
    const start = (page.value - 1) * pageSize;
    const end = start + pageSize;
    return items.value.slice(start, end);
  });

  // Считаем общее количество страниц
  const totalPages = computed(() => {
    const total = items.value?.length || 0;
    return Math.ceil(total / pageSize);
  });

  // Переключатели
  const nextPage = () => {
    if (page.value < totalPages.value) page.value++;
  };

  const prevPage = () => {
    if (page.value > 1) page.value--;
  };
  // -------------------------------------

  // Проверка прав
  const checkAdmin = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    isAdmin.value = user && user.role === 'admin';
  };

  // Получение списка (ИСПРАВЛЕНО: Добавлен токен)
  const fetchItems = async () => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/${endpoint}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        // Поддержка формата { data: [...], meta: ... } или простого массива [...]
        items.value = Array.isArray(data) ? data : (data.data || []);
      } else {
        console.error(`Ошибка загрузки ${endpoint}:`, res.status);
      }
    } catch (e) { console.error(e); }
  };

  // Удаление
  const deleteItem = async (id) => {
    if (!isAdmin.value) return alert('Доступ запрещен.');
    if (!confirm('Вы уверены?')) return;
    
    try {
      const res = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchItems();
      else alert('Ошибка удаления');
    } catch (e) { console.error(e); }
  };

  // Открытие модалки редактирования
  const openEditModal = (item = null) => {
    if (!isAdmin.value) return alert('Доступ запрещен.');
    isEdit.value = !!item;
    form.value = item ? { ...item } : {};
    
    if (endpoint === 'users' && isEdit.value) form.value.password = '';
    
    // Значения по умолчанию
    if (!item) {
        if(endpoint === 'products') { form.value.is_featured = false; form.value.rating = 0; }
        if(endpoint === 'categories') { form.value.is_active = true; form.value.sort_order = 0; }
        if(endpoint === 'brands') form.value.is_popular = false;
        if(endpoint === 'users') form.value.role = 'client';
    }
    showEditModal.value = true;
  };

  const closeModals = () => {
    showEditModal.value = false;
    showViewModal.value = false;
    selectedItem.value = null;
    form.value = {};
  };

  // Сохранение
  const saveItem = async () => {
    if (!isAdmin.value) return;
    const url = isEdit.value ? `/api/${endpoint}/${form.value.id}` : `/api/${endpoint}`;
    const method = isEdit.value ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form.value)
      });

      if (res.ok) {
        closeModals();
        fetchItems();
      } else {
        const err = await res.json();
        alert('Ошибка: ' + (err.error || 'Unknown'));
      }
    } catch (e) { console.error(e); }
  };

  onMounted(() => {
    checkAdmin();
    fetchItems();
  });

  return {
    items, // Полный список
    paginatedItems, // Список для текущей страницы
    page, totalPages, nextPage, prevPage, // Управление пагинацией
    isAdmin, showEditModal, showViewModal, isEdit, form, selectedItem,
    fetchItems, deleteItem, openEditModal, closeModals, saveItem
  };
}