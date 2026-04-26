// API Service для X5 Tech Portal
const API = (() => {
    const BASE_URL = 'http://localhost:3000/api';

    function getToken() {
        return localStorage.getItem('x5_token');
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem('x5_token', token);
        } else {
            localStorage.removeItem('x5_token');
        }
    }

    async function request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const token = getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка сервера');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Сервер недоступен. Запустите backend.');
            }
            throw error;
        }
    }

    return {
        // Auth
        async login(email, password) {
            const data = await request('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            setToken(data.token);
            return data;
        },

        async register(name, email, password) {
            const data = await request('/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });
            setToken(data.token);
            return data;
        },

        // Profile
        async getProfile() {
            return await request('/profile');
        },

        // Users
        async getUsers() {
            return await request('/users');
        },

        // Verify
        async verifyToken() {
            return await request('/verify');
        },

        // Logout
        logout() {
            setToken(null);
        },

        isAuthenticated() {
            return !!getToken();
        }
    };
})();