const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'x5_tech_secret_key_2024';
const DB_PATH = path.join(__dirname, 'data', 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// ============ DATABASE HELPERS ============
function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения БД:', error);
        return { users: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка записи в БД:', error);
        return false;
    }
}

// ============ MIDDLEWARE ============
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// ============ API ROUTES ============

// Регистрация
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Валидация
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 8 символов' });
        }

        const db = readDB();

        // Проверка уникальности
        if (db.users.find(u => u.email === email)) {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const newUser = {
            id: 'EMP-' + Date.now().toString(36).toUpperCase(),
            name,
            email,
            password: hashedPassword,
            role: 'Сотрудник',
            department: 'X5 Tech',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginCount: 1
        };

        db.users.push(newUser);
        writeDB(db);

        // Генерация токена
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                createdAt: newUser.createdAt,
                lastLogin: newUser.lastLogin,
                loginCount: newUser.loginCount
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Вход
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const db = readDB();
        const user = db.users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Обновление данных входа
        user.lastLogin = new Date().toISOString();
        user.loginCount = (user.loginCount || 0) + 1;

        const userIndex = db.users.findIndex(u => u.id === user.id);
        db.users[userIndex] = user;
        writeDB(db);

        // Генерация токена
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Профиль текущего пользователя
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Список всех пользователей
app.get('/api/users', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const users = db.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
            loginCount: u.loginCount
        }));

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Проверка токена
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, userId: req.user.userId });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(` X5 Tech API запущен на http://localhost:${PORT}`);
    console.log(` База данных: ${DB_PATH}`);
});