require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const ADMIN_DATA = {
  username: 'Admin',
  email: 'admin@autoparts.ru',
  password: 'admin',
  role: 'admin'
};

const createTablesQuery = `
  DROP TABLE IF EXISTS orders CASCADE;
  DROP TABLE IF EXISTS products CASCADE;
  DROP TABLE IF EXISTS brands CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  
  -- 1. Пользователи
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client',
    phone VARCHAR(20),
    address TEXT
  );

  -- 2. Категории
  -- (Убрал icon_class, добавил discount_percent)
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    discount_percent INTEGER DEFAULT 0 -- Новое поле (Скидка в %)
  );

  -- 3. Бренды
  CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    website_url VARCHAR(255),
    logo_url VARCHAR(255),
    description TEXT,
    year_founded INTEGER,
    is_popular BOOLEAN DEFAULT FALSE,
    contact_email VARCHAR(100),
    meta_keywords TEXT,
    status VARCHAR(20) DEFAULT 'active'
  );

  -- 4. Товары
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    quantity_in_stock INTEGER DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    brand_id INTEGER REFERENCES brands(id),
    image_url VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    is_featured BOOLEAN DEFAULT FALSE,
    weight DECIMAL(10, 3)
  );

  -- 5. Заказы
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    payment_method VARCHAR(50),
    tracking_number VARCHAR(100),
    user_comment TEXT,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00
  );
`;

async function initDb() {
  try {
    console.log('⏳ Пересоздание таблиц...');
    await pool.query(createTablesQuery);
    console.log('✅ База данных обновлена!');

    // Создаем админа
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', [ADMIN_DATA.email]);
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, salt);
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [ADMIN_DATA.username, ADMIN_DATA.email, hashedPassword, ADMIN_DATA.role]
      );
      console.log('👤 Администратор создан (admin@autoparts.ru / admin).');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    pool.end();
  }
}

initDb();