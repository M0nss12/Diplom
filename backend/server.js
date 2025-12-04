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

// 1. Проверка токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный или истекший токен' });
    req.user = user;
    next();
  });
};

// 2. Проверка прав Админа
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  next();
};

// --- API АВТОРИЗАЦИИ ---

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'client']
    );

    res.json({ message: 'Регистрация успешна', user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const user = userRes.rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);

    if (!validPass) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// --- ВСПОМОГАТЕЛЬНЫЕ ДАННЫЕ ---
app.get('/api/store-info', (req, res) => {
  res.json({ 
    name: "AutoParts Pro", 
    description: "Интернет-магазин автозапчастей и аксессуаров" 
  });
});

// --- ГЕНЕРАТОР CRUD API ---
function createCrudRoutes(tableName, allowedFields, isPublicGet = true) {
  const router = express.Router();

  // Middleware для чтения: если публично - пусто, иначе нужна авторизация админа
  const getMiddleware = isPublicGet ? [] : [authenticateToken, requireAdmin];

  // 1. GET ALL (С ФИЛЬТРАЦИЕЙ)
  router.get('/', ...getMiddleware, async (req, res) => {
    try {
      const { category_id } = req.query;
      
      let queryText = `SELECT * FROM ${tableName}`;
      let queryParams = [];

      // Логика фильтрации для товаров
      if (tableName === 'products' && category_id) {
        queryText += ` WHERE category_id = $1`;
        queryParams.push(category_id);
      }

      queryText += ` ORDER BY id ASC`;

      const result = await pool.query(queryText, queryParams);
      
      // Удаляем пароли из выдачи пользователей
      if (tableName === 'users') {
        const safeUsers = result.rows.map(u => {
          const { password_hash, ...rest } = u;
          return rest;
        });
        return res.json(safeUsers);
      }
      
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. GET ONE
  router.get('/:id', ...getMiddleware, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Запись не найдена' });
      
      if (tableName === 'users') {
        const { password_hash, ...rest } = result.rows[0];
        return res.json(rest);
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. CREATE (Только Админ)
  router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
      
      if (tableName === 'users' && req.body.password) {
         const salt = await bcrypt.genSalt(10);
         req.body.password_hash = await bcrypt.hash(req.body.password, salt);
         keys.push('password_hash');
         const passIndex = keys.indexOf('password');
         if (passIndex > -1) keys.splice(passIndex, 1);
      }

      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      if (keys.length === 0) return res.status(400).json({ error: 'Нет валидных данных' });

      const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. UPDATE (Только Админ)
  router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
      
      if (tableName === 'users' && req.body.password) {
         const salt = await bcrypt.genSalt(10);
         req.body.password_hash = await bcrypt.hash(req.body.password, salt);
         keys.push('password_hash');
         const passIndex = keys.indexOf('password');
         if (passIndex > -1) keys.splice(passIndex, 1);
      }

      if (keys.length === 0) return res.status(400).json({ error: 'Нет данных для обновления' });

      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map(k => req.body[k]);
      values.push(req.params.id);

      const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) return res.status(404).json({ error: 'Запись не найдена' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. DELETE (Только Админ)
  router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      res.json({ message: 'Запись удалена успешно' });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось удалить запись. Возможно, она используется в других таблицах.' });
    }
  });

  return router;
}

// --- СПИСКИ ПОЛЕЙ ---

const userFields = ['username', 'email', 'role', 'phone', 'address', 'password']; 

const productFields = [
  'name', 'description', 'price', 'old_price', 'quantity_in_stock', 
  'sku', 'category_id', 'brand_id', 'image_url', 'rating', 
  'is_featured', 'weight'
];

const categoryFields = [
  'name', 'slug', 'description', 'image_url', 'parent_id', 
  'is_active', 'sort_order', 'meta_title', 'discount_percent' 
];

const brandFields = [
  'name', 'country', 'website_url', 'logo_url', 'description', 
  'year_founded', 'is_popular', 'contact_email', 'meta_keywords', 'status'
];

const orderFields = [
  'user_id', 'total_amount', 'status', 'delivery_address', 
  'recipient_name', 'recipient_phone', 'payment_method', 
  'tracking_number', 'user_comment', 'shipping_cost'
];

// --- ПОДКЛЮЧЕНИЕ МАРШРУТОВ ---

// Публичный доступ на чтение (true)
app.use('/api/products', createCrudRoutes('products', productFields, true));
app.use('/api/categories', createCrudRoutes('categories', categoryFields, true));
app.use('/api/brands', createCrudRoutes('brands', brandFields, true));

// Доступ только для админа (false)
app.use('/api/users', createCrudRoutes('users', userFields, false));
app.use('/api/orders', createCrudRoutes('orders', orderFields, false));

// --- SPA ROUTING ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});