// profile.js
import {checkAuth, logout} from "./auth.js";

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'https://localhost:443'
  : 'https://api-mindeasy.ru';

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const createdDateSpan = document.getElementById('profile-created-at');
    const tasksCountSpan = document.getElementById('tasks-count');
    const groupsCountSpan = document.getElementById('groups-count');
    const profileForm = document.getElementById('profile-form');
    const headerUsername = document.querySelector('.username');
    const buyPremiumBtn = document.getElementById('buy-premium');

    // Загрузка данных профиля
    async function loadProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки профиля');
            }

            const data = await response.json();

            // Заполняем данные на странице
            usernameInput.value = data.username;
            emailInput.value = data.email;
            headerUsername.textContent = data.username;

            // Форматируем дату регистрации
            const createdAt = new Date(data.created_at);
            createdDateSpan.textContent = createdAt.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Статистика
            tasksCountSpan.textContent = data.tasks_count;
            groupsCountSpan.textContent = data.groups_count;

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные профиля');
        }
    }

    // Обработка формы обновления профиля
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newUsername = usernameInput.value.trim();

        if (!newUsername) {
            alert('Логин не может быть пустым');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    username: newUsername
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка обновления профиля');
            }

            // Обновляем имя в шапке
            headerUsername.textContent = newUsername;
            alert('Профиль успешно обновлен');

        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message || 'Не удалось обновить профиль');
        }
    });

    // Премиум функционал (заглушка)
    buyPremiumBtn.addEventListener('click', () => {
        alert('Премиум функционал в разработке');
    });

    await loadProfile();
});