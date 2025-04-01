import { checkAuth, logout } from './auth.js';

const API_BASE_URL = 'http://localhost:8080';
let currentTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Загрузка задач
    await loadTasks();

    // Обработчики событий
    document.getElementById('new-task-btn').addEventListener('click', showTaskForm);
    document.getElementById('cancel-edit').addEventListener('click', hideTaskForm);
    document.getElementById('task-edit-form').addEventListener('submit', handleTaskSubmit);
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

async function loadTasks(filters = {}) {
    try {
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams();

        // Добавляем параметры фильтрации
        if (filters.status) params.append('status', filters.status);
        if (filters.priority_min) params.append('priority_min', filters.priority_min);
        if (filters.priority_max) params.append('priority_max', filters.priority_max);
        if (filters.due_date_from) params.append('due_date_from', filters.due_date_from);
        if (filters.due_date_to) params.append('due_date_to', filters.due_date_to);

        const response = await fetch(`${API_BASE_URL}/api/tasks?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки задач');
        }

        currentTasks = await response.json();
        renderTasks(currentTasks);

    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Не удалось загрузить задачи');
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
        case 'todo': return 'To Do';
        case 'in_progress': return 'In Progress';
        case 'done': return 'Done';
        default: return status;
    }
}

function showTaskForm(task = null) {
    const form = document.getElementById('task-form');
    const formTitle = document.getElementById('form-title');

    if (task) {
        formTitle.textContent = 'Редактировать задачу';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;

        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            // Форматируем дату для input[type=datetime-local]
            const localDateTime = dueDate.toISOString().slice(0, 16);
            document.getElementById('task-due-date').value = localDateTime;
        } else {
            document.getElementById('task-due-date').value = '';
        }
    } else {
        formTitle.textContent = 'Новая задача';
        document.getElementById('task-edit-form').reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-status').value = 'todo';
        document.getElementById('task-priority').value = 3;
    }

    form.style.display = 'block';
    window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
}

function hideTaskForm() {
    document.getElementById('task-form').style.display = 'none';
}

async function editTask(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
        showTaskForm(task);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTasks();
        } else {
            throw new Error('Ошибка удаления задачи');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Не удалось удалить задачу');
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('task-id').value;
    const isEdit = !(taskId === "undefined");

    // Формируем данные задачи
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim() || null,
        status: document.getElementById('task-status').value,
        priority: parseInt(document.getElementById('task-priority').value),
        due_date: document.getElementById('task-due-date').value
            ? new Date(document.getElementById('task-due-date').value).toISOString()
            : null
    };

    // Валидация
    if (!taskData.title) {
        alert('Название задачи обязательно!');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        let response;
        let endpoint;
        let method;

        if (isEdit) {
            // Редактирование существующей задачи
            endpoint = `${API_BASE_URL}/api/tasks/${taskId}`;
            method = 'PATCH';
        } else {
            // Создание новой задачи
            endpoint = `${API_BASE_URL}/api/tasks`;
            method = 'POST';
        }

        console.log('Sending request to:', endpoint); // Отладочная информация
        console.log('Request method:', method);
        console.log('Request data:', taskData);

        response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error details:', errorData);

            if (errorData.detail) {
                const errors = errorData.detail.map(err => {
                    const field = err.loc[err.loc.length - 1];
                    return `Ошибка в поле "${field}": ${err.msg}`;
                }).join('\n');
                alert(`Ошибка валидации:\n${errors}`);
            } else {
                throw new Error(errorData.message || 'Ошибка сохранения задачи');
            }
            return;
        }

        hideTaskForm();
        await loadTasks();

    } catch (error) {
        console.error('Error saving task:', error);
        alert(error.message || 'Не удалось сохранить задачу');
    }
}

async function applyFilters() {
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const dueDate = document.getElementById('filter-due-date').value;

    const filters = {};

    // Добавляем фильтры только если они есть
    if (status) filters.status = status;
    if (priority) {
        filters.priority_min = priority;
        filters.priority_max = priority;
    }
    if (dueDate === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filters.due_date_from = `${today}T00:00:00`;
        filters.due_date_to = `${today}T23:59:59`;
    } else if (dueDate === 'week') {
        const today = new Date();
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);

        filters.due_date_from = today.toISOString();
        filters.due_date_to = endOfWeek.toISOString();
    } else if (dueDate === 'overdue') {
        filters.due_date_to = new Date().toISOString();
        filters.status = 'todo,in_progress';
    }

    // Загружаем задачи с сервера с применением фильтров
    await loadTasks(filters);
}

async function resetFilters() {
    // Сбрасываем значения фильтров
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('filter-due-date').value = '';

    // Загружаем задачи без фильтров
    await loadTasks();
}