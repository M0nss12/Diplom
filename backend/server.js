require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка подключения к БД
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MIDDLEWARE БЕЗОПАСНОСТИ ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
};

// --- API АВТОРИЗАЦИИ ---
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Все поля обязательны' });
  try {
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: 'Email занят' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'client']
    );
    res.json({ message: 'ОК', user: newUser.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: 'Неверные данные' });
    const user = userRes.rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: 'Неверные данные' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        address: user.address
      } 
    });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, phone, address FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ЗАКАЗОВ ---

// 1. Создание заказа
app.post('/api/orders/create', authenticateToken, async (req, res) => {
  const { cartItems, orderDetails, saveDetails } = req.body;

  if (!cartItems || cartItems.length === 0) return res.status(400).json({ error: 'Корзина пуста' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productsTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const shippingCost = orderDetails.deliveryType === 'delivery' ? 500 : 0;
    const totalAmount = productsTotal + shippingCost;

    let finalAddress = orderDetails.deliveryType === 'pickup' 
      ? 'Самовывоз (г. Москва, ул. Автозаводская, д. 15)' 
      : orderDetails.address;

    const orderRes = await client.query(`
      INSERT INTO orders (
        user_id, total_amount, status, delivery_address, 
        recipient_name, recipient_phone, payment_method, 
        shipping_cost, user_comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id
    `, [
      req.user.id,
      totalAmount,
      'pending',
      finalAddress,
      orderDetails.name,
      orderDetails.phone,
      'card',
      shippingCost,
      orderDetails.comment || ''
    ]);

    if (saveDetails) {
      await client.query(`
        UPDATE users 
        SET phone = $1, address = $2 
        WHERE id = $3
      `, [orderDetails.phone, orderDetails.address, req.user.id]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Заказ создан', orderId: orderRes.rows[0].id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  } finally {
    client.release();
  }
});

// 2. Мои заказы
app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC`, 
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Оплата
app.post('/api/orders/:id/pay', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ message: 'Оплата успешна', order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Ошибка оплаты' }); }
});

// 4. Отмена заказа (НОВОЕ)
app.post('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    // Проверяем, что заказ принадлежит пользователю и статус pending
    const checkOrder = await pool.query(
      `SELECT status FROM orders WHERE id = $1 AND user_id = $2`, 
      [req.params.id, req.user.id]
    );

    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (checkOrder.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Можно отменить только неоплаченные заказы' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    res.json({ message: 'Заказ отменен', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отмены заказа' });
  }
});

// --- ВСПОМОГАТЕЛЬНЫЕ ---
app.get('/api/store-info', (req, res) => {
  res.json({ name: "AutoParts Pro", description: "Магазин автозапчастей" });
});

// --- CRUD ГЕНЕРАТОР ---
function createCrudRoutes(tableName, allowedFields, isPublicGet = true) {
  const router = express.Router();
  const getMiddleware = isPublicGet ? [] : [authenticateToken, requireAdmin];

  router.get('/', ...getMiddleware, async (req, res) => {
    try {
      const { category_id, product_id } = req.query;
      let queryText = `SELECT * FROM ${tableName}`;
      let queryParams = [];
      if (tableName === 'products' && category_id) {
        queryText += ` WHERE category_id = $1`;
        queryParams.push(category_id);
      }
      if (tableName === 'reviews' && product_id) {
        queryText += ` WHERE product_id = $1`;
        queryParams.push(product_id);
      }
      queryText += ` ORDER BY id ASC`;
      const result = await pool.query(queryText, queryParams);
      if (tableName === 'users') {
        const safeUsers = result.rows.map(u => { const { password_hash, ...rest } = u; return rest; });
        return res.json(safeUsers);
      }
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/:id', ...getMiddleware, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      if (tableName === 'users') { const { password_hash, ...rest } = result.rows[0]; return res.json(rest); }
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
      if (tableName === 'users' && req.body.password) {
         const salt = await bcrypt.genSalt(10);
         req.body.password_hash = await bcrypt.hash(req.body.password, salt);
         keys.push('password_hash');
      }
      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
      if (tableName === 'users' && req.body.password) {
         const salt = await bcrypt.genSalt(10);
         req.body.password_hash = await bcrypt.hash(req.body.password, salt);
         keys.push('password_hash');
      }
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map(k => req.body[k]);
      values.push(req.params.id);
      const result = await pool.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Cannot delete' }); }
  });

  return router;
}

// --- ПОДКЛЮЧЕНИЕ ---
const userFields = ['username', 'email', 'role', 'phone', 'address', 'password']; 
const productFields = ['name', 'description', 'price', 'old_price', 'quantity_in_stock', 'sku', 'category_id', 'brand_id', 'image_url', 'rating', 'is_featured', 'weight'];
const categoryFields = ['name', 'slug', 'description', 'image_url', 'parent_id', 'is_active', 'sort_order', 'meta_title', 'discount_percent'];
const brandFields = ['name', 'country', 'website_url', 'logo_url', 'description', 'year_founded', 'is_popular', 'contact_email', 'meta_keywords', 'status'];
const orderFields = ['user_id', 'total_amount', 'status', 'delivery_address', 'recipient_name', 'recipient_phone', 'payment_method', 'tracking_number', 'user_comment', 'shipping_cost'];
const reviewFields = ['user_id', 'product_id', 'rating', 'comment'];

app.use('/api/products', createCrudRoutes('products', productFields, true));
app.use('/api/categories', createCrudRoutes('categories', categoryFields, true));
app.use('/api/brands', createCrudRoutes('brands', brandFields, true));
app.use('/api/reviews', createCrudRoutes('reviews', reviewFields, true));
app.use('/api/users', createCrudRoutes('users', userFields, false));
app.use('/api/orders', createCrudRoutes('orders', orderFields, false));

// --- SPA ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: "API not found" });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});