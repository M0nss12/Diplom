<template>
  <div class="card p-4">
    <div class="header-actions">
      <h2>💬 Отзывы</h2>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Product ID</th>
          <th>Рейтинг</th>
          <th>Комментарий</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <!-- ИСПОЛЬЗУЕМ paginatedItems -->
        <tr v-for="r in paginatedItems" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.user_id }}</td>
          <td>{{ r.product_id }}</td>
          <td>
            <span style="color: gold; font-weight: bold;">
              {{ '★'.repeat(r.rating) }}
            </span>
            ({{ r.rating }})
          </td>
          <td>{{ r.comment.length > 30 ? r.comment.substring(0, 30) + '...' : r.comment }}</td>
          
          <td class="actions-cell">
            <button class="btn-sm view" @click="$router.push(`/catalog/reviews/${r.id}`)" title="Просмотр">👁️</button>
            <template v-if="isAdmin">
              <button class="btn-sm delete" @click="deleteItem(r.id)" title="Удалить">🗑️</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ПАГИНАЦИЯ -->
    <div class="pagination mt-4" v-if="totalPages > 1">
      <button class="btn btn-outline" :disabled="page === 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ totalPages }}</span>
      <button class="btn btn-outline" :disabled="page === totalPages" @click="nextPage">Вперед</button>
    </div>
  </div>
</template>

<script>
import { useCrud } from '@/composables/useCrud';
export default { 
  setup() { 
    return useCrud('reviews'); 
  } 
}
</script>