// X5 Tech Portal - Main Application
const App = (() => {
    let currentUser = null;

    // ============ INIT ============
    async function init() {
        bindNavigation();
        bindForms();

        if (API.isAuthenticated()) {
            try {
                const data = await API.getProfile();
                currentUser = data.user;
                onAuthSuccess();
            } catch (error) {
                API.logout();
                navigate('login');
            }
        } else {
            navigate('login');
        }
    }

    // ============ NAVIGATION ============
    function bindNavigation() {
        // Кнопки навигации
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                navigate(section);
            });
        });

        // Ссылки в карточках
        document.querySelectorAll('[data-navigate]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(link.dataset.navigate);
            });
        });

        // Кнопка выхода
        document.getElementById('nav-logout')?.addEventListener('click', logout);
    }

    function navigate(section) {
        // Скрыть все секции
        document.querySelectorAll('.section').forEach(s => s.classList.remove('is-visible'));

        // Показать нужную
        const target = document.getElementById('section-' + section);
        if (target) target.classList.add('is-visible');

        // Обновить активную кнопку
        document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('btn-nav--active'));
        const navBtn = document.getElementById('nav-' + section);
        if (navBtn) navBtn.classList.add('btn-nav--active');

        // Загрузить данные
        if (section === 'users') loadUsers();
        if (section === 'profile') {
            if (currentUser) renderProfile(currentUser);
            else navigate('login');
        }

        // Очистить сообщения
        document.querySelectorAll('.alert').forEach(a => { a.textContent = ''; a.className = 'alert'; });
    }

    // ============ FORMS ============
    function bindForms() {
        document.getElementById('form-login')?.addEventListener('submit', handleLogin);
        document.getElementById('form-register')?.addEventListener('submit', handleRegister);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        if (!email || !password) {
            return showMessage('msg-login', 'Заполните все поля', 'error');
        }

        try {
            const btn = form.querySelector('.btn-submit');
            btn.textContent = 'Вход...';
            btn.disabled = true;

            const data = await API.login(email, password);
            currentUser = data.user;

            showMessage('msg-login', 'Вход выполнен успешно 🥕', 'success');
            form.reset();

            setTimeout(() => onAuthSuccess(), 1000);
        } catch (error) {
            showMessage('msg-login', error.message, 'error');
        } finally {
            const btn = form.querySelector('.btn-submit');
            btn.textContent = 'Войти в систему';
            btn.disabled = false;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;

        if (!name || !email || !password) {
            return showMessage('msg-register', 'Заполните все поля', 'error');
        }
        if (password.length < 8) {
            return showMessage('msg-register', 'Минимум 8 символов', 'error');
        }

        try {
            const btn = form.querySelector('.btn-submit');
            btn.textContent = 'Создание...';
            btn.disabled = true;

            const data = await API.register(name, email, password);
            currentUser = data.user;

            showMessage('msg-register', 'Аккаунт создан! 🥬', 'success');
            form.reset();

            setTimeout(() => onAuthSuccess(), 1200);
        } catch (error) {
            showMessage('msg-register', error.message, 'error');
        } finally {
            const btn = form.querySelector('.btn-submit');
            btn.textContent = 'Создать аккаунт';
            btn.disabled = false;
        }
    }

    // ============ AUTH SUCCESS ============
    function onAuthSuccess() {
        // Показать/скрыть кнопки
        document.getElementById('nav-login').style.display = 'none';
        document.getElementById('nav-register').style.display = 'none';
        document.getElementById('nav-profile').style.display = 'inline-flex';
        document.getElementById('nav-users').style.display = 'inline-flex';
        document.getElementById('nav-logout').style.display = 'inline-flex';

        renderProfile(currentUser);
        navigate('profile');
    }

    // ============ RENDER ============
    function renderProfile(user) {
        if (!user) return;

        document.getElementById('profileAvatar').textContent = (user.name || 'X')[0].toUpperCase();
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;

        const details = document.getElementById('profileDetails');
        const created = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        }) : '—';
        const last = user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : '—';

        details.innerHTML = `
            <div class="info-row">
                <span class="info-row__icon">🆔</span>
                <div class="info-row__content">
                    <div class="info-row__label">Табельный номер</div>
                    <div class="info-row__value">${user.id}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-row__icon">💼</span>
                <div class="info-row__content">
                    <div class="info-row__label">Должность</div>
                    <div class="info-row__value">${user.role || 'Сотрудник'}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-row__icon">🏢</span>
                <div class="info-row__content">
                    <div class="info-row__label">Департамент</div>
                    <div class="info-row__value">${user.department || 'X5 Tech'}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-row__icon">📅</span>
                <div class="info-row__content">
                    <div class="info-row__label">Дата регистрации</div>
                    <div class="info-row__value">${created}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-row__icon">🕐</span>
                <div class="info-row__content">
                    <div class="info-row__label">Последний вход</div>
                    <div class="info-row__value">${last}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-row__icon">📊</span>
                <div class="info-row__content">
                    <div class="info-row__label">Всего входов</div>
                    <div class="info-row__value">${user.loginCount || 1}</div>
                </div>
            </div>
        `;
    }

    async function loadUsers() {
        try {
            const data = await API.getUsers();
            renderUsers(data.users);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    function renderUsers(users) {
        const stats = document.getElementById('statsContainer');
        const list = document.getElementById('usersList');

        if (stats) {
            const today = new Date().toDateString();
            const active = users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === today).length;
            stats.innerHTML = `
                <div class="stat-pill">
                    <div class="stat-pill__number">${users.length}</div>
                    <div class="stat-pill__label">🥬 Сотрудников</div>
                </div>
                <div class="stat-pill">
                    <div class="stat-pill__number">${active}</div>
                    <div class="stat-pill__label">🥕 Сегодня</div>
                </div>
                <div class="stat-pill">
                    <div class="stat-pill__number">X5</div>
                    <div class="stat-pill__label">🍅 Tech</div>
                </div>
            `;
        }

        if (list) {
            if (users.length === 0) {
                list.innerHTML = '<div style="text-align:center;grid-column:1/-1;padding:40px;">🥬 База данных пуста</div>';
                return;
            }

            list.innerHTML = users.map(user => `
                <div class="user-tile">
                    <div class="user-tile__top">
                        <div class="user-tile__avatar">${(user.name || 'X')[0].toUpperCase()}</div>
                        <div>
                            <div class="user-tile__name">${user.name}</div>
                            <div class="user-tile__role">${user.role || 'Сотрудник'}</div>
                        </div>
                    </div>
                    <div class="user-tile__details">
                        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                            <span style="color:var(--text-muted)">Email</span>
                            <span style="font-weight:600">${user.email}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                            <span style="color:var(--text-muted)">ID</span>
                            <span style="font-weight:600">${user.id}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ============ LOGOUT ============
    function logout() {
        if (confirm('Выйти из системы?')) {
            API.logout();
            currentUser = null;

            document.getElementById('nav-login').style.display = 'inline-flex';
            document.getElementById('nav-register').style.display = 'inline-flex';
            document.getElementById('nav-profile').style.display = 'none';
            document.getElementById('nav-users').style.display = 'none';
            document.getElementById('nav-logout').style.display = 'none';

            navigate('login');
        }
    }

    // ============ HELPERS ============
    function showMessage(id, text, type) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'alert alert--' + type;
        el.textContent = text;
        setTimeout(() => { el.textContent = ''; el.className = 'alert'; }, 4000);
    }

    // Запуск
    return { init };
})();

// Старт при загрузке
document.addEventListener('DOMContentLoaded', () => App.init());