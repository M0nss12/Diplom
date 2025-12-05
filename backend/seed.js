require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    // Используйте свой DATABASE_URL из .env
    connectionString: process.env.DATABASE_URL,
    // Настройки SSL могут зависеть от вашего хостинга
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ ПОЛЬЗОВАТЕЛЕЙ ---
const USER_COUNT = 100;
const NAMES_M = ['Алексей', 'Дмитрий', 'Иван', 'Сергей', 'Андрей', 'Максим', 'Евгений', 'Михаил', 'Владимир', 'Павел'];
const NAMES_F = ['Елена', 'Ольга', 'Наталья', 'Анна', 'Мария', 'Светлана', 'Татьяна', 'Юлия', 'Ирина', 'Екатерина'];
const SURNAMES_M = ['Иванов', 'Петров', 'Смирнов', 'Кузнецов', 'Соколов', 'Попов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов'];
const SURNAMES_F = ['Иванова', 'Петрова', 'Смирнова', 'Кузнецова', 'Соколова', 'Попова', 'Лебедева', 'Козлова', 'Новикова', 'Морозова'];
const CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань', 'Нижний Новгород', 'Челябинск', 'Омск', 'Самара', 'Ростов-на-Дону'];
const DUMMY_PASSWORD_HASH = '$2a$10$wKz0bW8dD/Xf8Y.Gf9QvIe4.kL2hI8gA0.7nC9P4Dq.0j7Q8xL3F5';

// --- ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ ТОВАРОВ И ЗАКАЗОВ ---

const BRAND_SPECIALIZATIONS = [
    { name: 'Mann-Filter', country: 'Германия', mult: 1.15, is_popular: true, areas: ['filters'], logo_name: 'Mann-Filter' },
    { name: 'Mahle', country: 'Германия', mult: 1.25, is_popular: true, areas: ['filters'], logo_name: 'Mahle' },
    { name: 'Filtron', country: 'Польша', mult: 0.9, is_popular: false, areas: ['filters'], logo_name: 'Filtron' },
    { name: 'Brembo', country: 'Италия', mult: 1.9, is_popular: true, areas: ['brakes'], logo_name: 'Brembo' },
    { name: 'Textar', country: 'Германия', mult: 1.5, is_popular: true, areas: ['brakes'], logo_name: 'Textar' },
    { name: 'TRW', country: 'США', mult: 1.4, is_popular: true, areas: ['brakes', 'suspension'], logo_name: 'TRW' },
    { name: 'Bosch', country: 'Германия', mult: 1.3, is_popular: true, areas: ['electric', 'engine', 'brakes'], logo_name: 'Bosch' },
    { name: 'KYB', country: 'Япония', mult: 1.6, is_popular: true, areas: ['suspension'], logo_name: 'KYB' },
    { name: 'Sachs', country: 'Германия', mult: 1.7, is_popular: true, areas: ['suspension', 'engine'], logo_name: 'Sachs' },
    { name: 'Lemforder', country: 'Германия', mult: 1.8, is_popular: true, areas: ['suspension'], logo_name: 'Lemforder' },
    { name: 'Moog', country: 'США', mult: 1.1, is_popular: false, areas: ['suspension'], logo_name: 'Moog' },
    { name: 'Denso', country: 'Япония', mult: 1.4, is_popular: true, areas: ['electric', 'engine'], logo_name: 'Denso' },
    { name: 'NGK', country: 'Япония', mult: 1.2, is_popular: false, areas: ['engine'], logo_name: 'NGK' },
    { name: 'Contitech', country: 'Германия', mult: 1.3, is_popular: false, areas: ['engine'], logo_name: 'Contitech' },
    { name: 'Gates', country: 'США', mult: 1.2, is_popular: false, areas: ['engine'], logo_name: 'Gates' },
    { name: 'Motul', country: 'Франция', mult: 1.7, is_popular: true, areas: ['oils'], logo_name: 'Motul' },
    { name: 'Liqui Moly', country: 'Германия', mult: 1.6, is_popular: true, areas: ['oils'], logo_name: 'Liqui Moly' },
    { name: 'Hella', country: 'Германия', mult: 1.5, is_popular: false, areas: ['electric', 'body'], logo_name: 'Hella' },
    { name: 'АвтоДеталь Плюс', country: 'Россия', mult: 0.8, is_popular: false, areas: ['all'], logo_name: 'АвтоДеталь_Плюс' },
    { name: 'Автокомплект', country: 'Россия', mult: 0.75, is_popular: false, areas: ['all'], logo_name: 'Автокомплект' },
    { name: 'Глобал Партс', country: 'Китай', mult: 0.7, is_popular: false, areas: ['all'], logo_name: 'Глобал_Партс' },
    { name: 'ЕвроЗапчасть', country: 'Россия', mult: 0.85, is_popular: false, areas: ['all'], logo_name: 'ЕвроЗапчасть' },
    { name: 'МастерЧасть', country: 'Россия', mult: 0.9, is_popular: false, areas: ['all'], logo_name: 'МастерЧасть' },
    { name: 'Надежный Аналог', country: 'Китай', mult: 0.65, is_popular: false, areas: ['all'], logo_name: 'Надежный_Аналог' },
    { name: 'Оптимал', country: 'Китай', mult: 0.7, is_popular: false, areas: ['all'], logo_name: 'Оптимал' },
    { name: 'Профит', country: 'Россия', mult: 0.8, is_popular: false, areas: ['all'], logo_name: 'Профит' },
    { name: 'Ресурс', country: 'Россия', mult: 0.85, is_popular: false, areas: ['all'], logo_name: 'Ресурс' },
    { name: 'ТехноСнаб', country: 'Китай', mult: 0.6, is_popular: false, areas: ['all'], logo_name: 'ТехноСнаб' },
    { name: 'ЭкономАвто', country: 'Китай', mult: 0.55, is_popular: false, areas: ['all'], logo_name: 'ЭкономАвто' },
    { name: 'Экспресс Авто', country: 'Россия', mult: 0.95, is_popular: false, areas: ['all'], logo_name: 'Экспресс_Авто' },
];

const REAL_CATEGORIES = [
    { name: 'Двигатель', slug: 'engine', file_name: 'Двигатель', sub: [
        { name: 'Поршневая группа', slug: 'piston-group', keywords: ['Поршень', 'Кольца поршневые', 'Шатун'], price: [12000, 30000], weight: [1.5, 6.0], file_name: 'Поршневаягруппа' },
        { name: 'ГРМ', slug: 'timing', keywords: ['Комплект ремня ГРМ', 'Цепь ГРМ', 'Натяжитель'], price: [5000, 15000], weight: [0.5, 2.5], file_name: 'ГРМ' },
        { name: 'Прокладки и Сальники', slug: 'gaskets', keywords: ['Прокладка ГБЦ', 'Сальник коленвала', 'Прокладка клапанной крышки'], price: [800, 4000], weight: [0.1, 0.5], file_name: 'ПрокладкииСальники' },
    ]},
    { name: 'Тормозная система', slug: 'brakes', file_name: 'Тормознаясистема', sub: [
        { name: 'Колодки и диски', slug: 'pads-discs', keywords: ['Колодки тормозные передние', 'Диск тормозной вентилируемый'], price: [3000, 9000], weight: [1.0, 10.0], file_name: 'Колодкиидиски' },
        { name: 'Суппорты и цилиндры', slug: 'calipers', keywords: ['Суппорт тормозной', 'Цилиндр главный тормозной'], price: [7000, 18000], weight: [2.0, 5.0], file_name: 'Суппортыицилиндры' },
    ]},
    { name: 'Подвеска', slug: 'suspension', file_name: 'Подвеска', sub: [
        { name: 'Амортизаторы и пружины', slug: 'shocks-springs', keywords: ['Амортизатор газомасляный', 'Пружина подвески'], price: [6000, 15000], weight: [3.0, 8.0], file_name: 'Амортизаторыипружины' },
        { name: 'Рычаги и опоры', slug: 'levers-rods', keywords: ['Рычаг подвески нижний', 'Шаровая опора'], price: [2500, 8000], weight: [1.0, 4.0], file_name: 'Рычагииопоры' },
    ]},
    { name: 'Фильтры', slug: 'filters', file_name: 'Фильтры', sub: [
        { name: 'Масляные', slug: 'oil-filter', keywords: ['Фильтр масляный'], price: [400, 1200], weight: [0.2, 0.4], file_name: 'Масляные' },
        { name: 'Воздушные', slug: 'air-filter', keywords: ['Фильтр воздушный двигателя'], price: [600, 1500], weight: [0.3, 0.6], file_name: 'Воздушные' },
        { name: 'Фильтр салона', slug: 'cabin-filter', keywords: ['Фильтр салона угольный'], price: [800, 2000], weight: [0.1, 0.3], file_name: 'Отоплениеикондиционирование' },
    ]},
    { name: 'Масла и жидкости', slug: 'oils', keywords: ['Масло моторное синтетическое 5W-40 4л', 'Антифриз G12 5л', 'Тормозная жидкость DOT 4 1л'], price: [2500, 6000], weight: [4.0, 5.5], file_name: 'Маслаижидкости' },
    { name: 'Электрика', slug: 'electric', keywords: ['Генератор', 'Стартер', 'Датчик ABS', 'Лампа головного света H7'], price: [1500, 20000], weight: [0.1, 8.0], file_name: 'Электрика' },
    { name: 'Кузовные детали', slug: 'body', keywords: ['Фара правая', 'Бампер передний', 'Крыло левое'], price: [5000, 35000], weight: [2.0, 15.0], file_name: 'Кузовныедетали' },
    { name: 'Выхлопная система', slug: 'exhaust', keywords: ['Глушитель основной', 'Катализатор', 'Лямбда-зонд'], price: [4000, 30000], weight: [1.0, 10.0], file_name: 'Выхлопнаясистема' },
    { name: 'Отопление и кондиционирование', slug: 'hvac', keywords: ['Компрессор кондиционера', 'Радиатор отопителя', 'Фильтр салона угольный'], price: [8000, 25000], weight: [2.0, 8.0], file_name: 'Отоплениеикондиционирование' },
    { name: 'Шины и диски', slug: 'wheels', keywords: ['Шина зимняя R16', 'Диск литой R17'], price: [4000, 15000], weight: [6.0, 20.0], file_name: 'Шиныидиски' },
    { name: 'Инструменты', slug: 'tools', keywords: ['Набор ключей', 'Домкрат гидравлический'], price: [1500, 7000], weight: [2.0, 10.0], file_name: 'Инструменты' },
];

const PRODUCT_FILE_NAMES = [
    'Амортизаторгазомасляный', 'Антифриз', 'Бамперпередний', 'Генератор', 'Дисклитой', 
    'Дисктормознойвентилируемый', 'Домкратгидравлический', 'Компрессоркондиционера', 'Крылолевое', 
    'Лампаголовногосвета', 'Лямбда-зонд', 'Наборключей', 'Натяжитель', 'Поршень', 'ПрокладкаГБЦ', 
    'Пружинаподвески', 'Рычагподвески', 'Рычагподвескинижний', 'Сальникколенвала', 'Стартер', 
    'Суппорттормозной', 'Тормознаяжидкость', 'Фараправая', 'Фильтрмасляный', 'Фильтрсалонаугольный', 
    'Цилиндрглавныйтормозной', 'Шароваяопора', 'Шатун', 'Шиназимняя'
];

const PRODUCT_FULL_NAMES = [
    'Амортизатор газомасляный', 'Антифриз G12 5л', 'Бампер передний', 'Генератор', 'Диск литой R17', 
    'Диск тормозной вентилируемый', 'Домкрат гидравлический', 'Компрессор кондиционера', 'Крыло левое', 
    'Лампа головного света H7', 'Лямбда-зонд', 'Набор ключей', 'Натяжитель', 'Поршень', 'Прокладка ГБЦ', 
    'Пружина подвески', 'Рычаг подвески', 'Рычаг подвески нижний', 'Сальник коленвала', 'Стартер', 
    'Суппорт тормозной', 'Тормозная жидкость DOT 4 1л', 'Фара правая', 'Фильтр масляный', 'Фильтр салона угольный', 
    'Цилиндр главный тормозной', 'Шаровая опора', 'Шатун', 'Шина зимняя R16'
];

const NUM_PRODUCTS = 100;
const NUM_ORDERS = 100;
const TOTAL_BRANDS_TARGET = BRAND_SPECIALIZATIONS.length;

// Карта соответствия slug категории и конкретных товаров (для обеспечения соответствия)
const PRODUCTS_BY_SLUG = {
    'piston-group': ['Поршень', 'Шатун'],
    'timing': ['Натяжитель'],
    'gaskets': ['Прокладка ГБЦ', 'Сальник коленвала'],
    'pads-discs': ['Диск тормозной вентилируемый', 'Колодки тормозные передние'],
    'calipers': ['Суппорт тормозной', 'Цилиндр главный тормозной'],
    'shocks-springs': ['Амортизатор газомасляный', 'Пружина подвески'],
    'levers-rods': ['Рычаг подвески нижний', 'Шаровая опора'],
    'oil-filter': ['Фильтр масляный'],
    'air-filter': ['Фильтр воздушный двигателя'], 
    'cabin-filter': ['Фильтр салона угольный'],
    'oils': ['Антифриз G12 5л', 'Масло моторное синтетическое 5W-40 4л', 'Тормозная жидкость DOT 4 1л'],
    'electric': ['Генератор', 'Стартер', 'Лампа головного света H7'],
    'body': ['Бампер передний', 'Крыло левое', 'Фара правая'],
    'exhaust': ['Глушитель основной', 'Лямбда-зонд'],
    'hvac': ['Компрессор кондиционера', 'Фильтр салона угольный'],
    'wheels': ['Диск литой R17', 'Шина зимняя R16'],
    'tools': ['Домкрат гидравлический', 'Набор ключей']
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

const generateSKU = (name) => {
    const prefix = name.toUpperCase().replace(/[\s\d]/g, '').slice(0, 3);
    const uniqueSuffix = getRandomInt(100000, 999999);
    return `${prefix}-${uniqueSuffix}`;
};

const getImagePath = (baseDir, name) => {
    // Удаляем пробелы и подчеркивания, чтобы соответствовать именам файлов в assets
    const cleanName = name.replace(/[\s_-]/g, ''); 
    return `/assets/images/${baseDir}/${cleanName}.webp`;
};


// --- ГЛАВНАЯ ФУНКЦИЯ ---

async function seed() {
    const client = await pool.connect();

    try {
        console.log('🌱 Начинаем заполнение базы данных (Финальная версия)...');

        // 1. Очистка таблиц (TRUNCATE с CASCADE)
        console.log('🧹 Очистка старых данных (order_items, orders, products, brands, categories)...');
        await client.query('TRUNCATE TABLE order_items, orders, products, brands, categories RESTART IDENTITY CASCADE');

        // Удаляем всех клиентов, оставляем только админа
        await client.query("DELETE FROM users WHERE role != 'admin'");


        // 2. Создание тестовых пользователей
        console.log(`👤 Создание тестовых пользователей (Цель: ${USER_COUNT} клиентов)...`);
        const allUserIds = [];

        const adminRes = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
        if (adminRes.rows.length === 0) {
            throw new Error('❌ В базе нет администратора! Сначала запустите db-init.js.');
        }
        allUserIds.push(adminRes.rows[0].id);

        for (let i = 0; i < USER_COUNT; i++) {
            const isMale = Math.random() < 0.5;
            const firstName = isMale ? getRandomElement(NAMES_M) : getRandomElement(NAMES_F);
            const lastName = isMale ? getRandomElement(SURNAMES_M) : getRandomElement(SURNAMES_F);
            const username = `${firstName} ${lastName}`;
            const unique_suffix = `${i}${getRandomInt(100, 999)}`;
            
            // 💥 ИСПОЛЬЗУЕМ ГЕНЕРИЧЕСКИЙ АНГЛИЙСКИЙ EMAIL, чтобы избежать транслитерации
            const email = `test.client${i}_${getRandomInt(100, 999)}@autoshop.com`;
            
            const phone = `+79${getRandomInt(10, 99)}${getRandomInt(100, 999)}${getRandomInt(10, 99)}${getRandomInt(10, 99)}`;
            const address = `${getRandomElement(CITIES)}, ул. ${getRandomElement(['Ленина', 'Мира', 'Гагарина', 'Советская'])}, д. ${getRandomInt(1, 150)}, кв. ${getRandomInt(1, 400)}`;

            const res = await client.query(
                `INSERT INTO users (
                    username, email, password_hash, role, phone, address
                ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [
                    username,
                    email,
                    DUMMY_PASSWORD_HASH,
                    'client',
                    phone,
                    address
                ]
            );
            allUserIds.push(res.rows[0].id);
        }
        console.log(`Создано пользователей: ${allUserIds.length} (1 админ + ${allUserIds.length - 1} клиентов).`);


        // 3. Заполнение категорий
        console.log('📂 Создание категорий и подкатегорий...');
        const categoriesFlat = []; // Плоский список подкатегорий для товаров
        let createdCategoryCount = 0;
        const allCategoryIds = []; 
        
        for (const cat of REAL_CATEGORIES) {
            const imagePath = getImagePath('categories', cat.file_name);
            
            // Главные категории
            let res = await client.query(
                `INSERT INTO categories (name, slug, description, sort_order, discount_percent, image_url) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [ cat.name, cat.slug, `Категория ${cat.name} для вашего авто.`, getRandomInt(10, 50), 0, imagePath ]
            );
            const parentId = res.rows[0].id;

            if (cat.keywords && !cat.sub) {
                // Добавляем родительскую категорию, если у нее нет подкатегорий
                categoriesFlat.push({ id: parentId, slug: cat.slug, price: cat.price, weight: cat.weight });
                allCategoryIds.push(parentId);
            }
            createdCategoryCount++;

            if (cat.sub) {
                for (const subCat of cat.sub) {
                    // Используем имя файла подкатегории, если оно указано
                    const subFileName = subCat.file_name || cat.file_name;
                    const subImagePath = getImagePath('categories', subFileName);
                    const initialDiscount = 0; 
                    
                    res = await client.query(
                        `INSERT INTO categories (name, slug, description, sort_order, discount_percent, parent_id, image_url) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                        [
                            subCat.name, subCat.slug, `Специализированные детали: ${subCat.name}`, 
                            getRandomInt(0, 100), initialDiscount, parentId, subImagePath
                        ]
                    );
                    
                    const subCatId = res.rows[0].id;
                    // Добавляем подкатегорию в плоский список
                    categoriesFlat.push({ 
                        id: subCatId, slug: subCat.slug, price: subCat.price, weight: subCat.weight
                    });
                    allCategoryIds.push(subCatId);
                    createdCategoryCount++;
                }
            }
        }
        
        // --- ЛОГИКА ГАРАНТИРОВАННЫХ СКИДОК 5-7% ---
        const TARGET_DISCOUNT_COUNT = getRandomInt(5, 7); 
        const categoriesToUpdate = allCategoryIds.sort(() => 0.5 - Math.random()).slice(0, TARGET_DISCOUNT_COUNT); 
        let finalDiscountCount = 0;
        for (const catId of categoriesToUpdate) {
            const newDiscount = getRandomInt(5, 7); 
            
            await client.query(
                'UPDATE categories SET discount_percent = $1 WHERE id = $2',
                [newDiscount, catId]
            );
            finalDiscountCount++;
        }
        
        console.log(`Создано категорий: ${createdCategoryCount}. Категорий со скидкой (5-7%): ${finalDiscountCount}.`);


        // 4. Заполнение брендов
        console.log(`🏷️ Создание брендов (Цель: ${TOTAL_BRANDS_TARGET})...`);
        const brandMap = {};
        const ALL_BRAND_DATA = [...BRAND_SPECIALIZATIONS]; 

        let createdBrandCount = 0;
        for (const data of ALL_BRAND_DATA) {
            const name = data.name;
            const brandNameForPath = data.logo_name || name;
            const brandImagePath = getImagePath('brands', brandNameForPath);

            const res = await client.query(
                `INSERT INTO brands (name, country, website_url, description, year_founded, is_popular, status, logo_url) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [
                    name,
                    data.country,
                    data.country !== 'Unknown' ? `https://www.${name.toLowerCase().replace(/[\s\d]/g, '').replace('плюс', '').replace('часть', '').replace('аналог', '')}.com` : null,
                    `Производитель автозапчастей ${name} (${data.country}). Специализация: ${data.areas.join(', ')}.`,
                    getRandomInt(1900, 2020),
                    data.is_popular,
                    'active',
                    brandImagePath
                ]
            );
            brandMap[res.rows[0].id] = { name: name, mult: data.mult, areas: data.areas };
            createdBrandCount++;
        }
        const brandIds = Object.keys(brandMap);
        console.log(`Создано брендов: ${createdBrandCount}.`);


        // 5. Заполнение товаров
        console.log(`📦 Создание товаров (Цель: ${NUM_PRODUCTS})...`);

        // Создаем карту: Полное имя товара -> Чистое имя файла (для корректного пути к изображению)
        const productPathMap = new Map();
        PRODUCT_FULL_NAMES.forEach((fullName, index) => {
            productPathMap.set(fullName.toLowerCase(), PRODUCT_FILE_NAMES[index]);
        });
        
        // Собираем данные всех созданных товаров для использования при генерации заказов
        const allProducts = []; 

        for (let i = 0; i < NUM_PRODUCTS; i++) {
            let attempts = 0;
            let catData, validProducts;
            
            // Выбираем случайную категорию, для которой есть предопределенные товары
            do {
                catData = getRandomElement(categoriesFlat);
                const catSlug = catData.slug;
                validProducts = PRODUCTS_BY_SLUG[catSlug];
                attempts++;
            } while ((!validProducts || validProducts.length === 0) && attempts < 100);

            if (!validProducts || validProducts.length === 0) {
                // Если не удалось найти категорию с товарами после 100 попыток (крайне маловероятно)
                continue; 
            }

            // Выбираем случайный товар, который СТРОГО соответствует категории
            const prodNameBase = getRandomElement(validProducts); 

            // Выбираем подходящий бренд
            const catSlugForBrand = catData.slug.split('-')[0];
            const relevantBrands = brandIds.filter(id => {
                const areas = brandMap[id].areas;
                return areas.includes('all') || areas.includes(catSlugForBrand);
            });
            const brandId = relevantBrands.length > 0 ? getRandomElement(relevantBrands) : getRandomElement(brandIds);
            const brandInfo = brandMap[brandId];

            // Расчет цены
            const basePrice = getRandomFloat(catData.price[0], catData.price[1]);
            const finalPrice = Math.round((basePrice * brandInfo.mult) / 10) * 10;
            const hasDiscount = Math.random() < 0.25;
            const price = hasDiscount ? Math.round(finalPrice * getRandomFloat(0.7, 0.9)) : finalPrice;
            const oldPrice = hasDiscount ? finalPrice : null;

            const sku = generateSKU(brandInfo.name);
            const weight = getRandomFloat(catData.weight[0], catData.weight[1]).toFixed(2);
            
            // 💥 Получаем имя файла для изображения строго по полному имени товара
            const fileName = productPathMap.get(prodNameBase.toLowerCase());
            // Если имя файла не найдено (ошибка в списке PRODUCT_FULL_NAMES), используем дефолтное
            const productImagePath = fileName ? getImagePath('products', fileName) : '/assets/images/products/default.webp'; 

            const initialStock = getRandomInt(10, 100);

            const res = await client.query(
                `INSERT INTO products (
                    name, description, price, old_price, quantity_in_stock, 
                    sku, category_id, brand_id, rating, is_featured, weight, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, price, quantity_in_stock`,
                [
                    `${prodNameBase} ${brandInfo.name} (${sku})`,
                    `Высококачественный товар ${prodNameBase} от бренда ${brandInfo.name}. Артикул: ${sku}. Вес: ${weight} кг.`,
                    price, oldPrice, initialStock, sku,
                    catData.id, brandId,
                    getRandomFloat(3.5, 5.0).toFixed(2),
                    Math.random() < 0.1,
                    weight,
                    productImagePath // ⭐️ Соответствует выбранному товару
                ]
            );
            // ⭐️ Собираем данные о товарах для использования в заказах
            allProducts.push({
                id: res.rows[0].id,
                price: parseFloat(res.rows[0].price),
                stock: res.rows[0].quantity_in_stock 
            });
        }
        console.log(`Создано товаров: ${allProducts.length}.`);

        // 6. Заполнение заказов и позиций заказа (order_items)
        console.log(`🛒 Создание заказов (Цель: ${NUM_ORDERS}) и их деталей...`);
        const statuses = ['delivered', 'delivered', 'shipped', 'processing', 'pending', 'cancelled'];
        const payments = ['Оплата картой', 'Наличными', 'Онлайн-платеж'];
        
        // Карта для отслеживания списания остатков (имитация)
        const productStockMap = new Map(allProducts.map(p => [p.id, p.stock]));

        for (let i = 0; i < NUM_ORDERS; i++) {
            const orderUserId = getRandomElement(allUserIds);
            const currentStatus = getRandomElement(statuses);
            
            // Генерируем случайное количество позиций (от 1 до 5)
            const numItems = getRandomInt(1, 5); 
            let itemsToOrder = [];
            let totalAmount = 0;
            const shippingCost = Math.random() < 0.7 ? 0.00 : 500.00; // 70% бесплатная доставка

            // Выбираем случайные товары
            let availableProducts = [...allProducts];
            for (let j = 0; j < numItems; j++) {
                if (availableProducts.length === 0) break;

                const productIndex = getRandomInt(0, availableProducts.length - 1);
                const product = availableProducts[productIndex];
                
                // Проверяем остаток
                const maxQuantity = productStockMap.get(product.id) || 1; 
                
                if (maxQuantity < 1) {
                     availableProducts.splice(productIndex, 1);
                     j--; // Повторить итерацию
                     continue;
                }
                
                const quantity = getRandomInt(1, Math.min(3, maxQuantity)); 
                
                const itemTotal = product.price * quantity;
                totalAmount += itemTotal;

                itemsToOrder.push({
                    product_id: product.id,
                    quantity: quantity,
                    price_at_purchase: product.price
                });
                
                // Имитируем списание остатков (в памяти)
                productStockMap.set(product.id, maxQuantity - quantity);

                // Удаляем товар из списка для этого заказа, чтобы не дублировать
                availableProducts.splice(productIndex, 1);
            }

            // Если не удалось собрать товары, пропускаем заказ
            if (itemsToOrder.length === 0) continue; 
            
            totalAmount += shippingCost;
            
            // 6a. Создание заказа (orders)
            const orderRes = await client.query(
                `INSERT INTO orders (
                    user_id, total_amount, status, delivery_address, 
                    recipient_name, recipient_phone, payment_method, 
                    user_comment, shipping_cost
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING id, tracking_number`, // Получаем ID и tracking_number
                [
                    orderUserId, 
                    totalAmount.toFixed(2), 
                    currentStatus, 
                    `г. Москва, ул. Тестовая, д. ${getRandomInt(1, 150)}, кв. ${getRandomInt(1, 400)}`,
                    'Тестовый Клиент', 
                    `+7 (981) ${getRandomInt(100, 999)}-${getRandomInt(10, 99)}-${getRandomInt(10, 99)}`,
                    getRandomElement(payments),
                    Math.random() < 0.2 ? 'Пожелание клиента: позвонить перед доставкой' : null,
                    shippingCost
                ]
            );
            const orderId = orderRes.rows[0].id;

            // 6b. Создание позиций заказа (order_items)
            for (const item of itemsToOrder) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) 
                    VALUES ($1, $2, $3, $4)`,
                    [orderId, item.product_id, item.quantity, item.price_at_purchase]
                );

                // 6c. Списание остатков (имитация)
                // Обновляем базу данных, чтобы отразить фактические остатки
                await client.query(
                    'UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2', 
                    [item.quantity, item.product_id]
                );
            }
        }
        
        // 7. Проверка
        console.log(`✅ База данных успешно заполнена тестовыми данными. Всего пользователей: ${allUserIds.length}.`);

    } catch (err) {
        console.error('❌ Ошибка при заполнении:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();