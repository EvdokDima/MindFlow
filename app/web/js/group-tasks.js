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

// Загрузка задач группы с кэшированием и пагинацией
async function loadGroupTasks(groupId, params = new URLSearchParams()) {
    const cacheKey = `${CACHE_KEYS.GROUP_TASKS}_${groupId}`;

    // Добавляем group_id в параметры
    params.append('group_id', groupId);

    // Добавляем пагинацию по умолчанию, если не указана
    if (!params.has('page')) params.append('page', '1');
    if (!params.has('per_page')) params.append('per_page', '20');

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/tasks?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки задач группы');
        }

        currentTasks = await response.json();
        renderTasks(currentTasks.items);
        renderPagination(currentTasks);

    } catch (error) {
        console.error('Error loading group tasks:', error);
        alert('Не удалось загрузить задачи группы');
    }
}

// Функция рендеринга пагинации
function renderPagination(data) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (data.total_pages <= 1) return;

    // Создаем кнопку "Назад"
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = data.page === 1;
    prevButton.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', data.page - 1);
        loadGroupTasks(currentGroup.id, params);
    });
    paginationContainer.appendChild(prevButton);

    // Создаем кнопки страниц
    for (let i = 1; i <= data.total_pages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `pagination-btn ${i === data.page ? 'active' : ''}`;
        pageButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', i);
            loadGroupTasks(currentGroup.id, params);
        });
        paginationContainer.appendChild(pageButton);
    }

    // Создаем кнопку "Вперед"
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = data.page === data.total_pages;
    nextButton.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', data.page + 1);
        loadGroupTasks(currentGroup.id, params);
    });
    paginationContainer.appendChild(nextButton);
}

// Функция рендеринга информации о группе
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

// Функция рендеринга секции с файлами
function renderFileSection(taskId, files = []) {
    const fileSection = document.createElement('div');
    fileSection.className = 'task-files-section';
    fileSection.innerHTML = `
        <div class="file-list" id="file-list-${taskId}">
            ${files.length === 0 ? 
              '<p>Нет прикрепленных файлов</p>' : 
              files.map(file => `
                <div class="file-item" data-s3_key="${file.s3_key}">
                    <i class="fas fa-file file-icon"></i>
                    <a href="${file.download_url}" 
                       target="_blank" 
                       download="${file.file_name}">
                        ${file.file_name}
                    </a>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-danger delete-file">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
              `).join('')}
        </div>
        <button class="upload-file-btn" data-task-id="${taskId}">
            <i class="fas fa-plus"></i> Добавить файл
        </button>
    `;

    return fileSection;
}

// Функция рендеринга задач
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

        // Добавляем секцию с файлами
        taskElement.appendChild(renderFileSection(task.id, task.files || []));

        taskList.appendChild(taskElement);
    });

    // Обработчики для кнопок загрузки файлов
    document.querySelectorAll('.upload-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.taskId;
            showUploadModal(taskId);
        });
    });

    // Обработчики для удаления файлов
    document.querySelectorAll('.delete-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileItem = e.currentTarget.closest('.file-item');
            const fileId = fileItem.dataset.s3_key;
            deleteFile(fileId);
        });
    });

    // Обработчики для кнопок редактирования и удаления задач
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => editTask(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTask(e.target.dataset.id));
    });
}

// Функции для работы с модальным окном загрузки файлов
let currentUploadTaskId = null;

function showUploadModal(taskId) {
    currentUploadTaskId = taskId;
    document.getElementById('file-upload-modal').style.display = 'flex';
}

function hideUploadModal() {
    document.getElementById('file-upload-modal').style.display = 'none';
    document.getElementById('file-to-upload').value = '';
}

// Обработчики модального окна
document.getElementById('cancel-upload').addEventListener('click', hideUploadModal);
document.getElementById('confirm-upload').addEventListener('click', async () => {
    const files = document.getElementById('file-to-upload').files;

    if (files.length === 0) {
        alert('Выберите файл для загрузки');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();

        const file = files[0];
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/task/${currentUploadTaskId}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            await loadGroupTasks(currentGroup.id);
            hideUploadModal();
        } else {
            throw new Error('Ошибка загрузки файла');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Не удалось загрузить файл');
    }
});

// Функция удаления файла
async function deleteFile(s3Key) {
    const confirmed = confirm("Вы уверены, что хотите удалить файл?");
    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    await fetch(`${API_BASE_URL}/api/task/files`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ s3_key: s3Key })
    });

    // Удаляем элемент из DOM
    document.querySelector(`[data-s3_key="${s3Key}"]`)?.remove();
}

// Функция получения текста статуса
function getStatusText(status) {
    switch(status) {
        case 'todo': return 'Сделать';
        case 'in_progress': return 'В работе';
        case 'done': return 'Готово';
        default: return status;
    }
}

// Функция загрузки групп для выпадающего списка
async function loadGroupsForSelect() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/groups`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки групп');

        return await response.json();
    } catch (error) {
        console.error('Error loading groups:', error);
        return [];
    }
}

// Функции для работы с задачами
async function showTaskForm(task = null) {
    const form = document.getElementById('task-form');
    const formTitle = document.getElementById('form-title');

    // Для задач в группе всегда устанавливаем текущую группу
    const groupSelect = document.getElementById('task-group');
    groupSelect.innerHTML = `<option value="${currentGroup.id}" selected>${currentGroup.name}</option>`;

    if (task) {
        formTitle.textContent = 'Редактировать задачу';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;

        if (task.due_date) {
            document.getElementById('task-due-date').value =
                new Date(task.due_date).toISOString().slice(0, 16);
        }
    } else {
        formTitle.textContent = 'Новая задача';
        document.getElementById('task-edit-form').reset();
        document.getElementById('task-id').value = '';
    }

    form.style.display = 'block';
}

function hideTaskForm() {
    document.getElementById('task-form').style.display = 'none';
}

async function editTask(taskId) {
    const task = currentTasks.items.find(t => t.id === taskId);
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
            await loadGroupTasks(currentGroup.id);
        } else {
            throw new Error('Ошибка удаления задачи');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Не удалось удалить задачу');
    }
}