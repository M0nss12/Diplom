import { ref, onMounted } from 'vue';

export function useCrud(endpoint) {
  const items = ref([]);
  const showEditModal = ref(false);
  const showViewModal = ref(false);
  const isEdit = ref(false);
  const form = ref({});
  const selectedItem = ref(null);
  const isAdmin = ref(false);
  const token = localStorage.getItem('token');

  // Проверка прав (берем из LocalStorage)
  const checkAdmin = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    isAdmin.value = user && user.role === 'admin';
  };

  // Получение списка (GET - доступно всем)
  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/${endpoint}`);
      if (res.ok) items.value = await res.json();
    } catch (e) { console.error(e); }
  };

  // Удаление (DELETE - только админ)
  const deleteItem = async (id) => {
    if (!isAdmin.value) return alert('Доступ запрещен. Только администратор.');
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

  // Открытие окна редактирования (Только админ)
  const openEditModal = (item = null) => {
    if (!isAdmin.value) return alert('Доступ запрещен. Только администратор.');
    isEdit.value = !!item;
    form.value = item ? { ...item } : {};
    
    // Очистка пароля при редактировании пользователя
    if (endpoint === 'users' && isEdit.value) form.value.password = '';
    
    // Значения по умолчанию для новых записей
    if (!item) {
        if(endpoint === 'products') { form.value.is_featured = false; form.value.rating = 0; }
        if(endpoint === 'categories') { form.value.is_active = true; form.value.sort_order = 0; }
        if(endpoint === 'brands') form.value.is_popular = false;
        if(endpoint === 'users') form.value.role = 'client';
    }
    showEditModal.value = true;
  };

  // Открытие окна просмотра (Все)
  const openViewModal = (item) => {
    selectedItem.value = item;
    showViewModal.value = true;
  };

  const closeModals = () => {
    showEditModal.value = false;
    showViewModal.value = false;
    selectedItem.value = null;
    form.value = {};
  };

  // Сохранение (POST/PUT - Только админ)
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
    items, isAdmin, showEditModal, showViewModal, isEdit, form, selectedItem,
    fetchItems, deleteItem, openEditModal, openViewModal, closeModals, saveItem
  };
}