require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const SHIPPING_COST_FIXED = 500.00; 

// --- Настройка путей и папок ---
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'activity.log');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --- Настройка базы данных ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 💥 ИЗМЕНЕНИЕ: Ограничение пула соединений (установлено в 3 по запросу пользователя)
    max: 3, 
    ssl: { rejectUnauthorized: false }
});

// --- НАСТРОЙКА NODEMAILER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'monsswhat@gmail.com',
        pass: process.env.EMAIL_PASS
    }
});

// --- Middleware ---
app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- Настройка Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, UPLOAD_DIR); },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- Логирование и Аутентификация ---

async function logAction(user, actionType, details, req) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        let username = 'Гость';
        let userId = null;
        if (user) {
            userId = user.id;
            username = user.username || `User ID ${user.id}`;
        }
        const logEntry = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            user_id: userId,
            username: username,
            action_type: actionType,
            details: details,
            ip_address: ip
        };
        fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n', (err) => {
            if (err) console.error('Ошибка записи лога:', err);
        });
    } catch (err) { console.error('Log Error:', err); }
}

function getUserFromRequest(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try { return jwt.verify(token, process.env.JWT_SECRET); } catch (e) { return null; }
}

app.use(async (req, res, next) => {
    res.on('finish', async () => {
        try {
            if (req.path.startsWith('/api/admin/logs') || req.path.startsWith('/api/auth/me')) return;
            if (req.method === 'OPTIONS') return;
            const user = getUserFromRequest(req);
            if (req.method === 'GET' && !user) return; 
            let action = 'VIEW';
            if (req.method === 'POST') action = 'CREATE/ACTION';
            if (req.method === 'PUT') action = 'UPDATE';
            if (req.method === 'DELETE') action = 'DELETE';
            let fullUser = user;
            if (user && user.id) {
                const dbUser = await pool.query('SELECT username FROM users WHERE id = $1', [user.id]);
                if(dbUser.rows.length > 0) fullUser = { ...user, username: dbUser.rows[0].username };
            }
            const details = `${req.method} ${req.originalUrl} [Code: ${res.statusCode}]`;
            await logAction(fullUser, action, details, req);
        } catch (e) { console.error("Auto-log error:", e.message); }
    });
    next();
});

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

// --- Upload (Роут для ручной загрузки, можно оставить) ---
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json({ data: [], meta: { totalItems: 0, totalPages: 0, currentPage: 1 } });
            return res.status(500).json({ error: 'Ошибка чтения логов' });
        }
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const logs = lines.map(line => { try { return JSON.parse(line); } catch (e) { return null; } }).filter(l => l !== null);
        logs.reverse();
        const totalItems = logs.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedLogs = logs.slice(offset, offset + limit);
        res.json({ data: paginatedLogs, meta: { totalItems, totalPages, currentPage: page } });
    });
});

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Заполните поля' });
    try {
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) return res.status(400).json({ error: 'Email занят' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, 'client']
        );
        logAction(newUser.rows[0], 'REGISTER', `Регистрация: ${email}`, req);
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
        logAction(user, 'LOGIN', 'Вход в систему', req);
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, phone: user.phone, address: user.address } });
    } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role, phone, address FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// РОУТ СОЗДАНИЯ ЗАКАЗА
app.post('/api/orders/create', authenticateToken, async (req, res) => {
    const { cartItems, orderDetails, saveDetails } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Корзина пуста' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // 1. Начало транзакции

        // 1. Проверка товаров и расчет под-суммы
        const productIds = cartItems.map(item => item.id);
        const productsRes = await client.query(
            'SELECT id, name, price, quantity_in_stock FROM products WHERE id = ANY($1::int[])', 
            [productIds]
        );
        const dbProductsMap = productsRes.rows.reduce((map, p) => (map[p.id] = p, map), {});

        let subTotal = 0;
        const orderItemsData = []; // Данные, готовые для вставки в order_items

        for (const cartItem of cartItems) {
            const dbProduct = dbProductsMap[cartItem.id];
            
            if (!dbProduct) throw new Error(`Product ${cartItem.id} not found.`);
            if (dbProduct.quantity_in_stock < cartItem.quantity) {
                throw new Error(`Товар ${dbProduct.name} недоступен в нужном количестве (${cartItem.quantity} шт.).`);
            }

            const itemPrice = Number(dbProduct.price);
            subTotal += itemPrice * cartItem.quantity;

            orderItemsData.push({ 
                product_id: cartItem.id, 
                quantity: cartItem.quantity, 
                price_at_purchase: itemPrice // Фиксация цены
            });
        }
        
        // 2. Расчет и очистка данных
        const shippingCost = Number(orderDetails.shipping_cost) || 0.00;
        const totalAmount = subTotal + shippingCost;
        
        const finalAddress = String(orderDetails.delivery_address || '').trim(); 
        const recipientName = String(orderDetails.recipient_name || '').trim();
        const recipientPhone = String(orderDetails.recipient_phone || '').trim();
        const paymentMethod = String(orderDetails.payment_method || '').trim();
        const userComment = String(orderDetails.user_comment || '').trim(); 

        if (!finalAddress) {
            throw new Error("Адрес доставки не указан");
        }

        // 3. Создание заказа
        const orderQuery = `INSERT INTO orders (user_id, total_amount, status, delivery_address, recipient_name, recipient_phone, payment_method, shipping_cost, user_comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, tracking_number;`;

        const orderRes = await client.query(orderQuery, [
            req.user.id, 
            totalAmount, 
            'pending', 
            finalAddress, 
            recipientName,
            recipientPhone,
            paymentMethod, 
            shippingCost, 
            userComment || null 
        ]);
        
        const orderId = orderRes.rows[0].id;
        const trackingNumber = orderRes.rows[0].tracking_number;

        // 4. Добавление позиций заказа в order_items
        for (const item of orderItemsData) {
             await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.price_at_purchase]
             );
        }

        // 5. Обновление остатков
        for (const item of orderItemsData) {
            await client.query(
                'UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2', 
                [item.quantity, item.product_id]
            );
        }

        // 6. Сохранение профиля пользователя
        if (saveDetails) {
            let updateQuery = 'UPDATE users SET phone = $1 WHERE id = $2';
            let updateParams = [recipientPhone, req.user.id];

            if (finalAddress && shippingCost > 0) {
                updateQuery = 'UPDATE users SET phone = $1, address = $3 WHERE id = $2';
                updateParams = [recipientPhone, req.user.id, finalAddress];
            }
            
            await client.query(updateQuery, updateParams);
        }

        await client.query('COMMIT'); // 7. Завершение транзакции
        
        logAction(req.user, 'ORDER_CREATE', `Создан заказ #${orderId} (Трек: ${trackingNumber}) на сумму ${totalAmount}`, req);
        
        res.json({ message: 'Заказ создан', orderId: orderId, trackingNumber: trackingNumber });

    } catch (err) {
        await client.query('ROLLBACK'); // Откат при ошибке
        console.error('Ошибка при создании заказа:', err);
        res.status(500).json({ error: err.message || 'Ошибка создания заказа' });
    } finally { 
        client.release(); 
    }
});

// --- НОВЫЕ РОУТЫ ДЛЯ УПРАВЛЕНИЯ ПОЗИЦИЯМИ ЗАКАЗА (ORDER_ITEMS) ---

// 1. ПОЛУЧЕНИЕ ВСЕХ ПОЗИЦИЙ ИЛИ ПОИСК ПО order_id
app.get('/api/order_items', authenticateToken, requireAdmin, async (req, res) => { 
    const { order_id, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    let queryParams = [parseInt(limit), offset];
    let paramCount = 3;

    if (order_id) {
        whereClause = `WHERE oi.order_id = $${paramCount++}`;
        queryParams.push(order_id);
    }
    
    const dataQuery = `
        SELECT 
            oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase,
            p.name as product_name, p.sku as product_sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        ${whereClause}
        ORDER BY oi.order_id DESC, oi.id DESC
        LIMIT $1 OFFSET $2;
    `;
    
    const countQuery = `SELECT COUNT(*) FROM order_items oi ${whereClause}`;

    try {
        const itemsRes = await pool.query(dataQuery, queryParams);
        
        const countParams = queryParams.slice(2); 
        const countRes = await pool.query(countQuery, countParams); 

        res.json({
            items: itemsRes.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
});

/**
 * Вспомогательная функция для пересчета суммы заказа
 * @param {number} orderId 
 * @param {object} client - pg-client для транзакции
 */
const updateOrderTotal = async (orderId, client) => {
    // 1. Считаем сумму позиций
    const itemsTotalRes = await client.query(
        'SELECT COALESCE(SUM(quantity * price_at_purchase), 0) as items_total FROM order_items WHERE order_id = $1',
        [orderId]
    );
    const itemsTotal = parseFloat(itemsTotalRes.rows[0].items_total);

    // 2. Получаем стоимость доставки
    const orderRes = await client.query(
        'SELECT shipping_cost FROM orders WHERE id = $1',
        [orderId]
    );
    const shippingCost = orderRes.rows.length > 0 ? parseFloat(orderRes.rows[0].shipping_cost) : 0;
    
    // 3. Обновляем общую сумму заказа
    const newTotal = itemsTotal + shippingCost;

    await client.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [newTotal, orderId]);
    return newTotal;
};


// 2. СОЗДАНИЕ НОВОЙ ПОЗИЦИИ
app.post('/api/order_items', authenticateToken, requireAdmin, async (req, res) => { 
    const { order_id, product_id, quantity, price_at_purchase } = req.body;

    if (!order_id || !product_id || !quantity || !price_at_purchase) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // 1. Вставка в order_items
        const insertQuery = `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) 
            VALUES ($1, $2, $3, $4) RETURNING *`;
        const itemRes = await client.query(insertQuery, [order_id, product_id, quantity, price_at_purchase]);

        // 2. Обновление остатков товара (уменьшаем)
        await client.query(
            'UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2', 
            [quantity, product_id]
        );
        
        // 3. Обновление общей суммы заказа
        await updateOrderTotal(order_id, client);

        await client.query('COMMIT');
        res.status(201).json(itemRes.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order item:', error);
        res.status(500).json({ error: error.message || 'Failed to create order item' });
    } finally {
        client.release();
    }
});


// 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЙ ПОЗИЦИИ
app.put('/api/order_items/:id', authenticateToken, requireAdmin, async (req, res) => { 
    const itemId = req.params.id;
    const { order_id, product_id, quantity, price_at_purchase } = req.body;
    
    if (!order_id || !product_id || !quantity || !price_at_purchase) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Получаем старое количество (используем client.query)
        const oldItemRes = await client.query('SELECT order_id, product_id, quantity FROM order_items WHERE id = $1', [itemId]);
        
        if (oldItemRes.rows.length === 0) {
             await client.query('ROLLBACK');
             return res.status(404).json({ error: 'Order item not found' });
        }
        const oldQuantity = oldItemRes.rows[0].quantity;
        const oldProductId = oldItemRes.rows[0].product_id;

        // 2. Рассчитываем разницу в количестве
        const quantityDelta = oldQuantity - quantity; 
        
        // 3. Обновляем остатки товара
        if (quantityDelta !== 0) {
            if (oldProductId !== product_id) {
                 await client.query('UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2', [oldQuantity, oldProductId]);
                 await client.query('UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2', [quantity, product_id]);
            } else {
                 await client.query('UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2', [quantityDelta, product_id]);
            }
        }

        // 4. Обновление самой позиции
        const updateQuery = `
            UPDATE order_items SET 
            order_id = $1, product_id = $2, quantity = $3, price_at_purchase = $4
            WHERE id = $5 RETURNING *`;
        const itemRes = await client.query(updateQuery, [order_id, product_id, quantity, price_at_purchase, itemId]);

        // 5. Обновление общей суммы заказа
        await updateOrderTotal(order_id, client);

        await client.query('COMMIT');
        res.json(itemRes.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating order item:', error);
        res.status(500).json({ error: error.message || 'Failed to update order item' });
    } finally {
        client.release();
    }
});


// 4. УДАЛЕНИЕ ПОЗИЦИИ
app.delete('/api/order_items/:id', authenticateToken, requireAdmin, async (req, res) => { 
    const itemId = req.params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Получаем данные для возврата на склад и order_id
        const oldItemRes = await client.query('SELECT order_id, product_id, quantity FROM order_items WHERE id = $1', [itemId]);
        if (oldItemRes.rows.length === 0) {
             await client.query('ROLLBACK');
             return res.status(404).json({ error: 'Order item not found' });
        }
        const { order_id, product_id, quantity } = oldItemRes.rows[0];

        // 2. Удаляем позицию
        const deleteRes = await client.query('DELETE FROM order_items WHERE id = $1 RETURNING *', [itemId]);
        
        // 3. Возвращаем товар на склад
        await client.query(
            'UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2', 
            [quantity, product_id]
        );
        
        // 4. Обновление общей суммы заказа
        await updateOrderTotal(order_id, client);

        await client.query('COMMIT');
        res.status(200).json(deleteRes.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting order item:', error);
        res.status(500).json({ error: error.message || 'Failed to delete order item' });
    } finally {
        client.release();
    }
});

// --- РОУТ КЛИЕНТА (ЗАКАЗЫ) ---
app.get('/api/orders/my', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, total_amount, status, delivery_address, recipient_name, payment_method, shipping_cost, tracking_number, user_comment 
             FROM orders 
             WHERE user_id = $1 
             ORDER BY id DESC`, 
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении заказов клиента:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// --- РОУТ ОПЛАТЫ ---
app.post('/api/orders/:id/pay', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE orders SET status = 'paid' WHERE id = $1 AND user_id = $2 RETURNING *`, 
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        logAction(req.user, 'ORDER_PAY', `Оплата заказа #${req.params.id}`, req);
        res.json({ message: 'Оплата успешна', order: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Ошибка оплаты' }); }
});

// --- РОУТ ОТМЕНЫ ---
app.post('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const checkOrder = await pool.query(`SELECT status FROM orders WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
        if (checkOrder.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        if (checkOrder.rows[0].status !== 'pending') return res.status(400).json({ error: 'Нельзя отменить' });
        
        // Дополнительная логика: вернуть товары на склад при отмене заказа
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
            
            // 💥 ОПТИМИЗИРОВАННЫЙ ВОЗВРАТ ТОВАРОВ (как при удалении)
            const itemsToRestore = itemsRes.rows;
            if (itemsToRestore.length > 0) {
                const updateValues = itemsToRestore
                    .map(item => `(${item.product_id}, ${item.quantity})`)
                    .join(', ');
                    
                await client.query(`
                    UPDATE products p
                    SET quantity_in_stock = p.quantity_in_stock + updates.quantity_to_add
                    FROM (VALUES ${updateValues}) AS updates(product_id_to_update, quantity_to_add)
                    WHERE p.id = updates.product_id_to_update
                `);
            }

            const result = await client.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *`, [req.params.id]);
            await client.query('COMMIT');

            logAction(req.user, 'ORDER_CANCEL', `Отмена заказа #${req.params.id}`, req);
            res.json({ message: 'Заказ отменен', order: result.rows[0] });

        } catch(txnErr) {
            await client.query('ROLLBACK');
            throw txnErr;
        } finally {
            client.release();
        }

    } catch (err) { res.status(500).json({ error: 'Ошибка отмены' }); }
});

// --- РОУТ СТАТИСТИКИ МАГАЗИНА ---
app.get('/api/stats', async (req, res) => {
    try {
        const [productsRes, customersRes, shippedOrdersRes] = await Promise.all([
            pool.query(`SELECT COUNT(id) AS total_products FROM products`),
            pool.query(`SELECT COUNT(DISTINCT user_id) AS unique_customers FROM orders`),
            pool.query(`SELECT COUNT(id) AS shipped_orders FROM orders WHERE status IN ('shipped', 'delivered')`)
        ]);
        
        res.json({
            total_products: parseInt(productsRes.rows[0].total_products) || 0,
            unique_customers: parseInt(customersRes.rows[0].unique_customers) || 0,
            shipped_orders: parseInt(shippedOrdersRes.rows[0].shipped_orders) || 0,
        });

    } catch (err) {
        console.error('Ошибка при получении статистики:', err);
        res.status(500).json({ 
            error: 'Ошибка сервера при загрузке статистики', 
            total_products: 0,
            unique_customers: 0,
            shipped_orders: 0
        });
    }
});

// --- РОУТ ПОЛУЧЕНИЯ КОНТАКТОВ ---
app.get('/api/contacts', async (req, res) => {
    try {
        const staticContacts = {
            phone: '+7 (999) 123-45-67',
            email: 'info@autoparts.ru',
            address: 'г. Москва, ул. Автозаводская, д. 15',
            workHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00',
            social_vk: 'https://vk.com/autoparts',
            social_tg: 'https://t.me/autoparts'
        };
        
        res.json(staticContacts);

    } catch (err) {
        console.error('Ошибка при получении контактов:', err);
        res.status(500).json({ error: 'Ошибка сервера при загрузке контактов' });
    }
});

// --- РОУТ ОТПРАВКИ ФОРМЫ ОБРАТНОЙ СВЯЗИ ---
app.post('/api/feedback', async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Не все обязательные поля заполнены.' });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'monsswhat@gmail.com',
            to: 'monsswhat@gmail.com',
            subject: `[FEEDBACK] ${subject} (от ${name})`,
            html: `
                <h2>Новое сообщение обратной связи</h2>
                <p><strong>Отправитель:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Телефон:</strong> ${phone || 'Не указан'}</p>
                <p><strong>Тема:</strong> ${subject}</p>
                <hr>
                <p><strong>Сообщение:</strong></p>
                <p style="white-space: pre-wrap; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9;">${message}</p>
                <hr>
                <small>Дата: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</small>
            `
        };

        await transporter.sendMail(mailOptions);
        logAction(null, 'FEEDBACK_SENT', `Сообщение отправлено на почту от ${email}. Тема: ${subject}`, req);
        
        res.json({ message: 'Сообщение успешно отправлено.' });

    } catch (err) {
        console.error('❌ Ошибка при отправке Email:', err);
        let errorMessage = 'Произошла ошибка сервера. Попробуйте позже.';
        if (err.code === 'EAUTH' || err.responseCode === 535) {
             errorMessage = 'Ошибка аутентификации. Проверьте EMAIL_PASS.';
        }
        res.status(500).json({ error: errorMessage });
    }
});
// -------------------------------------------------------------

// --- CRUD ГЕНЕРАТОР (ДЛЯ АДМИНА) ---
function createCrudRoutes(tableName, allowedFields, isPublicGet = true) {
    const router = express.Router();
    const getMiddleware = isPublicGet ? [] : [authenticateToken, requireAdmin];
    
    const fileColumnName = tableName === 'brands' ? 'logo_url' : 'image_url';
    const needsFileUpload = tableName === 'products' || tableName === 'categories' || tableName === 'brands';
    
    const uploadMiddleware = needsFileUpload 
        ? upload.single('image') 
        : (req, res, next) => next();


    // --- GET / 
    router.get('/', ...getMiddleware, async (req, res) => {
        try {
            const { category_id, product_id, brand_id, price_min, price_max, has_discount, sort } = req.query;
            let queryText = `SELECT * FROM ${tableName}`;
            let whereClauses = [];
            let queryParams = [];
            let paramIndex = 1;

            if (tableName === 'products') {
                if (category_id) { whereClauses.push(`category_id = $${paramIndex++}`); queryParams.push(category_id); }
                if (brand_id) { whereClauses.push(`brand_id = $${paramIndex++}`); queryParams.push(brand_id); }
                if (price_min && !isNaN(price_min)) { whereClauses.push(`price >= $${paramIndex++}`); queryParams.push(price_min); }
                if (price_max && !isNaN(price_max)) { whereClauses.push(`price <= $${paramIndex++}`); queryParams.push(price_max); }
                if (has_discount === '1' || has_discount === 'true') { whereClauses.push(`old_price IS NOT NULL AND old_price > price`); }
            }

            if (whereClauses.length > 0) queryText += ` WHERE ${whereClauses.join(' AND ')}`;
            
            let orderBy = ` ORDER BY id ASC`; 
            if (tableName === 'orders') orderBy = ` ORDER BY id DESC`; 
            if (tableName === 'products' && sort) {
                if (sort === 'price_asc') orderBy = ` ORDER BY price ASC`;
                else if (sort === 'price_desc') orderBy = ` ORDER BY price DESC`;
            }
            queryText += orderBy;
            
            const result = await pool.query(queryText, queryParams);
            if (tableName === 'users') {
                const safeUsers = result.rows.map(u => { const { password_hash, ...rest } = u; return rest; });
                return res.json(safeUsers);
            }
            res.json(result.rows); 
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // --- GET /:id 
    router.get('/:id', ...getMiddleware, async (req, res) => {
        try {
            const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            if (tableName === 'users') { const { password_hash, ...rest } = result.rows[0]; return res.json(rest); }
            res.json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });


    // --- POST / (СОЗДАНИЕ) ---
    router.post('/', authenticateToken, requireAdmin, 
        uploadMiddleware, 
        async (req, res) => {
        try {
            let keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
            let bodyData = { ...req.body };
            
            if (needsFileUpload) {
                keys = keys.filter(k => k !== 'image_url' && k !== 'logo_url'); 

                if (req.file) { 
                    bodyData[fileColumnName] = `/uploads/${req.file.filename}`;
                    keys.push(fileColumnName); 
                } else if (bodyData[fileColumnName] !== undefined) { 
                    const urlValue = bodyData[fileColumnName] === '' ? null : bodyData[fileColumnName];
                    bodyData[fileColumnName] = urlValue;
                    keys.push(fileColumnName);
                }
            }

            if (tableName === 'users' && bodyData.password) {
                const salt = await bcrypt.genSalt(10);
                bodyData.password_hash = await bcrypt.hash(bodyData.password, salt);
                keys = keys.filter(k => k !== 'password'); 
                keys.push('password_hash'); 
            }
            
            const values = keys.map(k => bodyData[k]);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            
            const result = await pool.query(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
            res.json(result.rows[0]);
        } catch (err) { 
            if (req.file) {
                fs.unlink(req.file.path, () => {}); 
            }
            res.status(500).json({ error: err.message }); 
        }
    });

    // --- PUT /:id (ОБНОВЛЕНИЕ) ---
    router.put('/:id', authenticateToken, requireAdmin, 
        uploadMiddleware, 
        async (req, res) => {
        try {
            let keys = Object.keys(req.body).filter(k => allowedFields.includes(k));
            let bodyData = { ...req.body };
            
            let oldFileUrl = null;
            if (needsFileUpload) {
                 const oldItemRes = await pool.query(`SELECT ${fileColumnName} FROM ${tableName} WHERE id = $1`, [req.params.id]);
                 oldFileUrl = oldItemRes.rows[0]?.[fileColumnName];
                 
                 keys = keys.filter(k => k !== 'image_url' && k !== 'logo_url');
            }

            if (needsFileUpload) {
                if (req.file) { 
                    bodyData[fileColumnName] = `/uploads/${req.file.filename}`;
                    keys.push(fileColumnName);
                    
                    if (oldFileUrl && !oldFileUrl.includes('/uploads/default')) {
                       const filePath = path.join(UPLOAD_DIR, path.basename(oldFileUrl));
                       fs.unlink(filePath, (err) => {
                           if (err && err.code !== 'ENOENT') {
                               console.error(`Ошибка удаления старого файла ${filePath}:`, err);
                           }
                       });
                    }
                } 
                else if (bodyData[fileColumnName] !== undefined) { 
                    const urlValue = bodyData[fileColumnName] === '' ? null : bodyData[fileColumnName];
                    bodyData[fileColumnName] = urlValue;
                    keys.push(fileColumnName);
                    
                    if (urlValue === null && oldFileUrl && !oldFileUrl.includes('/uploads/default')) {
                         const filePath = path.join(UPLOAD_DIR, path.basename(oldFileUrl));
                         fs.unlink(filePath, (err) => {
                             if (err && err.code !== 'ENOENT') {
                                 console.error(`Ошибка удаления старого файла (сброс URL) ${filePath}:`, err);
                             }
                         });
                    }
                }
            }

            if (tableName === 'users' && bodyData.password) {
                const salt = await bcrypt.genSalt(10);
                bodyData.password_hash = await bcrypt.hash(bodyData.password, salt);
                keys = keys.filter(k => k !== 'password'); 
                keys.push('password_hash'); 
            }
            
            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const values = keys.map(k => bodyData[k]);
            values.push(req.params.id);
            const result = await pool.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
            res.json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // --- DELETE /:id (УДАЛЕНИЕ) ---
    router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
        const id = req.params.id;

        // ⭐️ Логика для таблицы 'users' 
        if (tableName === 'users') {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const ordersRes = await client.query('SELECT id FROM orders WHERE user_id = $1', [id]);
                const orderIds = ordersRes.rows.map(row => row.id);

                if (orderIds.length > 0) {
                    for (const orderId of orderIds) {
                         const itemsRes = await client.query(
                             'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                             [orderId]
                         );
                         // 💥 ОПТИМИЗИРОВАННЫЙ ВОЗВРАТ ТОВАРОВ
                         const itemsToRestore = itemsRes.rows;
                         if (itemsToRestore.length > 0) {
                             const updateValues = itemsToRestore
                                 .map(item => `(${item.product_id}, ${item.quantity})`)
                                 .join(', ');
                                 
                             await client.query(`
                                 UPDATE products p
                                 SET quantity_in_stock = p.quantity_in_stock + updates.quantity_to_add
                                 FROM (VALUES ${updateValues}) AS updates(product_id_to_update, quantity_to_add)
                                 WHERE p.id = updates.product_id_to_update
                             `);
                         }
                    }

                    await client.query('DELETE FROM order_items WHERE order_id = ANY($1::int[])', [orderIds]);
                    await client.query('DELETE FROM orders WHERE user_id = $1', [id]);
                }

                const deleteRes = await client.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
                
                if (deleteRes.rows.length === 0) {
                     await client.query('ROLLBACK');
                     return res.status(404).json({ error: 'User not found' });
                }

                await client.query('COMMIT');
                logAction(req.user, 'USER_DELETE', `Удален пользователь #${id} и все его заказы.`, req);
                return res.json({ message: 'Deleted' });

            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Error deleting user ${id}:`, err);
                return res.status(500).json({ error: 'Cannot delete user due to server error.' });
            } finally {
                client.release();
            }
        }
        
        // ⭐️ Логика для таблицы 'orders' (Заказы) [ОПТИМИЗИРОВАНО]
        if (tableName === 'orders') {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Получаем позиции заказа для возврата на склад
                const itemsRes = await client.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                    [id]
                );
                
                const itemsToRestore = itemsRes.rows;

                // 2. Возвращаем товары на склад: ОДИН ЗАПРОС (Bulk Update)
                if (itemsToRestore.length > 0) {
                    const updateValues = itemsToRestore
                        .map(item => `(${item.product_id}, ${item.quantity})`)
                        .join(', ');
                        
                    await client.query(`
                        UPDATE products p
                        SET quantity_in_stock = p.quantity_in_stock + updates.quantity_to_add
                        FROM (VALUES ${updateValues}) AS updates(product_id_to_update, quantity_to_add)
                        WHERE p.id = updates.product_id_to_update
                    `);
                }

                // 3. Удаляем сам заказ. 
                //    Удаление order_items произойдет АВТОМАТИЧЕСКИ (ON DELETE CASCADE в схеме).
                // 💥 ИСПРАВЛЕНИЕ: Используем client.query и убираем RETURNING *
                const deleteRes = await client.query(`DELETE FROM orders WHERE id = $1`, [id]);
                
                if (deleteRes.rowCount === 0) {
                     await client.query('ROLLBACK');
                     return res.status(404).json({ error: 'Order not found' });
                }
                
                await client.query('COMMIT');
                logAction(req.user, 'ORDER_DELETE', `Удален заказ #${id} (Оптимизировано). Товары возвращены на склад.`, req);
                return res.json({ message: 'Deleted' });
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Error deleting order ${id}:`, err);
                return res.status(500).json({ error: 'Cannot delete order due to server error.' });
            } finally {
                client.release();
            }
        }
        
        // ⭐️ Транзакционная логика для Products, Categories, Brands
        if (tableName === 'products' || tableName === 'categories' || tableName === 'brands') {
             const client = await pool.connect();
             try {
                 await client.query('BEGIN');
                 
                 // 1. Удаляем файл
                 if (needsFileUpload) {
                     const fileRes = await client.query(`SELECT ${fileColumnName} FROM ${tableName} WHERE id = $1`, [id]);
                     const imageUrl = fileRes.rows[0]?.[fileColumnName];
                     if (imageUrl && !imageUrl.includes('/uploads/default')) {
                         const filePath = path.join(UPLOAD_DIR, path.basename(imageUrl));
                         fs.unlink(filePath, (err) => {
                             if (err && err.code !== 'ENOENT') console.error(`Ошибка удаления файла ${filePath}:`, err);
                         });
                     }
                 }

                 if (tableName === 'products') {
                      await client.query('DELETE FROM order_items WHERE product_id = $1', [id]);
                 } else if (tableName === 'categories') {
                      await client.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [id]);
                 } else if (tableName === 'brands') {
                      await client.query('UPDATE products SET brand_id = NULL WHERE brand_id = $1', [id]);
                 }

                 // 2. Удаляем саму запись
                 const deleteRes = await client.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
                 if (deleteRes.rows.length === 0) {
                      await client.query('ROLLBACK');
                      return res.status(404).json({ error: `${tableName} not found` });
                 }

                 await client.query('COMMIT');
                 logAction(req.user, `${tableName.toUpperCase()}_DELETE`, `Удалена запись в ${tableName} #${id}`, req);
                 return res.json({ message: 'Deleted' });

             } catch (err) {
                 await client.query('ROLLBACK');
                 console.error(`Error deleting ${tableName} ${id}:`, err);
                 return res.status(500).json({ error: `Cannot delete ${tableName} due to server error or failed foreign key resolution.` });
             } finally {
                 client.release();
             }
        }


        // Обычная логика удаления 
        try {
            const deleteRes = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
            if (deleteRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
            res.json({ message: 'Deleted' });
        } catch (err) { 
            console.error(`Error deleting generic item ${id}:`, err);
            res.status(500).json({ error: 'Cannot delete' }); 
        }
    });

    return router;
}

// --- Определения полей ---
const userFields = ['username', 'email', 'role', 'phone', 'address', 'password']; 
const productFields = ['name', 'description', 'price', 'old_price', 'quantity_in_stock', 'sku', 'category_id', 'brand_id', 'image_url', 'rating', 'is_featured', 'weight'];
const categoryFields = ['name', 'slug', 'description', 'image_url', 'parent_id', 'is_active', 'sort_order', 'meta_title', 'discount_percent'];
const brandFields = ['name', 'country', 'website_url', 'logo_url', 'description', 'year_founded', 'is_popular', 'contact_email', 'meta_keywords', 'status'];
const orderFields = ['user_id', 'total_amount', 'status', 'delivery_address', 'recipient_name', 'recipient_phone', 'payment_method', 'tracking_number', 'user_comment', 'shipping_cost'];

app.use('/api/products', createCrudRoutes('products', productFields, true));
app.use('/api/categories', createCrudRoutes('categories', categoryFields, true));
app.use('/api/brands', createCrudRoutes('brands', brandFields, true));
app.use('/api/users', createCrudRoutes('users', userFields, false));
app.use('/api/orders', createCrudRoutes('orders', orderFields, false)); 

// --- Обработка роутов фронтенда ---
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: "API not found" });
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});