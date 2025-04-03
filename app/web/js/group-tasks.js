import { checkAuth, logout } from './auth.js';

const API_BASE_URL = 'http://localhost:8080';
let currentGroup = null;
let currentTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

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

async function loadGroupInfo(groupId) {
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

    } catch (error) {
        console.error('Error loading group info:', error);
        alert('Не удалось загрузить информацию о группе');
        window.location.href = '/groups.html';
    }
}

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

async function loadGroupTasks(groupId) {
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

    } catch (error) {
        console.error('Error loading group tasks:', error);
        alert('Не удалось загрузить задачи группы');
    }
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