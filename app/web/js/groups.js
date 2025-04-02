import { checkAuth, logout } from './auth.js';

const API_BASE_URL = 'http://localhost:8080';
let currentGroups = [];

document.getElementById('new-group-btn').addEventListener('click', () => {
    // Явно передаем null, чтобы создать новую группу
    showGroupForm(null);
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Загрузка групп
    await loadGroups();

    document.getElementById('cancel-edit').addEventListener('click', hideGroupForm);
    document.getElementById('group-edit-form').addEventListener('submit', handleGroupSubmit);
});

async function loadGroups() {
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

    // Всегда сбрасываем форму перед показом
    document.getElementById('group-edit-form').reset();

    if (group) {
        // Режим редактирования существующей группы
        formTitle.textContent = 'Редактировать группу';
        groupIdInput.value = group.id;
        document.getElementById('group-name').value = group.name;
        document.getElementById('group-description').value = group.description || '';
    } else {
        // Режим создания новой группы
        formTitle.textContent = 'Новая группа';
        groupIdInput.value = ''; // Явно сбрасываем ID
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
    const isEdit = groupId === "undefined";

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
            method = 'PUT';
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
            throw new Error(errorData.message || 'Ошибка сохранения группы');
        }

        hideGroupForm();
        await loadGroups();

    } catch (error) {
        console.error('Error saving group:', error);
        alert(error.message || 'Не удалось сохранить группу');
    }
}