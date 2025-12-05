// useCrud.js
import { ref, computed, onMounted } from 'vue';

export function useCrud(endpoint, initialForm = {}) {
    const items = ref([]);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const isEdit = ref(false);
    const form = ref(initialForm);
    const selectedItem = ref(null);
    const isAdmin = ref(false);
    
    const token = localStorage.getItem('token');
    
    const page = ref(1);
    const pageSize = 10;
    
    const paginatedItems = computed(() => {
        if (!items.value || !Array.isArray(items.value)) return [];
        const start = (page.value - 1) * pageSize;
        const end = start + pageSize;
        return items.value.slice(start, end);
    });

    const totalPages = computed(() => {
        const total = items.value?.length || 0;
        return Math.ceil(total / pageSize);
    });

    const nextPage = () => { if (page.value < totalPages.value) page.value++; };
    const prevPage = () => { if (page.value > 1) page.value--; };

    const checkAdmin = () => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        isAdmin.value = user && user.role === 'admin';
    };

    /**
     * Получение списка с сервера.
     * Проверка endpoint 'orders' для выбора URL.
     */
    const fetchItems = async (customUrl = null) => {
        let url;

        // 🚨 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Выбор URL в зависимости от роли
        if (endpoint === 'orders' && !isAdmin.value) {
            // Если это список заказов и пользователь НЕ админ, используем /api/orders/my
            url = '/api/orders/my';
        } else {
            // В остальных случаях (админ или другие сущности), используем стандартный CRUD URL
            url = customUrl || `/api/${endpoint}`;
        }
        
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, { headers }); 
            
            if (res.ok) {
                const data = await res.json();
                // Обрабатываем ответ, который может быть массивом или объектом с полем data
                items.value = Array.isArray(data) ? data : (data.data || []);
                
                if (page.value > totalPages.value) page.value = 1;
            } else {
                console.error(`Ошибка загрузки ${endpoint} с URL ${url}:`, res.status, await res.text());
                items.value = []; 
            }
        } catch (e) { console.error(e); }
    };

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

    const openEditModal = (item = null) => {
        if (!isAdmin.value) return alert('Доступ запрещен.');
        isEdit.value = !!item;
        
        form.value = item ? { ...item } : { ...initialForm }; 
        
        if (endpoint === 'users') { 
            if (isEdit.value) form.value.password = '';
            else form.value.role = 'client';
        }
        
        if (!item) {
             if(endpoint === 'products') { form.value.is_featured = false; form.value.rating = 0; }
             if(endpoint === 'categories') { form.value.is_active = true; form.value.sort_order = 0; }
             if(endpoint === 'brands') form.value.is_popular = false;
        }

        showEditModal.value = true;
    };

    const closeModals = () => {
        showEditModal.value = false;
        showViewModal.value = false;
        selectedItem.value = null;
        form.value = { ...initialForm }; 
    };

    const saveItem = async () => {
        if (!isAdmin.value) return;
        const url = isEdit.value ? `/api/${endpoint}/${form.value.id}` : `/api/${endpoint}`;
        const method = isEdit.value ? 'PUT' : 'POST';

        const dataToSend = { ...form.value };
        if (endpoint === 'users' && isEdit.value) {
            if (dataToSend.password === '') {
                delete dataToSend.password;
            }
        }
        
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
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
        items, paginatedItems, page, totalPages, nextPage, prevPage, 
        isAdmin, showEditModal, showViewModal, isEdit, form, selectedItem,
        fetchItems, deleteItem, openEditModal, closeModals, saveItem
    };
}