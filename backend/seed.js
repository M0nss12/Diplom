require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ ---

const REAL_CATEGORIES = [
  { name: 'Двигатель', slug: 'engine' },
  { name: 'Тормозная система', slug: 'brakes' },
  { name: 'Подвеска и рулевое', slug: 'suspension' },
  { name: 'Трансмиссия', slug: 'transmission' },
  { name: 'Электрика и освещение', slug: 'electric' },
  { name: 'Кузовные детали', slug: 'body' },
  { name: 'Масла и жидкости', slug: 'oils' },
  { name: 'Фильтры', slug: 'filters' },
  { name: 'Выхлопная система', slug: 'exhaust' },
  { name: 'Система охлаждения', slug: 'cooling' },
  { name: 'Отопление и кондиционирование', slug: 'hvac' },
  { name: 'Стекла и зеркала', slug: 'glass' },
  { name: 'Шины и диски', slug: 'wheels' },
  { name: 'Аккумуляторы', slug: 'batteries' },
  { name: 'Свечи зажигания', slug: 'spark-plugs' },
  { name: 'Ремни и цепи', slug: 'belts' },
  { name: 'Инструменты', slug: 'tools' },
  { name: 'Автохимия', slug: 'chemistry' },
  { name: 'Аксессуары', slug: 'accessories' }
];

const BRAND_NAMES = [
  'Bosch', 'Denso', 'NGK', 'Mann-Filter', 'Mahle', 'Brembo', 'TRW', 'Ferodo', 
  'Zimmermann', 'KYB', 'Sachs', 'Monroe', 'Bilstein', 'Lemforder', 'Febi', 
  'Valeo', 'Luk', 'Sachs', 'Castrol', 'Mobil 1', 'Shell', 'Motul', 'Liqui Moly',
  'Gates', 'Contitech', 'Dayco', 'SKF', 'FAG', 'Osram', 'Philips', 'Hella'
];

const COUNTRIES = ['Germany', 'Japan', 'USA', 'Italy', 'France', 'South Korea', 'China', 'UK'];

// Словарь для генерации названий товаров по категориям
const PRODUCT_TEMPLATES = {
  'engine': ['Поршень', 'Коленвал', 'Прокладка ГБЦ', 'Клапан впускной', 'Подушка двигателя'],
  'brakes': ['Тормозные колодки', 'Тормозной диск', 'Суппорт', 'Тормозной шланг', 'Трос ручника'],
  'suspension': ['Амортизатор', 'Пружина подвески', 'Рычаг подвески', 'Шаровая опора', 'Ступица'],
  'transmission': ['Комплект сцепления', 'Маховик', 'ШРУС наружный', 'Сальник привода'],
  'electric': ['Генератор', 'Стартер', 'Датчик ABS', 'Лампа H7', 'Фара правая'],
  'oils': ['Масло моторное 5W-40', 'Масло трансмиссионное', 'Антифриз G12', 'Тормозная жидкость'],
  'filters': ['Фильтр масляный', 'Фильтр воздушный', 'Фильтр салонный', 'Фильтр топливный'],
  'batteries': ['Аккумулятор 60Ah', 'Аккумулятор 75Ah', 'Аккумулятор 100Ah'],
  'wheels': ['Шина зимняя R16', 'Шина летняя R17', 'Диск литой R16', 'Болт колесный']
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// --- ГЛАВНАЯ ФУНКЦИЯ ---

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Начинаем заполнение базы данных...');

    // 1. Очистка таблиц (с сохранением пользователей)
    console.log('🧹 Очистка старых данных...');
    await client.query('TRUNCATE TABLE orders, products, brands, categories RESTART IDENTITY CASCADE');

    // Получаем ID любого пользователя (админа), чтобы привязать заказы
    const userRes = await client.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      throw new Error('❌ В базе нет пользователей! Сначала запустите db-init.js');
    }
    const userId = userRes.rows[0].id;

    // 2. Заполнение категорий
    console.log('📂 Создание категорий...');
    const categoryIds = [];
    const categoryMap = {}; // slug -> id

    for (const cat of REAL_CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, sort_order, discount_percent) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, slug`,
        [
          cat.name, 
          cat.slug, 
          `Качественные товары в категории ${cat.name}`, 
          getRandomInt(0, 100),
          getRandomInt(0, 1) === 1 ? getRandomInt(5, 20) : 0 // 50% шанс на скидку
        ]
      );
      categoryIds.push(res.rows[0].id);
      categoryMap[res.rows[0].slug] = res.rows[0].id;
    }

    // 3. Заполнение брендов (100 шт)
    console.log('🏷️ Создание брендов (100 шт)...');
    const brandIds = [];
    for (let i = 0; i < 100; i++) {
      const baseName = getRandomElement(BRAND_NAMES);
      // Чтобы набрать 100, добавляем иногда суффиксы, если имена повторяются
      const name = i < BRAND_NAMES.length ? BRAND_NAMES[i] : `${baseName} ${['Pro', 'Auto', 'Tech', 'Parts', 'Systems'][getRandomInt(0,4)]}`;
      
      const res = await client.query(
        `INSERT INTO brands (name, country, website_url, description, year_founded, is_popular, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          name,
          getRandomElement(COUNTRIES),
          `https://www.${name.toLowerCase().replace(/\s/g, '')}.com`,
          `Ведущий производитель автозапчастей ${name}.`,
          getRandomInt(1900, 2020),
          getRandomInt(0, 10) > 7, // 30% шанс что популярный
          'active'
        ]
      );
      brandIds.push(res.rows[0].id);
    }

    // 4. Заполнение товаров (100 шт)
    console.log('📦 Создание товаров (100 шт)...');
    const productIds = [];
    
    for (let i = 0; i < 100; i++) {
      // Выбираем случайную категорию из тех, для которых у нас есть шаблоны имен
      const templateKeys = Object.keys(PRODUCT_TEMPLATES);
      let catSlug = getRandomElement(templateKeys);
      // Если случайно выбрали категорию без шаблонов (из тех 20), берем 'accessories' как дефолт
      if (!PRODUCT_TEMPLATES[catSlug]) catSlug = 'engine'; 
      
      const catId = categoryMap[catSlug] || categoryIds[0];
      const prodNameBase = getRandomElement(PRODUCT_TEMPLATES[catSlug] || ['Автозапчасть']);
      const brandId = getRandomElement(brandIds);
      
      // Генерируем цену
      const price = getRandomInt(500, 25000);
      const hasDiscount = getRandomInt(0, 10) > 7;
      
      const res = await client.query(
        `INSERT INTO products (
          name, description, price, old_price, quantity_in_stock, 
          sku, category_id, brand_id, rating, is_featured, weight
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          `${prodNameBase} ${getRandomElement(['Premium', 'Standard', 'Pro', 'X-Series'])}`, // Name
          `Высококачественный товар для вашего автомобиля. Гарантия качества.`, // Desc
          hasDiscount ? Math.floor(price * 0.8) : price, // Price
          hasDiscount ? price : null, // Old Price
          getRandomInt(0, 50), // Stock
          `SKU-${getRandomInt(10000, 99999)}`, // SKU
          catId,
          brandId,
          getRandomFloat(3.5, 5.0), // Rating
          getRandomInt(0, 10) > 8, // Featured (20%)
          getRandomFloat(0.5, 15.0) // Weight
        ]
      );
      productIds.push(res.rows[0].id);
    }

    // 5. Заполнение заказов (100 шт)
    console.log('🛒 Создание заказов (100 шт)...');
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const payments = ['card', 'cash', 'online'];
    
    for (let i = 0; i < 100; i++) {
      const amount = getRandomInt(1500, 50000);
      
      await client.query(
        `INSERT INTO orders (
          user_id, total_amount, status, delivery_address, 
          recipient_name, recipient_phone, payment_method, 
          tracking_number, user_comment, shipping_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          amount,
          getRandomElement(statuses),
          `г. Москва, ул. Ленина, д. ${getRandomInt(1, 100)}, кв. ${getRandomInt(1, 200)}`,
          'Иван Тестовый',
          `+7 (999) ${getRandomInt(100, 999)}-${getRandomInt(10, 99)}-${getRandomInt(10, 99)}`,
          getRandomElement(payments),
          getRandomInt(0, 1) === 1 ? `TRACK-${getRandomInt(100000, 999999)}` : null,
          getRandomInt(0, 1) === 1 ? 'Позвоните перед доставкой' : null,
          getRandomElement([0, 300, 500, 1000])
        ]
      );
    }

    console.log('✅ База данных успешно заполнена тестовыми данными!');

  } catch (err) {
    console.error('❌ Ошибка при заполнении:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();