const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : 'https://api-mindeasy.ru';

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка входа');
        }

        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function handleRegister(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка регистрации');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

function saveAuthData(authData) {
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('token_type', authData.token_type);
}

function checkAuth() {
    return localStorage.getItem('access_token') !== null;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    window.location.href = '/';
}

export { handleLogin, handleRegister, saveAuthData, checkAuth, logout };