import { checkAuth, logout } from './auth.js';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'https://localhost:443'
  : 'https://api-mindeasy.ru';
let currentGroups = [];

// Ключи для кэширования
const CACHE_KEYS = {
    GROUPS: 'groups_cache',
    CACHE_TIMESTAMP: 'cache_timestamp'
};

// Время жизни кэша (5 минут)
const CACHE_EXPIRATION = 5 * 60 * 1000;

document.getElementById('new-group-btn').addEventListener('click', () => {
    showGroupForm(null);
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    const headerUsername = document.querySelector('.username');

    // Загрузка профиля с кэшированием
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
            headerUsername.textContent = data.username;

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные профиля');
        }
    }

    await loadProfile();

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', () => {
        clearCache(); // Очищаем кэш при выходе
        logout();
    });

    // Загрузка групп с кэшированием
    await loadGroups();

    document.getElementById('cancel-edit').addEventListener('click', hideGroupForm);
    document.getElementById('group-edit-form').addEventListener('submit', handleGroupSubmit);
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

// Загрузка групп с кэшированием
async function loadGroups() {
    const cachedGroups = getCachedData(CACHE_KEYS.GROUPS);

    if (cachedGroups) {
        currentGroups = cachedGroups;
        renderGroups(currentGroups);
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/groups`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки групп');
        }

        currentGroups = await response.json();
        renderGroups(currentGroups);
        cacheData(CACHE_KEYS.GROUPS, currentGroups);

    } catch (error) {
        console.error('Error loading groups:', error);
        alert('Не удалось загрузить группы');
    }
}

function renderGroups(groups) {
    const groupList = document.getElementById('groups-list');
    groupList.innerHTML = '';

    if (groups.length === 0) {
        groupList.innerHTML = '<p>У вас пока нет групп задач</p>';
        return;
    }

    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-card';
        groupElement.innerHTML = `
            <div class="group-card-header">
                <div class="group-title">${group.name}</div>
                <div class="tasks-count">${group.tasks_count || 0} задач</div>
            </div>
            <div class="group-meta">
                <div>Создано: ${new Date(group.created_at).toLocaleDateString()}</div>
            </div>
            ${group.description ? `<div class="group-description">${group.description}</div>` : ''}
            <div class="group-actions">
                <button class="btn btn-outline view-group" data-id="${group.id}">
                    <i class="fas fa-eye"></i> Просмотр
                </button>
                <button class="btn btn-outline edit-group" data-id="${group.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-danger delete-group" data-id="${group.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;

        groupList.appendChild(groupElement);
    });

    // Добавляем обработчики для кнопок
    document.querySelectorAll('.view-group').forEach(btn => {
        btn.addEventListener('click', (e) => viewGroup(e.target.dataset.id));
    });

    document.querySelectorAll('.edit-group').forEach(btn => {
        btn.addEventListener('click', (e) => editGroup(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-group').forEach(btn => {
        btn.addEventListener('click', (e) => deleteGroup(e.target.dataset.id));
    });
}

function showGroupForm(group = null) {
    const form = document.getElementById('group-form');
    const formTitle = document.getElementById('form-title');
    const groupIdInput = document.getElementById('group-id');

    document.getElementById('group-edit-form').reset();

    if (group) {
        formTitle.textContent = 'Редактировать группу';
        groupIdInput.value = group.id;
        document.getElementById('group-name').value = group.name;
        document.getElementById('group-description').value = group.description || '';
    } else {
        formTitle.textContent = 'Новая группа';
        groupIdInput.value = '';
    }

    form.style.display = 'block';
    window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
}

function hideGroupForm() {
    document.getElementById('group-form').style.display = 'none';
}

function viewGroup(groupId) {
    window.location.href = `/group-tasks.html?group_id=${groupId}`;
}

async function editGroup(groupId) {
    const group = currentGroups.find(g => g.id === groupId);
    if (group) {
        showGroupForm(group);
    }
}

async function deleteGroup(groupId) {
    if (!confirm('Вы уверены, что хотите удалить эту группу? Задачи не будут удалены.')) return;

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            clearCache(); // Очищаем кэш после удаления
            await loadGroups();
        } else {
            throw new Error('Ошибка удаления группы');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Не удалось удалить группу');
    }
}

async function handleGroupSubmit(e) {
    e.preventDefault();

    const groupId = document.getElementById('group-id').value;
    const isEdit = !!groupId;

    const groupData = {
        name: document.getElementById('group-name').value.trim(),
        description: document.getElementById('group-description').value.trim() || null
    };

    if (!groupData.name) {
        alert('Название группы обязательно!');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        let response;
        let endpoint;
        let method;

        if (isEdit) {
            endpoint = `${API_BASE_URL}/api/groups/${groupId}`;
            method = 'PATCH';
        } else {
            endpoint = `${API_BASE_URL}/api/groups`;
            method = 'POST';
        }

        response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(groupData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error details:', errorData);
            throw new Error(errorData.message || 'Ошибка сохранения группы');
        }

        hideGroupForm();
        clearCache(); // Очищаем кэш после изменений
        await loadGroups();

    } catch (error) {
        console.error('Error saving group:', error);
        alert(error.message || 'Не удалось сохранить группу');
    }
}