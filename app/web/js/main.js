import { handleLogin, handleRegister, saveAuthData, checkAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    if (checkAuth()) {
        window.location.href = '/tasks.html';
    }

    // Элементы модального окна
    const loginBtn = document.getElementById('login-btn');
    const registerFree = document.getElementById('free-btn-reg');
    const registerBtn = document.getElementById('register-btn');
    const heroRegisterBtn = document.getElementById('hero-register-btn');
    const ctaRegisterBtn = document.getElementById('cta-register-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModal = document.querySelector('.close-modal');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Открытие модального окна для входа
    loginBtn.addEventListener('click', function() {
        loginModal.style.display = 'flex';
        document.querySelector('[data-tab="login"]').click();
    });

    // Открытие модального окна для регистрации
    [registerBtn, heroRegisterBtn, ctaRegisterBtn, registerFree].forEach(btn => {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'flex';
            document.querySelector('[data-tab="register"]').click();
        });
    });

    // Закрытие модального окна
    closeModal.addEventListener('click', function() {
        loginModal.style.display = 'none';
    });

    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Переключение между вкладками
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Переход к регистрации
    switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('[data-tab="register"]').click();
    });

    // Переход ко входу
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('[data-tab="login"]').click();
    });

    // Обработка формы входа
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await handleLogin(email, password);
            saveAuthData(data);
            window.location.href = '/tasks.html';
        } catch (error) {
            alert(error.message || 'Ошибка входа. Проверьте email и пароль.');
        }
    });

    // Обработка формы регистрации
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const data = await handleRegister(username, email, password);
            saveAuthData(data.auth);
            window.location.href = '/tasks.html';
        } catch (error) {
            alert(error.message || 'Ошибка регистрации. Попробуйте другие данные.');
        }
    });
});