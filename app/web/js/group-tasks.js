import { checkAuth, logout } from './auth.js';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'https://localhost:443'
  : 'https://api-mindeasy.ru';
let currentGroup = null;
let currentTasks = [];

// Ключи для localStorage
const CACHE_KEYS = {
    PROFILE: 'profile_cache',
    GROUP_INFO: 'group_info_cache',
    GROUP_TASKS: 'group_tasks_cache',
    CACHE_TIMESTAMP: 'cache_timestamp'
};

// Время жизни кэша (5 минут)
const CACHE_EXPIRATION = 5 * 60 * 1000;

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    const headerUsername = document.querySelector('.username');

    // Загрузка профиля с кэшированием
    async function loadProfile() {
        const cachedProfile = getCachedData(CACHE_KEYS.PROFILE);

        if (cachedProfile) {
            headerUsername.textContent = cachedProfile.username;
            return;
        }

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
            headerUsername.textContent = data.username;

            // Сохраняем в кэш
            cacheData(CACHE_KEYS.PROFILE, data);

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные профиля');
        }
    }

    await loadProfile();

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', () => {
        // Очищаем кэш при выходе
        clearCache();
        logout();
    });

    // Получаем ID группы из URL
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('group_id');

    if (!groupId) {
        window.location.href = '/groups.html';
        return;
    }

    await loadGroupInfo(groupId);
    await loadGroupTasks(groupId);
});

// Функции для работы с кэшем
function getCachedData(key) {
    const cachedData = localStorage.getItem(key);
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);

    if (!cachedData || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_EXPIRATION) {
        localStorage.removeItem(key);
        localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
        return null;
    }

    return JSON.parse(cachedData);
}

function cacheData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
}

function clearCache() {
    Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// Загрузка информации о группе с кэшированием
async function loadGroupInfo(groupId) {
    const cacheKey = `${CACHE_KEYS.GROUP_INFO}_${groupId}`;
    const cachedGroup = getCachedData(cacheKey);

    if (cachedGroup) {
        currentGroup = cachedGroup;
        renderGroupInfo(currentGroup);
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки информации о группе');
        }

        currentGroup = await response.json();
        renderGroupInfo(currentGroup);
        cacheData(cacheKey, currentGroup);

    } catch (error) {
        console.error('Error loading group info:', error);
        alert('Не удалось загрузить информацию о группе');
        window.location.href = '/groups.html';
    }
}

// Загрузка задач группы с кэшированием
async function loadGroupTasks(groupId) {
    const cacheKey = `${CACHE_KEYS.GROUP_TASKS}_${groupId}`;
    const cachedTasks = getCachedData(cacheKey);

    if (cachedTasks) {
        currentTasks = cachedTasks;
        renderTasks(currentTasks.items);
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/tasks?group_id=${groupId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки задач группы');
        }

        currentTasks = await response.json();
        renderTasks(currentTasks.items);
        cacheData(cacheKey, currentTasks);

    } catch (error) {
        console.error('Error loading group tasks:', error);
        alert('Не удалось загрузить задачи группы');
    }
}

// Остальные функции (renderGroupInfo, renderTasks, getStatusText) остаются без изменений

function renderGroupInfo(group) {
    const container = document.getElementById('group-info-container');
    container.innerHTML = `
        <h1 class="group-name">${group.name}</h1>
        ${group.description ? `<div class="group-description">${group.description}</div>` : ''}
        <div class="group-meta">
            <div>Создано: ${new Date(group.created_at).toLocaleDateString()}</div>
            <div>Задач: ${group.tasks_count || 0}</div>
        </div>
    `;
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<p>Нет задач, соответствующих фильтрам</p>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.innerHTML = `
            <div class="task-card-header">
                <div class="task-title">${task.title}</div>
                <div class="task-priority">Приоритет: ${task.priority}</div>
                ${task.group ? `
                <div class="task-group">
                    <i class="fas fa-folder"></i> ${task.group.name}
                </div>` : ''}
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-dates">
                <div>Создано: ${new Date(task.created_at).toLocaleDateString()}</div>
                ${task.due_date ? `<div>Срок: ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
            </div>
            <div class="task-status status-${task.status}">
                ${getStatusText(task.status)}
            </div>
            <div class="task-actions">
                <button class="btn btn-outline edit-task" data-id="${task.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-danger delete-task" data-id="${task.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;

        taskList.appendChild(taskElement);
    });

    // Добавляем обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => editTask(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTask(e.target.dataset.id));
    });
}

function getStatusText(status) {
    switch(status) {
        case 'todo': return 'Сделать';
        case 'in_progress': return 'В работе';
        case 'done': return 'Готово';
        default: return status;
    }
}